import { getParamNumber } from '../gameplay-config';
import type { SimulationState } from '../types';
import { SeededRng } from '../rng';

export function updateStaff(state: SimulationState, rng: SeededRng): void {
  const lowStability = state.stability < 40;

  for (const team of state.teams) {
    if (team.fatigue > 75) {
      team.fatigue = Math.min(100, team.fatigue + 0.5);
    } else {
      team.fatigue = Math.max(0, team.fatigue - 0.3);
    }

    if (lowStability && team.busyTicks > 0 && rng.chance(0.05)) {
      team.busyTicks = 0;
      state.logEntries.push(`[STF] Team ${team.id} aborted assignment — morale critical.`);
    }

    if (lowStability && rng.chance(0.03)) {
      state.logEntries.push(`[STF] Team ${team.id} refused dangerous assignment.`);
    }
  }

  const camerasOffline =
    state.cameras.filter((c) => c.state === 'Offline').length / state.cameras.length;
  const camInterval = getParamNumber('staffCameraAggressionIntervalTicks');
  if (
    camerasOffline > 0.5 &&
    camInterval > 0 &&
    state.tick % camInterval === 0
  ) {
    const bump = getParamNumber('staffCameraAggressionBump');
    for (const dino of state.dinosaurs) {
      dino.aggression = Math.min(100, dino.aggression + bump);
    }
  }
}
