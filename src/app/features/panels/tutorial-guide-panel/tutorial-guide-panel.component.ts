import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OperatorGuidanceService } from '../../../core/services/operator-guidance.service';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { WindowManagerService } from '../../window-manager/window-manager.service';
import type { DockApp } from '../dock/dock.component';

@Component({
  selector: 'app-tutorial-guide-panel',
  standalone: true,
  template: `
    @if (guidance.tutorialActive()) {
      <aside class="tutorial-guide" data-region="tutorial-guide">
        <h3 class="jp-panel__title tutorial-guide__title">TRAINING — OPERATOR PATH</h3>
        @if (objective()) {
          <p class="tutorial-guide__objective jp-warn">{{ objective() }}</p>
        }
        <ol class="tutorial-guide__steps">
          @for (phase of guidance.tutorialPhases(); track phase.label + phase.hint) {
            <li>
              <span class="tutorial-guide__phase">{{ phase.label }}</span>
              {{ phase.hint }}
              @if (phase.dockApp) {
                <button
                  type="button"
                  class="jp-btn tutorial-guide__open"
                  (click)="openApp(phase.dockApp!)"
                >
                  OPEN {{ phase.dockApp }}
                </button>
              }
            </li>
          }
        </ol>
        @if (guidance.tutorialRequiresDockTerminal() && !guidance.dockTerminalAcknowledged()) {
          <p class="tutorial-guide__term jp-critical">
            Required: open dock TERMINAL and run the command.
          </p>
        }
      </aside>
    }
  `,
  styles: `
    .tutorial-guide {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      z-index: 20;
      max-width: 720px;
      width: calc(100% - 24px);
      padding: 10px 14px;
      background: var(--jp-irix-title);
      border: 2px solid var(--jp-term-warn);
      box-shadow: 4px 4px 0 var(--jp-irix-bevel-dark);
      pointer-events: auto;
    }
    .tutorial-guide__title {
      margin: 0 0 6px;
    }
    .tutorial-guide__objective {
      margin: 0 0 8px;
      font-size: var(--jp-font-sm);
    }
    .tutorial-guide__steps {
      margin: 0;
      padding-left: 1.2rem;
      font-size: var(--jp-font-sm);
      line-height: 1.45;
    }
    .tutorial-guide__steps li {
      margin-bottom: 4px;
    }
    .tutorial-guide__phase {
      font-weight: 700;
      margin-right: 0.35rem;
    }
    .tutorial-guide__open {
      margin-left: 0.5rem;
      padding: 2px 8px;
      font-size: 0.65rem;
      vertical-align: middle;
    }
    .tutorial-guide__term {
      margin: 8px 0 0;
      font-size: var(--jp-font-sm);
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialGuidePanelComponent {
  readonly guidance = inject(OperatorGuidanceService);
  private readonly sim = inject(SimulationBridgeService);
  private readonly wm = inject(WindowManagerService);

  readonly objective = () => this.sim.snapshot()?.tutorialObjective ?? '';

  openApp(app: DockApp): void {
    this.wm.open(app);
  }
}
