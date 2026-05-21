import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { WindowManagerService } from '../../window-manager/window-manager.service';

export type DockApp = 'security' | 'power' | 'dino' | 'terminal' | 'weather';

@Component({
  selector: 'app-dock',
  standalone: true,
  imports: [OsIconComponent],
  templateUrl: './dock.component.html',
  styleUrl: './dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockComponent {
  readonly wm = inject(WindowManagerService);
  readonly apps: { id: DockApp; label: string }[] = [
    { id: 'security', label: 'SECURITY' },
    { id: 'power', label: 'POWER GRID' },
    { id: 'dino', label: 'DINO MON' },
    { id: 'terminal', label: 'TERMINAL' },
    { id: 'weather', label: 'WEATHER' },
  ];

  open(app: DockApp): void {
    this.wm.open(app);
  }

  isOpen(app: DockApp): boolean {
    return this.wm.isOpen(app);
  }

  isFocused(app: DockApp): boolean {
    return this.wm.focusedApp() === app;
  }
}
