import { Injectable, inject, signal } from '@angular/core';
import {
  SimulationEngine,
  type SimulationSnapshot,
  type SimulationState,
} from '../../../simulation';
import type { OperatorIdentity } from '../../../simulation/engine';
import type { TutorialProgressEvent } from '../../../simulation/systems/tutorial-script';
import type { DifficultyMode } from '../../../simulation/types';
import { SaveService } from './save.service';
export interface UiTickPayload {
  snapshot: SimulationSnapshot;
  audioAlerts: string[];
}

@Injectable({ providedIn: 'root' })
export class SimulationBridgeService {
  readonly snapshot = signal<SimulationSnapshot | null>(null);
  private engine = new SimulationEngine();
  private audioHandler: ((alerts: string[]) => void) | null = null;
  constructor(private readonly save: SaveService) {}

  start(): void {
    const loaded = this.save.load();
    if (loaded) {
      this.engine.loadState(loaded);
    }
    this.snapshot.set(this.engine.getSnapshot());
    this.engine.start((result) => {
      this.snapshot.set(result.snapshot);
      this.audioHandler?.(result.audioAlerts);
      if (result.autosave) {
        this.save.save(this.engine.getMutableStateForSave());
      }
    });
  }

  stop(): void {
    this.engine.stop();
  }

  /** New run after game over — fresh simulation, no save. */
  resetToInitial(
    seed?: number,
    difficulty: DifficultyMode = 'normal',
    operator?: OperatorIdentity,
  ): void {
    this.save.clear();
    this.engine.resetToInitial(seed, difficulty, operator);
    this.snapshot.set(null);
  }

  setOperatorIdentity(operator: OperatorIdentity | null): void {
    this.engine.setOperatorIdentity(operator);
    const snap = this.snapshot();
    if (snap && operator) {
      this.snapshot.set(this.engine.getSnapshot());
    }
  }
  applyMailInfection(delta: number): void {
    this.engine.applyMailInfection(delta);
    this.snapshot.set(this.engine.getSnapshot());
  }

  operatorHandoff(): void {
    this.engine.operatorHandoff();
    this.snapshot.set(this.engine.getSnapshot());
  }

  runTicks(count: number): void {
    for (let i = 0; i < count; i++) {
      this.engine.runTick();
      this.snapshot.set(this.engine.getSnapshot());
      if (this.engine.getSnapshot().gameOver) {
        break;
      }
    }
  }

  getRunSeed(): number {
    return this.engine.getRunSeed();
  }

  startTourBonus(): void {
    this.engine.startTourBonus();
    this.snapshot.set(this.engine.getSnapshot());
  }

  isRunning(): boolean {
    return this.engine.isRunning();
  }

  onAudio(handler: (alerts: string[]) => void): void {
    this.audioHandler = handler;
  }

  queueAction(type: string, params?: Record<string, string | number>): void {
    this.engine.queuePlayerAction(type, params);
    this.snapshot.set(this.engine.getSnapshot());
  }

  reportTutorialProgress(event: TutorialProgressEvent): void {
    this.engine.reportTutorialProgress(event);
    this.snapshot.set(this.engine.getSnapshot());
  }

  runTerminal(line: string): string {
    const out = this.engine.runTerminal(line);
    this.snapshot.set(this.engine.getSnapshot());
    return out;
  }

  manualSave(): void {
    this.save.save(this.engine.getMutableStateForSave());
  }

  exportState(): SimulationState {
    return this.engine.getMutableStateForSave();
  }
}
