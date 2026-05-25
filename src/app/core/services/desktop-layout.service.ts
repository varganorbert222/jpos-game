import { Injectable, effect, inject, signal } from '@angular/core';
import type { ZoneId } from '../../../simulation';
import { SimulationBridgeService } from './simulation-bridge.service';
import { UiSelectionService } from './ui-selection.service';
import { WindowManagerService } from '../../features/window-manager/window-manager.service';

@Injectable({ providedIn: 'root' })
export class DesktopLayoutService {
  private readonly sim = inject(SimulationBridgeService);
  private readonly selection = inject(UiSelectionService);
  private readonly wm = inject(WindowManagerService);

  readonly crisisMode = signal(false);

  private lastCrisisAutoOpen = '';

  constructor() {
    effect(() => {
      const snap = this.sim.snapshot();
      if (!snap) {
        this.crisisMode.set(false);
        return;
      }
      const breached = snap.fences.filter((f) => f.state === 'Breached');
      const breach = breached.length > 0;
      const critical =
        snap.stability < 25 ||
        snap.globalBlackout ||
        snap.breachCount >= 2 ||
        breach;
      this.crisisMode.set(critical);
      if (critical && breach) {
        const primary = breached[0]!;
        const key = `fence-${primary.id}-${snap.tick}`;
        if (this.lastCrisisAutoOpen !== key) {
          this.lastCrisisAutoOpen = key;
          this.selection.selectFence(primary.id, primary.zoneId as ZoneId);
          this.wm.open('fence');
        }
      }
    });
  }
}
