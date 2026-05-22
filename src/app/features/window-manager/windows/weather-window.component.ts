import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { WeatherService } from '../../../core/services/weather.service';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import {
  WeatherMetricIconComponent,
  type WeatherMetricKind,
} from '../../../shared/weather-metric-icon/weather-metric-icon.component';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';

interface WeatherMetricCell {
  metric: WeatherMetricKind;
  label: string;
  value: string;
  valueClass?: string;
}

@Component({
  selector: 'app-weather-window',
  standalone: true,
  imports: [DatePipe, WeatherMetricIconComponent, RetroScrollDirective],
  template: `
    <div class="win-panel" [class]="telemetry.jitterClass()" jpRetroScroll>
      <section class="weather-section">
        <h3 class="weather-title jp-panel__title--sub">CURRENT CONDITIONS</h3>

        <table class="jp-table weather-now">
          <tbody>
            @for (row of currentMetricRows(); track $index) {
              <tr>
                @for (cell of row; track cell.label) {
                  <td>
                    <div class="weather-metric">
                      <app-weather-metric-icon [metric]="cell.metric" [size]="14" />
                      <span class="weather-metric__lbl">{{ cell.label }}</span>
                      <span
                        class="weather-metric__val"
                        [class]="cell.valueClass ?? ''"
                        >{{ cell.value }}</span
                      >
                    </div>
                  </td>
                }
              </tr>
            }
            <tr class="weather-now__sky">
              <td colspan="4">
                <div class="weather-metric weather-metric--wide">
                  <app-weather-metric-icon metric="sky" [size]="14" />
                  <span class="weather-metric__lbl">SKY</span>
                  <span class="weather-metric__val">{{ weather().condition }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="weather-section">
        <h3 class="weather-title jp-panel__title--sub">7-DAY FORECAST</h3>
        <table class="jp-table forecast-table">
          <thead>
            <tr>
              <th>DAY</th>
              <th>HIGH</th>
              <th>LOW</th>
              <th>CONDITION</th>
              <th>AQI</th>
              <th>UV</th>
            </tr>
          </thead>
          <tbody>
            @for (day of forecast(); track $index) {
              <tr>
                <td>{{ day.date | date: 'EEE' }}</td>
                <td>{{ day.high }}°</td>
                <td>{{ day.low }}°</td>
                <td>{{ day.condition }}</td>
                <td [class]="aqiClass(day.aqi)">{{ day.aqi }}</td>
                <td>{{ day.uvIndex }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [
    `
      .win-panel {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .weather-section {
        flex-shrink: 0;
      }

      .weather-title {
        margin: 0 0 6px;
        padding: 0;
        border: none;
        font-size: var(--jp-font-sm);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--jp-irix-text);
        background: transparent;
      }

      .weather-now td {
        padding: 4px 6px;
        vertical-align: middle;
      }

      .weather-now__sky td {
        border-top: 2px solid var(--jp-irix-bevel-dark);
      }

      .weather-metric {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        font-size: var(--jp-font-sm);
        line-height: var(--jp-line);
      }

      .weather-metric--wide .weather-metric__val {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .weather-metric__lbl {
        flex: 0 0 auto;
        color: var(--jp-irix-text-dim);
        font-weight: 700;
        min-width: 2.75rem;
      }

      .weather-metric__val {
        flex: 1 1 auto;
        color: var(--jp-term-nominal);
        font-weight: 700;
        text-align: right;
      }

      .forecast-table {
        font-size: var(--jp-font-sm);
        width: 100%;
      }

      .forecast-table td,
      .forecast-table th {
        padding: 3px 4px;
        text-align: center;
      }

      .aqi-good {
        color: var(--jp-term-nominal);
      }

      .aqi-fair {
        color: var(--jp-term-info);
      }

      .aqi-moderate {
        color: var(--jp-term-warn);
      }

      .aqi-poor {
        color: var(--jp-term-danger);
      }

      .aqi-veryPoor {
        color: var(--jp-term-critical);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherWindowComponent {
  private readonly weatherService = inject(WeatherService);
  readonly telemetry = inject(UiTelemetryService);

  readonly weather = this.weatherService.weather;
  readonly forecast = this.weatherService.forecast;

  readonly currentMetricRows = computed((): WeatherMetricCell[][] => {
    const w = this.weather();
    const feels = Math.round(w.temp - 3);
    return [
      [
        { metric: 'temp', label: 'TEMP', value: `${Math.round(w.temp)}°C` },
        { metric: 'feels', label: 'FEELS', value: `${feels}°C` },
        { metric: 'humidity', label: 'HUM', value: `${Math.round(w.humidity)}%` },
        { metric: 'dew', label: 'DEW', value: `${Math.round(w.dewPoint)}°C` },
      ],
      [
        {
          metric: 'wind',
          label: 'WIND',
          value: `${Math.round(w.windSpeed)} km/h ${w.windDir}`,
        },
        {
          metric: 'visibility',
          label: 'VIS',
          value: `${w.visibility.toFixed(1)} km`,
        },
        { metric: 'uv', label: 'UV', value: `${w.uvIndex}` },
        {
          metric: 'aqi',
          label: 'AQI',
          value: `${Math.round(w.aqi)}`,
          valueClass: this.aqiClass(w.aqi),
        },
      ],
    ];
  });

  aqiClass(aqi: number): string {
    if (aqi <= 50) {
      return 'aqi-good';
    }
    if (aqi <= 100) {
      return 'aqi-fair';
    }
    if (aqi <= 150) {
      return 'aqi-moderate';
    }
    if (aqi <= 200) {
      return 'aqi-poor';
    }
    return 'aqi-veryPoor';
  }
}
