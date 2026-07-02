import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SignInScreen from '../components/SignInScreen';
import { useTeams } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import useStats from '../hooks/useStats';
import { palette } from '../theme/design';
import type { ResultCombinationStat } from '../types/stats';
import type UserStats from '../types/userStats';
import { createStyles } from './stats.styles';

const getCombinedSuccesses = (item: UserStats) =>
  (item.successes ?? 0) + (item.full15Successes ?? 0);

const getCombinedFailures = (item: UserStats) =>
  (item.failures ?? 0) + (item.full15Failures ?? 0);

const getCombinedRate = (item: UserStats) => {
  const successes = getCombinedSuccesses(item);
  const failures = getCombinedFailures(item);
  const total = successes + failures;
  return total > 0 ? (successes / total) * 100 : 0;
};

export default function StatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(isDark), [isDark]);
  const { width } = useWindowDimensions();
  const {
    user,
    loading: authLoading,
    signingIn,
    signInWithGoogle,
    googleAuthEnabled,
    providersLoading,
  } = useAuth();
  const { selectedTeam, loading: teamsLoading } = useTeams();
  const { loading, stats } = useStats(selectedTeam?.id);
  const isWide = width >= 920;
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const balance = stats?.balance ?? 0;
  const balancePositive = balance >= 0;
  const [displayValue, setDisplayValue] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setDisplayValue(0);
      animatedValue.setValue(0);
      scale.setValue(0.9);

      const id = animatedValue.addListener(({ value }) => {
        setDisplayValue(Math.round(value * Math.abs(balance)));
      });

      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start(() => {
        animatedValue.removeListener(id);
      });

      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.03,
          duration: 180,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 130,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      return () => {
        animatedValue.stopAnimation();
        scale.stopAnimation();
      };
    }, [animatedValue, balance, scale]),
  );

  React.useEffect(() => {
    if (user && !teamsLoading && !selectedTeam) {
      router.replace('/teams' as Href);
    }
  }, [router, selectedTeam, teamsLoading, user]);

  if (authLoading || (user && teamsLoading)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>{t('status.preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ranking = stats?.ranking ?? [];
  const leader = ranking[0];
  const totalPlayers = ranking.length;
  const totalSuccesses =
    (stats?.rankingTotal?.successes ?? 0) +
    (stats?.rankingTotal?.full15Successes ?? 0);
  const totalFailures =
    (stats?.rankingTotal?.failures ?? 0) +
    (stats?.rankingTotal?.full15Failures ?? 0);
  const totalResolved = totalSuccesses + totalFailures;
  const successRate =
    totalResolved > 0 ? (totalSuccesses / totalResolved) * 100 : 0;
  const bestResult = (stats?.resultBreakdown ?? [])
    .filter((entry) => entry.key !== 'TOTAL' && entry.total > 0)
    .sort((a, b) => b.successRate - a.successRate)[0];

  const renderRankingRow = (item: UserStats, index: number) => {
    const successes = getCombinedSuccesses(item);
    const failures = getCombinedFailures(item);
    const rate = getCombinedRate(item);
    const rowUser = item.user;

    return (
      <View key={rowUser?.id ?? `ranking-${index}`} style={styles.rankingRow}>
        <View style={styles.rankCell}>
          <Text style={styles.rankNumber}>{index + 1}</Text>
        </View>
        <View style={styles.playerCell}>
          <View
            style={[
              styles.userPill,
              { backgroundColor: rowUser?.backgroundColor ?? '#FFF4DF' },
            ]}
          >
            <Text
              style={[
                styles.userPillText,
                { color: rowUser?.textColor ?? '#8A4B12' },
              ]}
              numberOfLines={1}
            >
              {rowUser?.name ?? t('user.anonymous')}
            </Text>
          </View>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{successes}</Text>
          <Text style={styles.metricLabel}>{t('stats.successes')}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{failures}</Text>
          <Text style={styles.metricLabel}>{t('stats.failures')}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{rate.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>{t('stats.success_rate')}</Text>
        </View>
      </View>
    );
  };

  const renderBreakdownCard = (entry: ResultCombinationStat) => (
    <View
      key={entry.key}
      style={[
        styles.breakdownCard,
        entry.key === 'TOTAL' && styles.breakdownCardTotal,
      ]}
    >
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownKey}>{entry.key}</Text>
        <Text style={styles.breakdownRate}>
          {entry.successRate.toFixed(1)}%
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(0, Math.min(entry.successRate, 100))}%` },
          ]}
        />
      </View>
      <View style={styles.breakdownMeta}>
        <Text style={styles.breakdownMetaText}>
          {t('stats.successes')}: {entry.successes}
        </Text>
        <Text style={styles.breakdownMetaText}>
          {t('stats.failures')}: {entry.failures}
        </Text>
        <Text style={styles.breakdownMetaText}>
          {t('stats.total_predictions')}: {entry.total}
        </Text>
      </View>
    </View>
  );

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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>{t('stats.loading')}</Text>
          </View>
        ) : (
          <>
            <View style={[styles.hero, !isWide && styles.heroCompact]}>
              <Animated.View
                style={[styles.balanceCard, { transform: [{ scale }] }]}
              >
                <Text style={styles.summaryLabel}>
                  {t('stats.summary_balance')}
                </Text>
                <Text
                  style={[
                    styles.balanceValue,
                    balancePositive
                      ? styles.valuePositive
                      : styles.valueNegative,
                  ]}
                >
                  {balancePositive ? '+' : '-'}
                  {displayValue}€
                </Text>
                <Text style={styles.balanceHelp}>
                  {t('stats.balance_help')}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Ionicons
                  name="trophy-outline"
                  size={20}
                  color={palette.primary}
                />
                <Text style={styles.summaryLabel}>
                  {t('stats.summary_leader')}
                </Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {leader?.user?.name ?? '-'}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons
                  name="analytics-outline"
                  size={20}
                  color={palette.primary}
                />
                <Text style={styles.summaryLabel}>
                  {t('stats.summary_success_rate')}
                </Text>
                <Text style={styles.summaryValue}>
                  {successRate.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={palette.primary}
                />
                <Text style={styles.summaryLabel}>
                  {t('stats.summary_players')}
                </Text>
                <Text style={styles.summaryValue}>{totalPlayers}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={palette.primary}
                />
                <Text style={styles.summaryLabel}>
                  {t('stats.summary_best_result')}
                </Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {bestResult
                    ? `${bestResult.key} - ${bestResult.successRate.toFixed(1)}%`
                    : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('stats.top_performers')}
                </Text>
                <Text style={styles.sectionHint}>
                  {t('stats.ranking_help')}
                </Text>
              </View>
              <View style={styles.leaderGrid}>
                {ranking.slice(0, 3).map((item, index) => {
                  const rowUser = item.user;
                  return (
                    <View
                      key={rowUser?.id ?? `leader-${index}`}
                      style={styles.leaderCard}
                    >
                      <Text style={styles.leaderPosition}>#{index + 1}</Text>
                      <View
                        style={[
                          styles.userPill,
                          {
                            backgroundColor:
                              rowUser?.backgroundColor ?? '#FFF4DF',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.userPillText,
                            { color: rowUser?.textColor ?? '#8A4B12' },
                          ]}
                          numberOfLines={1}
                        >
                          {rowUser?.name ?? t('user.anonymous')}
                        </Text>
                      </View>
                      <Text style={styles.leaderRate}>
                        {getCombinedRate(item).toFixed(1)}%
                      </Text>
                      <Text style={styles.leaderMeta}>
                        {getCombinedSuccesses(item)} {t('stats.successes')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('stats.ranking_heading')}
                </Text>
              </View>
              <View style={styles.rankingPanel}>
                {ranking.length > 0 ? (
                  ranking.map(renderRankingRow)
                ) : (
                  <Text style={styles.emptyText}>{t('stats.empty')}</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('stats.result_breakdown_heading')}
                </Text>
                <Text style={styles.sectionHint}>
                  {t('stats.breakdown_help')}
                </Text>
              </View>
              <View style={styles.breakdownGrid}>
                {(stats?.resultBreakdown ?? []).length > 0 ? (
                  (stats?.resultBreakdown ?? []).map(renderBreakdownCard)
                ) : (
                  <Text style={styles.emptyText}>{t('stats.empty')}</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
