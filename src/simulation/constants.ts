/** Fixed world counts — spec §4.1 */
export const ZONE_COUNT = 6;
export const FENCE_COUNT = 12;
export const GENERATOR_COUNT = 3;
export const CAMERA_COUNT = 9;
export const MAINTENANCE_TEAM_COUNT = 2;
export const DINOSAUR_COUNT = 18;
export const MAX_SIMULTANEOUS_EVENTS = 8;
export const EVENT_EXPIRE_TICKS = 30;
export const TICK_REALTIME_MS = 2000;
export const AUTOSAVE_INTERVAL_TICKS = 60;

export const BASE_WIDTH = 1600;
export const BASE_HEIGHT = 1200;

export const ZONE_NAMES = [
  'Herbivore North',
  'Herbivore South',
  'Predator East',
  'Predator West',
  'Research Sector',
  'Visitor Sector',
] as const;

export const ESCALATION_PHASES = [
  { id: 1, name: 'Routine', startMin: 0, endMin: 10 },
  { id: 2, name: 'Strain', startMin: 10, endMin: 25 },
  { id: 3, name: 'Breakdown', startMin: 25, endMin: 45 },
  { id: 4, name: 'Catastrophe', startMin: 45, endMin: Infinity },
] as const;

/** Event probabilities per tick — spec §9.3 */
export const EVENT_PROB_MINOR = 0.12;
export const EVENT_PROB_MAJOR = 0.04;
export const EVENT_PROB_CRITICAL = 0.01;

export const EVENT_PROB_CAPS = {
  minor: 0.35,
  major: 0.15,
  critical: 0.08,
} as const;

export const ESCALATION_INTERVAL_MS = 15 * 60 * 1000;
