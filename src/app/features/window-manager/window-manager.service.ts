import { Injectable, computed, inject, signal } from '@angular/core';
import { JpMailService } from '../../core/services/jp-mail.service';
import { OperatorGuidanceService } from '../../core/services/operator-guidance.service';
import { SystemBootService } from '../../core/services/system-boot.service';
import type { DockApp } from '../panels/dock/dock.component';

export interface OsWindow {
  id: string;
  app: DockApp;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  restoreRect: { x: number; y: number; width: number; height: number } | null;
}

/** Draggable window area inside the desktop workspace (logical px). */
const WORK_X = 12;
const WORK_Y = 56;
const WORK_W = 1576;
const WORK_H = 1060;
const WORK_MAX_X = WORK_X + WORK_W;
const WORK_MAX_Y = WORK_Y + WORK_H;

const WINDOW_SIZES: Record<DockApp, { width: number; height: number }> = {
  terminal: { width: 820, height: 582 },
  security: { width: 720, height: 480 },
  power: { width: 680, height: 420 },
  fence: { width: 760, height: 520 },
  dino: { width: 820, height: 520 },
  weather: { width: 600, height: 680 },
  files: { width: 780, height: 520 },
  mail: { width: 860, height: 480 },
  tours: { width: 720, height: 560 },
};

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly boot = inject(SystemBootService);
  private readonly mail = inject(JpMailService);
  private readonly guidance = inject(OperatorGuidanceService);

  readonly windows = signal<OsWindow[]>([]);
  readonly focusedId = signal<string | null>(null);
  readonly moveSnap = signal(8);
  readonly openApps = computed(() => {
    const apps = new Set<DockApp>();
    for (const w of this.windows()) {
      if (!w.minimized) {
        apps.add(w.app);
      }
    }
    return apps;
  });
  private zCounter = 10;

  /** Window visible on workspace (not minimized). */
  isOpen(app: DockApp): boolean {
    return this.windows().some((w) => w.app === app && !w.minimized);
  }

  /** Window instance still in memory (open or minimized). */
  isInMemory(app: DockApp): boolean {
    return this.windows().some((w) => w.app === app);
  }

  isMinimized(app: DockApp): boolean {
    return this.windows().some((w) => w.app === app && w.minimized);
  }

  isFocused(id: string): boolean {
    return this.focusedId() === id;
  }

  focusedApp(): DockApp | null {
    const id = this.focusedId();
    return this.windows().find((w) => w.id === id)?.app ?? null;
  }

  open(app: DockApp): void {
    const titles: Record<DockApp, string> = {
      security: 'SECURITY_MONITOR',
      power: 'POWER_GRID.SYS',
      fence: 'FENCE_PERIMETER.SYS',
      dino: 'BIO_MONITOR',
      terminal: 'JP-OS TERMINAL',
      weather: 'WEATHER_STATION',
      files: 'JP FILE VAULT',
      mail: 'JP-MAIL',
      tours: 'TOUR CONTROL',
    };
    const existing = this.windows().find((w) => w.app === app);
    if (existing) {
      this.focus(existing.id);
      if (existing.minimized) {
        this.restore(existing.id);
      }
      if (app === 'mail') {
        this.mail.clearNewMailIndicator();
      }
      return;
    }
    const size = WINDOW_SIZES[app];
    const offset = this.windows().length * 28;
    const pos = this.clampPosition(140 + offset, 100 + offset, size.width, size.height);
    const win: OsWindow = {
      id: `${app}-${Date.now()}`,
      app,
      title: titles[app],
      x: pos.x,
      y: pos.y,
      width: size.width,
      height: size.height,
      z: this.zCounter++,
      minimized: false,
      maximized: false,
      restoreRect: null,
    };
    this.windows.update((list) => [...list, win]);
    this.focusedId.set(win.id);
    this.boot.beginWindowLoad(win.id);
    if (app === 'mail') {
      this.mail.clearNewMailIndicator();
    }
    if (app === 'terminal') {
      this.guidance.onTerminalOpened();
    }
  }

  /** Cold boot / hard reboot — no open or minimized windows. */
  resetAll(): void {
    for (const w of this.windows()) {
      this.boot.releaseWindow(w.id);
    }
    this.windows.set([]);
    this.focusedId.set(null);
    this.zCounter = 10;
  }

  reloadVisibleWindows(): void {
    for (const w of this.windows()) {
      if (w.minimized) {
        this.boot.markWindowReady(w.id);
      } else {
        this.boot.beginWindowLoad(w.id);
      }
    }
  }

  setMoveSnap(pixels: number): void {
    const snap = Math.max(1, Math.round(pixels));
    this.moveSnap.set(snap);
  }

  private snapValue(value: number, snap?: number): number {
    const step = Math.max(1, Math.round(snap ?? this.moveSnap()));
    return Math.round(value / step) * step;
  }

  private clampPosition(
    x: number,
    y: number,
    width: number,
    height: number,
  ): { x: number; y: number } {
    const maxX = Math.max(WORK_X, WORK_MAX_X - width);
    const maxY = Math.max(WORK_Y, WORK_MAX_Y - height);
    return {
      x: this.snapValue(Math.min(Math.max(WORK_X, x), maxX)),
      y: this.snapValue(Math.min(Math.max(WORK_Y, y), maxY)),
    };
  }

  close(id: string): void {
    this.boot.releaseWindow(id);
    this.windows.update((list) => list.filter((w) => w.id !== id));
    if (this.focusedId() === id) {
      const remaining = this.windows().filter(
        (w) => w.id !== id && !w.minimized,
      );
      const top = remaining.sort((a, b) => b.z - a.z)[0];
      this.focusedId.set(top?.id ?? null);
    }
  }

  focus(id: string): void {
    const z = this.zCounter++;
    this.focusedId.set(id);
    this.windows.update((list) =>
      list.map((w) => (w.id === id ? { ...w, z } : w)),
    );
  }

  move(id: string, x: number, y: number): void {
    this.windows.update((list) =>
      list.map((w) => {
        if (w.id !== id || w.maximized) {
          return w;
        }
        const pos = this.clampPosition(x, y, w.width, w.height);
        return { ...w, x: pos.x, y: pos.y };
      }),
    );
  }

  minimize(id: string): void {
    this.windows.update((list) =>
      list.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    );
    if (this.focusedId() === id) {
      const remaining = this.windows().filter(
        (w) => w.id !== id && !w.minimized,
      );
      const top = remaining.sort((a, b) => b.z - a.z)[0];
      this.focusedId.set(top?.id ?? null);
    }
  }

  restore(id: string): void {
    this.windows.update((list) =>
      list.map((w) => (w.id === id ? { ...w, minimized: false } : w)),
    );
    this.focus(id);
  }

  toggleMaximize(id: string): void {
    this.windows.update((list) =>
      list.map((w) => {
        if (w.id !== id) {
          return w;
        }
        if (w.maximized) {
          const r = w.restoreRect ?? {
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
          };
          const pos = this.clampPosition(r.x, r.y, r.width, r.height);
          return {
            ...w,
            maximized: false,
            x: pos.x,
            y: pos.y,
            width: r.width,
            height: r.height,
            restoreRect: null,
          };
        }
        return {
          ...w,
          maximized: true,
          minimized: false,
          restoreRect: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: WORK_X,
          y: WORK_Y,
          width: WORK_W,
          height: WORK_H,
        };
      }),
    );
    this.focus(id);
  }
}
