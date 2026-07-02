export const readTeamStorage = async (key: string): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
};

export const writeTeamStorage = async (
  key: string,
  value: string | null,
): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
};
