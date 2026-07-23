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

type NativeButtonVariant = 'primary' | 'secondary' | 'destructive';

type NativeButtonProps = {
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
  variant?: NativeButtonVariant;
};

type NativeButtonNativeProps = {
  disabled?: boolean;
  onPress?: (event: NativeSyntheticEvent<Record<string, never>>) => void;
  style?: StyleProp<ViewStyle>;
  title: string;
  variant: NativeButtonVariant;
};

const KiniNativeButton =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeButtonNativeProps>('KiniNativeButton');

export default function NativeButton({
  disabled = false,
  onPress,
  style,
  title,
  variant = 'primary',
}: NativeButtonProps) {
  if (KiniNativeButton) {
    return (
      <KiniNativeButton
        disabled={disabled}
        onPress={onPress}
        style={[styles.nativeButton, style]}
        title={title}
        variant={variant}
      />
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.webButton,
        variant === 'primary' && styles.webButtonPrimary,
        variant === 'destructive' && styles.webButtonDestructive,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.webButtonText,
          variant !== 'secondary' && styles.webButtonTextFilled,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  nativeButton: {
    minWidth: 88,
    height: 44,
  },
  webButton: {
    minHeight: 44,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8E1E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  webButtonDestructive: {
    borderColor: '#B42318',
    backgroundColor: '#B42318',
  },
  webButtonPrimary: {
    borderColor: '#D71920',
    backgroundColor: '#D71920',
  },
  webButtonText: {
    color: '#17202A',
    fontSize: 15,
    fontWeight: '700',
  },
  webButtonTextFilled: {
    color: '#FFFFFF',
  },
});
