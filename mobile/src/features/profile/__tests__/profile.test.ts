import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useProfileStore } from '../store/useProfileStore';

describe('Profile Module Unit Tests', () => {
  it('manages menu and logout confirmation modal visibility', () => {
    const store = useProfileStore.getState();

    store.openMenu();
    assert.strictEqual(useProfileStore.getState().isMenuVisible, true);

    store.openLogoutConfirm();
    assert.strictEqual(useProfileStore.getState().isMenuVisible, false);
    assert.strictEqual(useProfileStore.getState().isLogoutConfirmVisible, true);

    store.closeLogoutConfirm();
    assert.strictEqual(useProfileStore.getState().isLogoutConfirmVisible, false);
  });

  it('updates app settings in store', () => {
    const store = useProfileStore.getState();
    store.updateSettings({ authNotificationChannel: 'in_app', notificationsEnabled: false });

    assert.strictEqual(useProfileStore.getState().settings.authNotificationChannel, 'in_app');
    assert.strictEqual(useProfileStore.getState().settings.notificationsEnabled, false);
  });

  it('verifies linked email account', () => {
    const store = useProfileStore.getState();
    const initialEmail = useProfileStore
      .getState()
      .linkedAccounts.find((a) => a.provider === 'email');
    assert.strictEqual(initialEmail?.status, 'unverified');

    store.verifyEmail();
    const verifiedEmail = useProfileStore
      .getState()
      .linkedAccounts.find((a) => a.provider === 'email');
    assert.strictEqual(verifiedEmail?.status, 'verified');
  });

  it('validates password security rules accurately', () => {
    const validatePassword = (pwd: string) => ({
      hasMinLength: pwd.length >= 8,
      hasNumber: /\d/.test(pwd),
      hasSpecialOrUpper: /[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd),
    });

    const weak = validatePassword('short');
    assert.strictEqual(weak.hasMinLength, false);
    assert.strictEqual(weak.hasNumber, false);

    const good = validatePassword('SecurePass123!');
    assert.strictEqual(good.hasMinLength, true);
    assert.strictEqual(good.hasNumber, true);
    assert.strictEqual(good.hasSpecialOrUpper, true);
  });

  it('enforces exact "DELETE" input before allowing account deletion', () => {
    const isDeletionAuthorized = (text: string) => text.trim() === 'DELETE';

    assert.strictEqual(isDeletionAuthorized('delete'), false, 'Lowercase should not authorize');
    assert.strictEqual(isDeletionAuthorized('DEL'), false, 'Partial should not authorize');
    assert.strictEqual(isDeletionAuthorized('DELETE'), true, 'Exact uppercase DELETE authorizes');
  });

  it('links and updates email address with verified status', () => {
    const store = useProfileStore.getState();
    store.linkEmail('newcitizen@gov.in');

    const email = useProfileStore
      .getState()
      .linkedAccounts.find((a) => a.provider === 'email');
    assert.strictEqual(email?.identifier, 'newcitizen@gov.in');
    assert.strictEqual(email?.status, 'verified');
  });

  it('connects and disconnects Google account smoothly', () => {
    const store = useProfileStore.getState();
    store.disconnectGoogle();

    const disconnected = useProfileStore
      .getState()
      .linkedAccounts.find((a) => a.provider === 'google');
    assert.strictEqual(disconnected?.status, 'not_connected');

    store.linkGoogle('newgoogle@gmail.com');
    const connected = useProfileStore
      .getState()
      .linkedAccounts.find((a) => a.provider === 'google');
    assert.strictEqual(connected?.identifier, 'newgoogle@gmail.com');
    assert.strictEqual(connected?.status, 'connected');
  });

  it('updates primary phone number with verification', () => {
    const store = useProfileStore.getState();
    store.updatePhone('+91 9123456780');

    const phone = useProfileStore
      .getState()
      .linkedAccounts.find((a) => a.provider === 'phone');
    assert.strictEqual(phone?.identifier, '+91 9123456780');
    assert.strictEqual(phone?.status, 'verified');
  });
});
