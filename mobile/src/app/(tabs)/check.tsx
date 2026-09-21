import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import {
  AssetsScreen,
  DemographicsScreen,
  EconomicScreen,
  NearlyEligibleScreen,
  ProcessingScreen,
  ResultsScreen,
  ReviewScreen,
  SchemeDetailsScreen,
  StartScreen,
  useCheckStore,
} from '@/features/check';
import { useProfileStore, ProfileMenuModal, LogoutConfirmModal } from '@/features/profile';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

export default function CheckEligibilityScreen() {
  const insets = useSafeAreaInsets();
  const { activeStep, setStep } = useCheckStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const handleGoBack = () => {
    switch (activeStep) {
      case '1_demographics':
        setStep('0_start');
        break;
      case '2_economic':
        setStep('1_demographics');
        break;
      case '3_assets':
        setStep('2_economic');
        break;
      case '4_review':
        setStep('3_assets');
        break;
      case '5_processing':
        setStep('4_review');
        break;
      case '6_results_summary':
      case '7_eligible_list':
        setStep('4_review');
        break;
      case '8_scheme_details':
        setStep('6_results_summary');
        break;
      case '9_nearly_eligible':
        setStep('6_results_summary');
        break;
      default:
        break;
    }
  };

  // Wire Android hardware back to the step-back flow.
  // At '0_start' we return false so the system handles it (goes to home / background).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeStep !== '0_start') {
        handleGoBack();
        return true; // consumed
      }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const getScreenTitle = () => {
    switch (activeStep) {
      case '0_start':
        return 'Check Eligibility';
      case '1_demographics':
        return 'Demographics';
      case '2_economic':
        return 'Economic Details';
      case '3_assets':
        return 'Assets & Others';
      case '4_review':
        return 'Review Information';
      case '5_processing':
        return 'Analyzing Profile';
      case '6_results_summary':
      case '7_eligible_list':
        return 'Your Results';
      case '8_scheme_details':
        return 'Scheme Details';
      case '9_nearly_eligible':
        return 'Nearly Eligible';
      default:
        return 'Check Eligibility';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      {activeStep === '0_start' ? (
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.leafCircle}>
              <FontAwesome name="leaf" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>Check</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => useProfileStore.getState().openMenu()}
            accessibilityRole="button"
            accessibilityLabel="Open Citizen Profile"
          >
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <FontAwesome name="user" size={15} color="#065F46" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <FontAwesome name="chevron-left" size={16} color="#0F172A" />
          </TouchableOpacity>

          <Text style={styles.screenTitle}>{getScreenTitle()}</Text>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => setStep('0_start')}
            activeOpacity={0.7}
          >
            <FontAwesome name="rotate-left" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}


      {/* Active Screen Step Content */}
      <View style={styles.contentArea}>
        {activeStep === '0_start' && <StartScreen />}
        {activeStep === '1_demographics' && <DemographicsScreen />}
        {activeStep === '2_economic' && <EconomicScreen />}
        {activeStep === '3_assets' && <AssetsScreen />}
        {activeStep === '4_review' && <ReviewScreen />}
        {activeStep === '5_processing' && <ProcessingScreen />}
        {activeStep === '6_results_summary' && <ResultsScreen />}
        {activeStep === '7_eligible_list' && <ResultsScreen />}
        {activeStep === '8_scheme_details' && <SchemeDetailsScreen />}
        {activeStep === '9_nearly_eligible' && <NearlyEligibleScreen />}
      </View>

      <ProfileMenuModal />
      <LogoutConfirmModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leafCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  backButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  contentArea: {
    flex: 1,
  },
});
