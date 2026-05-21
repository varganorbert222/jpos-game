import type { SimulationState } from '../types';
import { SeededRng } from '../rng';

export function updateWeather(state: SimulationState, rng: SeededRng): void {
  if (state.weather === 'Clear' && rng.chance(0.02)) {
    state.weather = 'Storm';
    state.telemetryCorruption = Math.min(100, state.telemetryCorruption + 25);
    state.logEntries.push('[WX] Storm front detected — sensor accuracy degraded.');
  } else if (state.weather === 'Storm' && rng.chance(0.08)) {
    state.weather = 'Clear';
    state.telemetryCorruption = Math.max(0, state.telemetryCorruption - 15);
    state.logEntries.push('[WX] Storm clearing.');
  }
}
