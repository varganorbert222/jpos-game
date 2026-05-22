import { applyTerminalInputValue } from './terminal-input-value';

/** CMD/PowerShell-style command history for a single terminal input. */
export class TerminalCommandHistory {
  private readonly lines: string[] = [];
  private index = -1;
  private draft = '';

  push(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    const last = this.lines[this.lines.length - 1];
    if (last !== trimmed) {
      this.lines.push(trimmed);
    }
    this.resetBrowse();
  }

  /** ArrowUp / ArrowDown — returns true if the key was handled. */
  handleKeydown(event: KeyboardEvent, input: HTMLInputElement): boolean {
    if (event.key === 'ArrowUp') {
      if (this.lines.length === 0) {
        return false;
      }
      event.preventDefault();
      if (this.index === -1) {
        this.draft = input.value;
        this.index = this.lines.length - 1;
      } else if (this.index > 0) {
        this.index--;
      }
      applyTerminalInputValue(input, this.lines[this.index] ?? '');
      return true;
    }

    if (event.key === 'ArrowDown') {
      if (this.index === -1) {
        return false;
      }
      event.preventDefault();
      if (this.index < this.lines.length - 1) {
        this.index++;
        applyTerminalInputValue(input, this.lines[this.index] ?? '');
      } else {
        this.resetBrowse();
        applyTerminalInputValue(input, this.draft);
      }
      return true;
    }

    return false;
  }

  private resetBrowse(): void {
    this.index = -1;
    this.draft = '';
  }
}
