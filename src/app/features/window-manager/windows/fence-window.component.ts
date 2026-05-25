import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ZONE_NAMES } from '../../../../simulation/constants';
import type { ZoneId } from '../../../../simulation';
import { FenceStatusService } from '../../../core/services/fence-status.service';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { WindowActionControlsComponent } from '../../../shared/window-actions/window-action-controls.component';
import { UiSelectionService } from '../../../core/services/ui-selection.service';

@Component({
  selector: 'app-fence-window',
  standalone: true,
  imports: [OsIconComponent, RetroScrollDirective, WindowActionControlsComponent],
  template: `
    <div class="win-panel" data-app="fence" jpRetroScroll>
      <p>
        <app-os-icon name="fence" [size]="20" />
        PERIMETER BUS —
        <span [class]="gridStatusClass()">{{ fenceStatus.gridLabel() }}</span>
      </p>
      <p class="jp-info fence-window__hint">
        Click a row to target F0–F11. Use window actions below (not grid tactical shortcuts).
      </p>
      <table class="jp-table fence-window__table jp-table--selectable">
        <thead>
          <tr>
            <th>FENCE</th>
            <th>ZONE</th>
            <th>SEGM</th>
            <th>VOLT</th>
            <th>INT</th>
            <th>STRESS</th>
            <th>STATE</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr
              [attr.data-fence-id]="row.id"
              [attr.data-state]="row.state"
              class="jp-table__row"
              [class.jp-table__row--selected]="selection.fenceId() === row.id"
              role="button"
              tabindex="0"
              (click)="selectRow(row.id, row.zoneId)"
              (keydown.enter)="selectRow(row.id, row.zoneId)"
            >
              <td class="fence-window__id">F{{ row.id }}</td>
              <td [title]="row.zoneName">Z{{ row.zoneId }} {{ row.zoneCode }}</td>
              <td>{{ row.segment }}</td>
              <td [class]="voltClass(row.voltage)">{{ voltDisplay(row) }}</td>
              <td [class]="metricClass(row.integrity, row.id)">{{ intDisplay(row) }}</td>
              <td [class]="metricClass(row.stress, row.id + 20)">{{ stressDisplay(row) }}</td>
              <td [class]="stateClass(row.state)">{{ row.state }}</td>
            </tr>
          }
        </tbody>
      </table>
      <app-window-action-controls context="fence" />
    </div>
  `,
  styles: `
    .fence-window__hint {
      margin: 0 0 0.5rem;
      font-size: 0.72rem;
    }
    .fence-window__table .fence-window__id {
      font-weight: bold;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FenceWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly fenceStatus = inject(FenceStatusService);
  readonly telemetry = inject(UiTelemetryService);
  readonly selection = inject(UiSelectionService);

  private readonly zoneCodes = ['HN', 'HS', 'PE', 'PW', 'RS', 'VS'] as const;

  readonly rows = computed(() => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    return snap.fences.map((f) => ({
      ...f,
      zoneName: ZONE_NAMES[f.zoneId] ?? `Zone ${f.zoneId}`,
      zoneCode: this.zoneCodes[f.zoneId] ?? '??',
      segment: f.id % 2 === 0 ? 'A' : 'B',
    }));
  });

  selectRow(fenceId: number, zoneId: ZoneId): void {
    this.selection.selectFence(fenceId, zoneId);
  }

  gridStatusClass(): string {
    return this.fenceStatus.isCritical() ? 'jp-critical' : 'jp-nominal';
  }

  voltDisplay(row: { voltage: number; id: number }): string {
    return this.telemetry.formatMetric(row.voltage, row.id, '%');
  }

  intDisplay(row: { integrity: number; id: number }): string {
    return this.telemetry.formatMetric(row.integrity, row.id + 7, '%');
  }

  stressDisplay(row: { stress: number; id: number }): string {
    return this.telemetry.formatMetric(row.stress, row.id + 14, '%');
  }

  voltClass(voltage: number): string {
    if (voltage < 35) {
      return 'jp-critical';
    }
    if (voltage < 50) {
      return 'jp-danger';
    }
    if (voltage < 65) {
      return 'jp-warn';
    }
    return 'jp-nominal';
  }

  metricClass(value: number, salt: number): string {
    const displayed = this.telemetry.formatMetric(value, salt, '');
    if (displayed === '###') {
      return 'jp-corrupt';
    }
    if (value > 85) {
      return 'jp-critical';
    }
    if (value > 70) {
      return 'jp-danger';
    }
    if (value > 50) {
      return 'jp-warn';
    }
    return 'jp-nominal';
  }

  stateClass(state: string): string {
    switch (state) {
      case 'Breached':
        return 'jp-critical';
      case 'Sparking':
      case 'Intermittent':
        return 'jp-danger';
      case 'Unstable':
        return 'jp-warn';
      default:
        return 'jp-nominal';
    }
  }
}
