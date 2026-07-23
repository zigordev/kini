import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import NativeButton from '../components/NativeButton';
import NativeSelectionRow from '../components/NativeSelectionRow';
import SignInScreen from '../components/SignInScreen';
import { useTeams } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import { createThemedStyleSheet } from '../theme/createThemedStyleSheet';
import { palette, radius, shadow } from '../theme/design';
import type { Team } from '../types/team';
import showErrorToast, { showToast } from '../utils/toast';

export default function TeamsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ manage?: string }>();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const {
    user,
    loading: authLoading,
    signingIn,
    signInWithGoogle,
    googleAuthEnabled,
    providersLoading,
  } = useAuth();
  const {
    teams,
    selectedTeam,
    loading: teamsLoading,
    createTeam,
    selectTeam,
  } = useTeams();
  const forceManage = params.manage === '1';
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    if (user && selectedTeam && !forceManage && !teamsLoading) {
      router.replace('/pools' as Href);
    }
  }, [forceManage, router, selectedTeam, teamsLoading, user]);

  const handleCreateTeam = useCallback(async () => {
    const name = newTeamName.trim();
    if (!name) {
      return;
    }

    try {
      await createTeam(name);
      setNewTeamName('');
      showToast(t('teams.created'), 'success');
      router.replace('/pools' as Href);
    } catch (caughtError) {
      console.error('Failed to create team', caughtError);
      showErrorToast(caughtError);
    }
  }, [createTeam, newTeamName, router, t]);

  const handleSelectTeam = useCallback(
    (team: Team) => {
      selectTeam(team.id);
      router.replace('/pools' as Href);
    },
    [router, selectTeam],
  );

  if (authLoading || (user && selectedTeam && !forceManage && !teamsLoading)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingPanel}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>{t('status.preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SignInScreen
        signingIn={signingIn}
        providersLoading={providersLoading}
        googleAuthEnabled={googleAuthEnabled}
        onSignIn={signInWithGoogle}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.panel}>
          <Text style={styles.title}>{t('teams.title')}</Text>

          <View style={styles.createRow}>
            <TextInput
              value={newTeamName}
              onChangeText={setNewTeamName}
              placeholder={t('teams.create_prompt')}
              placeholderTextColor={isDark ? palette.darkMuted : palette.inkSubtle}
              style={styles.createInput}
              returnKeyType="done"
              onSubmitEditing={handleCreateTeam}
            />
            <View style={styles.createButtonNative}>
              <NativeButton
                title={t('teams.create')}
                onPress={handleCreateTeam}
              />
            </View>
          </View>

          {teamsLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={styles.loadingText}>{t('teams.loading')}</Text>
            </View>
          ) : teams.length === 0 ? (
            <Text style={styles.emptyText}>{t('teams.empty_title')}</Text>
          ) : (
            <View style={styles.list}>
              {teams.map((team) => {
                const active = team.id === selectedTeam?.id;

                return Platform.OS !== 'web' ? (
                  <NativeSelectionRow
                    key={team.id}
                    title={team.name}
                    selected={active}
                    onPress={() => handleSelectTeam(team)}
                    style={styles.nativeTeamRow}
                  />
                ) : (
                  <Pressable
                    key={team.id}
                    onPress={() => handleSelectTeam(team)}
                    style={({ pressed }) => [
                      styles.teamRow,
                      active && styles.teamRowActive,
                      pressed && styles.pressed,
                    ]}
                    android_ripple={{
                      color: isDark ? palette.darkBorder : palette.surfacePressed,
                      borderless: false,
                    }}
                  >
                    <View style={styles.teamIcon}>
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'people-outline'}
                        size={21}
                        color={palette.primary}
                      />
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? palette.darkMuted : palette.inkSubtle}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark = false) =>
  createThemedStyleSheet(
    {
      safeArea: {
        flex: 1,
        backgroundColor: palette.background,
      },
      scroll: {
        flex: 1,
        backgroundColor: palette.background,
      },
      content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Platform.OS === 'web' ? 20 : 12,
        paddingVertical: 28,
      },
      panel: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        borderWidth: Platform.OS === 'web' ? 1 : 0,
        borderColor: palette.border,
        borderRadius: Platform.OS === 'web' ? radius.md : 0,
        backgroundColor:
          Platform.OS === 'web' ? palette.surface : 'transparent',
        padding: Platform.OS === 'web' ? 16 : 0,
        gap: 14,
        ...(Platform.OS === 'web' ? shadow.card : {}),
      },
      title: {
        fontSize: 24,
        fontWeight: '800',
        color: palette.ink,
      },
      createRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      },
      createButtonNative: {
        minWidth: 116,
        height: 44,
      },
      createInput: {
        flex: 1,
        minHeight: 44,
        minWidth: 0,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        color: palette.ink,
        paddingHorizontal: 12,
        fontSize: 15,
        fontWeight: '600',
      },
      createButton: {
        minHeight: 44,
        borderRadius: radius.md,
        backgroundColor: palette.primary,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        overflow: 'hidden',
      },
      createButtonText: {
        color: palette.white,
        fontSize: 14,
        fontWeight: '800',
      },
      list: {
        gap: 8,
      },
      nativeTeamRow: {
        height: 54,
      },
      teamRow: {
        minHeight: 52,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        overflow: 'hidden',
      },
      teamRowActive: {
        borderColor: palette.primary,
        backgroundColor: palette.primarySofter,
      },
      teamIcon: {
        width: 34,
        height: 34,
        borderRadius: radius.pill,
        backgroundColor: palette.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      },
      teamName: {
        flex: 1,
        color: palette.ink,
        fontSize: 16,
        fontWeight: '800',
      },
      emptyText: {
        color: palette.inkMuted,
        fontSize: 15,
        textAlign: 'center',
        paddingVertical: 12,
      },
      loadingPanel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      },
      loadingCard: {
        minHeight: 120,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      },
      loadingText: {
        color: palette.inkMuted,
        fontSize: 15,
      },
      pressed: {
        opacity: 0.82,
      },
    },
    isDark,
  );
