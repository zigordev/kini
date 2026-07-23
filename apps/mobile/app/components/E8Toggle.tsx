import { memo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { palette } from '../theme/design';
import E8Badge from './E8Badge';
import NativeSwitch from './NativeSwitch';

type E8ToggleProps = {
  disabled?: boolean;
  showBadge?: boolean;
  style?: ViewStyle;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const E8Toggle = ({
  disabled = false,
  showBadge = true,
  style,
  value,
  onValueChange,
}: E8ToggleProps) => {
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, disabled && styles.disabled, style]}>
        {showBadge ? <E8Badge /> : null}
        <NativeSwitch
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
        />
      </View>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.container,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      {showBadge ? <E8Badge /> : null}
      <View style={[styles.webTrack, value && styles.webTrackActive]}>
        <View style={[styles.webThumb, value && styles.webThumbActive]} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
  webTrack: {
    width: 46,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.backgroundSubtle,
    padding: 2,
    justifyContent: 'center',
  },
  webTrackActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  webThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.white,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  webThumbActive: {
    transform: [{ translateX: 20 }],
    backgroundColor: palette.accent,
  },
});

export default memo(E8Toggle);
