import { Injectable, computed, inject, signal } from '@angular/core';
import { CLI_HELP_LINES } from '../constants/cli-commands';
import { SimulationBridgeService } from './simulation-bridge.service';
import { HardRebootConfirmService } from './hard-reboot-confirm.service';
import { buildHardRebootPrompt } from '../utils/hard-reboot-prompt';
import { TerminalCommandHistory } from '../../shared/terminal/terminal-command-history';

const MAX_TERMINAL_LINES = 40;

@Injectable({ providedIn: 'root' })
export class TerminalSessionService {
  private readonly sim = inject(SimulationBridgeService);
  private readonly hardReboot = inject(HardRebootConfirmService);
  private readonly history = new TerminalCommandHistory();

  readonly outputLines = signal<string[]>([
    'JP-OS COMMAND INTERFACE',
    'Type "help" for command list.',
  ]);

  readonly outputText = computed(() => this.outputLines().join('\n'));

  handleKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    this.history.handleKeydown(event, input);
  }

  submitLine(line: string, input?: HTMLInputElement): void {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    this.history.push(trimmed);
    if (input) {
      input.value = '';
    }
    this.exec(trimmed);
  }

  exec(trimmed: string): void {
    if (trimmed.toLowerCase() === 'cls') {
      this.outputLines.set([]);
      return;
    }
    if (trimmed.toLowerCase() === 'system_hard_reboot') {
      const snap = this.sim.snapshot();
      if (snap) {
        this.hardReboot.request(buildHardRebootPrompt(snap));
      }
      return;
    }
    this.append(`> ${trimmed}`);
    if (trimmed.toLowerCase() === 'help') {
      this.append(...CLI_HELP_LINES);
      return;
    }
    const result = this.sim.runTerminal(trimmed);
    this.append(result);
  }

  appendQueued(type: string): void {
    this.logLine(`> Queued: ${type}`);
  }

  logLine(line: string): void {
    this.append(line);
  }

  private append(...lines: string[]): void {
    this.outputLines.update((prev) => [...prev.slice(-MAX_TERMINAL_LINES), ...lines]);
  }
}
