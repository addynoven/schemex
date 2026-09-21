import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { SplashScreenView } from '../components/SplashScreenView';
import { LanguageSelectionView } from '../components/LanguageSelectionView';
import { type LanguageCode } from '../models/onboarding.model';
import { authStorage } from '@/features/auth/storage/auth.storage';
import { useProfileStore } from '@/features/profile/store/useProfileStore';

export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const {
    step,
    selectedLanguage,
    isSaving,
    setStep,
    selectLanguage,
    confirmAndComplete,
    initFromStorage,
  } = useOnboardingStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const handleSplashComplete = () => {
    setStep('language');
  };

  const handleSelectLanguage = (lang: LanguageCode) => {
    selectLanguage(lang);
  };

  const handleConfirmLanguage = (lang: LanguageCode) => {
    confirmAndComplete(lang, () => {
      useProfileStore.getState().updateSettings({ language: lang });
      const currentUser = authStorage.getCurrentUser();
      if (currentUser) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/auth');
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FCF9" />

      {/* Screen Body */}
      <View style={styles.screenBody}>
        {step === 'splash' ? (
          <SplashScreenView
            onComplete={handleSplashComplete}
            autoAdvance={true}
          />
        ) : (
          <LanguageSelectionView
            selectedLanguage={selectedLanguage}
            onSelectLanguage={handleSelectLanguage}
            onConfirm={handleConfirmLanguage}
            isSaving={isSaving}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FCF9',
  },
  screenBody: {
    flex: 1,
  },
});
