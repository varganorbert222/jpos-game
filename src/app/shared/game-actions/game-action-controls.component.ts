import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import { HardRebootConfirmService } from '../../core/services/hard-reboot-confirm.service';
import { buildHardRebootPrompt } from '../../core/utils/hard-reboot-prompt';

export type GameActionContext = 'power' | 'security' | 'grid' | 'dino' | 'fence';

@Component({
  selector: 'app-game-action-controls',
  standalone: true,
  host: { class: 'game-action-controls' },
  template: `
    <div class="game-action-controls__bar" [attr.data-context]="context()">
      @switch (context()) {
        @case ('power') {
          <button type="button" class="jp-btn" (click)="act('increase_voltage', { id: 0 })">
            +VOLT F0
          </button>
          <button type="button" class="jp-btn" (click)="act('decrease_voltage', { id: 0 })">
            -VOLT F0
          </button>
          <button type="button" class="jp-btn" (click)="act('power_reroute', { zone: 0 })">
            REROUTE Z0
          </button>
          <button type="button" class="jp-btn" (click)="act('generator_restart', { id: 0 })">
            GEN0 RESTART
          </button>
          <button type="button" class="jp-btn jp-warn" (click)="act('emergency_venting')">
            EMERG VENT
          </button>
        }
        @case ('security') {
          <button type="button" class="jp-btn" (click)="act('cam_reboot', { id: 0 })">
            CAM0 REBOOT
          </button>
          <button type="button" class="jp-btn" (click)="act('reset_fence', { id: 0 })">
            RESET F0
          </button>
          <button type="button" class="jp-btn" (click)="act('increase_voltage', { id: 0 })">
            +VOLT F0
          </button>
          <button type="button" class="jp-btn" (click)="act('cam_reboot', { id: 2 })">
            CAM2 REBOOT
          </button>
        }
        @case ('grid') {
          <button type="button" class="jp-btn" (click)="act('dispatch_patrol', { zone: 0 })">
            PATROL Z0
          </button>
          <button type="button" class="jp-btn" (click)="act('dispatch_patrol', { zone: 2 })">
            PATROL Z2
          </button>
          <button type="button" class="jp-btn" (click)="act('reset_fence', { id: 0 })">
            RESET F0
          </button>
          <button type="button" class="jp-btn" (click)="act('seal_breach', { id: 0 })">
            SEAL F0
          </button>
          <button type="button" class="jp-btn" (click)="act('increase_voltage', { id: 0 })">
            +VOLT F0
          </button>
        }
        @case ('dino') {
          <button type="button" class="jp-btn" (click)="act('dino_sedate', { id: 0 })">
            SEDATE D0
          </button>
          <button type="button" class="jp-btn" (click)="act('dispatch_patrol', { zone: 0 })">
            PATROL Z0
          </button>
          <button type="button" class="jp-btn jp-warn" (click)="act('lethal_authorization')">
            LETHAL AUTH
          </button>
        }
        @case ('fence') {
          <button type="button" class="jp-btn" (click)="act('increase_voltage', { id: 0 })">
            +VOLT F0
          </button>
          <button type="button" class="jp-btn" (click)="act('decrease_voltage', { id: 0 })">
            -VOLT F0
          </button>
          <button type="button" class="jp-btn" (click)="act('reset_fence', { id: 0 })">
            RESET F0
          </button>
          <button type="button" class="jp-btn" (click)="act('seal_breach', { id: 0 })">
            SEAL F0
          </button>
          <button type="button" class="jp-btn" (click)="act('dispatch_patrol', { zone: 0 })">
            PATROL Z0
          </button>
        }
      }
      <button type="button" class="jp-btn jp-critical" (click)="requestHardReboot()">
        HARD REBOOT
      </button>
    </div>
  `,
  styles: `
    .game-action-controls__bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.5rem;
      padding-top: 0.35rem;
      border-top: 1px solid var(--jp-border-dim, #2a4a2a);
    }
    .game-action-controls__bar .jp-btn {
      font-size: 0.7rem;
      padding: 0.2rem 0.45rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameActionControlsComponent {
  readonly context = input.required<GameActionContext>();

  private readonly sim = inject(SimulationBridgeService);
  private readonly hardReboot = inject(HardRebootConfirmService);

  act(type: string, params?: Record<string, string | number>): void {
    this.sim.queueAction(type, params);
  }

  requestHardReboot(): void {
    const snap = this.sim.snapshot();
    if (!snap) {
      return;
    }
    this.hardReboot.request(buildHardRebootPrompt(snap));
  }
}
