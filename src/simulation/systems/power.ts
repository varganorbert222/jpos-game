import type { SimulationState } from '../types';
import { SeededRng } from '../rng';

export function updatePowerGrid(state: SimulationState, rng: SeededRng): void {
  let offlineCount = 0;

  for (const gen of state.generators) {
    if (!gen.online) {
      offlineCount++;
      continue;
    }

    gen.fuel = Math.max(0, gen.fuel - gen.load * 0.02);

    if (gen.load > 80) {
      gen.temperature = Math.min(100, gen.temperature + 2);
    } else if (gen.load < 40) {
      gen.temperature = Math.max(0, gen.temperature - 1);
    }

    if (gen.temperature > 85 && rng.chance(0.05)) {
      gen.online = false;
      state.logEntries.push(`[PWR] Generator ${gen.id} overheated.`);
    }

    if (gen.fuel <= 0) {
      gen.online = false;
      state.logEntries.push(`[PWR] Generator ${gen.id} fuel depleted.`);
    }
  }

  if (offlineCount >= 2) {
    state.globalBlackout = true;
    state.blackoutTicks++;
    applyBlackoutEffects(state);
  } else {
    state.globalBlackout = false;
  }

  if (state.resources.tranquilizerAmmo === 0) {
    state.helicopter.enabled = false;
  }
}

function applyBlackoutEffects(state: SimulationState): void {
  let camOff = 0;
  for (let i = 0; i < state.cameras.length; i++) {
    if (i % 2 === 0) {
      state.cameras[i].state = 'Offline';
      camOff++;
    }
  }

  for (const fence of state.fences) {
    fence.voltage = Math.max(0, fence.voltage * 0.6);
    fence.stress = Math.min(100, fence.stress + 2);
  }

  for (const dino of state.dinosaurs) {
    dino.stress = Math.min(100, dino.stress + 10);
  }

  if (state.blackoutTicks === 1) {
    state.logEntries.push('[PWR] GLOBAL BLACKOUT — cascade initiated.');
    state.alertEntries.push('CRITICAL: Total grid failure');
  }
}
