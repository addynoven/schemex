import { create } from 'zustand';
import { AppSettings, LinkedAccount } from '../models/profile.model';

export interface ProfileStoreState {
  linkedAccounts: LinkedAccount[];
  settings: AppSettings;
  isMenuVisible: boolean;
  isLogoutConfirmVisible: boolean;

  // Actions
  openMenu: () => void;
  closeMenu: () => void;
  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  verifyEmail: () => void;
  linkEmail: (email: string) => void;
  disconnectEmail: () => void;
  linkGoogle: (email: string) => void;
  disconnectGoogle: () => void;
  updatePhone: (phone: string) => void;
}

import { authStorage } from '@/features/auth/storage/auth.storage';
import { onboardingStorage } from '@/features/onboarding/storage/onboarding.storage';

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  linkedAccounts: (() => {
    const user = authStorage.getCurrentUser();
    return [
      {
        provider: 'phone',
        identifier: user?.phone || 'Not connected',
        status: user?.phone ? 'verified' : 'not_connected',
        isPrimary: true,
      },
      {
        provider: 'email',
        identifier: user?.email || 'Not connected',
        status: user?.email ? (user.isEmailVerified ? 'verified' : 'unverified') : 'unverified',
      },
      {
        provider: 'google',
        identifier: user?.email || 'Not connected',
        status: user?.email ? 'connected' : 'not_connected',
      },
    ];
  })(),
  settings: {
    language: onboardingStorage.getOnboardingState().selectedLanguage,
    notificationsEnabled: true,
    authNotificationChannel: 'email',
  },
  isMenuVisible: false,
  isLogoutConfirmVisible: false,

  openMenu: () => set({ isMenuVisible: true }),
  closeMenu: () => set({ isMenuVisible: false }),

  openLogoutConfirm: () => set({ isLogoutConfirmVisible: true, isMenuVisible: false }),
  closeLogoutConfirm: () => set({ isLogoutConfirmVisible: false }),

  updateSettings: (newSettings) => {
    if (newSettings.language) {
      onboardingStorage.saveOnboardingLanguage(newSettings.language);
    }
    set({ settings: { ...get().settings, ...newSettings } });
  },

  verifyEmail: () => {
    const updated = get().linkedAccounts.map((acc) =>
      acc.provider === 'email' ? { ...acc, status: 'verified' as const } : acc
    );
    set({ linkedAccounts: updated });
  },

  linkEmail: (email: string) => {
    const exists = get().linkedAccounts.some((acc) => acc.provider === 'email');
    if (exists) {
      set({
        linkedAccounts: get().linkedAccounts.map((acc) =>
          acc.provider === 'email'
            ? { ...acc, identifier: email, status: 'verified' as const }
            : acc
        ),
      });
    } else {
      set({
        linkedAccounts: [
          ...get().linkedAccounts,
          { provider: 'email', identifier: email, status: 'verified' as const },
        ],
      });
    }
  },

  disconnectEmail: () => {
    set({
      linkedAccounts: get().linkedAccounts.map((acc) =>
        acc.provider === 'email'
          ? { ...acc, status: 'not_connected' as const, identifier: 'Not connected' }
          : acc
      ),
    });
  },

  linkGoogle: (email: string) => {
    const exists = get().linkedAccounts.some((acc) => acc.provider === 'google');
    if (exists) {
      set({
        linkedAccounts: get().linkedAccounts.map((acc) =>
          acc.provider === 'google'
            ? { ...acc, identifier: email, status: 'connected' as const }
            : acc
        ),
      });
    } else {
      set({
        linkedAccounts: [
          ...get().linkedAccounts,
          { provider: 'google', identifier: email, status: 'connected' as const },
        ],
      });
    }
  },

  disconnectGoogle: () => {
    const exists = get().linkedAccounts.some((acc) => acc.provider === 'google');
    if (exists) {
      set({
        linkedAccounts: get().linkedAccounts.map((acc) =>
          acc.provider === 'google'
            ? { ...acc, status: 'not_connected' as const, identifier: 'Not connected' }
            : acc
        ),
      });
    } else {
      set({
        linkedAccounts: [
          ...get().linkedAccounts,
          { provider: 'google', identifier: 'Not connected', status: 'not_connected' as const },
        ],
      });
    }
  },

  updatePhone: (phone: string) => {
    const exists = get().linkedAccounts.some((acc) => acc.provider === 'phone');
    if (exists) {
      set({
        linkedAccounts: get().linkedAccounts.map((acc) =>
          acc.provider === 'phone'
            ? { ...acc, identifier: phone, status: 'verified' as const }
            : acc
        ),
      });
    } else {
      set({
        linkedAccounts: [
          ...get().linkedAccounts,
          { provider: 'phone', identifier: phone, status: 'verified' as const, isPrimary: true },
        ],
      });
    }
  },
}));
