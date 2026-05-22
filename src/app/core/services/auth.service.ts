import { Injectable, computed, signal } from '@angular/core';
import type { AuthAccount, AuthSession } from '../types/auth';

/** Demo accounts — admin/admin; operators use matching username/password. */
const ACCOUNTS: Record<string, AuthAccount> = {
  admin: { password: 'admin', role: 'admin', displayLabel: 'ADMIN' },
  ops1: { password: 'ops1', role: 'operator', displayLabel: 'OPS-1' },
  hammond: { password: 'hammond', role: 'operator', displayLabel: 'HAMMOND' },
  muldoon: { password: 'muldoon', role: 'operator', displayLabel: 'MULDOON' },
  arnold: { password: 'arnold', role: 'operator', displayLabel: 'ARNOLD' },
  nedry: { password: 'nedry', role: 'operator', displayLabel: 'NEDRY' },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<AuthSession | null>(null);
  readonly lastError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this.session() !== null);

  login(username: string, password: string): boolean {
    const key = username.trim().toLowerCase();
    const account = ACCOUNTS[key];
    if (!account || account.password !== password) {
      this.lastError.set('INVALID CREDENTIALS — ACCESS DENIED');
      return false;
    }
    this.lastError.set(null);
    this.session.set({
      username: key,
      role: account.role,
      displayLabel: account.displayLabel,
    });
    return true;
  }

  logout(): void {
    this.session.set(null);
    this.lastError.set(null);
  }

  clearError(): void {
    this.lastError.set(null);
  }

  setError(message: string): void {
    this.lastError.set(message);
  }
}
