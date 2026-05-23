import { Injectable, OnDestroy } from '@angular/core';

/** Source art size for hourglass pack (matches _retro-cursors.scss). */
const HOURGLASS_W = 48;
const HOURGLASS_H = 66;
const HOURGLASS_HOT_X = 24;
const HOURGLASS_HOT_Y = 33;
const CURSOR_MAX_PX = 32;

const WAIT_SURFACES = [
  '.jp-boot-screen',
  '.jp-boot-screen *',
  '.jp-section-loader__overlay',
  '.jp-section-loader__overlay *',
  '.jp-cursor-wait',
  '.jp-cursor-wait *',
].join(',\n');

const FRAMES = ['hourglass_start', 'hourglass_mid', 'hourglass_end'] as const;

const FRAME_MS = 320;

function scaledHotspot(x: number, y: number, w: number, h: number): { x: number; y: number } {
  const scale = CURSOR_MAX_PX / Math.max(w, h);
  return {
    x: Math.round(x * scale),
    y: Math.round(y * scale),
  };
}

@Injectable({ providedIn: 'root' })
export class WaitCursorAnimationService implements OnDestroy {
  private styleEl: HTMLStyleElement | null = null;
  private frameIndex = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly hotspot = scaledHotspot(
    HOURGLASS_HOT_X,
    HOURGLASS_HOT_Y,
    HOURGLASS_W,
    HOURGLASS_H,
  );

  start(): void {
    if (this.timer !== null) {
      return;
    }
    this.ensureStyleEl();
    this.applyFrame();
    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length;
      this.applyFrame();
    }, FRAME_MS);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.styleEl?.remove();
    this.styleEl = null;
  }

  private ensureStyleEl(): void {
    if (this.styleEl) {
      return;
    }
    this.styleEl = document.createElement('style');
    this.styleEl.id = 'jp-wait-cursor-animation';
    document.head.append(this.styleEl);
  }

  private applyFrame(): void {
    if (!this.styleEl) {
      return;
    }
    const file = FRAMES[this.frameIndex];
    const url = `/cursors/light/hourglasses/${file}.png`;
    const { x, y } = this.hotspot;
    this.styleEl.textContent = `
${WAIT_SURFACES} {
  cursor: url("${url}") ${x} ${y}, wait !important;
}`;
  }
}
