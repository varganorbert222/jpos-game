import type { QueuedPlayerAction, SimulationState } from './types';
import { TERMINAL_HELP_LINES, TERMINAL_QUEUE_ACTIONS } from './terminal-manifest';
import {
  parseIntegerParam,
  paramParseError,
  validateCameraId,
  validateDinoId,
  validateFenceId,
  validateGeneratorId,
  validateZoneId,
} from './terminal-validation';

export { terminalActionNeedsParam } from './terminal-manifest';

const COOLDOWNS: Record<string, number> = {
  reset_fence: 3,
  increase_voltage: 2,
  dispatch_patrol: 4,
  generator_restart: 5,
  cam_reboot: 2,
  power_reroute: 3,
  emergency_venting: 8,
  lethal_authorization: 10,
  system_hard_reboot: 15,
};

function queueValidatedAction(
  state: SimulationState,
  type: string,
  params: Record<string, string | number> = {},
): string {
  queueAction(state, type, params);
  return `OK: ${type} queued`;
}

function queueWithFenceId(state: SimulationState, type: string, raw: string | undefined): string {
  const parsed = parseIntegerParam(raw);
  if (parsed === 'missing' || parsed === 'invalid') {
    return paramParseError('fence ID', parsed);
  }
  const err = validateFenceId(state, parsed);
  if (err) {
    return err;
  }
  return queueValidatedAction(state, type, { id: parsed });
}

function queueWithCameraId(state: SimulationState, type: string, raw: string | undefined): string {
  const parsed = parseIntegerParam(raw);
  if (parsed === 'missing' || parsed === 'invalid') {
    return paramParseError('camera ID', parsed);
  }
  const err = validateCameraId(state, parsed);
  if (err) {
    return err;
  }
  return queueValidatedAction(state, type, { id: parsed });
}

function queueWithGeneratorId(
  state: SimulationState,
  type: string,
  raw: string | undefined,
): string {
  const parsed = parseIntegerParam(raw);
  if (parsed === 'missing' || parsed === 'invalid') {
    return paramParseError('generator ID', parsed);
  }
  const err = validateGeneratorId(state, parsed);
  if (err) {
    return err;
  }
  return queueValidatedAction(state, type, { id: parsed });
}

function queueWithZone(state: SimulationState, type: string, raw: string | undefined): string {
  const parsed = parseIntegerParam(raw);
  if (parsed === 'missing' || parsed === 'invalid') {
    return paramParseError('zone', parsed);
  }
  const err = validateZoneId(state, parsed);
  if (err) {
    return err;
  }
  return queueValidatedAction(state, type, { zone: parsed });
}

export function queueAction(
  state: SimulationState,
  type: string,
  params: Record<string, string | number> = {},
): boolean {
  const cooldown = COOLDOWNS[type] ?? 3;
  const action: QueuedPlayerAction = {
    id: state.nextActionId++,
    type,
    params,
    executeTick: state.tick + 2,
    cooldownTicks: cooldown,
  };
  state.actionQueue.push(action);
  state.logEntries.push(`[CMD] Queued: ${type}`);
  return true;
}

export function processActionQueue(state: SimulationState): void {
  const ready = state.actionQueue.filter((a) => state.tick >= a.executeTick);
  state.actionQueue = state.actionQueue.filter((a) => state.tick < a.executeTick);

  for (const action of ready) {
    executeAction(state, action);
  }
}

function executeAction(state: SimulationState, action: QueuedPlayerAction): void {
  switch (action.type) {
    case 'reset_fence': {
      const id = Number(action.params['id'] ?? 0);
      const fence = state.fences[id];
      if (fence) {
        fence.integrity = Math.min(100, fence.integrity + 25);
        fence.stress = Math.max(0, fence.stress - 15);
        if (fence.state !== 'Breached') {
          fence.state = 'Stable';
        }
      }
      break;
    }
    case 'increase_voltage': {
      const id = Number(action.params['id'] ?? 0);
      const fence = state.fences[id];
      if (fence) {
        fence.voltage = Math.min(100, fence.voltage + 20);
        const gen = state.generators[0];
        gen.load = Math.min(100, gen.load + 8);
        gen.temperature = Math.min(100, gen.temperature + 3);
      }
      break;
    }
    case 'dispatch_patrol': {
      const team = state.teams[0];
      team.busyTicks = 6;
      team.fatigue = Math.min(100, team.fatigue + 5);
      break;
    }
    case 'generator_restart': {
      const id = Number(action.params['id'] ?? 0);
      const gen = state.generators[id];
      if (gen && state.resources.spareParts > 0) {
        gen.online = true;
        gen.temperature = 50;
        state.resources.spareParts--;
      }
      break;
    }
    case 'cam_reboot': {
      const id = Number(action.params['id'] ?? 0);
      const cam = state.cameras[id];
      if (cam) {
        cam.state = 'Online';
      }
      break;
    }
    case 'power_reroute': {
      const zone = Number(action.params['zone'] ?? 0);
      state.powerAllocation.fences = 35 + (zone % 3) * 5;
      state.powerAllocation.cameras = 30;
      break;
    }
    case 'emergency_venting':
      state.generators.forEach((g) => (g.temperature = Math.max(0, g.temperature - 30)));
      state.globalBlackout = true;
      state.blackoutTicks += 5;
      break;
    case 'lethal_authorization':
      if (state.resources.tranquilizerAmmo > 0) {
        state.resources.tranquilizerAmmo--;
        const d = state.dinosaurs[0];
        d.aggression = Math.max(0, d.aggression - 30);
        d.stress = Math.max(0, d.stress - 20);
        state.stability = Math.max(0, state.stability - 20);
      }
      break;
    case 'system_hard_reboot':
      state.activeEvents = [];
      state.globalBlackout = true;
      state.blackoutTicks = 10;
      state.logEntries.push('[SYS] Hard reboot — all sectors offline 10 ticks.');
      break;
    default:
      state.logEntries.push(`[CMD] Unknown action: ${action.type}`);
  }
}

export function parseTerminalCommand(
  state: SimulationState,
  line: string,
): string {
  const parts = line.trim().toLowerCase().split(/\s+/);
  if (parts.length === 0 || !parts[0]) {
    return 'ERR: empty command';
  }

  switch (parts[0]) {
    case 'help':
      return TERMINAL_HELP_LINES.join('\n');
    case 'cls':
      return 'OK: display cleared';
    case 'status':
      return `STABILITY ${Math.round(state.stability)} | TICK ${state.tick} | PHASE ${state.escalationPhase} | WX ${state.weather}`;
    case 'fence':
      if (parts[1] === 'reset') {
        return queueWithFenceId(state, 'reset_fence', parts[2]);
      }
      return 'ERR: usage fence reset [ID]';
    case 'cam':
      if (parts[1] === 'reboot') {
        return queueWithCameraId(state, 'cam_reboot', parts[2]);
      }
      return 'ERR: usage cam reboot [ID]';
    case 'dino':
      if (parts[1] === 'track') {
        const parsed = parseIntegerParam(parts[2]);
        if (parsed === 'missing' || parsed === 'invalid') {
          return paramParseError('dino ID', parsed);
        }
        const err = validateDinoId(state, parsed);
        if (err) {
          return err;
        }
        const d = state.dinosaurs[parsed];
        const threat =
          d.stress >= 75 ? 'Critical' : d.stress >= 45 ? 'Unstable' : 'Stable';
        const act =
          d.visibleAggression * 0.5 + d.stress * 0.5 >= 70
            ? 'HIGH'
            : d.visibleAggression * 0.5 + d.stress * 0.5 >= 40
              ? 'ELEVATED'
              : 'LOW';
        return `DINO ${d.id}: ${d.species} Z${d.zoneId} THREAT=${threat} ACT=${act}`;
      }
      return 'ERR: usage dino track [ID]';
    case 'power':
      if (parts[1] === 'reroute') {
        return queueWithZone(state, 'power_reroute', parts[2]);
      }
      return 'ERR: usage power reroute [ZONE]';
    default: {
      const paramKey = TERMINAL_QUEUE_ACTIONS[parts[0]];
      if (paramKey == null && !(parts[0] in TERMINAL_QUEUE_ACTIONS)) {
        return 'ERR: unknown command';
      }
      if (paramKey == null) {
        return queueValidatedAction(state, parts[0]);
      }
      if (parts[1] == null) {
        return `ERR: usage ${parts[0]} [${paramKey.toUpperCase()}]`;
      }
      switch (paramKey) {
        case 'id':
          if (parts[0] === 'generator_restart') {
            return queueWithGeneratorId(state, parts[0], parts[1]);
          }
          if (parts[0] === 'cam_reboot') {
            return queueWithCameraId(state, parts[0], parts[1]);
          }
          return queueWithFenceId(state, parts[0], parts[1]);
        case 'zone':
          return queueWithZone(state, parts[0], parts[1]);
        default:
          return 'ERR: unknown command';
      }
    }
  }
}
