export type ZoneId = 0 | 1 | 2 | 3 | 4 | 5;

export type FenceState = 'Stable' | 'Unstable' | 'Sparking' | 'Intermittent' | 'Breached';

export type CameraState = 'Online' | 'Delayed' | 'Interference' | 'Corrupted' | 'Offline';

export type DinoAiState = 'Idle' | 'Roaming' | 'Agitated' | 'Hunting' | 'FenceTesting';

export type EventSeverity = 'minor' | 'major' | 'critical';

export type WeatherState = 'Clear' | 'Storm';

export type EscalationPhaseId = 1 | 2 | 3 | 4;

export interface Fence {
  id: number;
  zoneId: ZoneId;
  voltage: number;
  integrity: number;
  stress: number;
  state: FenceState;
  learnedWeaknessTicks: number;
}

export interface Generator {
  id: number;
  fuel: number;
  load: number;
  temperature: number;
  online: boolean;
}

export interface Camera {
  id: number;
  zoneId: ZoneId;
  state: CameraState;
  powerAllocated: number;
  displayFrame: number;
}

export interface Dinosaur {
  id: number;
  zoneId: ZoneId;
  species: string;
  aiState: DinoAiState;
  stress: number;
  visibleAggression: number;
  intelligence: number;
  aggression: number;
  escalationTendency: number;
  patternRecognition: number;
  ticksInState: number;
  targetFenceId: number | null;
}

export interface MaintenanceTeam {
  id: number;
  zoneId: ZoneId;
  fatigue: number;
  busyTicks: number;
}

export interface Helicopter {
  zoneId: ZoneId;
  enabled: boolean;
  busyTicks: number;
}

export interface Zone {
  id: ZoneId;
  name: string;
  stabilityContribution: number;
}

export interface GameEvent {
  id: number;
  severity: EventSeverity;
  category: string;
  message: string;
  createdTick: number;
  expiresTick: number;
  resolved: boolean;
  targetZoneId?: ZoneId;
  targetFenceId?: number;
}

export interface QueuedPlayerAction {
  id: number;
  type: string;
  params: Record<string, string | number>;
  executeTick: number;
  cooldownTicks: number;
}

export interface PowerAllocation {
  fences: number;
  cameras: number;
  logistics: number;
  sensors: number;
}

export interface Resources {
  fuel: number;
  tranquilizerAmmo: number;
  spareParts: number;
  medicalSupplies: number;
}

export interface SimulationState {
  tick: number;
  elapsedRealtimeMs: number;
  rngSeed: number;
  stability: number;
  breachCount: number;
  blackoutTicks: number;
  visitorSectorCompromisedTicks: number;
  weather: WeatherState;
  escalationPhase: EscalationPhaseId;
  globalBlackout: boolean;
  zones: Zone[];
  fences: Fence[];
  generators: Generator[];
  cameras: Camera[];
  dinosaurs: Dinosaur[];
  teams: MaintenanceTeam[];
  helicopter: Helicopter;
  resources: Resources;
  powerAllocation: PowerAllocation;
  activeEvents: GameEvent[];
  queuedEvents: GameEvent[];
  actionQueue: QueuedPlayerAction[];
  eventProbMinor: number;
  eventProbMajor: number;
  eventProbCritical: number;
  lastEscalationBumpMs: number;
  autosaveDue: boolean;
  gameOver: boolean;
  gameOverReason: string | null;
  logEntries: string[];
  alertEntries: string[];
  operatorCriticalCount: number;
  telemetryCorruption: number;
  nextEventId: number;
  nextActionId: number;
}

export type SimulationSnapshot = Readonly<SimulationState>;
