import { getActionNumber } from '../gameplay-config';
import type { FieldOperation, SimulationState, ZoneId } from '../types';

export function updateFieldOps(state: SimulationState): void {
  updateHeliSedate(state);
  const remaining: FieldOperation[] = [];
  for (const op of state.fieldOps) {
    if (op.ticksRemaining > 0) {
      op.ticksRemaining--;
    }
    if (op.ticksRemaining > 0) {
      remaining.push(op);
      continue;
    }
    if (op.phase === 'travel') {
      op.phase = 'working';
      op.ticksRemaining = workTicks(op.kind);
      remaining.push(op);
      applyFieldOpEffect(state, op);
      continue;
    }
    if (op.phase === 'working') {
      op.phase = 'returning';
      op.ticksRemaining = 2;
      remaining.push(op);
      continue;
    }
    releaseTeam(state, op);
  }
  state.fieldOps = remaining;
}

function workTicks(kind: FieldOperation['kind']): number {
  switch (kind) {
    case 'seal_breach':
      return 2;
    case 'patrol':
      return 3;
    case 'generator_restart':
      return 2;
    default:
      return 2;
  }
}

function applyFieldOpEffect(state: SimulationState, op: FieldOperation): void {
  switch (op.kind) {
    case 'seal_breach': {
      const fence = state.fences[op.targetEntityId];
      if (fence) {
        fence.state = 'Stable';
        fence.integrity = Math.min(100, fence.integrity + 40);
        fence.stress = Math.max(0, fence.stress - 30);
        state.logEntries.push(`[FNC] Fence ${fence.id} sealed.`);
      }
      resolveIncidents(state, 'fence breach', fence?.id);
      break;
    }
    case 'patrol': {
      for (const d of state.dinosaurs.filter((d) => d.zoneId === op.targetZoneId)) {
        d.stress = Math.max(0, d.stress - 15);
        if (d.aiState === 'Agitated') {
          d.aiState = 'Roaming';
        }
      }
      for (const f of state.fences.filter((f) => f.zoneId === op.targetZoneId)) {
        f.stress = Math.max(0, f.stress - 8);
      }
      state.logEntries.push(`[STF] Patrol complete — Z${op.targetZoneId}.`);
      break;
    }
    case 'generator_restart': {
      const gen = state.generators[op.targetEntityId];
      if (gen && state.resources.spareParts > 0) {
        gen.online = true;
        gen.temperature = 50;
        state.resources.spareParts--;
        state.logEntries.push(`[PWR] Generator ${gen.id} online.`);
      }
      break;
    }
    default:
      break;
  }
}

function resolveIncidents(
  state: SimulationState,
  category: string,
  fenceId?: number,
): void {
  for (const e of state.activeEvents) {
    if (e.resolved) {
      continue;
    }
    if (e.category !== category) {
      continue;
    }
    if (fenceId != null && e.targetFenceId !== fenceId) {
      continue;
    }
    e.resolved = true;
    state.alertEntries.push(`RESOLVED: ${e.message}`);
  }
}

function releaseTeam(state: SimulationState, op: FieldOperation): void {
  const team = state.teams.find(
    (t) => t.targetZoneId === op.targetZoneId || t.zoneId === op.targetZoneId,
  );
  if (team) {
    team.busyTicks = 0;
    team.travelTicksRemaining = 0;
    team.targetZoneId = null;
  }
}

function updateHeliSedate(state: SimulationState): void {
  if (state.heliPhase === 'idle') {
    return;
  }
  if (state.heliTicksRemaining > 0) {
    state.heliTicksRemaining--;
    return;
  }
  const dinoId = state.heliTargetDinoId;
  const dino = dinoId != null ? state.dinosaurs[dinoId] : undefined;
  switch (state.heliPhase) {
    case 'travel':
      state.heliPhase = 'dart';
      state.heliTicksRemaining = 1;
      state.logEntries.push(`[BIO] Heli on station — dino ${dinoId ?? '?'}.`);
      break;
    case 'dart':
      state.heliPhase = 'sedating';
      state.heliTicksRemaining =
        dino && dino.stress >= 90
          ? getActionNumber('sedateRampTicksHighStress')
          : dino && dino.stress >= 70
            ? 3
            : getActionNumber('sedateRampTicksLowStress');
      state.logEntries.push(`[BIO] Dart confirmed — sedation ramp.`);
      break;
    case 'sedating':
      if (dino) {
        dino.stress = Math.max(0, dino.stress - 35);
        dino.aggression = Math.max(0, dino.aggression - 25);
        if (dino.stress < 50) {
          dino.aiState = 'Roaming';
        }
      }
      state.heliPhase = 'returning';
      state.heliTicksRemaining = 3;
      resolveIncidents(state, 'dinosaur escape');
      state.logEntries.push(`[BIO] DINO ${dinoId} sedated.`);
      break;
    case 'returning':
      state.heliPhase = 'idle';
      state.heliTargetDinoId = null;
      state.helicopter.busyTicks = 0;
      break;
    default:
      state.heliPhase = 'idle';
  }
}

export function dispatchPatrol(state: SimulationState, zone: ZoneId): string | null {
  const team = pickTeam(state, zone);
  if (!team) {
    return 'ERR: all patrol teams busy — reassigning on next tick';
  }
  const travel = getActionNumber('patrolTravelTicksBase');
  team.targetZoneId = zone;
  team.busyTicks = travel + 5;
  team.travelTicksRemaining = travel;
  state.fieldOps.push({
    id: state.nextFieldOpId++,
    kind: 'patrol',
    targetZoneId: zone,
    targetEntityId: 0,
    ticksRemaining: travel,
    phase: 'travel',
  });
  state.logEntries.push(`[STF] Team ${team.id} dispatched → Z${zone} ETA ${travel}t`);
  return null;
}

export function dispatchSealBreach(state: SimulationState, fenceId: number): string | null {
  const fence = state.fences[fenceId];
  if (!fence) {
    return 'ERR: invalid fence';
  }
  const team = pickTeam(state, fence.zoneId);
  if (!team) {
    return 'ERR: no crew available';
  }
  const travel = getActionNumber('sealBreachTravelTicks');
  team.busyTicks = travel + 6;
  team.targetZoneId = fence.zoneId;
  state.fieldOps.push({
    id: state.nextFieldOpId++,
    kind: 'seal_breach',
    targetZoneId: fence.zoneId,
    targetEntityId: fenceId,
    ticksRemaining: travel,
    phase: 'travel',
  });
  state.logEntries.push(`[STF] Seal crew → fence ${fenceId} ETA ${travel}t`);
  return null;
}

export function dispatchSedate(state: SimulationState, dinoId: number): string | null {
  const dino = state.dinosaurs[dinoId];
  if (!dino) {
    return 'ERR: invalid dino';
  }
  if (state.heliPhase !== 'idle') {
    return 'ERR: heli busy';
  }
  const travel = getActionNumber('sedateHeliTravelTicks');
  state.heliPhase = 'travel';
  state.heliTicksRemaining = travel;
  state.heliTargetDinoId = dinoId;
  state.helicopter.busyTicks = travel + 10;
  state.logEntries.push(`[BIO] Sedate D${dinoId} — heli ETA ${travel}t`);
  return null;
}

function pickTeam(state: SimulationState, zone: ZoneId) {
  const free = state.teams.filter((t) => t.busyTicks <= 0);
  if (free.length > 0) {
    const t = free[0]!;
    t.zoneId = zone;
    return t;
  }
  const soonest = [...state.teams].sort((a, b) => a.busyTicks - b.busyTicks)[0];
  if (soonest && soonest.busyTicks <= 2) {
    soonest.busyTicks = 0;
    soonest.zoneId = zone;
    state.logEntries.push(`[STF] Team ${soonest.id} rerouted — higher priority Z${zone}`);
    return soonest;
  }
  return null;
}
