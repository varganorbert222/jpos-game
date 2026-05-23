import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  classifyMailSender,
  getMailNumber,
  getParamNumber,
  mailVirusChanceOnOpen,
  type MailSenderClass,
} from '../../../simulation';
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
    senderClass: 'registry_trusted',
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
    senderClass: 'registry_trusted',
  },
];

const UNKNOWN_SUBJECTS = [
  'URGENT GRID PATCH',
  'Visitor survey results',
  'Re: fence calibration',
  'SYSTEM UPDATE REQUIRED',
] as const;

const SPOOF_FROM = ['UNKNOWN', 'J.HAMM0ND', 'MALC0LM', 'JP-0S', 'SECURITY-UPDATE'] as const;

@Injectable({ providedIn: 'root' })
export class JpMailService {
  private readonly sim = inject(SimulationBridgeService);
  private lastTick = -1;
  private lastRunSeed: number | null = null;
  private tutorialMailInjected = false;

  readonly messages = signal<MailMessage[]>([...WELCOME]);
  readonly selectedId = signal<string | null>(WELCOME[0]?.id ?? null);
  readonly activeFolder = signal<MailFolder>('inbox');
  readonly hasNewMail = signal(false);
  /** User-marked trusted senders (exact From). */
  readonly runtimeTrustedSenders = signal<string[]>([]);

  readonly unreadCount = computed(
    () => this.messages().filter((m) => !m.deleted && !m.read).length,
  );

  readonly folderMessages = computed(() => {
    const folder = this.activeFolder();
    const list = this.messages().filter((m) => !m.deleted);
    if (folder === 'unread') {
      return list.filter((m) => !m.read);
    }
    if (folder === 'spam') {
      return list.filter((m) => m.folder === 'spam');
    }
    if (folder === 'deleted') {
      return this.messages().filter((m) => m.deleted);
    }
    return list.filter((m) => m.folder === 'inbox');
  });

  readonly selected = computed(() => {
    const id = this.selectedId();
    return this.messages().find((m) => m.id === id) ?? null;
  });

  readonly selectedCanTrust = computed(() => {
    const msg = this.selected();
    if (!msg) {
      return false;
    }
    const cls = this.classify(msg.from);
    return cls === 'unknown' || cls === 'spoof';
  });

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      if (!snap) {
        return;
      }
      if (snap.runSeed !== this.lastRunSeed && snap.tick <= 1) {
        this.resetForNewRun();
        this.lastRunSeed = snap.runSeed;
        this.lastTick = snap.tick;
        return;
      }
      this.lastRunSeed = snap.runSeed;
      this.maybeInjectTutorialMail(snap);
      if (snap.gameOver || snap.tick === this.lastTick) {
        return;
      }
      this.lastTick = snap.tick;
      this.maybeGenerateReport(snap);
      this.maybeGenerateUntrustedMail(snap);
    });
  }

  resetForNewRun(): void {
    this.messages.set([...WELCOME]);
    this.selectedId.set(WELCOME[0]?.id ?? null);
    this.activeFolder.set('inbox');
    this.runtimeTrustedSenders.set([]);
    this.hasNewMail.set(false);
    this.lastTick = -1;
    this.tutorialMailInjected = false;
  }

  private maybeInjectTutorialMail(snap: SimulationSnapshot): void {
    if (
      snap.difficultyMode !== 'tutorial' ||
      !snap.tutorialMailDemoPending ||
      this.tutorialMailInjected
    ) {
      return;
    }
    this.tutorialMailInjected = true;
    const msg: MailMessage = {
      id: uid(),
      folder: 'inbox',
      from: 'UNKNOWN',
      subject: 'URGENT — GRID PATCH REQUIRED',
      body: `Operator,

Attached "patch" is unsigned. Opening may compromise JP-OS bus.
Delete unread or run system_hard_reboot after exposure.

— UNKNOWN`,
      tick: snap.tick,
      read: false,
      priority: 'secondary',
      deleted: false,
      senderClass: 'unknown',
    };
    this.messages.update((list) => [...list, msg]);
    this.hasNewMail.set(true);
  }

  classify(from: string): MailSenderClass {
    return classifyMailSender(from, this.runtimeTrustedSenders());
  }

  isTrustedSender(from: string): boolean {
    const c = this.classify(from);
    return c === 'registry_trusted' || c === 'runtime_trusted' || c === 'malcolm';
  }

  setFolder(folder: MailFolder): void {
    this.activeFolder.set(folder);
    const first = this.folderMessages()[0];
    this.selectedId.set(first?.id ?? null);
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.openMessage(id);
    this.hasNewMail.set(false);
  }

  trustSelectedSender(): void {
    const msg = this.selected();
    if (!msg) {
      return;
    }
    const from = msg.from.trim();
    if (!from || this.isTrustedSender(from)) {
      return;
    }
    this.runtimeTrustedSenders.update((list) =>
      list.some((s) => s.toUpperCase() === from.toUpperCase())
        ? list
        : [...list, from],
    );
    this.messages.update((list) =>
      list.map((m) =>
        m.from.toUpperCase() === from.toUpperCase()
          ? { ...m, folder: 'inbox' as const, senderClass: 'runtime_trusted' as const }
          : m,
      ),
    );
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
      list.map((m) => {
        if (m.id !== id) {
          return m;
        }
        const folder = this.isTrustedSender(m.from) ? ('inbox' as const) : ('spam' as const);
        return { ...m, deleted: false, folder };
      }),
    );
  }

  clearNewMailIndicator(): void {
    this.hasNewMail.set(false);
  }

  private openMessage(id: string): void {
    const msg = this.messages().find((m) => m.id === id);
    if (!msg) {
      return;
    }
    if (!msg.read) {
      this.sim.reportTutorialProgress({
        type: 'mail_open',
        from: msg.from,
      });
    }
    if (msg.read) {
      return;
    }
    this.markRead(id);
    const snap = this.sim.snapshot();
    if (!snap) {
      return;
    }
    const senderClass = this.classify(msg.from);
    if (senderClass === 'malcolm' && msg.philosophyOnly) {
      return;
    }
    const chance = mailVirusChanceOnOpen(senderClass, snap.difficultyMode);
    if (chance <= 0) {
      return;
    }
    if (Math.random() >= chance) {
      return;
    }
    const delta = getParamNumber('infectionLevelOnVirus');
    this.sim.applyMailInfection(delta);
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
    this.pushMail({
      folder: 'inbox',
      from: 'JP-OS.REPORTER',
      subject: `STATUS REPORT — T${snap.tick}`,
      body: `Park stability: ${Math.round(snap.stability)}%
Breaches logged: ${snap.breachCount}
Weather: ${snap.weather}
Blackout: ${snap.globalBlackout ? 'YES' : 'NO'}
Escalation phase: ${snap.escalationPhase}

— Automated JP-OS reporter`,
      tick: snap.tick,
      read: false,
      priority: 'report',
      deleted: false,
      senderClass: 'registry_trusted',
    });

    if (snap.breachCount > 0 && snap.tick % 24 === 0) {
      const zone = ZONE_NAMES[snap.fences.find((f) => f.state === 'Breached')?.zoneId ?? 0];
      if (Math.random() < getMailNumber('malcolmPhilosophySpamChance')) {
        this.pushMail({
          folder: 'inbox',
          from: 'I.MALCOLM',
          subject: 'SECONDARY — Life finds a way (also: check grid)',
          body: `Something is breaching near ${zone}. Chaos theory suggests your sensors may lie.`,
          tick: snap.tick,
          read: false,
          priority: 'secondary',
          deleted: false,
          senderClass: 'malcolm',
          philosophyOnly: true,
        });
      } else {
        this.pushMail({
          folder: 'inbox',
          from: 'I.MALCOLM',
          subject: 'SECONDARY — Chaos favors the unprepared',
          body: `Something is breaching near ${zone}. Life finds a way — so should you.`,
          tick: snap.tick,
          read: false,
          priority: 'secondary',
          deleted: false,
          senderClass: 'malcolm',
        });
      }
    }
  }

  private maybeGenerateUntrustedMail(snap: SimulationSnapshot): void {
    if (snap.tick % 45 !== 0) {
      return;
    }
    const roll = Math.random();
    if (roll > 0.35) {
      return;
    }
    const spoof = roll > 0.15;
    const from = spoof
      ? SPOOF_FROM[Math.floor(Math.random() * SPOOF_FROM.length)]!
      : 'UNKNOWN';
    const senderClass = classifyMailSender(from, this.runtimeTrustedSenders());
    const folder: MailFolder =
      senderClass === 'runtime_trusted' || senderClass === 'registry_trusted'
        ? 'inbox'
        : 'spam';
    this.pushMail({
      folder,
      from,
      subject: UNKNOWN_SUBJECTS[Math.floor(Math.random() * UNKNOWN_SUBJECTS.length)]!,
      body: spoof
        ? 'Mandatory security patch attached. Open immediately.'
        : 'You have unread visitor liability notices. Confirm within the hour.',
      tick: snap.tick,
      read: false,
      priority: 'junk',
      deleted: false,
      senderClass,
    });
  }
}
