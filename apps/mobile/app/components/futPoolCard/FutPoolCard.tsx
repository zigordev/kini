import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

// Conditional import for native context menu (only on mobile)
let ContextMenu: any = null;

if (Platform.OS !== 'web') {
  try {
    ContextMenu = require('react-native-context-menu-view').default;
  } catch (error) {
    console.warn('ContextMenu not available:', error);
  }
} else {
  console.log('Web platform detected, ContextMenu not loaded');
}

import { useTranslation } from 'react-i18next';
import {
  EXTENDED_OPTIONS,
  OptionValue,
  REGULAR_OPTIONS,
  SPLIT_SUFFIXES,
} from '../../types/futPool';
import styles from './FutPoolCard.styles';

export type FutPoolCardProps = {
  matches: any[];
  doubles: number;
  elige8: boolean;
  successes: number;
  active: boolean;
  currentUserId?: string;
  onChangeDoubles: (value: number) => Promise<void> | void;
  onChangeElige8: (value: boolean) => Promise<void> | void;
  onChangeMatchSuccess: (
    matchId: string,
    value: boolean,
  ) => Promise<void> | void;
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

const FutPoolCard = ({
  matches = [],
  doubles = 0,
  elige8 = false,
  successes = 0,
  active = false,
  currentUserId,
  onChangeDoubles,
  onChangeElige8,
  onChangeMatchSuccess,
  onChangeMatchElige8,
  onChangeMatchResults,
}: FutPoolCardProps) => {
  const { t } = useTranslation();
  // Responsive layout that works well on both mobile and desktop
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const MIN_DOUBLES = 0;
  const MAX_DOUBLES = 8;

  const [activeMenu, setActiveMenu] = useState<{
    matchId: string;
    anchorX: number;
    anchorY: number;
  } | null>(null);

  const handleChangeDoubles = (delta: number) => {
    const nextValue = Math.max(
      MIN_DOUBLES,
      Math.min(MAX_DOUBLES, doubles + delta),
    );
    onChangeDoubles(nextValue);
  };

  const handleChangeElige8 = async (value: boolean) => {
    onChangeElige8(value);
  };

  const handleChangeMatchSuccess = async (matchId: string, value: boolean) => {
    await onChangeMatchSuccess(matchId, value);
  };

  const isMatchAssignedToUser = (match: any) => {
    return currentUserId && match?.userId && match.userId === currentUserId;
  };

  const getContextMenuActions = (matchId: string) => {
    const match = matches.find(
      (entry) => String(entry?.id ?? entry?.matchId) === matchId,
    );
    const isElige8Match = Boolean(match?.elige8);

    const actions = [
      {
        title: t('matches.success_yes'),
        systemIcon: 'checkmark.circle',
      },
      {
        title: t('matches.success_no'),
        systemIcon: 'xmark.circle',
        destructive: true,
      },
    ];

    if (active) {
      actions.push({
        title: isElige8Match ? t('matches.remove_elige8') : 'Elige8',
        systemIcon: isElige8Match ? 'minus.circle' : 'plus.circle',
      });
    }

    return actions;
  };

  const handleContextMenuAction = (
    matchId: string,
    event: { nativeEvent: { index: number } },
  ) => {
    const { index } = event.nativeEvent;
    const match = matches.find(
      (entry) => String(entry?.id ?? entry?.matchId) === matchId,
    );
    const isElige8Match = Boolean(match?.elige8);

    switch (index) {
      case 0: // Acierto
        handleChangeMatchSuccess(matchId, true);
        break;
      case 1: // Fallo
        handleChangeMatchSuccess(matchId, false);
        break;
      case 2: // Elige8 (only if active)
        if (active) {
          onChangeMatchElige8(matchId, !isElige8Match);
        }
        break;
    }
  };

  const closeMenu = () => setActiveMenu(null);

  const handleOpenMenu = (matchId: string, event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    setActiveMenu({ matchId, anchorX: pageX, anchorY: pageY });
  };

  const handleMenuSuccessSelection = async (
    matchId: string,
    value: boolean,
  ) => {
    closeMenu();
    await handleChangeMatchSuccess(matchId, value);
  };

  const handleToggleMatchElige8Menu = async (
    matchId: string,
    value: boolean,
  ) => {
    closeMenu();
    await onChangeMatchElige8(matchId, value);
  };

  const computeMenuPosition = (anchorX: number, anchorY: number) => {
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get('window');
    const menuWidth = 200;
    const menuHeight = 150;
    const horizontalPadding = 16;
    const verticalPadding = 16;

    const left = Math.min(
      Math.max(anchorX - menuWidth / 2, horizontalPadding),
      screenWidth - menuWidth - horizontalPadding,
    );

    const top = Math.min(
      Math.max(anchorY + 12, verticalPadding),
      screenHeight - menuHeight - verticalPadding,
    );

    return { top, left };
  };

  const renderContextMenu = () => {
    if (!activeMenu) {
      return null;
    }

    const match = matches.find(
      (entry) => String(entry?.id ?? entry?.matchId) === activeMenu.matchId,
    );
    const isElige8Match = Boolean(match?.elige8);

    const menuPosition = computeMenuPosition(
      activeMenu.anchorX,
      activeMenu.anchorY,
    );

    return (
      <Modal
        transparent
        visible
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.menuModalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.menuModalCard, menuPosition]}>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() =>
                    handleMenuSuccessSelection(activeMenu.matchId, true)
                  }
                >
                  <Text style={styles.menuOptionLabel}>
                    {t('matches.success_yes')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() =>
                    handleMenuSuccessSelection(activeMenu.matchId, false)
                  }
                >
                  <Text style={styles.menuOptionLabel}>
                    {t('matches.success_no')}
                  </Text>
                </TouchableOpacity>
                {active && (
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() =>
                      handleToggleMatchElige8Menu(
                        activeMenu.matchId,
                        !isElige8Match,
                      )
                    }
                  >
                    <Text style={styles.menuOptionLabel}>
                      {isElige8Match
                        ? t('matches.remove_elige8')
                        : 'Elige8'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const showNativeContextMenu = (matchId: string) => {
    // Only show context menu for active pools
    if (!active) {
      return;
    }

    const match = matches.find(
      (entry) => String(entry?.id ?? entry?.matchId) === matchId,
    );
    const isElige8Match = Boolean(match?.elige8);

    if (Platform.OS === 'ios') {
      // iOS native ActionSheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('actions.cancel'),
            t('matches.success_yes'),
            t('matches.success_no'),
            isElige8Match ? t('matches.remove_elige8') : 'Elige8',
          ],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2, // Mark "Fallo" as destructive
          disabledButtonIndices: !active ? [3] : [], // Disable Elige8 if not active
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              handleChangeMatchSuccess(matchId, true);
              break;
            case 2:
              handleChangeMatchSuccess(matchId, false);
              break;
            case 3:
              if (active) {
                onChangeMatchElige8(matchId, !isElige8Match);
              }
              break;
          }
        },
      );
    } else if (Platform.OS === 'android') {
      // Android native Alert
      const buttons = [
        { text: t('actions.cancel'), style: 'cancel' as const },
        {
          text: t('matches.success_yes'),
          onPress: () => handleChangeMatchSuccess(matchId, true),
        },
        {
          text: t('matches.success_no'),
          onPress: () => handleChangeMatchSuccess(matchId, false),
          style: 'destructive' as const,
        },
      ];

      if (active) {
        buttons.push({
          text: isElige8Match ? t('matches.remove_elige8') : 'Elige8',
          onPress: async () =>
            await onChangeMatchElige8(matchId, !isElige8Match),
        });
      }

      Alert.alert(
        t('matches.update_status_title'),
        t('matches.update_status_message'),
        buttons,
        { cancelable: true },
      );
    } else {
      // Web - use the modal context menu
      // This will be handled by the button's onPress event that calls handleOpenMenu
    }
  };

  const canDecreaseDoubles = active && doubles > MIN_DOUBLES;
  const canIncreaseDoubles = active && doubles < MAX_DOUBLES;

  return (
    <View style={styles.card}>
      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={styles.cardScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={[styles.table, !active && styles.tableDisabled]}>
          {matches.map((row, index) => {
            const baseRowKey = String(row?.id ?? index + 1);
            const results = row?.results ?? [];
            const success = row?.success;
            const matchId = String(row?.id ?? index + 1);
            const isMatchInElige8 = Boolean(row?.elige8);
            // Removed rowStateStyle logic - now using result text colors instead
            const isLastRow = index === matches.length - 1;
            const isPenultimateRow = index === matches.length - 2;
            // Removed isMenuActive - using native context menus

            if (!isLastRow) {
              // Two-line layout for regular matches (1-14)
              return (
                <Pressable
                  key={row?.id ?? index}
                  onLongPress={
                    active ? () => showNativeContextMenu(matchId) : undefined
                  }
                  style={styles.row}
                >
                  {/* Match name + User info below + Result buttons (right) */}
                  <View style={styles.matchInfoContainer}>
                    <Text style={styles.rowText}>
                      {row?.homeTeam} - {row?.awayTeam}
                    </Text>
                    <View style={styles.userInfo}>
                      <View
                        style={[
                          styles.userCapsule,
                          {
                            backgroundColor:
                              row.user?.backgroundColor || '#e0e0e0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.userCapsuleText,
                            { color: row.user?.textColor || '#000000' },
                          ]}
                        >
                          {row.user?.name || 'Sin asignar'}
                        </Text>
                      </View>
                      {isMatchInElige8 && (
                        <Text style={styles.elige8Badge}>8</Text>
                      )}
                      {isMatchAssignedToUser(row) && (
                        <View style={styles.assignedBadge}>
                          <Ionicons name="person" size={12} color="#FF6B35" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Result buttons + Context menu (right) */}
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
                          if (success === true) {
                            optionStyles.push(styles.optionBoxSuccess);
                          } else if (success === false) {
                            optionStyles.push(styles.optionBoxFailure);
                          } else {
                            optionStyles.push(styles.optionBoxSelected);
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={option}
                            activeOpacity={active ? 0.8 : 1}
                            style={optionStyles}
                            onPress={() =>
                              onChangeMatchResults(
                                String(row?.id ?? index + 1),
                                option,
                                index,
                              )
                            }
                            disabled={!active}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                !active && styles.optionLabelDisabled,
                                isSelected && styles.optionLabelSelected,
                              ]}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {active && Platform.OS === 'web' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.nativeContextMenuButton,
                          pressed && styles.nativeContextMenuButtonPressed,
                        ]}
                        onPress={(event) => handleOpenMenu(matchId, event)}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={16}
                          color="#8E8E93"
                        />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            }

            // Full 15 match - two-line layout with two sets of result boxes (one per team)
            return (
              <Pressable
                key={row?.id ?? index}
                onLongPress={
                  active ? () => showNativeContextMenu(matchId) : undefined
                }
                style={[styles.row, styles.lastRow]}
              >
                {/* Match name + User info below + Two sets of result buttons (right) */}
                <View style={styles.matchInfoContainer}>
                  <Text style={styles.rowText}>
                    {row?.homeTeam} - {row?.awayTeam}
                  </Text>
                  <View style={styles.userInfo}>
                    <View
                      style={[
                        styles.userCapsule,
                        {
                          backgroundColor:
                            row.user?.backgroundColor || '#e0e0e0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.userCapsuleText,
                          { color: row.user?.textColor || '#000000' },
                        ]}
                      >
                        {row.user?.name || 'Sin asignar'}
                      </Text>
                    </View>
                    {isMatchInElige8 && (
                      <Text style={styles.elige8Badge}>8</Text>
                    )}
                    {isMatchAssignedToUser(row) && (
                      <View style={styles.assignedBadge}>
                        <Ionicons name="person" size={12} color="#FF6B35" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Two sets of result buttons (vertical) + Context menu (right) */}
                <View style={styles.actionsContainer}>
                  <View style={styles.verticalResultButtonsContainer}>
                    {/* First set of options (for home team) */}
                    <View style={styles.resultButtonsContainer}>
                      {EXTENDED_OPTIONS.map((option, optionIndex) => {
                        const rawSplitResults = Array.isArray(results)
                          ? results[0] // Home team results
                          : results && typeof results === 'object'
                            ? ((results as Record<string, unknown>)[
                                SPLIT_SUFFIXES[0] ?? '0'
                              ] ??
                              (results as Record<string, unknown>)['0'] ??
                              (results as Record<string, unknown>)[
                                `${baseRowKey}-${SPLIT_SUFFIXES[0]}`
                              ])
                            : undefined;

                        const splitResults = Array.isArray(rawSplitResults)
                          ? rawSplitResults
                          : rawSplitResults != null
                            ? [rawSplitResults]
                            : [];

                        const isSelected = splitResults
                          .map((value) => String(value).toUpperCase())
                          .includes(option);

                        const optionStyles: any[] = [styles.optionBox];
                        if (optionIndex < EXTENDED_OPTIONS.length - 1) {
                          optionStyles.push(styles.optionSpacing);
                        }
                        if (!active) {
                          optionStyles.push(styles.optionBoxDisabled);
                        }
                        if (isSelected) {
                          if (success === true) {
                            optionStyles.push(styles.optionBoxSuccess);
                          } else if (success === false) {
                            optionStyles.push(styles.optionBoxFailure);
                          } else {
                            optionStyles.push(styles.optionBoxSelected);
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={`home-${option}`}
                            activeOpacity={active ? 0.8 : 1}
                            style={optionStyles}
                            onPress={() =>
                              onChangeMatchResults(
                                String(row?.id ?? index + 1),
                                option,
                                index,
                                0, // Home team subIndex
                              )
                            }
                            disabled={!active}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                !active && styles.optionLabelDisabled,
                                isSelected && styles.optionLabelSelected,
                              ]}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Second set of options (for away team) */}
                    <View style={styles.resultButtonsContainer}>
                      {EXTENDED_OPTIONS.map((option, optionIndex) => {
                        const rawSplitResults = Array.isArray(results)
                          ? results[1] // Away team results
                          : results && typeof results === 'object'
                            ? ((results as Record<string, unknown>)[
                                SPLIT_SUFFIXES[1] ?? '1'
                              ] ??
                              (results as Record<string, unknown>)['1'] ??
                              (results as Record<string, unknown>)[
                                `${baseRowKey}-${SPLIT_SUFFIXES[1]}`
                              ])
                            : undefined;

                        const splitResults = Array.isArray(rawSplitResults)
                          ? rawSplitResults
                          : rawSplitResults != null
                            ? [rawSplitResults]
                            : [];

                        const isSelected = splitResults
                          .map((value) => String(value).toUpperCase())
                          .includes(option);

                        const optionStyles: any[] = [styles.optionBox];
                        if (optionIndex < EXTENDED_OPTIONS.length - 1) {
                          optionStyles.push(styles.optionSpacing);
                        }
                        if (!active) {
                          optionStyles.push(styles.optionBoxDisabled);
                        }
                        if (isSelected) {
                          if (success === true) {
                            optionStyles.push(styles.optionBoxSuccess);
                          } else if (success === false) {
                            optionStyles.push(styles.optionBoxFailure);
                          } else {
                            optionStyles.push(styles.optionBoxSelected);
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={`away-${option}`}
                            activeOpacity={active ? 0.8 : 1}
                            style={optionStyles}
                            onPress={() =>
                              onChangeMatchResults(
                                String(row?.id ?? index + 1),
                                option,
                                index,
                                1, // Away team subIndex
                              )
                            }
                            disabled={!active}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                !active && styles.optionLabelDisabled,
                                isSelected && styles.optionLabelSelected,
                              ]}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  {active && Platform.OS === 'web' && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.nativeContextMenuButton,
                        pressed && styles.nativeContextMenuButtonPressed,
                      ]}
                      onPress={(event) => handleOpenMenu(matchId, event)}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={16}
                        color="#8E8E93"
                      />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {renderContextMenu()}
    </View>
  );
};

export default memo(FutPoolCard);
