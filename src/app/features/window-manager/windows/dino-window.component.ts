import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import type { TrendIndicator } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { GameActionControlsComponent } from '../../../shared/game-actions/game-action-controls.component';

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
  imports: [OsIconComponent, RetroScrollDirective, GameActionControlsComponent],
  template: `
    <div class="win-panel" jpRetroScroll>
      <p>
        <app-os-icon name="dinosaur" [size]="20" />
        BIO_MONITOR — derived telemetry only
      </p>
      <table class="jp-table">
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
            <tr>
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
      <app-game-action-controls context="dino" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DinoWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly telemetry = inject(UiTelemetryService);
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
