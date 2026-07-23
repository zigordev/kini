import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import NativeButton from '../components/NativeButton';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import { createStyles } from '../index.styles';
import { palette } from '../theme/design';
import showErrorToast from '../utils/toast';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    error?: string;
    userId?: string;
    mobile_token?: string;
  }>();
  const { refresh } = useAuth();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const errorCode = typeof params.error === 'string' ? params.error : null;

      if (errorCode) {
        setError(errorCode);
        setLoading(false);
        return;
      }

      try {
        // Note: Mobile token exchange is already handled in AuthContext.signInWithGoogle
        // We only need to refresh the session here
        await refresh();
        router.replace('/pools');
      } catch (caughtError) {
        console.error('Failed to complete authentication', caughtError);
        showErrorToast(caughtError);
        setError(
          'No se pudo completar el inicio de sesión. Intenta nuevamente.',
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params.error, refresh, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71920" />
          <Text style={styles.loadingText}>Verificando sesión...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Algo salió mal</Text>
        <Text style={styles.authSubtitle}>
          {error ?? 'No pudimos validar tu sesión.'}
        </Text>
        <NativeButton
          title="Volver al inicio"
          onPress={() => router.replace('/pools')}
          style={styles.authNativeButton}
        />
      </View>
    </SafeAreaView>
  );
}
