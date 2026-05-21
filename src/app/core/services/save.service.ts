import { Injectable } from '@angular/core';
import type { SimulationState } from '../../../simulation';

const SAVE_KEY = 'jpos_ops_os_save_v3';

@Injectable({ providedIn: 'root' })
export class SaveService {
  save(state: SimulationState): void {
    const json = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, json);
  }

  load(): SimulationState | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as SimulationState;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
