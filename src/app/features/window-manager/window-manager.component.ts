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
import { WeatherWindowComponent } from './windows/weather-window.component';
import { FilesWindowComponent } from './windows/files-window.component';
import { MailWindowComponent } from './windows/mail-window.component';
import { ToursWindowComponent } from './windows/tours-window.component';
import { JpMailService } from '../../core/services/jp-mail.service';
import { SectionLoaderComponent } from '../../shared/boot/section-loader.component';

@Component({
  selector: 'app-window-manager',
  standalone: true,
  imports: [
    OsIconComponent,
    SectionLoaderComponent,
    SecurityWindowComponent,
    PowerWindowComponent,
    DinoWindowComponent,
    TerminalWindowComponent,
    WeatherWindowComponent,
    FilesWindowComponent,
    MailWindowComponent,
    ToursWindowComponent,
  ],
  templateUrl: './window-manager.component.html',
  styleUrl: './window-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowManagerComponent {
  readonly wm = inject(WindowManagerService);
  readonly mail = inject(JpMailService);
  private readonly display = inject(DisplayScaleService);
  private drag: {
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null = null;

  iconFor(app: DockApp): DockApp {
    return app;
  }

  windowTitle(app: DockApp, title: string): string {
    if (app === 'mail' && this.mail.hasNewMail()) {
      return `${title} ● NEW`;
    }
    return title;
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
