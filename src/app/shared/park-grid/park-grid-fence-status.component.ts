import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FenceStatusService } from '../../core/services/fence-status.service';

@Component({
  selector: 'app-park-grid-fence-status',
  standalone: true,
  host: {
    class: 'park-grid-fence-status',
    '[class.park-grid-fence-status--verify]': 'fence.isVerifyPower()',
    '[class.jp-critical]': 'fence.isCritical()',
    role: 'status',
    'aria-live': 'polite',
  },
  template: `{{ fence.gridLabel() }}`,
  styleUrl: './park-grid-fence-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkGridFenceStatusComponent {
  readonly fence = inject(FenceStatusService);
}
