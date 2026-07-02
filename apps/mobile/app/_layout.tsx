import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ToastHost from './components/toast/ToastHost';
import WebNavigation from './components/WebNavigation';
import { AuthProvider } from './contexts/AuthContext';
import { TeamProvider } from './contexts/TeamContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import useAuth from './hooks/useAuth';
import './i18n';
import { wireConsoleForwarding } from './services/logger.service';
import { initRum, trackView } from './services/rum.service';
import { palette } from './theme/design';

export default function RootLayout() {
  // Initialize RUM once
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initRum(true);
      wireConsoleForwarding();
      initializedRef.current = true;
    }
  }, []);

  // Track route changes using the current pathname
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/').filter(Boolean).slice(-1)[0] ?? 'root';
      trackView(name, pathname);
    }
  }, [pathname]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <ThemedAppFrame>
              <TeamProvider>
                <UserPreferenceSync />
                {Platform.OS === 'web' && <WebNavigation />}
                <AppStack />
                <ToastHost />
              </TeamProvider>
            </ThemedAppFrame>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const AppStack = () => {
  const { isDark } = useTheme();
  const headerBackground = isDark ? palette.darkSurface : palette.surface;
  const headerTint = isDark ? palette.darkInk : palette.ink;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="teams" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-pool"
        options={{
          headerShown: true,
          presentation: 'modal',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: headerBackground,
          },
          headerTintColor: headerTint,
        }}
      />
    </Stack>
  );
};

const ThemedAppFrame = ({ children }: { children: React.ReactNode }) => {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? palette.darkBackground : palette.background;

  return (
    <View style={[styles.frame, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
};

const UserPreferenceSync = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = user?.language;
    if (
      (language === 'en' || language === 'es') &&
      i18n.language?.slice(0, 2) !== language
    ) {
      void i18n.changeLanguage(language);
    }
  }, [i18n, user?.language]);

  return null;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  frame: {
    flex: 1,
  },
});
