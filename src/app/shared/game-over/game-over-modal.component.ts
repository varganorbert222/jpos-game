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
import type { SimulationSnapshot } from '../../../simulation';

@Component({
  selector: 'app-game-over-modal',
  standalone: true,
  template: `
    <div class="jp-game-over-backdrop" role="presentation">
      <div
        class="jp-game-over"
        role="alertdialog"
        aria-labelledby="jp-game-over-title"
        aria-describedby="jp-game-over-reason"
      >
        <div class="jp-game-over__head">
          <h2 id="jp-game-over-title" class="jp-game-over__title">
            SYSTEM COLLAPSE
          </h2>
          <button
            type="button"
            class="jp-game-over__close"
            aria-label="Close"
            (click)="close.emit()"
          >
            X
          </button>
        </div>
        <p id="jp-game-over-reason" class="jp-game-over__reason jp-critical">
          {{ reason() }}
        </p>

        <dl class="jp-game-over__stats">
          <div class="jp-game-over__stat">
            <dt>OPERATOR TIME ON STATION</dt>
            <dd>{{ playTime() }}</dd>
          </div>
          <div class="jp-game-over__stat">
            <dt>PERFORMANCE INDEX</dt>
            <dd>{{ score() }}</dd>
          </div>
          <div class="jp-game-over__stat">
            <dt>TICK / PHASE</dt>
            <dd>{{ tickPhase() }}</dd>
          </div>
        </dl>

        <div class="jp-game-over__actions">
          <button type="button" class="jp-btn" (click)="close.emit()">
            CLOSE
          </button>
          <button
            type="button"
            class="jp-btn jp-critical"
            (click)="restart.emit()"
          >
            RESTART
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './game-over-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameOverModalComponent {
  readonly snapshot = input.required<SimulationSnapshot>();

  readonly close = output<void>();
  readonly restart = output<void>();

  readonly reason = computed(
    () => this.snapshot().gameOverReason ?? 'Containment failure.',
  );

  readonly playTime = computed(() =>
    formatPlayDuration(this.snapshot().elapsedRealtimeMs),
  );

  readonly score = computed(() => computeRunScore(this.snapshot()));

  readonly tickPhase = computed(() => {
    const s = this.snapshot();
    return `T${s.tick} · PHASE ${s.escalationPhase}`;
  });
}
