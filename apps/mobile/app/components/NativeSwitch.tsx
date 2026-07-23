import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  requireNativeComponent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

type NativeSwitchProps = {
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
  value: boolean;
};

type NativeSwitchChangeEvent = {
  value: boolean;
};

type NativeSwitchNativeProps = {
  checked: boolean;
  disabled?: boolean;
  onChange?: (event: NativeSyntheticEvent<NativeSwitchChangeEvent>) => void;
  style?: StyleProp<ViewStyle>;
};

const KiniNativeSwitch =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeSwitchNativeProps>('KiniNativeSwitch');

export default function NativeSwitch({
  disabled = false,
  onValueChange,
  style,
  value,
}: NativeSwitchProps) {
  if (KiniNativeSwitch) {
    return (
      <KiniNativeSwitch
        checked={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.nativeEvent.value)}
        style={[styles.nativeSwitch, disabled && styles.disabled, style]}
      />
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.webTrack,
        value && styles.webTrackActive,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={[styles.webThumb, value && styles.webThumbActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.55,
  },
  nativeSwitch: {
    width: Platform.OS === 'ios' ? 52 : 58,
    height: Platform.OS === 'ios' ? 32 : 48,
  },
  webThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  webThumbActive: {
    transform: [{ translateX: 20 }],
    backgroundColor: '#0A70B5',
  },
  webTrack: {
    width: 46,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B9C7C6',
    backgroundColor: '#F1F4F4',
    padding: 2,
    justifyContent: 'center',
  },
  webTrackActive: {
    borderColor: '#0A70B5',
    backgroundColor: '#DDEFFF',
  },
});
