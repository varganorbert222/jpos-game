import type { ZoneId } from '../../../simulation/types';

export type TourVehicleStatus =
  | 'garage'
  | 'boarding'
  | 'active'
  | 'returning'
  | 'halted';

export interface TourVehicle {
  id: number;
  label: string;
  zoneId: ZoneId;
  route: ZoneId[];
  routeIndex: number;
  status: TourVehicleStatus;
  doorsLocked: boolean;
  lightsOn: boolean;
  batteryPct: number;
  signalPct: number;
  cameraFrame: number;
  passengers: number;
}

export interface TourRun {
  active: boolean;
  startedTick: number;
  routeName: string;
}
