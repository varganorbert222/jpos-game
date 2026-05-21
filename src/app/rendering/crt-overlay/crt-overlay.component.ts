import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';

/** Light scanlines on desktop frame only — no grain/noise inside terminals */
@Component({
  selector: 'app-crt-overlay',
  standalone: true,
  template: `<div class="crt-frame" data-region="crt-overlay"></div>`,
  styleUrl: './crt-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrtOverlayComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly overload = computed(
    () => (this.sim.snapshot()?.operatorCriticalCount ?? 0) >= 3,
  );
}
