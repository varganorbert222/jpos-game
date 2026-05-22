import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { JpStatusIconComponent, type JpStatusKind } from '../../../shared/jp-status-icon/jp-status-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
@Component({
  selector: 'app-security-window',
  standalone: true,
  imports: [JpStatusIconComponent, RetroScrollDirective],
  template: `
    <div class="win-panel" data-app="security" jpRetroScroll>
      <p>
        <app-jp-status-icon [kind]="blackout() ? 'critical' : 'online'" />
        CAMERAS:
        <span [class]="onlineClass()">{{ onlineDisplay() }}</span> / {{ totalCams() }}
      </p>
      <p [class]="blackout() ? 'jp-critical' : 'jp-nominal'">
        GRID: {{ blackout() ? 'BLACKOUT' : 'NOMINAL' }}
      </p>
      <table class="jp-table">
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>ZN</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          @for (c of cameras(); track c.id) {
            <tr [attr.data-camera-id]="c.id" [attr.data-state]="c.state">
              <td><app-jp-status-icon [kind]="camStatus(c.state)" /></td>
              <td>{{ c.id }}</td>
              <td>{{ c.zoneId }}</td>
              <td [class]="stateClass(c.state)">{{ c.state }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly telemetry = inject(UiTelemetryService);

  readonly cameras = computed(() => this.sim.snapshot()?.cameras ?? []);
  readonly totalCams = computed(() => this.cameras().length);
  readonly onlineCams = computed(
    () =>
      this.cameras().filter((c) => c.state === 'Online' || c.state === 'Delayed').length,
  );
  readonly onlineDisplay = computed(() =>
    this.telemetry.formatMetric(this.onlineCams(), 7, ''),
  );
  readonly blackout = computed(() => this.sim.snapshot()?.globalBlackout ?? false);

  onlineClass(): string {
    return this.blackout() ? 'jp-corrupt' : 'jp-nominal';
  }

  camStatus(state: string): JpStatusKind {
    switch (state) {
      case 'Online':
        return 'online';
      case 'Offline':
        return 'offline';
      case 'Corrupted':
        return 'corrupt';
      case 'Interference':
      case 'Delayed':
        return 'warn';
      default:
        return 'idle';
    }
  }

  stateClass(state: string): string {
    if (state === 'Corrupted') {
      return 'jp-corrupt';
    }
    if (state === 'Offline') {
      return 'jp-critical';
    }
    if (state === 'Interference' || state === 'Delayed') {
      return 'jp-warn';
    }
    return 'jp-nominal';
  }
}
