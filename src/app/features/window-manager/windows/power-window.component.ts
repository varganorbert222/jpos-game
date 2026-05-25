import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { WindowActionControlsComponent } from '../../../shared/window-actions/window-action-controls.component';
import { UiSelectionService } from '../../../core/services/ui-selection.service';

@Component({
  selector: 'app-power-window',
  standalone: true,
  imports: [OsIconComponent, RetroScrollDirective, WindowActionControlsComponent],
  template: `
    <div class="win-panel" [class]="telemetry.jitterClass()" jpRetroScroll>
      <p>
        <app-os-icon name="power" [size]="20" />
        ALLOC:
        <span class="alloc-metric {{ allocClass(alloc().fences) }}"
          >F {{ alloc().fences }}%</span
        >
        |
        <span class="alloc-metric {{ allocClass(alloc().cameras) }}"
          >C {{ alloc().cameras }}%</span
        >
        |
        <span class="alloc-metric {{ allocClass(alloc().logistics) }}"
          >L {{ alloc().logistics }}%</span
        >
      </p>
      <p class="jp-info power-window__hint">
        Click a generator row to target GEN actions.
      </p>
      <table class="jp-table jp-table--selectable">
        <thead>
          <tr>
            <th>GEN</th>
            <th>STATE</th>
            <th>FUEL</th>
            <th>LOAD</th>
            <th>TEMP</th>
          </tr>
        </thead>
        <tbody>
          @for (g of generators(); track g.id) {
            <tr
              class="jp-table__row"
              [class.jp-table__row--selected]="selection.generatorId() === g.id"
              role="button"
              tabindex="0"
              (click)="selectGen(g.id)"
              (keydown.enter)="selectGen(g.id)"
            >
              <td>{{ g.id }}</td>
              <td [class]="g.online ? 'jp-nominal' : 'jp-critical'">
                {{ g.online ? 'ON' : 'OFF' }}
              </td>
              <td [class]="metricClass(g.fuel, g.id)">{{ fuelDisplay(g) }}</td>
              <td [class]="metricClass(g.load, g.id + 10)">
                {{ loadDisplay(g) }}
              </td>
              <td [class]="tempClass(g.temperature)">{{ tempDisplay(g) }}</td>
            </tr>
          }
        </tbody>
      </table>
      <app-window-action-controls context="power" />
    </div>
  `,
  styles: `
    .power-window__hint {
      margin: 0 0 0.5rem;
      font-size: 0.72rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly telemetry = inject(UiTelemetryService);
  readonly selection = inject(UiSelectionService);

  readonly generators = computed(() => this.sim.snapshot()?.generators ?? []);
  readonly alloc = computed(
    () =>
      this.sim.snapshot()?.powerAllocation ?? {
        fences: 0,
        cameras: 0,
        logistics: 0,
        sensors: 0,
      },
  );

  selectGen(id: number): void {
    this.selection.selectGenerator(id, 0);
  }

  fuelDisplay(g: { fuel: number; id: number }): string {
    return this.telemetry.formatMetric(g.fuel, g.id, '%');
  }

  loadDisplay(g: { load: number; id: number }): string {
    return this.telemetry.formatMetric(g.load, g.id + 3, '%');
  }

  tempDisplay(g: { temperature: number; id: number }): string {
    return this.telemetry.formatMetric(g.temperature, g.id + 6, '');
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

  allocClass(value: number): string {
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

  tempClass(temp: number): string {
    if (temp > 85) {
      return 'jp-critical';
    }
    if (temp > 70) {
      return 'jp-danger';
    }
    return 'jp-nominal';
  }
}
