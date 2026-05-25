import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
} from '@angular/core';
import {
  fenceMarkersInZone,
  type FenceMapMarker,
} from '../../core/constants/fence-perimeter.config';
import {
  ISLA_NUBLAR_OUTLINE,
  ISLA_NUBLAR_ZONES,
  ZONE_STATE_COLORS,
  type ZoneMapState,
} from '../../core/constants/isla-nublar-map.config';
import type { Fence, SimulationSnapshot, ZoneId } from '../../../simulation';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { UiSelectionService } from '../../core/services/ui-selection.service';

const MAP_SIZE = 600;
const MAP_W = MAP_SIZE;
const MAP_H = MAP_SIZE;

@Component({
  selector: 'app-zone-map-canvas',
  standalone: true,
  template: `
    <div class="map-wrap" data-region="isla-nublar-map">
      <div class="map-body">
        <div class="map-canvas-frame">
        <canvas
          #mapCanvas
          [attr.width]="mapSize"
          [attr.height]="mapSize"
          class="map-canvas"
          (click)="onCanvasClick($event)"
        ></canvas>
        </div>
      </div>
      <ul class="map-legend map-legend--compact">
        @for (z of legend(); track z.code) {
          <li
            [attr.data-zone]="z.id"
            [attr.data-state]="z.state"
            [attr.title]="z.label + ' — ' + z.fenceSummary"
            [class.map-legend__item--selected]="selection.isZoneSelected(z.id)"
            [class.map-legend__item--dim]="
              selection.zoneId() !== null && !selection.isZoneSelected(z.id)
            "
            role="button"
            tabindex="0"
            (click)="onLegendZone(z.id)"
            (keydown.enter)="onLegendZone(z.id)"
          >
            <span class="map-legend__swatch" [style.background]="z.color"></span>
            <span class="map-legend__zone-line">
              <strong>{{ z.code }}</strong> Z{{ z.id }}: {{ z.fenceSummary }}
            </span>
          </li>
        }
      </ul>
    </div>
  `,
  styleUrl: './zone-map-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneMapCanvasComponent implements AfterViewInit, OnDestroy {
  readonly mapSize = MAP_SIZE;

  @ViewChild('mapCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly sim = inject(SimulationBridgeService);
  readonly selection = inject(UiSelectionService);
  private ctx: CanvasRenderingContext2D | null = null;

  readonly legend = computed(() => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    return ISLA_NUBLAR_ZONES.map((z) => {
      const state = this.zoneState(snap, z.id);
      const fences = snap.fences.filter((f) => f.zoneId === z.id);
      const fenceSummary = fences.map((f) => `F${f.id}`).join(', ');
      return {
        id: z.id,
        code: z.code,
        label: z.label,
        state,
        color: ZONE_STATE_COLORS[state],
        fenceSummary,
      };
    });
  });

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      this.selection.selection();
      if (snap && this.ctx) {
        this.draw(snap);
      }
    });
  }

  onLegendZone(zoneId: ZoneId): void {
    this.selection.selectZone(zoneId);
  }

  onCanvasClick(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = MAP_W / rect.width;
    const scaleY = MAP_H / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const snap = this.sim.snapshot();
    if (!snap) {
      return;
    }
    const fenceHit = this.hitFenceMarker(snap, x, y);
    if (fenceHit) {
      this.selection.selectFence(fenceHit.fenceId, fenceHit.zoneId);
      return;
    }
    const zoneId = this.hitZone(x, y);
    if (zoneId != null) {
      this.selection.selectZone(zoneId);
      return;
    }
    this.selection.clear();
  }

  private hitZone(x: number, y: number): ZoneId | null {
    for (let i = ISLA_NUBLAR_ZONES.length - 1; i >= 0; i--) {
      const zone = ISLA_NUBLAR_ZONES[i]!;
      const zx = zone.x * (MAP_W - 32) + 16;
      const zy = zone.y * (MAP_H - 48) + 24;
      const zw = zone.w * (MAP_W - 32);
      const zh = zone.h * (MAP_H - 48);
      if (x >= zx && x <= zx + zw && y >= zy && y <= zy + zh) {
        return zone.id;
      }
    }
    return null;
  }

  private hitFenceMarker(
    snap: SimulationSnapshot,
    x: number,
    y: number,
  ): { fenceId: number; zoneId: ZoneId } | null {
    for (const zone of ISLA_NUBLAR_ZONES) {
      const zx = zone.x * (MAP_W - 32) + 16;
      const zy = zone.y * (MAP_H - 48) + 24;
      const zw = zone.w * (MAP_W - 32);
      const zh = zone.h * (MAP_H - 48);
      for (const marker of fenceMarkersInZone(zone.id)) {
        const px = zx + marker.nx * zw;
        const py = zy + marker.ny * zh;
        if (x >= px - 4 && x <= px + 58 && y >= py - 12 && y <= py + 14) {
          return { fenceId: marker.fenceId, zoneId: zone.id };
        }
      }
    }
    return null;
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
    }
    const snap = this.sim.snapshot();
    if (snap && this.ctx) {
      this.draw(snap);
    }
  }

  ngOnDestroy(): void {
    this.ctx = null;
  }

  private zoneState(snap: SimulationSnapshot, zoneId: ZoneId): ZoneMapState {
    if (snap.globalBlackout) {
      return 'blackout';
    }
    const fences = snap.fences.filter((f) => f.zoneId === zoneId);
    if (fences.some((f) => f.state === 'Breached')) {
      return 'critical';
    }
    if (fences.some((f) => f.stress >= 75)) {
      return 'danger';
    }
    if (fences.some((f) => f.stress >= 45 || f.integrity < 50)) {
      return 'warn';
    }
    return 'nominal';
  }

  private draw(snap: SimulationSnapshot): void {
    const ctx = this.ctx!;
    const w = MAP_W;
    const h = MAP_H;
    const selectedZone = this.selection.zoneId();
    ctx.fillStyle = '#6ba1d8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a8eb8';
    ctx.fillRect(8, 8, w - 16, h - 16);

    ctx.strokeStyle = '#102030';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ISLA_NUBLAR_OUTLINE.forEach((p, i) => {
      const px = p.x * (w - 32) + 16;
      const py = p.y * (h - 48) + 24;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();
    ctx.fillStyle = '#8ab0d0';
    ctx.fill();

    ctx.fillStyle = '#102030';
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.fillText('ISLA NUBLAR — SCHEMATIC', 20, 22);

    for (const zone of ISLA_NUBLAR_ZONES) {
      const state = this.zoneState(snap, zone.id);
      const zx = zone.x * (w - 32) + 16;
      const zy = zone.y * (h - 48) + 24;
      const zw = zone.w * (w - 32);
      const zh = zone.h * (h - 48);

      ctx.fillStyle = ZONE_STATE_COLORS[state];
      ctx.fillRect(zx, zy, zw, zh);
      const isSelected = selectedZone === zone.id;
      ctx.strokeStyle = isSelected ? '#ffff66' : '#102030';
      ctx.lineWidth = isSelected ? 4 : state === 'critical' ? 3 : 2;
      ctx.strokeRect(zx, zy, zw, zh);

      ctx.fillStyle = state === 'blackout' ? '#cccccc' : '#000000';
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillText(`${zone.code} · Z${zone.id}`, zx + 6, zy + 14);
      ctx.font = 'bold 9px Courier New, monospace';
      ctx.fillText(zone.label.toUpperCase(), zx + 6, zy + 26);

      const markers = fenceMarkersInZone(zone.id);
      for (const marker of markers) {
        this.drawFenceMarker(ctx, snap, marker, zx, zy, zw, zh, state === 'blackout');
      }

      ctx.fillStyle = state === 'blackout' ? '#cccccc' : '#102030';
      ctx.font = 'bold 9px Courier New, monospace';
      ctx.fillText(state.toUpperCase(), zx + 6, zy + zh - 6);

      const dinoCount = snap.dinosaurs.filter((d) => d.zoneId === zone.id).length;
      ctx.fillText(`D:${dinoCount}`, zx + zw - 36, zy + zh - 6);
    }

    if (snap.globalBlackout) {
      ctx.fillStyle = '#444444';
      ctx.fillRect(16, 24, w - 32, h - 48);
      ctx.fillStyle = '#cc2222';
      ctx.font = 'bold 18px Courier New, monospace';
      ctx.fillText('GRID: BLACKOUT', w / 2 - 72, h / 2);
    }
  }

  private drawFenceMarker(
    ctx: CanvasRenderingContext2D,
    snap: SimulationSnapshot,
    marker: FenceMapMarker,
    zx: number,
    zy: number,
    zw: number,
    zh: number,
    blackout: boolean,
  ): void {
    const fence = snap.fences[marker.fenceId];
    if (!fence) {
      return;
    }
    const px = zx + marker.nx * zw;
    const py = zy + marker.ny * zh;

    ctx.fillStyle = blackout ? '#333333' : '#102030';
    ctx.fillRect(px - 2, py - 10, 54, 22);
    ctx.strokeStyle = blackout ? '#888888' : '#e8f0f8';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 2, py - 10, 54, 22);

    const textColor = blackout ? '#cccccc' : this.fenceLabelColor(fence);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 9px Courier New, monospace';
    ctx.fillText(`F${fence.id}${marker.segment}`, px, py);
    ctx.font = '8px Courier New, monospace';
    ctx.fillText(`${Math.round(fence.voltage)}V`, px, py + 9);
  }

  private fenceLabelColor(fence: Fence): string {
    if (fence.state === 'Breached') {
      return '#ff4444';
    }
    if (fence.state === 'Sparking' || fence.state === 'Intermittent') {
      return '#ff8800';
    }
    if (fence.state === 'Unstable' || fence.voltage < 50) {
      return '#ffcc33';
    }
    return '#102030';
  }
}
