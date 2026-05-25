import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RetroScrollDirective } from '../../../shared/retro-scroll/retro-scroll.directive';
import { TerminalAutoscrollDirective } from '../../../shared/terminal/terminal-autoscroll.directive';
import { TerminalPromptDirective } from '../../../shared/terminal/terminal-prompt.directive';
import { TerminalSessionService } from '../../../core/services/terminal-session.service';

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
      >{{ terminal.outputText() }}</pre>
      <div class="prompt-line" data-block="input" jpTerminalPrompt>
        <span class="jp-terminal-prompt__prefix prompt">&gt;</span>
        <input
          #cmd
          class="jp-terminal-prompt__input cmd"
          autocomplete="off"
          spellcheck="false"
          (keydown)="terminal.handleKeydown($event, cmd)"
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
  readonly terminal = inject(TerminalSessionService);

  onSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    this.terminal.submitLine(line, input);
  }
}
