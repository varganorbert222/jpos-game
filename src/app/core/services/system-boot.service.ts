import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import {
  SysBanner,
  isBootTransientBanner,
  normalizeSysBanner,
} from '../types/sys-banner';
import { AuthService } from './auth.service';
import { FenceStatusService } from './fence-status.service';
import { SimulationBridgeService } from './simulation-bridge.service';
import {
  ALL_BOOT_SECTIONS,
  BOOT_SECTION_MESSAGES,
  PANEL_BOOT_SEQUENCE,
  windowBootSection,
  type BootSectionId,
  type BootSectionState,
} from '../types/boot-section';
import type { DockApp } from '../../features/panels/dock/dock.component';

export type BootPhase =
  | 'boot-screen'
  | 'awaiting-login'
  | 'loading-modules'
  | 'complete'
  | 'shutting-down'
  | 'system-ready';

const COLD_BOOT_LINES = [
  'JP-OS BIOS v4.0.5, ALPHA E',
  'COPYRIGHT (C) 1993 INGEN SYSTEMS',
  '',
  'MEMORY CHECK ............... OK',
  'PERIMETER BUS .............. OK',
  'CAMERA MATRIX .............. OK',
  'BIO-TELEMETRY LINK ......... OK',
  '',
  'LOADING JP-OS KERNEL...',
  'MOUNTING /dev/fence0 ... OK',
  'MOUNTING /dev/gridmap ... OK',
  'STARTING SECURITY DAEMON...',
  '',
  'KERNEL ONLINE — AWAITING OPERATOR AUTHENTICATION',
] as const;

const HARD_REBOOT_LINES = [
  '*** HARD REBOOT REQUESTED ***',
  'DROPPING FENCE POWER RAILS .... OFFLINE',
  'FLUSHING EVENT BUFFERS ........ OK',
  'RELOADING JP-OS KERNEL........',
  'RESTORING PERIMETER BUS .......',
  'WARNING: CONTAINMENT DEGRADED DURING CYCLE',
  '',
  'KERNEL ONLINE — AWAITING OPERATOR AUTHENTICATION',
] as const;

const SHUTDOWN_LINES = [
  '*** SYSTEM SHUTDOWN INITIATED ***',
  'NOTIFYING ACTIVE OPERATOR SESSIONS...',
  'STOPPING SECURITY DAEMON...',
  'DROPPING PERIMETER BUS ........ OFFLINE',
  'UNMOUNTING /dev/gridmap ....... OK',
  'UNMOUNTING /dev/fence0 ........ OK',
  'FLUSHING TELEMETRY BUFFERS ..... OK',
  'POWERING DOWN JP-OS KERNEL...',
  '',
  'SYSTEM HALTED',
] as const;

function randomBootDelayMs(): number {
  const steps = [1000, 2000, 3000];
  return steps[Math.floor(Math.random() * steps.length)];
}

@Injectable({ providedIn: 'root' })
export class SystemBootService {
  private readonly sim = inject(SimulationBridgeService);
  private readonly auth = inject(AuthService);
  private readonly fenceStatus = inject(FenceStatusService);
  private readonly injector = inject(Injector);

  readonly phase = signal<BootPhase>('boot-screen');
  readonly bootLines = signal<readonly string[]>([]);
  readonly bootScreenTitle = signal('JP-OS SYSTEM BOOT');
  readonly hardRebootActive = signal(false);
  readonly showRebootModal = signal(false);
  readonly statusBanner = signal('');

  private readonly modulesOnline = signal(false);
  private slowModuleLoad = false;

  private readonly sectionStates = signal<
    Record<BootSectionId, BootSectionState>
  >(this.initialSectionMap('pending'));

  private readonly windowStates = signal<Record<string, BootSectionState>>({});
  private readonly windowLoadGeneration = new Map<string, number>();

  private bootRun = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];

  readonly showBootScreen = computed(() => this.phase() === 'boot-screen');

  readonly showShutdownScreen = computed(
    () => this.phase() === 'shutting-down',
  );

  readonly showSystemReady = computed(() => this.phase() === 'system-ready');

  readonly systemReadyBusy = signal(false);

  readonly awaitingLogin = computed(() => this.phase() === 'awaiting-login');

  /** Login gate: any unauthenticated state except boot/shutdown/halt screens. */
  readonly showLoginScreen = computed(() => {
    const p = this.phase();
    return (
      p === 'awaiting-login' ||
      (p === 'complete' && !this.auth.isAuthenticated())
    );
  });

  readonly desktopActive = computed(
    () => this.phase() === 'loading-modules' || this.phase() === 'complete',
  );

  readonly desktopVisible = computed(() => this.phase() === 'complete');

  /**
   * Sys-banner: boot phase + grid blackout + collapse only.
   * Perimeter fence state lives on PARK GRID (FenceStatusService).
   */
  readonly sysBannerDisplay = computed(() => {
    const phase = this.phase();
    const msg = normalizeSysBanner(this.statusBanner());
    const snap = this.sim.snapshot();

    if (phase === 'boot-screen' || phase === 'shutting-down') {
      return msg || SysBanner.INITIALIZING;
    }
    if (phase === 'system-ready') {
      return msg || SysBanner.HALTED;
    }
    if (phase === 'awaiting-login') {
      return msg || SysBanner.AWAITING_LOGIN;
    }

    if (phase === 'loading-modules') {
      return SysBanner.STARTING;
    }

    if (phase === 'complete' && snap) {
      if (snap.gameOver) {
        return SysBanner.SYSTEM_COLLAPSE;
      }
      if (snap.globalBlackout) {
        return SysBanner.BLACKOUT;
      }
    }

    if (msg && !isBootTransientBanner(msg)) {
      return msg;
    }

    return SysBanner.READY;
  });

  constructor() {
    void this.startColdBoot();
  }

  /** Session ended — modules stay loaded; show login again. */
  returnToLogin(): void {
    const p = this.phase();
    if (p === 'complete' || p === 'loading-modules') {
      this.phase.set('awaiting-login');
    }
  }

  /** Load panel modules after first login; skip if still online after logout. */
  async finishLogin(): Promise<void> {
    if (this.modulesOnline()) {
      this.phase.set('complete');
      this.applyDesktopBanner();
      return;
    }

    const run = this.bootRun;
    this.phase.set('loading-modules');
    this.statusBanner.set(SysBanner.STARTING);

    if (!this.sim.isRunning()) {
      this.sim.start();
    }

    const slower = this.slowModuleLoad;
    this.slowModuleLoad = false;
    await this.staggerSections([...PANEL_BOOT_SEQUENCE], run, slower);
    if (run !== this.bootRun) {
      return;
    }

    this.modulesOnline.set(true);
    this.phase.set('complete');
    this.applyDesktopBanner();
  }

  private applyDesktopBanner(): void {
    this.fenceStatus.applyPostLoginIfScheduled();
    const msg = this.statusBanner();
    if (isBootTransientBanner(msg)) {
      this.statusBanner.set(SysBanner.READY);
    }
  }

  /** Full cold boot after SYSTEM COLLAPSE (game over modal). */
  async restartAfterCollapse(): Promise<void> {
    this.clearTimers();
    this.auth.logout();
    this.showRebootModal.set(false);
    this.fenceStatus.reset();
    this.sim.resetToInitial();
    this.modulesOnline.set(false);
    this.sectionStates.set(this.initialSectionMap('pending'));
    this.windowStates.set({});
    this.windowLoadGeneration.clear();
    await this.startColdBoot();
  }

  /** Exit to halted terminal — full stop until `system start`. */
  async shutdownSystem(): Promise<void> {
    const run = ++this.bootRun;
    this.clearTimers();
    this.auth.logout();
    this.showRebootModal.set(false);
    this.hardRebootActive.set(false);
    this.bootScreenTitle.set('JP-OS SYSTEM SHUTDOWN');
    this.phase.set('shutting-down');
    this.bootLines.set([]);
    this.fenceStatus.reset();
    this.statusBanner.set(SysBanner.SHUTDOWN);

    for (const line of SHUTDOWN_LINES) {
      if (run !== this.bootRun) {
        return;
      }
      this.bootLines.update((prev) => [...prev, line]);
      await this.delay(line === '' ? 120 : 320 + Math.random() * 280);
    }

    if (run !== this.bootRun) {
      return;
    }

    this.sim.stop();
    this.modulesOnline.set(false);
    this.sectionStates.set(this.initialSectionMap('pending'));
    this.windowStates.set({});
    this.windowLoadGeneration.clear();
    this.resetWindowManager();
    this.bootLines.set([]);
    this.phase.set('system-ready');
    this.statusBanner.set(SysBanner.HALTED);
  }

  async runSystemReadyCommand(line: string): Promise<string> {
    const cmd = line.trim().toLowerCase().replace(/_/g, ' ');
    if (cmd === 'system start') {
      void this.scheduleSystemStart();
      return 'BOOT SEQUENCE INITIATED.';
    }
    if (cmd === 'help') {
      return 'HALTED SYSTEM COMMANDS:\n  system start — cold boot JP-OS kernel';
    }
    return 'UNKNOWN COMMAND — SYSTEM HALTED. TYPE: system start';
  }

  isSectionReady(id: BootSectionId): boolean {
    return this.sectionStates()[id] === 'ready';
  }

  isWindowReady(windowId: string): boolean {
    return this.windowStates()[windowId] === 'ready';
  }

  sectionMessage(id: BootSectionId): string {
    return BOOT_SECTION_MESSAGES[id];
  }

  windowMessage(app: DockApp): string {
    return BOOT_SECTION_MESSAGES[windowBootSection(app)];
  }

  markWindowReady(windowId: string): void {
    this.windowLoadGeneration.delete(windowId);
    this.windowStates.update((prev) => ({ ...prev, [windowId]: 'ready' }));
  }

  beginWindowLoad(windowId: string): void {
    const gen = (this.windowLoadGeneration.get(windowId) ?? 0) + 1;
    this.windowLoadGeneration.set(windowId, gen);
    this.windowStates.update((prev) => ({ ...prev, [windowId]: 'loading' }));
    void this.runWindowLoad(windowId, gen);
  }

  releaseWindow(windowId: string): void {
    this.windowLoadGeneration.delete(windowId);
    this.windowStates.update((prev) => {
      const next = { ...prev };
      delete next[windowId];
      return next;
    });
  }

  promptHardReboot(): void {
    this.showRebootModal.set(true);
  }

  cancelHardReboot(): void {
    this.showRebootModal.set(false);
  }

  confirmHardReboot(): void {
    this.showRebootModal.set(false);
    void this.runHardReboot();
  }

  private async scheduleSystemStart(): Promise<void> {
    if (this.phase() !== 'system-ready' || this.systemReadyBusy()) {
      return;
    }
    this.systemReadyBusy.set(true);
    try {
      const ms = 420 + Math.floor(Math.random() * 780);
      await this.delay(ms);
      if (this.phase() !== 'system-ready') {
        return;
      }
      await this.startColdBoot();
    } finally {
      this.systemReadyBusy.set(false);
    }
  }

  private initialSectionMap(
    state: BootSectionState,
  ): Record<BootSectionId, BootSectionState> {
    const map = {} as Record<BootSectionId, BootSectionState>;
    for (const id of ALL_BOOT_SECTIONS) {
      map[id] = state;
    }
    return map;
  }

  private clearTimers(): void {
    for (const t of this.timers) {
      clearTimeout(t);
    }
    this.timers = [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      this.timers.push(t);
    });
  }

  private setSection(id: BootSectionId, state: BootSectionState): void {
    this.sectionStates.update((prev) => ({ ...prev, [id]: state }));
  }

  private async runWindowLoad(windowId: string, gen: number): Promise<void> {
    await this.delay(randomBootDelayMs());
    if (this.windowLoadGeneration.get(windowId) !== gen) {
      return;
    }
    this.windowStates.update((prev) => ({ ...prev, [windowId]: 'ready' }));
  }

  private async startColdBoot(): Promise<void> {
    const run = ++this.bootRun;
    this.clearTimers();
    this.hardRebootActive.set(false);
    this.bootScreenTitle.set('JP-OS SYSTEM BOOT');
    this.phase.set('boot-screen');
    this.sectionStates.set(this.initialSectionMap('pending'));
    this.windowStates.set({});
    this.windowLoadGeneration.clear();
    this.resetWindowManager();
    this.bootLines.set([]);
    this.fenceStatus.reset();
    this.statusBanner.set(SysBanner.COLD_START);

    for (const line of COLD_BOOT_LINES) {
      if (run !== this.bootRun) {
        return;
      }
      this.bootLines.update((prev) => [...prev, line]);
      await this.delay(line === '' ? 120 : 280 + Math.random() * 220);
    }

    if (run !== this.bootRun) {
      return;
    }

    this.phase.set('awaiting-login');
    this.statusBanner.set(SysBanner.AWAITING_LOGIN);
  }

  private async runHardReboot(): Promise<void> {
    const run = ++this.bootRun;
    this.clearTimers();
    this.auth.logout();
    this.hardRebootActive.set(true);
    this.bootScreenTitle.set('JP-OS HARD REBOOT');
    this.phase.set('boot-screen');
    this.modulesOnline.set(false);
    this.sectionStates.set(this.initialSectionMap('pending'));
    this.windowStates.set({});
    this.windowLoadGeneration.clear();
    this.resetWindowManager();
    this.bootLines.set([]);
    this.fenceStatus.beginHardReboot();
    this.sim.queueAction('system_hard_reboot');

    for (const line of HARD_REBOOT_LINES) {
      if (run !== this.bootRun) {
        return;
      }
      this.bootLines.update((prev) => [...prev, line]);
      await this.delay(400 + Math.random() * 350);
    }

    if (run !== this.bootRun) {
      return;
    }

    this.slowModuleLoad = true;
    this.phase.set('awaiting-login');
    this.hardRebootActive.set(false);
  }

  private resetWindowManager(): void {
    void import('../../features/window-manager/window-manager.service').then(
      ({ WindowManagerService }) => {
        this.injector.get(WindowManagerService).resetAll();
      },
    );
  }

  private async staggerSections(
    sequence: BootSectionId[],
    run: number,
    slower = false,
  ): Promise<void> {
    for (const id of sequence) {
      if (run !== this.bootRun) {
        return;
      }
      this.setSection(id, 'loading');
      const base = randomBootDelayMs();
      await this.delay(slower ? base + 800 : base);
      if (run !== this.bootRun) {
        return;
      }
      this.setSection(id, 'ready');
    }
  }
}
