import { MAX_SIMULTANEOUS_EVENTS } from '../constants';
import { getDifficultyConfig, getParamNumber } from '../gameplay-config';
import type { EventSeverity, GameEvent, IncidentPhase, SimulationState, ZoneId } from '../types';
import { SeededRng } from '../rng';

const MINOR_EVENTS = [
  'camera offline',
  'fence voltage drop',
  'dinosaur stress increase',
] as const;

const MAJOR_EVENTS = [
  'generator overheating',
  'high fence stress',
  'approaching storm',
] as const;

const CRITICAL_EVENTS = [
  'fence breach',
  'dinosaur escape',
  'total blackout',
] as const;

const SOFTWARE_CATEGORIES = new Set(['mail payload', 'sensor ghost']);

export interface ScriptedIncidentOpts {
  category: string;
  severity: EventSeverity;
  zoneId: ZoneId;
  fenceId: number;
  dinoId?: number;
  isSoftware?: boolean;
  message?: string;
}

/** Tutorial / black swan — inject a known incident without RNG pool. */
export function injectScriptedIncident(
  state: SimulationState,
  opts: ScriptedIncidentOpts,
): GameEvent {
  const event: GameEvent = {
    id: state.nextEventId++,
    severity: opts.severity,
    category: opts.category,
    message:
      opts.message ??
      `[WARN] ${opts.category} — Z${opts.zoneId} F${opts.fenceId}`,
    createdTick: state.tick,
    expiresTick: state.tick + 120,
    resolved: false,
    phase: 'warn',
    phaseStartedTick: state.tick,
    criticalApplied: false,
    isSoftware: opts.isSoftware ?? SOFTWARE_CATEGORIES.has(opts.category),
    targetZoneId: opts.zoneId,
    targetFenceId: opts.fenceId,
    targetDinoId: opts.dinoId,
  };
  enqueueEvent(state, event, new SeededRng(state.rngSeed));
  return event;
}

/**
 * Black swan: sensor ghost + real physical incident on the same zone/fence.
 * `source` tutorial always fires once; normal/veteran respect caps and RNG gate.
 */
export function triggerBlackSwanStack(
  state: SimulationState,
  zoneId: ZoneId,
  fenceId: number,
  source: 'tutorial' | 'random' = 'random',
): boolean {
  const diff = getDifficultyConfig(state.difficultyMode);
  const max = diff.blackSwanMaxPerRun?.v ?? 0;
  if (source === 'random') {
    if (max <= 0 || state.blackSwansThisRun >= max) {
      return false;
    }
    if (state.difficultyMode === 'easy' || state.difficultyMode === 'tutorial') {
      return false;
    }
  }

  state.blackSwansThisRun++;
  state.alertEntries.push(
    `BLACK SWAN: Sensor ghost + confirmed ${zoneId} grid anomaly — cross-check Z${zoneId} F${fenceId}`,
  );

  injectScriptedIncident(state, {
    category: 'sensor ghost',
    severity: 'minor',
    zoneId,
    fenceId,
    isSoftware: true,
    message: `[WARN] sensor ghost — Z${zoneId} F${fenceId} (unverified)`,
  });

  injectScriptedIncident(state, {
    category: 'fence voltage drop',
    severity: 'major',
    zoneId,
    fenceId,
    message: `[WARN] fence voltage drop — Z${zoneId} F${fenceId} (confirmed)`,
  });

  state.logEntries.push(
    `[EVENT] Black swan stack Z${zoneId}/F${fenceId} — verify before countermeasure.`,
  );
  state.ticksSinceLastIncidentStart = 0;
  const quiet = diff.recoveryQuietTicks?.v ?? getParamNumber('recoveryQuietTicks');
  state.recoveryQuietTicksLeft = quiet;
  return true;
}

/** Rare stacked ghost+real incident during stressed normal/veteran runs. */
export function maybeTriggerBlackSwan(state: SimulationState, rng: SeededRng): void {
  const diff = getDifficultyConfig(state.difficultyMode);
  const max = diff.blackSwanMaxPerRun?.v ?? 0;
  if (max <= 0 || state.blackSwansThisRun >= max) {
    return;
  }
  if (state.difficultyMode !== 'normal' && state.difficultyMode !== 'veteran') {
    return;
  }
  if (state.tick < 80) {
    return;
  }

  const activePhysical = state.activeEvents.filter(
    (e) => !e.resolved && !e.isSoftware,
  ).length;
  if (activePhysical < 1) {
    return;
  }

  const chance =
    state.difficultyMode === 'veteran' ? 0.004 : 0.0025;
  if (!rng.chance(chance)) {
    return;
  }

  const zoneId = rng.nextInt(6) as ZoneId;
  const fence = state.fences[rng.nextInt(state.fences.length)];
  triggerBlackSwanStack(state, zoneId, fence.id, 'random');
}

export function generateEvents(state: SimulationState, rng: SeededRng): void {
  advanceIncidentPhases(state, rng);
  expireEvents(state);

  state.ticksSinceLastIncidentStart++;

  const diff = getDifficultyConfig(state.difficultyMode);
  const interval = configValueInterval(diff.avgNewIncidentIntervalTicks.v);
  const tourMult =
    state.tourBonusTicksRemaining > 0
      ? getParamNumber('tourBonusIncidentMultiplier')
      : 1;
  const maxActive = diff.maxActiveIncidents.v;
  const activeDecision = state.activeEvents.filter(
    (e) => !e.resolved && !e.isSoftware,
  ).length;

  if (activeDecision >= maxActive) {
    maybeGhostAlert(state, rng);
    return;
  }

  if (state.recoveryQuietTicksLeft > 0) {
    state.recoveryQuietTicksLeft--;
    maybeGhostAlert(state, rng);
    return;
  }

  if (state.ticksSinceLastIncidentStart < interval * tourMult) {
    maybeGhostAlert(state, rng);
    return;
  }

  const roll = rng.next();
  let severity: EventSeverity | null = null;
  if (roll < state.eventProbCritical * tourMult) {
    severity = 'critical';
  } else if (roll < (state.eventProbCritical + state.eventProbMajor) * tourMult) {
    severity = 'major';
  } else if (
    roll <
    (state.eventProbCritical + state.eventProbMajor + state.eventProbMinor) * tourMult
  ) {
    severity = 'minor';
  }

  if (!severity) {
    maybeGhostAlert(state, rng);
    maybeTriggerBlackSwan(state, rng);
    return;
  }

  const event = createEvent(state, severity, rng);
  enqueueEvent(state, event, rng);
  state.ticksSinceLastIncidentStart = 0;
  const quiet = diff.recoveryQuietTicks?.v ?? getParamNumber('recoveryQuietTicks');
  state.recoveryQuietTicksLeft = quiet;
  maybeTriggerBlackSwan(state, rng);
}

function configValueInterval(ticks: number): number {
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.max(15, Math.floor(ticks * jitter));
}

function createEvent(
  state: SimulationState,
  severity: EventSeverity,
  rng: SeededRng,
): GameEvent {
  const pool =
    severity === 'critical'
      ? CRITICAL_EVENTS
      : severity === 'major'
        ? MAJOR_EVENTS
        : MINOR_EVENTS;
  const category = pool[rng.nextInt(pool.length)];
  const zoneId = rng.nextInt(6) as GameEvent['targetZoneId'];
  const fence = state.fences[rng.nextInt(state.fences.length)];
  const dino = state.dinosaurs[rng.nextInt(state.dinosaurs.length)];

  return {
    id: state.nextEventId++,
    severity,
    category,
    message: `[WARN] ${category} — Z${zoneId} F${fence.id}`,
    createdTick: state.tick,
    expiresTick: state.tick + 120,
    resolved: false,
    phase: 'warn',
    phaseStartedTick: state.tick,
    criticalApplied: false,
    isSoftware: SOFTWARE_CATEGORIES.has(category),
    targetZoneId: zoneId,
    targetFenceId: fence.id,
    targetDinoId: dino.id,
  };
}

function enqueueEvent(state: SimulationState, event: GameEvent, rng: SeededRng): void {
  if (state.activeEvents.length >= MAX_SIMULTANEOUS_EVENTS) {
    event.createdTick = state.tick + 1 + rng.nextInt(5);
    state.queuedEvents.push(event);
    return;
  }
  state.activeEvents.push(event);
  applyWarnEffects(state, event);
  state.alertEntries.push(event.message);
}

function applyWarnEffects(state: SimulationState, event: GameEvent): void {
  switch (event.category) {
    case 'fence voltage drop':
      if (event.targetFenceId != null) {
        state.fences[event.targetFenceId].voltage = Math.max(
          0,
          state.fences[event.targetFenceId].voltage - 8,
        );
      }
      break;
    case 'dinosaur stress increase':
      if (event.targetDinoId != null) {
        state.dinosaurs[event.targetDinoId].stress = Math.min(
          100,
          state.dinosaurs[event.targetDinoId].stress + 6,
        );
      }
      break;
    case 'generator overheating': {
      const g = state.generators[event.id % state.generators.length];
      g.temperature = Math.min(100, g.temperature + 5);
      break;
    }
    default:
      break;
  }
  state.logEntries.push(event.message);
}

function applyCriticalEffects(state: SimulationState, event: GameEvent): void {
  if (event.criticalApplied) {
    return;
  }
  event.criticalApplied = true;
  event.message = `[CRITICAL] ${event.category}`;
  switch (event.category) {
    case 'camera offline':
      state.cameras[(event.targetFenceId ?? 0) % state.cameras.length].state = 'Offline';
      break;
    case 'fence voltage drop':
      if (event.targetFenceId != null) {
        state.fences[event.targetFenceId].voltage = Math.max(
          0,
          state.fences[event.targetFenceId].voltage - 15,
        );
      }
      break;
    case 'dinosaur stress increase':
      if (event.targetDinoId != null) {
        const d = state.dinosaurs[event.targetDinoId];
        d.stress = Math.min(100, d.stress + 12);
      }
      break;
    case 'generator overheating': {
      const g = state.generators[(event.targetFenceId ?? 0) % state.generators.length];
      g.temperature = Math.min(100, g.temperature + 10);
      break;
    }
    case 'high fence stress':
      if (event.targetFenceId != null) {
        state.fences[event.targetFenceId].stress = Math.min(
          100,
          state.fences[event.targetFenceId].stress + 20,
        );
      }
      break;
    case 'approaching storm':
      state.weather = 'Storm';
      break;
    case 'fence breach':
      if (event.targetFenceId != null) {
        const fence = state.fences[event.targetFenceId];
        if (state.difficultyMode === 'tutorial' && !state.tutorialScriptComplete) {
          fence.stress = Math.min(95, fence.stress + 12);
          if (fence.state !== 'Breached') {
            fence.state = 'Sparking';
          }
        } else {
          fence.state = 'Breached';
          state.breachCount++;
        }
      }
      break;
    case 'dinosaur escape': {
      const d = state.dinosaurs[event.targetDinoId ?? 0];
      d.aiState = 'Hunting';
      d.stress = 100;
      break;
    }
    case 'total blackout':
      state.globalBlackout = true;
      state.generators.forEach((g) => (g.online = false));
      break;
  }
  state.logEntries.push(event.message);
  state.alertEntries.push(event.message);
  if (event.severity === 'critical') {
    state.operatorCriticalCount++;
  }
}

function advanceIncidentPhases(state: SimulationState, rng: SeededRng): void {
  const diff = getDifficultyConfig(state.difficultyMode);
  const warnLen = diff.warnPhaseTicks.v;
  const escLen = diff.escalatingPhaseTicks.v;

  for (const event of state.activeEvents) {
    if (event.resolved) {
      continue;
    }
    const phaseAge = state.tick - event.phaseStartedTick;
    if (event.phase === 'warn' && phaseAge >= warnLen) {
      event.phase = 'escalating';
      event.phaseStartedTick = state.tick;
      event.message = `[ESC] ${event.category}`;
      state.alertEntries.push(event.message);
      applyWarnEffects(state, event);
    } else if (event.phase === 'escalating' && phaseAge >= escLen) {
      event.phase = 'critical';
      event.phaseStartedTick = state.tick;
      applyCriticalEffects(state, event);
    }
  }

  void rng;
}

function expireEvents(state: SimulationState): void {
  state.activeEvents = state.activeEvents.filter((e) => {
    if (e.resolved) {
      return false;
    }
    if (state.tick >= e.expiresTick) {
      if (!e.criticalApplied && e.phase !== 'critical') {
        applyCriticalEffects(state, e);
      }
      return false;
    }
    return true;
  });

  if (state.queuedEvents.length > 0 && state.activeEvents.length < MAX_SIMULTANEOUS_EVENTS) {
    const next = state.queuedEvents.shift()!;
    if (state.tick >= next.createdTick) {
      state.activeEvents.push(next);
      applyWarnEffects(state, next);
    } else {
      state.queuedEvents.unshift(next);
    }
  }
}

function maybeGhostAlert(state: SimulationState, rng: SeededRng): void {
  if (!getDifficultyConfig(state.difficultyMode).ghostAlertsEnabled.v) {
    return;
  }
  if (!rng.chance(0.012)) {
    return;
  }
  const ghost = rng.nextInt(3);
  if (ghost === 0) {
    state.alertEntries.push('WARN: False fence voltage drop (sensor ghost)');
  } else if (ghost === 1) {
    state.alertEntries.push('WARN: Camera offline alert — unverified');
  } else {
    state.alertEntries.push('WARN: Stuck sensor value detected');
  }
}

export function resolveEventsByPriority(state: SimulationState): void {
  for (const event of state.activeEvents) {
    if (event.resolved) {
      continue;
    }
  }
}

export function resolveIncidentCategory(
  state: SimulationState,
  category: string,
  targetFenceId?: number,
  targetDinoId?: number,
): void {
  for (const e of state.activeEvents) {
    if (e.resolved || e.category !== category) {
      continue;
    }
    if (targetFenceId != null && e.targetFenceId !== targetFenceId) {
      continue;
    }
    if (targetDinoId != null && e.targetDinoId !== targetDinoId) {
      continue;
    }
    e.resolved = true;
    state.alertEntries.push(`RESOLVED: ${e.category}`);
  }
}
