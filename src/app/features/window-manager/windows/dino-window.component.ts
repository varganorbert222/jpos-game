import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import type { TrendIndicator } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { WindowActionControlsComponent } from '../../../shared/window-actions/window-action-controls.component';
import { UiSelectionService } from '../../../core/services/ui-selection.service';
import type { ZoneId } from '../../../../simulation';

interface DinoRow {
  id: number;
  species: string;
  zoneId: number;
  threat: string;
  trend: TrendIndicator;
  activity: string;
}

@Component({
  selector: 'app-dino-window',
  standalone: true,
  imports: [OsIconComponent, RetroScrollDirective, WindowActionControlsComponent],
  template: `
    <div class="win-panel" jpRetroScroll>
      <p>
        <app-os-icon name="dinosaur" [size]="20" />
        BIO_MONITOR — derived telemetry only
      </p>
      <p class="jp-info dino-window__hint">
        Click a specimen row to target DINO actions.
      </p>
      <table class="jp-table jp-table--selectable">
        <thead>
          <tr>
            <th>ID</th>
            <th>SPECIES</th>
            <th>ZN</th>
            <th>THREAT</th>
            <th>TRD</th>
            <th>ACT</th>
          </tr>
        </thead>
        <tbody>
          @for (d of rows(); track d.id) {
            <tr
              class="jp-table__row"
              [class.jp-table__row--selected]="selection.dinoId() === d.id"
              role="button"
              tabindex="0"
              (click)="selectDino(d.id, d.zoneId)"
              (keydown.enter)="selectDino(d.id, d.zoneId)"
            >
              <td>{{ d.id }}</td>
              <td>{{ d.species }}</td>
              <td>{{ d.zoneId }}</td>
              <td [class]="threatClass(d.threat)">{{ d.threat }}</td>
              <td class="jp-info">{{ d.trend }}</td>
              <td>{{ d.activity }}</td>
            </tr>
          }
        </tbody>
      </table>
      <app-window-action-controls context="dino" />
    </div>
  `,
  styles: `
    .dino-window__hint {
      margin: 0 0 0.5rem;
      font-size: 0.72rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DinoWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly telemetry = inject(UiTelemetryService);
  readonly selection = inject(UiSelectionService);
  private prevStress = new Map<number, number>();

  readonly rows = computed((): DinoRow[] => {
    const dinos = this.sim.snapshot()?.dinosaurs ?? [];
    return dinos.map((d) => {
      const prev = this.prevStress.get(d.id) ?? d.stress;
      const trend = this.telemetry.trendFromDelta(d.stress - prev);
      this.prevStress.set(d.id, d.stress);
      return {
        id: d.id,
        species: d.species,
        zoneId: d.zoneId,
        threat: this.telemetry.healthFromStress(d.stress),
        trend,
        activity: this.telemetry.activityBand(d.visibleAggression, d.stress),
      };
    });
  });

  selectDino(dinoId: number, zoneId: number): void {
    this.selection.selectDino(dinoId, zoneId as ZoneId);
  }

  threatClass(threat: string): string {
    if (threat === 'Critical') {
      return 'jp-critical';
    }
    if (threat === 'Unstable') {
      return 'jp-danger';
    }
    return 'jp-nominal';
  }
}
