import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTeams } from './contexts/TeamContext';
import useAuth from './hooks/useAuth';
import { palette } from './theme/design';

export default function IndexScreen() {
  const { user, loading: authLoading } = useAuth();
  const { selectedTeam, loading: teamsLoading } = useTeams();

  if (authLoading || (user && teamsLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <Redirect href={(user && selectedTeam ? '/pools' : '/teams') as Href} />
  );
}
