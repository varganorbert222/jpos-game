import { ZoneId } from '../../../simulation';

export interface IslaNublarZoneLayout {
  id: ZoneId;
  code: string;
  label: string;
  /** Normalized 0–1 schematic coordinates on island canvas */
  x: number;
  y: number;
  w: number;
  h: number;
}
