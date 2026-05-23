import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CLI_HELP_LINES } from '../../../core/constants/cli-commands';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { terminalActionNeedsParam } from '../../../../simulation/actions';
import { getNextCommandSuggestions } from '../../../../simulation/terminal-suggestions';
import { HardRebootConfirmService } from '../../../core/services/hard-reboot-confirm.service';
import { buildHardRebootPrompt } from '../../../core/utils/hard-reboot-prompt';
import { SectionLoaderComponent } from '../../../shared/boot/section-loader.component';
import { TerminalCommandHistory } from '../../../shared/terminal/terminal-command-history';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { TerminalAutoscrollDirective } from '../../../shared/terminal/terminal-autoscroll.directive';
import { TerminalPromptDirective } from '../../../shared/terminal/terminal-prompt.directive';
import { applyTerminalInputValue } from '../../../shared/terminal/terminal-input-value';

const MAX_TERMINAL_LINES = 40;

@Component({
  selector: 'app-cli-panel',
  standalone: true,
  imports: [
    SectionLoaderComponent,
    RetroScrollDirective,
    TerminalAutoscrollDirective,
    TerminalPromptDirective,
  ],
  templateUrl: './cli-panel.component.html',
  styleUrl: './cli-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly hardReboot = inject(HardRebootConfirmService);
  private readonly history = new TerminalCommandHistory();
  readonly outputLines = signal<string[]>([
    'JP-OS COMMAND INTERFACE',
    'Type "help" for command list.',
  ]);

  readonly outputText = computed(() => this.outputLines().join('\n'));

  readonly nextSuggestions = computed(() => {
    const state = this.sim.snapshot();
    return state ? getNextCommandSuggestions(state, 3) : [];
  });

  onQuickAction(type: string, input: HTMLInputElement): void {
    if (type === 'system_hard_reboot') {
      input.value = '';
      const snap = this.sim.snapshot();
      if (snap) {
        this.hardReboot.request(buildHardRebootPrompt(snap));
      }
      return;
    }
    const needsParam = terminalActionNeedsParam(type);
    if (needsParam) {
      applyTerminalInputValue(input, `${type} `);
      input.focus();
      return;
    }
    this.execLine(type, input);
  }

  onInputKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    this.history.handleKeydown(event, input);
  }

  onSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    this.execLine(line, input);
  }

  private execLine(line: string, input: HTMLInputElement): void {
    this.history.push(line);
    input.value = '';
    if (line.toLowerCase() === 'cls') {
      this.outputLines.set([]);
      return;
    }
    if (line.toLowerCase() === 'system_hard_reboot') {
      const snap = this.sim.snapshot();
      if (snap) {
        this.hardReboot.request(buildHardRebootPrompt(snap));
      }
      return;
    }
    this.append(`> ${line}`);
    if (line.toLowerCase() === 'help') {
      this.append(...CLI_HELP_LINES);
      return;
    }
    const result = this.sim.runTerminal(line);
    this.append(result);
  }

  private append(...lines: string[]): void {
    this.outputLines.update((prev) => [...prev.slice(-MAX_TERMINAL_LINES), ...lines]);
  }
}
