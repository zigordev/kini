import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from '../../index.styles';
import { updateMatch } from '../../services/futPoolMatch.service';
import { listUsers } from '../../services/users.service';

const DOUBLES_MIN = 0;
const DOUBLES_MAX = 8;
const TRIPLES_MIN = 0;
const TRIPLES_MAX = 8;
const DEFAULT_USER_COLOR = '#4A1A7A';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const normalizeDate = (source: Date) => {
  const normalized = new Date(source);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Conditional native modules
let UIStepper: any = null;
let DateTimePicker: any = null;

if (Platform.OS !== 'web') {
  try {
    // @ts-ignore - library ships without types
    UIStepper = require('react-native-ui-stepper').default;
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    console.warn('Native components not available:', error);
  }
}

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
  description: string;
  doubles: number;
  triples: number;
  elige8: boolean;
  active: boolean;
  date: Date;
  earning: number;
  matches?: MatchFormEntry[];
};

export type PoolDetailsField =
  | 'description'
  | 'doubles'
  | 'triples'
  | 'elige8'
  | 'active'
  | 'date'
  | 'earning';

type PoolDetailsModalProps = {
  visible: boolean;
  title: string;
  confirmLabel: string;
  initialValues: PoolDetailsFormValues;
  submitting?: boolean;
  finalizing?: boolean;
  mode?: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: PoolDetailsFormValues) => void;
  onFinalize?: (earning: number) => Promise<void> | void;
  onFieldChange?: (field: PoolDetailsField, value: any) => void;
  matchInitialValues?: MatchFormEntry[];
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

const PoolDetailsModal = ({
  visible,
  title,
  confirmLabel,
  initialValues,
  submitting = false,
  finalizing = false,
  mode = 'create',
  onClose,
  onSubmit,
  onFinalize,
  onFieldChange,
  matchInitialValues,
}: PoolDetailsModalProps) => {
  const { t } = useTranslation();
  const isEditMode = mode === 'edit';
  const [users, setUsers] = useState<MatchUserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const userMap = useMemo(() => {
    const map = new Map<string, MatchUserOption>();
    users.forEach((user) => {
      map.set(String(user.id), user);
    });
    return map;
  }, [users]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
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
    } finally {
      setLoadingUsers(false);
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
  const [triples, setTriples] = useState(initialValues.triples);
  const [elige8, setElige8] = useState(initialValues.elige8);
  const [active, setActive] = useState(initialValues.active);
  const [date, setDate] = useState<Date>(normalizeDate(initialValues.date));
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(
    Platform.OS === 'ios',
  );
  const [currentEarning, setCurrentEarning] = useState(
    initialValues.earning ?? 0,
  );
  const [matches, setMatches] = useState<MatchFormEntry[]>([]);
  const [finalizePromptVisible, setFinalizePromptVisible] = useState(false);
  const [finalizeInput, setFinalizeInput] = useState(
    String(initialValues.earning ?? 0),
  );
  const [finalizeError, setFinalizeError] = useState('');
  const [userDropdownIndex, setUserDropdownIndex] = useState<number | null>(
    null,
  );
  const [buttonPositions, setButtonPositions] = useState<{
    [key: number]: { top: number; left: number; width: number; height: number };
  }>({});

  const matchesDescription = useMemo(
    () => buildMatchesDescription(matches),
    [matches],
  );

  const lastDescriptionRef = useRef(matchesDescription);
  const hasUserEditedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setDoubles(initialValues.doubles);
      setTriples(initialValues.triples);
      setElige8(initialValues.elige8);
      setActive(initialValues.active);
      setDate(normalizeDate(initialValues.date));
      setShowNativeDatePicker(Platform.OS === 'ios');
      setCurrentEarning(initialValues.earning ?? 0);
      setFinalizeInput(String(initialValues.earning ?? 0));
      setFinalizePromptVisible(false);
      setFinalizeError('');
      // Don't override matches here as they will be set by the normalizedMatches effect
      lastDescriptionRef.current = buildMatchesDescription(normalizedMatches);

      // Fetch users when modal opens
      fetchUsers();
    }
  }, [visible]);

  useEffect(() => {
    // Only sync description to parent after the user has performed an edit,
    // to avoid triggering PATCH when the modal opens and data initializes
    if (!isEditMode || !onFieldChange) {
      return;
    }
    if (!hasUserEditedRef.current) {
      return;
    }
    if (matchesDescription === lastDescriptionRef.current) {
      return;
    }
    onFieldChange('description', matchesDescription);
    lastDescriptionRef.current = matchesDescription;
  }, [isEditMode, matchesDescription, onFieldChange]);

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
      border: '1px solid #d7deeb',
      fontSize: '16px',
      color: '#1a1f36',
      outline: 'none',
      backgroundColor: '#ffffff',
      boxSizing: 'border-box',
    }),
    [],
  );

  const notifyFieldChange = useCallback(
    (field: PoolDetailsField, value: any) => {
      if (isEditMode && onFieldChange) {
        hasUserEditedRef.current = true;
        onFieldChange(field, value);
      }
    },
    [isEditMode, onFieldChange],
  );

  const handleSetDoubles = useCallback(
    (value: number) => {
      const next = clamp(value, DOUBLES_MIN, DOUBLES_MAX);
      setDoubles(next);
      if (next !== doubles) {
        notifyFieldChange('doubles', next);
      }
    },
    [doubles, notifyFieldChange],
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
      if (next !== triples) {
        notifyFieldChange('triples', next);
      }
    },
    [notifyFieldChange, triples],
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
      if (value !== elige8) {
        notifyFieldChange('elige8', value);
      }
    },
    [elige8, notifyFieldChange],
  );

  const handleToggleActive = useCallback(
    (value: boolean) => {
      setActive(value);
      if (value !== active) {
        notifyFieldChange('active', value);
      }
    },
    [active, notifyFieldChange],
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
    async (index: number, text: string) => {
      updateMatchAt(index, { homeTeam: text });

      // Patch the match in the backend
      const match = matches[index];
      if (match?.id) {
        try {
          hasUserEditedRef.current = true;
          await updateMatch(match.id, { homeTeam: text });
        } catch (error) {
          console.error('Failed to update match home team:', error);
        }
      }
    },
    [updateMatchAt, matches],
  );

  const handleAwayTeamChange = useCallback(
    async (index: number, text: string) => {
      updateMatchAt(index, { awayTeam: text });

      // Patch the match in the backend
      const match = matches[index];
      if (match?.id) {
        try {
          hasUserEditedRef.current = true;
          await updateMatch(match.id, { awayTeam: text });
        } catch (error) {
          console.error('Failed to update match away team:', error);
        }
      }
    },
    [updateMatchAt, matches],
  );

  const handleToggleUserDropdown = useCallback(
    (index: number) => {
      if (users.length === 0) {
        return;
      }
      setUserDropdownIndex((previous) => (previous === index ? null : index));
    },
    [users.length],
  );

  const handleButtonLayout = useCallback((index: number, event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setButtonPositions((prev) => ({
      ...prev,
      [index]: { top: y, left: x, width, height },
    }));
  }, []);

  const handleSelectUserOption = useCallback(
    async (option: MatchUserOption | null) => {
      if (userDropdownIndex === null) {
        return;
      }

      const newUserId = option ? String(option.id) : null;
      updateMatchAt(userDropdownIndex, {
        userId: newUserId,
        userName: option?.name,
      });

      // Patch the match in the backend
      const match = matches[userDropdownIndex];
      if (match?.id) {
        try {
          hasUserEditedRef.current = true;
          await updateMatch(match.id, { userId: newUserId || undefined });
        } catch (error) {
          console.error('Failed to update match user:', error);
        }
      }

      setUserDropdownIndex(null);
    },
    [updateMatchAt, userDropdownIndex, matches],
  );

  const handleChangeUserSelect = useCallback(
    async (index: number, value: string) => {
      const newUserId = value ? String(value) : null;
      updateMatchAt(index, {
        userId: newUserId,
        userName: newUserId
          ? (userMap.get(String(newUserId))?.name ?? undefined)
          : undefined,
      });

      const match = matches[index];
      if (match?.id) {
        try {
          await updateMatch(match.id, { userId: newUserId || undefined });
        } catch (error) {
          console.error('Failed to update match user:', error);
        }
      }
    },
    [matches, updateMatchAt, userMap],
  );

  const handleSubmit = useCallback(() => {
    onSubmit({
      description: matchesDescription,
      doubles,
      triples,
      elige8,
      active,
      date,
      earning: currentEarning,
      matches: matches,
    });
  }, [
    matchesDescription,
    doubles,
    triples,
    elige8,
    active,
    date,
    currentEarning,
    matches,
    onSubmit,
  ]);

  const showFinalizeButton = Boolean(onFinalize);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.creationModalOverlay} onPress={onClose}>
        <View />
      </Pressable>
      <KeyboardAvoidingView
        style={styles.creationModalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.creationModalContent}>
          <View style={styles.creationModalHeader}>
            <Text style={styles.creationModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color="#4A1A7A" />
            </TouchableOpacity>
          </View>

          {/* User dropdown rendered at modal level to ensure proper layering */}
          {userDropdownIndex !== null && (
            <>
              <Pressable
                style={styles.dropdownBackdrop}
                onPress={() => setUserDropdownIndex(null)}
              />
              <View
                style={[
                  styles.userDropdown,
                  userDropdownIndex !== null &&
                  buttonPositions[userDropdownIndex]
                    ? {
                        top:
                          buttonPositions[userDropdownIndex].top +
                          buttonPositions[userDropdownIndex].height +
                          4,
                        left: buttonPositions[userDropdownIndex].left,
                        width: buttonPositions[userDropdownIndex].width,
                      }
                    : { top: 200, left: 24, width: '50%' },
                ]}
              >
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userDropdownOption}
                    onPress={() => handleSelectUserOption(user)}
                  >
                    <View
                      style={[
                        styles.matchUserCapsule,
                        styles.userDropdownOptionCapsule,
                        {
                          backgroundColor:
                            user.backgroundColor ?? DEFAULT_USER_COLOR,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchUserCapsuleText,
                          { color: user.textColor ?? '#000000' },
                        ]}
                      >
                        {user.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          <ScrollView
            style={styles.creationModalScroll}
            contentContainerStyle={styles.creationModalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.creationModalRow}>
              <View style={styles.creationModalDateColumn}>
                <Text style={styles.creationModalLabel}>
                  {t('fields.date')}
                </Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.creationModalDateWeb}>
                    <View style={{ position: 'relative', width: '100%' }}>
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
                            notifyFieldChange('date', normalized);
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
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#ffffff',
                          borderWidth: 1,
                          borderColor: '#d7deeb',
                          borderRadius: 12,
                          padding: 12,
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          pointerEvents: 'none',
                          zIndex: 0,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            color: '#1a1f36',
                          }}
                        >
                          {dateLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : DateTimePicker ? (
                  <View style={styles.creationModalDateNative}>
                    <TouchableOpacity
                      onPress={() => setShowNativeDatePicker(true)}
                      style={styles.creationModalDateButton}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#4A1A7A"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.creationModalDateButtonText}>
                        {dateLabel}
                      </Text>
                    </TouchableOpacity>
                    {showNativeDatePicker && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_event: any, selectedDate?: Date) => {
                          if (Platform.OS === 'android') {
                            setShowNativeDatePicker(false);
                          }
                          if (!selectedDate) {
                            return;
                          }
                          const normalized = normalizeDate(selectedDate);
                          setDate(normalized);
                          notifyFieldChange('date', normalized);
                        }}
                      />
                    )}
                  </View>
                ) : (
                  <View style={styles.creationModalDateFallback}>
                    <Text style={styles.creationModalDateButtonText}>
                      {dateLabel}
                    </Text>
                    <Text style={styles.creationModalDateFallbackHint}>
                      {t('pools.update_app_for_date')}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.creationModalSwitchGroup}>
                <Text style={styles.creationModalLabel}>
                  {t('fields.active')}
                </Text>
                <View style={styles.creationModalSwitchRow}>
                  <Switch
                    value={active}
                    onValueChange={handleToggleActive}
                    thumbColor={
                      Platform.OS === 'android'
                        ? active
                          ? '#4A1A7A'
                          : '#f4f3f4'
                        : undefined
                    }
                    trackColor={{ false: '#d6d8e8', true: '#ceb9f3' }}
                    disabled={finalizing}
                  />
                </View>
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
                {UIStepper ? (
                  <View style={styles.creationModalNativeStepper}>
                    <UIStepper
                      value={doubles}
                      onValueChange={(value: number) => handleSetDoubles(value)}
                      minimumValue={DOUBLES_MIN}
                      maximumValue={DOUBLES_MAX}
                      steps={1}
                      style={{ minWidth: 140 }}
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
                {UIStepper ? (
                  <View style={styles.creationModalNativeStepper}>
                    <UIStepper
                      value={triples}
                      onValueChange={(value: number) => handleSetTriples(value)}
                      minimumValue={TRIPLES_MIN}
                      maximumValue={TRIPLES_MAX}
                      steps={1}
                      style={{ minWidth: 140 }}
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
                  <Text style={styles.creationModalLabel}>Elige</Text>
                  <Text style={styles.creationModalElige8Badge}>8</Text>
                </View>
                <View style={styles.creationModalSwitchColumn}>
                  <Switch
                    value={elige8}
                    onValueChange={handleToggleElige8}
                    thumbColor={
                      Platform.OS === 'android'
                        ? elige8
                          ? '#4A1A7A'
                          : '#f4f3f4'
                        : undefined
                    }
                    trackColor={{ false: '#d6d8e8', true: '#ceb9f3' }}
                    disabled={finalizing}
                  />
                </View>
              </View>
            </View>

            <View style={styles.matchesSection}>
              <Text style={styles.creationModalLabel}>
                {t('pools.matches')}
              </Text>
              {matches.map((entry, index) => (
                <View key={entry.order}>
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
                              border: '1px solid #d7deeb',
                              background: '#ffffff',
                              color: '#1a1f36',
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
                        <Picker
                          selectedValue={entry.userId ?? ''}
                          onValueChange={(val) =>
                            handleChangeUserSelect(index, String(val))
                          }
                          mode="dropdown"
                        >
                          <Picker.Item
                            label={t('users.select')}
                            value=""
                          />
                          {users.map((u) => (
                            <Picker.Item
                              key={u.id}
                              label={u.name}
                              value={u.id}
                            />
                          ))}
                        </Picker>
                      </View>
                    )}
                  </View>
                  {index < matches.length - 1 && (
                    <View style={styles.matchDivider} />
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {(showFinalizeButton || mode === 'create') && (
            <View
              style={[
                styles.creationModalActions,
                (!showFinalizeButton || mode === 'create') &&
                  styles.creationModalActionsCompact,
                showFinalizeButton &&
                  mode !== 'create' &&
                  styles.creationModalActionsSingle,
              ]}
            >
              {showFinalizeButton && (
                <TouchableOpacity
                  style={[
                    styles.creationModalActionButton,
                    styles.creationModalFinalizeButton,
                    (submitting || finalizing) &&
                      styles.creationModalActionButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!finalizing) {
                      setFinalizeInput(String(currentEarning ?? 0));
                      setFinalizeError('');
                      setFinalizePromptVisible(true);
                    }
                  }}
                  activeOpacity={0.85}
                  disabled={submitting || finalizing}
                >
                  <Text style={styles.creationModalFinalizeButtonLabel}>
                    Finalizar quiniela
                  </Text>
                </TouchableOpacity>
              )}
              {mode === 'create' && (
                <View style={styles.creationModalActionGroup}>
                  <TouchableOpacity
                    style={[
                      styles.creationModalActionButton,
                      styles.creationModalCancelButton,
                      submitting && styles.creationModalActionButtonDisabled,
                    ]}
                    onPress={onClose}
                    activeOpacity={0.8}
                    disabled={submitting}
                  >
                    <Text style={styles.creationModalCancelLabel}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.creationModalActionButton,
                      styles.creationModalSubmitButton,
                      submitting && styles.creationModalActionButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={submitting}
                  >
                    <Text style={styles.creationModalSubmitLabel}>
                      {confirmLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {finalizePromptVisible && (
        <Modal
          visible={finalizePromptVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!finalizing) {
              setFinalizePromptVisible(false);
            }
          }}
        >
          <Pressable
            style={styles.creationModalOverlay}
            onPress={() => {
              if (!finalizing) {
                setFinalizePromptVisible(false);
                setFinalizeError('');
              }
            }}
          >
            <View />
          </Pressable>
          <KeyboardAvoidingView
            style={styles.finalizeModalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.finalizeModalCard}>
              <Text style={styles.finalizeModalTitle}>Finalizar quiniela</Text>
              <Text style={styles.finalizeModalSubtitle}>
                Ingresa las ganancias totales
              </Text>
              <TextInput
                value={finalizeInput}
                onChangeText={(text) => {
                  setFinalizeInput(text);
                  setFinalizeError('');
                }}
                style={styles.finalizeModalInput}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                placeholder="0"
                autoFocus
              />
              {finalizeError ? (
                <Text style={styles.finalizeModalError}>{finalizeError}</Text>
              ) : null}
              <View style={styles.finalizeModalActions}>
                <TouchableOpacity
                  style={[
                    styles.finalizeModalButton,
                    styles.finalizeModalCancelButton,
                    finalizing && styles.finalizeModalButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!finalizing) {
                      setFinalizePromptVisible(false);
                      setFinalizeError('');
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={finalizing}
                >
                  <Text style={styles.finalizeModalCancelLabel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.finalizeModalButton,
                    styles.finalizeModalSubmitButton,
                    finalizing && styles.finalizeModalButtonDisabled,
                  ]}
                  onPress={async () => {
                    if (!onFinalize) {
                      return;
                    }
                    const sanitized = String(finalizeInput ?? '').trim();
                    const normalizedValue =
                      sanitized.length === 0
                        ? 0
                        : Number(sanitized.replace(/,/g, '.'));
                    if (!Number.isFinite(normalizedValue)) {
                      setFinalizeError('Ingresa un número válido');
                      return;
                    }
                    if (normalizedValue < 0) {
                      setFinalizeError('Ingresa un valor mayor o igual a 0');
                      return;
                    }
                    try {
                      await onFinalize(normalizedValue);
                      setCurrentEarning(normalizedValue);
                      setActive(false);
                      setFinalizePromptVisible(false);
                      setFinalizeError('');
                    } catch (error) {
                      console.error('Failed to finalize pool', error);
                      setFinalizeError(
                        'No se pudo finalizar. Intenta nuevamente.',
                      );
                    }
                  }}
                  activeOpacity={0.85}
                  disabled={finalizing}
                >
                  <Text style={styles.finalizeModalSubmitLabel}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </Modal>
  );
};

export default PoolDetailsModal;
