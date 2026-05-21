import { ESCALATION_PHASES, EVENT_PROB_CAPS, ESCALATION_INTERVAL_MS } from '../constants';
import type { EscalationPhaseId, SimulationState } from '../types';

export function propagateConsequences(state: SimulationState): void {
  updateEscalationPhase(state);
  updateStability(state);
  updateTelemetry(state);
  checkLossConditions(state);
  trimLogs(state);
}

function updateEscalationPhase(state: SimulationState): void {
  const minutes = state.elapsedRealtimeMs / 60000;
  for (const phase of ESCALATION_PHASES) {
    if (minutes >= phase.startMin && minutes < phase.endMin) {
      state.escalationPhase = phase.id as EscalationPhaseId;
      break;
    }
  }

  if (state.elapsedRealtimeMs - state.lastEscalationBumpMs >= ESCALATION_INTERVAL_MS) {
    state.eventProbMinor = Math.min(EVENT_PROB_CAPS.minor, state.eventProbMinor + 0.01);
    state.eventProbMajor = Math.min(EVENT_PROB_CAPS.major, state.eventProbMajor + 0.005);
    state.eventProbCritical = Math.min(EVENT_PROB_CAPS.critical, state.eventProbCritical + 0.0025);
    state.lastEscalationBumpMs = state.elapsedRealtimeMs;
  }
}

function updateStability(state: SimulationState): void {
  let delta = 0;
  if (state.globalBlackout) {
    delta -= 2;
  }
  if (state.breachCount > 0) {
    delta -= state.breachCount * 0.5;
  }
  if (state.activeEvents.filter((e) => e.severity === 'critical').length >= 3) {
    delta -= 1;
    state.telemetryCorruption = Math.min(100, state.telemetryCorruption + 5);
  }
  if (state.weather === 'Storm') {
    delta -= 0.5;
  }
  if (state.stability > 60) {
    delta += 0.2;
  }
  state.stability = Math.max(0, Math.min(100, state.stability + delta));
}

function updateTelemetry(state: SimulationState): void {
  if (state.weather === 'Storm') {
    for (const cam of state.cameras) {
      if (cam.state === 'Online' && state.tick % 4 === 0) {
        cam.state = 'Interference';
      }
    }
    state.telemetryCorruption = Math.min(100, state.telemetryCorruption + 2);
  }

  for (const cam of state.cameras) {
    cam.displayFrame = (cam.displayFrame + 1) % 4;
    if (cam.state === 'Offline') {
      continue;
    }
    if (state.telemetryCorruption > 50 && cam.state === 'Online') {
      cam.state = 'Delayed';
    }
  }
}

function checkLossConditions(state: SimulationState): void {
  if (state.gameOver) {
    return;
  }

  if (state.stability <= 0) {
    endGame(state, 'Stability reached zero — park collapse.');
    return;
  }
  if (state.breachCount >= 3) {
    endGame(state, 'Three fence breaches — containment failure.');
    return;
  }
  if (state.visitorSectorCompromisedTicks > 20) {
    endGame(state, 'Visitor sector compromised beyond recovery threshold.');
    return;
  }
  if (state.blackoutTicks > 30) {
    endGame(state, 'Extended blackout exceeded 30 ticks.');
  }
}

function endGame(state: SimulationState, reason: string): void {
  state.gameOver = true;
  state.gameOverReason = reason;
  state.logEntries.push(`[FAIL] ${reason}`);
}

function trimLogs(state: SimulationState): void {
  const max = 80;
  if (state.logEntries.length > max) {
    state.logEntries = state.logEntries.slice(-max);
  }
  if (state.alertEntries.length > 40) {
    state.alertEntries = state.alertEntries.slice(-40);
  }
}
