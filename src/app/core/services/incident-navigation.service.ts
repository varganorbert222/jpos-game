import { Injectable, inject } from '@angular/core';
import type { IncidentDisplayItem } from './game-feedback.service';
import { UiSelectionService } from './ui-selection.service';
import { WindowManagerService } from '../../features/window-manager/window-manager.service';
import { incidentRequiresDockTerminal } from '../constants/operator-workflow.config';
import { dockAppForIncident, parseIncidentTargets } from '../utils/incident-target.util';
import { OperatorGuidanceService } from './operator-guidance.service';

@Injectable({ providedIn: 'root' })
export class IncidentNavigationService {
  private readonly selection = inject(UiSelectionService);
  private readonly wm = inject(WindowManagerService);
  private readonly guidance = inject(OperatorGuidanceService);

  openFromIncident(item: IncidentDisplayItem): void {
    const targets = parseIncidentTargets(item.message);
    if (targets.zoneId != null) {
      this.selection.selectZone(targets.zoneId);
    }
    if (targets.fenceId != null) {
      const zoneId = targets.zoneId ?? (Math.floor(targets.fenceId / 2) as 0 | 1 | 2 | 3 | 4 | 5);
      this.selection.selectFence(targets.fenceId, zoneId);
    }
    if (targets.cameraId != null && targets.zoneId != null) {
      this.selection.selectCamera(targets.cameraId, targets.zoneId);
    }
    if (incidentRequiresDockTerminal(item.message)) {
      this.guidance.flagTerminalRequired(item.key, item.message);
      this.wm.open('terminal');
      return;
    }
    this.wm.open(dockAppForIncident(item.message));
  }
}
