import { Injectable } from '@angular/core';

const MAX_CHANNELS = 4;

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;
  private active = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  playAlert(id: string): void {
    if (this.active >= MAX_CHANNELS) {
      return;
    }
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freq =
      id === 'alarm_critical' ? 880 : id === 'alarm_blackout' ? 220 : 440;
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.value = 0.08;
    osc.start();
    this.active++;
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => {
      this.active = Math.max(0, this.active - 1);
    };
  }

  playBeeps(count: number): void {
    for (let i = 0; i < count && this.active < MAX_CHANNELS; i++) {
      setTimeout(() => this.playAlert('beep'), i * 120);
    }
  }
}
