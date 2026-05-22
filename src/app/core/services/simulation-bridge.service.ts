import { Injectable, signal } from '@angular/core';
import { SimulationEngine, type SimulationSnapshot, type SimulationState } from '../../../simulation';
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
  resetToInitial(): void {
    this.save.clear();
    this.engine.resetToInitial();
    this.snapshot.set(null);
  }

  isRunning(): boolean {
    return this.engine.isRunning();
  }

  onAudio(handler: (alerts: string[]) => void): void {
    this.audioHandler = handler;
  }

  queueAction(type: string, params?: Record<string, string | number>): void {
    this.engine.queuePlayerAction(type, params);
  }

  runTerminal(line: string): string {
    return this.engine.runTerminal(line);
  }

  manualSave(): void {
    this.save.save(this.engine.getMutableStateForSave());
  }

  exportState(): SimulationState {
    return this.engine.getMutableStateForSave();
  }
}
