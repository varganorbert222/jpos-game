import { Injectable, signal } from '@angular/core';

export interface HardRebootPrompt {
  breachActive: boolean;
  huntingActive: boolean;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class HardRebootConfirmService {
  readonly pending = signal<HardRebootPrompt | null>(null);

  request(prompt: HardRebootPrompt): void {
    this.pending.set(prompt);
  }

  confirm(): void {
    this.pending.set(null);
  }

  cancel(): void {
    this.pending.set(null);
  }
}
