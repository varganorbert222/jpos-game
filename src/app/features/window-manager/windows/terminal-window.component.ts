import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CLI_HELP_LINES } from '../../../core/constants/cli-commands';
import { SimulationBridgeService } from '../../../core/services/simulation-bridge.service';

const MAX_TERMINAL_LINES = 40;

@Component({
  selector: 'app-terminal-window',
  standalone: true,
  template: `
    <div class="jp-terminal" data-app="terminal">
      <div class="console-preamble jp-terminal-inset">
        Jurassic Park, System Security Interface<br />
        Version 4.0.5, Alpha E<br />
        Ready...<br />
      </div>
      <pre class="screen jp-terminal-inset jp-terminal-viewport" data-block="output">{{ screen() }}</pre>
      <div class="prompt-line" data-block="input">
        <span class="prompt">&gt;</span>
        <input
          #cmd
          class="jp-input cmd"
          (keydown.enter)="exec(cmd.value); cmd.value = ''"
        />
        <span class="jp-terminal-cursor" aria-hidden="true"></span>
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
        min-height: 200px;
      }
      .prompt-line {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .prompt {
        color: var(--jp-term-cursor);
        font-weight: 700;
      }
      .cmd {
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalWindowComponent {
  private readonly sim = inject(SimulationBridgeService);
  readonly screen = signal('');

  exec(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.toLowerCase() === 'cls') {
      this.screen.set('');
      return;
    }
    if (trimmed.toLowerCase() === 'help') {
      this.appendScreen(`${trimmed}\n${CLI_HELP_LINES.join('\n')}`);
      return;
    }
    const result = this.sim.runTerminal(trimmed);
    this.appendScreen(`${trimmed}\n${result}`);
  }

  private appendScreen(chunk: string): void {
    const merged = (this.screen() ? `${this.screen()}\n` : '') + chunk;
    const lines = merged.split('\n');
    this.screen.set(lines.slice(-MAX_TERMINAL_LINES).join('\n'));
  }
}
