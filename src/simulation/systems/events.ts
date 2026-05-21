import { EVENT_EXPIRE_TICKS, MAX_SIMULTANEOUS_EVENTS } from '../constants';
import type { EventSeverity, GameEvent, SimulationState } from '../types';
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

export function generateEvents(state: SimulationState, rng: SeededRng): void {
  expireEvents(state);

  const roll = rng.next();
  let severity: EventSeverity | null = null;
  if (roll < state.eventProbCritical) {
    severity = 'critical';
  } else if (roll < state.eventProbCritical + state.eventProbMajor) {
    severity = 'major';
  } else if (roll < state.eventProbCritical + state.eventProbMajor + state.eventProbMinor) {
    severity = 'minor';
  }

  if (!severity) {
    maybeGhostAlert(state, rng);
    return;
  }

  const event = createEvent(state, severity, rng);
  enqueueEvent(state, event, rng);
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
  const fenceId = state.fences[rng.nextInt(state.fences.length)].id;

  return {
    id: state.nextEventId++,
    severity,
    category,
    message: `[${severity.toUpperCase()}] ${category}`,
    createdTick: state.tick,
    expiresTick: state.tick + EVENT_EXPIRE_TICKS,
    resolved: false,
    targetZoneId: zoneId,
    targetFenceId: fenceId,
  };
}

function enqueueEvent(state: SimulationState, event: GameEvent, rng: SeededRng): void {
  if (state.activeEvents.length >= MAX_SIMULTANEOUS_EVENTS) {
    event.createdTick = state.tick + 1 + rng.nextInt(5);
    state.queuedEvents.push(event);
    return;
  }
  state.activeEvents.push(event);
  applyEventEffects(state, event);
  state.alertEntries.push(event.message);
  if (event.severity === 'critical') {
    state.operatorCriticalCount++;
  }
}

function applyEventEffects(state: SimulationState, event: GameEvent): void {
  switch (event.category) {
    case 'camera offline':
      state.cameras[event.id % state.cameras.length].state = 'Offline';
      break;
    case 'fence voltage drop':
      if (event.targetFenceId != null) {
        const f = state.fences[event.targetFenceId];
        f.voltage = Math.max(0, f.voltage - 15);
      }
      break;
    case 'dinosaur stress increase': {
      const d = state.dinosaurs[event.id % state.dinosaurs.length];
      d.stress = Math.min(100, d.stress + 12);
      break;
    }
    case 'generator overheating': {
      const g = state.generators[event.id % state.generators.length];
      g.temperature = Math.min(100, g.temperature + 10);
      break;
    }
    case 'high fence stress':
      if (event.targetFenceId != null) {
        state.fences[event.targetFenceId].stress = Math.min(100, state.fences[event.targetFenceId].stress + 20);
      }
      break;
    case 'approaching storm':
      state.weather = 'Storm';
      break;
    case 'fence breach':
      if (event.targetFenceId != null) {
        state.fences[event.targetFenceId].state = 'Breached';
        state.breachCount++;
      }
      break;
    case 'dinosaur escape': {
      const d = state.dinosaurs[event.id % state.dinosaurs.length];
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
}

function expireEvents(state: SimulationState): void {
  state.activeEvents = state.activeEvents.filter((e) => {
    if (state.tick >= e.expiresTick) {
      return false;
    }
    return !e.resolved;
  });

  if (state.queuedEvents.length > 0 && state.activeEvents.length < MAX_SIMULTANEOUS_EVENTS) {
    const next = state.queuedEvents.shift()!;
    if (state.tick >= next.createdTick) {
      state.activeEvents.push(next);
      applyEventEffects(state, next);
    } else {
      state.queuedEvents.unshift(next);
    }
  }
}

function maybeGhostAlert(state: SimulationState, rng: SeededRng): void {
  if (!rng.chance(0.015)) {
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
  const order: EventSeverity[] = ['critical', 'major', 'minor'];
  for (const severity of order) {
    for (const event of state.activeEvents.filter((e) => e.severity === severity)) {
      if (event.resolved) {
        continue;
      }
      // Passive resolution placeholder — player actions resolve via action queue
    }
  }
}
