import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NativeButton from '../components/NativeButton';
import NativeGlassIconButton from '../components/NativeGlassIconButton';
import NativeOptionStack from '../components/NativeOptionStack';
import SignInScreen from '../components/SignInScreen';
import { useTeams } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import {
  addAvailablePoolToTeam,
  fetchAvailablePools,
  syncAvailablePools,
  updateAvailablePoolMatchResult,
} from '../services/availablePools.service';
import { updatePoolDetails } from '../services/futPool.service';
import { createThemedStyleSheet } from '../theme/createThemedStyleSheet';
import { palette, radius } from '../theme/design';
import { AvailablePool } from '../types/availablePool';
import { EXTENDED_OPTIONS, REGULAR_OPTIONS } from '../types/futPool';
import showErrorToast, { showToast } from '../utils/toast';
import { readPoolDefaults } from '../../src/utils/poolDefaults';

const BACKGROUND_REFRESH_MS = 15 * 60 * 1000;

export default function AvailablePoolsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const {
    user,
    loading: authLoading,
    signingIn,
    signInWithGoogle,
    googleAuthEnabled,
    providersLoading,
  } = useAuth();
  const { selectedTeam, loading: teamsLoading, selectTeam } = useTeams();
  const [availablePools, setAvailablePools] = useState<AvailablePool[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [updatingResultId, setUpdatingResultId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAvailablePools(await fetchAvailablePools());
    } catch (error) {
      console.error('Failed to load available pools', error);
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void load();
    }
  }, [load, user]);

  useEffect(() => {
    if (user && !teamsLoading && !selectedTeam) {
      router.replace('/teams' as Href);
    }
  }, [router, selectedTeam, teamsLoading, user]);

  const syncInBackground = useCallback(async () => {
    try {
      setAvailablePools(await syncAvailablePools());
    } catch (error) {
      console.error('Failed to sync available pools', error);
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    try {
      setAvailablePools(await syncAvailablePools());
      showToast(t('available_pools.synced'), 'success');
    } catch (error) {
      console.error('Failed to sync available pools', error);
      showErrorToast(error);
    } finally {
      setSyncing(false);
    }
  }, [t]);

  useEffect(() => {
    if (!user || !selectedTeam) {
      return undefined;
    }

    void syncInBackground();
    const intervalId = setInterval(() => {
      void syncInBackground();
    }, BACKGROUND_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [selectedTeam, syncInBackground, user]);

  const handleAddToTeam = useCallback(
    async (availablePool: AvailablePool, teamId?: string) => {
      if (!teamId) {
        showErrorToast(new Error(t('available_pools.no_team_selected')));
        return;
      }
      setAddingId(`${availablePool.id}:${teamId}`);
      try {
        const createdPool = await addAvailablePoolToTeam(
          availablePool.id,
          teamId,
        );
        const defaults = await readPoolDefaults(teamId);
        await updatePoolDetails(createdPool.id, defaults);
        selectTeam(teamId);
        showToast(t('available_pools.added'), 'success');
        router.push('/pools' as Href);
      } catch (error) {
        console.error('Failed to add available pool to team', error);
        showErrorToast(error);
      } finally {
        setAddingId(null);
      }
    },
    [router, selectTeam, t],
  );

  const handleChangeOfficialResult = useCallback(
    async (
      availablePool: AvailablePool,
      order: number,
      value: string,
      splitIndex?: number,
    ) => {
      const match = availablePool.matches.find((entry) => entry.order === order);
      const current = Array.isArray(match?.officialResults)
        ? match.officialResults
        : [];
      const isFull15 = Boolean(match?.full15) || order === 15;
      const next =
        isFull15 && typeof splitIndex === 'number'
          ? (() => {
              const nextValues = [current[0] ?? '', current[1] ?? ''];
              nextValues[splitIndex] =
                nextValues[splitIndex] === value ? '' : value;
              return nextValues;
            })()
          : current.length === 1 && current[0] === value
            ? []
            : [value];
      setUpdatingResultId(`${availablePool.id}:${order}`);
      try {
        const updated = await updateAvailablePoolMatchResult(
          availablePool.id,
          order,
          next,
        );
        setAvailablePools((currentPools) =>
          currentPools.map((pool) =>
            pool.id === updated.id ? updated : pool,
          ),
        );
      } catch (error) {
        console.error('Failed to update available pool result', error);
        showErrorToast(error);
      } finally {
        setUpdatingResultId(null);
      }
    },
    [],
  );

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const poolName = (availablePool: AvailablePool) => {
    const jornada = availablePool.externalDrawId?.match(/jornada-(\d+)/i)?.[1];
    return jornada ? `Jornada ${jornada}` : availablePool.name;
  };

  if (authLoading || (user && teamsLoading)) {
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

  if (!selectedTeam) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingPanel}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>{t('status.preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          !isWide && styles.contentCompact,
        ]}
      >
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>
              {t('available_pools.loading')}
            </Text>
          </View>
        ) : availablePools.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={42}
              color={palette.primary}
            />
            <Text style={styles.emptyTitle}>
              {t('available_pools.empty_title')}
            </Text>
            <Text style={styles.emptyText}>
              {t('available_pools.empty_text')}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {availablePools.map((availablePool) => (
              <View
                key={availablePool.id}
                style={[
                  styles.poolCard,
                  isWide ? styles.poolCardWide : styles.poolCardCompact,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderCopy}>
                    <Text style={styles.poolName} numberOfLines={1}>
                      {poolName(availablePool)}
                    </Text>
                    <Text style={styles.poolMeta} numberOfLines={1}>
                      {formatDateTime(
                        availablePool.closingDate ?? availablePool.drawDate,
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.matchTable}>
                  {availablePool.matches.length > 0 ? (
                    availablePool.matches.map((match) => {
                      const result = match.officialResults ?? [];
                      const isFull15 =
                        Boolean(match.full15) || match.order === 15;
                      const busy =
                        updatingResultId ===
                        `${availablePool.id}:${match.order}`;
                      if (isFull15) {
                        return (
                          <View
                            key={match.order}
                            style={[styles.matchRow, styles.full15MatchRow]}
                          >
                            <View
                              style={[
                                styles.full15MatchHeader,
                                styles.matchNumberColumn,
                              ]}
                            >
                              <Text style={styles.matchNumber}>
                                {match.order}
                              </Text>
                            </View>
                            <View style={styles.full15ResultRows}>
                              {[
                                {
                                  label: String(
                                    match.homeTeam || t('matches.home_team'),
                                  ),
                                  splitIndex: 0,
                                },
                                {
                                  label: String(
                                    match.awayTeam || t('matches.away_team'),
                                  ),
                                  splitIndex: 1,
                                },
                              ].map((entry) => (
                                <View
                                  key={entry.splitIndex}
                                  style={styles.full15ResultRow}
                                >
                                  <Text
                                    style={styles.full15ResultLabel}
                                    numberOfLines={1}
                                  >
                                    {entry.label}
                                  </Text>
                                  <NativeOptionStack
                                    disabled={busy}
                                    options={[...EXTENDED_OPTIONS]}
                                    outcome="neutral"
                                    selectedOptions={
                                      result[entry.splitIndex]
                                        ? [String(result[entry.splitIndex])]
                                        : []
                                    }
                                    style={styles.full15OptionStack}
                                    onSelect={(option) =>
                                      handleChangeOfficialResult(
                                        availablePool,
                                        match.order,
                                        option,
                                        entry.splitIndex,
                                      )
                                    }
                                  />
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      }
                      return (
                        <View key={match.order} style={styles.matchRow}>
                          <View style={styles.matchNumberColumn}>
                            <Text style={styles.matchNumber}>
                              {match.order}
                            </Text>
                          </View>
                          <View style={styles.matchTeams}>
                            <Text style={styles.matchTeamName} numberOfLines={1}>
                              {match.homeTeam}
                            </Text>
                            <Text style={styles.matchTeamName} numberOfLines={1}>
                              {match.awayTeam}
                            </Text>
                          </View>
                          <View style={styles.resultGroup}>
                            <NativeOptionStack
                              disabled={busy}
                              options={[...REGULAR_OPTIONS]}
                              outcome="neutral"
                              selectedOptions={result.map((value) =>
                                String(value),
                              )}
                              onSelect={(option) =>
                                handleChangeOfficialResult(
                                  availablePool,
                                  match.order,
                                  option,
                                )
                              }
                            />
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.cardBodyText}>
                      {t('available_pools.no_matches')}
                    </Text>
                  )}
                </View>

                <View style={styles.assignArea}>
                  <NativeButton
                    title={t('available_pools.play')}
                    onPress={() =>
                      handleAddToTeam(availablePool, selectedTeam?.id)
                    }
                    disabled={
                      !selectedTeam ||
                      addingId === `${availablePool.id}:${selectedTeam.id}`
                    }
                    style={styles.nativeActionButton}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.createButtonSlot}>
        <NativeGlassIconButton
          key="sync"
          accessibilityLabel={t('available_pools.sync')}
          disabled={syncing}
          iconName="sync"
          onPress={handleManualSync}
        />
        <NativeGlassIconButton
          key="plus"
          accessibilityLabel={t('pools.create_accessibility')}
          iconName="plus"
          onPress={() => router.push('/create-pool' as Href)}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark = false) =>
  createThemedStyleSheet(
    {
      safeArea: {
        flex: 1,
        backgroundColor: palette.background,
        position: 'relative',
      },
      scroll: {
        flex: 1,
        backgroundColor: palette.background,
      },
      content: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'web' ? 32 : 64,
        paddingBottom: Platform.OS === 'web' ? 48 : 128,
        gap: 24,
      },
      contentCompact: {
        paddingHorizontal: 12,
      },
      hero: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
      },
      heroCompact: {
        flexDirection: 'column',
      },
      heroCopy: {
        flex: 1,
        maxWidth: 760,
        gap: 8,
      },
      eyebrow: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: palette.primarySoft,
        color: palette.primaryDark,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
      },
      title: {
        fontSize: 34,
        lineHeight: 40,
        fontWeight: '800',
        color: palette.ink,
      },
      subtitle: {
        fontSize: 16,
        lineHeight: 23,
        color: palette.inkMuted,
      },
      createButtonSlot: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 28 : 64,
        right: Platform.OS === 'web' ? 28 : 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 25,
        elevation: 12,
      },
      nativeActionButton: {
        alignSelf: 'flex-start',
        minWidth: 156,
        height: 44,
      },
      fullWidth: {
        width: '100%',
        justifyContent: 'flex-start',
      },
      grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'stretch',
      },
      poolCard: {
        backgroundColor: 'transparent',
        padding: 0,
        gap: 12,
      },
      poolCardWide: {
        flexBasis: 420,
        flexGrow: 1,
        maxWidth: 640,
      },
      poolCardCompact: {
        width: '100%',
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: Platform.OS === 'web' ? 0 : 56,
      },
      cardHeaderCopy: {
        flex: 1,
        minWidth: 0,
      },
      poolName: {
        fontSize: 19,
        fontWeight: '800',
        color: palette.ink,
      },
      poolMeta: {
        marginTop: 3,
        fontSize: 13,
        color: palette.inkMuted,
      },
      cardBody: {
        gap: 6,
      },
      cardBodyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: palette.ink,
      },
      cardBodyText: {
        fontSize: 14,
        lineHeight: 20,
        color: palette.inkMuted,
      },
      matchTable: {
        width: '100%',
      },
      matchRow: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        backgroundColor: 'transparent',
      },
      full15MatchRow: {
        alignItems: 'flex-start',
      },
      full15MatchHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
      },
      full15MatchCopy: {
        flex: 1,
        minWidth: 0,
      },
      full15MatchTitle: {
        color: palette.primaryDark,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
      },
      full15ResultRows: {
        flex: 1,
        minWidth: 0,
        gap: 6,
      },
      full15ResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      },
      full15ResultLabel: {
        minWidth: 72,
        flex: 1,
        flexShrink: 1,
        paddingRight: 10,
        marginRight: 2,
        borderRightWidth: 1,
        borderRightColor: palette.border,
        color: palette.ink,
        fontSize: 13,
        fontWeight: '700',
      },
      matchNumber: {
        width: 22,
        color: palette.primaryDark,
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
      },
      matchNumberColumn: {
        width: 34,
        minHeight: 30,
        paddingRight: 8,
        marginRight: 2,
        borderRightWidth: 1,
        borderRightColor: palette.border,
        alignItems: 'center',
        justifyContent: 'center',
      },
      matchTeams: {
        flex: 1,
        gap: 1,
        paddingRight: 10,
        marginRight: 2,
        borderRightWidth: 1,
        borderRightColor: palette.border,
      },
      matchTeamName: {
        color: palette.ink,
        fontSize: 13,
        fontWeight: '700',
      },
      resultGroup: {
        flexDirection: 'row',
        gap: 6,
      },
      full15OptionStack: {
        width: Platform.OS === 'android' ? 172 : 144,
      },
      assignArea: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
      },
      loadingPanel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      },
      loadingCard: {
        minHeight: 260,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
      },
      loadingText: {
        color: palette.inkMuted,
        fontSize: 15,
      },
      emptyCard: {
        minHeight: 320,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: palette.borderStrong,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 24,
      },
      emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: palette.ink,
        textAlign: 'center',
      },
      emptyText: {
        maxWidth: 520,
        fontSize: 15,
        lineHeight: 22,
        color: palette.inkMuted,
        textAlign: 'center',
      },
    },
    isDark,
  );
