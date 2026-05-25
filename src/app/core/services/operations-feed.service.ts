import { Injectable, computed, signal } from '@angular/core';
import type { ZoneId } from '../../../simulation';
import {
  FEED_FILTER_TYPES,
  FEED_ACTIVE_LIMIT,
  FEED_ARCHIVE_LIMIT,
  FEED_REVEAL_GAP_MS,
  badgeToFilterType,
  feedItemPriority,
  type FeedFilterType,
} from '../constants/operations-feed.config';
import { formatElapsedClock } from '../utils/run-score';

export interface OperationsFeedItem {
  key: string;
  kind: 'alert' | 'event' | 'log';
  badge: string;
  filterType: FeedFilterType;
  message: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  occurredAtMs: number;
  timeLabel: string;
  priority: number;
  zoneId?: ZoneId;
  fenceId?: number;
  needsVerify: boolean;
  verifySteps: { id: string; label: string }[];
  verifyDone: Set<string>;
}

export type FeedPanelTab = 'active' | 'archived';

export type FeedItemInput = Omit<
  OperationsFeedItem,
  'timeLabel' | 'priority' | 'filterType'
> & {
  filterType?: FeedFilterType;
  priority?: number;
};

@Injectable({ providedIn: 'root' })
export class OperationsFeedService {
  readonly activeFeed = signal<OperationsFeedItem[]>([]);
  readonly archivedFeed = signal<OperationsFeedItem[]>([]);
  readonly pendingCount = signal(0);
  readonly feedTab = signal<FeedPanelTab>('active');
  /** Empty set = show all types. */
  readonly selectedFilters = signal<ReadonlySet<FeedFilterType>>(new Set());

  private readonly pendingReveal: OperationsFeedItem[] = [];
  private revealing = false;

  readonly filterTypes = FEED_FILTER_TYPES;

  readonly showAllTypes = computed(() => this.selectedFilters().size === 0);

  readonly filteredActive = computed(() =>
    this.applyFilters(this.activeFeed()),
  );

  readonly filteredArchived = computed(() =>
    this.applyFilters(this.archivedFeed()),
  );

  readonly isEmptyView = computed(() => {
    if (this.feedTab() === 'active') {
      return (
        this.filteredActive().length === 0 &&
        this.pendingCount() === 0
      );
    }
    return this.filteredArchived().length === 0;
  });

  reset(): void {
    this.pendingReveal.length = 0;
    this.pendingCount.set(0);
    this.revealing = false;
    this.activeFeed.set([]);
    this.archivedFeed.set([]);
    this.feedTab.set('active');
    this.selectedFilters.set(new Set());
  }

  setTab(tab: FeedPanelTab): void {
    this.feedTab.set(tab);
  }

  toggleFilter(type: FeedFilterType): void {
    const current = new Set(this.selectedFilters());
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    this.selectedFilters.set(current);
  }

  isFilterSelected(type: FeedFilterType): boolean {
    const sel = this.selectedFilters();
    return sel.size === 0 || sel.has(type);
  }

  selectOnlyFilter(type: FeedFilterType): void {
    this.selectedFilters.set(new Set([type]));
  }

  clearFilters(): void {
    this.selectedFilters.set(new Set());
  }

  clearActiveFeed(): void {
    this.pendingReveal.length = 0;
    this.pendingCount.set(0);
    this.activeFeed.set([]);
  }

  clearArchivedFeed(): void {
    this.archivedFeed.set([]);
  }

  clearAllFeeds(): void {
    this.clearActiveFeed();
    this.clearArchivedFeed();
  }

  enqueue(item: FeedItemInput): void {
    this.pendingReveal.push(this.enrich(item));
    this.sortPending();
    this.pendingCount.set(this.pendingReveal.length);
    void this.drainReveal();
  }

  private enrich(item: FeedItemInput): OperationsFeedItem {
    const filterType =
      item.filterType ?? badgeToFilterType(item.badge, item.kind);
    return {
      ...item,
      filterType,
      priority:
        item.priority ?? feedItemPriority(item.severity, filterType),
      timeLabel: formatElapsedClock(item.occurredAtMs),
    };
  }

  /** Batch enqueue (e.g. desktop seed) — one reveal drain. */
  enqueueMany(items: FeedItemInput[]): void {
    for (const item of items) {
      this.pendingReveal.push(this.enrich(item));
    }
    this.sortPending();
    this.pendingCount.set(this.pendingReveal.length);
    void this.drainReveal();
  }

  markVerifyStep(key: string, stepId: string): void {
    const patch = (list: OperationsFeedItem[]) =>
      list.map((row) => {
        if (row.key !== key) {
          return row;
        }
        const done = new Set(row.verifyDone);
        done.add(stepId);
        return { ...row, verifyDone: done };
      });
    this.activeFeed.update(patch);
    this.archivedFeed.update(patch);
  }

  removeEventItems(eventId: number): void {
    const key = `ev-${eventId}`;
    this.activeFeed.update((list) => list.filter((i) => i.key !== key));
    this.archivedFeed.update((list) => list.filter((i) => i.key !== key));
  }

  private applyFilters(list: OperationsFeedItem[]): OperationsFeedItem[] {
    const visible = list.filter(
      (i) => i.badge !== 'CMD' && !i.message.includes('[CMD]'),
    );
    const sel = this.selectedFilters();
    if (sel.size === 0) {
      return visible;
    }
    return visible.filter((i) => sel.has(i.filterType));
  }

  private sortPending(): void {
    this.pendingReveal.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.occurredAtMs - b.occurredAtMs;
    });
  }

  private async drainReveal(): Promise<void> {
    if (this.revealing) {
      return;
    }
    this.revealing = true;
    while (this.pendingReveal.length > 0) {
      const item = this.pendingReveal.shift()!;
      this.pendingCount.set(this.pendingReveal.length);
      this.appendToActive(item);
      if (this.pendingReveal.length > 0) {
        await this.delay(FEED_REVEAL_GAP_MS);
      }
    }
    this.revealing = false;
    this.pendingCount.set(0);
  }

  private appendToActive(item: OperationsFeedItem): void {
    this.activeFeed.update((prev) => {
      if (prev.some((p) => p.key === item.key)) {
        return prev;
      }
      const next = [item, ...prev];
      if (next.length <= FEED_ACTIVE_LIMIT) {
        return next;
      }
      const keep = next.slice(0, FEED_ACTIVE_LIMIT);
      const overflow = next.slice(FEED_ACTIVE_LIMIT);
      this.archiveItems(overflow);
      return keep;
    });
  }

  private archiveItems(items: OperationsFeedItem[]): void {
    if (items.length === 0) {
      return;
    }
    this.archivedFeed.update((prev) => {
      const merged = [...items.reverse(), ...prev];
      return merged.slice(0, FEED_ARCHIVE_LIMIT);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
