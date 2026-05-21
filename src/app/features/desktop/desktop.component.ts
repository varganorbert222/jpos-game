import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AlertsPanelComponent } from '../panels/alerts-panel/alerts-panel.component';
import { CenterPanelComponent } from '../panels/center-panel/center-panel.component';
import { CliPanelComponent } from '../panels/cli-panel/cli-panel.component';
import { DockComponent } from '../panels/dock/dock.component';
import { WindowManagerComponent } from '../window-manager/window-manager.component';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';

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
  readonly snapshot = this.sim.snapshot;

  readonly gameOver = computed(() => this.snapshot()?.gameOver ?? false);
  readonly tick = computed(() => this.snapshot()?.tick ?? 0);
  readonly phase = computed(() => this.snapshot()?.escalationPhase ?? 1);

  readonly bannerStatus = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'INITIALIZING...';
    }
    if (s.gameOver) {
      return 'SYSTEM COLLAPSE';
    }
    if (s.globalBlackout) {
      return 'BLACKOUT';
    }
    return 'READY...';
  });

  readonly statusLeft = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'WX: ---';
    }
    return `WX: ${s.weather} | STAB: ${Math.round(s.stability)}%`;
  });

  readonly statusRight = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'USER: HAMMOND';
    }
    const breaches = s.breachCount;
    return `BREACHES: ${breaches} | USER: OPS-1`;
  });
}
