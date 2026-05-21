import { IslaNublarZoneLayout } from '../interfaces/isla-nublar-zone-layout.interface';

export type ZoneMapState =
  | 'nominal'
  | 'warn'
  | 'danger'
  | 'critical'
  | 'blackout';

/** Schematic Isla Nublar — deterministic layout for renderer */
export const ISLA_NUBLAR_OUTLINE: readonly { x: number; y: number }[] = [
  { x: 0.52, y: 0.08 },
  { x: 0.68, y: 0.14 },
  { x: 0.78, y: 0.28 },
  { x: 0.82, y: 0.45 },
  { x: 0.75, y: 0.62 },
  { x: 0.58, y: 0.78 },
  { x: 0.4, y: 0.82 },
  { x: 0.22, y: 0.72 },
  { x: 0.14, y: 0.52 },
  { x: 0.18, y: 0.32 },
  { x: 0.32, y: 0.16 },
  { x: 0.52, y: 0.08 },
];

export const ISLA_NUBLAR_ZONES: readonly IslaNublarZoneLayout[] = [
  {
    id: 0,
    code: 'HN',
    label: 'Herbivore N',
    x: 0.38,
    y: 0.18,
    w: 0.22,
    h: 0.18,
  },
  {
    id: 1,
    code: 'HS',
    label: 'Herbivore S',
    x: 0.28,
    y: 0.42,
    w: 0.24,
    h: 0.2,
  },
  { id: 2, code: 'PE', label: 'Predator E', x: 0.58, y: 0.32, w: 0.2, h: 0.22 },
  { id: 3, code: 'PW', label: 'Predator W', x: 0.2, y: 0.28, w: 0.2, h: 0.2 },
  { id: 4, code: 'RS', label: 'Research', x: 0.48, y: 0.52, w: 0.18, h: 0.16 },
  { id: 5, code: 'VS', label: 'Visitor', x: 0.42, y: 0.66, w: 0.22, h: 0.18 },
];

export const ZONE_STATE_COLORS: Record<ZoneMapState, string> = {
  nominal: '#5fde5f',
  warn: '#ffcc33',
  danger: '#ff8800',
  critical: '#ff4444',
  blackout: '#444444',
};
