import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { JpMailService } from '../../../core/services/jp-mail.service';
import { WindowManagerService } from '../../window-manager/window-manager.service';

export type DockApp =
  | 'security'
  | 'power'
  | 'fence'
  | 'dino'
  | 'terminal'
  | 'weather'
  | 'files'
  | 'mail'
  | 'tours';

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
  readonly mail = inject(JpMailService);
  readonly apps: { id: DockApp; label: string }[] = [
    { id: 'security', label: 'SECURITY' },
    { id: 'power', label: 'POWER GRID' },
    { id: 'fence', label: 'FENCE MON' },
    { id: 'dino', label: 'DINO MON' },
    { id: 'terminal', label: 'TERMINAL' },
    { id: 'weather', label: 'WEATHER' },
    { id: 'files', label: 'FILES' },
    { id: 'mail', label: 'MAIL' },
    { id: 'tours', label: 'TOURS' },
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

  isInMemory(app: DockApp): boolean {
    return this.wm.isInMemory(app);
  }

  isMinimized(app: DockApp): boolean {
    return this.wm.isMinimized(app);
  }

  dockTitle(app: DockApp): string {
    if (this.isMinimized(app)) {
      return `${app} — minimized (in memory)`;
    }
    if (this.isOpen(app)) {
      return `${app} — active`;
    }
    return app;
  }
}
