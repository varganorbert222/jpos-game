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
  ISLA_NUBLAR_OUTLINE,
  ISLA_NUBLAR_ZONES,
  ZONE_STATE_COLORS,
  type ZoneMapState,
} from '../../core/constants/isla-nublar-map.config';
import type { SimulationSnapshot, ZoneId } from '../../../simulation';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';

@Component({
  selector: 'app-zone-map-canvas',
  standalone: true,
  template: `
    <div class="map-wrap" data-region="isla-nublar-map">
      <canvas #mapCanvas width="900" height="360"></canvas>
      <ul class="map-legend">
        @for (z of legend(); track z.code) {
          <li [attr.data-zone]="z.id" [attr.data-state]="z.state">
            <span class="map-legend__swatch" [style.background]="z.color"></span>
            <span>{{ z.code }}: {{ z.label }} ({{ z.state }})</span>
          </li>
        }
      </ul>
    </div>
  `,
  styleUrl: './zone-map-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneMapCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly sim = inject(SimulationBridgeService);
  private ctx: CanvasRenderingContext2D | null = null;

  readonly legend = computed(() => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    return ISLA_NUBLAR_ZONES.map((z) => {
      const state = this.zoneState(snap, z.id);
      return {
        id: z.id,
        code: z.code,
        label: z.label,
        state,
        color: ZONE_STATE_COLORS[state],
      };
    });
  });

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      if (snap && this.ctx) {
        this.draw(snap);
      }
    });
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
    const w = 900;
    const h = 360;
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
      ctx.strokeStyle = '#102030';
      ctx.lineWidth = state === 'critical' ? 3 : 2;
      ctx.strokeRect(zx, zy, zw, zh);

      ctx.fillStyle = state === 'blackout' ? '#cccccc' : '#000000';
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillText(zone.code, zx + 6, zy + 16);
      ctx.font = 'bold 10px Courier New, monospace';
      ctx.fillText(zone.label.toUpperCase(), zx + 6, zy + 30);
      ctx.fillText(state.toUpperCase(), zx + 6, zy + zh - 8);

      const dinoCount = snap.dinosaurs.filter((d) => d.zoneId === zone.id).length;
      ctx.fillStyle = '#102030';
      ctx.fillText(`D:${dinoCount}`, zx + zw - 40, zy + zh - 8);
    }

    if (snap.globalBlackout) {
      ctx.fillStyle = '#444444';
      ctx.fillRect(16, 24, w - 32, h - 48);
      ctx.fillStyle = '#cc2222';
      ctx.font = 'bold 18px Courier New, monospace';
      ctx.fillText('GRID: BLACKOUT', 360, h / 2);
    }
  }
}
