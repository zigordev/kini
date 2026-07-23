import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import E8Badge from '../E8Badge';
import E8Toggle from '../E8Toggle';
import NativeOptionStack from '../NativeOptionStack';
import { useTheme } from '../../contexts/ThemeContext';
import { palette } from '../../theme/design';
import {
  EXTENDED_OPTIONS,
  OptionValue,
  REGULAR_OPTIONS,
  SPLIT_SUFFIXES,
} from '../../types/futPool';
import { createStyles } from './FutPoolCard.styles';

export type FutPoolCardProps = {
  matches: any[];
  active: boolean;
  elige8Enabled?: boolean;
  currentUserId?: string;
  onChangeMatchElige8: (
    matchId: string,
    value: boolean,
  ) => Promise<void> | void;
  onChangeMatchResults: (
    matchId: string,
    value: OptionValue,
    rowIndex: number,
    splitIndex?: number,
  ) => Promise<void> | void;
};

const getSplitSelections = (
  results: unknown,
  baseRowKey: string,
  splitIndex: number,
) => {
  const suffix = SPLIT_SUFFIXES[splitIndex] ?? String(splitIndex);
  const rawSplitResults = Array.isArray(results)
    ? results[splitIndex]
    : results && typeof results === 'object'
      ? ((results as Record<string, unknown>)[suffix] ??
        (results as Record<string, unknown>)[String(splitIndex)] ??
        (results as Record<string, unknown>)[suffix.toUpperCase()] ??
        (results as Record<string, unknown>)[`${baseRowKey}-${suffix}`])
      : undefined;

  return Array.isArray(rawSplitResults)
    ? rawSplitResults.map((value) => String(value).toUpperCase())
    : rawSplitResults != null
      ? [String(rawSplitResults).toUpperCase()]
      : [];
};

const getOutcomeName = (
  success: unknown,
): 'failure' | 'neutral' | 'success' => {
  if (success === true) {
    return 'success';
  }

  if (success === false) {
    return 'failure';
  }

  return 'neutral';
};

const FutPoolCard = ({
  matches = [],
  active = false,
  elige8Enabled = false,
  currentUserId,
  onChangeMatchElige8,
  onChangeMatchResults,
}: FutPoolCardProps) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  void currentUserId;

  return (
    <View style={styles.card}>
      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={styles.cardScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={[styles.table, !active && styles.tableDisabled]}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderTitle}>{t('pools.matches')}</Text>
            {elige8Enabled ? (
              <View style={styles.e8HeaderColumn}>
                <E8Badge />
              </View>
            ) : null}
          </View>
          {matches.map((row, index) => {
            const baseRowKey = String(row?.id ?? index + 1);
            const results = row?.results ?? [];
            const success = row?.success;
            const matchId = String(row?.id ?? index + 1);
            const isMatchInElige8 = Boolean(row?.elige8);
            const isFull15 =
              Boolean(row?.full15) ||
              Number(row?.poolOrder ?? row?.order) === 15 ||
              index === 14;
            const isLastRow = index === matches.length - 1;

            if (!isFull15) {
              return (
                <Pressable
                  key={row?.id ?? index}
                  style={styles.row}
                >
                  <View style={styles.matchNumberBadge}>
                    <Text style={styles.matchNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.matchInfoContainer}>
                    <View style={styles.teamLines}>
                      <Text style={styles.rowText} numberOfLines={1}>
                        {row?.homeTeam}
                      </Text>
                      <Text style={styles.rowText} numberOfLines={1}>
                        {row?.awayTeam}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Ionicons
                        name="person-outline"
                        size={13}
                        color={row.user ? palette.inkMuted : palette.warning}
                      />
                      <Text
                        style={[
                          styles.assigneeText,
                          !row.user && styles.assigneeTextUnassigned,
                        ]}
                      >
                        {row.user?.name || 'Sin asignar'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionsContainer}>
                    <View
                      style={[
                        styles.resultButtonsContainer,
                        elige8Enabled && styles.resultButtonsWithE8Column,
                      ]}
                    >
                      <NativeOptionStack
                        disabled={!active}
                        options={[...REGULAR_OPTIONS]}
                        outcome={getOutcomeName(success)}
                        selectedOptions={
                          Array.isArray(results)
                            ? results.map((value) => String(value))
                            : []
                        }
                        onSelect={(option) =>
                          onChangeMatchResults(
                            matchId,
                            option as OptionValue,
                            index,
                          )
                        }
                      />
                    </View>
                    {elige8Enabled ? (
                      <View style={styles.e8Column}>
                        <E8Toggle
                          value={isMatchInElige8}
                          disabled={!active}
                          showBadge={false}
                          style={styles.elige8SwitchGroup}
                          onValueChange={(value) =>
                            onChangeMatchElige8(matchId, value)
                          }
                        />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={row?.id ?? index}
                style={[styles.full15Row, isLastRow && styles.lastRow]}
              >
                <View style={styles.matchNumberBadge}>
                  <Text style={styles.matchNumberText}>
                    15
                  </Text>
                </View>

                <View style={styles.full15ScorePanel}>
                  {[
                    {
                      label: String(row?.homeTeam || t('matches.home_team')),
                      splitIndex: 0,
                    },
                    {
                      label: String(row?.awayTeam || t('matches.away_team')),
                      splitIndex: 1,
                    },
                  ].map((entry) => {
                    const splitResults = getSplitSelections(
                      results,
                      baseRowKey,
                      entry.splitIndex,
                    );
                    return (
                      <View
                        key={entry.splitIndex}
                        style={styles.full15ScoreRow}
                      >
                        <Text
                          style={styles.full15ScoreLabel}
                          numberOfLines={1}
                        >
                          {entry.label}
                        </Text>
                        <View style={styles.full15OptionsGroup}>
                          <NativeOptionStack
                            disabled={!active}
                            options={[...EXTENDED_OPTIONS]}
                            outcome={getOutcomeName(success)}
                            selectedOptions={splitResults}
                            style={styles.full15OptionStack}
                            onSelect={(option) =>
                              onChangeMatchResults(
                                matchId,
                                option as OptionValue,
                                index,
                                entry.splitIndex,
                              )
                            }
                          />
                        </View>
                      </View>
                    );
                  })}
                  <View style={[styles.userInfo, styles.full15UserInfo]}>
                    <Ionicons
                      name="person-outline"
                      size={13}
                      color={row.user ? palette.inkMuted : palette.warning}
                    />
                    <Text
                      style={[
                        styles.assigneeText,
                        !row.user && styles.assigneeTextUnassigned,
                      ]}
                    >
                      {row.user?.name || 'Sin asignar'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default memo(FutPoolCard);
