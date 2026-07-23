import {
  NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

type NativeNumberSelectProps = {
  disabled?: boolean;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  title: string;
  value: number;
};

type NativeStepperChangeEvent = {
  value: number;
};

type NativeStepperProps = {
  disabled?: boolean;
  maximumValue: number;
  minimumValue: number;
  onChange?: (event: NativeSyntheticEvent<NativeStepperChangeEvent>) => void;
  step: number;
  style?: StyleProp<ViewStyle>;
  value: number;
};

const KiniNativeStepper =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeStepperProps>('KiniNativeStepper');

export default function NativeNumberSelect({
  disabled = false,
  max,
  min = 0,
  onChange,
  style,
  value,
}: NativeNumberSelectProps) {
  if (!KiniNativeStepper) {
    return null;
  }

  return (
    <KiniNativeStepper
      disabled={disabled}
      maximumValue={max}
      minimumValue={min}
      onChange={(event) => onChange(event.nativeEvent.value)}
      step={1}
      style={[
        Platform.OS === 'ios' ? styles.iosStepper : styles.androidStepper,
        disabled && styles.disabled,
        style,
      ]}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  androidStepper: {
    width: 86,
    height: 56,
  },
  disabled: {
    opacity: 0.45,
  },
  iosStepper: {
    width: 96,
    height: 32,
  },
});
