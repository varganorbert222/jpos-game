import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CLI_HELP_LINES } from '../../../core/constants/cli-commands';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { terminalActionNeedsParam } from '../../../../simulation/actions';
import { getNextCommandSuggestions } from '../../../../simulation/terminal-suggestions';

const MAX_TERMINAL_LINES = 40;

@Component({
  selector: 'app-cli-panel',
  standalone: true,
  templateUrl: './cli-panel.component.html',
  styleUrl: './cli-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
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
    const needsParam = terminalActionNeedsParam(type);
    input.value = needsParam ? `${type} ` : type;
    if (needsParam) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
      return;
    }
    this.execLine(type, input);
  }

  onSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    this.execLine(line, input);
  }

  private execLine(line: string, input: HTMLInputElement): void {
    input.value = '';
    if (line.toLowerCase() === 'cls') {
      this.outputLines.set([]);
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
