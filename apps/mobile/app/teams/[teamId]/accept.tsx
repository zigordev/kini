import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../../contexts/TeamContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createStyles } from '../../index.styles';
import { palette } from '../../theme/design';
import showErrorToast from '../../utils/toast';

export default function AcceptTeamInvitationScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const { acceptInvitation } = useTeams();
  const [message, setMessage] = useState(t('teams.accept_processing'));
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      const resolvedTeamId = Array.isArray(teamId) ? teamId[0] : teamId;
      if (!resolvedTeamId) {
        setMessage(t('teams.accept_invalid'));
        setDone(true);
        return;
      }

      try {
        await acceptInvitation(resolvedTeamId);
        setMessage(t('teams.accept_success'));
      } catch (caughtError) {
        console.error('Failed to accept team invitation', caughtError);
        showErrorToast(caughtError);
        setMessage(t('teams.accept_failed'));
      } finally {
        setDone(true);
      }
    };

    void run();
  }, [acceptInvitation, t, teamId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.authContainer}>
        {!done ? <ActivityIndicator size="large" color="#D71920" /> : null}
        <Text style={styles.authTitle}>
          {done ? t('teams.accept_title') : t('teams.accept_processing_title')}
        </Text>
        <Text style={styles.authSubtitle}>{message}</Text>
        {done ? (
          <Button
            title={t('teams.go_to_team')}
            onPress={() => router.replace('/pools')}
            color={palette.primary}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
