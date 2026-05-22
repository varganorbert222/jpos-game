/** Perimeter / fence readout on PARK GRID (not sys-banner). */
export const FenceGridStatus = {
  OFFLINE: 'FENCE OFFLINE',
  VERIFY_POWER: 'VERIFY FENCE POWER',
  GRID_BLACKOUT: 'PERIMETER POWER LOSS',
  MULTIPLE_BREACH: 'MULTIPLE FENCE BREACH',
  BREACH: 'CONTAINMENT BREACH',
  CRITICAL: 'FENCE CRITICAL',
  UNSTABLE: 'FENCE STRESS ELEVATED',
  LOW_VOLTAGE: 'FENCE LOW VOLTAGE',
  NOMINAL: 'PERIMETER NOMINAL',
  STANDBY: 'FENCE MONITOR STANDBY',
} as const;

export type FenceGridStatusLabel =
  (typeof FenceGridStatus)[keyof typeof FenceGridStatus];
