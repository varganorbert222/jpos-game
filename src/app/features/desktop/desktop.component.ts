import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
} from '@angular/core';
import { IncidentFeedPanelComponent } from '../panels/incident-feed-panel/incident-feed-panel.component';
import { CenterPanelComponent } from '../panels/center-panel/center-panel.component';
import { LogsActionsPanelComponent } from '../panels/logs-actions-panel/logs-actions-panel.component';
import { TutorialGuidePanelComponent } from '../panels/tutorial-guide-panel/tutorial-guide-panel.component';
import { DockComponent } from '../panels/dock/dock.component';
import { WindowManagerComponent } from '../window-manager/window-manager.component';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { SystemBootService } from '../../core/services/system-boot.service';
import { AuthService } from '../../core/services/auth.service';
import { formatElapsedClock } from '../../core/utils/run-score';
import { DesktopLayoutService } from '../../core/services/desktop-layout.service';
import { UiSelectionService } from '../../core/services/ui-selection.service';
import { HardRebootConfirmService } from '../../core/services/hard-reboot-confirm.service';
import { buildHardRebootPrompt } from '../../core/utils/hard-reboot-prompt';
import type { ZoneId } from '../../../simulation';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [
    IncidentFeedPanelComponent,
    CenterPanelComponent,
    LogsActionsPanelComponent,
    DockComponent,
    WindowManagerComponent,
    TutorialGuidePanelComponent,
  ],
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly hardReboot = inject(HardRebootConfirmService);
  readonly boot = inject(SystemBootService);
  readonly auth = inject(AuthService);
  readonly layout = inject(DesktopLayoutService);
  readonly selection = inject(UiSelectionService);
  readonly snapshot = this.sim.snapshot;

  readonly tick = computed(() => this.snapshot()?.tick ?? 0);
  readonly phase = computed(() => this.snapshot()?.escalationPhase ?? 1);

  readonly sessionHalted = computed(() => this.snapshot()?.gameOver ?? false);

  readonly bannerStatus = this.boot.sysBannerDisplay;

  readonly bannerCritical = computed(() => {
    const label = this.bannerStatus();
    return (
      label === 'SYSTEM COLLAPSE' ||
      label === 'GRID BLACKOUT' ||
      label === 'SHUTDOWN'
    );
  });

  /** Elapsed play time from sim start; frozen when gameOver stops ticks. */
  readonly sessionElapsed = computed(() =>
    formatElapsedClock(this.snapshot()?.elapsedRealtimeMs ?? 0),
  );

  readonly statusLeft = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'WX: ---';
    }
    if (s.difficultyMode === 'tutorial' && !s.tutorialScriptComplete) {
      if (s.tutorialAwaitingAction && s.tutorialObjective) {
        return `TRAINING [PAUSED]: ${s.tutorialObjective}`;
      }
      if (s.tutorialInterlude) {
        return `TRAINING [LIVE] — next briefing at tick ${s.tutorialInterludeUntilTick}`;
      }
    }
    return `WX: ${s.weather} | STAB: ${Math.round(s.stability)}%`;
  });

  readonly statusRight = computed(() => {
    const session = this.auth.session();
    const label = session?.displayLabel ?? '—';
    const s = this.snapshot();
    if (!s) {
      return `USER: ${label}`;
    }
    return `BREACHES: ${s.breachCount} | USER: ${label}`;
  });

  logout(): void {
    this.selection.clear();
    this.auth.logout();
    this.boot.returnToLogin();
  }

  requestHardReboot(): void {
    const snap = this.snapshot();
    if (!snap) {
      return;
    }
    this.hardReboot.request(buildHardRebootPrompt(snap));
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) {
      return;
    }
    const key = event.key;
    if (key >= '1' && key <= '6') {
      this.selection.selectZone((Number(key) - 1) as ZoneId);
      event.preventDefault();
      return;
    }
    if (key === 'Escape') {
      this.selection.clear();
      event.preventDefault();
      return;
    }
    if (event.shiftKey && key >= '0' && key <= '9') {
      const fenceId = Number(key);
      const zoneId = Math.floor(fenceId / 2) as ZoneId;
      this.selection.selectFence(fenceId, zoneId);
      event.preventDefault();
    }
  }

  readonly cpuUsage = computed(() => {
    const s = this.snapshot();
    if (!s) return 0;
    const base = (100 - s.stability) / 2 + Math.random() * 15;
    return Math.min(100, Math.max(15, Math.round(base + s.breachCount * 5)));
  });

  readonly ramUsage = computed(() => {
    const s = this.snapshot();
    if (!s) return 0;
    const base = 30 + s.escalationPhase * 8 + Math.random() * 20;
    return Math.min(100, Math.round(base));
  });

  readonly storageUsage = computed(() => {
    const s = this.snapshot();
    if (!s) return 0;
    const base =
      (s.tick % 1000) / 10 + (s.globalBlackout ? 50 : 0) + Math.random() * 10;
    return Math.min(100, Math.round(base));
  });
}

