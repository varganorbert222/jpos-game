import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-jp-confirm-modal',
  standalone: true,
  template: `
    <div class="jp-confirm-modal-backdrop" role="presentation">
      <div
        class="jp-confirm-modal"
        role="alertdialog"
        [attr.aria-labelledby]="titleId"
      >
        <h2 class="jp-confirm-modal__title" [id]="titleId">{{ title() }}</h2>
        <p class="jp-confirm-modal__body">{{ message() }}</p>
        <div class="jp-confirm-modal__actions">
          <button type="button" class="jp-btn" (click)="cancelled.emit()">
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            class="jp-btn jp-critical"
            (click)="confirmed.emit()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JpConfirmModalComponent {
  readonly titleId = `jp-confirm-${Math.random().toString(36).slice(2, 9)}`;
  readonly title = input('CONFIRM');
  readonly message = input('');
  readonly confirmLabel = input('YES');
  readonly cancelLabel = input('NO');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
