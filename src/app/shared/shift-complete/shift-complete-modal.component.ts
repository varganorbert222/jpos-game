import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  computeRunScore,
  formatPlayDuration,
} from '../../core/utils/run-score';
import { SimulationBridgeService } from '../../core/services/simulation-bridge.service';
import type { SimulationSnapshot } from '../../../simulation';

@Component({
  selector: 'app-shift-complete-modal',
  standalone: true,
  template: `
    <div class="jp-game-over-backdrop" role="presentation">
      <div class="jp-game-over jp-shift-complete" role="dialog" aria-labelledby="shift-title">
        <div class="jp-game-over__head">
          <h2 id="shift-title" class="jp-game-over__title">SHIFT OBJECTIVE COMPLETE</h2>
          <button
            type="button"
            class="jp-game-over__close"
            aria-label="Close"
            (click)="dismiss.emit()"
          >
            X
          </button>
        </div>
        <p class="jp-game-over__reason jp-nominal">
          15-minute operator window logged. Performance index recorded.
        </p>
        <dl class="jp-game-over__stats">
          <div class="jp-game-over__stat">
            <dt>OPERATOR</dt>
            <dd>{{ operatorLabel() }}</dd>
          </div>
          <div class="jp-game-over__stat">
            <dt>OPERATOR TIME</dt>
            <dd>{{ playTime() }}</dd>
          </div>
          <div class="jp-game-over__stat">
            <dt>PERFORMANCE INDEX</dt>
            <dd>{{ score() }}</dd>
          </div>
          <div class="jp-game-over__stat">
            <dt>OPERATOR SLOT</dt>
            <dd>#{{ snapshot().operatorSlot + 1 }}</dd>
          </div>
        </dl>
        @if (scoreboardRank()) {
          <p class="jp-game-over__reason jp-info">{{ scoreboardRank() }}</p>
        }
        <div class="jp-game-over__actions">
          <button type="button" class="jp-btn" (click)="dismiss.emit()">CLOSE</button>
          <button type="button" class="jp-btn jp-nominal" (click)="handoff()">
            NEXT OPERATOR
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../game-over/game-over-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftCompleteModalComponent {
  readonly snapshot = input.required<SimulationSnapshot>();
  readonly dismiss = output<void>();
  readonly handoffDone = output<void>();
  /** Set by parent after persisting scoreboard entry. */
  readonly rankHint = input<string | null>(null);

  private readonly sim = inject(SimulationBridgeService);

  readonly operatorLabel = computed(
    () => this.snapshot().operatorDisplayLabel || 'OPERATOR',
  );

  readonly playTime = computed(() =>
    formatPlayDuration(this.snapshot().elapsedRealtimeMs),
  );

  readonly score = computed(() => computeRunScore(this.snapshot()));

  readonly scoreboardRank = computed(() => this.rankHint());

  handoff(): void {
    this.sim.operatorHandoff();
    this.handoffDone.emit();
    this.dismiss.emit();
  }
}
