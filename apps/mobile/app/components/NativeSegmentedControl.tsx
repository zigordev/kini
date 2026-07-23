import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  requireNativeComponent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

export type NativeSegmentedOption = {
  label: string;
  value: string;
};

type NativeSegmentedControlProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  options: NativeSegmentedOption[];
  selectedValue: string;
  style?: StyleProp<ViewStyle>;
};

type NativeSegmentedControlChangeEvent = {
  value: string;
};

type NativeSegmentedControlNativeProps = {
  disabled?: boolean;
  onChange?: (
    event: NativeSyntheticEvent<NativeSegmentedControlChangeEvent>,
  ) => void;
  optionsJson: string;
  selectedValue: string;
  style?: StyleProp<ViewStyle>;
};

const KiniNativeSegmentedControl =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeSegmentedControlNativeProps>(
        'KiniNativeSegmentedControl',
      );

export default function NativeSegmentedControl({
  disabled = false,
  onChange,
  options,
  selectedValue,
  style,
}: NativeSegmentedControlProps) {
  if (KiniNativeSegmentedControl) {
    return (
      <KiniNativeSegmentedControl
        disabled={disabled}
        onChange={(event) => onChange(event.nativeEvent.value)}
        optionsJson={JSON.stringify(options)}
        selectedValue={selectedValue}
        style={[styles.nativeControl, style]}
      />
    );
  }

  return (
    <View style={[styles.webControl, disabled && styles.disabled, style]}>
      {options.map((option) => {
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.webSegment, selected && styles.webSegmentSelected]}
          >
            <Text
              style={[
                styles.webSegmentText,
                selected && styles.webSegmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.55,
  },
  nativeControl: {
    height: 36,
    minWidth: 160,
  },
  webControl: {
    minHeight: 36,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  webSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  webSegmentSelected: {
    backgroundColor: '#D71920',
  },
  webSegmentText: {
    color: '#17202A',
    fontSize: 14,
    fontWeight: '700',
  },
  webSegmentTextSelected: {
    color: '#FFFFFF',
  },
});
