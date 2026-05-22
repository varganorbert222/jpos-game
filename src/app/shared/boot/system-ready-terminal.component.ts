import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { SystemBootService } from '../../core/services/system-boot.service';
import { TerminalPromptDirective } from '../terminal/terminal-prompt.directive';

@Component({
  selector: 'app-system-ready-terminal',
  standalone: true,
  imports: [TerminalPromptDirective],
  templateUrl: './system-ready-terminal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemReadyTerminalComponent implements AfterViewInit {
  readonly boot = inject(SystemBootService);
  private readonly cmdRef = viewChild<ElementRef<HTMLInputElement>>('cmd');

  readonly command = signal('');
  readonly lastOut = signal('');

  ngAfterViewInit(): void {
    this.focusCmd();
  }

  focusCmd(): void {
    if (this.boot.systemReadyBusy()) {
      return;
    }
    this.cmdRef()?.nativeElement.focus();
  }

  onCommandInput(event: Event): void {
    this.command.set((event.target as HTMLInputElement).value);
  }

  onEnter(event: Event): void {
    event.preventDefault();
    void this.submitCommand();
  }

  private async submitCommand(): Promise<void> {
    if (this.boot.systemReadyBusy()) {
      return;
    }
    const line = this.command().trim();
    if (!line) {
      return;
    }
    this.command.set('');
    const msg = await this.boot.runSystemReadyCommand(line);
    this.lastOut.set(msg);
    this.focusCmd();
  }
}
