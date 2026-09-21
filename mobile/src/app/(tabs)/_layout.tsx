import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Redirect } from 'expo-router';
import { authStorage } from '@/features/auth';
import { colors, palette } from '@/core/theme/colors';
import { useCheckStore } from '@/features/check';
import { useAdvisorStore } from '@/features/advisor/store/useAdvisorStore';
import { useSchemesStore } from '@/features/schemes/store/useSchemesStore';
import { vaultResetRef } from './vault';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const currentUser = authStorage.getCurrentUser();

  // Enforce auth: no public screens other than auth
  if (!currentUser) {
    return <Redirect href="/auth" />;
  }

  const activeColor = palette.emerald800;
  const inactiveColor = colors.light.textMuted;
  const bgColor = colors.light.surfaceElevated;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: colors.light.border,
        },
        headerShown: false,
      }}
    >
      {/* ── Advisor ─────────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Advisor',
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Close any open overlay then navigate (navigate reuses the existing mounted screen)
            useAdvisorStore.getState().closeHistory();
            useAdvisorStore.getState().stopVoiceInput?.();
            navigation.navigate('index');
          },
        })}
      />

      {/* ── Vault ───────────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <TabBarIcon name="folder-o" color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Reset vault to home screen via the module-level ref
            vaultResetRef.current?.();
            navigation.navigate('vault');
          },
        })}
      />

      {/* ── Check ───────────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="check"
        options={{
          title: 'Check',
          tabBarIcon: ({ color }) => <TabBarIcon name="check-circle-o" color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Reset eligibility flow to start
            useCheckStore.getState().setStep('0_start');
            navigation.navigate('check');
          },
        })}
      />

      {/* ── Schemes ─────────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="schemes"
        options={{
          title: 'Schemes',
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Reset all filters + search + switch back to Discovery home
            useSchemesStore.getState().resetToDiscovery();
            navigation.navigate('schemes');
          },
        })}
      />
    </Tabs>
  );
}
