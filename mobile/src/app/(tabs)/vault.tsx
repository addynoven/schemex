import React, { useState, useEffect, useCallback } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import {
  VaultHomeScreen,
  SchemeReadinessScreen,
} from '@/features/vault';
import { ProfileMenuModal, LogoutConfirmModal } from '@/features/profile';

export default function VaultTabScreen() {
  const [currentView, setCurrentView] = useState<'vault' | 'readiness'>('vault');

  // Hardware back: close readiness sub-view instead of exiting app
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentView === 'readiness') {
        setCurrentView('vault');
        return true; // consume event
      }
      return false; // let system handle (exit / go to home)
    });
    return () => sub.remove();
  }, [currentView]);

  // Expose a reset function keyed by a module-level ref so _layout.tsx listeners can call it
  const resetToVault = useCallback(() => setCurrentView('vault'), []);

  // Register on mount so the tab listener can reach it without prop-drilling
  useEffect(() => {
    vaultResetRef.current = resetToVault;
    return () => {
      vaultResetRef.current = null;
    };
  }, [resetToVault]);

  return (
    <View style={styles.container}>
      {currentView === 'readiness' ? (
        <SchemeReadinessScreen onBack={() => setCurrentView('vault')} />
      ) : (
        <VaultHomeScreen onGoToReadiness={() => setCurrentView('readiness')} />
      )}
      <ProfileMenuModal />
      <LogoutConfirmModal />
    </View>
  );
}

/** Module-level ref so _layout.tsx tab listener can call resetToVault without prop drilling */
export const vaultResetRef: { current: (() => void) | null } = { current: null };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
