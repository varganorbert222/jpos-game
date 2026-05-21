import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { AlertsPanelComponent } from '../panels/alerts-panel/alerts-panel.component';
import { CenterPanelComponent } from '../panels/center-panel/center-panel.component';
import { CliPanelComponent } from '../panels/cli-panel/cli-panel.component';
import { DockComponent } from '../panels/dock/dock.component';
import { WindowManagerComponent } from '../window-manager/window-manager.component';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [
    AlertsPanelComponent,
    CenterPanelComponent,
    CliPanelComponent,
    DockComponent,
    WindowManagerComponent,
  ],
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopComponent implements OnInit, OnDestroy {
  private readonly sim = inject(SimulationBridgeService);
  readonly snapshot = this.sim.snapshot;

  readonly currentTime = signal(new Date());
  private timeInterval: any;

  ngOnInit(): void {
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  readonly gameOver = computed(() => this.snapshot()?.gameOver ?? false);
  readonly tick = computed(() => this.snapshot()?.tick ?? 0);
  readonly phase = computed(() => this.snapshot()?.escalationPhase ?? 1);

  readonly bannerStatus = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'INITIALIZING...';
    }
    if (s.gameOver) {
      return 'SYSTEM COLLAPSE';
    }
    if (s.globalBlackout) {
      return 'BLACKOUT';
    }
    return 'READY...';
  });

  readonly statusLeft = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'WX: ---';
    }
    return `WX: ${s.weather} | STAB: ${Math.round(s.stability)}%`;
  });

  readonly statusRight = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return 'USER: HAMMOND';
    }
    const breaches = s.breachCount;
    return `BREACHES: ${breaches} | USER: OPS-1`;
  });

  readonly cpuUsage = computed(() => {
    const s = this.snapshot();
    if (!s) return 0;
    // Szimuláció alapú CPU: stabilítás és balesetek függvénye
    const base = (100 - s.stability) / 2 + Math.random() * 15;
    return Math.min(100, Math.max(15, Math.round(base + s.breachCount * 5)));
  });

  readonly ramUsage = computed(() => {
    const s = this.snapshot();
    if (!s) return 0;
    // Szimuláció alapú RAM: fázis és aktivitás függvénye
    const base = 30 + s.escalationPhase * 8 + Math.random() * 20;
    return Math.min(100, Math.round(base));
  });

  readonly storageUsage = computed(() => {
    const s = this.snapshot();
    if (!s) return 0;
    // Szimuláció alapú háttértár: tick és blackout függvénye
    const base =
      (s.tick % 1000) / 10 + (s.globalBlackout ? 50 : 0) + Math.random() * 10;
    return Math.min(100, Math.round(base));
  });

  readonly formattedTime = computed(() => {
    const time = this.currentTime();
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  });

  readonly timezone = computed(() => {
    const time = this.currentTime();
    const tzOffset = -time.getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    return `UTC${sign}${hours}:${minutes}`;
  });
}
