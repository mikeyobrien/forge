import { AuthManager } from '../src/auth/AuthManager';
import { describe, it, expect } from 'vitest';

describe('AuthManager', () => {
  it('returns null token by default', () => {
    const mgr = new AuthManager();
    expect(mgr.getToken()).toBeNull();
  });
});
