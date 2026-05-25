/** Quick operator actions shown in the right panel (3-column grid). */
export interface OperatorActionDef {
  type: string;
  label: string;
  /** Maps to TERMINAL_QUEUE_ACTIONS param kind */
  paramKind: 'id' | 'zone' | null;
  warn?: boolean;
  critical?: boolean;
}

export const OPERATOR_QUICK_ACTIONS: readonly OperatorActionDef[] = [
  { type: 'reset_fence', label: 'RESET FENCE', paramKind: 'id' },
  { type: 'increase_voltage', label: 'VOLT+ FENCE', paramKind: 'id' },
  { type: 'decrease_voltage', label: 'VOLT- FENCE', paramKind: 'id' },
  { type: 'dispatch_patrol', label: 'PATROL', paramKind: 'zone' },
  { type: 'generator_restart', label: 'GEN RESTART', paramKind: 'id' },
  { type: 'refuel_generator', label: 'REFUEL GEN', paramKind: 'id' },
  { type: 'cam_reboot', label: 'CAM REBOOT', paramKind: 'id' },
  { type: 'power_reroute', label: 'POWER REROUTE', paramKind: 'zone' },
  { type: 'seal_breach', label: 'SEAL BREACH', paramKind: 'id' },
  { type: 'dino_sedate', label: 'DINO SEDATE', paramKind: 'id' },
  { type: 'emergency_venting', label: 'EMERG VENT', paramKind: null, warn: true },
  { type: 'lethal_authorization', label: 'LETHAL AUTH', paramKind: null, warn: true },
] as const;
