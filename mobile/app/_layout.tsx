import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hasHydrated = useStore((s) => s._hasHydrated);
  const { darkMode, colors } = useTheme();

  useEffect(() => {
    if (hasHydrated) SplashScreen.hideAsync();
  }, [hasHydrated]);

  useEffect(() => {
    let cancelled = false;
    let started = false;

    const finish = async () => {
      if (started || cancelled) return;
      started = true;
      try {
        const { initApiToken, refreshApiUrl } = await import('@/src/api/client');
        refreshApiUrl();
        await initApiToken();
        await useStore.getState().restoreSession();
        void useStore.getState().hydrateFromApi();
      } catch {
        // offline
      } finally {
        if (!cancelled) useStore.setState({ _hasHydrated: true });
      }
    };

    void useStore.persist.rehydrate().then(() => finish()).catch(() => finish());

    const timer = setTimeout(() => {
      void finish();
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!hasHydrated) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#9588E8', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.dark,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(parent)" options={{ headerShown: false }} />
        <Stack.Screen name="schedule" options={{ title: 'Jadval' }} />
        <Stack.Screen name="payments" options={{ title: "To'lovlar" }} />
        <Stack.Screen name="teachers" options={{ title: 'Xodimlar' }} />
        <Stack.Screen name="parents" options={{ title: 'Ota-onalar' }} />
        <Stack.Screen name="settings" options={{ title: 'Sozlamalar' }} />
        <Stack.Screen name="royxat" options={{ title: "Ro'yxatdan o'tish" }} />
        <Stack.Screen name="enrollment" options={{ title: "Ro'yxatdan o'tish" }} />
        <Stack.Screen name="laboratory" options={{ title: 'Laboratoriya' }} />
        <Stack.Screen name="network" options={{ title: 'Tarmoq' }} />
        <Stack.Screen name="partnerships" options={{ title: 'Hamkorlik' }} />
        <Stack.Screen name="projects" options={{ title: 'Loyihalar' }} />
        <Stack.Screen name="attendance" options={{ title: 'Davomat' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
