import { getParamNumber } from '../gameplay-config';
import type { Dinosaur, SimulationState } from '../types';
import { SeededRng } from '../rng';

const FENCE_PROBE_SPECIES = new Set(['Raptor', 'Dilo', 'Spino']);
const PLACID_SPECIES = new Set(['Brachio', 'Trike']);

function speciesFenceTestMultiplier(species: string): number {
  if (FENCE_PROBE_SPECIES.has(species)) {
    return 1.12;
  }
  if (PLACID_SPECIES.has(species)) {
    return 0.4;
  }
  return 0.85;
}

export function updateDinosaurAi(state: SimulationState, rng: SeededRng): void {
  const chaosNearby = state.activeEvents.some(
    (e) => e.severity === 'critical' && !e.resolved,
  );

  for (const dino of state.dinosaurs) {
    if (dino.fenceTestCooldownTicks == null) {
      dino.fenceTestCooldownTicks = 0;
    }
    if (dino.fenceTestCooldownTicks > 0) {
      dino.fenceTestCooldownTicks--;
    }
    dino.ticksInState++;

    switch (dino.aiState) {
      case 'Idle': {
        const interval = getParamNumber('dinoRoamingIntervalTicks');
        if (dino.ticksInState > 0 && dino.ticksInState % interval === 0 && rng.chance(getParamNumber('dinoRoamingChance'))) {
          transition(dino, 'Roaming');
        }
        break;
      }
      case 'Roaming':
        if (dino.stress >= getParamNumber('dinoAgitatedStressThreshold')) {
          transition(dino, 'Agitated');
        }
        break;
      case 'Agitated':
        maybeBeginFenceTesting(state, dino, rng);
        if (dino.stress < getParamNumber('dinoAgitatedStressThreshold') - 8) {
          transition(dino, 'Roaming');
        }
        break;
      case 'FenceTesting':
        if (dino.ticksInState >= getParamNumber('dinoFenceTestMaxTicks')) {
          endFenceTesting(dino);
          break;
        }
        if (
          dino.stress >= getParamNumber('dinoHuntingStressMin') &&
          (chaosNearby || rng.chance(getParamNumber('dinoHuntingChancePerTick')))
        ) {
          transition(dino, 'Hunting');
          break;
        }
        if (dino.stress < getParamNumber('dinoFenceTestStressMin') - 10) {
          endFenceTesting(dino);
        }
        break;
      case 'Hunting':
        if (dino.stress < 55 && !chaosNearby) {
          transition(dino, 'Roaming');
          dino.fenceTestCooldownTicks = Math.max(
            dino.fenceTestCooldownTicks,
            Math.floor(getParamNumber('dinoFenceTestCooldownTicks') * 0.6),
          );
        }
        break;
    }

    dino.visibleAggression = Math.min(
      100,
      Math.round(dino.aggression * 0.6 + dino.stress * 0.4),
    );

    if (dino.aiState === 'Agitated' || dino.aiState === 'Hunting') {
      dino.stress = Math.min(100, dino.stress + getParamNumber('dinoStressGainAgitated'));
    } else {
      dino.stress = Math.max(0, dino.stress - getParamNumber('dinoStressDecayPerTick'));
    }

    if (dino.aiState !== 'Agitated' && dino.aiState !== 'Hunting') {
      dino.aggression = Math.max(0, dino.aggression - getParamNumber('dinoAggressionDecayPerTick'));
    }
  }
}

function maybeBeginFenceTesting(
  state: SimulationState,
  dino: Dinosaur,
  rng: SeededRng,
): void {
  if (dino.fenceTestCooldownTicks > 0) {
    return;
  }
  if (dino.ticksInState < getParamNumber('dinoFenceTestAgitatedTicksMin')) {
    return;
  }
  if (dino.aggression < getParamNumber('dinoFenceTestAggressionMin')) {
    return;
  }
  if (dino.stress < getParamNumber('dinoFenceTestStressMin')) {
    return;
  }

  const tendency =
    (dino.escalationTendency / 100) * (dino.patternRecognition / 100 + 0.35) * speciesFenceTestMultiplier(dino.species);
  const chance = getParamNumber('dinoFenceTestChancePerTick') * tendency;
  if (!rng.chance(chance)) {
    return;
  }

  const fence = pickTargetFence(state, dino, rng);
  dino.targetFenceId = fence?.id ?? null;
  transition(dino, 'FenceTesting');
}

function endFenceTesting(dino: Dinosaur): void {
  dino.targetFenceId = null;
  dino.fenceTestCooldownTicks = getParamNumber('dinoFenceTestCooldownTicks');
  transition(dino, 'Roaming');
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
  const weak = zoneFences.filter(
    (f) => f.voltage < 40 || f.learnedWeaknessTicks > 10 || f.stress >= 55,
  );
  const pool = weak.length > 0 && dino.patternRecognition > 40 ? weak : zoneFences;
  return pool[rng.nextInt(pool.length)];
}
