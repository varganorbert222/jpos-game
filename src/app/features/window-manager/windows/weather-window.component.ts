import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../../../core/services/weather.service';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';

@Component({
  selector: 'app-weather-window',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="win-panel" [class]="telemetry.jitterClass()">
      <!-- Current Conditions -->
      <div class="weather-section">
        <h3 class="weather-title">CURRENT CONDITIONS</h3>

        <div class="weather-item">
          <span class="label">🌡️ Temperature:</span>
          <span class="value">{{ weather.temp | number: '1.0-0' }}°C</span>
        </div>

        <div class="weather-item">
          <span class="label">🌡️ Feels Like:</span>
          <span class="value">{{ weather.temp - 3 | number: '1.0-0' }}°C</span>
        </div>

        <div class="weather-item">
          <span class="label">💧 Humidity:</span>
          <span class="value">{{ weather.humidity | number: '1.0-0' }}%</span>
        </div>

        <div class="weather-item">
          <span class="label">💨 Wind:</span>
          <span class="value"
            >{{ weather.windSpeed | number: '1.0-0' }} km/h ({{
              weather.windDir
            }}, {{ weather.windDeg }}°)</span
          >
        </div>

        <div class="weather-item">
          <span class="label">👁️ Visibility:</span>
          <span class="value"
            >{{ weather.visibility | number: '1.1-1' }} km</span
          >
        </div>

        <div class="weather-item">
          <span class="label">☀️ UV Index:</span>
          <span class="value">{{ weather.uvIndex }}</span>
        </div>

        <div class="weather-item">
          <span class="label">🌫️ Air Quality (AQI):</span>
          <span class="value" [class]="'aqi-' + getAqiLevel(weather.aqi)">{{
            weather.aqi | number: '1.0-0'
          }}</span>
        </div>

        <div class="weather-item">
          <span class="label">💧 Dew Point:</span>
          <span class="value">{{ weather.dewPoint | number: '1.0-0' }}°C</span>
        </div>

        <div class="weather-item">
          <span class="label">⛅ Condition:</span>
          <span class="value">{{ weather.condition }}</span>
        </div>
      </div>

      <!-- 7-Day Forecast -->
      <div class="weather-section">
        <h3 class="weather-title">7-DAY FORECAST</h3>
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
            @for (day of forecast; track $index) {
              <tr>
                <td>{{ day.date | date: 'EEE' }}</td>
                <td>{{ day.high }}°</td>
                <td>{{ day.low }}°</td>
                <td>{{ day.condition }}</td>
                <td [class]="'aqi-' + getAqiLevel(day.aqi)">{{ day.aqi }}</td>
                <td>{{ day.uvIndex }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .win-panel {
        padding: 12px;
        overflow-y: auto;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .weather-section {
        flex-shrink: 0;
      }

      .weather-title {
        margin: 0 0 8px 0;
        padding: 4px 0;
        border-bottom: 1px solid var(--jp-irix-bevel-light);
        font-size: var(--jp-font-sm);
        color: var(--jp-term-cursor);
      }

      .weather-item {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 8px;
        padding: 4px 0;
        font-size: var(--jp-font-xs, 0.75rem);
        line-height: 1.4;
      }

      .label {
        color: var(--jp-irix-text);
        font-weight: 700;
      }

      .value {
        color: var(--jp-term-cursor);
        font-family: var(--jp-font-mono);
      }

      .forecast-table {
        font-size: var(--jp-font-xs, 0.75rem);
        width: 100%;
      }

      .forecast-table td,
      .forecast-table th {
        padding: 3px 4px;
        text-align: center;
      }

      .forecast-table th {
        border-bottom: 1px solid var(--jp-irix-bevel-dark);
      }

      /* AQI Color Coding */
      .aqi-good {
        color: #22c55e;
      }

      .aqi-fair {
        color: #eab308;
      }

      .aqi-moderate {
        color: #f97316;
      }

      .aqi-poor {
        color: #ef4444;
      }

      .aqi-veryPoor {
        color: #991b1b;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherWindowComponent {
  readonly weatherService = inject(WeatherService);
  readonly telemetry = inject(UiTelemetryService);

  readonly weather = this.weatherService.weather();
  readonly forecast = this.weatherService.forecast();

  getAqiLevel(aqi: number): string {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'fair';
    if (aqi <= 150) return 'moderate';
    if (aqi <= 200) return 'poor';
    return 'veryPoor';
  }
}
