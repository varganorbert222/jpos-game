export type ZoneId = 0 | 1 | 2 | 3 | 4 | 5;

export type FenceState = 'Stable' | 'Unstable' | 'Sparking' | 'Intermittent' | 'Breached';

export type CameraState = 'Online' | 'Delayed' | 'Interference' | 'Corrupted' | 'Offline';

export type DinoAiState = 'Idle' | 'Roaming' | 'Agitated' | 'Hunting' | 'FenceTesting';

export type EventSeverity = 'minor' | 'major' | 'critical';

export type IncidentPhase = 'warn' | 'escalating' | 'critical';

export type FieldOpKind = 'patrol' | 'seal_breach' | 'sedate' | 'generator_restart';

export type WeatherState = 'Clear' | 'Storm';

export type EscalationPhaseId = 1 | 2 | 3 | 4;

/** Live shift difficulty — set at system start from halted screen. */
export type DifficultyMode = 'tutorial' | 'easy' | 'normal' | 'veteran';

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
  targetZoneId: ZoneId | null;
  fatigue: number;
  busyTicks: number;
  travelTicksRemaining: number;
}

export interface FieldOperation {
  id: number;
  kind: FieldOpKind;
  targetZoneId: ZoneId;
  targetEntityId: number;
  ticksRemaining: number;
  phase: 'travel' | 'working' | 'returning';
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
  phase: IncidentPhase;
  phaseStartedTick: number;
  criticalApplied: boolean;
  isSoftware: boolean;
  targetZoneId?: ZoneId;
  targetFenceId?: number;
  targetDinoId?: number;
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
  runSeed: number;
  difficultyMode: DifficultyMode;
  infectionLevel: number;
  shiftObjectiveWon: boolean;
  operatorSlot: number;
  hardRebootCooldownTicks: number;
  rebootPowerOutageTicks: number;
  tourBonusTicksRemaining: number;
  ticksSinceLastIncidentStart: number;
  recoveryQuietTicksLeft: number;
  fieldOps: FieldOperation[];
  nextFieldOpId: number;
  heliTicksRemaining: number;
  heliTargetDinoId: number | null;
  heliPhase: 'idle' | 'travel' | 'dart' | 'sedating' | 'returning';
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
  /** Logged-in operator (set at run start from JP-OS login). */
  operatorUsername: string;
  operatorDisplayLabel: string;
  /** Tutorial script cursor (`system start tutorial`). */
  tutorialStep: number;
  tutorialBegun: boolean;
  tutorialAwaitingAction: boolean;
  /** Queued/terminal command issued; waiting for tick to execute and verify. */
  tutorialAwaitingStepCompletion: boolean;
  /** Ticks run freely between training steps (after an action completes). */
  tutorialInterlude: boolean;
  tutorialInterludeUntilTick: number;
  tutorialPendingStepIndex: number;
  /** Shown in UI while training waits for the operator. */
  tutorialObjective: string;
  tutorialScriptComplete: boolean;
  /** One-shot mail infection demo queued by tutorial script. */
  tutorialMailDemoPending: boolean;
  /** Stacked black swan incidents fired this run. */
  blackSwansThisRun: number;
}

export type SimulationSnapshot = Readonly<SimulationState>;
