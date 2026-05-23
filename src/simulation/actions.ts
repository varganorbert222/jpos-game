import { getActionNumber, getParamNumber } from './gameplay-config';
import { resolveIncidentCategory } from './systems/events';
import { notifyTutorialProgress, resumeTutorialTicks } from './systems/tutorial-script';
import {
  dispatchPatrol,
  dispatchSealBreach,
  dispatchSedate,
} from './systems/field-ops';
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
  decrease_voltage: 2,
  dispatch_patrol: 4,
  seal_breach: 5,
  dino_sedate: 6,
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

const IMMEDIATE_ACTIONS = new Set([
  'increase_voltage',
  'decrease_voltage',
  'power_reroute',
  'cam_reboot',
  'emergency_venting',
  'system_hard_reboot',
]);

export function queueAction(
  state: SimulationState,
  type: string,
  params: Record<string, string | number> = {},
): boolean {
  const cooldown = COOLDOWNS[type] ?? 3;
  const delay = IMMEDIATE_ACTIONS.has(type)
    ? getActionNumber('defaultQueueDelayTicks')
    : 2;
  const action: QueuedPlayerAction = {
    id: state.nextActionId++,
    type,
    params,
    executeTick: state.tick + Math.max(1, delay),
    cooldownTicks: cooldown,
  };
  state.actionQueue.push(action);
  state.logEntries.push(`[CMD] Queued: ${type}`);
  if (state.difficultyMode === 'tutorial' && state.tutorialAwaitingAction) {
    resumeTutorialTicks(state);
  }
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
  let skipTutorialReport = false;
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
        resolveIncidentCategory(state, 'high fence stress', id);
        resolveIncidentCategory(state, 'fence voltage drop', id);
      }
      break;
    }
    case 'increase_voltage': {
      const id = Number(action.params['id'] ?? 0);
      const fence = state.fences[id];
      if (fence) {
        const delta = getParamNumber('fenceBoostImmediateDelta');
        fence.voltage = Math.min(100, fence.voltage + delta);
        const gen = state.generators[0];
        gen.load = Math.min(100, gen.load + 8);
        gen.temperature = Math.min(100, gen.temperature + 3);
        resolveIncidentCategory(state, 'fence voltage drop', id);
      }
      break;
    }
    case 'decrease_voltage': {
      const id = Number(action.params['id'] ?? 0);
      const fence = state.fences[id];
      if (fence) {
        const delta = getParamNumber('fenceShedImmediateDelta');
        fence.voltage = Math.max(0, fence.voltage - delta);
        const gen = state.generators[0];
        gen.load = Math.max(0, gen.load - 6);
        gen.temperature = Math.max(0, gen.temperature - 2);
        state.logEntries.push(
          `[FNC] Fence ${id} voltage shed — segment draw reduced, grid headroom recovered.`,
        );
      }
      break;
    }
    case 'dispatch_patrol': {
      const zone = Number(action.params['zone'] ?? 0) as SimulationState['zones'][0]['id'];
      dispatchPatrol(state, zone);
      break;
    }
    case 'seal_breach': {
      const id = Number(action.params['id'] ?? 0);
      dispatchSealBreach(state, id);
      break;
    }
    case 'dino_sedate': {
      const id = Number(action.params['id'] ?? 0);
      skipTutorialReport = !!dispatchSedate(state, id);
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
        resolveIncidentCategory(state, 'camera offline');
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
    case 'lethal_authorization': {
      const id = Number(action.params['id'] ?? 0);
      const d = state.dinosaurs[id] ?? state.dinosaurs[0];
      if (d) {
        d.aggression = 0;
        d.stress = Math.max(0, d.stress - 40);
        d.aiState = 'Idle';
        state.stability = Math.max(
          0,
          state.stability - getParamNumber('lethalStabilityPenalty'),
        );
        resolveIncidentCategory(state, 'dinosaur escape', undefined, d.id);
      }
      break;
    }
    case 'system_hard_reboot':
      if (state.hardRebootCooldownTicks > 0) {
        state.logEntries.push('[SYS] Hard reboot cooling down.');
        break;
      }
      const physicalCategories = new Set([
        'fence breach',
        'dinosaur escape',
        'total blackout',
        'high fence stress',
        'approaching storm',
        'generator overheating',
        'fence voltage drop',
        'dinosaur stress increase',
      ]);
      state.activeEvents = state.activeEvents.filter((e) =>
        physicalCategories.has(e.category),
      );
      state.alertEntries = state.alertEntries.filter(
        (a) =>
          !/ghost|false|unverified|payload|corrupt|stuck sensor/i.test(a),
      );
      state.infectionLevel = 0;
      state.telemetryCorruption = 0;
      state.rebootPowerOutageTicks = getParamNumber('hardRebootPowerOutageTicks');
      state.hardRebootCooldownTicks = getParamNumber('hardRebootCooldownTicks');
      state.logEntries.push(
        '[SYS] Hard reboot — software anomalies cleared; perimeter power cycling.',
      );
      break;
    default:
      state.logEntries.push(`[CMD] Unknown action: ${action.type}`);
  }

  if (!skipTutorialReport) {
    notifyTutorialProgress(state, {
      type: 'action',
      actionType: action.type,
      params: action.params,
    });
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

  if (state.difficultyMode === 'tutorial' && state.tutorialAwaitingAction) {
    resumeTutorialTicks(state);
  }

  switch (parts[0]) {
    case 'help':
      return TERMINAL_HELP_LINES.join('\n');
    case 'cls':
      return 'OK: display cleared';
    case 'status': {
      notifyTutorialProgress(state, { type: 'terminal', command: 'status' });
      return `STABILITY ${Math.round(state.stability)} | TICK ${state.tick} | PHASE ${state.escalationPhase} | WX ${state.weather}`;
    }
    case 'fence':
      if (parts[1] === 'reset') {
        return queueWithFenceId(state, 'reset_fence', parts[2]);
      }
      if (parts[1] === 'boost') {
        return queueWithFenceId(state, 'increase_voltage', parts[2]);
      }
      if (parts[1] === 'shed') {
        return queueWithFenceId(state, 'decrease_voltage', parts[2]);
      }
      return 'ERR: usage fence reset|boost|shed [ID]';
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
      if (parts[1] === 'sedate') {
        const parsed = parseIntegerParam(parts[2]);
        if (parsed === 'missing' || parsed === 'invalid') {
          return paramParseError('dino ID', parsed);
        }
        const err = validateDinoId(state, parsed);
        if (err) {
          return err;
        }
        const fail = dispatchSedate(state, parsed);
        if (!fail) {
          notifyTutorialProgress(state, {
            type: 'action',
            actionType: 'dino_sedate',
            params: { id: parsed },
          });
        }
        return fail ?? `OK: dino sedate ${parsed} dispatched`;
      }
      return 'ERR: usage dino track|sedate [ID]';
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
          if (parts[0] === 'seal_breach') {
            return queueWithFenceId(state, parts[0], parts[1]);
          }
          if (parts[0] === 'dino_sedate') {
            const parsed = parseIntegerParam(parts[1]);
            if (parsed === 'missing' || parsed === 'invalid') {
              return paramParseError('dino ID', parsed);
            }
            const err = validateDinoId(state, parsed);
            if (err) {
              return err;
            }
            return queueValidatedAction(state, parts[0], { id: parsed });
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
