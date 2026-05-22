import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';

@Component({
  selector: 'app-logs-actions-panel',
  standalone: true,
  imports: [OsIconComponent, RetroScrollDirective],
  templateUrl: './logs-actions-panel.component.html',
  styleUrl: './logs-actions-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsActionsPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly telemetry = inject(UiTelemetryService);

  readonly logs = computed(() => {
    const s = this.sim.snapshot();
    return s?.logEntries.slice(-14).reverse() ?? [];
  });
  readonly terminalOut = signal('> JP-OS ready. Type help.');
  readonly corruptOutput = computed(() => this.telemetry.corruption() > 55);

  runAction(type: string, params?: Record<string, string | number>): void {
    this.sim.queueAction(type, params);
    this.terminalOut.set(`> Queued: ${type}`);
  }

  onTerminalSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    input.value = '';
    if (line.toLowerCase() === 'cls') {
      this.terminalOut.set('');
      return;
    }
    const out = this.sim.runTerminal(line);
    this.setTerminalOut(`> ${line}\n${out}`);
  }

  private setTerminalOut(text: string): void {
    const lines = text.split('\n').slice(-12);
    this.terminalOut.set(lines.join('\n'));
  }
}
