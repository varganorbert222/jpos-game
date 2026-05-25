import { ESCALATION_PHASES, EVENT_PROB_CAPS, ESCALATION_INTERVAL_MS } from '../constants';
import { getDifficultyConfig, shiftWinElapsedMs } from '../gameplay-config';
import type { EscalationPhaseId, SimulationState } from '../types';
import { updateStabilityTick } from './stability';

export function propagateConsequences(state: SimulationState): void {
  updateEscalationPhase(state);
  updateShiftObjective(state);
  updateCooldowns(state);
  updateStabilityTick(state);
  updateTelemetry(state);
  updateRebootOutage(state);
  checkLossConditions(state);
  trimLogs(state);
}

function updateShiftObjective(state: SimulationState): void {
  if (!state.shiftObjectiveWon && state.elapsedRealtimeMs >= shiftWinElapsedMs()) {
    state.shiftObjectiveWon = true;
    state.logEntries.push(
      '[SHIFT] 15-minute objective complete — score logged. Operator handoff available to continue.',
    );
    state.alertEntries.push('SHIFT COMPLETE — SCORE READY');
  }
}

function updateCooldowns(state: SimulationState): void {
  if (state.hardRebootCooldownTicks > 0) {
    state.hardRebootCooldownTicks--;
  }
  if (state.tourBonusTicksRemaining > 0) {
    state.tourBonusTicksRemaining--;
  }
}

function updateRebootOutage(state: SimulationState): void {
  if (state.rebootPowerOutageTicks <= 0) {
    return;
  }
  state.rebootPowerOutageTicks--;
  state.globalBlackout = true;
  for (const fence of state.fences) {
    fence.voltage = Math.max(0, fence.voltage * 0.85);
  }
  if (state.rebootPowerOutageTicks === 0) {
    state.globalBlackout = false;
    state.logEntries.push('[SYS] Perimeter power rails restored after reboot.');
  }
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
    const diff = getDifficultyConfig(state.difficultyMode);
    const cap = diff.phase4ProbabilityCap?.v ?? EVENT_PROB_CAPS.critical;
    state.eventProbMinor = Math.min(EVENT_PROB_CAPS.minor, state.eventProbMinor + 0.01);
    state.eventProbMajor = Math.min(EVENT_PROB_CAPS.major, state.eventProbMajor + 0.005);
    state.eventProbCritical = Math.min(
      cap,
      state.eventProbCritical + 0.0025,
    );
    state.lastEscalationBumpMs = state.elapsedRealtimeMs;
  }
}

function updateTelemetry(state: SimulationState): void {
  if (state.infectionLevel > 0 && state.tick % 3 === 0) {
    state.telemetryCorruption = Math.min(100, state.telemetryCorruption + 4);
    if (state.infectionLevel > 40 && state.tick % 6 === 0) {
      state.alertEntries.push('WARN: Telemetry drift — verify on grid');
    }
  }

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
