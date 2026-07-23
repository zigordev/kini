import {
  NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type PoolConfigChangeEvent = {
  doubles: number;
  elige8: boolean;
  triples: number;
};

type NativePoolConfigButtonProps = {
  disabled?: boolean;
  doneTitle: string;
  doubles: number;
  doublesTitle: string;
  elige8: boolean;
  e8Title: string;
  maxDoubles: number;
  maxTriples: number;
  minDoubles?: number;
  minTriples?: number;
  onChange: (value: PoolConfigChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
  title: string;
  triples: number;
  triplesTitle: string;
};

type NativePoolConfigButtonNativeProps = Omit<
  NativePoolConfigButtonProps,
  'onChange' | 'style'
> & {
  minDoubles: number;
  minTriples: number;
  onChange?: (
    event: NativeSyntheticEvent<PoolConfigChangeEvent>,
  ) => void;
  style?: StyleProp<ViewStyle>;
};

const KiniNativePoolConfigButton =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativePoolConfigButtonNativeProps>(
        'KiniNativePoolConfigButton',
      );

export default function NativePoolConfigButton({
  disabled = false,
  minDoubles = 0,
  minTriples = 0,
  onChange,
  style,
  ...props
}: NativePoolConfigButtonProps) {
  if (!KiniNativePoolConfigButton) {
    return null;
  }

  return (
    <KiniNativePoolConfigButton
      {...props}
      disabled={disabled}
      minDoubles={minDoubles}
      minTriples={minTriples}
      onChange={(event) => onChange(event.nativeEvent)}
      style={[styles.nativeButton, disabled && styles.disabled, style]}
    />
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
});
