import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { View, Image, StatusBar } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { ErrorBoundary } from '@/core/errors';
import { QueryProvider } from '@/core/query';
import { Toast } from '@/core/components';
import { colors } from '@/core/theme';
import { authSessionExpired } from '@/core/events/authEvents';
import { authStorage } from '@/features/auth';
import { secureStorage } from '@/core/storage/secureStorage';

import { initializeLocalDatabase } from '@/core/database/local-db';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [layoutReady, setLayoutReady] = React.useState(false);

  useEffect(() => {
    initializeLocalDatabase().catch((e) => console.warn('Local DB init notice:', e));
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Only hide the native splash once fonts are loaded AND the layout has painted
  useEffect(() => {
    if (loaded && layoutReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, layoutReady]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FCF9', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FCF9" />
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FCF9" />
          <RootLayoutNav onLayout={() => setLayoutReady(true)} />
          <Toast />
        </SafeAreaProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav({ onLayout }: { onLayout?: () => void }) {
  const router = useRouter();

  // Listen for 401 session-expired events from httpClient
  useEffect(() => {
    const unsubscribe = authSessionExpired.subscribe(async () => {
      await secureStorage.remove('auth_token');
      authStorage.clearSession();
      router.replace('/auth');
    });
    return unsubscribe;
  }, [router]);

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.light.primary,
      background: '#F8FCF9',
      card: colors.light.surfaceElevated,
      text: colors.light.text,
      border: colors.light.border,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FCF9' }} onLayout={onLayout}>
      <ThemeProvider value={customLightTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8FCF9' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="schemes/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="schemes/journey" options={{ headerShown: false }} />
          <Stack.Screen name="profile/index" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
          <Stack.Screen name="profile/linked-accounts" options={{ headerShown: false }} />
          <Stack.Screen name="profile/settings" options={{ headerShown: false }} />
          <Stack.Screen name="support/index" options={{ headerShown: false }} />
          <Stack.Screen name="support/contact" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </View>
  );
}
