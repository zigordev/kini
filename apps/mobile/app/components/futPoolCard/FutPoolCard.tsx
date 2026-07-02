import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';
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

const getOutcomeStyles = (
  success: unknown,
  styles: ReturnType<typeof createStyles>,
) => {
  if (success === true) {
    return {
      row: styles.rowSuccess,
      matchNumberBadge: styles.matchNumberBadgeSuccess,
      matchNumberText: styles.matchNumberTextSuccess,
      optionBoxSelected: styles.optionBoxSelectedSuccess,
      optionLabelSelected: styles.optionLabelSelectedSuccess,
    };
  }

  if (success === false) {
    return {
      row: styles.rowFailure,
      matchNumberBadge: styles.matchNumberBadgeFailure,
      matchNumberText: styles.matchNumberTextFailure,
      optionBoxSelected: styles.optionBoxSelectedFailure,
      optionLabelSelected: styles.optionLabelSelectedFailure,
    };
  }

  return {
    row: undefined,
    matchNumberBadge: styles.matchNumberBadgeNeutral,
    matchNumberText: styles.matchNumberTextNeutral,
    optionBoxSelected: styles.optionBoxSelectedNeutral,
    optionLabelSelected: styles.optionLabelSelectedNeutral,
  };
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
          </View>
          {matches.map((row, index) => {
            const baseRowKey = String(row?.id ?? index + 1);
            const results = row?.results ?? [];
            const success = row?.success;
            const matchId = String(row?.id ?? index + 1);
            const isMatchInElige8 = Boolean(row?.elige8);
            const outcomeStyles = getOutcomeStyles(success, styles);
            const isFull15 =
              Boolean(row?.full15) ||
              Number(row?.poolOrder ?? row?.order) === 15 ||
              index === 14;
            const isLastRow = index === matches.length - 1;

            if (!isFull15) {
              return (
                <Pressable
                  key={row?.id ?? index}
                  style={[styles.row, outcomeStyles.row]}
                >
                  <View
                    style={[
                      styles.matchNumberBadge,
                      outcomeStyles.matchNumberBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchNumberText,
                        outcomeStyles.matchNumberText,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.matchInfoContainer}>
                    <Text style={styles.rowText}>
                      {row?.homeTeam} - {row?.awayTeam}
                    </Text>
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
                    <View style={styles.resultButtonsContainer}>
                      {REGULAR_OPTIONS.map((option, optionIndex) => {
                        const isSelected = Array.isArray(results)
                          ? results.includes(option)
                          : false;

                        const optionStyles: any[] = [styles.optionBox];
                        if (optionIndex < REGULAR_OPTIONS.length - 1) {
                          optionStyles.push(styles.optionSpacing);
                        }
                        if (!active) {
                          optionStyles.push(styles.optionBoxDisabled);
                        }
                        if (isSelected) {
                          optionStyles.push(outcomeStyles.optionBoxSelected);
                        }

                        return (
                          <TouchableOpacity
                            key={option}
                            activeOpacity={active ? 0.8 : 1}
                            style={optionStyles}
                            onPress={() =>
                              onChangeMatchResults(matchId, option, index)
                            }
                            disabled={!active}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                !active && styles.optionLabelDisabled,
                                isSelected &&
                                  outcomeStyles.optionLabelSelected,
                              ]}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {elige8Enabled && Platform.OS !== 'web' ? (
                      <View
                        style={[
                          styles.elige8SwitchGroup,
                          !active && styles.elige8ToggleDisabled,
                        ]}
                      >
                        <Text style={styles.elige8SwitchLabel}>E8</Text>
                        <Switch
                          value={isMatchInElige8}
                          disabled={!active}
                          onValueChange={(value) =>
                            onChangeMatchElige8(matchId, value)
                          }
                          thumbColor={
                            Platform.OS === 'android'
                              ? isMatchInElige8
                                ? palette.accent
                                : palette.backgroundSubtle
                              : undefined
                          }
                          trackColor={{
                            false: palette.borderStrong,
                            true: '#8CBFE2',
                          }}
                        />
                      </View>
                    ) : elige8Enabled ? (
                      <TouchableOpacity
                        activeOpacity={active ? 0.75 : 1}
                        disabled={!active}
                        onPress={() =>
                          onChangeMatchElige8(matchId, !isMatchInElige8)
                        }
                        style={[
                          styles.elige8Toggle,
                          isMatchInElige8 && styles.elige8ToggleActive,
                          !active && styles.elige8ToggleDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.elige8ToggleText,
                            isMatchInElige8 && styles.elige8ToggleTextActive,
                          ]}
                        >
                          E8
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={row?.id ?? index}
                style={[
                  styles.full15Row,
                  isLastRow && styles.lastRow,
                  outcomeStyles.row,
                ]}
              >
                <View
                  style={[
                    styles.matchNumberBadge,
                    outcomeStyles.matchNumberBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.matchNumberText,
                      outcomeStyles.matchNumberText,
                    ]}
                  >
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
                          {EXTENDED_OPTIONS.map((option, optionIndex) => {
                            const isSelected = splitResults.includes(option);
                            const optionStyles: any[] = [styles.optionBox];
                            if (optionIndex < EXTENDED_OPTIONS.length - 1) {
                              optionStyles.push(styles.optionSpacing);
                            }
                            if (!active) {
                              optionStyles.push(styles.optionBoxDisabled);
                            }
                            if (isSelected) {
                              optionStyles.push(
                                outcomeStyles.optionBoxSelected,
                              );
                            }

                            return (
                              <TouchableOpacity
                                key={`${entry.splitIndex}-${option}`}
                                activeOpacity={active ? 0.8 : 1}
                                style={optionStyles}
                                onPress={() =>
                                  onChangeMatchResults(
                                    matchId,
                                    option,
                                    index,
                                    entry.splitIndex,
                                  )
                                }
                                disabled={!active}
                              >
                                <Text
                                  style={[
                                    styles.optionLabel,
                                    !active && styles.optionLabelDisabled,
                                    isSelected &&
                                      outcomeStyles.optionLabelSelected,
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
