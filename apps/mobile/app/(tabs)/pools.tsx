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
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PoolDetailsModal, {
  MatchFormEntry,
  MatchUserOption,
  PoolDetailsField,
  PoolDetailsFormValues,
} from '../components/pool/PoolDetailsModal';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import Carousel from 'react-native-reanimated-carousel';
import FutPoolCard from '../components/futPoolCard/FutPoolCard';
import useAuth from '../hooks/useAuth';
import useFutPool from '../hooks/useFutPool';
import styles from '../index.styles';
import SignInScreen from '../components/SignInScreen';
import {
  createPool,
  updatePoolDetails,
  updatePoolDoubles,
  updatePoolElige8,
} from '../services/futPool.service';
import { updateMatch } from '../services/futPoolMatch.service';
import realtime from '../services/realtime.service';
import FutPoolSnapshot, { OptionValue, SPLIT_SUFFIXES } from '../types/futPool';
import showErrorToast, { showToast } from '../utils/toast';

const DOUBLES_MIN = 0;
const DOUBLES_MAX = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CAROUSEL_HEIGHT = Math.max(480, SCREEN_HEIGHT - 160);
const DEFAULT_MATCH_USER_COLOR = '#4A1A7A';
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
  const { t } = useTranslation();
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

  const {
    loading: poolsLoading,
    error,
    pools,
    activePool,
    totalPools,
    updatePoolSnapshot,
    setActivePool,
    loadPoolByIndex,
  } = useFutPool({ enabled: isAuthenticated });
  const [activeIndex, setActiveIndex] = useState(0);
  const [editVisible, setEditVisible] = useState(false);
  const [creationVisible, setCreationVisible] = useState(false);
  const [updatingPool, setUpdatingPool] = useState(false);
  const [creatingPool, setCreatingPool] = useState(false);
  const [finalizingPool, setFinalizingPool] = useState(false);

  const carouselRef = useRef<ICarouselInstance | null>(null);

  // Animation refs (must be declared before any early returns)
  const gloveScale = useRef(new Animated.Value(1)).current;
  const lastHeaderSuccessesRef = useRef<number>(0);

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
      requestAnimationFrame(() => {
        // @ts-ignore: type from library accepts object with index
        carouselRef.current?.scrollTo?.({
          index: latestIndex,
          animated: false,
        });
      });
      return;
    }

    if (activePool) {
      const resolvedIndex = virtualPools.findIndex(
        (pool) => pool?.id === activePool.id,
      );
      if (resolvedIndex >= 0 && resolvedIndex !== activeIndex) {
        setActiveIndex(resolvedIndex);
        requestAnimationFrame(() => {
          // @ts-ignore: type from library accepts object with index
          carouselRef.current?.scrollTo?.({
            index: resolvedIndex,
            animated: false,
          });
        });
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

  // Calculate header successes for the glove animation
  // Rule: count successes among the first 14 matches; include the full15 match ONLY if the first 14 are all success
  const headerSuccesses = useMemo(() => {
    const list = Array.isArray(activePool?.matches) ? activePool!.matches : [];
    if (list.length === 0) {
      return typeof activePool?.successes === 'number'
        ? activePool.successes
        : 0;
    }

    const nonFull15 = list.filter((m: any) => !m?.full15);
    const full15Match = list.find((m: any) => m?.full15);

    const baseSuccesses = nonFull15.reduce(
      (acc: number, m: any) => acc + (m?.success === true ? 1 : 0),
      0,
    );
    const includeFull15 = baseSuccesses === 14 && full15Match?.success === true;
    return includeFull15 ? baseSuccesses + 1 : baseSuccesses;
  }, [activePool?.matches, activePool?.successes]);

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
            useNativeDriver: true,
          }),
          Animated.spring(gloveScale, {
            toValue: 1,
            friction: 3,
            tension: 140,
            useNativeDriver: true,
          }),
          Animated.timing(gloveScale, {
            toValue: 1.12,
            duration: 110,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(gloveScale, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
        ]).start();
      };
      triggerGlovePulse();
    }
    lastHeaderSuccessesRef.current = headerSuccesses;
  }, [headerSuccesses, gloveScale]);

  // Handle lazy loading when navigating to a new pool
  const handleSnapToItem = useCallback(
    async (index: number) => {
      if (index !== activeIndex) {
        setActiveIndex(index);

        // Check if the pool at this index is already loaded
        const pool = virtualPools[index];

        if (pool) {
          // Pool is already loaded
          setActivePool(pool);
        } else {
          // Pool is not loaded yet, fetch it
          // Convert virtual index to page index (0-based for loadPoolByIndex)
          // virtualIndex 0 = oldest = page totalPools (1-indexed) = index totalPools-1 (0-indexed)
          // virtualIndex totalPools-1 = latest = page 1 (1-indexed) = index 0 (0-indexed)
          const pageIndex = totalPools - 1 - index;
          const loadedPool = await loadPoolByIndex(pageIndex);

          if (loadedPool) {
            setActivePool(loadedPool);
          }
        }
      }
    },
    [activeIndex, virtualPools, totalPools, loadPoolByIndex, setActivePool],
  );

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

  const handleChangeElige8 = async (value: boolean) => {
    if (!activePool?.id) {
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

  const handleChangeMatchSuccess = async (matchId: string, value: boolean) => {
    if (!activePool?.id) {
      return;
    }

    // Success changes are allowed for any user - no validation needed

    try {
      const updatedMatch = await updateMatch(matchId, { success: value });

      if (!Array.isArray(activePool.matches)) {
        return;
      }

      const updatedMatches = activePool.matches.map((match) =>
        String(match?.id ?? match?.matchId) === matchId
          ? { ...match, success: value }
          : match,
      );

      const updatedPool: FutPoolSnapshot = {
        ...activePool,
        matches: updatedMatches,
        successes: updatedMatch.futPool.successes,
      };
      updatePoolSnapshot(updatedPool);
    } catch (caughtError) {
      console.error('Error updating match success', caughtError);
      showErrorToast(caughtError);
    }
  };

  const handleChangeMatchElige8 = async (matchId: string, value: boolean) => {
    if (!activePool?.id) {
      return;
    }

    // Elige8 changes are allowed for any user - no validation needed

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

  const goToIndex = async (index: number, animated = Platform.OS !== 'web') => {
    if (index < 0 || index >= totalPools) {
      return;
    }

    setActiveIndex(index);

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
    // @ts-ignore: carousel instance scrollTo accepts object with index
    carouselRef.current?.scrollTo?.({ index, animated });
  };

  const creationInitialValues = useMemo<PoolDetailsFormValues>(
    () => ({
      description: '',
      doubles: 0,
      triples: 0,
      elige8: false,
      active: true,
      date: normalizeDate(new Date()),
      earning: 0,
    }),
    [],
  );

  const buildEmptyMatchEntries = useCallback(
    (): MatchFormEntry[] =>
      Array.from({ length: 15 }, (_, index) => ({
        order: index + 1,
        homeTeam: '',
        awayTeam: '',
        userId: null,
      })),
    [],
  );

  const creationMatchInitialValues = useMemo<MatchFormEntry[]>(
    () => buildEmptyMatchEntries(),
    [buildEmptyMatchEntries],
  );

  const buildMatchesDescription = useCallback(
    (pool: FutPoolSnapshot | null | undefined) => {
      if (!pool?.matches || !Array.isArray(pool.matches)) {
        return '';
      }

      return pool.matches
        .map((match: any, index: number) => {
          const order =
            typeof match?.poolOrder === 'number' ? match.poolOrder : index + 1;
          const home = match?.homeTeam
            ? String(match.homeTeam)
            : 'Equipo local';
          const away = match?.awayTeam
            ? String(match.awayTeam)
            : 'Equipo visitante';
          return `${order}. ${home} - ${away}`;
        })
        .join('\n');
    },
    [],
  );

  const editInitialValues = useMemo<PoolDetailsFormValues | null>(() => {
    if (!activePool) {
      return null;
    }

    const baseDate = activePool.date
      ? normalizeDate(activePool.date)
      : normalizeDate(new Date());
    return {
      description: buildMatchesDescription(activePool),
      doubles: typeof activePool.doubles === 'number' ? activePool.doubles : 0,
      triples: typeof activePool.triples === 'number' ? activePool.triples : 0,
      elige8: Boolean(activePool.elige8),
      active: Boolean(activePool.active),
      date: baseDate,
      earning:
        typeof activePool.earning === 'number'
          ? activePool.earning
          : Number((activePool as Record<string, unknown>).earning ?? 0) || 0,
    };
  }, [activePool, buildMatchesDescription]);

  const editMatchInitialValues = useMemo<MatchFormEntry[]>(() => {
    if (!Array.isArray(activePool?.matches)) {
      return buildEmptyMatchEntries();
    }
    const base = buildEmptyMatchEntries();
    const usersMap = new Map<string, MatchUserOption>();

    const sortedMatches = [...activePool!.matches].sort((a: any, b: any) => {
      const aOrder = Number(a?.poolOrder ?? a?.order ?? 0);
      const bOrder = Number(b?.poolOrder ?? b?.order ?? 0);
      return aOrder - bOrder;
    });

    sortedMatches.forEach((match: any, index) => {
      const rawOrder = Number(match?.poolOrder ?? match?.order ?? index + 1);
      const order = Number.isFinite(rawOrder)
        ? Math.min(Math.max(rawOrder, 1), 15)
        : index + 1;
      const entry = base[order - 1];
      entry.id = match?.id;
      entry.homeTeam = String(match?.homeTeam ?? '');
      entry.awayTeam = String(match?.awayTeam ?? '');
      const userId = match?.user?.id ?? match?.userId ?? null;
      entry.userId = userId ? String(userId) : null;
      if (entry.userId) {
        const option = usersMap.get(entry.userId);
        const fallbackName =
          match?.user?.name ??
          match?.user?.fullName ??
          match?.user?.displayName;
        entry.userName = option?.name ?? fallbackName ?? entry.userName;
      } else {
        entry.userName = undefined;
      }
    });

    return base;
  }, [activePool?.matches, buildEmptyMatchEntries]);

  const handleOpenCreation = useCallback(() => {
    setCreationVisible(true);
  }, []);

  const handleCloseCreation = useCallback(() => {
    setCreationVisible(false);
  }, []);

  const handleCreatePool = useCallback(
    async (values: PoolDetailsFormValues) => {
      try {
        setCreatingPool(true);

        // Transform matches for the API
        const matches =
          values.matches
            ?.filter((match) => match.homeTeam.trim() || match.awayTeam.trim())
            .map((match) => ({
              order: match.order,
              homeTeam: match.homeTeam.trim(),
              awayTeam: match.awayTeam.trim(),
              userId: match.userId || undefined,
            })) || [];

        await createPool({
          doubles: values.doubles,
          triples: values.triples,
          elige8: values.elige8,
          active: values.active,
          date: `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, '0')}-${String(values.date.getDate()).padStart(2, '0')}`,
          earning: values.earning,
          matches: matches,
        });
        setCreationVisible(false);
        showToast('Quiniela creada', 'success');
      } catch (error) {
        console.error('Failed to create pool', error);
        showErrorToast(error);
      } finally {
        setCreatingPool(false);
      }
    },
    [showErrorToast, showToast],
  );

  const handleCloseEdit = useCallback(() => {
    if (!updatingPool) {
      setEditVisible(false);
    }
  }, [updatingPool]);

  const handleEditFieldChange = useCallback(
    async (field: PoolDetailsField, value: any) => {
      if (!activePool?.id) {
        return;
      }

      const payload: Record<string, unknown> = {};

      switch (field) {
        case 'doubles': {
          const next = Number(value);
          if (!Number.isFinite(next) || next === activePool.doubles) {
            return;
          }
          payload.doubles = next;
          break;
        }
        case 'triples': {
          const next = Number(value);
          if (!Number.isFinite(next) || next === (activePool.triples ?? 0)) {
            return;
          }
          payload.triples = next;
          break;
        }
        case 'elige8': {
          const next = Boolean(value);
          if (next === Boolean(activePool.elige8)) {
            return;
          }
          payload.elige8 = next;
          break;
        }
        case 'active': {
          const next = Boolean(value);
          if (next === Boolean(activePool.active)) {
            return;
          }
          payload.active = next;
          break;
        }
        case 'date': {
          if (!(value instanceof Date)) {
            return;
          }
          const currentDate = normalizeDate(activePool.date);
          const nextDate = normalizeDate(value);
          if (currentDate.getTime() === nextDate.getTime()) {
            return;
          }
          payload.date = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
          break;
        }
        case 'description': {
          const next = typeof value === 'string' ? value : String(value ?? '');
          const currentDescription = (activePool as Record<string, unknown>)
            ?.description;
          if (
            typeof currentDescription === 'string' &&
            currentDescription === next
          ) {
            return;
          }
          payload.description = next;
          break;
        }
        case 'earning': {
          const currentValue =
            typeof activePool.earning === 'number'
              ? activePool.earning
              : Number((activePool as Record<string, unknown>).earning ?? 0) ||
                0;
          const next = Number(value);
          if (!Number.isFinite(next) || next === currentValue) {
            return;
          }
          payload.earning = next;
          break;
        }
        default:
          return;
      }

      setUpdatingPool(true);
      try {
        const response = await updatePoolDetails(activePool.id, payload);

        const mergedPool: FutPoolSnapshot = {
          ...activePool,
          ...(payload.doubles !== undefined
            ? { doubles: payload.doubles as number }
            : {}),
          ...(payload.triples !== undefined
            ? { triples: payload.triples as number }
            : {}),
          ...(payload.elige8 !== undefined
            ? { elige8: payload.elige8 as boolean }
            : {}),
          ...(payload.active !== undefined
            ? { active: payload.active as boolean }
            : {}),
          ...(payload.date !== undefined
            ? { date: payload.date as string }
            : {}),
          ...(payload.earning !== undefined
            ? { earning: payload.earning as number }
            : {}),
          ...(payload.description !== undefined
            ? { description: payload.description as string }
            : {}),
        };

        if (response && typeof response === 'object') {
          const updated = response as Record<string, unknown>;
          if (typeof updated.doubles === 'number') {
            mergedPool.doubles = updated.doubles;
          }
          if (typeof updated.triples === 'number') {
            mergedPool.triples = updated.triples;
          }
          if (typeof updated.elige8 === 'boolean') {
            mergedPool.elige8 = updated.elige8;
          }
          if (typeof updated.active === 'boolean') {
            mergedPool.active = updated.active;
          }
          if (updated.date) {
            mergedPool.date = updated.date as string;
          }
          if (typeof updated.earning === 'number') {
            mergedPool.earning = updated.earning;
          }
          if (typeof updated.description === 'string') {
            mergedPool.description = updated.description;
          }
        }

        updatePoolSnapshot(mergedPool);
        setActivePool(mergedPool);
      } catch (error) {
        console.error('Failed to update pool field', error);
        showErrorToast(error);
        if (activePool) {
          setActivePool({ ...activePool });
        }
      } finally {
        setUpdatingPool(false);
      }
    },
    [activePool, setActivePool, showErrorToast, updatePoolSnapshot],
  );

  const handleSubmitEdit = useCallback(
    async (values: PoolDetailsFormValues) => {
      if (!activePool?.id) {
        return;
      }

      setUpdatingPool(true);
      try {
        const payload = {
          description: values.description,
          doubles: values.doubles,
          triples: values.triples,
          elige8: values.elige8,
          active: values.active,
          date: values.date.toISOString(),
          earning: values.earning,
        };

        await updatePoolDetails(activePool.id, payload);

        const updatedPool: FutPoolSnapshot = {
          ...activePool,
          doubles: values.doubles,
          triples: values.triples,
          elige8: values.elige8,
          active: values.active,
          date: values.date.toISOString(),
          description: values.description,
          earning: values.earning,
        };

        updatePoolSnapshot(updatedPool);
        setActivePool(updatedPool);
        setEditVisible(false);
        showToast('Quiniela actualizada', 'success');
      } catch (error) {
        console.error('Failed to update pool details', error);
        showErrorToast(error);
      } finally {
        setUpdatingPool(false);
      }
    },
    [activePool, setActivePool, showErrorToast, showToast, updatePoolSnapshot],
  );

  const handleFinalizePool = useCallback(
    async (earningValue: number) => {
      if (!activePool?.id) {
        return;
      }

      setFinalizingPool(true);
      try {
        const payload = {
          earning: earningValue,
          active: false,
        };

        await updatePoolDetails(activePool.id, payload);

        const updatedPool: FutPoolSnapshot = {
          ...activePool,
          earning: earningValue,
          active: false,
        };

        updatePoolSnapshot(updatedPool);
        setActivePool(updatedPool);
        setEditVisible(false);
        showToast('Quiniela finalizada', 'success');
      } catch (error) {
        console.error('Failed to finalize pool', error);
        showErrorToast(error);
      } finally {
        setFinalizingPool(false);
      }
    },
    [activePool, setActivePool, showErrorToast, showToast, updatePoolSnapshot],
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d6cdf" />
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

  const renderFutPoolCard = (item: FutPoolSnapshot | null) => {
    if (!item) {
      // Pool is not loaded yet, show loading indicator
      return (
        <View style={styles.carouselItem}>
          <View style={styles.carouselInner}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d6cdf" />
              <Text style={styles.loadingText}>
                {t('pools.loading_single')}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    const successesCount = item.successes;

    return (
      <View style={styles.carouselItem}>
        <View style={styles.carouselInner}>
          <FutPoolCard
            matches={item.matches}
            active={item.active}
            doubles={item.doubles}
            elige8={Boolean(item.elige8)}
            successes={successesCount}
            currentUserId={user?.id}
            onChangeDoubles={handleChangeDoubles}
            onChangeElige8={handleChangeElige8}
            onChangeMatchSuccess={handleChangeMatchSuccess}
            onChangeMatchElige8={handleChangeMatchElige8}
            onChangeMatchResults={handleChangeMatchResults}
          />
        </View>
      </View>
    );
  };

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

  const mainContent = (
    <View style={styles.container}>
      {poolsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d6cdf" />
          <Text style={styles.loadingText}>{t('pools.loading')}</Text>
        </View>
      ) : (
        <>
          {/* Top controls: date, successes badge, and config button */}
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
                      color="#ffffff"
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
                </View>
              )}
              <View style={styles.rightControls}>
                <TouchableOpacity
                  onPress={() => setEditVisible(true)}
                  activeOpacity={0.8}
                  style={{ marginLeft: 8, padding: 8 }}
                  accessibilityLabel={t('pools.settings_accessibility')}
                >
                  <Ionicons name="settings-outline" size={30} color="#4A1A7A" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          {totalPools > 1 && (
            <View style={styles.paginationDots}>
              {virtualPools.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => goToIndex(index)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.paginationDot,
                      index === activeIndex && styles.paginationDotActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Carousel
            ref={carouselRef}
            width={SCREEN_WIDTH}
            height={CAROUSEL_HEIGHT}
            data={virtualPools}
            loop={false}
            defaultIndex={Math.max(totalPools - 1, 0)}
            onSnapToItem={handleSnapToItem}
            renderItem={({ item }) => renderFutPoolCard(item)}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {Platform.OS === 'web' ? (
        <ScrollView
          style={styles.webScroll}
          contentContainerStyle={styles.webScrollContent}
        >
          {mainContent}
        </ScrollView>
      ) : (
        mainContent
      )}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={handleOpenCreation}
        activeOpacity={0.85}
        accessibilityLabel={t('pools.create_accessibility')}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
      <PoolDetailsModal
        visible={creationVisible}
        title={t('pools.create_title')}
        confirmLabel={t('actions.create')}
        initialValues={creationInitialValues}
        submitting={creatingPool}
        mode="create"
        onClose={handleCloseCreation}
        onSubmit={handleCreatePool}
        matchInitialValues={creationMatchInitialValues}
      />
      {activePool && editInitialValues && (
        <PoolDetailsModal
          visible={editVisible}
          title={t('pools.edit_title')}
          confirmLabel={t('actions.save')}
          initialValues={editInitialValues}
          submitting={updatingPool}
          finalizing={finalizingPool}
          mode="edit"
          onClose={handleCloseEdit}
          onSubmit={handleSubmitEdit}
          onFinalize={handleFinalizePool}
          matchInitialValues={editMatchInitialValues}
          onFieldChange={handleEditFieldChange}
        />
      )}
    </SafeAreaView>
  );
}
