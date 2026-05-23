import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JpTourService } from '../../../core/services/jp-tour.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';

@Component({
  selector: 'app-tours-window',
  standalone: true,
  imports: [RetroScrollDirective, UpperCasePipe],
  templateUrl: './tours-window.component.html',
  styleUrl: './tours-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToursWindowComponent {
  readonly tour = inject(JpTourService);

  statusClass(status: string): string {
    switch (status) {
      case 'halted':
        return 'jp-critical';
      case 'boarding':
        return 'jp-warn';
      case 'active':
        return 'jp-nominal';
      default:
        return 'jp-info';
    }
  }

  cameraSrc(frame: number): string {
    return `/jp-data/gate-cam-${frame % 4}.svg`;
  }
}
