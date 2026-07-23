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

export type NativeSelectOption = {
  label: string;
  value: string;
};

type NativeSelectProps = {
  appearance?: 'field' | 'primary';
  disabled?: boolean;
  onChange: (value: string) => void;
  options: NativeSelectOption[];
  placeholder?: string;
  selectedValue: string;
  style?: StyleProp<ViewStyle>;
  title: string;
};

type NativeSelectChangeEvent = {
  value: string;
};

type NativeSelectNativeProps = {
  appearance: 'field' | 'primary';
  disabled?: boolean;
  onChange?: (event: NativeSyntheticEvent<NativeSelectChangeEvent>) => void;
  optionsJson: string;
  placeholder: string;
  selectedValue: string;
  style?: StyleProp<ViewStyle>;
  title: string;
};

const KiniNativeSelect =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeSelectNativeProps>('KiniNativeSelect');

export default function NativeSelect({
  appearance = 'field',
  disabled = false,
  onChange,
  options,
  placeholder = '',
  selectedValue,
  style,
  title,
}: NativeSelectProps) {
  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ??
    placeholder;

  if (KiniNativeSelect) {
    return (
      <KiniNativeSelect
        appearance={appearance}
        disabled={disabled}
        onChange={(event) => onChange(event.nativeEvent.value)}
        optionsJson={JSON.stringify(options)}
        placeholder={placeholder}
        selectedValue={selectedValue}
        style={[styles.nativeSelect, disabled && styles.disabled, style]}
        title={title}
      />
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        const next = options.find((option) => option.value !== selectedValue);
        if (next) {
          onChange(next.value);
        }
      }}
      style={[
        styles.webSelect,
        appearance === 'primary' && styles.webSelectPrimary,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.webSelectText,
          appearance === 'primary' && styles.webSelectTextPrimary,
        ]}
        numberOfLines={1}
      >
        {selectedLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.55,
  },
  nativeSelect: {
    minHeight: 44,
    width: '100%',
  },
  webSelect: {
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  webSelectPrimary: {
    alignItems: 'center',
    borderColor: '#D71920',
    backgroundColor: '#D71920',
  },
  webSelectText: {
    color: '#17202A',
    fontSize: 15,
    fontWeight: '700',
  },
  webSelectTextPrimary: {
    color: '#FFFFFF',
  },
});
