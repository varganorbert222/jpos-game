import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { JpStatusIconComponent, type JpStatusKind } from '../../../shared/jp-status-icon/jp-status-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [OsIconComponent, JpStatusIconComponent, RetroScrollDirective],
  templateUrl: './alerts-panel.component.html',
  styleUrl: './alerts-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly telemetry = inject(UiTelemetryService);

  readonly alerts = computed(() => {
    const s = this.sim.snapshot();
    return s?.alertEntries.slice(-12).reverse() ?? [];
  });
  readonly events = computed(() => this.sim.snapshot()?.activeEvents ?? []);

  alertIcon(msg: string): JpStatusKind {
    const u = msg.toUpperCase();
    if (u.includes('CRITICAL') || u.includes('BREACH')) {
      return 'critical';
    }
    if (u.includes('WARN') || u.includes('GHOST')) {
      return 'warn';
    }
    if (u.includes('BLACKOUT')) {
      return 'offline';
    }
    return 'online';
  }

  severityClass(msg: string): string {
    const u = msg.toUpperCase();
    if (u.includes('CRITICAL') || u.includes('BREACH') || u.includes('BLACKOUT')) {
      return 'jp-critical';
    }
    if (u.includes('WARN') || u.includes('GHOST')) {
      return 'jp-warn';
    }
    if (u.includes('HIGH') || u.includes('STRESS')) {
      return 'jp-danger';
    }
    return 'jp-nominal';
  }
}
