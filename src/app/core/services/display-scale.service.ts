import { Injectable, signal } from '@angular/core';
import { BASE_HEIGHT, BASE_WIDTH } from '../../../simulation';

@Injectable({ providedIn: 'root' })
export class DisplayScaleService {
  readonly scale = signal(1);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.recalculate());
      this.recalculate();
    }
  }

  recalculate(): void {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const scaleX = Math.floor(sw / BASE_WIDTH);
    const scaleY = Math.floor(sh / BASE_HEIGHT);
    const s = Math.max(1, Math.min(scaleX, scaleY) || 1);
    this.scale.set(s);
  }

  frameStyles(): Record<string, string> {
    const s = this.scale();
    return {
      width: `${BASE_WIDTH * s}px`,
      height: `${BASE_HEIGHT * s}px`,
    };
  }

  innerStyles(): Record<string, string> {
    const s = this.scale();
    return {
      width: `${BASE_WIDTH}px`,
      height: `${BASE_HEIGHT}px`,
      transform: `scale(${s})`,
      transformOrigin: 'top left',
      imageRendering: 'pixelated',
    };
  }
}
