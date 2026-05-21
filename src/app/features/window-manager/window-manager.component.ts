import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
import { DisplayScaleService } from '../../core/services/display-scale.service';
import { OsIconComponent } from '../../shared/os-icon/os-icon.component';
import type { DockApp } from '../panels/dock/dock.component';
import { WindowManagerService } from './window-manager.service';
import { SecurityWindowComponent } from './windows/security-window.component';
import { PowerWindowComponent } from './windows/power-window.component';
import { DinoWindowComponent } from './windows/dino-window.component';
import { TerminalWindowComponent } from './windows/terminal-window.component';

@Component({
  selector: 'app-window-manager',
  standalone: true,
  imports: [
    OsIconComponent,
    SecurityWindowComponent,
    PowerWindowComponent,
    DinoWindowComponent,
    TerminalWindowComponent,
  ],
  templateUrl: './window-manager.component.html',
  styleUrl: './window-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowManagerComponent {
  readonly wm = inject(WindowManagerService);
  private readonly display = inject(DisplayScaleService);

  private drag: {
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null = null;

  iconFor(app: DockApp): 'security' | 'power' | 'dino' | 'terminal' {
    return app;
  }

  startDrag(id: string, x: number, y: number, event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.wm.focus(id);
    this.drag = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      origX: x,
      origY: y,
    };
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(event: MouseEvent): void {
    if (!this.drag) {
      return;
    }
    const scale = this.display.scale();
    const x = Math.round(
      this.drag.origX + (event.clientX - this.drag.startX) / scale,
    );
    const y = Math.round(
      this.drag.origY + (event.clientY - this.drag.startY) / scale,
    );
    this.wm.move(this.drag.id, x, y);
  }

  @HostListener('document:mouseup')
  endDrag(): void {
    this.drag = null;
  }

  close(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.wm.close(id);
  }

  minimize(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.wm.minimize(id);
  }

  maximize(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.wm.toggleMaximize(id);
  }

  focus(id: string): void {
    this.wm.focus(id);
  }
}
