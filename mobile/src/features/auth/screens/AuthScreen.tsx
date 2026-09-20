import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { AuthHeroArtwork } from '../components/AuthHeroArtwork';
import { AuthModeToggle } from '../components/AuthModeToggle';
import { EmailLoginView } from '../components/EmailLoginView';
import { SignUpView } from '../components/SignUpView';
import { CheckEmailLinkView } from '../components/CheckEmailLinkView';
import { LoginSuccessView } from '../components/LoginSuccessView';
import { NetworkFailureModal } from '../components/NetworkFailureModal';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { spacing } from '@/core/theme/spacing';

const GOOGLE_WEB_CLIENT_ID = '520495266533-8fc48reub74h892f4age5u0ugbuqd4do.apps.googleusercontent.com';

export const AuthScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    authMode,
    setAuthMode,
    stage,
    setStage,
    email,
    password,
    fullName,
    setEmail,
    setPassword,
    setFullName,
    loginWithEmail,
    registerWithEmail,
    checkEmailVerification,
    resendVerificationEmail,
    loginWithGoogle,
    isLoading,
    errorMessage,
    setErrorMessage,
  } = useAuthStore();

  const [showNetworkModal, setShowNetworkModal] = React.useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
        offlineAccess: false,
      });
    } catch (e) {
      console.warn('GoogleSignin configure error:', e);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try {
        await GoogleSignin.signOut();
      } catch {}

      const response = await GoogleSignin.signIn();
      if (response.type === 'success') {
        const user = response.data.user;
        const idToken = response.data.idToken || undefined;
        const photoUrl = user.photo || undefined;
        const ok = await loginWithGoogle(
          user.email,
          user.name || user.givenName || undefined,
          idToken,
          photoUrl
        );
        if (ok) {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      console.warn('Google Sign-In error:', error?.code || error);
      setErrorMessage('Google Sign-In was cancelled or unavailable.');
    }
  };

  const handleLogin = async () => {
    const ok = await loginWithEmail();
    if (ok) {
      router.replace('/(tabs)');
    }
  };

  const handleSignUp = async () => {
    await registerWithEmail();
  };

  const handleCheckVerification = async () => {
    const verified = await checkEmailVerification();
    if (verified) {
      router.replace('/(tabs)');
      return true;
    }
    return false;
  };

  const handleGoToAdvisor = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {stage === 'success' ? (
          <LoginSuccessView onGoToAdvisor={handleGoToAdvisor} />
        ) : stage === 'check_email_link' ? (
          <View style={styles.card}>
            <CheckEmailLinkView
              email={email}
              onCheckVerification={handleCheckVerification}
              onResendLink={resendVerificationEmail}
              onBackToLogin={() => {
                setAuthMode('login');
                setStage('login');
              }}
            />
          </View>
        ) : (
          <View style={styles.card}>
            {/* Top Artwork shown on login and signup entry */}
            <AuthHeroArtwork />

            {/* Mode Toggle: Log In / Sign Up */}
            <AuthModeToggle
              mode={authMode}
              onSelectMode={(mode) => {
                setAuthMode(mode);
                setErrorMessage(null);
              }}
            />

            {/* Email Login View */}
            {authMode === 'login' && (
              <EmailLoginView
                email={email}
                password={password}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onChangeEmail={setEmail}
                onChangePassword={setPassword}
                onLogin={handleLogin}
                onSelectGoogle={handleGoogleSignIn}
                onSwitchToSignUp={() => {
                  setAuthMode('signup');
                  setStage('signup');
                  setErrorMessage(null);
                }}
                onForgotPassword={() => setShowForgotModal(true)}
              />
            )}

            {/* Email Sign Up View */}
            {authMode === 'signup' && (
              <SignUpView
                fullName={fullName}
                email={email}
                password={password}
                isLoading={isLoading}
                errorMessage={errorMessage}
                onChangeName={setFullName}
                onChangeEmail={setEmail}
                onChangePassword={setPassword}
                onSignUp={handleSignUp}
                onSelectGoogle={handleGoogleSignIn}
                onLoginInstead={() => {
                  setAuthMode('login');
                  setStage('login');
                  setErrorMessage(null);
                }}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Network Failure Modal */}
      <NetworkFailureModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onTryAgain={() => setShowNetworkModal(false)}
        onUseOfflineMode={() => {
          setShowNetworkModal(false);
          router.push('/(tabs)/schemes');
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={() => {
          setShowForgotModal(false);
          setAuthMode('login');
          setStage('login');
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
});
