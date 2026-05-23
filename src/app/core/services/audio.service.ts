import { Injectable } from '@angular/core';

/** Retro UI / simulation sound cues (Web Audio synthesis). */
export type SoundCueId =
  | 'caret_blink'
  | 'status_bar'
  | 'fence_status'
  | 'mail_arrived'
  | 'event'
  | 'alert'
  | 'alarm_critical'
  | 'alarm_blackout'
  | 'alarm_fatigue'
  | 'beep';

const MAX_CHANNELS = 4;
const QUEUE_GAP_MS = 200;

interface QueuedCue {
  id: SoundCueId;
  priority: boolean;
}

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;
  private active = 0;
  private readonly queue: QueuedCue[] = [];
  private draining = false;
  private caretActive = false;

  /** Serial playback for game feedback (alerts, events, mail, …). */
  enqueue(cue: SoundCueId, options?: { priority?: boolean }): void {
    const item: QueuedCue = { id: cue, priority: options?.priority ?? false };
    if (item.priority) {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }
    void this.drainQueue();
  }

  /** Legacy sim tick alarms. */
  playAlert(id: string): void {
    const map: Record<string, SoundCueId> = {
      alarm_critical: 'alarm_critical',
      alarm_blackout: 'alarm_blackout',
      alarm_fatigue: 'alarm_fatigue',
      beep: 'beep',
    };
    const cue = map[id];
    if (!cue) {
      return;
    }
    this.enqueue(cue, {
      priority: cue === 'alarm_critical' || cue === 'alarm_blackout',
    });
  }

  playBeeps(count: number): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.enqueue('beep'), i * 120);
    }
  }

  /** System-ready terminal caret — not queued; quiet tick on each blink. */
  playCaretBlink(): void {
    if (this.caretActive) {
      return;
    }
    this.caretActive = true;
    void this.playTone({
      frequency: 920,
      type: 'square',
      gain: 0.035,
      durationSec: 0.028,
      onDone: () => {
        this.caretActive = false;
      },
    });
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    void this.ctx.resume();
    return this.ctx;
  }

  private async drainQueue(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;
    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      await this.playCue(next.id);
      if (this.queue.length > 0) {
        await this.delay(QUEUE_GAP_MS);
      }
    }
    this.draining = false;
  }

  private playCue(id: SoundCueId): Promise<void> {
    switch (id) {
      case 'status_bar':
        return this.playTone({ frequency: 520, type: 'square', gain: 0.05, durationSec: 0.06 });
      case 'fence_status':
        return this.playTone({ frequency: 180, type: 'square', gain: 0.07, durationSec: 0.1 });
      case 'mail_arrived':
        return this.playChime([660, 880], 0.06, 0.055);
      case 'event':
        return this.playChime([440, 554], 0.07, 0.08);
      case 'alert':
        return this.playTone({ frequency: 740, type: 'square', gain: 0.06, durationSec: 0.09 });
      case 'alarm_critical':
        return this.playTone({ frequency: 880, type: 'square', gain: 0.09, durationSec: 0.28 });
      case 'alarm_blackout':
        return this.playTone({ frequency: 220, type: 'square', gain: 0.09, durationSec: 0.32 });
      case 'alarm_fatigue':
        return this.playTone({ frequency: 440, type: 'square', gain: 0.07, durationSec: 0.2 });
      case 'beep':
        return this.playTone({ frequency: 440, type: 'square', gain: 0.08, durationSec: 0.25 });
      default:
        return Promise.resolve();
    }
  }

  private playChime(
    frequencies: number[],
    stepSec: number,
    durationSec: number,
  ): Promise<void> {
    return frequencies.reduce(
      (chain, freq, i) =>
        chain.then(() => {
          if (i > 0) {
            return this.delay(stepSec * 1000);
          }
          return Promise.resolve();
        }).then(() =>
          this.playTone({ frequency: freq, type: 'square', gain: 0.06, durationSec }),
        ),
      Promise.resolve(),
    );
  }

  private playTone(opts: {
    frequency: number;
    type: OscillatorType;
    gain: number;
    durationSec: number;
    onDone?: () => void;
  }): Promise<void> {
    if (this.active >= MAX_CHANNELS) {
      opts.onDone?.();
      return Promise.resolve();
    }

    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = opts.frequency;
    osc.type = opts.type;
    gain.gain.value = opts.gain;
    const stopAt = ctx.currentTime + opts.durationSec;
    osc.start();
    osc.stop(stopAt);
    this.active++;

    return new Promise((resolve) => {
      osc.onended = () => {
        this.active = Math.max(0, this.active - 1);
        opts.onDone?.();
        resolve();
      };
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
