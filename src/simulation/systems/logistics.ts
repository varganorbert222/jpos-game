import type { SimulationState } from '../types';

export function updateLogistics(state: SimulationState): void {
  const logisticsPower = state.powerAllocation.logistics;
  const stormDelay = state.weather === 'Storm' ? 2 : 0;

  if (state.helicopter.busyTicks > 0) {
    state.helicopter.busyTicks = Math.max(0, state.helicopter.busyTicks - 1);
  }

  for (const team of state.teams) {
    if (team.busyTicks > 0) {
      const rate = logisticsPower < 30 ? 1 : 2;
      team.busyTicks = Math.max(0, team.busyTicks - rate - stormDelay);
    }
    if (state.weather === 'Storm') {
      team.fatigue = Math.min(100, team.fatigue + 1);
    }
  }
}
