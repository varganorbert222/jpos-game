import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SystemBootService } from '../../core/services/system-boot.service';
import type { BootSectionId } from '../../core/types/boot-section';
import type { DockApp } from '../../features/panels/dock/dock.component';
import { RetroSpinnerComponent } from './retro-spinner.component';

@Component({
  selector: 'app-jp-section-loader',
  standalone: true,
  imports: [RetroSpinnerComponent],
  template: `
    <div class="jp-section-loader">
      @if (!ready()) {
        <div class="jp-section-loader__overlay">
          <app-retro-spinner [size]="28" />
          <p class="jp-section-loader__msg">{{ message() }}</p>
        </div>
      }
      <div
        class="jp-section-loader__content"
        [class.jp-section-loader__content--hidden]="!ready()"
      >
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      align-self: stretch;
      width: 100%;
      min-width: 0;
      min-height: 0;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionLoaderComponent {
  private readonly boot = inject(SystemBootService);

  /** Fixed panel section (alerts, grid, etc.). */
  readonly sectionId = input<BootSectionId>();

  /** Per-window instance — reloads on every open. */
  readonly windowId = input<string>();
  readonly windowApp = input<DockApp>();

  readonly ready = computed(() => {
    const wid = this.windowId();
    if (wid) {
      return this.boot.isWindowReady(wid);
    }
    const sid = this.sectionId();
    return sid ? this.boot.isSectionReady(sid) : true;
  });

  readonly message = computed(() => {
    const app = this.windowApp();
    if (app) {
      return this.boot.windowMessage(app);
    }
    const sid = this.sectionId();
    return sid ? this.boot.sectionMessage(sid) : '';
  });
}
