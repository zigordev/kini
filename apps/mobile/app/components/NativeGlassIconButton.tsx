import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  requireNativeComponent,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

type NativeGlassIconButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  iconName?: 'plus' | 'sync';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

type NativeGlassIconButtonNativeProps = {
  accessibilityLabelText?: string;
  disabled?: boolean;
  iconName: string;
  onPress?: (event: NativeSyntheticEvent<Record<string, never>>) => void;
  style?: StyleProp<ViewStyle>;
};

const KiniNativeGlassIconButton =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeGlassIconButtonNativeProps>(
        'KiniNativeGlassIconButton',
      );

export default function NativeGlassIconButton({
  accessibilityLabel,
  disabled = false,
  iconName = 'plus',
  onPress,
  style,
}: NativeGlassIconButtonProps) {
  if (KiniNativeGlassIconButton) {
    return (
      <KiniNativeGlassIconButton
        accessibilityLabelText={accessibilityLabel}
        disabled={disabled}
        iconName={iconName}
        onPress={onPress}
        style={[styles.nativeButton, disabled && styles.disabled, style]}
      />
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.webButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.webIcon}>{iconName === 'sync' ? '↻' : '+'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  nativeButton: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.78,
  },
  webButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  webIcon: {
    color: '#D71920',
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 32,
  },
});
