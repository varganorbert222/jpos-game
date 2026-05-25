import { getParamNumber } from '../gameplay-config';
import type { GameEvent, SimulationState } from '../types';

export function clampStability(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function applyStabilityDelta(state: SimulationState, delta: number): void {
  if (delta === 0) {
    return;
  }
  state.stability = clampStability(state.stability + delta);
}

/** Aktív kerítésszakadások — nem a kumulatív breachCount (score/log). */
export function activeBreachCount(state: SimulationState): number {
  return state.fences.filter((f) => f.state === 'Breached').length;
}

export function stabilityRewardForResolvedEvent(event: GameEvent): number {
  const tier =
    event.severity === 'critical'
      ? getParamNumber('stabilityResolveRewardCritical')
      : event.severity === 'major'
        ? getParamNumber('stabilityResolveRewardMajor')
        : getParamNumber('stabilityResolveRewardMinor');
  if (event.category === 'fence breach') {
    return tier + getParamNumber('stabilityResolveBonusFenceBreach');
  }
  if (event.category === 'dinosaur escape') {
    return tier + getParamNumber('stabilityResolveBonusDinoEscape');
  }
  return tier;
}

export function onIncidentResolved(state: SimulationState, event: GameEvent): void {
  applyStabilityDelta(state, stabilityRewardForResolvedEvent(event));
}

export function updateStabilityTick(state: SimulationState): void {
  let drift = 0;
  const activeBreaches = activeBreachCount(state);

  if (state.globalBlackout) {
    drift -= getParamNumber('stabilityBlackoutDrain');
  }
  drift -= activeBreaches * getParamNumber('stabilityActiveBreachDrain');

  const unresolvedCritical = state.activeEvents.filter(
    (e) => !e.resolved && e.severity === 'critical',
  ).length;
  if (unresolvedCritical >= 3) {
    drift -= 0.75;
    state.telemetryCorruption = Math.min(100, state.telemetryCorruption + 5);
  } else if (unresolvedCritical > 0) {
    drift -= 0.15 * unresolvedCritical;
  }

  if (state.weather === 'Storm') {
    drift -= getParamNumber('stabilityStormDrain');
  }

  if (!state.globalBlackout && activeBreaches === 0) {
    drift += getParamNumber('stabilityQuietRecovery');
  }

  const stableRatio =
    state.fences.filter((f) => f.state === 'Stable').length /
    Math.max(1, state.fences.length);
  drift += stableRatio * getParamNumber('stabilityFenceStableBonus');

  if (state.generators.every((g) => g.online) && !state.globalBlackout) {
    drift += getParamNumber('stabilityPowerHealthyBonus');
  }

  const target = computeTargetStability(state);
  const pull = (target - state.stability) * getParamNumber('stabilityHealthPull');

  applyStabilityDelta(state, drift + pull);
}

function computeTargetStability(state: SimulationState): number {
  const fenceScore =
    state.fences.reduce((sum, f) => sum + f.integrity * 0.5 + (100 - f.stress) * 0.5, 0) /
    Math.max(1, state.fences.length);
  const unresolved = state.activeEvents.filter((e) => !e.resolved).length;
  const incidentPenalty = Math.min(35, unresolved * 3);
  const breachPenalty = activeBreachCount(state) * 12;
  const blackoutPenalty = state.globalBlackout ? 15 : 0;
  return clampStability(fenceScore - incidentPenalty - breachPenalty - blackoutPenalty);
}
