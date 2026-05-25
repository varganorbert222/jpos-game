import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { OperationsFeedService, type OperationsFeedItem } from '../../../core/services/operations-feed.service';
import type { FeedFilterType } from '../../../core/constants/operations-feed.config';
import type { ActionFeedPhase } from '../../../core/services/player-action.service';
import { IncidentNavigationService } from '../../../core/services/incident-navigation.service';
import { OperatorGuidanceService } from '../../../core/services/operator-guidance.service';
import { incidentRequiresDockTerminal } from '../../../core/constants/operator-workflow.config';
import { dockAppForIncident } from '../../../core/utils/incident-target.util';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { SectionLoaderComponent } from '../../../shared/boot/section-loader.component';
import { PlayerActionService } from '../../../core/services/player-action.service';

@Component({
  selector: 'app-incident-feed-panel',
  standalone: true,
  imports: [
    OsIconComponent,
    RetroScrollDirective,
    SectionLoaderComponent,
  ],
  templateUrl: './incident-feed-panel.component.html',
  styleUrl: './incident-feed-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentFeedPanelComponent {
  private readonly nav = inject(IncidentNavigationService);
  readonly feed = inject(OperationsFeedService);
  readonly guidance = inject(OperatorGuidanceService);
  private readonly playerActions = inject(PlayerActionService);

  readonly actionFeed = this.playerActions.actionFeed;
  readonly filterTypes = this.feed.filterTypes;
  readonly showFilterPanel = signal(false);

  readonly listItems = computed(() =>
    this.feed.feedTab() === 'active'
      ? this.feed.filteredActive()
      : this.feed.filteredArchived(),
  );

  readonly pendingHint = computed(() => {
    const n = this.feed.pendingCount();
    return n > 0 ? `${n} queued` : '';
  });

  recommendedApp(item: { message: string }): string {
    return dockAppForIncident(item.message).toUpperCase();
  }

  needsTerminal(item: { message: string }): boolean {
    return incidentRequiresDockTerminal(item.message);
  }

  rowToneClass(item: OperationsFeedItem): string {
    return `incident-row--tone-${item.filterType.toLowerCase()}`;
  }

  actionRowToneClass(phase: ActionFeedPhase): string {
    return `action-feed__row--${phase}`;
  }

  isInteractive(item: OperationsFeedItem): boolean {
    if (this.feed.feedTab() === 'archived') {
      return false;
    }
    if (item.kind === 'alert' || item.kind === 'event') {
      return true;
    }
    if (item.kind === 'log') {
      return (
        item.badge === 'WARN' ||
        item.badge === 'EVENT' ||
        item.badge === 'CRITICAL' ||
        item.needsVerify
      );
    }
    return false;
  }

  showOpenPath(item: OperationsFeedItem): boolean {
    return this.isInteractive(item);
  }

  setTab(tab: 'active' | 'archived'): void {
    this.feed.setTab(tab);
  }

  toggleFilters(): void {
    this.showFilterPanel.update((v) => !v);
  }

  onFilterClick(type: FeedFilterType): void {
    this.feed.toggleFilter(type);
  }

  clearFilters(): void {
    this.feed.clearFilters();
  }

  clearCurrentTab(): void {
    if (this.feed.feedTab() === 'active') {
      this.feed.clearActiveFeed();
    } else {
      this.feed.clearArchivedFeed();
    }
  }

  onIncidentClick(item: OperationsFeedItem): void {
    if (!this.isInteractive(item)) {
      return;
    }
    this.nav.openFromIncident(item);
  }

  onOpenClick(item: OperationsFeedItem, event: MouseEvent): void {
    event.stopPropagation();
    this.onIncidentClick(item);
  }
}
