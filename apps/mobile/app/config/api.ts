import { Platform } from 'react-native';

const fallbackHost =
  Platform.OS === 'android' ? 'http://10.0.2.2:3010' : 'http://localhost:3012';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3012';
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackHost;
};

export const API_BASE_URL = getApiBaseUrl().replace(/\/$/, '');

export const resolveApiUrl = (path: string): string => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};
