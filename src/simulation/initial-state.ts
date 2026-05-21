import {
  CAMERA_COUNT,
  DINOSAUR_COUNT,
  FENCE_COUNT,
  GENERATOR_COUNT,
  MAINTENANCE_TEAM_COUNT,
  ZONE_COUNT,
  ZONE_NAMES,
} from './constants';
import type {
  Camera,
  Dinosaur,
  Fence,
  Generator,
  SimulationState,
  Zone,
  ZoneId,
} from './types';

const SPECIES = ['Raptor', 'T-Rex', 'Trike', 'Spino', 'Dilo', 'Brachio'] as const;

function zoneForIndex(index: number, perGroup: number): ZoneId {
  return Math.floor(index / perGroup) as ZoneId;
}

function buildZones(): Zone[] {
  return ZONE_NAMES.map((name, id) => ({
    id: id as ZoneId,
    name,
    stabilityContribution: 100 / ZONE_COUNT,
  }));
}

function buildFences(): Fence[] {
  const fences: Fence[] = [];
  for (let i = 0; i < FENCE_COUNT; i++) {
    const zoneId = zoneForIndex(i, 2) as ZoneId;
    fences.push({
      id: i,
      zoneId,
      voltage: 70 + (i % 3) * 5,
      integrity: 85 - (i % 4),
      stress: 15 + (i % 5),
      state: 'Stable',
      learnedWeaknessTicks: 0,
    });
  }
  return fences;
}

function buildGenerators(): Generator[] {
  return Array.from({ length: GENERATOR_COUNT }, (_, id) => ({
    id,
    fuel: 80,
    load: 55 + id * 8,
    temperature: 45 + id * 5,
    online: true,
  }));
}

function buildCameras(): Camera[] {
  const cameras: Camera[] = [];
  let id = 0;
  for (let z = 0; z < ZONE_COUNT; z++) {
    const count = z < 4 ? 2 : 1;
    for (let c = 0; c < count; c++) {
      cameras.push({
        id: id++,
        zoneId: z as ZoneId,
        state: 'Online',
        powerAllocated: 80,
        displayFrame: 0,
      });
    }
  }
  return cameras;
}

function buildDinosaurs(): Dinosaur[] {
  const dinosaurs: Dinosaur[] = [];
  let perZone = [3, 3, 3, 3, 3, 3];
  let id = 0;
  for (let z = 0; z < ZONE_COUNT; z++) {
    for (let d = 0; d < perZone[z]; d++) {
      const seed = id * 17 + z * 3;
      dinosaurs.push({
        id: id++,
        zoneId: z as ZoneId,
        species: SPECIES[seed % SPECIES.length],
        aiState: 'Idle',
        stress: 20 + (seed % 30),
        visibleAggression: 25 + (seed % 20),
        intelligence: 30 + (seed % 50),
        aggression: 35 + (seed % 40),
        escalationTendency: 20 + (seed % 30),
        patternRecognition: 10 + (seed % 25),
        ticksInState: 0,
        targetFenceId: null,
      });
    }
  }
  return dinosaurs;
}

export function createInitialState(seed = 0x4a504f53): SimulationState {
  return {
    tick: 0,
    elapsedRealtimeMs: 0,
    rngSeed: seed,
    stability: 100,
    breachCount: 0,
    blackoutTicks: 0,
    visitorSectorCompromisedTicks: 0,
    weather: 'Clear',
    escalationPhase: 1,
    globalBlackout: false,
    zones: buildZones(),
    fences: buildFences(),
    generators: buildGenerators(),
    cameras: buildCameras(),
    dinosaurs: buildDinosaurs(),
    teams: Array.from({ length: MAINTENANCE_TEAM_COUNT }, (_, id) => ({
      id,
      zoneId: (id * 2) as ZoneId,
      fatigue: 20,
      busyTicks: 0,
    })),
    helicopter: { zoneId: 5, enabled: true, busyTicks: 0 },
    resources: {
      fuel: 100,
      tranquilizerAmmo: 12,
      spareParts: 8,
      medicalSupplies: 10,
    },
    powerAllocation: { fences: 40, cameras: 25, logistics: 20, sensors: 15 },
    activeEvents: [],
    queuedEvents: [],
    actionQueue: [],
    eventProbMinor: 0.12,
    eventProbMajor: 0.04,
    eventProbCritical: 0.01,
    lastEscalationBumpMs: 0,
    autosaveDue: false,
    gameOver: false,
    gameOverReason: null,
    logEntries: ['[BOOT] Jurassic Park Operations OS v3.0 online.'],
    alertEntries: [],
    operatorCriticalCount: 0,
    telemetryCorruption: 0,
    nextEventId: 1,
    nextActionId: 1,
  };
}
