import raw from './gameplay-config.json';

/** Egy konfigurációs mező: finomhangolható érték + magyar dokumentáció. */
export interface ConfigField<T> {
  v: T;
  hu: string;
  min: number;
  max: number;
}

export type DifficultyId = 'tutorial' | 'easy' | 'normal' | 'veteran';

export interface DifficultyConfig {
  label: ConfigField<string>;
  deterministic: ConfigField<boolean>;
  maxActiveIncidents: ConfigField<number>;
  warnPhaseTicks: ConfigField<number>;
  escalatingPhaseTicks: ConfigField<number>;
  ghostAlertsEnabled: ConfigField<boolean>;
  mailVirusChanceUnknown: ConfigField<number>;
  mailVirusChanceSpoof: ConfigField<number>;
  avgNewIncidentIntervalTicks: ConfigField<number>;
  phase4ProbabilityCap: ConfigField<number>;
  recoveryQuietTicks?: ConfigField<number>;
  recoveryWindowTicks?: ConfigField<number>;
  blackSwanMaxPerRun?: ConfigField<number>;
  incidentSpikeMaxConcurrent?: ConfigField<number>;
  incidentSpikeDurationTicks?: ConfigField<number>;
}

export interface GameplayConfigRoot {
  version: number;
  params: Record<string, ConfigField<number | boolean>>;
  difficulties: Record<DifficultyId, DifficultyConfig>;
  mail: Record<string, ConfigField<unknown>>;
  actions: Record<string, ConfigField<number | boolean>>;
  bot: Record<string, ConfigField<number | boolean>>;
}

const root = raw as unknown as GameplayConfigRoot;

export const GAMEPLAY_CONFIG: GameplayConfigRoot = root;

export function configValue<T>(field: ConfigField<T>): T {
  return field.v;
}

export function getDifficultyConfig(id: DifficultyId): DifficultyConfig {
  return GAMEPLAY_CONFIG.difficulties[id];
}

export function getParamNumber(key: keyof typeof root.params): number {
  const field = root.params[key];
  return typeof field.v === 'number' ? field.v : Number(field.v);
}

export function getParamBoolean(key: keyof typeof root.params): boolean {
  return Boolean(root.params[key].v);
}

export function getActionNumber(key: keyof typeof root.actions): number {
  return Number(root.actions[key].v);
}

export function getMailNumber(key: string): number {
  const field = root.mail[key] as ConfigField<number> | undefined;
  return field ? Number(field.v) : 0;
}

export function getMailTrustedSenders(): readonly string[] {
  return root.mail['trustedSenders'].v as string[];
}

export function getMailSpoofPatterns(): readonly string[] {
  return root.mail['spoofSenderPatterns'].v as string[];
}

export function tickRealtimeMs(): number {
  return getParamNumber('tickRealtimeMs');
}

export function shiftWinElapsedMs(): number {
  return getParamNumber('shiftWinElapsedMs');
}

/** Új random seed (live run) — nem determinisztikus játékhoz. */
export function generateRunSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]! >>> 0;
  }
  return (Date.now() ^ (Math.random() * 0x1_0000_0000)) >>> 0;
}

export function logRunSeed(seed: number, difficulty: DifficultyId): void {
  if (!getParamBoolean('logRunSeedToConsole')) {
    return;
  }
  console.info(
    `[JP-OS] run seed=0x${seed.toString(16).toUpperCase()} (${seed}) difficulty=${difficulty} — replay: use this seed in playtest bot`,
  );
}
