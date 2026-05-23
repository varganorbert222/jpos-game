import { Injectable, computed, signal } from '@angular/core';
import type { DifficultyMode, SimulationSnapshot } from '../../../simulation';
import { computeRunScore } from '../utils/run-score';

const STORAGE_KEY = 'jpos-scoreboard-v1';
const MAX_GLOBAL = 25;
const MAX_PER_OPERATOR = 12;

export type ScoreboardOutcome = 'shift' | 'collapse';

export interface ScoreboardEntry {
  operatorUsername: string;
  operatorLabel: string;
  score: number;
  elapsedMs: number;
  tick: number;
  difficulty: DifficultyMode;
  outcome: ScoreboardOutcome;
  recordedAt: number;
  runSeed: number;
}

interface ScoreboardStore {
  version: 1;
  entries: ScoreboardEntry[];
}

@Injectable({ providedIn: 'root' })
export class ScoreboardService {
  private readonly entries = signal<ScoreboardEntry[]>(this.load());

  readonly globalTop = computed(() =>
    [...this.entries()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10),
  );

  bestForOperator(username: string): ScoreboardEntry | null {
    const key = username.trim().toLowerCase();
    const list = this.entries()
      .filter((e) => e.operatorUsername === key)
      .sort((a, b) => b.score - a.score);
    return list[0] ?? null;
  }

  recentForOperator(username: string, limit = 5): ScoreboardEntry[] {
    const key = username.trim().toLowerCase();
    return [...this.entries()]
      .filter((e) => e.operatorUsername === key)
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, limit);
  }

  recordRun(snap: SimulationSnapshot, outcome: ScoreboardOutcome): ScoreboardEntry {
    const entry: ScoreboardEntry = {
      operatorUsername: snap.operatorUsername || 'unknown',
      operatorLabel: snap.operatorDisplayLabel || 'OPERATOR',
      score: computeRunScore(snap),
      elapsedMs: snap.elapsedRealtimeMs,
      tick: snap.tick,
      difficulty: snap.difficultyMode,
      outcome,
      recordedAt: Date.now(),
      runSeed: snap.runSeed,
    };

    const next = [entry, ...this.entries()];
    const trimmed = this.trimStore(next);
    this.entries.set(trimmed);
    this.persist(trimmed);
    return entry;
  }

  private trimStore(all: ScoreboardEntry[]): ScoreboardEntry[] {
    const byOperator = new Map<string, ScoreboardEntry[]>();
    for (const e of all) {
      const list = byOperator.get(e.operatorUsername) ?? [];
      list.push(e);
      byOperator.set(e.operatorUsername, list);
    }

    const kept: ScoreboardEntry[] = [];
    for (const list of byOperator.values()) {
      list.sort((a, b) => b.recordedAt - a.recordedAt);
      kept.push(...list.slice(0, MAX_PER_OPERATOR));
    }

    kept.sort((a, b) => b.score - a.score);
    return kept.slice(0, MAX_GLOBAL);
  }

  private load(): ScoreboardEntry[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as ScoreboardStore;
      if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
        return [];
      }
      return parsed.entries;
    } catch {
      return [];
    }
  }

  private persist(entries: ScoreboardEntry[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const store: ScoreboardStore = { version: 1, entries };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}
