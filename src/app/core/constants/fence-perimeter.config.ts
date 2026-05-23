import type { ZoneId } from '../../../simulation/types';

/** Schematic placement of fence segments inside each zone box (normalized 0–1). */
export interface FenceMapMarker {
  fenceId: number;
  zoneId: ZoneId;
  /** Per-zone segment label shown on map (A/B). */
  segment: 'A' | 'B';
  nx: number;
  ny: number;
}

const SEGMENT_OFFSETS: readonly { segment: 'A' | 'B'; nx: number; ny: number }[] = [
  { segment: 'A', nx: 0.12, ny: 0.38 },
  { segment: 'B', nx: 0.72, ny: 0.62 },
];

/** Deterministic fence ↔ zone map (2 segments per zone, F0–F11). */
export const FENCE_MAP_MARKERS: readonly FenceMapMarker[] = Array.from(
  { length: 12 },
  (_, fenceId) => {
    const zoneId = Math.floor(fenceId / 2) as ZoneId;
    const seg = SEGMENT_OFFSETS[fenceId % 2]!;
    return {
      fenceId,
      zoneId,
      segment: seg.segment,
      nx: seg.nx,
      ny: seg.ny,
    };
  },
);

export function fenceMarkersInZone(zoneId: ZoneId): readonly FenceMapMarker[] {
  return FENCE_MAP_MARKERS.filter((m) => m.zoneId === zoneId);
}

export function fenceIdsInZone(zoneId: ZoneId): number[] {
  return fenceMarkersInZone(zoneId).map((m) => m.fenceId);
}
