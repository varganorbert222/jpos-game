import { Injectable, effect, inject, signal } from '@angular/core';
import type { GameEvent, SimulationSnapshot } from '../../../simulation';
import { AudioService } from './audio.service';
import { FenceStatusService } from './fence-status.service';
import { JpMailService } from './jp-mail.service';
import { SimulationBridgeService } from './simulation-bridge.service';
import { SystemBootService } from './system-boot.service';

const MAX_DISPLAYED_ALERTS = 12;
const REVEAL_GAP_MS = 220;

type FeedbackKind =
  | 'alert'
  | 'event'
  | 'status_bar'
  | 'fence_status'
  | 'mail';

interface FeedbackItem {
  kind: FeedbackKind;
  alertText?: string;
  event?: GameEvent;
}

/**
 * Queues UI reveals and matching sounds so alerts/events do not stack
 * simultaneously. Status bar, fence, and mail cues are audio-only.
 */
@Injectable({ providedIn: 'root' })
export class GameFeedbackService {
  private readonly sim = inject(SimulationBridgeService);
  private readonly boot = inject(SystemBootService);
  private readonly fence = inject(FenceStatusService);
  private readonly mail = inject(JpMailService);
  private readonly audio = inject(AudioService);

  private readonly queue: FeedbackItem[] = [];
  private draining = false;

  private desktopSeeded = false;
  private seenEventIds = new Set<number>();
  private lastAlertCount = 0;
  private lastBanner = '';
  private lastFenceLabel = '';
  private lastMailCount = 0;

  /** Alerts released one-by-one for the security panel. */
  readonly displayedAlerts = signal<string[]>([]);

  /** Active events released one-by-one for the events list. */
  readonly displayedEvents = signal<GameEvent[]>([]);

  constructor() {
    effect(() => {
      const phase = this.boot.phase();
      const snap = this.sim.snapshot();

      if (phase !== 'complete' || !snap) {
        if (phase !== 'complete') {
          this.resetPresentation();
        }
        return;
      }

      if (!this.desktopSeeded) {
        this.seedDesktop(snap);
      }

      this.syncDisplayedEventsWithSimulation(snap);
      this.detectSnapshotDeltas(snap);
    });

    effect(() => {
      if (this.boot.phase() !== 'complete') {
        return;
      }
      const banner = this.boot.sysBannerDisplay();
      if (banner === this.lastBanner) {
        return;
      }
      if (!this.desktopSeeded) {
        this.lastBanner = banner;
        return;
      }
      this.lastBanner = banner;
      this.enqueue({ kind: 'status_bar' });
    });

    effect(() => {
      if (this.boot.phase() !== 'complete') {
        return;
      }
      const label = this.fence.gridLabel();
      if (label === this.lastFenceLabel) {
        return;
      }
      if (!this.desktopSeeded) {
        this.lastFenceLabel = label;
        return;
      }
      this.lastFenceLabel = label;
      this.enqueue({ kind: 'fence_status' });
    });

    effect(() => {
      if (this.boot.phase() !== 'complete') {
        return;
      }
      const count = this.mail.messages().length;
      if (count <= this.lastMailCount) {
        this.lastMailCount = count;
        return;
      }
      if (!this.desktopSeeded) {
        this.lastMailCount = count;
        return;
      }
      this.lastMailCount = count;
      this.enqueue({ kind: 'mail' });
    });
  }

  connectSimAudio(): void {
    this.sim.onAudio((alerts) => {
      for (const id of alerts) {
        this.audio.playAlert(id);
      }
    });
  }

  private seedDesktop(snap: SimulationSnapshot): void {
    this.desktopSeeded = true;
    this.seenEventIds = new Set(snap.activeEvents.map((e) => e.id));
    this.lastAlertCount = snap.alertEntries.length;
    this.lastBanner = this.boot.sysBannerDisplay();
    this.lastFenceLabel = this.fence.gridLabel();
    this.lastMailCount = this.mail.messages().length;
    this.displayedAlerts.set([...snap.alertEntries].slice(-MAX_DISPLAYED_ALERTS).reverse());
    this.displayedEvents.set([...snap.activeEvents]);
  }

  private resetPresentation(): void {
    this.desktopSeeded = false;
    this.seenEventIds.clear();
    this.lastAlertCount = 0;
    this.lastBanner = '';
    this.lastFenceLabel = '';
    this.lastMailCount = 0;
    this.queue.length = 0;
    this.displayedAlerts.set([]);
    this.displayedEvents.set([]);
  }

  private detectSnapshotDeltas(snap: SimulationSnapshot): void {
    const alerts = snap.alertEntries;
    if (alerts.length > this.lastAlertCount) {
      const fresh = alerts.slice(this.lastAlertCount);
      this.lastAlertCount = alerts.length;
      for (const alertText of fresh) {
        this.enqueue({ kind: 'alert', alertText });
      }
    } else if (alerts.length < this.lastAlertCount) {
      this.lastAlertCount = alerts.length;
    }

    for (const event of snap.activeEvents) {
      if (this.seenEventIds.has(event.id)) {
        continue;
      }
      this.seenEventIds.add(event.id);
      this.enqueue({ kind: 'event', event: { ...event } });
    }
  }

  private syncDisplayedEventsWithSimulation(snap: SimulationSnapshot): void {
    const activeIds = new Set(snap.activeEvents.map((e) => e.id));
    this.displayedEvents.update((list) => list.filter((e) => activeIds.has(e.id)));
    for (const id of [...this.seenEventIds]) {
      if (!activeIds.has(id)) {
        this.seenEventIds.delete(id);
      }
    }
  }

  private enqueue(item: FeedbackItem): void {
    this.queue.push(item);
    void this.drainQueue();
  }

  private async drainQueue(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.applyItem(item);
      if (this.queue.length > 0) {
        await this.delay(REVEAL_GAP_MS);
      }
    }
    this.draining = false;
  }

  private applyItem(item: FeedbackItem): void {
    switch (item.kind) {
      case 'alert':
        if (item.alertText) {
          this.displayedAlerts.update((prev) =>
            [item.alertText!, ...prev].slice(0, MAX_DISPLAYED_ALERTS),
          );
        }
        this.audio.enqueue('alert');
        break;
      case 'event':
        if (item.event) {
          this.displayedEvents.update((prev) => {
            if (prev.some((e) => e.id === item.event!.id)) {
              return prev;
            }
            return [...prev, item.event!];
          });
        }
        this.audio.enqueue('event');
        break;
      case 'status_bar':
        this.audio.enqueue('status_bar');
        break;
      case 'fence_status':
        this.audio.enqueue('fence_status');
        break;
      case 'mail':
        this.audio.enqueue('mail_arrived');
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
