import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type JpStatusKind = 'online' | 'offline' | 'warn' | 'critical' | 'corrupt' | 'idle';

@Component({
  selector: 'app-jp-status-icon',
  standalone: true,
  template: `
    <svg
      class="jp-status-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      shape-rendering="crispEdges"
      [attr.data-status]="kind()"
      aria-hidden="true"
    >
      @switch (kind()) {
        @case ('online') {
          <rect x="0" y="0" width="14" height="14" fill="#000000" />
          <rect x="2" y="2" width="10" height="10" fill="#5fde5f" />
        }
        @case ('offline') {
          <rect x="0" y="0" width="14" height="14" fill="#000000" />
          <rect x="2" y="6" width="10" height="2" fill="#cc2222" />
          <rect x="6" y="2" width="2" height="10" fill="#cc2222" />
        }
        @case ('warn') {
          <rect x="0" y="0" width="14" height="14" fill="#000000" />
          <polygon points="7,1 13,13 1,13" fill="#cc8800" />
          <rect x="6" y="5" width="2" height="5" fill="#000000" />
        }
        @case ('critical') {
          <rect x="0" y="0" width="14" height="14" fill="#000000" />
          <rect x="2" y="2" width="10" height="10" fill="#cc2222" />
          <rect x="4" y="4" width="6" height="6" fill="#000000" />
          <rect x="6" y="6" width="2" height="2" fill="#cc2222" />
        }
        @case ('corrupt') {
          <rect x="0" y="0" width="14" height="14" fill="#000000" />
          <rect x="0" y="0" width="4" height="4" fill="#cc00cc" />
          <rect x="10" y="0" width="4" height="4" fill="#cccccc" />
          <rect x="5" y="5" width="4" height="4" fill="#cc00cc" />
          <rect x="0" y="10" width="4" height="4" fill="#cccccc" />
          <rect x="10" y="10" width="4" height="4" fill="#cc00cc" />
        }
        @case ('idle') {
          <rect x="0" y="0" width="14" height="14" fill="#405060" />
          <rect x="4" y="4" width="6" height="6" fill="#8090a0" />
        }
      }
    </svg>
  `,
  styles: [
    `
      .jp-status-icon {
        image-rendering: pixelated;
        flex-shrink: 0;
        border: 1px solid #506070;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JpStatusIconComponent {
  readonly kind = input<JpStatusKind>('idle');
}
