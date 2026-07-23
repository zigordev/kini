import { Ionicons } from '@expo/vector-icons';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import E8Toggle from '../E8Toggle';
import NativeDatePicker from '../NativeDatePicker';
import NativeNumberSelect from '../NativeNumberSelect';
import NativeSelect from '../NativeSelect';
import { useTheme } from '../../contexts/ThemeContext';
import { createStyles } from '../../index.styles';
import { listUsers } from '../../services/users.service';
import { palette } from '../../theme/design';

const DOUBLES_MIN = 0;
const DOUBLES_MAX = 14;
const TRIPLES_MIN = 0;
const TRIPLES_MAX = 9;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const normalizeDate = (source: Date) => {
  const normalized = new Date(source);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export type MatchUserOption = {
  id: string;
  name: string;
  textColor?: string;
  backgroundColor?: string;
};

export type MatchFormEntry = {
  id?: string;
  order: number;
  homeTeam: string;
  awayTeam: string;
  userId: string | null;
  userName?: string;
};

export type PoolDetailsFormValues = {
  name?: string | null;
  description: string;
  doubles: number;
  triples: number;
  elige8: boolean;
  active: boolean;
  date: Date;
  earning: number;
  matches?: MatchFormEntry[];
};

type PoolDetailsModalProps = {
  visible: boolean;
  initialValues: PoolDetailsFormValues;
  submitting?: boolean;
  onSubmit: (values: PoolDetailsFormValues) => void;
  matchInitialValues?: MatchFormEntry[];
};

export type PoolDetailsFormHandle = {
  submit: () => void;
};

const normalizeMatches = (
  entries: MatchFormEntry[] | undefined,
  users: MatchUserOption[] | undefined,
): MatchFormEntry[] => {
  const userMap = new Map<string, MatchUserOption>();
  (users ?? []).forEach((user) => {
    userMap.set(String(user.id), user);
  });

  return Array.from({ length: 15 }, (_, index) => {
    const order = index + 1;
    const existing = entries?.find((entry) => entry.order === order);
    const option = existing?.userId
      ? userMap.get(String(existing.userId))
      : undefined;

    return {
      id: existing?.id,
      order,
      homeTeam: existing?.homeTeam ?? '',
      awayTeam: existing?.awayTeam ?? '',
      userId: existing?.userId ?? (option ? String(option.id) : null),
      userName: existing?.userName ?? option?.name,
    };
  });
};

const buildMatchesDescription = (matches: MatchFormEntry[]) =>
  matches
    .map(({ order, homeTeam, awayTeam }) => {
      const home = homeTeam.trim();
      const away = awayTeam.trim();
      if (!home && !away) {
        return null;
      }
      const separator = home && away ? ' - ' : home || away ? ' - ' : '';
      return `${order}. ${home}${separator}${away}`.trimEnd();
    })
    .filter(Boolean)
    .join('\n');

const PoolDetailsModal = forwardRef<
  PoolDetailsFormHandle,
  PoolDetailsModalProps
>(
  (
    {
      visible,
      initialValues,
      submitting = false,
      onSubmit,
      matchInitialValues,
    },
    ref,
  ) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [users, setUsers] = useState<MatchUserOption[]>([]);

  const userMap = useMemo(() => {
    const map = new Map<string, MatchUserOption>();
    users.forEach((user) => {
      map.set(String(user.id), user);
    });
    return map;
  }, [users]);

  const fetchUsers = useCallback(async () => {
    try {
      const usersList = await listUsers();
      const mapped = usersList.map((matchUser) => ({
        id: String(matchUser.id),
        name: matchUser.name ?? t('user.anonymous'),
        textColor: matchUser.textColor,
        backgroundColor: matchUser.backgroundColor,
      }));
      setUsers(mapped);
    } catch (error) {
      console.error('Failed to load users in modal:', error);
      setUsers([]);
    }
  }, []);

  const normalizedMatches = useMemo(
    () => normalizeMatches(matchInitialValues, users),
    [matchInitialValues, users],
  );

  // Update matches when normalizedMatches changes (after users are loaded)
  useEffect(() => {
    if (normalizedMatches.length > 0) {
      setMatches(normalizedMatches);
    }
  }, [normalizedMatches]);

  const [doubles, setDoubles] = useState(initialValues.doubles);
  const [name, setName] = useState(initialValues.name ?? '');
  const [triples, setTriples] = useState(initialValues.triples);
  const [elige8, setElige8] = useState(initialValues.elige8);
  const [active, setActive] = useState(initialValues.active);
  const [date, setDate] = useState<Date>(normalizeDate(initialValues.date));
  const [matches, setMatches] = useState<MatchFormEntry[]>([]);

  const matchesDescription = useMemo(
    () => buildMatchesDescription(matches),
    [matches],
  );

  useEffect(() => {
    if (visible) {
      setDoubles(initialValues.doubles);
      setName(initialValues.name ?? '');
      setTriples(initialValues.triples);
      setElige8(initialValues.elige8);
      setActive(initialValues.active);
      setDate(normalizeDate(initialValues.date));
      // Don't override matches here as they will be set by the normalizedMatches effect

      // Fetch users when modal opens
      fetchUsers();
    }
  }, [visible]);

  const dateLabel = useMemo(() => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, [date]);

  const dateISOForWeb = useMemo(() => date.toISOString().split('T')[0], [date]);

  const webDateInputStyles = useMemo(
    () => ({
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      border: `1px solid ${isDark ? palette.darkBorder : palette.border}`,
      fontSize: '16px',
      color: isDark ? palette.darkInk : palette.ink,
      outline: 'none',
      backgroundColor: isDark ? palette.darkSurface : palette.surface,
      boxSizing: 'border-box',
    }),
    [isDark],
  );

  const handleSetDoubles = useCallback(
    (value: number) => {
      const next = clamp(value, DOUBLES_MIN, DOUBLES_MAX);
      setDoubles(next);
    },
    [],
  );

  const handleSetName = useCallback(
    (value: string) => {
      setName(value);
    },
    [],
  );

  const handleDecreaseDoubles = useCallback(() => {
    handleSetDoubles(doubles - 1);
  }, [handleSetDoubles, doubles]);

  const handleIncreaseDoubles = useCallback(() => {
    handleSetDoubles(doubles + 1);
  }, [handleSetDoubles, doubles]);

  const handleSetTriples = useCallback(
    (value: number) => {
      const next = clamp(value, TRIPLES_MIN, TRIPLES_MAX);
      setTriples(next);
    },
    [],
  );

  const handleDecreaseTriples = useCallback(() => {
    handleSetTriples(triples - 1);
  }, [handleSetTriples, triples]);

  const handleIncreaseTriples = useCallback(() => {
    handleSetTriples(triples + 1);
  }, [handleSetTriples, triples]);

  const handleToggleElige8 = useCallback(
    (value: boolean) => {
      setElige8(value);
    },
    [],
  );

  const updateMatchAt = useCallback(
    (index: number, changes: Partial<MatchFormEntry>) => {
      setMatches((previous) => {
        const next = [...previous];
        next[index] = { ...next[index], ...changes };
        return next;
      });
    },
    [],
  );

  const handleHomeTeamChange = useCallback(
    (index: number, text: string) => {
      updateMatchAt(index, { homeTeam: text });
    },
    [updateMatchAt],
  );

  const handleAwayTeamChange = useCallback(
    (index: number, text: string) => {
      updateMatchAt(index, { awayTeam: text });
    },
    [updateMatchAt],
  );

  const handleChangeUserSelect = useCallback(
    (index: number, value: string) => {
      const newUserId = value ? String(value) : null;
      updateMatchAt(index, {
        userId: newUserId,
        userName: newUserId
          ? (userMap.get(String(newUserId))?.name ?? undefined)
          : undefined,
      });
    },
    [updateMatchAt, userMap],
  );

  const handleSubmit = useCallback(() => {
    onSubmit({
      name: name.trim() || null,
      description: matchesDescription,
      doubles,
      triples,
      elige8,
      active,
      date,
      earning: initialValues.earning ?? 0,
      matches: matches,
    });
  }, [
    matchesDescription,
    name,
    doubles,
    triples,
    elige8,
    active,
    date,
    initialValues.earning,
    matches,
    onSubmit,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit,
    }),
    [handleSubmit],
  );

  return (
    <KeyboardAvoidingView
      style={styles.creationModalScreenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.creationModalScreenContent}>
          <ScrollView
            style={styles.creationModalScroll}
            contentContainerStyle={styles.creationModalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.creationModalSection}>
              <Text style={styles.creationModalLabel}>{t('fields.name')}</Text>
              <TextInput
                value={name}
                onChangeText={handleSetName}
                placeholder={t('pools.name_placeholder')}
                placeholderTextColor={palette.inkSubtle}
                style={[
                  styles.creationModalInput,
                  styles.creationModalNameInput,
                ]}
                editable={!submitting}
                returnKeyType="done"
              />
            </View>

            <View style={styles.creationModalRow}>
              <View style={styles.creationModalDateColumn}>
                <Text style={styles.creationModalLabel}>
                  {t('fields.date')}
                </Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.creationModalDateWeb}>
                    <View style={styles.creationModalDateField}>
                      {React.createElement('input', {
                        type: 'date',
                        value: dateISOForWeb,
                        onChange: (event: any) => {
                          const nextValue = event.target?.value;
                          if (!nextValue) {
                            return;
                          }
                          const parsed = new Date(`${nextValue}T00:00:00`);
                          if (!isNaN(parsed.getTime())) {
                            const normalized = normalizeDate(parsed);
                            setDate(normalized);
                          }
                        },
                        style: {
                          ...webDateInputStyles,
                          color: 'transparent',
                          caretColor: 'transparent',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 1,
                        },
                      })}
                      <View style={styles.creationModalDateDisplay}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={palette.primary}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: isDark ? palette.darkInk : palette.ink,
                          }}
                        >
                          {dateLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.creationModalDateNative}>
                    <NativeDatePicker
                      value={date}
                      label={dateLabel}
                      onChange={(selectedDate) => {
                        const normalized = normalizeDate(selectedDate);
                        setDate(normalized);
                      }}
                      style={styles.creationModalNativeButton}
                    />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.creationModalDualRow}>
              <View
                style={[
                  styles.creationModalStepperGroup,
                  styles.creationModalStepperGroupLeft,
                ]}
              >
                <Text style={styles.creationModalLabel}>
                  {t('fields.doubles')}
                </Text>
                {Platform.OS !== 'web' ? (
                  <View style={styles.creationModalNativeStepper}>
                    <NativeNumberSelect
                      title={t('fields.doubles')}
                      value={doubles}
                      min={DOUBLES_MIN}
                      max={DOUBLES_MAX}
                      onChange={handleSetDoubles}
                    />
                    <Text style={styles.creationModalStepperValue}>
                      {doubles}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.doublesStepper,
                      styles.creationModalStepperShell,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.doublesStepperButton,
                        styles.doublesStepperButtonLeft,
                      ]}
                      onPress={handleDecreaseDoubles}
                      activeOpacity={0.8}
                      disabled={doubles <= DOUBLES_MIN}
                    >
                      <Text style={styles.doublesStepperButtonLabel}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.doublesValueContainer}>
                      <Text style={styles.doublesValue}>{doubles}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.doublesStepperButton,
                        styles.doublesStepperButtonRight,
                      ]}
                      onPress={handleIncreaseDoubles}
                      activeOpacity={0.8}
                      disabled={doubles >= DOUBLES_MAX}
                    >
                      <Text style={styles.doublesStepperButtonLabel}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.creationModalStepperGroup,
                  styles.creationModalStepperGroupCenter,
                ]}
              >
                <Text style={styles.creationModalLabel}>
                  {t('fields.triples')}
                </Text>
                {Platform.OS !== 'web' ? (
                  <View style={styles.creationModalNativeStepper}>
                    <NativeNumberSelect
                      title={t('fields.triples')}
                      value={triples}
                      min={TRIPLES_MIN}
                      max={TRIPLES_MAX}
                      onChange={handleSetTriples}
                    />
                    <Text style={styles.creationModalStepperValue}>
                      {triples}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.doublesStepper,
                      styles.creationModalStepperShell,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.doublesStepperButton,
                        styles.doublesStepperButtonLeft,
                      ]}
                      onPress={handleDecreaseTriples}
                      activeOpacity={0.8}
                      disabled={triples <= TRIPLES_MIN}
                    >
                      <Text style={styles.doublesStepperButtonLabel}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.doublesValueContainer}>
                      <Text style={styles.doublesValue}>{triples}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.doublesStepperButton,
                        styles.doublesStepperButtonRight,
                      ]}
                      onPress={handleIncreaseTriples}
                      activeOpacity={0.8}
                      disabled={triples >= TRIPLES_MAX}
                    >
                      <Text style={styles.doublesStepperButtonLabel}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.creationModalElige8Group}>
                <View style={styles.creationModalLabelRow}>
                  <E8Toggle value={elige8} onValueChange={handleToggleElige8} />
                </View>
              </View>
            </View>

            <View style={styles.matchesSection}>
              <Text style={styles.creationModalLabel}>
                {t('pools.matches')}
              </Text>
              {matches.map((entry, index) => (
                <View key={entry.order} style={styles.matchEntry}>
                  <View style={styles.matchRow}>
                    <View style={styles.matchOrderBadge}>
                      <Text style={styles.matchOrderText}>{entry.order}</Text>
                    </View>
                    <TextInput
                      value={entry.homeTeam}
                      onChangeText={(text) => handleHomeTeamChange(index, text)}
                      placeholder={t('matches.home_team')}
                      style={styles.matchTeamInput}
                    />
                    <Text style={styles.matchSeparator}>-</Text>
                    <TextInput
                      value={entry.awayTeam}
                      onChangeText={(text) => handleAwayTeamChange(index, text)}
                      placeholder={t('matches.away_team')}
                      style={styles.matchTeamInput}
                    />
                  </View>
                  <View style={styles.userSelectorContainer}>
                    {Platform.OS === 'web' ? (
                      <View style={styles.userSelectorContainer}>
                        {React.createElement(
                          'select',
                          {
                            value: entry.userId ?? '',
                            onChange: (e: any) =>
                              handleChangeUserSelect(
                                index,
                                String(e.target?.value ?? ''),
                              ),
                            style: {
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 12,
                              border: `1px solid ${
                                isDark ? palette.darkBorder : palette.border
                              }`,
                              background: isDark
                                ? palette.darkSurface
                                : palette.surface,
                              color: isDark ? palette.darkInk : palette.ink,
                              outline: 'none',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                            },
                          },
                          [
                            React.createElement(
                              'option',
                              { key: 'none', value: '' },
                              t('users.select'),
                            ),
                            ...users.map((u) =>
                              React.createElement(
                                'option',
                                { key: u.id, value: u.id },
                                u.name,
                              ),
                            ),
                          ],
                        )}
                      </View>
                    ) : (
                      <View style={styles.userSelectorContainer}>
                        <NativeSelect
                          title={t('users.select')}
                          placeholder={t('users.select')}
                          selectedValue={entry.userId ?? ''}
                          onChange={(value) =>
                            handleChangeUserSelect(index, value)
                          }
                          options={[
                            { label: t('users.select'), value: '' },
                            ...users.map((u) => ({
                              label: u.name,
                              value: u.id,
                            })),
                          ]}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

      </View>
    </KeyboardAvoidingView>
  );
  },
);

export default PoolDetailsModal;
