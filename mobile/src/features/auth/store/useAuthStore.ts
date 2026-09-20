import { create } from 'zustand';
import { AuthMode, AuthStage, UserProfile } from '../models/auth.model';
import { authStorage } from '../storage/auth.storage';
import { authApi } from '../repositories/auth.api';

export interface AuthState {
  authMode: AuthMode;
  stage: AuthStage;
  email: string;
  password: string;
  fullName: string;
  state: string;
  currentUser: UserProfile | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  errorMessage: string | null;

  // Actions
  setAuthMode: (mode: AuthMode) => void;
  setStage: (stage: AuthStage) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setFullName: (name: string) => void;
  setStateLocation: (state: string) => void;
  setErrorMessage: (msg: string | null) => void;

  loginWithEmail: () => Promise<boolean>;
  registerWithEmail: () => Promise<boolean>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  loginWithGoogle: (email: string, name?: string, idToken?: string, avatarUrl?: string) => Promise<boolean>;
  completeProfileAndLogin: () => void;
  loginSuccessNow: () => void;
  logout: () => Promise<void>;
  resetAuthFlow: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const storedUser = authStorage.getCurrentUser();

  return {
    authMode: 'login',
    stage: 'login',
    email: '',
    password: '',
    fullName: '',
    state: 'Maharashtra',
    currentUser: storedUser || null,
    isLoading: false,
    isEmailVerified: storedUser?.isEmailVerified ?? false,
    errorMessage: null,

    setAuthMode: (authMode) => set({ authMode, stage: authMode === 'login' ? 'login' : 'signup', errorMessage: null }),

    setStage: (stage) => set({ stage, errorMessage: null }),

    setEmail: (email) => set({ email, errorMessage: null }),

    setPassword: (password) => set({ password, errorMessage: null }),

    setFullName: (fullName) => set({ fullName, errorMessage: null }),

    setStateLocation: (state) => set({ state }),

    setErrorMessage: (errorMessage) => set({ errorMessage }),

    loginWithEmail: async () => {
      const { email, password } = get();
      if (!email.trim() || !password) {
        set({ errorMessage: 'Please enter both email and password.' });
        return false;
      }
      set({ isLoading: true, errorMessage: null });
      try {
        const result = await authApi.login(email.trim(), password);
        if (result.ok) {
          set({
            currentUser: result.data,
            isEmailVerified: result.data.isEmailVerified,
            stage: 'success',
            isLoading: false,
          });
          return true;
        } else {
          set({ errorMessage: result.error.message, isLoading: false });
          return false;
        }
      } catch (err: any) {
        set({ errorMessage: err?.message || 'Login failed. Please try again.', isLoading: false });
        return false;
      }
    },

    registerWithEmail: async () => {
      const { email, password, fullName } = get();
      if (!email.trim() || !password) {
        set({ errorMessage: 'Please enter email and a secure password.' });
        return false;
      }
      if (password.length < 6) {
        set({ errorMessage: 'Password must be at least 6 characters.' });
        return false;
      }
      set({ isLoading: true, errorMessage: null });
      try {
        const result = await authApi.register(email.trim(), password, fullName.trim());
        if (result.ok) {
          set({
            currentUser: result.data,
            stage: 'check_email_link',
            isLoading: false,
          });
          return true;
        } else {
          set({ errorMessage: result.error.message, isLoading: false });
          return false;
        }
      } catch (err: any) {
        set({ errorMessage: err?.message || 'Registration failed.', isLoading: false });
        return false;
      }
    },

    checkEmailVerification: async () => {
      set({ isLoading: true });
      try {
        const result = await authApi.checkEmailVerification();
        if (result.ok && result.data) {
          set({ isEmailVerified: true, stage: 'success', isLoading: false });
          return true;
        }
        set({ isLoading: false });
        return false;
      } catch {
        set({ isLoading: false });
        return false;
      }
    },

    resendVerificationEmail: async () => {
      set({ isLoading: true });
      try {
        const result = await authApi.resendVerificationEmail();
        set({ isLoading: false });
        return result.ok;
      } catch {
        set({ isLoading: false });
        return false;
      }
    },

    loginWithGoogle: async (email: string, name?: string, idToken?: string, avatarUrl?: string) => {
      set({ isLoading: true, errorMessage: null });
      try {
        const result = await authApi.loginWithGoogle(email, name, idToken, avatarUrl);
        if (result.ok) {
          set({
            currentUser: result.data,
            isEmailVerified: true,
            stage: 'success',
            isLoading: false,
          });
          return true;
        } else {
          set({ errorMessage: result.error.message, isLoading: false });
          return false;
        }
      } catch (err: any) {
        set({ errorMessage: err?.message || 'Google Sign-In failed.', isLoading: false });
        return false;
      }
    },

    completeProfileAndLogin: () => {
      const user: UserProfile = {
        id: `usr_${Date.now()}`,
        fullName: get().fullName || 'Citizen',
        email: get().email || undefined,
        state: get().state || 'Maharashtra',
        isPhoneVerified: true,
        isEmailVerified: true,
      };
      authStorage.saveUser(user);
      set({ currentUser: user, stage: 'success' });
    },

    loginSuccessNow: () => {
      const user = get().currentUser;
      if (user) {
        authStorage.saveUser(user);
        set({ stage: 'success' });
      }
    },

    logout: async () => {
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch {}
      await authApi.logout();
      set({ currentUser: null, stage: 'login', email: '', password: '' });
    },

    resetAuthFlow: () => {
      set({
        stage: 'login',
        authMode: 'login',
        email: '',
        password: '',
        errorMessage: null,
      });
    },
  };
});
