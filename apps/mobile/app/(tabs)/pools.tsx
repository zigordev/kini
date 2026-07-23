import { useFocusEffect } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import E8Toggle from '../components/E8Toggle';
import FutPoolCard from '../components/futPoolCard/FutPoolCard';
import NativeNumberSelect from '../components/NativeNumberSelect';
import NativePoolConfigButton from '../components/NativePoolConfigButton';
import { useTeams } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import useFutPool from '../hooks/useFutPool';
import { createStyles } from '../index.styles';
import SignInScreen from '../components/SignInScreen';
import {
  checkPoolResults,
  updatePoolDoubles,
  updatePoolElige8,
  updatePoolTriples,
} from '../services/futPool.service';
import { updateMatch } from '../services/futPoolMatch.service';
import realtime from '../services/realtime.service';
import FutPoolSnapshot, {
  FutPoolStatus,
  OptionValue,
  SPLIT_SUFFIXES,
} from '../types/futPool';
import showErrorToast, { showToast } from '../utils/toast';

const DOUBLES_MIN = 0;
const DOUBLES_MAX = 14;
const TRIPLES_MIN = 0;
const TRIPLES_MAX = 9;
const DEFAULT_MATCH_USER_COLOR = '#D71920';
const BACKGROUND_REFRESH_MS = 15 * 60 * 1000;

const getPoolStatus = (
  pool: FutPoolSnapshot | null | undefined,
): FutPoolStatus => {
  if (!pool) {
    return 'programmed';
  }

  if (pool.status) {
    return pool.status;
  }

  return pool.active ? 'programmed' : 'closed';
};

const getPoolOutcomeStats = (pool: FutPoolSnapshot | null | undefined) => {
  const matches = Array.isArray(pool?.matches) ? pool.matches : [];
  const total = Math.max(matches.length, 15);

  if (matches.length === 0) {
    const successes = typeof pool?.successes === 'number' ? pool.successes : 0;
    const pending = Math.max(0, total - successes);
    return {
      successes,
      failures: 0,
      resolved: successes,
      pending,
      successRate: successes > 0 ? 100 : 0,
      total,
      elige8Successes: 0,
    };
  }

  const successes = matches.filter(
    (match: any) => match?.success === true,
  ).length;
  const failures = matches.filter(
    (match: any) => match?.success === false,
  ).length;
  const resolved = successes + failures;
  const pending = Math.max(0, total - resolved);
  const elige8Successes = matches.filter(
    (match: any) => match?.elige8 && match?.success === true,
  ).length;
  const successRate =
    resolved > 0 ? Math.round((successes / resolved) * 100) : 0;

  return {
    successes,
    failures,
    resolved,
    pending,
    successRate,
    total,
    elige8Successes,
  };
};

const normalizeDate = (source: Date | string | null | undefined) => {
  if (!source) {
    const fallback = new Date();
    fallback.setHours(12, 0, 0, 0);
    return fallback;
  }

  if (typeof source === 'string') {
    const match = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12,
        0,
        0,
        0,
      );
    }

    const parsed = new Date(source);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(12, 0, 0, 0);
      return parsed;
    }

    const fallback = new Date();
    fallback.setHours(12, 0, 0, 0);
    return fallback;
  }

  const normalized =
    source instanceof Date ? new Date(source.getTime()) : new Date(source);
  if (!Number.isNaN(normalized.getTime())) {
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  }

  const fallback = new Date();
  fallback.setHours(12, 0, 0, 0);
  return fallback;
};

export default function PoolsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string }>();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const { width: windowWidth } = useWindowDimensions();
  const mobilePoolCarouselPageWidth = Math.max(1, Math.round(windowWidth));
  const { selectedTeam, loading: teamsLoading } = useTeams();
  const {
    user,
    loading: authLoading,
    signingIn,
    signInWithGoogle,
    googleAuthEnabled,
    providersLoading,
  } = useAuth();

  // Successes badge whole-unit count-up animation state
  const successesRafRef = useRef<number | null>(null);
  const successesAnimStartRef = useRef<number>(0);
  const [displayedSuccesses, setDisplayedSuccesses] = useState(0);
  const [animateSeed, setAnimateSeed] = useState(0);

  const isAuthenticated = Boolean(user);
  const teamReady =
    !isAuthenticated || (!teamsLoading && Boolean(selectedTeam));

  useEffect(() => {
    if (isAuthenticated && !teamsLoading && !selectedTeam) {
      router.replace('/teams' as Href);
    }
  }, [isAuthenticated, router, selectedTeam, teamsLoading]);

  useEffect(() => {
    mobilePoolHistoryRequestedRef.current = false;
  }, [selectedTeam?.id]);

  const {
    loading: poolsLoading,
    error,
    pools,
    activePool,
    totalPools,
    updatePoolSnapshot,
    setActivePool,
    loadPoolByIndex,
    loadAllPools,
  } = useFutPool({
    enabled: isAuthenticated && teamReady,
    teamId: selectedTeam?.id,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [poolSelectorOpen, setPoolSelectorOpen] = useState(false);
  const [poolSelectorLoading, setPoolSelectorLoading] = useState(false);

  // Animation refs (must be declared before any early returns)
  const gloveScale = useRef(new Animated.Value(1)).current;
  const lastHeaderSuccessesRef = useRef<number>(0);
  const mobilePoolCarouselRef = useRef<ScrollView | null>(null);
  const mobilePoolHistoryRequestedRef = useRef(false);

  useEffect(() => {
    const handleNotification = (payload: any) => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // On native, rely on OS push notifications -> do not show in-app toast
        return;
      }
      const title =
        payload?.title ??
        (payload?.type === 'pool'
          ? t('notifications.pool_updated')
          : t('notifications.match_updated'));
      const body = payload?.body ? String(payload.body) : '';
      const message = body ? `${title}: ${body}` : title;
      showToast(message, 'info');
    };
    realtime.onNotification(handleNotification);
    return () => {
      realtime.offNotification(handleNotification);
    };
  }, [t]);

  // Create virtual pools array (placeholders for all pools based on totalPools)
  // Mapping: virtualIndex = totalPools - page  (where page is 1-indexed from latest)
  // So: virtualIndex 0 = oldest (page totalPools), virtualIndex totalPools-1 = latest (page 1)
  const virtualPools = useMemo(() => {
    if (totalPools === 0) return [];

    // Create an array of length totalPools filled with nulls
    const virtual = new Array(totalPools).fill(null);

    // Place the loaded pools in their correct positions
    // pools array is sorted ascending by date (oldest to newest)
    pools.forEach((pool, index) => {
      // The latest pool (first loaded, page 1) is at the end of pools array after sort
      // and should be at virtual[totalPools - 1]
      // For now, we'll just place loaded pools in order and rely on dynamic loading
      const isFirstLoad = pools.length === 1;
      if (isFirstLoad) {
        // First pool loaded is always the latest
        virtual[totalPools - 1] = pool;
      } else {
        // Place pools based on their sorted position
        // Since pools is sorted asc by date, the last one is the newest
        const positionFromEnd = pools.length - 1 - index;
        const virtualIndex = totalPools - 1 - positionFromEnd;
        if (virtualIndex >= 0 && virtualIndex < totalPools) {
          virtual[virtualIndex] = pool;
        }
      }
    });

    return virtual;
  }, [pools, totalPools]);

  const loadedPoolItems = useMemo(
    () =>
      virtualPools
        .map((pool, index) => ({ pool, index }))
        .filter(
          (
            item,
          ): item is { pool: FutPoolSnapshot; index: number } =>
            Boolean(item.pool),
        ),
    [virtualPools],
  );
  const poolSelectorItems = useMemo(
    () => [...loadedPoolItems].sort((a, b) => b.index - a.index),
    [loadedPoolItems],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveIndex(0);
      if (activePool) {
        setActivePool(null);
      }
      return;
    }

    if (totalPools === 0) {
      setActiveIndex(0);
      if (activePool) {
        setActivePool(null);
      }
      return;
    }

    const latestIndex = totalPools - 1; // Latest pool is at the end

    if (!activePool && pools.length > 0) {
      setActiveIndex(latestIndex);
      setActivePool(pools[0]); // First loaded pool is the latest
      return;
    }

    if (activePool) {
      const resolvedIndex = virtualPools.findIndex(
        (pool) => pool?.id === activePool.id,
      );
      if (resolvedIndex >= 0 && resolvedIndex !== activeIndex) {
        setActiveIndex(resolvedIndex);
      }
    }
  }, [
    pools,
    activePool,
    activeIndex,
    setActivePool,
    isAuthenticated,
    totalPools,
    virtualPools,
  ]);

  const activeOutcomeStats = useMemo(
    () => getPoolOutcomeStats(activePool),
    [activePool],
  );

  // Calculate header successes for the glove animation.
  // Full-15 only contributes after the first 14 matches are all correct.
  const headerSuccesses = useMemo(() => {
    return activeOutcomeStats.successes;
  }, [activeOutcomeStats.successes]);

  // Animate successes badge value from 0 to headerSuccesses in whole units over 3s
  useEffect(() => {
    if (successesRafRef.current != null) {
      cancelAnimationFrame(successesRafRef.current);
      successesRafRef.current = null;
    }

    const total = Number(headerSuccesses) || 0;
    if (total <= 0) {
      setDisplayedSuccesses(0);
      return;
    }

    setDisplayedSuccesses(0);
    const durationMs = 2000;
    successesAnimStartRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - successesAnimStartRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const value = Math.max(0, Math.min(total, Math.floor(progress * total)));
      setDisplayedSuccesses(value);
      if (value < total) {
        successesRafRef.current = requestAnimationFrame(tick);
      } else {
        successesRafRef.current = null;
      }
    };

    successesRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (successesRafRef.current != null) {
        cancelAnimationFrame(successesRafRef.current);
        successesRafRef.current = null;
      }
    };
  }, [headerSuccesses, animateSeed]);

  // Re-trigger the count-up each time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      setAnimateSeed((s) => s + 1);
    }, [headerSuccesses]),
  );

  // Trigger animation when successes change
  useEffect(() => {
    if (
      headerSuccesses !== lastHeaderSuccessesRef.current &&
      headerSuccesses > 0
    ) {
      const triggerGlovePulse = () => {
        Animated.sequence([
          Animated.timing(gloveScale, {
            toValue: 1.28,
            duration: 140,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(gloveScale, {
            toValue: 1,
            friction: 3,
            tension: 140,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(gloveScale, {
            toValue: 1.12,
            duration: 110,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(gloveScale, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      };
      triggerGlovePulse();
    }
    lastHeaderSuccessesRef.current = headerSuccesses;
  }, [headerSuccesses, gloveScale]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (caughtError) {
      console.error('Google authentication failed', caughtError);
      showErrorToast(caughtError);
    }
  };

  const handleChangeDoubles = async (value: number) => {
    const normalizedValue = Math.max(DOUBLES_MIN, Math.min(DOUBLES_MAX, value));

    if (!activePool?.id || activePool.doubles === normalizedValue) {
      return;
    }

    try {
      await updatePoolDoubles(activePool.id, normalizedValue);
      const updatedPool: FutPoolSnapshot = {
        ...activePool,
        doubles: normalizedValue,
      };
      updatePoolSnapshot(updatedPool);
    } catch (caughtError) {
      console.error('Failed to update doubles', caughtError);
      showErrorToast(caughtError);
    }
  };

  const handleChangeTriples = async (value: number) => {
    const normalizedValue = Math.max(TRIPLES_MIN, Math.min(TRIPLES_MAX, value));

    if (!activePool?.id || (activePool.triples ?? 0) === normalizedValue) {
      return;
    }

    try {
      await updatePoolTriples(activePool.id, normalizedValue);
      const updatedPool: FutPoolSnapshot = {
        ...activePool,
        triples: normalizedValue,
      };
      updatePoolSnapshot(updatedPool);
    } catch (caughtError) {
      console.error('Failed to update triples', caughtError);
      showErrorToast(caughtError);
    }
  };

  const handleChangeElige8 = async (value: boolean) => {
    if (!activePool?.id || Boolean(activePool.elige8) === value) {
      return;
    }

    try {
      await updatePoolElige8(activePool.id, value);
      const updatedPool: FutPoolSnapshot = {
        ...activePool,
        elige8: value,
      };
      updatePoolSnapshot(updatedPool);
    } catch (caughtError) {
      console.error('Failed to update elige8', caughtError);
      showErrorToast(caughtError);
    }
  };

  const refreshPoolResults = useCallback(async () => {
    if (!activePool?.id) {
      return;
    }

    try {
      const updatedPool = await checkPoolResults(activePool.id);
      updatePoolSnapshot(updatedPool);
    } catch (caughtError) {
      console.error('Failed to check official results', caughtError);
    }
  }, [activePool?.id, updatePoolSnapshot]);

  useEffect(() => {
    if (!activePool?.id) {
      return undefined;
    }

    void refreshPoolResults();
    const intervalId = setInterval(() => {
      void refreshPoolResults();
    }, BACKGROUND_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [activePool?.id, refreshPoolResults]);

  const handleChangeMatchElige8 = async (matchId: string, value: boolean) => {
    if (!activePool?.id) {
      return;
    }

    // E8 changes are allowed for any user - no validation needed

    try {
      await updateMatch(matchId, { elige8: value });
      const updatedMatches = Array.isArray(activePool.matches)
        ? activePool.matches.map((match) =>
            String(match?.id ?? match?.matchId) === matchId
              ? { ...match, elige8: value }
              : match,
          )
        : activePool.matches;

      const updatedPool: FutPoolSnapshot = {
        ...activePool,
        matches: updatedMatches,
      };
      updatePoolSnapshot(updatedPool);
    } catch (caughtError) {
      console.error('Failed to update match elige8', caughtError);
      showErrorToast(caughtError);
    }
  };

  const handleChangeMatchResults = async (
    matchId: string,
    value: OptionValue,
    rowIndex: number,
    splitIndex?: number,
  ) => {
    if (!activePool?.id) {
      return;
    }

    // Check if the current user can edit this match
    const match = activePool.matches[rowIndex];
    if (match?.userId && user?.id && match.userId !== user.id) {
      showErrorToast(
        'No tienes permisos para editar este partido. Solo puedes editar los partidos asignados a ti.',
      );
      return;
    }

    const normalizedOption = value.toUpperCase();
    const toUppercaseArray = (input: unknown): string[] =>
      input == null
        ? []
        : Array.isArray(input)
          ? input.map((value) => String(value).toUpperCase())
          : [String(input).toUpperCase()];

    const toggleSelection = (collection: string[]) =>
      collection.includes(normalizedOption)
        ? collection.filter((value) => value !== normalizedOption)
        : [...collection, normalizedOption];

    const currentMatch = activePool.matches[rowIndex];
    if (!currentMatch) {
      return;
    }

    const computePayload = (): string[] | null => {
      const baseResults = currentMatch?.results;

      if (typeof splitIndex === 'number') {
        const toSingleValue = (input: unknown): string => {
          const values = toUppercaseArray(input);
          return values[0] ?? '';
        };

        const ensureLength = (list: string[]) => {
          while (list.length <= splitIndex) {
            list.push('');
          }
          if (list.length > SPLIT_SUFFIXES.length) {
            list.length = SPLIT_SUFFIXES.length;
          }
          return list;
        };

        if (Array.isArray(baseResults)) {
          const singleValues = ensureLength(
            baseResults.map((entry) => toSingleValue(entry)).slice(),
          );

          const currentValue = singleValues[splitIndex];
          singleValues[splitIndex] =
            currentValue === normalizedOption ? '' : normalizedOption;

          return singleValues;
        }

        if (baseResults && typeof baseResults === 'object') {
          const resultObject: Record<string, unknown> = {
            ...(baseResults as Record<string, unknown>),
          };

          const singleValues = ensureLength(
            SPLIT_SUFFIXES.map((suffix, index) =>
              toSingleValue(
                resultObject[suffix] ??
                  resultObject[String(index)] ??
                  resultObject[suffix.toUpperCase()],
              ),
            ),
          );

          const currentValue = singleValues[splitIndex];
          singleValues[splitIndex] =
            currentValue === normalizedOption ? '' : normalizedOption;

          return singleValues;
        }

        const singleValues = ensureLength([]);
        singleValues[splitIndex] = normalizedOption;
        return singleValues;
      }

      return toggleSelection(toUppercaseArray(baseResults));
    };

    const payload = computePayload();
    if (!payload) {
      return;
    }

    try {
      await updateMatch(matchId, { results: payload as OptionValue[] });

      const updatedMatches = activePool.matches.map((match) =>
        String(match?.id ?? match?.matchId) === matchId
          ? { ...match, results: payload }
          : match,
      );

      const updatedPool: FutPoolSnapshot = {
        ...activePool,
        matches: updatedMatches,
      };
      updatePoolSnapshot(updatedPool);
    } catch (error) {
      console.error('Error updating match result', error);
      showErrorToast(error);
    }
  };

  const goToIndex = async (index: number) => {
    if (index < 0 || index >= totalPools) {
      return;
    }

    setActiveIndex(index);
    setPoolSelectorOpen(false);

    // Check if pool is already loaded
    const pool = virtualPools[index];
    if (pool) {
      setActivePool(pool);
    } else {
      // Load the pool if not already loaded
      const pageIndex = totalPools - 1 - index;
      const loadedPool = await loadPoolByIndex(pageIndex);
      if (loadedPool) {
        setActivePool(loadedPool);
      }
    }
  };

  const handleTogglePoolSelector = async () => {
    const nextOpen = !poolSelectorOpen;
    setPoolSelectorOpen(nextOpen);
    if (!nextOpen || totalPools === 0 || pools.length >= totalPools) {
      return;
    }

    setPoolSelectorLoading(true);
    try {
      await loadAllPools();
    } finally {
      setPoolSelectorLoading(false);
    }
  };

  useEffect(() => {
    if (
      Platform.OS === 'web' ||
      !isAuthenticated ||
      totalPools <= 1 ||
      pools.length >= totalPools ||
      poolSelectorLoading ||
      mobilePoolHistoryRequestedRef.current
    ) {
      return;
    }

    let active = true;
    mobilePoolHistoryRequestedRef.current = true;
    setPoolSelectorLoading(true);
    void loadAllPools().finally(() => {
      if (active) {
        setPoolSelectorLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [
    isAuthenticated,
    loadAllPools,
    poolSelectorLoading,
    pools.length,
    totalPools,
  ]);

  useEffect(() => {
    if (Platform.OS === 'web' || totalPools <= 1) {
      return;
    }

    mobilePoolCarouselRef.current?.scrollTo({
      x: activeIndex * mobilePoolCarouselPageWidth,
      animated: true,
    });
  }, [activeIndex, mobilePoolCarouselPageWidth, totalPools]);

  useEffect(() => {
    if (params.create === '1') {
      router.replace('/create-pool' as Href);
    }
  }, [params.create, router]);

  if (
    authLoading ||
    (isAuthenticated && teamsLoading) ||
    (isAuthenticated && !selectedTeam)
  ) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71920" />
          <Text style={styles.loadingText}>{t('status.preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <SignInScreen
          signingIn={signingIn}
          providersLoading={providersLoading}
          googleAuthEnabled={googleAuthEnabled}
          onSignIn={handleSignIn}
        />
      </SafeAreaView>
    );
  }

  const dateDMY = (() => {
    const currentPool = virtualPools[activeIndex] ?? activePool ?? null;
    if (!currentPool?.date) {
      return null;
    }
    const dateObj = new Date(currentPool.date);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();

  const selectedPool = virtualPools[activeIndex] ?? activePool ?? null;

  const formatPoolDate = (pool: FutPoolSnapshot | null | undefined) => {
    if (!pool?.date) {
      return t('pools.pool_fallback');
    }
    const dateObj = new Date(pool.date);
    if (Number.isNaN(dateObj.getTime())) {
      return t('pools.pool_fallback');
    }
    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  };

  const handleMobilePoolCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.max(
      0,
      Math.min(
        totalPools - 1,
        Math.round(
          event.nativeEvent.contentOffset.x /
            mobilePoolCarouselPageWidth,
        ),
      ),
    );
    if (nextIndex !== activeIndex) {
      void goToIndex(nextIndex);
    }
  };

  const renderPoolEditor = (pool: FutPoolSnapshot | null) => {
    if (!pool) {
      return (
        <View style={styles.webEmptyState}>
          <Ionicons name="calendar-outline" size={32} color="#D71920" />
          <Text style={styles.webEmptyStateTitle}>
            {t('pools.loading_single')}
          </Text>
        </View>
      );
    }

    return (
      <FutPoolCard
        matches={pool.matches}
        active={getPoolStatus(pool) === 'programmed'}
        elige8Enabled={Boolean(pool.elige8)}
        currentUserId={user?.id}
        onChangeMatchElige8={handleChangeMatchElige8}
        onChangeMatchResults={handleChangeMatchResults}
      />
    );
  };

  const renderPoolConfigControls = (
    pool: FutPoolSnapshot | null,
    compact = false,
  ) => {
    const canEdit = Boolean(
      activePool?.id && getPoolStatus(pool) === 'programmed',
    );
    const doubles = pool?.doubles ?? 0;
    const triples = pool?.triples ?? 0;
    const elige8 = Boolean(pool?.elige8);
    const useNativeNumberSelect = Platform.OS !== 'web';

    return (
      <View
        style={[
          styles.inlineConfigPanel,
          compact && styles.inlineConfigPanelCompact,
        ]}
      >
        <View style={styles.inlineStepper}>
          <Text style={styles.inlineConfigLabel}>{t('fields.doubles')}</Text>
          {useNativeNumberSelect ? (
            <View
              style={[
                styles.inlineNativeStepper,
                !canEdit && styles.inlineStepperButtonDisabled,
              ]}
            >
              <NativeNumberSelect
                title={t('fields.doubles')}
                value={doubles}
                min={DOUBLES_MIN}
                max={DOUBLES_MAX}
                disabled={!canEdit}
                onChange={handleChangeDoubles}
              />
              <Text style={styles.inlineStepperValue}>{doubles}</Text>
            </View>
          ) : (
            <View style={styles.inlineStepperShell}>
              <TouchableOpacity
                activeOpacity={canEdit ? 0.75 : 1}
                disabled={!canEdit || doubles <= DOUBLES_MIN}
                onPress={() => handleChangeDoubles(doubles - 1)}
                style={[
                  styles.inlineStepperButton,
                  (!canEdit || doubles <= DOUBLES_MIN) &&
                    styles.inlineStepperButtonDisabled,
                ]}
              >
                <Text style={styles.inlineStepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.inlineStepperValue}>{doubles}</Text>
              <TouchableOpacity
                activeOpacity={canEdit ? 0.75 : 1}
                disabled={!canEdit || doubles >= DOUBLES_MAX}
                onPress={() => handleChangeDoubles(doubles + 1)}
                style={[
                  styles.inlineStepperButton,
                  (!canEdit || doubles >= DOUBLES_MAX) &&
                    styles.inlineStepperButtonDisabled,
                ]}
              >
                <Text style={styles.inlineStepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inlineStepper}>
          <Text style={styles.inlineConfigLabel}>{t('fields.triples')}</Text>
          {useNativeNumberSelect ? (
            <View
              style={[
                styles.inlineNativeStepper,
                !canEdit && styles.inlineStepperButtonDisabled,
              ]}
            >
              <NativeNumberSelect
                title={t('fields.triples')}
                value={triples}
                min={TRIPLES_MIN}
                max={TRIPLES_MAX}
                disabled={!canEdit}
                onChange={handleChangeTriples}
              />
              <Text style={styles.inlineStepperValue}>{triples}</Text>
            </View>
          ) : (
            <View style={styles.inlineStepperShell}>
              <TouchableOpacity
                activeOpacity={canEdit ? 0.75 : 1}
                disabled={!canEdit || triples <= TRIPLES_MIN}
                onPress={() => handleChangeTriples(triples - 1)}
                style={[
                  styles.inlineStepperButton,
                  (!canEdit || triples <= TRIPLES_MIN) &&
                    styles.inlineStepperButtonDisabled,
                ]}
              >
                <Text style={styles.inlineStepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.inlineStepperValue}>{triples}</Text>
              <TouchableOpacity
                activeOpacity={canEdit ? 0.75 : 1}
                disabled={!canEdit || triples >= TRIPLES_MAX}
                onPress={() => handleChangeTriples(triples + 1)}
                style={[
                  styles.inlineStepperButton,
                  (!canEdit || triples >= TRIPLES_MAX) &&
                    styles.inlineStepperButtonDisabled,
                ]}
              >
                <Text style={styles.inlineStepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <E8Toggle
          value={elige8}
          disabled={!canEdit}
          onValueChange={handleChangeElige8}
        />
      </View>
    );
  };

  const renderPoolStatusPill = (
    pool: FutPoolSnapshot | null | undefined,
    compact = false,
    centered = false,
  ) => {
    const status = getPoolStatus(pool);
    const isProgrammed = status === 'programmed';
    const isActivePool = status === 'active';
    const isClosed = status === 'closed';
    const iconColor = isProgrammed
      ? '#A96A00'
      : isActivePool
        ? '#157F3B'
        : '#FFFFFF';

    return (
      <View
        style={[
          styles.webStatusPill,
          isProgrammed
            ? styles.webStatusPillProgrammed
            : isActivePool
              ? styles.webStatusPillActive
              : styles.webStatusPillClosed,
          compact && styles.webStatusPillCompact,
          centered && styles.poolDateStatusPill,
        ]}
      >
        <Ionicons
          name={
            isProgrammed
              ? 'time-outline'
              : isClosed
                ? 'lock-closed-outline'
                : 'lock-open-outline'
          }
          size={compact ? 12 : 13}
          color={iconColor}
        />
        <Text
          style={[
            styles.webStatusPillText,
            isProgrammed
              ? styles.webStatusPillTextProgrammed
              : isActivePool
                ? styles.webStatusPillTextActive
                : styles.webStatusPillTextClosed,
          ]}
        >
          {t(`status.${status}`)}
        </Text>
      </View>
    );
  };

  const renderNativePoolConfigButton = (pool: FutPoolSnapshot | null) => {
    if (Platform.OS === 'web' || !pool) {
      return null;
    }

    const canEdit = Boolean(
      activePool?.id && getPoolStatus(pool) === 'programmed',
    );

    return (
      <NativePoolConfigButton
        disabled={!canEdit}
        doneTitle={t('actions.done')}
        doubles={pool.doubles ?? 0}
        doublesTitle={t('fields.doubles')}
        elige8={Boolean(pool.elige8)}
        e8Title="E8"
        maxDoubles={DOUBLES_MAX}
        maxTriples={TRIPLES_MAX}
        minDoubles={DOUBLES_MIN}
        minTriples={TRIPLES_MIN}
        style={styles.nativePoolConfigButton}
        title={t('pools.config')}
        triples={pool.triples ?? 0}
        triplesTitle={t('fields.triples')}
        onChange={(value) => {
          void handleChangeDoubles(value.doubles);
          void handleChangeTriples(value.triples);
          void handleChangeElige8(value.elige8);
        }}
      />
    );
  };

  const renderWebWorkspace = () => (
    <ScrollView
      style={styles.webScroll}
      contentContainerStyle={styles.webWorkspace}
    >
      {poolsLoading ? (
        <View style={styles.webLoadingPanel}>
          <ActivityIndicator size="large" color="#D71920" />
          <Text style={styles.loadingText}>{t('pools.loading')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.webWorkspaceHero}>
            <View style={styles.webHeroActions}>
            </View>
          </View>

          <View style={styles.webMainPanel}>
            <View style={styles.webPoolSelector}>
              <TouchableOpacity
                onPress={handleTogglePoolSelector}
                activeOpacity={0.78}
                style={styles.webPoolSelectorButton}
              >
                <Ionicons name="calendar-outline" size={18} color="#D71920" />
                <View style={styles.webPoolSelectorCopy}>
                  <Text style={styles.webPoolSelectorLabel}>
                    {t('pools.pool_selector_label')}
                  </Text>
                  <Text style={styles.webPoolSelectorValue}>
                    {formatPoolDate(selectedPool)}
                  </Text>
                </View>
                {poolSelectorLoading ? (
                  <ActivityIndicator size="small" color="#D71920" />
                ) : (
                  <Ionicons
                    name={poolSelectorOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#5F6B7A"
                  />
                )}
              </TouchableOpacity>

              {poolSelectorOpen ? (
                <ScrollView style={styles.webPoolSelectorMenu}>
                  {poolSelectorItems.map(({ pool, index }) => {
                    const activeHistoryItem = index === activeIndex;
                    const poolOutcomeStats = getPoolOutcomeStats(pool);
                    return (
                      <TouchableOpacity
                        key={pool.id}
                        onPress={() => goToIndex(index)}
                        activeOpacity={0.72}
                        style={[
                          styles.webPoolSelectorItem,
                          activeHistoryItem &&
                            styles.webPoolSelectorItemActive,
                        ]}
                      >
                        <View style={styles.webPoolSelectorItemMain}>
                          <Text
                            style={[
                              styles.webPoolSelectorItemDate,
                              activeHistoryItem &&
                                styles.webPoolSelectorItemDateActive,
                            ]}
                          >
                            {formatPoolDate(pool)}
                          </Text>
                          {renderPoolStatusPill(pool, true)}
                        </View>
                        <View style={styles.webPoolSelectorScore}>
                          <Ionicons name="trophy" size={13} color="#157F3B" />
                          <Text style={styles.webPoolSelectorScoreText}>
                            {poolOutcomeStats.successes}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>

              <View style={styles.webPanelHeader}>
                <View style={styles.webPoolHeaderMain}>
                  <Text style={styles.webPanelTitle}>
                    {formatPoolDate(selectedPool)}
                  </Text>
                  {renderPoolStatusPill(selectedPool, true)}
                </View>
              </View>
              <View style={styles.webInlineConfigBar}>
                {renderPoolConfigControls(selectedPool)}
              </View>
              <View style={styles.webPoolCardFrame}>
                {renderPoolEditor(selectedPool)}
              </View>
            </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </>
      )}
    </ScrollView>
  );

  const mainContent = (
    <View style={styles.container}>
      {poolsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71920" />
          <Text style={styles.loadingText}>{t('pools.loading')}</Text>
        </View>
      ) : (
        <>
          {/* Top controls: date and status */}
          {activePool && (
            <View style={styles.poolControls}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {headerSuccesses > 0 && (
                  <Animated.View
                    style={[
                      styles.poolSuccessesGloveLarge,
                      { transform: [{ scale: gloveScale }] },
                      { marginRight: 8 },
                    ]}
                  >
                    <Ionicons
                      name="trophy"
                      size={14}
                      color="#FFFFFF"
                      style={styles.poolSuccessesIcon}
                    />
                    <Text style={styles.poolSuccessesGloveTextLarge}>
                      {displayedSuccesses}
                    </Text>
                  </Animated.View>
                )}
              </View>
              {dateDMY && (
                <View style={styles.poolDateContainer}>
                  <Text style={styles.poolDate}>{dateDMY}</Text>
                  {renderPoolStatusPill(selectedPool, true, true)}
                </View>
              )}
              <View style={styles.rightControls} />
            </View>
          )}
          {totalPools > 1 && (
            <ScrollView
              ref={mobilePoolCarouselRef}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMobilePoolCarouselScroll}
              style={styles.mobilePoolEditorCarousel}
            >
              {virtualPools.map((pool, index) => (
                <View
                  key={pool?.id ?? `pool-page-${index}`}
                  style={[
                    styles.mobilePoolEditorPage,
                    { width: mobilePoolCarouselPageWidth },
                  ]}
                >
                  {renderPoolEditor(pool)}
                </View>
              ))}
            </ScrollView>
          )}
          {totalPools <= 1 ? (
            <View style={styles.mobilePoolFrame}>
              {renderPoolEditor(selectedPool)}
            </View>
          ) : null}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {Platform.OS === 'web' ? renderWebWorkspace() : mainContent}
      {Platform.OS !== 'web' && activePool ? (
        <View style={styles.nativePoolConfigButtonSlot}>
          {renderNativePoolConfigButton(selectedPool)}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
