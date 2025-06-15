/**
 * ABOUTME: AuthManager placeholder for GitHub authentication.
 * ABOUTME: Provides interface and stub methods.
 */

export interface IAuthManager {
  login(): Promise<void>;
  logout(): void;
  getToken(): string | null;
}

export class NotImplementedError extends Error {}

export class AuthManager implements IAuthManager {
  login(): Promise<void> {
    throw new NotImplementedError('login not implemented');
  }

  logout(): void {
    throw new NotImplementedError('logout not implemented');
  }

  getToken(): string | null {
    return null;
  }
}
