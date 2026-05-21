import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type OsIconName =
  | 'security'
  | 'power'
  | 'dino'
  | 'terminal'
  | 'warning'
  | 'sensor'
  | 'module'
  | 'dinosaur';

/** Chunky 16×16 pixel icons — scaled up for visibility */
@Component({
  selector: 'app-os-icon',
  standalone: true,
  template: `
    <svg
      class="os-icon"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('security') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="2" y="2" width="12" height="12" fill="none" stroke="#e8f0f8" stroke-width="2" />
          <rect x="6" y="6" width="4" height="4" fill="#5fde5f" />
        }
        @case ('power') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="3" y="2" width="10" height="12" fill="#b0c0d0" stroke="#102030" stroke-width="1" />
          <rect x="7" y="3" width="2" height="10" fill="#102030" />
          <rect x="5" y="6" width="6" height="2" fill="#cc8800" />
          <rect x="5" y="9" width="6" height="2" fill="#cc8800" />
        }
        @case ('dino') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="2" y="10" width="3" height="4" fill="#5fde5f" />
          <rect x="5" y="7" width="3" height="7" fill="#5fde5f" />
          <rect x="8" y="4" width="3" height="10" fill="#5fde5f" />
          <rect x="11" y="8" width="3" height="6" fill="#5fde5f" />
          <rect x="6" y="3" width="4" height="2" fill="#cc2222" />
        }
        @case ('terminal') {
          <rect x="0" y="0" width="16" height="16" fill="#000000" />
          <rect x="1" y="2" width="14" height="12" fill="#000000" stroke="#5fde5f" stroke-width="2" />
          <polygon points="3,7 6,9 3,11" fill="#5fde5f" />
          <rect x="7" y="9" width="7" height="2" fill="#cccccc" />
        }
        @case ('warning') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <polygon points="8,1 15,15 1,15" fill="#cc8800" stroke="#102030" stroke-width="1" />
          <rect x="7" y="6" width="2" height="5" fill="#000000" />
          <rect x="7" y="12" width="2" height="2" fill="#000000" />
        }
        @case ('sensor') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="3" y="3" width="10" height="10" fill="none" stroke="#e8f0f8" stroke-width="2" />
          <rect x="6" y="6" width="4" height="4" fill="#5fde5f" />
        }
        @case ('module') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="2" y="2" width="12" height="12" fill="#b0c0d0" stroke="#506070" stroke-width="2" />
          <rect x="4" y="4" width="8" height="8" fill="#6ba1d8" />
        }
        @case ('dinosaur') {
          <rect x="0" y="0" width="16" height="16" fill="#102030" />
          <rect x="3" y="6" width="10" height="8" fill="#5fde5f" />
          <rect x="5" y="3" width="6" height="4" fill="#5fde5f" />
          <rect x="6" y="4" width="2" height="2" fill="#cc2222" />
          <rect x="9" y="4" width="2" height="2" fill="#cc2222" />
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
      .os-icon {
        image-rendering: pixelated;
        border: 1px solid #506070;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsIconComponent {
  readonly name = input.required<OsIconName>();
  readonly size = input(24);
}
