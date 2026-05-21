import type { Dinosaur, SimulationState } from '../types';
import { SeededRng } from '../rng';

export function updateDinosaurAi(state: SimulationState, rng: SeededRng): void {
  const chaosNearby = state.activeEvents.some(
    (e) => e.severity === 'critical' && !e.resolved,
  );

  for (const dino of state.dinosaurs) {
    dino.ticksInState++;

    switch (dino.aiState) {
      case 'Idle':
        if (dino.ticksInState > 0 && dino.ticksInState % 10 === 0 && rng.chance(0.2)) {
          transition(dino, 'Roaming');
        }
        break;
      case 'Roaming':
        if (dino.stress > 60) {
          transition(dino, 'Agitated');
        }
        break;
      case 'Agitated':
        if (dino.aggression > 70) {
          const fence = pickTargetFence(state, dino, rng);
          dino.targetFenceId = fence?.id ?? null;
          transition(dino, 'FenceTesting');
        }
        break;
      case 'FenceTesting':
        if (chaosNearby || dino.stress > 80) {
          transition(dino, 'Hunting');
        }
        break;
      case 'Hunting':
        if (dino.stress < 50 && !chaosNearby) {
          transition(dino, 'Roaming');
        }
        break;
    }

    dino.visibleAggression = Math.min(
      100,
      Math.round(dino.aggression * 0.6 + dino.stress * 0.4),
    );

    if (dino.aiState === 'Agitated' || dino.aiState === 'Hunting') {
      dino.stress = Math.min(100, dino.stress + 1);
    } else {
      dino.stress = Math.max(0, dino.stress - 0.5);
    }
  }
}

function transition(dino: Dinosaur, next: Dinosaur['aiState']): void {
  dino.aiState = next;
  dino.ticksInState = 0;
}

function pickTargetFence(
  state: SimulationState,
  dino: Dinosaur,
  rng: SeededRng,
): (typeof state.fences)[0] | undefined {
  const zoneFences = state.fences.filter((f) => f.zoneId === dino.zoneId);
  const weak = zoneFences.filter((f) => f.voltage < 40 || f.learnedWeaknessTicks > 10);
  const pool = weak.length > 0 ? weak : zoneFences;
  return pool[rng.nextInt(pool.length)];
}
