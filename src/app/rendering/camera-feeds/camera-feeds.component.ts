import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CAMERA_FEED_ASSETS } from '../../core/constants/camera-feeds.config';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
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
  readonly page = signal(0);
  readonly feedsPerPage = 3;

  readonly feeds = computed((): CameraFeedView[] => {
    const snap = this.sim.snapshot();
    if (!snap) {
      return [];
    }
    return CAMERA_FEED_ASSETS.slice(0, 6).map((asset) => {
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

  constructor() {
    effect(() => {
      const pages = this.pageCount();
      if (this.page() >= pages) {
        this.page.set(Math.max(0, pages - 1));
      }
    });
  }

  prevPage(): void {
    this.page.update((value) => Math.max(0, value - 1));
  }

  nextPage(): void {
    this.page.update((value) => Math.min(this.pageCount() - 1, value + 1));
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
