import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import ToastHost from './components/toast/ToastHost';
import WebNavigation from './components/WebNavigation';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';
import { wireConsoleForwarding } from './services/logger.service';
import { initRum, trackView } from './services/rum.service';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          {Platform.OS === 'web' && <WebNavigation />}
          <Stack screenOptions={{ headerShown: false }} />
          <ToastHost />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
