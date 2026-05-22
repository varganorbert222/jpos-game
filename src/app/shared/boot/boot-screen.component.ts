import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SystemBootService } from '../../core/services/system-boot.service';
import { RetroSpinnerComponent } from './retro-spinner.component';

@Component({
  selector: 'app-boot-screen',
  standalone: true,
  imports: [RetroSpinnerComponent],
  template: `
    <div
      class="jp-boot-screen"
      role="dialog"
      aria-busy="true"
      [attr.aria-label]="boot.bootScreenTitle()"
    >
      <div class="jp-boot-screen__panel jp-terminal-inset">
        <div class="jp-boot-screen__head">
          <app-retro-spinner [size]="18" />
          <h1 class="jp-boot-screen__title">{{ boot.bootScreenTitle() }}</h1>
        </div>
        <pre class="jp-boot-screen__log">{{ logText() }}<span class="jp-boot-screen__cursor"></span></pre>
      </div>
    </div>
  `,
  styles: [
    `
      .jp-boot-screen__head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .jp-boot-screen__title {
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootScreenComponent {
  readonly boot = inject(SystemBootService);
  readonly logText = computed(() => this.boot.bootLines().join('\n'));
}
