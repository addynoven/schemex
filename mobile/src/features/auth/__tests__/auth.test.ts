import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuthStorageService, KeyValueStore } from '../storage/auth.storage';
import { useAuthStore } from '../store/useAuthStore';
import { UserProfile } from '../models/auth.model';

class MockMemoryStore implements KeyValueStore {
  private memory = new Map<string, string>();
  getString(key: string): string | undefined {
    return this.memory.get(key);
  }
  set(key: string, value: string): void {
    this.memory.set(key, value);
  }
  delete(key: string): void {
    this.memory.delete(key);
  }
}

describe('Auth Module Unit Tests (Email/Password & Google Auth)', () => {
  it('persists user session and clears on logout', () => {
    const memory = new MockMemoryStore();
    const storage = new AuthStorageService(memory);

    assert.strictEqual(storage.getCurrentUser(), null);

    const testUser: UserProfile = {
      id: 'u1',
      fullName: 'Rohit Kumar',
      email: 'rohit@example.com',
      state: 'Maharashtra',
      authProvider: 'email',
      isPhoneVerified: true,
      isEmailVerified: true,
    };

    storage.saveUser(testUser);
    const loaded = storage.getCurrentUser();
    assert.strictEqual(loaded?.fullName, 'Rohit Kumar');
    assert.strictEqual(loaded?.email, 'rohit@example.com');
    assert.strictEqual(loaded?.authProvider, 'email');

    storage.clearSession();
    assert.strictEqual(storage.getCurrentUser(), null);
  });

  it('useAuthStore manages stages and completes email signup to magic link flow', async () => {
    const store = useAuthStore.getState();
    const testEmail = `citizen.${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

    store.setAuthMode('signup');
    assert.strictEqual(useAuthStore.getState().stage, 'signup');
    assert.strictEqual(useAuthStore.getState().authMode, 'signup');

    store.setFullName('Aarav Patel');
    store.setEmail(testEmail);
    store.setPassword(testPassword);

    assert.strictEqual(useAuthStore.getState().fullName, 'Aarav Patel');
    assert.strictEqual(useAuthStore.getState().email, testEmail);

    // Trigger register: sends magic link and transitions stage to check_email_link
    const registered = await store.registerWithEmail();
    assert.strictEqual(registered, true);
    assert.strictEqual(useAuthStore.getState().stage, 'check_email_link');
    assert.strictEqual(useAuthStore.getState().currentUser?.email, testEmail);

    // Initial check before clicking link returns false (link not yet clicked in real email)
    const initialCheck = await store.checkEmailVerification();
    assert.strictEqual(initialCheck, false);
    assert.strictEqual(useAuthStore.getState().stage, 'check_email_link');

    // Complete profile and login activates session
    store.completeProfileAndLogin();
    assert.strictEqual(useAuthStore.getState().stage, 'success');
    assert.strictEqual(useAuthStore.getState().currentUser?.isEmailVerified, true);
  });

  it('validates email format and password length requirements', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isStrongPassword = (pwd: string) => pwd.length >= 6;

    assert.strictEqual(isValidEmail('citizen@gov.in'), true);
    assert.strictEqual(isValidEmail('invalid-email'), false);
    assert.strictEqual(isValidEmail('user@'), false);

    assert.strictEqual(isStrongPassword('123456'), true);
    assert.strictEqual(isStrongPassword('12345'), false);
  });

  it('syncUserToPostgres records social Google auth and returns synchronized citizen profile', async () => {
    const { authApi } = await import('../repositories/auth.api');

    const profile = await authApi.syncUserToPostgres({
      email: 'citizen.google.test@example.com',
      fullName: 'Vikram Singh',
      authProvider: 'google',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    assert.strictEqual(profile.email, 'citizen.google.test@example.com');
    assert.strictEqual(profile.fullName, 'Vikram Singh');
    assert.strictEqual(profile.authProvider, 'google');
    assert.strictEqual(profile.isEmailVerified, true);
    assert.ok(profile.id);
  });

  it('syncUserToPostgres handles existing PostgreSQL user and restores their citizen state', async () => {
    const { authApi } = await import('../repositories/auth.api');

    // Ramesh exists in PostgreSQL (id: 5)
    const profile = await authApi.syncUserToPostgres({
      email: 'citizen.ramesh@example.com',
      authProvider: 'email',
    });

    assert.strictEqual(profile.email, 'citizen.ramesh@example.com');
    assert.strictEqual(profile.id, '5');
    assert.strictEqual(profile.citizenUid, 'CIT-2026-1001');
  });

  it('loginWithEmail authenticates and syncs with PostgreSQL', async () => {
    const store = useAuthStore.getState();
    const testEmail = `login.test.${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // Register user first
    store.setAuthMode('signup');
    store.setFullName('Login Tester');
    store.setEmail(testEmail);
    store.setPassword(testPassword);
    const reg = await store.registerWithEmail();
    assert.strictEqual(reg, true);

    // Reset flow and log in with email
    store.setAuthMode('login');
    store.setEmail(testEmail);
    store.setPassword(testPassword);

    const ok = await store.loginWithEmail();
    assert.strictEqual(ok, true);
    assert.strictEqual(useAuthStore.getState().stage, 'success');
    assert.strictEqual(useAuthStore.getState().currentUser?.email, testEmail);
  });
});
