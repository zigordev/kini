import { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { palette } from '../theme/design';

type E8BadgeProps = {
  style?: ViewStyle;
};

const E8Badge = ({ style }: E8BadgeProps) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.text}>E8</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    minWidth: 28,
    minHeight: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
  },
});

export default memo(E8Badge);
