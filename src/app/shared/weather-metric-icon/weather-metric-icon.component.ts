import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type WeatherMetricKind =
  | 'temp'
  | 'feels'
  | 'humidity'
  | 'wind'
  | 'visibility'
  | 'uv'
  | 'aqi'
  | 'dew'
  | 'sky';

/** 16×16 Motif-style weather glyphs (no emoji). */
@Component({
  selector: 'app-weather-metric-icon',
  standalone: true,
  template: `
    <svg
      class="wx-icon"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      aria-hidden="true"
    >
      @switch (metric()) {
        @case ('temp') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="7" y="2" width="2" height="9" fill="#b0c0d0" />
          <rect x="5" y="10" width="6" height="4" fill="#cc2222" />
          <rect x="6" y="11" width="4" height="2" fill="#ff8888" />
        }
        @case ('feels') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="7" y="3" width="2" height="7" fill="#b0c0d0" />
          <rect x="5" y="9" width="6" height="3" fill="#cc8800" />
          <rect x="2" y="5" width="2" height="1" fill="#6ba1d8" />
          <rect x="12" y="6" width="2" height="1" fill="#6ba1d8" />
        }
        @case ('humidity') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="6" y="3" width="4" height="2" fill="#6ba1d8" />
          <rect x="5" y="5" width="6" height="2" fill="#6ba1d8" />
          <rect x="6" y="7" width="4" height="2" fill="#4a8ec8" />
          <rect x="7" y="9" width="2" height="4" fill="#2a6ea8" />
        }
        @case ('wind') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="2" y="6" width="8" height="2" fill="#b0c0d0" />
          <rect x="10" y="5" width="3" height="2" fill="#b0c0d0" />
          <rect x="10" y="8" width="4" height="2" fill="#8899aa" />
          <rect x="3" y="9" width="6" height="2" fill="#8899aa" />
        }
        @case ('visibility') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="3" y="5" width="10" height="6" fill="#b0c0d0" />
          <rect x="5" y="7" width="6" height="2" fill="#102030" />
          <rect x="7" y="7" width="2" height="2" fill="#5fde5f" />
        }
        @case ('uv') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="6" y="6" width="4" height="4" fill="#ffcc00" />
          <rect x="7" y="1" width="2" height="3" fill="#ffcc00" />
          <rect x="7" y="12" width="2" height="3" fill="#ffcc00" />
          <rect x="1" y="7" width="3" height="2" fill="#ffcc00" />
          <rect x="12" y="7" width="3" height="2" fill="#ffcc00" />
        }
        @case ('aqi') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="3" y="8" width="3" height="6" fill="#8090a0" />
          <rect x="7" y="6" width="3" height="8" fill="#b0c0d0" />
          <rect x="11" y="9" width="2" height="5" fill="#8090a0" />
          <rect x="2" y="4" width="12" height="2" fill="#cc8800" />
        }
        @case ('dew') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="2" y="10" width="12" height="2" fill="#4a6a8a" />
          <rect x="6" y="5" width="4" height="2" fill="#6ba1d8" />
          <rect x="5" y="7" width="6" height="2" fill="#4a8ec8" />
          <rect x="7" y="9" width="2" height="2" fill="#2a6ea8" />
        }
        @case ('sky') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="2" y="3" width="4" height="4" fill="#ffcc00" />
          <rect x="5" y="8" width="9" height="4" fill="#b0c0d0" />
          <rect x="7" y="6" width="5" height="2" fill="#8899aa" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
        flex-shrink: 0;
      }
      .wx-icon {
        image-rendering: pixelated;
        border: 1px solid #506070;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherMetricIconComponent {
  readonly metric = input.required<WeatherMetricKind>();
  readonly size = input(14);
}
