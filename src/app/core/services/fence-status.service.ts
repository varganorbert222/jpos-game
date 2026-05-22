import { Injectable, computed, inject, signal } from '@angular/core';
import { FenceGridStatus } from '../types/fence-status';
import { SimulationBridgeService } from './simulation-bridge.service';
import type { SimulationSnapshot } from '../../../simulation';

@Injectable({ providedIn: 'root' })
export class FenceStatusService {
  private readonly sim = inject(SimulationBridgeService);

  private readonly hardRebootPending = signal(false);
  private readonly bootAlert = signal<'offline' | 'verify' | null>(null);
  private postLoginVerifyPending = false;

  readonly gridLabel = computed(() => {
    if (this.hardRebootPending()) {
      return FenceGridStatus.OFFLINE;
    }
    const alert = this.bootAlert();
    if (alert === 'offline') {
      return FenceGridStatus.OFFLINE;
    }
    if (alert === 'verify') {
      return FenceGridStatus.VERIFY_POWER;
    }
    return this.labelFromSimulation(this.sim.snapshot());
  });

  readonly isVerifyPower = computed(
    () => this.gridLabel() === FenceGridStatus.VERIFY_POWER,
  );

  readonly isCritical = computed(() => {
    const label = this.gridLabel();
    return (
      label === FenceGridStatus.OFFLINE ||
      label === FenceGridStatus.GRID_BLACKOUT ||
      label === FenceGridStatus.MULTIPLE_BREACH ||
      label === FenceGridStatus.BREACH ||
      label === FenceGridStatus.CRITICAL
    );
  });

  beginHardReboot(): void {
    this.hardRebootPending.set(true);
    this.bootAlert.set('offline');
    this.postLoginVerifyPending = true;
  }

  applyPostLoginIfScheduled(): void {
    if (!this.postLoginVerifyPending) {
      return;
    }
    this.postLoginVerifyPending = false;
    this.hardRebootPending.set(false);
    this.bootAlert.set('verify');
  }

  reset(): void {
    this.hardRebootPending.set(false);
    this.bootAlert.set(null);
    this.postLoginVerifyPending = false;
  }

  private labelFromSimulation(snap: SimulationSnapshot | null): string {
    if (!snap) {
      return FenceGridStatus.STANDBY;
    }
    if (snap.globalBlackout) {
      return FenceGridStatus.GRID_BLACKOUT;
    }

    const breached = snap.fences.filter((f) => f.state === 'Breached');
    if (breached.length >= 2) {
      return FenceGridStatus.MULTIPLE_BREACH;
    }
    if (breached.length === 1) {
      return FenceGridStatus.BREACH;
    }

    if (snap.fences.some((f) => f.state === 'Sparking')) {
      return FenceGridStatus.CRITICAL;
    }
    if (
      snap.fences.some(
        (f) => f.state === 'Unstable' || f.state === 'Intermittent',
      )
    ) {
      return FenceGridStatus.UNSTABLE;
    }

    const avgVoltage =
      snap.fences.reduce((sum, f) => sum + f.voltage, 0) / snap.fences.length;
    if (avgVoltage < 45) {
      return FenceGridStatus.LOW_VOLTAGE;
    }

    return FenceGridStatus.NOMINAL;
  }
}
