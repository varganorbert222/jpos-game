import { Injectable, computed, signal } from '@angular/core';
import type { ZoneId } from '../../../simulation';

export type SelectionFocus = 'zone' | 'fence' | 'camera' | 'generator' | 'dino';

export interface UiSelection {
  focus: SelectionFocus;
  zoneId: ZoneId;
  fenceId?: number;
  cameraId?: number;
  generatorId?: number;
  dinoId?: number;
}

@Injectable({ providedIn: 'root' })
export class UiSelectionService {
  readonly selection = signal<UiSelection | null>(null);

  readonly zoneId = computed(() => this.selection()?.zoneId ?? null);
  readonly fenceId = computed(() => this.selection()?.fenceId ?? null);
  readonly cameraId = computed(() => this.selection()?.cameraId ?? null);
  readonly generatorId = computed(() => this.selection()?.generatorId ?? null);
  readonly dinoId = computed(() => this.selection()?.dinoId ?? null);

  selectZone(zoneId: ZoneId): void {
    this.selection.set({ focus: 'zone', zoneId });
  }

  selectFence(fenceId: number, zoneId: ZoneId): void {
    this.selection.set({ focus: 'fence', zoneId, fenceId });
  }

  selectCamera(cameraId: number, zoneId: ZoneId): void {
    this.selection.set({ focus: 'camera', zoneId, cameraId });
  }

  selectGenerator(generatorId: number, zoneId: ZoneId = 0): void {
    this.selection.set({ focus: 'generator', zoneId, generatorId });
  }

  selectDino(dinoId: number, zoneId: ZoneId): void {
    this.selection.set({ focus: 'dino', zoneId, dinoId });
  }

  clear(): void {
    this.selection.set(null);
  }

  isZoneSelected(zoneId: ZoneId): boolean {
    return this.selection()?.zoneId === zoneId;
  }
}
