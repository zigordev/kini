import AsyncStorage from '@react-native-async-storage/async-storage';

export const readTeamStorage = (key: string): Promise<string | null> =>
  AsyncStorage.getItem(key);

export const writeTeamStorage = async (
  key: string,
  value: string | null,
): Promise<void> => {
  if (value) {
    await AsyncStorage.setItem(key, value);
  } else {
    await AsyncStorage.removeItem(key);
  }
};
