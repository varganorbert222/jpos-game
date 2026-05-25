import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { UiSelectionService } from '../../core/services/ui-selection.service';

/** Tactical shortcuts on the park grid only — not duplicated in OS windows. */
@Component({
  selector: 'app-game-action-controls',
  standalone: true,
  host: { class: 'game-action-controls' },
  template: `
    <div class="game-action-controls__bar" data-context="grid-tactical">
      <span class="game-action-controls__label">TACTICAL</span>
      <button type="button" class="jp-btn" (click)="act('dispatch_patrol', 'zone')">
        PATROL Z
      </button>
      <button type="button" class="jp-btn" (click)="act('seal_breach', 'id')">
        QUICK SEAL
      </button>
      <button type="button" class="jp-btn" (click)="act('reset_fence', 'id')">
        RESET SEG
      </button>
      <button type="button" class="jp-btn" (click)="act('increase_voltage', 'id')">
        BOOST VOLT
      </button>
    </div>
  `,
  styles: `
    .game-action-controls__bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.5rem;
      padding-top: 0.35rem;
      border-top: 1px solid var(--jp-border-dim, #2a4a2a);
    }
    .game-action-controls__label {
      font-size: 0.65rem;
      letter-spacing: 0.08em;
      color: var(--jp-irix-text-dim);
      margin-right: 0.25rem;
    }
    .game-action-controls__bar .jp-btn {
      font-size: 0.7rem;
      padding: 0.2rem 0.45rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameActionControlsComponent {
  /** Kept for template compatibility — only grid uses this component. */
  readonly context = input<'grid'>('grid');

  private readonly sim = inject(SimulationBridgeService);
  private readonly selection = inject(UiSelectionService);

  act(type: string, paramKind: 'id' | 'zone'): void {
    const params = this.buildParams(paramKind);
    if (!params) {
      return;
    }
    this.sim.queueAction(type, params);
  }

  private buildParams(paramKind: 'id' | 'zone'): Record<string, number> | null {
    const sel = this.selection.selection();
    if (!sel) {
      return null;
    }
    if (paramKind === 'zone') {
      return { zone: sel.zoneId };
    }
    if (sel.fenceId != null) {
      return { id: sel.fenceId };
    }
    const fence = this.sim.snapshot()?.fences.find((f) => f.zoneId === sel.zoneId);
    return fence ? { id: fence.id } : null;
  }
}
