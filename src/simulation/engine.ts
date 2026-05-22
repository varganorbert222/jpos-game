import { AUTOSAVE_INTERVAL_TICKS, TICK_REALTIME_MS } from './constants';
import { createInitialState } from './initial-state';
import { SeededRng } from './rng';
import { parseTerminalCommand, processActionQueue, queueAction } from './actions';
import { updateWeather } from './systems/weather';
import { updatePowerGrid } from './systems/power';
import { updateFences } from './systems/fence';
import { updateDinosaurAi } from './systems/dinosaur-ai';
import { updateLogistics } from './systems/logistics';
import { updateStaff } from './systems/staff';
import { generateEvents, resolveEventsByPriority } from './systems/events';
import { propagateConsequences } from './systems/consequences';
import type { SimulationSnapshot, SimulationState } from './types';

export interface TickResult {
  snapshot: SimulationSnapshot;
  audioAlerts: string[];
  autosave: boolean;
}

export class SimulationEngine {
  private state: SimulationState;
  private rng: SeededRng;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private onTick?: (result: TickResult) => void;

  constructor(seed?: number) {
    this.state = createInitialState(seed);
    this.rng = new SeededRng(this.state.rngSeed);
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

  resetToInitial(seed?: number): void {
    this.stop();
    this.state = createInitialState(seed);
    this.rng = new SeededRng(this.state.rngSeed);
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

  runTick(): void {
    if (this.state.gameOver) {
      return;
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
    generateEvents(this.state, this.rng);
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

    const autosave = this.state.tick > 0 && this.state.tick % AUTOSAVE_INTERVAL_TICKS === 0;
    this.state.autosaveDue = autosave;

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
