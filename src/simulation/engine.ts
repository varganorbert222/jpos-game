import { TICK_REALTIME_MS } from './constants';
import {
  generateRunSeed,
  getParamNumber,
  logRunSeed,
  type DifficultyId,
} from './gameplay-config';
import { createInitialState } from './initial-state';
import { SeededRng } from './rng';
import type { DifficultyMode } from './types';
import {
  parseTerminalCommand,
  processActionQueue,
  queueAction,
} from './actions';
import { updateWeather } from './systems/weather';
import { updatePowerGrid } from './systems/power';
import { updateFences } from './systems/fence';
import { updateDinosaurAi } from './systems/dinosaur-ai';
import { updateFieldOps } from './systems/field-ops';
import { updateLogistics } from './systems/logistics';
import { updateStaff } from './systems/staff';
import { generateEvents, resolveEventsByPriority } from './systems/events';
import {
  advanceTutorialScript,
  isTutorialTickFrozen,
  notifyTutorialProgress,
  type TutorialProgressEvent,
} from './systems/tutorial-script';
import { propagateConsequences } from './systems/consequences';
import type { SimulationSnapshot, SimulationState } from './types';

export interface TickResult {
  snapshot: SimulationSnapshot;
  audioAlerts: string[];
  autosave: boolean;
}

export interface OperatorIdentity {
  username: string;
  displayLabel: string;
}

export class SimulationEngine {
  private state: SimulationState;
  private rng: SeededRng;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private onTick?: (result: TickResult) => void;
  private pendingOperator: OperatorIdentity | null = null;

  constructor(seed?: number, difficulty: DifficultyMode = 'normal') {
    const runSeed = seed ?? (difficulty === 'tutorial' ? 0x5455544f : generateRunSeed());
    this.state = createInitialState(runSeed, difficulty);
    this.rng = new SeededRng(this.state.rngSeed);
    logRunSeed(runSeed, difficulty as DifficultyId);
  }

  getSnapshot(): SimulationSnapshot {
    return deepFreeze(structuredClone(this.state));
  }

  getMutableStateForSave(): SimulationState {
    return structuredClone(this.state);
  }

  loadState(saved: SimulationState): void {
    this.state = saved;
    this.rng = new SeededRng(saved.rngSeed);
  }

  start(onTick: (result: TickResult) => void): void {
    this.onTick = onTick;
    if (this.timerId) {
      return;
    }
    this.timerId = setInterval(() => this.runTick(), TICK_REALTIME_MS);
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  resetToInitial(
    seed?: number,
    difficulty: DifficultyMode = 'normal',
    operator?: OperatorIdentity,
  ): void {
    this.stop();
    const runSeed = seed ?? (difficulty === 'tutorial' ? 0x5455544f : generateRunSeed());
    this.state = createInitialState(runSeed, difficulty);
    this.applyOperator(operator ?? this.pendingOperator);
    this.rng = new SeededRng(this.state.rngSeed);
    logRunSeed(runSeed, difficulty as DifficultyId);
  }

  setOperatorIdentity(operator: OperatorIdentity | null): void {
    this.pendingOperator = operator;
    if (this.state && operator) {
      this.applyOperator(operator);
    }
  }

  private applyOperator(operator: OperatorIdentity | null): void {
    if (!operator) {
      return;
    }
    this.state.operatorUsername = operator.username;
    this.state.operatorDisplayLabel = operator.displayLabel;
    this.state.logEntries.push(
      `[AUTH] Operator ${operator.displayLabel} (${operator.username}) on station.`,
    );
  }

  isRunning(): boolean {
    return this.timerId !== null;
  }

  queuePlayerAction(type: string, params?: Record<string, string | number>): void {
    queueAction(this.state, type, params);
  }

  runTerminal(line: string): string {
    return parseTerminalCommand(this.state, line);
  }

  /** Headless ticks (playtest bot). */
  runTicks(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.state.gameOver) {
        break;
      }
      this.runTick();
    }
  }

  getRunSeed(): number {
    return this.state.runSeed;
  }

  applyMailInfection(delta: number): void {
    this.state.infectionLevel = Math.min(100, this.state.infectionLevel + delta);
    this.state.logEntries.push('[MAIL] Unauthorized payload — system compromised.');
    this.state.alertEntries.push('CRITICAL: MAIL-BUS INFECTION');
  }

  startTourBonus(): void {
    this.state.tourBonusTicksRemaining = getParamNumber('tourBonusQuietTicks');
    this.state.logEntries.push('[TOUR] Active — incident rate reduced temporarily.');
  }

  reportTutorialProgress(event: TutorialProgressEvent): void {
    notifyTutorialProgress(this.state, event);
  }

  operatorHandoff(): void {
    this.state.operatorSlot++;
    this.state.shiftObjectiveWon = false;
    this.state.logEntries.push(
      `[SHIFT] Operator handoff — slot ${this.state.operatorSlot} assuming control.`,
    );
    this.state.alertEntries.push(`OPERATOR ${this.state.operatorSlot} ON STATION`);
  }

  runTick(): void {
    if (this.state.gameOver) {
      return;
    }

    if (this.state.difficultyMode === 'tutorial' && !this.state.tutorialScriptComplete) {
      if (!this.state.tutorialBegun) {
        advanceTutorialScript(this.state);
      }
      if (isTutorialTickFrozen(this.state)) {
        this.emitTickResult([]);
        return;
      }
    }

    this.state.tick++;
    this.state.elapsedRealtimeMs += TICK_REALTIME_MS;
    this.state.rngSeed = this.rng.getSeed();

    processActionQueue(this.state);

    // Strict update order — spec §3.2
    updateWeather(this.state, this.rng);
    updatePowerGrid(this.state, this.rng);
    updateFences(this.state);
    updateDinosaurAi(this.state, this.rng);
    updateLogistics(this.state);
    updateStaff(this.state, this.rng);
    updateFieldOps(this.state);
    if (this.state.difficultyMode === 'tutorial') {
      advanceTutorialScript(this.state);
    } else {
      generateEvents(this.state, this.rng);
    }
    resolveEventsByPriority(this.state);
    propagateConsequences(this.state);

    const audioAlerts: string[] = [];
    if (this.state.globalBlackout) {
      audioAlerts.push('alarm_blackout');
    }
    if (this.state.activeEvents.some((e) => e.severity === 'critical')) {
      audioAlerts.push('alarm_critical');
    }
    if (this.state.alertEntries.length > 5) {
      audioAlerts.push('alarm_fatigue');
    }

    const autosaveInterval = getParamNumber('autosaveIntervalTicks');
    const autosave =
      this.state.tick > 0 && this.state.tick % autosaveInterval === 0;
    this.state.autosaveDue = autosave;

    this.emitTickResult(audioAlerts, autosave);
  }

  private emitTickResult(audioAlerts: string[], autosave = false): void {
    this.onTick?.({
      snapshot: this.getSnapshot(),
      audioAlerts,
      autosave,
    });
  }
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key];
      if (val && typeof val === 'object') {
        deepFreeze(val);
      }
    }
  }
  return obj;
}
