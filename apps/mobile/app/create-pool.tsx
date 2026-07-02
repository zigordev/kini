import { Stack, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import PoolDetailsModal, {
  MatchFormEntry,
  PoolDetailsFormHandle,
  PoolDetailsFormValues,
} from './components/pool/PoolDetailsModal';
import { useTeams } from './contexts/TeamContext';
import { useTheme } from './contexts/ThemeContext';
import { createStyles } from './index.styles';
import { createPool } from './services/futPool.service';
import { palette } from './theme/design';
import showErrorToast, { showToast } from './utils/toast';
import {
  DEFAULT_POOL_DEFAULTS,
  PoolDefaults,
  readPoolDefaults,
} from '../src/utils/poolDefaults';

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

const buildEmptyMatchEntries = (): MatchFormEntry[] =>
  Array.from({ length: 15 }, (_, index) => ({
    order: index + 1,
    homeTeam: '',
    awayTeam: '',
    userId: null,
  }));

export default function CreatePoolScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const { selectedTeam, loading: teamsLoading } = useTeams();
  const formRef = useRef<PoolDetailsFormHandle>(null);
  const [creatingPool, setCreatingPool] = useState(false);
  const [poolDefaults, setPoolDefaults] = useState<PoolDefaults>(
    DEFAULT_POOL_DEFAULTS,
  );

  useEffect(() => {
    let active = true;
    void readPoolDefaults(selectedTeam?.id).then((nextDefaults) => {
      if (active) {
        setPoolDefaults(nextDefaults);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedTeam?.id]);

  useEffect(() => {
    if (!teamsLoading && !selectedTeam) {
      router.replace('/teams' as Href);
    }
  }, [router, selectedTeam, teamsLoading]);

  const creationInitialValues = useMemo<PoolDetailsFormValues>(
    () => ({
      name: '',
      description: '',
      doubles: poolDefaults.doubles,
      triples: poolDefaults.triples,
      elige8: poolDefaults.elige8,
      active: true,
      date: normalizeDate(new Date()),
      earning: 0,
    }),
    [poolDefaults],
  );

  const creationMatchInitialValues = useMemo<MatchFormEntry[]>(
    () => buildEmptyMatchEntries(),
    [],
  );

  const handleClose = useCallback(() => {
    router.replace('/pools' as Href);
  }, [router]);

  const handleCreatePool = useCallback(
    async (values: PoolDetailsFormValues) => {
      try {
        setCreatingPool(true);

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
          name: values.name,
          teamId: selectedTeam?.id,
          doubles: values.doubles,
          triples: values.triples,
          elige8: values.elige8,
          active: true,
          date: `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, '0')}-${String(values.date.getDate()).padStart(2, '0')}`,
          earning: values.earning,
          matches,
        });
        showToast(t('pools.created'), 'success');
        router.replace('/pools' as Href);
      } catch (error) {
        console.error('Failed to create pool', error);
        showErrorToast(error);
      } finally {
        setCreatingPool(false);
      }
    },
    [router, selectedTeam?.id, t],
  );

  const headerTint = isDark ? palette.darkInk : palette.ink;

  if (teamsLoading || !selectedTeam) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            title: t('pools.create_title'),
            headerShown: true,
            presentation: 'modal',
            headerTintColor: headerTint,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>{t('status.preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('pools.create_title'),
          headerShown: true,
          presentation: 'modal',
          headerTintColor: headerTint,
          headerStyle: {
            backgroundColor: isDark ? palette.darkSurface : palette.surface,
          },
          headerLeft: () => (
            <Pressable onPress={handleClose} disabled={creatingPool}>
              <Text
                style={[
                  styles.nativeHeaderAction,
                  creatingPool && styles.nativeHeaderActionDisabled,
                ]}
              >
                {t('actions.cancel')}
              </Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => formRef.current?.submit()}
              disabled={creatingPool}
            >
              <Text
                style={[
                  styles.nativeHeaderAction,
                  styles.nativeHeaderActionPrimary,
                  creatingPool && styles.nativeHeaderActionDisabled,
                ]}
              >
                {t('actions.create')}
              </Text>
            </Pressable>
          ),
        }}
      />
      <PoolDetailsModal
        ref={formRef}
        visible
        initialValues={creationInitialValues}
        submitting={creatingPool}
        onSubmit={handleCreatePool}
        matchInitialValues={creationMatchInitialValues}
      />
    </SafeAreaView>
  );
}
