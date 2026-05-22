import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CLI_HELP_LINES } from '../../../core/constants/cli-commands';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';
import { SystemBootService } from '../../../core/services/system-boot.service';
import { TerminalCommandHistory } from '../../../shared/terminal/terminal-command-history';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { TerminalAutoscrollDirective } from '../../../shared/terminal/terminal-autoscroll.directive';
import { TerminalPromptDirective } from '../../../shared/terminal/terminal-prompt.directive';

const MAX_TERMINAL_LINES = 40;

@Component({
  selector: 'app-terminal-window',
  standalone: true,
  imports: [RetroScrollDirective, TerminalAutoscrollDirective, TerminalPromptDirective],
  template: `
    <div class="jp-terminal" data-app="terminal">
      <div class="console-preamble jp-terminal-inset">
        Jurassic Park, System Security Interface<br />
        Version 4.0.5, Alpha E<br />
        Ready...<br />
      </div>
      <pre
        class="screen jp-terminal-inset jp-terminal-viewport"
        data-block="output"
        jpRetroScroll
        jpTerminalAutoscroll
      >{{ screen() }}</pre>
      <div class="prompt-line" data-block="input" jpTerminalPrompt>
        <span class="jp-terminal-prompt__prefix prompt">&gt;</span>
        <input
          #cmd
          class="jp-terminal-prompt__input cmd"
          autocomplete="off"
          spellcheck="false"
          (keydown)="onInputKeydown($event, cmd)"
          (keydown.enter)="onSubmit(cmd)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .jp-terminal {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--jp-irix-window);
        gap: 8px;
      }
      .console-preamble {
        padding: 8px;
        margin: 0;
      }
      .screen {
        margin: 0;
        padding: 8px;
        white-space: pre-wrap;
        min-height: 0;
        flex: 1;
      }
      .prompt-line {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px 8px;
      }
      .prompt {
        color: var(--jp-term-cursor);
        font-weight: 700;
      }
      .cmd {
        color: var(--jp-term-inset-fg);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  private readonly boot = inject(SystemBootService);
  private readonly history = new TerminalCommandHistory();
  readonly screen = signal('');

  onInputKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    this.history.handleKeydown(event, input);
  }

  onSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    this.history.push(line);
    input.value = '';
    this.exec(line);
  }

  private exec(line: string): void {
    if (line.toLowerCase() === 'cls') {
      this.screen.set('');
      return;
    }
    if (line.toLowerCase() === 'system_hard_reboot') {
      this.boot.promptHardReboot();
      return;
    }
    if (line.toLowerCase() === 'help') {
      this.appendScreen(`${line}\n${CLI_HELP_LINES.join('\n')}`);
      return;
    }
    const result = this.sim.runTerminal(line);
    this.appendScreen(`${line}\n${result}`);
  }

  private appendScreen(chunk: string): void {
    const merged = (this.screen() ? `${this.screen()}\n` : '') + chunk;
    const lines = merged.split('\n');
    this.screen.set(lines.slice(-MAX_TERMINAL_LINES).join('\n'));
  }
}
