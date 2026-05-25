import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { FieldOperation } from '../../../simulation/types';
import { formatElapsedClock } from '../utils/run-score';
import { SimulationBridgeService } from './simulation-bridge.service';
import { TerminalSessionService } from './terminal-session.service';
import {
  actionParamKey,
  formatActionCommand,
  queueHasDuplicate,
} from '../utils/player-action.util';

export type ActionFeedPhase = 'queued' | 'running' | 'done';

export interface ActionFeedRow {
  key: string;
  command: string;
  phase: ActionFeedPhase;
  phaseLabel: string;
  timeLabel: string;
  occurredAtMs: number;
}

export interface PendingActionView {
  id: number;
  command: string;
  paramKey: string;
  ticksUntil: number;
}

const ACTION_HISTORY_LIMIT = 32;

interface CompletedAction {
  key: string;
  command: string;
  completedAtMs: number;
}

@Injectable({ providedIn: 'root' })
export class PlayerActionService {
  private readonly sim = inject(SimulationBridgeService);
  private readonly terminal = inject(TerminalSessionService);

  private readonly trackedPending = new Map<
    number,
    {
      type: string;
      params: Record<string, string | number>;
      queuedAtMs: number;
    }
  >();

  private readonly fieldOpStartedAt = new Map<number, number>();

  private readonly completedHistory = signal<readonly CompletedAction[]>([]);

  readonly pendingActions = computed((): PendingActionView[] => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    return snap.actionQueue.map((a) => ({
      id: a.id,
      command: formatActionCommand(a.type, a.params),
      paramKey: actionParamKey(a.type, a.params),
      ticksUntil: Math.max(0, a.executeTick - snap.tick),
    }));
  });

  readonly actionFeed = computed((): ActionFeedRow[] => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    const nowMs = snap.elapsedRealtimeMs;
    const rows: ActionFeedRow[] = [];

    const currentFieldIds = new Set(snap.fieldOps.map((o) => o.id));
    for (const id of this.fieldOpStartedAt.keys()) {
      if (!currentFieldIds.has(id)) {
        this.fieldOpStartedAt.delete(id);
      }
    }

    for (const op of snap.fieldOps) {
      if (!this.fieldOpStartedAt.has(op.id)) {
        this.fieldOpStartedAt.set(op.id, nowMs);
      }
      const atMs = this.fieldOpStartedAt.get(op.id) ?? nowMs;
      rows.push(this.toFeedRow(
        `field-${op.id}`,
        this.fieldOpCommand(op),
        'running',
        atMs,
      ));
    }

    for (const a of snap.actionQueue) {
      const ticksUntil = Math.max(0, a.executeTick - snap.tick);
      const tracked = this.trackedPending.get(a.id);
      const atMs = tracked?.queuedAtMs ?? nowMs;
      rows.push(
        this.toFeedRow(
          `queue-${a.id}`,
          formatActionCommand(a.type, a.params),
          ticksUntil <= 0 ? 'running' : 'queued',
          atMs,
        ),
      );
    }

    for (const done of this.completedHistory()) {
      rows.push(
        this.toFeedRow(done.key, done.command, 'done', done.completedAtMs),
      );
    }

    const order: Record<ActionFeedPhase, number> = {
      running: 0,
      queued: 1,
      done: 2,
    };
    return rows.sort((a, b) => order[a.phase] - order[b.phase]);
  });

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      if (!snap) {
        this.trackedPending.clear();
        this.fieldOpStartedAt.clear();
        return;
      }
      const currentIds = new Set(snap.actionQueue.map((a) => a.id));
      for (const [id, action] of this.trackedPending) {
        if (!currentIds.has(id)) {
          const cmd = formatActionCommand(action.type, action.params);
          this.terminal.logLine(`OK: ${cmd}`);
          this.pushCompleted(cmd, snap.elapsedRealtimeMs);
          this.trackedPending.delete(id);
        }
      }
      for (const a of snap.actionQueue) {
        if (!this.trackedPending.has(a.id)) {
          this.trackedPending.set(a.id, {
            type: a.type,
            params: { ...a.params },
            queuedAtMs: snap.elapsedRealtimeMs,
          });
        }
      }
    });
  }

  isDuplicate(type: string, params?: Record<string, string | number>): boolean {
    const snap = this.sim.snapshot();
    if (!snap) {
      return false;
    }
    return queueHasDuplicate(snap.actionQueue, type, params ?? {});
  }

  tryQueue(type: string, params?: Record<string, string | number>): boolean {
    const snap = this.sim.snapshot();
    if (!snap) {
      return false;
    }
    const p = params ?? {};
    if (queueHasDuplicate(snap.actionQueue, type, p)) {
      this.terminal.logLine(
        `> ${formatActionCommand(type, p)} — blocked (already queued)`,
      );
      return false;
    }
    const cmd = formatActionCommand(type, p);
    this.sim.queueAction(type, p);
    this.terminal.logLine(`> ${cmd}`);
    return true;
  }

  resetHistory(): void {
    this.completedHistory.set([]);
    this.trackedPending.clear();
    this.fieldOpStartedAt.clear();
  }

  private pushCompleted(command: string, completedAtMs: number): void {
    const key = `done-${completedAtMs}-${command}`;
    this.completedHistory.update((prev) => {
      const next = [{ key, command, completedAtMs }, ...prev];
      return next.slice(0, ACTION_HISTORY_LIMIT);
    });
  }

  private toFeedRow(
    key: string,
    command: string,
    phase: ActionFeedPhase,
    occurredAtMs: number,
  ): ActionFeedRow {
    return {
      key,
      command,
      phase,
      phaseLabel: phase.toUpperCase(),
      occurredAtMs,
      timeLabel: formatElapsedClock(occurredAtMs),
    };
  }

  private fieldOpCommand(op: FieldOperation): string {
    switch (op.kind) {
      case 'patrol':
        return `dispatch_patrol ${op.targetZoneId}`;
      case 'seal_breach':
        return `seal_breach ${op.targetEntityId}`;
      case 'generator_restart':
        return `generator_restart ${op.targetEntityId}`;
      case 'sedate':
        return `dino_sedate ${op.targetEntityId}`;
      default:
        return op.kind;
    }
  }
}
