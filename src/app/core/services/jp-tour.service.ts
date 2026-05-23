import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ZONE_NAMES } from '../../../simulation/constants';
import type { SimulationSnapshot, ZoneId } from '../../../simulation/types';
import type { TourRun, TourVehicle } from '../types/jp-tour';
import { SimulationBridgeService } from './simulation-bridge.service';

const DEFAULT_ROUTE: (0 | 1 | 2 | 3 | 4 | 5)[] = [5, 0, 1, 2, 5];

function buildFleet(): TourVehicle[] {
  return [1, 2, 3, 4].map((id) => ({
    id,
    label: `TOUR-${String(id).padStart(2, '0')}`,
    zoneId: 5 as const,
    route: [...DEFAULT_ROUTE],
    routeIndex: 0,
    status: 'garage' as const,
    doorsLocked: true,
    lightsOn: false,
    batteryPct: 88 + id * 2,
    signalPct: 92,
    cameraFrame: 0,
    passengers: 0,
  }));
}

@Injectable({ providedIn: 'root' })
export class JpTourService {
  private readonly sim = inject(SimulationBridgeService);
  private lastTick = -1;

  readonly vehicles = signal<TourVehicle[]>(buildFleet());
  readonly run = signal<TourRun>({
    active: false,
    startedTick: 0,
    routeName: 'VISITOR LOOP A',
  });
  readonly selectedVehicleId = signal(1);
  readonly lastMessage = signal('');

  readonly selectedVehicle = computed(
    () => this.vehicles().find((v) => v.id === this.selectedVehicleId()) ?? null,
  );

  readonly anyActive = computed(() =>
    this.vehicles().some((v) => v.status === 'active' || v.status === 'returning'),
  );

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      if (!snap || snap.gameOver || snap.tick === this.lastTick) {
        return;
      }
      this.lastTick = snap.tick;
      this.advanceFleet(snap);
    });
  }

  startTourRun(): void {
    const snap = this.sim.snapshot();
    if (!snap) {
      this.lastMessage.set('ERR: simulation offline');
      return;
    }
    if (snap.globalBlackout) {
      this.lastMessage.set('ERR: grid blackout — tours suspended');
      return;
    }
    if (snap.breachCount > 0) {
      this.lastMessage.set('ERR: containment breach — tours locked');
      return;
    }
    if (this.run().active) {
      this.lastMessage.set('WARN: tour already in progress');
      return;
    }
    this.run.set({
      active: true,
      startedTick: snap.tick,
      routeName: 'VISITOR LOOP A',
    });
    this.vehicles.update((list) =>
      list.map((v, i) => ({
        ...v,
        status: i === 0 ? 'boarding' : 'garage',
        doorsLocked: true,
        lightsOn: true,
        passengers: i === 0 ? 24 : 0,
        routeIndex: 0,
        zoneId: 5,
      })),
    );
    this.lastMessage.set('Tour departure authorized. TOUR-01 boarding.');
  }

  haltTourRun(): void {
    this.run.set({ active: false, startedTick: 0, routeName: 'VISITOR LOOP A' });
    this.vehicles.set(buildFleet());
    this.lastMessage.set('Tour run halted.');
  }

  selectVehicle(id: number): void {
    this.selectedVehicleId.set(id);
  }

  toggleDoors(id: number): void {
    this.vehicles.update((list) =>
      list.map((v) =>
        v.id === id && v.status !== 'active'
          ? { ...v, doorsLocked: !v.doorsLocked }
          : v,
      ),
    );
  }

  toggleLights(id: number): void {
    this.vehicles.update((list) =>
      list.map((v) => (v.id === id ? { ...v, lightsOn: !v.lightsOn } : v)),
    );
  }

  routeLabel(v: TourVehicle): string {
    return v.route.map((z) => ZONE_NAMES[z].slice(0, 3).toUpperCase()).join(' → ');
  }

  zoneLabel(zoneId: ZoneId): string {
    return ZONE_NAMES[zoneId];
  }

  private advanceFleet(snap: SimulationSnapshot): void {
    if (!this.run().active) {
      return;
    }
    const degraded = snap.globalBlackout || snap.breachCount > 0;

    this.vehicles.update((list) =>
      list.map((v) => {
        let next = { ...v, cameraFrame: (v.cameraFrame + 1) % 4 };

        if (degraded && v.status === 'active') {
          return {
            ...next,
            status: 'halted' as const,
            signalPct: Math.max(0, next.signalPct - 8),
            batteryPct: Math.max(0, next.batteryPct - 2),
          };
        }

        if (v.status === 'boarding' && snap.tick % 3 === 0) {
          return {
            ...next,
            status: 'active' as const,
            doorsLocked: true,
            passengers: 24,
          };
        }

        if (v.status === 'active' && snap.tick % 2 === 0) {
          const nextIndex = (v.routeIndex + 1) % v.route.length;
          const atEnd = nextIndex === 0;
          return {
            ...next,
            routeIndex: nextIndex,
            zoneId: v.route[nextIndex]!,
            status: atEnd ? ('returning' as const) : ('active' as const),
            signalPct: Math.max(40, next.signalPct - 1 + (snap.weather === 'Clear' ? 2 : 0)),
            batteryPct: Math.max(20, next.batteryPct - 1),
          };
        }

        if (v.status === 'returning' && snap.tick % 2 === 0) {
          return {
            ...next,
            zoneId: 5,
            status: 'garage' as const,
            doorsLocked: true,
            lightsOn: false,
            passengers: 0,
          };
        }

        return next;
      }),
    );

    const allGarage = this.vehicles().every((v) => v.status === 'garage');
    if (allGarage && this.run().active) {
      this.run.update((r) => ({ ...r, active: false }));
    }
  }
}
