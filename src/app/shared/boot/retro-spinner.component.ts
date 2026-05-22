import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-retro-spinner',
  standalone: true,
  template: `<div class="jp-retro-spinner" [style.width.px]="size()" [style.height.px]="size()"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroSpinnerComponent {
  readonly size = input(20);
}
