import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { AlertsPanelComponent } from '../panels/alerts-panel/alerts-panel.component';
import { CenterPanelComponent } from '../panels/center-panel/center-panel.component';
import { CliPanelComponent } from '../panels/cli-panel/cli-panel.component';
import { DockComponent } from '../panels/dock/dock.component';
import { WindowManagerComponent } from '../window-manager/window-manager.component';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { SystemBootService } from '../../core/services/system-boot.service';
import { AuthService } from '../../core/services/auth.service';
import { formatElapsedClock } from '../../core/utils/run-score';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [
    AlertsPanelComponent,
    CenterPanelComponent,
    CliPanelComponent,
    DockComponent,
    WindowManagerComponent,
  ],
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly boot = inject(SystemBootService);
  readonly auth = inject(AuthService);
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
    this.auth.logout();
    this.boot.returnToLogin();
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

