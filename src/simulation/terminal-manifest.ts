import {
  CAMERA_COUNT,
  DINOSAUR_COUNT,
  FENCE_COUNT,
  GENERATOR_COUNT,
  ZONE_COUNT,
} from './constants';

export interface TerminalCommandDef {
  name: string;
  usage: string;
  summary: string;
}

function idRange(count: number): string {
  return count <= 1 ? '0' : `0–${count - 1}`;
}

export const TERMINAL_COMMAND_DEFS: readonly TerminalCommandDef[] = [
  { name: 'help', usage: 'help', summary: 'List available commands' },
  { name: 'cls', usage: 'cls', summary: 'Clear terminal output' },
  { name: 'status', usage: 'status', summary: 'Park stability and phase' },
  {
    name: 'fence-reset',
    usage: 'fence reset [ID]',
    summary: `Queue fence reset (ID ${idRange(FENCE_COUNT)})`,
  },
  {
    name: 'cam-reboot-syntax',
    usage: 'cam reboot [ID]',
    summary: `Queue camera reboot (ID ${idRange(CAMERA_COUNT)})`,
  },
  {
    name: 'dino-track',
    usage: 'dino track [ID]',
    summary: `Specimen telemetry (ID ${idRange(DINOSAUR_COUNT)})`,
  },
  {
    name: 'power-reroute-syntax',
    usage: 'power reroute [ZONE]',
    summary: `Queue power reroute (ZONE ${idRange(ZONE_COUNT)})`,
  },
  {
    name: 'reset_fence',
    usage: 'reset_fence [ID]',
    summary: `Queue fence reset (ID ${idRange(FENCE_COUNT)})`,
  },
  {
    name: 'increase_voltage',
    usage: 'increase_voltage [ID]',
    summary: `Raise fence voltage (ID ${idRange(FENCE_COUNT)})`,
  },
  { name: 'dispatch_patrol', usage: 'dispatch_patrol', summary: 'Dispatch security patrol' },
  {
    name: 'generator_restart',
    usage: 'generator_restart [ID]',
    summary: `Restart generator (ID ${idRange(GENERATOR_COUNT)})`,
  },
  {
    name: 'cam_reboot',
    usage: 'cam_reboot [ID]',
    summary: `Queue camera reboot (ID ${idRange(CAMERA_COUNT)})`,
  },
  {
    name: 'power_reroute',
    usage: 'power_reroute [ZONE]',
    summary: `Queue power reroute (ZONE ${idRange(ZONE_COUNT)})`,
  },
  { name: 'emergency_venting', usage: 'emergency_venting', summary: 'Emergency generator venting' },
  {
    name: 'lethal_authorization',
    usage: 'lethal_authorization',
    summary: 'Authorize lethal containment protocol',
  },
  { name: 'system_hard_reboot', usage: 'system_hard_reboot', summary: 'Full system hard reboot' },
] as const;

export const TERMINAL_HELP_LINES: readonly string[] = [
  'JP-OS COMMAND SET:',
  ...TERMINAL_COMMAND_DEFS.map((c) => `  ${c.usage.padEnd(24)} — ${c.summary}`),
] as const;

/** Direct queue commands typed as `action_name` or `action_name <param>`. */
export const TERMINAL_QUEUE_ACTIONS: Record<string, 'id' | 'zone' | null> = {
  reset_fence: 'id',
  increase_voltage: 'id',
  generator_restart: 'id',
  cam_reboot: 'id',
  power_reroute: 'zone',
  dispatch_patrol: null,
  emergency_venting: null,
  lethal_authorization: null,
  system_hard_reboot: null,
};

export function terminalActionNeedsParam(type: string): boolean {
  return TERMINAL_QUEUE_ACTIONS[type] != null;
}
