import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { JpStatusIconComponent, type JpStatusKind } from '../../../shared/jp-status-icon/jp-status-icon.component';
import { GameFeedbackService } from '../../../core/services/game-feedback.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { SectionLoaderComponent } from '../../../shared/boot/section-loader.component';

@Component({
  selector: 'app-alerts-panel',
  standalone: true,
  imports: [OsIconComponent, JpStatusIconComponent, RetroScrollDirective, SectionLoaderComponent],
  templateUrl: './alerts-panel.component.html',
  styleUrl: './alerts-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPanelComponent {
  private readonly feedback = inject(GameFeedbackService);
  readonly telemetry = inject(UiTelemetryService);

  readonly alerts = this.feedback.displayedAlerts;
  readonly events = this.feedback.displayedEvents;

  alertIcon(msg: string): JpStatusKind {
    const u = msg.toUpperCase();
    if (u.includes('CRITICAL') || u.includes('BREACH')) {
      return 'critical';
    }
    if (u.includes('WARN') || u.includes('GHOST')) {
      return 'warn';
    }
    if (u.includes('BLACKOUT')) {
      return 'offline';
    }
    return 'online';
  }

  severityClass(msg: string): string {
    const u = msg.toUpperCase();
    if (u.includes('CRITICAL') || u.includes('BREACH') || u.includes('BLACKOUT')) {
      return 'jp-critical';
    }
    if (u.includes('WARN') || u.includes('GHOST')) {
      return 'jp-warn';
    }
    if (u.includes('HIGH') || u.includes('STRESS')) {
      return 'jp-danger';
    }
    return 'jp-nominal';
  }
}
