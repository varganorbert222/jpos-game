import { Injectable, computed, inject } from '@angular/core';
import { SimulationBridgeService } from './simulation-bridge.service';

export type HealthCategory = 'Stable' | 'Unstable' | 'Critical';
export type TrendIndicator = '↑' | '↓' | '→';

@Injectable({ providedIn: 'root' })
export class UiTelemetryService {
  private readonly sim = inject(SimulationBridgeService);

  readonly corruption = computed(() => this.sim.snapshot()?.telemetryCorruption ?? 0);
  readonly tick = computed(() => this.sim.snapshot()?.tick ?? 0);
  readonly storm = computed(() => this.sim.snapshot()?.weather === 'Storm');

  jitterClass(): string {
    const c = this.corruption();
    return c > 35 ? 'telemetry-jitter' : '';
  }

  /** Deterministic display corruption — magenta ### per spec */
  formatMetric(actual: number, salt: number, suffix = ''): string {
    const c = this.corruption();
    const t = this.tick();
    if (c < 25) {
      return `${Math.round(actual)}${suffix}`;
    }
    const flicker = ((t + salt) * 17) % 5;
    if (flicker === 0 || c > 70) {
      return '###';
    }
    if (flicker === 1) {
      return `${Math.round(actual + (((t + salt) % 3) - 1) * 8)}${suffix}`;
    }
    return `${Math.round(actual)}${suffix}`;
  }

  healthFromStress(stress: number): HealthCategory {
    if (stress >= 75) {
      return 'Critical';
    }
    if (stress >= 45) {
      return 'Unstable';
    }
    return 'Stable';
  }

  trendFromDelta(delta: number): TrendIndicator {
    if (delta > 2) {
      return '↑';
    }
    if (delta < -2) {
      return '↓';
    }
    return '→';
  }

  /** Derived activity band — never exposes AI state */
  activityBand(visibleAggression: number, stress: number): string {
    const score = visibleAggression * 0.5 + stress * 0.5;
    if (score >= 70) {
      return 'HIGH';
    }
    if (score >= 40) {
      return 'ELEVATED';
    }
    return 'LOW';
  }

  staticNoiseOpacity(): number {
    const c = this.corruption();
    return this.storm() ? Math.min(0.5, 0.15 + c / 200) : 0;
  }
}
