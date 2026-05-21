import type { Fence, SimulationState } from '../types';

function deriveFenceState(fence: Fence): void {
  if (fence.integrity <= 0 || fence.state === 'Breached') {
    fence.state = 'Breached';
    return;
  }
  if (fence.stress >= 85) {
    fence.state = 'Sparking';
  } else if (fence.stress >= 65) {
    fence.state = 'Intermittent';
  } else if (fence.stress >= 45 || fence.integrity < 40) {
    fence.state = 'Unstable';
  } else {
    fence.state = 'Stable';
  }
}

export function updateFences(state: SimulationState): void {
  const storm = state.weather === 'Storm';

  for (const fence of state.fences) {
    if (state.tick > 0 && state.tick % 5 === 0) {
      fence.integrity = Math.max(0, fence.integrity - 1);
    }

    if (storm) {
      fence.stress = Math.min(100, fence.stress + 3);
    }

    const zoneDinos = state.dinosaurs.filter((d) => d.zoneId === fence.zoneId);
    for (const dino of zoneDinos) {
      if (dino.aggression > 70) {
        fence.stress = Math.min(100, fence.stress + 2);
      }
      if (dino.aiState === 'FenceTesting' && dino.targetFenceId === fence.id) {
        fence.stress = Math.min(100, fence.stress + 5);
      }
    }

    if (fence.voltage < 40) {
      fence.learnedWeaknessTicks++;
    } else {
      fence.learnedWeaknessTicks = 0;
    }

    deriveFenceState(fence);

    if (fence.integrity <= 0 || fence.stress >= 100) {
      if (fence.state !== 'Breached') {
        fence.state = 'Breached';
        state.breachCount++;
        state.stability = Math.max(0, state.stability - 8);
        state.logEntries.push(`[FNC] Fence ${fence.id} BREACHED in ${state.zones[fence.zoneId].name}.`);
        state.alertEntries.push(`BREACH: Fence ${fence.id}`);
        if (fence.zoneId === 5) {
          state.visitorSectorCompromisedTicks++;
        }
      }
    }
  }
}
