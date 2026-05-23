import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { SimulationSnapshot } from '../../../simulation';
import { ZONE_NAMES } from '../../../simulation/constants';
import type { MailFolder, MailMessage } from '../types/jp-mail';
import { SimulationBridgeService } from './simulation-bridge.service';

function uid(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const WELCOME: MailMessage[] = [
  {
    id: 'welcome-1',
    folder: 'inbox',
    from: 'J.HAMMOND',
    subject: 'PRIMARY — Welcome to Jurassic Park',
    body: `Operator,

You are cleared for JP-OS console access. Primary duty: keep the
illusion intact. Secondary duty: keep the animals inside.

Read FILE VAULT doctrine before authorizing tour departures.`,
    tick: 0,
    read: false,
    priority: 'primary',
    deleted: false,
  },
  {
    id: 'welcome-2',
    folder: 'inbox',
    from: 'R.ARNOLD',
    subject: 'SECONDARY — Perimeter check cadence',
    body: `Run fence diagnostics each phase shift. If VERIFY FENCE POWER
appears on grid, do not green-light tours until power is confirmed.`,
    tick: 0,
    read: false,
    priority: 'secondary',
    deleted: false,
  },
];

@Injectable({ providedIn: 'root' })
export class JpMailService {
  private readonly sim = inject(SimulationBridgeService);
  private lastTick = -1;

  readonly messages = signal<MailMessage[]>([...WELCOME]);
  readonly selectedId = signal<string | null>(WELCOME[0]?.id ?? null);
  readonly activeFolder = signal<MailFolder>('inbox');
  readonly hasNewMail = signal(false);

  readonly unreadCount = computed(
    () => this.messages().filter((m) => !m.deleted && !m.read).length,
  );

  readonly folderMessages = computed(() => {
    const folder = this.activeFolder();
    const list = this.messages().filter((m) => !m.deleted);
    if (folder === 'unread') {
      return list.filter((m) => !m.read);
    }
    if (folder === 'deleted') {
      return this.messages().filter((m) => m.deleted);
    }
    return list;
  });

  readonly selected = computed(() => {
    const id = this.selectedId();
    return this.messages().find((m) => m.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      if (!snap || snap.gameOver || snap.tick === this.lastTick) {
        return;
      }
      this.lastTick = snap.tick;
      this.maybeGenerateReport(snap);
    });
  }

  setFolder(folder: MailFolder): void {
    this.activeFolder.set(folder);
    const first = this.folderMessages()[0];
    this.selectedId.set(first?.id ?? null);
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.markRead(id);
    this.hasNewMail.set(false);
  }

  markRead(id: string): void {
    this.messages.update((list) =>
      list.map((m) => (m.id === id ? { ...m, read: true } : m)),
    );
  }

  deleteMessage(id: string): void {
    this.messages.update((list) =>
      list.map((m) =>
        m.id === id ? { ...m, deleted: true, folder: 'deleted' as const } : m,
      ),
    );
    if (this.selectedId() === id) {
      this.selectedId.set(this.folderMessages()[0]?.id ?? null);
    }
  }

  restoreMessage(id: string): void {
    this.messages.update((list) =>
      list.map((m) =>
        m.id === id ? { ...m, deleted: false, folder: 'inbox' as const } : m,
      ),
    );
  }

  clearNewMailIndicator(): void {
    this.hasNewMail.set(false);
  }

  private pushMail(msg: Omit<MailMessage, 'id'>): void {
    const entry: MailMessage = { ...msg, id: uid() };
    this.messages.update((list) => [entry, ...list]);
    this.hasNewMail.set(true);
    if (!msg.read) {
      this.selectedId.set(entry.id);
    }
  }

  private maybeGenerateReport(snap: SimulationSnapshot): void {
    if (snap.tick % 12 !== 0 || snap.tick === 0) {
      return;
    }
    const breached = snap.breachCount;
    const subject = `STATUS REPORT — T${snap.tick}`;
    const body = `Park stability: ${Math.round(snap.stability)}%
Breaches logged: ${breached}
Weather: ${snap.weather}
Blackout: ${snap.globalBlackout ? 'YES' : 'NO'}
Escalation phase: ${snap.escalationPhase}

— Automated JP-OS reporter`;
    this.pushMail({
      folder: 'inbox',
      from: 'JP-OS.REPORTER',
      subject,
      body,
      tick: snap.tick,
      read: false,
      priority: 'report',
      deleted: false,
    });

    if (snap.breachCount > 0 && snap.tick % 24 === 0) {
      const zone = ZONE_NAMES[snap.fences.find((f) => f.state === 'Breached')?.zoneId ?? 0];
      this.pushMail({
        folder: 'inbox',
        from: 'I.MALCOLM',
        subject: 'SECONDARY — Chaos favors the unprepared',
        body: `Something is breaching near ${zone}. Life finds a way — so should you.`,
        tick: snap.tick,
        read: false,
        priority: 'secondary',
        deleted: false,
      });
    }
  }
}
