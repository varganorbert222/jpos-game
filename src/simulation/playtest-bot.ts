import {
  configValue,
  GAMEPLAY_CONFIG,
  generateRunSeed,
  getMailNumber,
  logRunSeed,
  type ConfigField,
  type DifficultyId,
} from './gameplay-config';
import { SimulationEngine } from './engine';
import type { SimulationState } from './types';

/** Bot viselkedés — finomhangoláshoz, determinisztikus seeddel. */
export type PlaytestBotStrategy =
  | 'normal'
  | 'perfect'
  | 'chaotic'
  | 'only_lose'
  | 'only_win'
  | 'open_all_virus'
  | 'avoid_virus'
  | 'open_all_mail';

export interface PlaytestBotOptions {
  seed?: number;
  difficulty?: DifficultyId;
  maxTicks?: number;
  strategy?: PlaytestBotStrategy;
  /** 0–1: hibázás esélye chaotic/normal-nál */
  mistakeRate?: number;
  logDecisions?: boolean;
}

export interface PlaytestBotResult {
  seed: number;
  difficulty: DifficultyId;
  strategy: PlaytestBotStrategy;
  ticksRun: number;
  finalStability: number;
  gameOver: boolean;
  gameOverReason: string | null;
  shiftWon: boolean;
  infectionLevel: number;
  mailOpened: number;
  mailInfections: number;
  log: string[];
}

export function runPlaytestBot(options: PlaytestBotOptions = {}): PlaytestBotResult {
  const difficulty = options.difficulty ?? 'normal';
  const strategy = options.strategy ?? 'normal';
  const seed = options.seed ?? generateRunSeed();
  const maxTicks =
    options.maxTicks ??
    configValue(GAMEPLAY_CONFIG.bot['defaultMaxTicks'] as ConfigField<number>);
  const mistakeRate = options.mistakeRate ?? (strategy === 'chaotic' ? 0.35 : 0.08);
  const logDecisions =
    options.logDecisions ??
    configValue(GAMEPLAY_CONFIG.bot['logDecisions'] as ConfigField<boolean>);

  logRunSeed(seed, difficulty);

  const engine = new SimulationEngine(seed, difficulty);
  const log: string[] = [];
  let mailOpened = 0;
  let mailInfections = 0;

  for (let i = 0; i < maxTicks; i++) {
    const snap = engine.getSnapshot();
    if (snap.gameOver && strategy !== 'only_lose') {
      break;
    }
    if (snap.shiftObjectiveWon && strategy === 'only_win') {
      break;
    }

    const action = pickAction(engine.getSnapshot(), strategy, mistakeRate, i);
    if (action) {
      if (isMailOpen(action)) {
        mailOpened++;
        const inf = engine.getSnapshot().infectionLevel;
        engine.applyMailInfection(
          action.virus ? getMailNumber('infectionLevelOnVirus') : 0,
        );
        if (engine.getSnapshot().infectionLevel > inf) {
          mailInfections++;
        }
        if (logDecisions) {
          log.push(`T${snap.tick} mail_open {virus:${action.virus}}`);
        }
      } else {
        engine.queuePlayerAction(action.type, action.params);
        if (logDecisions) {
          log.push(`T${snap.tick} ${action.type} ${JSON.stringify(action.params ?? {})}`);
        }
      }
    }
    engine.runTick();
  }

  const final = engine.getSnapshot();
  return {
    seed,
    difficulty,
    strategy,
    ticksRun: final.tick,
    finalStability: final.stability,
    gameOver: final.gameOver,
    gameOverReason: final.gameOverReason,
    shiftWon: final.shiftObjectiveWon,
    infectionLevel: final.infectionLevel,
    mailOpened,
    mailInfections,
    log,
  };
}

type BotAction =
  | { type: 'mail_open'; virus: boolean }
  | { type: string; params?: Record<string, string | number> };

function isMailOpen(action: BotAction): action is { type: 'mail_open'; virus: boolean } {
  return action.type === 'mail_open';
}

function pickAction(
  snap: SimulationState,
  strategy: PlaytestBotStrategy,
  mistakeRate: number,
  tickIndex: number,
): BotAction | null {
  if (strategy === 'open_all_virus' || strategy === 'open_all_mail') {
    if (tickIndex % 20 === 5) {
      return { type: 'mail_open', virus: strategy === 'open_all_virus' };
    }
  }

  if (strategy === 'avoid_virus') {
    if (snap.infectionLevel > 20) {
      return { type: 'system_hard_reboot' };
    }
  }

  if (strategy === 'only_lose') {
    if (tickIndex % 15 === 0) {
      return { type: 'emergency_venting' };
    }
    return null;
  }

  if (Math.random() < mistakeRate && strategy !== 'perfect') {
    return { type: 'status' };
  }

  if (snap.infectionLevel > 25) {
    return { type: 'system_hard_reboot' };
  }

  const physical = pickPhysical(snap, strategy);
  if (physical) {
    return physical;
  }

  if (strategy === 'only_win') {
    return { type: 'status' };
  }

  return null;
}

function pickPhysical(
  snap: SimulationState,
  strategy: PlaytestBotStrategy,
): BotAction | null {
  if (snap.globalBlackout) {
    const offGen = snap.generators.find((g) => !g.online);
    if (offGen) {
      return { type: 'generator_restart', params: { id: offGen.id } };
    }
    return { type: 'power_reroute', params: { zone: 0 } };
  }

  const breached = snap.fences.find((f) => f.state === 'Breached');
  if (breached) {
    const hunting = snap.dinosaurs.find((d) => d.aiState === 'Hunting');
    if (hunting) {
      return strategy === 'perfect'
        ? { type: 'dino_sedate', params: { id: hunting.id } }
        : { type: 'seal_breach', params: { id: breached.id } };
    }
    return { type: 'seal_breach', params: { id: breached.id } };
  }

  const hunting = snap.dinosaurs.find((d) => d.aiState === 'Hunting');
  if (hunting) {
    return { type: 'dino_sedate', params: { id: hunting.id } };
  }

  const lowV = snap.fences.find((f) => f.voltage < 45 && f.state !== 'Breached');
  if (lowV) {
    return { type: 'increase_voltage', params: { id: lowV.id } };
  }

  const offlineCam = snap.cameras.find((c) => c.state === 'Offline');
  if (offlineCam) {
    return { type: 'cam_reboot', params: { id: offlineCam.id } };
  }

  const hotGen = snap.generators.find((g) => g.online && g.temperature > 80);
  if (hotGen) {
    return { type: 'generator_restart', params: { id: hotGen.id } };
  }

  return null;
}
