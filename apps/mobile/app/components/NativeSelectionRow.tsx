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

type NativeSelectionRowProps = {
  disabled?: boolean;
  onPress: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
};

type NativeSelectionRowNativeProps = {
  disabled?: boolean;
  onPress?: (event: NativeSyntheticEvent<Record<string, never>>) => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
};

const KiniNativeSelectionRow =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeSelectionRowNativeProps>(
        'KiniNativeSelectionRow',
      );

export default function NativeSelectionRow({
  disabled = false,
  onPress,
  selected = false,
  style,
  title,
}: NativeSelectionRowProps) {
  if (KiniNativeSelectionRow) {
    return (
      <KiniNativeSelectionRow
        disabled={disabled}
        onPress={onPress}
        selected={selected}
        style={[styles.nativeRow, style]}
        title={title}
      />
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.webRow,
        selected && styles.webRowSelected,
        pressed && styles.webRowPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.webIcon, selected && styles.webIconSelected]}>
        <Text style={styles.webIconText}>{selected ? '✓' : ''}</Text>
      </View>
      <Text style={styles.webTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.webChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  nativeRow: {
    minHeight: 54,
    width: '100%',
  },
  webChevron: {
    color: '#8792A2',
    fontSize: 22,
    fontWeight: '700',
  },
  webIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE7E8',
  },
  webIconSelected: {
    backgroundColor: '#D71920',
  },
  webIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  webRow: {
    minHeight: 54,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D8E1E1',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  webRowPressed: {
    opacity: 0.82,
  },
  webRowSelected: {
    borderColor: '#D71920',
    backgroundColor: '#FFF3F3',
  },
  webTitle: {
    flex: 1,
    minWidth: 0,
    color: '#17202A',
    fontSize: 16,
    fontWeight: '800',
  },
});
