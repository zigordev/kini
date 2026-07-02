import { Platform } from 'react-native';

const fallbackHost =
  Platform.OS === 'android' ? 'http://10.0.2.2:3012' : 'http://localhost:3012';

const normalizeApiBaseUrl = (url: string) => {
  if (Platform.OS !== 'android') {
    return url;
  }

  return url
    .replace('://localhost:', '://10.0.2.2:')
    .replace('://127.0.0.1:', '://10.0.2.2:');
};

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3012';
  }

  return normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackHost,
  );
};

export const API_BASE_URL = getApiBaseUrl().replace(/\/$/, '');

export const resolveApiUrl = (path: string): string => {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};
