import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { ZoneMapCanvasComponent } from '../../../rendering/zone-map-canvas/zone-map-canvas.component';
import { CameraFeedsComponent } from '../../../rendering/camera-feeds/camera-feeds.component';

@Component({
  selector: 'app-center-panel',
  standalone: true,
  imports: [OsIconComponent, ZoneMapCanvasComponent, CameraFeedsComponent],
  templateUrl: './center-panel.component.html',
  styleUrl: './center-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenterPanelComponent {
  readonly telemetry = inject(UiTelemetryService);
}
