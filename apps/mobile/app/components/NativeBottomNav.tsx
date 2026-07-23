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

export type BottomNavTab = 'available-pools' | 'pools' | 'stats' | 'profile';

type NativeBottomNavProps = {
  availablePoolsTitle: string;
  onSelect: (tab: BottomNavTab) => void;
  poolsTitle: string;
  profileTitle: string;
  selectedTab: BottomNavTab;
  statsTitle: string;
  style?: StyleProp<ViewStyle>;
};

type NativeBottomNavSelectEvent = {
  tab: BottomNavTab;
};

type NativeBottomNavNativeProps = Omit<NativeBottomNavProps, 'onSelect'> & {
  onSelect?: (event: NativeSyntheticEvent<NativeBottomNavSelectEvent>) => void;
};

const KiniNativeBottomNav =
  Platform.OS === 'web'
    ? null
    : requireNativeComponent<NativeBottomNavNativeProps>('KiniNativeBottomNav');

const tabs: BottomNavTab[] = ['available-pools', 'pools', 'stats', 'profile'];

export default function NativeBottomNav({
  availablePoolsTitle,
  onSelect,
  poolsTitle,
  profileTitle,
  selectedTab,
  statsTitle,
  style,
}: NativeBottomNavProps) {
  if (KiniNativeBottomNav) {
    return (
      <KiniNativeBottomNav
        availablePoolsTitle={availablePoolsTitle}
        onSelect={(event) => onSelect(event.nativeEvent.tab)}
        poolsTitle={poolsTitle}
        profileTitle={profileTitle}
        selectedTab={selectedTab}
        statsTitle={statsTitle}
        style={[styles.nativeBar, style]}
      />
    );
  }

  const labels: Record<BottomNavTab, string> = {
    'available-pools': availablePoolsTitle,
    pools: poolsTitle,
    stats: statsTitle,
    profile: profileTitle,
  };

  return (
    <View style={[styles.webBar, style]}>
      {tabs.map((tab) => {
        const selected = tab === selectedTab;

        return (
          <Pressable
            key={tab}
            onPress={() => onSelect(tab)}
            style={[styles.webTab, selected && styles.webTabSelected]}
          >
            <Text style={[styles.webLabel, selected && styles.webLabelSelected]}>
              {labels[tab]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nativeBar: {
    width: '100%',
    height: Platform.OS === 'ios' ? 83 : 68,
    backgroundColor: 'transparent',
  },
  webBar: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D8E1E1',
    backgroundColor: '#FFFFFF',
  },
  webLabel: {
    color: '#8792A2',
    fontSize: 11,
    fontWeight: '700',
  },
  webLabelSelected: {
    color: '#D71920',
  },
  webTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTabSelected: {
    backgroundColor: '#FFF3F3',
  },
});
