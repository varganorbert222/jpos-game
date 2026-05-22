export type AuthRole = 'admin' | 'operator';

export interface AuthSession {
  username: string;
  role: AuthRole;
  displayLabel: string;
}

export interface AuthAccount {
  password: string;
  role: AuthRole;
  displayLabel: string;
}
