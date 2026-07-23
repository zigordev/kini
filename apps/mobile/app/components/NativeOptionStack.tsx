import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  requireNativeComponent,
} from 'react-native';

type NativeOptionStackOutcome = 'failure' | 'neutral' | 'success';

type NativeOptionStackProps = {
  disabled?: boolean;
  onSelect: (value: string) => void;
  options: string[];
  outcome?: NativeOptionStackOutcome;
  selectedOptions: string[];
  style?: StyleProp<ViewStyle>;
};

type NativeOptionStackSelectEvent = {
  value: string;
};

type NativeOptionStackNativeProps = {
  disabled?: boolean;
  onSelect?: (
    event: NativeSyntheticEvent<NativeOptionStackSelectEvent>,
  ) => void;
  optionsJson: string;
  outcome: NativeOptionStackOutcome;
  selectedOptionsJson: string;
  style?: StyleProp<ViewStyle>;
};

const KiniNativeOptionStack =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeOptionStackNativeProps>(
        'KiniNativeOptionStack',
      );

export default function NativeOptionStack({
  disabled = false,
  onSelect,
  options,
  outcome = 'neutral',
  selectedOptions,
  style,
}: NativeOptionStackProps) {
  if (KiniNativeOptionStack) {
    return (
      <KiniNativeOptionStack
        disabled={disabled}
        onSelect={(event) => onSelect(event.nativeEvent.value)}
        optionsJson={JSON.stringify(options)}
        outcome={outcome}
        selectedOptionsJson={JSON.stringify(selectedOptions)}
        style={[styles.nativeStack, style]}
      />
    );
  }

  return (
    <View style={[styles.webStack, style]}>
      {options.map((option) => {
        const selected = selectedOptions.includes(option);
        return (
          <Pressable
            key={option}
            disabled={disabled}
            onPress={() => onSelect(option)}
            style={[
              styles.webButton,
              selected && styles.webButtonSelectedNeutral,
              selected && outcome === 'success' && styles.webButtonSuccess,
              selected && outcome === 'failure' && styles.webButtonFailure,
              disabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.webButtonText,
                selected && styles.webButtonTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.7,
  },
  nativeStack: {
    width: Platform.OS === 'android' ? 128 : 102,
    height: Platform.OS === 'android' ? 40 : 34,
  },
  webButton: {
    width: 34,
    height: 34,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#B9C7C6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  webButtonFailure: {
    borderColor: '#B42318',
    backgroundColor: '#B42318',
  },
  webButtonSelectedNeutral: {
    borderColor: '#374151',
    backgroundColor: '#4B5563',
  },
  webButtonSuccess: {
    borderColor: '#157F3B',
    backgroundColor: '#157F3B',
  },
  webButtonText: {
    color: '#25313F',
    fontSize: 14,
    fontWeight: '600',
  },
  webButtonTextSelected: {
    color: '#FFFFFF',
  },
  webStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
