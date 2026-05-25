import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  camerasForZone,
  firstCameraPerZone,
} from '../../core/constants/camera-feeds.config';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { UiSelectionService } from '../../core/services/ui-selection.service';
import type { ZoneId } from '../../../simulation';
import {
  JpStatusIconComponent,
  type JpStatusKind,
} from '../../shared/jp-status-icon/jp-status-icon.component';

export interface CameraFeedView {
  id: number;
  zoneId: number;
  label: string;
  gifPath: string;
  state: string;
  statusKind: JpStatusKind;
  overlay: 'none' | 'static' | 'freeze' | 'corrupt';
}

@Component({
  selector: 'app-camera-feeds',
  standalone: true,
  imports: [JpStatusIconComponent],
  templateUrl: './camera-feeds.component.html',
  styleUrl: './camera-feeds.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraFeedsComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly selection = inject(UiSelectionService);
  readonly page = signal(0);
  readonly feedsPerPage = 3;

  readonly feedModeLabel = computed(() => {
    const z = this.selection.zoneId();
    return z != null ? `ZONE Z${z} CAMERAS` : 'ALL ZONES — FIRST CAM / PAGE';
  });

  readonly feeds = computed((): CameraFeedView[] => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    const zoneId = this.selection.zoneId();
    const assets =
      zoneId != null ? camerasForZone(zoneId) : firstCameraPerZone();
    return assets.map((asset) => {
      const cam = snap.cameras.find((c) => c.id === asset.cameraId) ?? {
        id: asset.cameraId,
        state: 'Offline' as const,
      };
      return {
        id: asset.cameraId,
        zoneId: asset.zoneId,
        label: asset.label,
        gifPath: asset.gifPath,
        state: cam.state,
        statusKind: this.statusKind(cam.state),
        overlay: this.overlayFor(cam.state, snap.telemetryCorruption),
      };
    });
  });

  readonly pageCount = computed(() => {
    const count = Math.ceil(this.feeds().length / this.feedsPerPage);
    return count > 0 ? count : 1;
  });

  readonly pageFeeds = computed(() => {
    const page = this.page();
    const start = page * this.feedsPerPage;
    return this.feeds().slice(start, start + this.feedsPerPage);
  });

  readonly canGoPrev = computed(() => this.page() > 0);

  readonly canGoNext = computed(() => this.page() < this.pageCount() - 1);

  constructor() {
    effect(() => {
      this.selection.zoneId();
      this.page.set(0);
    });
    effect(() => {
      const pages = this.pageCount();
      if (this.page() >= pages) {
        this.page.set(Math.max(0, pages - 1));
      }
    });
  }

  prevPage(): void {
    if (!this.canGoPrev()) {
      return;
    }
    this.page.update((value) => value - 1);
  }

  nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.page.update((value) => value + 1);
  }

  selectFeed(feed: CameraFeedView): void {
    this.selection.selectCamera(feed.id, feed.zoneId as ZoneId);
  }

  private statusKind(state: string): JpStatusKind {
    switch (state) {
      case 'Online':
        return 'online';
      case 'Offline':
        return 'offline';
      case 'Corrupted':
        return 'corrupt';
      case 'Interference':
      case 'Delayed':
        return 'warn';
      default:
        return 'idle';
    }
  }

  private overlayFor(
    state: string,
    corruption: number,
  ): CameraFeedView['overlay'] {
    if (state === 'Offline') {
      return 'static';
    }
    if (state === 'Delayed') {
      return 'freeze';
    }
    if (state === 'Corrupted' || corruption > 65) {
      return 'corrupt';
    }
    return 'none';
  }
}
