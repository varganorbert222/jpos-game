import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UiTelemetryService } from '../../../core/services/ui-telemetry.service';
import { OsIconComponent } from '../../../shared/os-icon/os-icon.component';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { HardRebootConfirmService } from '../../../core/services/hard-reboot-confirm.service';
import { buildHardRebootPrompt } from '../../../core/utils/hard-reboot-prompt';
import { SystemBootService } from '../../../core/services/system-boot.service';
import { TerminalCommandHistory } from '../../../shared/terminal/terminal-command-history';
import { TerminalAutoscrollDirective } from '../../../shared/terminal/terminal-autoscroll.directive';
import { TerminalPromptDirective } from '../../../shared/terminal/terminal-prompt.directive';

@Component({
  selector: 'app-logs-actions-panel',
  standalone: true,
  imports: [
    OsIconComponent,
    RetroScrollDirective,
    TerminalAutoscrollDirective,
    TerminalPromptDirective,
  ],
  templateUrl: './logs-actions-panel.component.html',
  styleUrl: './logs-actions-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsActionsPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly boot = inject(SystemBootService);
  private readonly hardReboot = inject(HardRebootConfirmService);
  private readonly history = new TerminalCommandHistory();
  readonly telemetry = inject(UiTelemetryService);

  readonly logs = computed(() => {
    const s = this.sim.snapshot();
    return s?.logEntries.slice(-14).reverse() ?? [];
  });
  readonly terminalOut = signal('> JP-OS ready. Type help.');
  readonly corruptOutput = computed(() => this.telemetry.corruption() > 55);

  runAction(type: string, params?: Record<string, string | number>): void {
    if (type === 'system_hard_reboot') {
      this.requestHardReboot();
      return;
    }
    this.sim.queueAction(type, params);
    this.terminalOut.set(`> Queued: ${type}`);
  }

  requestHardReboot(): void {
    const snap = this.sim.snapshot();
    if (!snap) {
      return;
    }
    const prompt = buildHardRebootPrompt(snap);
    this.hardReboot.request(prompt);
  }

  confirmHardReboot(): void {
    this.sim.queueAction('system_hard_reboot');
    this.hardReboot.confirm();
    this.terminalOut.set('> Hard reboot initiated.');
  }

  onTerminalKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    this.history.handleKeydown(event, input);
  }

  onTerminalSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    this.history.push(line);
    input.value = '';
    if (line.toLowerCase() === 'cls') {
      this.terminalOut.set('');
      return;
    }
    if (line.toLowerCase() === 'system_hard_reboot') {
      this.requestHardReboot();
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
