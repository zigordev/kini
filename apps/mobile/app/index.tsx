import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Use Redirect component instead of programmatic navigation
  return <Redirect href="/pools" />;
}
