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

type NativeDatePickerProps = {
  disabled?: boolean;
  label: string;
  onChange: (value: Date) => void;
  style?: StyleProp<ViewStyle>;
  value: Date;
};

type NativeDatePickerChangeEvent = {
  value: number;
};

type NativeDatePickerNativeProps = {
  disabled?: boolean;
  label: string;
  onChange?: (event: NativeSyntheticEvent<NativeDatePickerChangeEvent>) => void;
  style?: StyleProp<ViewStyle>;
  value: number;
};

const KiniNativeDatePicker =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeDatePickerNativeProps>(
        'KiniNativeDatePicker',
      );

export default function NativeDatePicker({
  disabled = false,
  label,
  onChange,
  style,
  value,
}: NativeDatePickerProps) {
  if (KiniNativeDatePicker) {
    return (
      <KiniNativeDatePicker
        disabled={disabled}
        label={label}
        onChange={(event) => onChange(new Date(event.nativeEvent.value))}
        style={[styles.nativeDatePicker, disabled && styles.disabled, style]}
        value={value.getTime()}
      />
    );
  }

  return (
    <Pressable disabled={disabled} style={[styles.webButton, style]}>
      <Text style={styles.webButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.55,
  },
  nativeDatePicker: {
    minWidth: Platform.OS === 'ios' ? 140 : 156,
    height: Platform.OS === 'ios' ? 40 : 44,
  },
  webButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  webButtonText: {
    color: '#17202A',
    fontSize: 15,
    fontWeight: '700',
  },
});
