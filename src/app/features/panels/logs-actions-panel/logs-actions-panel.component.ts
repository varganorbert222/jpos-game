import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { UiSelectionService } from '../../../core/services/ui-selection.service';
import { PlayerActionService } from '../../../core/services/player-action.service';
import { getNextCommandSuggestions } from '../../../../simulation/terminal-suggestions';
import {
  OPERATOR_QUICK_ACTIONS,
  type OperatorActionDef,
} from '../../../core/constants/operator-actions.config';
import { SectionLoaderComponent } from '../../../shared/boot/section-loader.component';
import { CompactTerminalComponent } from '../../../shared/terminal/compact-terminal.component';

@Component({
  selector: 'app-logs-actions-panel',
  standalone: true,
  imports: [OsIconComponent, SectionLoaderComponent, CompactTerminalComponent],
  templateUrl: './logs-actions-panel.component.html',
  styleUrl: './logs-actions-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsActionsPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly selection = inject(UiSelectionService);
  private readonly actions = inject(PlayerActionService);

  readonly operatorActions = OPERATOR_QUICK_ACTIONS;

  readonly nextSuggestions = computed(() => {
    const state = this.sim.snapshot();
    return state ? getNextCommandSuggestions(state, 2) : [];
  });

  isActionBlocked(action: OperatorActionDef): boolean {
    const params = this.resolveParams(action);
    if (params === 'needs_manual' || params === undefined) {
      if (action.paramKind === null) {
        return this.actions.isDuplicate(action.type);
      }
      return false;
    }
    return this.actions.isDuplicate(action.type, params);
  }

  runAction(action: OperatorActionDef): void {
    const params = this.resolveParams(action);
    if (params === 'needs_manual') {
      return;
    }
    this.actions.tryQueue(action.type, params);
  }

  private resolveParams(
    action: OperatorActionDef,
  ): Record<string, number> | undefined | 'needs_manual' {
    if (action.paramKind === null) {
      return undefined;
    }
    const sel = this.selection.selection();
    if (!sel) {
      return 'needs_manual';
    }
    if (action.paramKind === 'zone') {
      return { zone: sel.zoneId };
    }
    if (action.paramKind === 'id') {
      if (sel.fenceId != null) {
        return { id: sel.fenceId };
      }
      if (sel.cameraId != null) {
        return { id: sel.cameraId };
      }
      if (sel.generatorId != null) {
        return { id: sel.generatorId };
      }
      const fenceInZone = this.sim.snapshot()?.fences.find((f) => f.zoneId === sel.zoneId);
      if (fenceInZone) {
        return { id: fenceInZone.id };
      }
      return 'needs_manual';
    }
    return 'needs_manual';
  }

}
