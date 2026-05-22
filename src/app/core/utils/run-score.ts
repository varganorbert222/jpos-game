import type { SimulationSnapshot } from '../../../simulation';

export function formatPlayDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** HH:MM:SS session stopwatch for sys-banner. */
export function formatElapsedClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Survival score for end-of-run modal (higher is better). */
export function computeRunScore(snap: SimulationSnapshot): number {
  const timePts = Math.floor(snap.elapsedRealtimeMs / 250);
  const stabilityPts = Math.round(snap.stability * 12);
  const phasePts = snap.escalationPhase * 150;
  const breachPenalty = snap.breachCount * 400;
  const blackoutPenalty = snap.blackoutTicks * 8;
  return Math.max(
    0,
    timePts + stabilityPts + phasePts - breachPenalty - blackoutPenalty,
  );
}
