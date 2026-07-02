import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { palette, radius, shadow } from '../theme/design';
import { AvailablePool } from '../types/availablePool';
import { EXTENDED_OPTIONS } from '../types/futPool';
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
  const { teams, selectedTeam, loading: teamsLoading, selectTeam } = useTeams();
  const [availablePools, setAvailablePools] = useState<AvailablePool[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [teamPickerPoolId, setTeamPickerPoolId] = useState<string | null>(
    null,
  );
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
        setTeamPickerPoolId(null);
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

  const handleOpenTeamPicker = useCallback(
    (availablePool: AvailablePool) => {
      if (Platform.OS === 'web') {
        setTeamPickerPoolId((current) =>
          current === availablePool.id ? null : availablePool.id,
        );
        return;
      }

      if (!teams.length) {
        return;
      }

      if (Platform.OS === 'ios') {
        const cancelIndex = teams.length;
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: t('available_pools.select_team'),
            options: [...teams.map((team) => team.name), t('actions.cancel')],
            cancelButtonIndex: cancelIndex,
          },
          (buttonIndex) => {
            const team = teams[buttonIndex];
            if (team) {
              void handleAddToTeam(availablePool, team.id);
            }
          },
        );
        return;
      }

      Alert.alert(
        t('available_pools.select_team'),
        undefined,
        [
          ...teams.map((team) => ({
            text: team.name,
            onPress: () => {
              void handleAddToTeam(availablePool, team.id);
            },
          })),
          { text: t('actions.cancel'), style: 'cancel' as const },
        ],
        { cancelable: true },
      );
    },
    [handleAddToTeam, t, teams],
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
        <View style={[styles.hero, !isWide && styles.heroCompact]}>
          <View style={[styles.heroActions, !isWide && styles.fullWidth]}>
            <TouchableOpacity
              onPress={() => router.push('/create-pool' as Href)}
              activeOpacity={0.78}
              style={styles.secondaryButton}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={palette.primary}
              />
              <Text style={styles.secondaryButtonText}>
                {t('pools.create_title')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                  <View style={styles.poolIcon}>
                    <Ionicons
                      name="football-outline"
                      size={22}
                      color={palette.primary}
                    />
                  </View>
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
                            <View style={styles.full15MatchHeader}>
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
                                  <View style={styles.resultGroup}>
                                    {EXTENDED_OPTIONS.map((option) => {
                                      const selected =
                                        result[entry.splitIndex] === option;
                                      return (
                                        <TouchableOpacity
                                          key={`${entry.splitIndex}-${option}`}
                                          activeOpacity={0.75}
                                          disabled={busy}
                                          onPress={() =>
                                            handleChangeOfficialResult(
                                              availablePool,
                                              match.order,
                                              option,
                                              entry.splitIndex,
                                            )
                                          }
                                          style={[
                                            styles.resultButton,
                                            selected &&
                                              styles.resultButtonSelected,
                                          ]}
                                        >
                                          <Text
                                            style={[
                                              styles.resultButtonText,
                                              selected &&
                                                styles.resultButtonTextSelected,
                                            ]}
                                          >
                                            {option}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      }
                      return (
                        <View key={match.order} style={styles.matchRow}>
                          <Text style={styles.matchNumber}>{match.order}</Text>
                          <Text style={styles.matchTeams} numberOfLines={1}>
                            {match.homeTeam} - {match.awayTeam}
                          </Text>
                          <View style={styles.resultGroup}>
                            {['1', 'X', '2'].map((option) => {
                              const selected = result.includes(option);
                              return (
                                <TouchableOpacity
                                  key={option}
                                  activeOpacity={0.75}
                                  disabled={busy}
                                  onPress={() =>
                                    handleChangeOfficialResult(
                                      availablePool,
                                      match.order,
                                      option,
                                    )
                                  }
                                  style={[
                                    styles.resultButton,
                                    selected && styles.resultButtonSelected,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.resultButtonText,
                                      selected &&
                                        styles.resultButtonTextSelected,
                                    ]}
                                  >
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
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
                  <TouchableOpacity
                    onPress={() => handleOpenTeamPicker(availablePool)}
                    activeOpacity={0.78}
                    style={styles.teamSelectButton}
                    disabled={!teams.length}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color={palette.white}
                    />
                    <Text style={styles.teamSelectButtonText}>
                      {t('available_pools.add_to_team')}
                    </Text>
                    {Platform.OS === 'web' ? (
                      <Ionicons
                        name={
                          teamPickerPoolId === availablePool.id
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={17}
                        color={palette.white}
                      />
                    ) : null}
                  </TouchableOpacity>
                  {Platform.OS === 'web' && teamPickerPoolId === availablePool.id && (
                    <View style={styles.teamMenu}>
                      <Text style={styles.teamMenuLabel}>
                        {t('available_pools.select_team')}
                      </Text>
                      {teams.map((team) => {
                        const isAdding =
                          addingId === `${availablePool.id}:${team.id}`;
                        return (
                          <TouchableOpacity
                            key={team.id}
                            onPress={() =>
                              handleAddToTeam(availablePool, team.id)
                            }
                            activeOpacity={0.72}
                            style={styles.teamMenuOption}
                            disabled={isAdding}
                          >
                            <View style={styles.teamMenuOptionIcon}>
                              {isAdding ? (
                                <ActivityIndicator
                                  size="small"
                                  color={palette.primary}
                                />
                              ) : (
                                <Ionicons
                                  name="people-outline"
                                  size={17}
                                  color={palette.primary}
                                />
                              )}
                            </View>
                            <Text
                              style={styles.teamMenuOptionText}
                              numberOfLines={1}
                            >
                              {team.name}
                            </Text>
                            {!isAdding && (
                              <Ionicons
                                name="arrow-forward"
                                size={16}
                                color={palette.inkSubtle}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
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
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'web' ? 32 : 20,
        paddingBottom: 48,
        gap: 24,
      },
      contentCompact: {
        paddingHorizontal: 18,
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
      heroActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 10,
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
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 14,
        gap: 12,
        ...shadow.card,
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
        gap: 12,
      },
      poolIcon: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: palette.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
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
      teamActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
      },
      matchTable: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        overflow: 'hidden',
      },
      matchRow: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        backgroundColor: palette.backgroundElevated,
      },
      full15MatchRow: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
      },
      full15MatchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
        marginLeft: 32,
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
        color: palette.inkMuted,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
      },
      matchNumber: {
        width: 22,
        color: palette.primaryDark,
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
      },
      matchTeams: {
        flex: 1,
        color: palette.ink,
        fontSize: 13,
        fontWeight: '700',
      },
      resultGroup: {
        flexDirection: 'row',
        gap: 6,
      },
      resultButton: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: palette.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface,
      },
      resultButtonSelected: {
        borderColor: '#374151',
        backgroundColor: '#4B5563',
      },
      resultButtonText: {
        color: palette.ink,
        fontSize: 12,
        fontWeight: '800',
      },
      resultButtonTextSelected: {
        color: palette.white,
      },
      assignArea: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
      },
      teamSelectButton: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.md,
        backgroundColor: palette.primary,
      },
      teamSelectButtonText: {
        color: palette.white,
        fontSize: 14,
        fontWeight: '800',
      },
      teamMenu: {
        width: 272,
        maxWidth: '100%',
        marginTop: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        ...shadow.raised,
      },
      teamMenuLabel: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
        color: palette.inkMuted,
        fontSize: 12,
        fontWeight: '800',
      },
      teamMenuOption: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: palette.border,
      },
      teamMenuOptionIcon: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.sm,
        backgroundColor: palette.primarySoft,
      },
      teamMenuOptionText: {
        flex: 1,
        color: palette.ink,
        fontSize: 14,
        fontWeight: '700',
      },
      primaryButton: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radius.md,
        backgroundColor: palette.primary,
      },
      primaryButtonText: {
        color: palette.white,
        fontSize: 14,
        fontWeight: '800',
      },
      secondaryButton: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
      },
      secondaryButtonText: {
        color: palette.ink,
        fontSize: 14,
        fontWeight: '700',
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
