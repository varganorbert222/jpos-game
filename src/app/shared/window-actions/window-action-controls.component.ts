import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { UiSelectionService } from '../../core/services/ui-selection.service';
import { PlayerActionService } from '../../core/services/player-action.service';

export type WindowActionContext = 'fence' | 'security' | 'power' | 'dino';

interface WindowActionBtn {
  type: string;
  label: string;
  paramKind: 'id' | 'zone' | null;
  needsTarget: boolean;
  warn?: boolean;
}

const WINDOW_ACTIONS: Record<WindowActionContext, readonly WindowActionBtn[]> = {
  fence: [
    { type: 'increase_voltage', label: 'INCREASE VOLTAGE', paramKind: 'id', needsTarget: true },
    { type: 'decrease_voltage', label: 'DECREASE VOLTAGE', paramKind: 'id', needsTarget: true },
    { type: 'reset_fence', label: 'RESET FENCE', paramKind: 'id', needsTarget: true },
    { type: 'seal_breach', label: 'SEAL BREACH', paramKind: 'id', needsTarget: true },
    { type: 'dispatch_patrol', label: 'DISPATCH PATROL', paramKind: 'zone', needsTarget: true },
  ],
  security: [
    { type: 'cam_reboot', label: 'REBOOT CAMERA', paramKind: 'id', needsTarget: true },
  ],
  power: [
    { type: 'generator_restart', label: 'RESTART GENERATOR', paramKind: 'id', needsTarget: true },
    { type: 'refuel_generator', label: 'REFUEL GENERATOR', paramKind: 'id', needsTarget: true },
    { type: 'power_reroute', label: 'REROUTE POWER', paramKind: 'zone', needsTarget: true },
    {
      type: 'emergency_venting',
      label: 'EMERGENCY VENT',
      paramKind: null,
      needsTarget: false,
      warn: true,
    },
  ],
  dino: [
    { type: 'dino_sedate', label: 'SEDATE SPECIMEN', paramKind: 'id', needsTarget: true },
    { type: 'dispatch_patrol', label: 'DISPATCH PATROL', paramKind: 'zone', needsTarget: true },
    {
      type: 'lethal_authorization',
      label: 'LETHAL AUTHORIZATION',
      paramKind: null,
      needsTarget: false,
      warn: true,
    },
  ],
};

@Component({
  selector: 'app-window-action-controls',
  standalone: true,
  host: { class: 'window-action-controls' },
  template: `
    <div class="window-actions" [attr.data-window]="context()">
      <p class="window-actions__target" [class.jp-warn]="!targetLabel()">
        {{ targetLabel() ?? 'Select a table row to arm window actions.' }}
      </p>
      <div class="window-actions__bar">
        @for (btn of buttons(); track btn.type) {
          <button
            type="button"
            class="jp-btn"
            [class.jp-warn]="btn.warn"
            [disabled]="btn.needsTarget && !hasTarget() || isBlocked(btn)"
            (click)="run(btn)"
          >
            {{ btn.label }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .window-actions {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 2px solid var(--jp-irix-bevel-dark);
    }
    .window-actions__target {
      margin: 0 0 0.5rem;
      font-size: var(--jp-font-sm);
      color: var(--jp-term-info);
      font-weight: 700;
    }
    .window-actions__bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .window-actions__bar .jp-btn {
      font-size: var(--jp-font-sm);
      padding: 0.25rem 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowActionControlsComponent {
  readonly context = input.required<WindowActionContext>();

  private readonly selection = inject(UiSelectionService);
  private readonly actions = inject(PlayerActionService);

  readonly buttons = computed(() => WINDOW_ACTIONS[this.context()]);

  readonly hasTarget = computed(() => this.targetLabel() !== null);

  readonly targetLabel = computed(() => {
    const sel = this.selection.selection();
    if (!sel) {
      return null;
    }
    switch (this.context()) {
      case 'fence':
        if (sel.fenceId != null) {
          return `F${sel.fenceId} · Z${sel.zoneId}`;
        }
        break;
      case 'security':
        if (sel.cameraId != null) {
          return `CAM${sel.cameraId} · Z${sel.zoneId}`;
        }
        break;
      case 'power':
        if (sel.generatorId != null) {
          return `GEN${sel.generatorId}`;
        }
        return `ZONE Z${sel.zoneId}`;
      case 'dino':
        if (sel.dinoId != null) {
          return `D${sel.dinoId} · Z${sel.zoneId}`;
        }
        break;
    }
    if (sel.focus === 'zone') {
      return `ZONE Z${sel.zoneId}`;
    }
    return null;
  });

  isBlocked(btn: WindowActionBtn): boolean {
    if (btn.paramKind === null) {
      return this.actions.isDuplicate(btn.type);
    }
    const params = this.resolveParams(btn.paramKind);
    if (!params) {
      return false;
    }
    return this.actions.isDuplicate(btn.type, params);
  }

  run(btn: WindowActionBtn): void {
    if (btn.paramKind === null) {
      this.actions.tryQueue(btn.type);
      return;
    }
    const params = this.resolveParams(btn.paramKind);
    if (!params) {
      return;
    }
    this.actions.tryQueue(btn.type, params);
  }

  private resolveParams(
    paramKind: 'id' | 'zone',
  ): Record<string, number> | null {
    const sel = this.selection.selection();
    if (!sel) {
      return null;
    }
    if (paramKind === 'zone') {
      return { zone: sel.zoneId };
    }
    const ctx = this.context();
    if (ctx === 'fence' && sel.fenceId != null) {
      return { id: sel.fenceId };
    }
    if (ctx === 'security' && sel.cameraId != null) {
      return { id: sel.cameraId };
    }
    if (ctx === 'power' && sel.generatorId != null) {
      return { id: sel.generatorId };
    }
    if (ctx === 'dino' && sel.dinoId != null) {
      return { id: sel.dinoId };
    }
    return null;
  }
}
