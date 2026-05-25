import { Injectable, effect, inject, signal } from '@angular/core';
import type { GameEvent, SimulationSnapshot } from '../../../simulation';
import { AudioService } from './audio.service';
import { FenceStatusService } from './fence-status.service';
import { JpMailService } from './jp-mail.service';
import { SimulationBridgeService } from './simulation-bridge.service';
import { SystemBootService } from './system-boot.service';
import {
  incidentNeedsVerify,
  parseIncidentTargets,
  verifyChecklistSteps,
} from '../utils/incident-target.util';
import {
  FEED_SEED_MAX_ITEMS,
  badgeToFilterType,
} from '../constants/operations-feed.config';
import {
  OperationsFeedService,
  type FeedItemInput,
  type OperationsFeedItem,
} from './operations-feed.service';

export type { OperationsFeedItem as IncidentDisplayItem } from './operations-feed.service';

const MAX_DISPLAYED_ALERTS = 12;

type FeedbackKind =
  | 'alert'
  | 'event'
  | 'log'
  | 'status_bar'
  | 'fence_status'
  | 'mail';

interface FeedbackItem {
  kind: FeedbackKind;
  alertText?: string;
  event?: GameEvent;
  logText?: string;
  occurredAtMs: number;
}

/**
 * Detects simulation deltas and routes them to OperationsFeedService
 * (priority queue reveal, archive, filters handled there).
 */
@Injectable({ providedIn: 'root' })
export class GameFeedbackService {
  private readonly sim = inject(SimulationBridgeService);
  private readonly boot = inject(SystemBootService);
  private readonly fence = inject(FenceStatusService);
  private readonly mail = inject(JpMailService);
  private readonly audio = inject(AudioService);
  readonly feed = inject(OperationsFeedService);

  private readonly queue: FeedbackItem[] = [];
  private draining = false;

  private desktopSeeded = false;
  private seenEventIds = new Set<number>();
  private lastAlertCount = 0;
  private lastLogCount = 0;
  private lastBanner = '';
  private lastFenceLabel = '';
  private lastMailCount = 0;

  readonly displayedAlerts = signal<string[]>([]);
  readonly displayedEvents = signal<GameEvent[]>([]);

  /** @deprecated Use feed.filteredActive — kept for minimal churn */
  readonly displayedIncidents = this.feed.activeFeed;

  constructor() {
    effect(() => {
      const phase = this.boot.phase();
      const snap = this.sim.snapshot();

      if (phase !== 'complete' || !snap) {
        if (phase !== 'complete') {
          this.resetPresentation();
        }
        return;
      }

      if (!this.desktopSeeded) {
        this.seedDesktop(snap);
      }

      this.syncDisplayedEventsWithSimulation(snap);
      this.detectSnapshotDeltas(snap);
    });

    effect(() => {
      if (this.boot.phase() !== 'complete') {
        return;
      }
      const banner = this.boot.sysBannerDisplay();
      if (banner === this.lastBanner) {
        return;
      }
      if (!this.desktopSeeded) {
        this.lastBanner = banner;
        return;
      }
      this.lastBanner = banner;
      this.enqueue({ kind: 'status_bar', occurredAtMs: this.nowMs() });
    });

    effect(() => {
      if (this.boot.phase() !== 'complete') {
        return;
      }
      const label = this.fence.gridLabel();
      if (label === this.lastFenceLabel) {
        return;
      }
      if (!this.desktopSeeded) {
        this.lastFenceLabel = label;
        return;
      }
      this.lastFenceLabel = label;
      this.enqueue({ kind: 'fence_status', occurredAtMs: this.nowMs() });
    });

    effect(() => {
      if (this.boot.phase() !== 'complete') {
        return;
      }
      const count = this.mail.messages().length;
      if (count <= this.lastMailCount) {
        this.lastMailCount = count;
        return;
      }
      if (!this.desktopSeeded) {
        this.lastMailCount = count;
        return;
      }
      this.lastMailCount = count;
      this.enqueue({ kind: 'mail', occurredAtMs: this.nowMs() });
    });
  }

  connectSimAudio(): void {
    this.sim.onAudio((alerts) => {
      for (const id of alerts) {
        this.audio.playAlert(id);
      }
    });
  }

  markVerifyStep(key: string, stepId: string): void {
    this.feed.markVerifyStep(key, stepId);
  }

  private nowMs(): number {
    return this.sim.snapshot()?.elapsedRealtimeMs ?? 0;
  }

  private seedDesktop(snap: SimulationSnapshot): void {
    this.desktopSeeded = true;
    this.seenEventIds = new Set(snap.activeEvents.map((e) => e.id));
    this.lastAlertCount = snap.alertEntries.length;
    this.lastLogCount = snap.logEntries.length;
    this.lastBanner = this.boot.sysBannerDisplay();
    this.lastFenceLabel = this.fence.gridLabel();
    this.lastMailCount = this.mail.messages().length;
    this.displayedAlerts.set([...snap.alertEntries].slice(-MAX_DISPLAYED_ALERTS).reverse());
    this.displayedEvents.set([...snap.activeEvents]);

    const at = snap.elapsedRealtimeMs;
    const batch: FeedItemInput[] = [];
    for (const text of snap.logEntries.slice(-FEED_SEED_MAX_ITEMS)) {
      batch.push(this.logToItem(text, `seed-l-${batch.length}`, at));
    }
    for (const text of snap.alertEntries.slice(-MAX_DISPLAYED_ALERTS)) {
      batch.push(this.alertToItem(text, `seed-a-${batch.length}`, at));
    }
    for (const event of snap.activeEvents) {
      batch.push(this.eventToItem(event, at));
    }
    batch.sort((a, b) => a.occurredAtMs - b.occurredAtMs);
    this.feed.enqueueMany(batch.slice(-FEED_SEED_MAX_ITEMS));
  }

  private resetPresentation(): void {
    this.desktopSeeded = false;
    this.seenEventIds.clear();
    this.lastAlertCount = 0;
    this.lastLogCount = 0;
    this.lastBanner = '';
    this.lastFenceLabel = '';
    this.lastMailCount = 0;
    this.queue.length = 0;
    this.displayedAlerts.set([]);
    this.displayedEvents.set([]);
    this.feed.reset();
  }

  private detectSnapshotDeltas(snap: SimulationSnapshot): void {
    const at = snap.elapsedRealtimeMs;

    const alerts = snap.alertEntries;
    if (alerts.length > this.lastAlertCount) {
      for (const alertText of alerts.slice(this.lastAlertCount)) {
        this.enqueue({ kind: 'alert', alertText, occurredAtMs: at });
      }
      this.lastAlertCount = alerts.length;
    } else if (alerts.length < this.lastAlertCount) {
      this.lastAlertCount = alerts.length;
    }

    const logs = snap.logEntries;
    if (logs.length > this.lastLogCount) {
      for (const logText of logs.slice(this.lastLogCount)) {
        this.enqueue({ kind: 'log', logText, occurredAtMs: at });
      }
      this.lastLogCount = logs.length;
    } else if (logs.length < this.lastLogCount) {
      this.lastLogCount = logs.length;
    }

    for (const event of snap.activeEvents) {
      if (this.seenEventIds.has(event.id)) {
        continue;
      }
      this.seenEventIds.add(event.id);
      this.enqueue({ kind: 'event', event: { ...event }, occurredAtMs: at });
    }
  }

  private syncDisplayedEventsWithSimulation(snap: SimulationSnapshot): void {
    const activeIds = new Set(snap.activeEvents.map((e) => e.id));
    this.displayedEvents.update((list) => list.filter((e) => activeIds.has(e.id)));
    for (const id of [...this.seenEventIds]) {
      if (!activeIds.has(id)) {
        this.seenEventIds.delete(id);
        this.feed.removeEventItems(id);
      }
    }
  }

  private enqueue(item: FeedbackItem): void {
    this.queue.push(item);
    void this.drainQueue();
  }

  private async drainQueue(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.applyItem(item);
    }
    this.draining = false;
  }

  private applyItem(item: FeedbackItem): void {
    switch (item.kind) {
      case 'alert':
        if (item.alertText) {
          this.displayedAlerts.update((prev) =>
            [item.alertText!, ...prev].slice(0, MAX_DISPLAYED_ALERTS),
          );
          this.feed.enqueue(
            this.alertToItem(
              item.alertText,
              `a-${item.occurredAtMs}-${Math.random()}`,
              item.occurredAtMs,
            ),
          );
          this.audio.enqueue('alert');
        }
        break;
      case 'log':
        if (item.logText) {
          this.feed.enqueue(
            this.logToItem(
              item.logText,
              `l-${item.occurredAtMs}-${this.lastLogCount}`,
              item.occurredAtMs,
            ),
          );
        }
        break;
      case 'event':
        if (item.event) {
          this.displayedEvents.update((prev) => {
            if (prev.some((e) => e.id === item.event!.id)) {
              return prev;
            }
            return [...prev, item.event!];
          });
          this.feed.enqueue(this.eventToItem(item.event, item.occurredAtMs));
          this.audio.enqueue('event');
        }
        break;
      case 'status_bar':
        this.audio.enqueue('status_bar');
        break;
      case 'fence_status':
        this.audio.enqueue('fence_status');
        break;
      case 'mail':
        this.audio.enqueue('mail_arrived');
        break;
    }
  }

  private alertToItem(
    text: string,
    key: string,
    occurredAtMs: number,
  ): FeedItemInput {
    const targets = parseIncidentTargets(text);
    const needsVerify = incidentNeedsVerify(text);
    const badge = needsVerify ? 'GHOST' : 'ALERT';
    return this.buildItem({
      key,
      kind: 'alert',
      badge,
      message: text,
      severity: this.alertSeverity(text),
      occurredAtMs,
      zoneId: targets.zoneId,
      fenceId: targets.fenceId,
      needsVerify,
      verifySteps: needsVerify ? verifyChecklistSteps(text, targets) : [],
    });
  }

  private eventToItem(event: GameEvent, occurredAtMs: number): FeedItemInput {
    const targets = parseIncidentTargets(event.message);
    const needsVerify = incidentNeedsVerify(event.message);
    return this.buildItem({
      key: `ev-${event.id}`,
      kind: 'event',
      badge: event.severity.toUpperCase(),
      message: event.message,
      severity:
        event.severity === 'critical'
          ? 'critical'
          : event.severity === 'major'
            ? 'major'
            : 'minor',
      occurredAtMs,
      zoneId: targets.zoneId ?? event.targetZoneId,
      fenceId: targets.fenceId ?? event.targetFenceId,
      needsVerify,
      verifySteps: needsVerify ? verifyChecklistSteps(event.message, targets) : [],
    });
  }

  private logToItem(
    text: string,
    key: string,
    occurredAtMs: number,
  ): FeedItemInput {
    const targets = parseIncidentTargets(text);
    const needsVerify = incidentNeedsVerify(text);
    const badge = this.logBadge(text);
    return this.buildItem({
      key,
      kind: 'log',
      badge,
      message: text,
      severity: this.logSeverity(text, badge),
      occurredAtMs,
      zoneId: targets.zoneId,
      fenceId: targets.fenceId,
      needsVerify,
      verifySteps: needsVerify ? verifyChecklistSteps(text, targets) : [],
    });
  }

  private buildItem(
    partial: Omit<FeedItemInput, 'verifyDone'> & {
      verifySteps: { id: string; label: string }[];
    },
  ): FeedItemInput {
    return {
      ...partial,
      verifyDone: new Set(),
    };
  }

  private alertSeverity(text: string): OperationsFeedItem['severity'] {
    const u = text.toUpperCase();
    if (u.includes('CRITICAL') || u.includes('BREACH') || u.includes('BLACKOUT')) {
      return 'critical';
    }
    if (u.includes('WARN') || u.includes('GHOST')) {
      return 'major';
    }
    return 'info';
  }

  private logBadge(text: string): string {
    const u = text.toUpperCase();
    if (u.includes('[TRAINING]') || u.startsWith('TRAINING')) {
      return 'TRAINING';
    }
    if (u.includes('[EVENT]')) {
      return 'EVENT';
    }
    if (u.includes('[WARN]')) {
      return 'WARN';
    }
    if (u.includes('[CRITICAL]') || u.includes('BREACH')) {
      return 'CRITICAL';
    }
    if (u.startsWith('OK:') || u.startsWith('>')) {
      return 'CMD';
    }
    return 'LOG';
  }

  private logSeverity(
    text: string,
    badge: string,
  ): OperationsFeedItem['severity'] {
    if (badge === 'CRITICAL') {
      return 'critical';
    }
    if (badge === 'WARN' || badge === 'EVENT') {
      return 'major';
    }
    if (badge === 'TRAINING') {
      return 'info';
    }
    return this.alertSeverity(text);
  }
}
