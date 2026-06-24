import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import useStats from '../hooks/useStats';
import type { ResultCombinationStat } from '../types/stats';
import UserStats from '../types/userStats';
import styles from './stats.styles';

const StatsScreen = () => {
  const { loading, stats } = useStats();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const balance = stats?.balance ?? 0;
  const isPositive = balance >= 0;
  const [displayValue, setDisplayValue] = React.useState(0);
  const scale = React.useRef(new Animated.Value(0.85)).current;
  const glowOpacity = React.useRef(new Animated.Value(0)).current;
  const ringScale = React.useRef(new Animated.Value(1)).current;
  const ringOpacity = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Reset state values every time screen gains focus
      setDisplayValue(0);
      animatedValue.setValue(0);
      scale.setValue(0.85);
      glowOpacity.setValue(0);
      ringScale.setValue(1);
      ringOpacity.setValue(0.9);

      const id = animatedValue.addListener(({ value }) => {
        const next = Math.round(value * Math.abs(balance));
        setDisplayValue(next);
      });
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: false,
      }).start(() => {
        animatedValue.removeListener(id);
      });

      // Badge punch + glow + ring
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 260,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 640,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.6,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        ringScale.setValue(1);
        ringOpacity.setValue(0.9);
      });

      // Cleanup on blur
      return () => {
        animatedValue.stopAnimation();
        scale.stopAnimation();
        glowOpacity.stopAnimation();
        ringScale.stopAnimation();
        ringOpacity.stopAnimation();
      };
    }, [balance]),
  );
  const renderRankingItem = ({
    item,
    index,
  }: {
    item: UserStats;
    index: number;
  }) => {
    // Do NOT add doubles into combined columns, to avoid double counting (doubles are subset of nonFull15 successes/failures)
    const combinedSuccesses =
      (item.successes ?? 0) + (item.full15Successes ?? 0);
    const combinedFailures = (item.failures ?? 0) + (item.full15Failures ?? 0);
    const combinedTotal = combinedSuccesses + combinedFailures;
    const combinedPercentage =
      combinedTotal > 0 ? (combinedSuccesses / combinedTotal) * 100 : 0;

    return (
      <View style={styles.row}>
        <Text
          style={[
            styles.position,
            styles.columnDivider,
            { width: colWidths.position },
          ]}
        >
          {index + 1}
        </Text>
        <View
          style={[
            styles.userName,
            styles.columnDivider,
            {
              width: colWidths.userName,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <View
            style={[
              styles.userCapsule,
              { backgroundColor: item.user.backgroundColor },
            ]}
          >
            <Text
              style={[styles.userCapsuleText, { color: item.user.textColor }]}
              numberOfLines={1}
            >
              {item.user.name}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.successes },
          ]}
        >
          <Text style={[styles.successMetric, styles.valuePositive]}>
            {combinedSuccesses}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.failures },
          ]}
        >
          <Text style={[styles.successMetric, styles.valueNegative]}>
            {combinedFailures}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.successesPct },
          ]}
        >
          <Text style={styles.successMetric}>
            {combinedPercentage.toFixed(1)}%
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.doubles },
          ]}
        >
          <Text style={[styles.successMetric, styles.valuePositive]}>
            {item.doubleSuccesses}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.doubleFailures },
          ]}
        >
          <Text style={[styles.successMetric, styles.valueNegative]}>
            {item.doubleFailures}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.doublesPct },
          ]}
        >
          <Text style={styles.successMetric}>
            {item.doubleSuccessesPercentage != null
              ? `${item.doubleSuccessesPercentage.toFixed(1)}%`
              : '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.triples },
          ]}
        >
          <Text style={[styles.successMetric, styles.valuePositive]}>
            {item.tripleSuccesses ?? '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.tripleFailures },
          ]}
        >
          <Text style={[styles.successMetric, styles.valueNegative]}>
            {item.tripleFailures ?? '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.triplesPct },
          ]}
        >
          <Text style={styles.successMetric}>
            {item.tripleSuccessesPercentage != null
              ? `${item.tripleSuccessesPercentage.toFixed(1)}%`
              : '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.elige8Successes },
          ]}
        >
          <Text style={[styles.successMetric, styles.valuePositive]}>
            {item.elige8Successes ?? '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.elige8Failures },
          ]}
        >
          <Text style={[styles.successMetric, styles.valueNegative]}>
            {item.elige8Failures ?? '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.elige8SuccessesPct },
          ]}
        >
          <Text style={styles.successMetric}>
            {item.elige8SuccessesPercentage != null
              ? `${item.elige8SuccessesPercentage.toFixed(1)}%`
              : '-'}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.full15Successes },
          ]}
        >
          <Text style={[styles.successMetric, styles.valuePositive]}>
            {item.full15Successes}
          </Text>
        </View>
        <View
          style={[
            styles.metricCell,
            styles.columnDivider,
            { width: colWidths.full15Failures },
          ]}
        >
          <Text style={[styles.successMetric, styles.valueNegative]}>
            {item.full15Failures}
          </Text>
        </View>
        <View
          style={[styles.metricCell, { width: colWidths.full15SuccessesPct }]}
        >
          <Text style={styles.successMetric}>
            {item.full15SuccessesPercentage != null
              ? `${item.full15SuccessesPercentage.toFixed(1)}%`
              : '-'}
          </Text>
        </View>
      </View>
    );
  };

  const colWidths = (() => {
    const ranking = stats?.ranking ?? [];
    const averageCharPx = 8; // more accurate character width for 16px font
    const paddingPx = 16; // adequate padding to prevent text touching edges
    const toLen = (v: unknown) => String(v ?? '').length;

    // Calculate exact content lengths including headers
    const userNameLen = Math.max(
      '👤'.length, // header icon
      ...ranking.map((r) => toLen(r.user?.name)),
    );
    const successesLen = Math.max(
      '∑ ✅'.length, // header text
      ...ranking.map((r) =>
        toLen((r.successes ?? 0) + (r.full15Successes ?? 0)),
      ),
    );
    const successesPctLen = Math.max(
      '∑ %'.length, // header text
      ...ranking.map((r) => {
        const s = (r.successes ?? 0) + (r.full15Successes ?? 0);
        const f = (r.failures ?? 0) + (r.full15Failures ?? 0);
        const pct = s + f > 0 ? (s / (s + f)) * 100 : 0;
        return (pct.toFixed(1) + '%').length;
      }),
    );
    const failuresLen = Math.max(
      '∑ ❌'.length, // header text
      ...ranking.map((r) => toLen((r.failures ?? 0) + (r.full15Failures ?? 0))),
    );
    const doublesLen = Math.max(
      'D ✅'.length, // header text
      ...ranking.map((r) => toLen(r.doubleSuccesses)),
    );
    const doublesPctLen = Math.max(
      'D %'.length, // header text
      ...ranking.map((r) =>
        r.doubleSuccessesPercentage != null
          ? (r.doubleSuccessesPercentage.toFixed(1) + '%').length
          : 1,
      ),
    );
    const doubleFailuresLen = Math.max(
      'D ❌'.length, // header text
      ...ranking.map((r) => toLen(r.doubleFailures)),
    );
    const full15SuccessesLen = Math.max(
      '15 ✅'.length, // header text
      ...ranking.map((r) => toLen(r.full15Successes)),
    );
    const full15FailuresLen = Math.max(
      '15 ❌'.length, // header text
      ...ranking.map((r) => toLen(r.full15Failures)),
    );
    const triplesLen = Math.max(
      'T ✅'.length, // header text
      ...ranking.map((r) => toLen(r.tripleSuccesses)),
    );
    const triplesPctLen = Math.max(
      'T %'.length, // header text
      ...ranking.map((r) =>
        r.tripleSuccessesPercentage != null
          ? (r.tripleSuccessesPercentage.toFixed(1) + '%').length
          : 1,
      ),
    );
    const tripleFailuresLen = Math.max(
      'T ❌'.length, // header text
      ...ranking.map((r) => toLen(r.tripleFailures)),
    );
    const full15SuccessesPctLen = Math.max(
      '15 %'.length, // header text
      ...ranking.map((r) =>
        r.full15SuccessesPercentage != null
          ? (r.full15SuccessesPercentage.toFixed(1) + '%').length
          : 1,
      ),
    );
    const elige8SuccessesLen = Math.max(
      'E ✅'.length,
      ...ranking.map((r) => toLen(r.elige8Successes)),
    );
    const elige8FailuresLen = Math.max(
      'E ❌'.length,
      ...ranking.map((r) => toLen(r.elige8Failures)),
    );
    const elige8SuccessesPctLen = Math.max(
      'E %'.length,
      ...ranking.map((r) =>
        r.elige8SuccessesPercentage != null
          ? (r.elige8SuccessesPercentage.toFixed(1) + '%').length
          : 1,
      ),
    );

    // Calculate exact widths needed for content to fit perfectly
    const minWidths = {
      position: 20, // reduced for tighter fit
      userName: userNameLen * averageCharPx + paddingPx,
      successes: successesLen * averageCharPx + paddingPx,
      successesPct: successesPctLen * averageCharPx + paddingPx,
      failures: failuresLen * averageCharPx + paddingPx,
      doubles: doublesLen * averageCharPx + paddingPx,
      doublesPct: doublesPctLen * averageCharPx + paddingPx,
      doubleFailures: doubleFailuresLen * averageCharPx + paddingPx,
      triples: triplesLen * averageCharPx + paddingPx,
      triplesPct: triplesPctLen * averageCharPx + paddingPx,
      tripleFailures: tripleFailuresLen * averageCharPx + paddingPx,
      full15Successes: full15SuccessesLen * averageCharPx + paddingPx,
      full15Failures: full15FailuresLen * averageCharPx + paddingPx,
      full15SuccessesPct: full15SuccessesPctLen * averageCharPx + paddingPx,
      elige8Successes: elige8SuccessesLen * averageCharPx + paddingPx,
      elige8Failures: elige8FailuresLen * averageCharPx + paddingPx,
      elige8SuccessesPct: elige8SuccessesPctLen * averageCharPx + paddingPx,
    };

    // Calculate total minimum width
    const totalMinWidth = Object.values(minWidths).reduce(
      (sum, width) => sum + width,
      0,
    );

    // Get available screen width (reactive to rotation)
    const availableWidth = screenWidth - 40; // Account for padding

    // If we have extra space, distribute it proportionally to use full width
    if (availableWidth > totalMinWidth) {
      const extraWidth = availableWidth - totalMinWidth;
      const totalMinWidthWithoutPosition = totalMinWidth - minWidths.position;
      const scaleFactor = extraWidth / totalMinWidthWithoutPosition;

      return {
        position: minWidths.position, // Keep position fixed
        userName: minWidths.userName + minWidths.userName * scaleFactor,
        successes: minWidths.successes + minWidths.successes * scaleFactor,
        successesPct:
          minWidths.successesPct + minWidths.successesPct * scaleFactor,
        failures: minWidths.failures + minWidths.failures * scaleFactor,
        doubles: minWidths.doubles + minWidths.doubles * scaleFactor,
        doublesPct: minWidths.doublesPct + minWidths.doublesPct * scaleFactor,
        doubleFailures:
          minWidths.doubleFailures + minWidths.doubleFailures * scaleFactor,
        triples: minWidths.triples + minWidths.triples * scaleFactor,
        triplesPct: minWidths.triplesPct + minWidths.triplesPct * scaleFactor,
        tripleFailures:
          minWidths.tripleFailures + minWidths.tripleFailures * scaleFactor,
        full15Successes:
          minWidths.full15Successes + minWidths.full15Successes * scaleFactor,
        full15Failures:
          minWidths.full15Failures + minWidths.full15Failures * scaleFactor,
        full15SuccessesPct:
          minWidths.full15SuccessesPct +
          minWidths.full15SuccessesPct * scaleFactor,
        elige8Successes:
          minWidths.elige8Successes + minWidths.elige8Successes * scaleFactor,
        elige8Failures:
          minWidths.elige8Failures + minWidths.elige8Failures * scaleFactor,
        elige8SuccessesPct:
          minWidths.elige8SuccessesPct +
          minWidths.elige8SuccessesPct * scaleFactor,
      };
    }

    // Return minimum widths if no extra space
    return minWidths;
  })();

  // Calculate column widths for the result breakdown table
  const resultColWidths = (() => {
    const resultBreakdown = stats?.resultBreakdown ?? [];
    const averageCharPx = 8;
    const paddingPx = 16;
    const toLen = (v: unknown) => String(v ?? '').length;

    // Calculate exact content lengths including headers
    const resultKeyLen = Math.max(
      '1X2'.length, // header text
      ...resultBreakdown.map((r) => toLen(r.key)),
    );
    const totalLen = Math.max(
      '∑'.length, // header text
      ...resultBreakdown.map((r) => toLen(r.total)),
    );
    const successesLen = Math.max(
      '✅'.length, // header text
      ...resultBreakdown.map((r) => toLen(r.successes)),
    );
    const failuresLen = Math.max(
      '❌'.length, // header text
      ...resultBreakdown.map((r) => toLen(r.failures)),
    );
    const percentageLen = Math.max(
      '%'.length, // header text
      ...resultBreakdown.map((r) => {
        const pct = r.total > 0 ? (r.successes / r.total) * 100 : 0;
        return (pct.toFixed(1) + '%').length;
      }),
    );

    // Calculate exact widths needed for content to fit perfectly
    const minWidths = {
      resultKey: resultKeyLen * averageCharPx + paddingPx,
      total: totalLen * averageCharPx + paddingPx,
      successes: successesLen * averageCharPx + paddingPx,
      failures: failuresLen * averageCharPx + paddingPx,
      percentage: percentageLen * averageCharPx + paddingPx,
    };

    // Calculate total minimum width
    const totalMinWidth = Object.values(minWidths).reduce(
      (sum, width) => sum + width,
      0,
    );

    // Get available screen width (reactive to rotation)
    const availableWidth = screenWidth - 40; // Account for padding

    // If we have extra space, distribute it proportionally to use full width
    if (availableWidth > totalMinWidth) {
      const extraWidth = availableWidth - totalMinWidth;
      const totalMinWidthWithoutResultKey = totalMinWidth - minWidths.resultKey;
      const scaleFactor = extraWidth / totalMinWidthWithoutResultKey;

      return {
        resultKey: minWidths.resultKey, // Keep resultKey fixed
        total: minWidths.total + minWidths.total * scaleFactor,
        successes: minWidths.successes + minWidths.successes * scaleFactor,
        failures: minWidths.failures + minWidths.failures * scaleFactor,
        percentage: minWidths.percentage + minWidths.percentage * scaleFactor,
      };
    }

    // Return minimum widths if no extra space
    return minWidths;
  })();

  const content = (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d6cdf" />
          <Text style={styles.loadingText}>{t('stats.loading')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.heading}>
            {t('stats.ranking_heading')}
          </Text>
          <View style={styles.listContent}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableScrollView}
            >
              <View style={styles.tableContent}>
                <View style={styles.headerRow}>
                  <Text
                    style={[
                      styles.position,
                      styles.headerLabel,
                      styles.columnDivider,
                      { width: colWidths.position },
                    ]}
                  >
                    #
                  </Text>
                  <View
                    style={[
                      styles.userName,
                      styles.columnDivider,
                      { width: colWidths.userName },
                    ]}
                  >
                    <View style={styles.headerUserBadge}>
                      <Ionicons name="person" size={12} color="#FF6B35" />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.successes },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelPositive,
                      ]}
                      numberOfLines={1}
                    >
                      ∑ ✅
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.failures },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelNegative,
                      ]}
                      numberOfLines={1}
                    >
                      ∑ ❌
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.successesPct },
                    ]}
                  >
                    <Text
                      style={[styles.successMetric, styles.headerLabel]}
                      numberOfLines={1}
                    >
                      ∑ %
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.doubles },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelPositive,
                      ]}
                      numberOfLines={1}
                    >
                      D ✅
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.doubleFailures },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelNegative,
                      ]}
                      numberOfLines={1}
                    >
                      D ❌
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.doublesPct },
                    ]}
                  >
                    <Text
                      style={[styles.successMetric, styles.headerLabel]}
                      numberOfLines={1}
                    >
                      D %
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.triples },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelPositive,
                      ]}
                      numberOfLines={1}
                    >
                      T ✅
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.tripleFailures },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelNegative,
                      ]}
                      numberOfLines={1}
                    >
                      T ❌
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.triplesPct },
                    ]}
                  >
                    <Text
                      style={[styles.successMetric, styles.headerLabel]}
                      numberOfLines={1}
                    >
                      T %
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.elige8Successes },
                    ]}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={styles.elige8Badge}>
                        <Text style={styles.elige8BadgeText}>8</Text>
                      </View>
                      <Text
                        style={[
                          styles.successMetric,
                          styles.headerLabel,
                          styles.headerLabelPositive,
                          { marginLeft: 6 },
                        ]}
                      >
                        ✅
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.elige8Failures },
                    ]}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={styles.elige8Badge}>
                        <Text style={styles.elige8BadgeText}>8</Text>
                      </View>
                      <Text
                        style={[
                          styles.successMetric,
                          styles.headerLabel,
                          styles.headerLabelNegative,
                          { marginLeft: 6 },
                        ]}
                      >
                        ❌
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.elige8SuccessesPct },
                    ]}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={styles.elige8Badge}>
                        <Text style={styles.elige8BadgeText}>8</Text>
                      </View>
                      <Text
                        style={[
                          styles.successMetric,
                          styles.headerLabel,
                          { marginLeft: 6 },
                        ]}
                      >
                        ε
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.full15Successes },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelPositive,
                      ]}
                      numberOfLines={1}
                    >
                      15 ✅
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: colWidths.full15Failures },
                    ]}
                  >
                    <Text
                      style={[
                        styles.successMetric,
                        styles.headerLabel,
                        styles.headerLabelNegative,
                      ]}
                      numberOfLines={1}
                    >
                      15 ❌
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      { width: colWidths.full15SuccessesPct },
                    ]}
                  >
                    <Text
                      style={[styles.successMetric, styles.headerLabel]}
                      numberOfLines={1}
                    >
                      15 %
                    </Text>
                  </View>
                </View>
                {stats?.ranking?.map((item, index) => (
                  <View key={item.user.id}>
                    {index > 0 && <View style={styles.separator} />}
                    {renderRankingItem({ item, index })}
                  </View>
                )) ?? (
                  <Text style={styles.emptyText}>
                    {t('stats.empty')}
                  </Text>
                )}
                {stats?.rankingTotal && (
                  <>
                    <View style={styles.separator} />
                    <View style={[styles.row, styles.totalRow]}>
                      <Text
                        style={[
                          styles.position,
                          styles.columnDivider,
                          { width: colWidths.position },
                          styles.totalText,
                        ]}
                      >
                        ∑
                      </Text>
                      <View
                        style={[
                          styles.userName,
                          styles.columnDivider,
                          { width: colWidths.userName },
                        ]}
                      >
                        <Text style={styles.totalText}></Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.successes },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valuePositive,
                            styles.totalText,
                          ]}
                        >
                          {(stats.rankingTotal.successes ?? 0) +
                            (stats.rankingTotal.full15Successes ?? 0)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.failures },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valueNegative,
                            styles.totalText,
                          ]}
                        >
                          {(stats.rankingTotal.failures ?? 0) +
                            (stats.rankingTotal.full15Failures ?? 0)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.successesPct },
                        ]}
                      >
                        <Text style={[styles.successMetric, styles.totalText]}>
                          {(() => {
                            const s =
                              (stats.rankingTotal.successes ?? 0) +
                              (stats.rankingTotal.full15Successes ?? 0);
                            const f =
                              (stats.rankingTotal.failures ?? 0) +
                              (stats.rankingTotal.full15Failures ?? 0);
                            const pct = s + f > 0 ? (s / (s + f)) * 100 : 0;
                            return `${pct.toFixed(1)}%`;
                          })()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.doubles },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valuePositive,
                            styles.totalText,
                          ]}
                        >
                          {stats.rankingTotal.doubleSuccesses}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.doubleFailures },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valueNegative,
                            styles.totalText,
                          ]}
                        >
                          {stats.rankingTotal.doubleFailures}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.doublesPct },
                        ]}
                      >
                        <Text style={[styles.successMetric, styles.totalText]}>
                          {stats.rankingTotal.doubleSuccessesPercentage != null
                            ? `${stats.rankingTotal.doubleSuccessesPercentage.toFixed(1)}%`
                            : '-'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.triples },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valuePositive,
                            styles.totalText,
                          ]}
                        >
                          -
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.tripleFailures },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valueNegative,
                            styles.totalText,
                          ]}
                        >
                          -
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.triplesPct },
                        ]}
                      >
                        <Text style={[styles.successMetric, styles.totalText]}>
                          -
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.elige8Successes },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valuePositive,
                            styles.totalText,
                          ]}
                        >
                          {stats.rankingTotal.elige8Successes}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.elige8Failures },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valueNegative,
                            styles.totalText,
                          ]}
                        >
                          {stats.rankingTotal.elige8Failures}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.elige8SuccessesPct },
                        ]}
                      >
                        <Text style={[styles.successMetric, styles.totalText]}>
                          {stats.rankingTotal.elige8SuccessesPercentage != null
                            ? `${stats.rankingTotal.elige8SuccessesPercentage.toFixed(1)}%`
                            : '-'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.full15Successes },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valuePositive,
                            styles.totalText,
                          ]}
                        >
                          {stats.rankingTotal.full15Successes}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          styles.columnDivider,
                          { width: colWidths.full15Failures },
                        ]}
                      >
                        <Text
                          style={[
                            styles.successMetric,
                            styles.valueNegative,
                            styles.totalText,
                          ]}
                        >
                          {stats.rankingTotal.full15Failures}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metricCell,
                          { width: colWidths.full15SuccessesPct },
                        ]}
                      >
                        <Text style={[styles.successMetric, styles.totalText]}>
                          {stats.rankingTotal.full15SuccessesPercentage != null
                            ? `${stats.rankingTotal.full15SuccessesPercentage.toFixed(1)}%`
                            : '-'}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
          {/* Animated Balance Badge */}
          <Animated.View
            style={[
              styles.balanceBadge,
              isPositive
                ? styles.balanceBadgePositive
                : styles.balanceBadgeNegative,
              { transform: [{ scale }] },
            ]}
          >
            <Text style={styles.balanceBadgeText}>
              {isPositive ? '+' : '-'}
              {displayValue}€
            </Text>
          </Animated.View>
          <Animated.View
            style={[styles.balanceBadgeGlow, { opacity: glowOpacity }]}
          />
          <Animated.View
            style={[
              styles.balanceBadgeRing,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />

          <Text style={styles.heading}>Desglose de resultados (1/X/2)</Text>
          <View style={styles.listContent}>
            {Array.isArray(stats?.resultBreakdown) &&
            stats?.resultBreakdown?.length ? (
              <>
                <View style={styles.headerRow}>
                  <Text
                    style={[
                      styles.headerLabel,
                      styles.resultKey,
                      styles.columnDivider,
                      { width: resultColWidths.resultKey },
                    ]}
                  >
                    1X2
                  </Text>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: resultColWidths.total },
                    ]}
                  >
                    <Text style={[styles.successMetric, styles.headerLabel]}>
                      ∑
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: resultColWidths.successes },
                    ]}
                  >
                    <Text style={[styles.successMetric, styles.headerLabel]}>
                      ✅
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      styles.columnDivider,
                      { width: resultColWidths.failures },
                    ]}
                  >
                    <Text style={[styles.successMetric, styles.headerLabel]}>
                      ❌
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCell,
                      { width: resultColWidths.percentage },
                    ]}
                  >
                    <Text style={[styles.successMetric, styles.headerLabel]}>
                      %
                    </Text>
                  </View>
                </View>
                {(() => {
                  const items = (stats?.resultBreakdown ??
                    []) as ResultCombinationStat[];
                  // Debug: log the order received from backend
                  console.log(
                    'Result breakdown order from backend:',
                    items.map((item) => item.key),
                  );

                  // Temporary: Force correct order in frontend to test
                  const correctOrder = [
                    '1',
                    'X',
                    '2',
                    '1X',
                    '12',
                    'X2',
                    '1X2',
                    '15',
                  ];
                  const sortedItems = items.sort((a, b) => {
                    const aIndex = correctOrder.indexOf(a.key as any);
                    const bIndex = correctOrder.indexOf(b.key as any);
                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    }
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return a.key.localeCompare(b.key);
                  });

                  return sortedItems.length > 0 ? (
                    sortedItems.map((item, index) => (
                      <View key={item.key}>
                        {index > 0 && <View style={styles.separator} />}
                        <View
                          style={[
                            styles.row,
                            item.key === 'TOTAL' ? styles.totalRow : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.resultKey,
                              styles.columnDivider,
                              item.key === 'TOTAL' ? styles.totalText : null,
                              { width: resultColWidths.resultKey },
                            ]}
                          >
                            {item.key === 'TOTAL' ? '∑' : item.key}
                          </Text>
                          <View
                            style={[
                              styles.metricCell,
                              styles.columnDivider,
                              { width: resultColWidths.total },
                            ]}
                          >
                            <Text
                              style={[
                                styles.successMetric,
                                item.key === 'TOTAL' ? styles.totalText : null,
                              ]}
                            >
                              {item.total}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.metricCell,
                              styles.columnDivider,
                              { width: resultColWidths.successes },
                            ]}
                          >
                            <Text
                              style={[
                                styles.successMetric,
                                styles.valuePositive,
                                item.key === 'TOTAL' ? styles.totalText : null,
                              ]}
                            >
                              {item.successes}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.metricCell,
                              styles.columnDivider,
                              { width: resultColWidths.failures },
                            ]}
                          >
                            <Text
                              style={[
                                styles.successMetric,
                                styles.valueNegative,
                                item.key === 'TOTAL' ? styles.totalText : null,
                              ]}
                            >
                              {item.failures}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.metricCell,
                              { width: resultColWidths.percentage },
                            ]}
                          >
                            <Text
                              style={[
                                styles.successMetric,
                                item.key === 'TOTAL' ? styles.totalText : null,
                              ]}
                            >
                              {item.successRate.toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>
                      No hay datos disponibles.
                    </Text>
                  );
                })()}
              </>
            ) : (
              <Text style={styles.emptyText}>No hay desglose disponible.</Text>
            )}
          </View>
        </>
      )}
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <ScrollView contentContainerStyle={styles.webContent}>
        {content}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.mobileScrollView}
        contentContainerStyle={styles.mobileContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
