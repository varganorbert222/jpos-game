import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { JpStatusIconComponent, type JpStatusKind } from '../../../shared/jp-status-icon/jp-status-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { WindowActionControlsComponent } from '../../../shared/window-actions/window-action-controls.component';
import { UiSelectionService } from '../../../core/services/ui-selection.service';
import type { ZoneId } from '../../../../simulation';

@Component({
  selector: 'app-security-window',
  standalone: true,
  imports: [JpStatusIconComponent, RetroScrollDirective, WindowActionControlsComponent],
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
      <p class="jp-info security-window__hint">
        Click a camera row to target CAM ID for window actions.
      </p>
      <table class="jp-table jp-table--selectable">
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
            <tr
              [attr.data-camera-id]="c.id"
              [attr.data-state]="c.state"
              class="jp-table__row"
              [class.jp-table__row--selected]="selection.cameraId() === c.id"
              role="button"
              tabindex="0"
              (click)="selectCamera(c.id, c.zoneId)"
              (keydown.enter)="selectCamera(c.id, c.zoneId)"
            >
              <td><app-jp-status-icon [kind]="camStatus(c.state)" /></td>
              <td>{{ c.id }}</td>
              <td>{{ c.zoneId }}</td>
              <td [class]="stateClass(c.state)">{{ c.state }}</td>
            </tr>
          }
        </tbody>
      </table>
      <app-window-action-controls context="security" />
    </div>
  `,
  styles: `
    .security-window__hint {
      margin: 0 0 0.5rem;
      font-size: 0.72rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly telemetry = inject(UiTelemetryService);
  readonly selection = inject(UiSelectionService);

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

  selectCamera(cameraId: number, zoneId: number): void {
    this.selection.selectCamera(cameraId, zoneId as ZoneId);
  }

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
