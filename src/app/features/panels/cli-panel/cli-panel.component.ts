import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CLI_COMMANDS, CLI_HELP_LINES } from '../../../core/constants/cli-commands';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';

@Component({
  selector: 'app-cli-panel',
  standalone: true,
  templateUrl: './cli-panel.component.html',
  styleUrl: './cli-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CliPanelComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly commands = CLI_COMMANDS;
  readonly outputLines = signal<string[]>([
    'JP-OS COMMAND INTERFACE',
    'Type "help" for command list.',
  ]);

  readonly outputText = computed(() => this.outputLines().join('\n'));

  runAction(type: string, params?: Record<string, string | number>): void {
    this.sim.queueAction(type, params);
    this.append(`> QUEUED ${type}`);
  }

  onSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    input.value = '';
    this.append(`> ${line}`);
    if (line.toLowerCase() === 'help') {
      this.append(...CLI_HELP_LINES);
      return;
    }
    const result = this.sim.runTerminal(line);
    this.append(result);
  }

  private append(...lines: string[]): void {
    this.outputLines.update((prev) => [...prev.slice(-40), ...lines]);
  }
}
