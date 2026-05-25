import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RetroScrollDirective } from '../retro-scroll/retro-scroll.directive';
import { TerminalAutoscrollDirective } from './terminal-autoscroll.directive';
import { TerminalPromptDirective } from './terminal-prompt.directive';
import { TerminalSessionService } from '../../core/services/terminal-session.service';

@Component({
  selector: 'app-compact-terminal',
  standalone: true,
  imports: [RetroScrollDirective, TerminalAutoscrollDirective, TerminalPromptDirective],
  template: `
    <div class="jp-terminal jp-terminal--compact" data-block="compact-terminal">
      <div class="console-preamble jp-terminal-inset">
        Jurassic Park, System Security Interface<br />
        Version 4.0.5, Alpha E<br />
        Ready...
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
          #cmdInput
          class="jp-terminal-prompt__input cmd"
          placeholder="help"
          autocomplete="off"
          spellcheck="false"
          (keydown)="terminal.handleKeydown($event, cmdInput)"
          (keydown.enter)="onSubmit(cmdInput)"
        />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
    }
    .jp-terminal--compact {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--jp-irix-window);
      gap: 6px;
      min-height: 0;
    }
    .console-preamble {
      flex: 0 0 auto;
      margin: 0;
      padding: 6px 8px;
      font-size: var(--jp-font-sm);
      line-height: var(--jp-line);
    }
    .screen {
      margin: 0;
      padding: 6px 8px;
      white-space: pre-wrap;
      flex: 1;
      min-height: 4rem;
      font-size: var(--jp-font-sm);
    }
    .prompt-line {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px 8px;
      flex: 0 0 auto;
    }
    .prompt {
      color: var(--jp-term-cursor);
      font-weight: 700;
    }
    .cmd {
      color: var(--jp-term-inset-fg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompactTerminalComponent {
  readonly terminal = inject(TerminalSessionService);

  onSubmit(input: HTMLInputElement): void {
    const line = input.value.trim();
    if (!line) {
      return;
    }
    this.terminal.submitLine(line, input);
  }
}
