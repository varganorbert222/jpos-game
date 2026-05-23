import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ScoreboardService } from '../../core/services/scoreboard.service';
import { SystemBootService } from '../../core/services/system-boot.service';

import { TerminalPromptDirective } from '../../shared/terminal/terminal-prompt.directive';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [TerminalPromptDirective],
  templateUrl: './login-screen.component.html',
  styleUrl: './login-screen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginScreenComponent {
  private readonly auth = inject(AuthService);
  private readonly boot = inject(SystemBootService);
  private readonly scoreboard = inject(ScoreboardService);

  readonly username = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);

  readonly error = this.auth.lastError;

  readonly scoreboardPreview = computed(() => {
    const user = this.username().trim().toLowerCase();
    const top = this.scoreboard.globalTop().slice(0, 3);
    const personal = user ? this.scoreboard.bestForOperator(user) : null;
    return { top, personal, user };
  });

  onUsernameInput(event: Event): void {
    this.auth.clearError();
    this.username.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event): void {
    this.auth.clearError();
    this.password.set((event.target as HTMLInputElement).value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) {
      return;
    }
    const user = this.username().trim();
    const pass = this.password();
    if (!user || !pass) {
      this.auth.setError('USERNAME AND PASSWORD REQUIRED');
      return;
    }
    void this.runLogin(user, pass);
  }

  /** Simulated directory lookup — keeps AUTHENTICATING... visible briefly. */
  private async runLogin(user: string, pass: string): Promise<void> {
    this.submitting.set(true);
    try {
      await this.simulatedAuthDelay();
      const ok = this.auth.login(user, pass);
      if (!ok) {
        return;
      }
      await this.boot.finishLogin();
    } finally {
      this.submitting.set(false);
    }
  }

  private simulatedAuthDelay(): Promise<void> {
    const ms = 520 + Math.floor(Math.random() * 680);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  onShutdown(): void {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    void this.boot.shutdownSystem().finally(() => this.submitting.set(false));
  }
}
