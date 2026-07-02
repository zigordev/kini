import { StyleSheet } from 'react-native';
import { palette } from './design';

type StyleValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | StyleValue[]
  | { [key: string]: StyleValue };

const darkColorMap: Record<string, string> = {
  '#F7F7F5': palette.darkBackground,
  '#F6F7F4': palette.darkBackground,
  '#FFFFFF': palette.darkSurface,
  '#F3F6F6': palette.darkSurfaceMuted,
  '#EEF3F2': palette.darkSurfaceMuted,
  '#FFF3F3': palette.darkSurfaceMuted,
  '#E7EFEE': palette.darkSurfaceMuted,
  '#FCE7E8': '#3E171A',
  '#E7F2FA': '#132F44',
  '#f3f6fc': palette.darkSurfaceMuted,
  '#f2f2f7': palette.darkSurfaceMuted,
  '#f5f5f5': palette.darkSurfaceMuted,
  '#f0f0f0': palette.darkSurfaceMuted,
  '#D8E1E1': palette.darkBorder,
  '#B9C7C6': palette.darkBorder,
  '#c7c7cc': palette.darkBorder,
  '#d0d0d0': palette.darkBorder,
  '#d7dfef': palette.darkBorder,
  '#17202A': palette.darkInk,
  '#25313F': palette.darkInk,
  '#000000': palette.darkInk,
  '#5F6B7A': palette.darkMuted,
  '#8792A2': palette.darkMuted,
  '#8E8E93': palette.darkMuted,
  '#4a5578': palette.darkMuted,
  '#556081': palette.darkMuted,
  '#A7B1BE': palette.darkMuted,
  '#a3adcb': palette.darkMuted,
  '#F4A8AC': '#7A2C31',
  '#8CBFE2': '#245878',
  '#FFF4DF': '#3D2F1D',
  '#E7F6EC': '#153A25',
  '#FDEDEC': '#3F201D',
  'rgba(18, 22, 35, 0.35)': 'rgba(0, 0, 0, 0.58)',
  'rgba(18, 22, 35, 0.25)': 'rgba(0, 0, 0, 0.48)',
  'rgba(14, 22, 45, 0.12)': 'rgba(0, 0, 0, 0.45)',
  'rgba(0, 0, 0, 0.04)': 'rgba(255, 255, 255, 0.08)',
  'rgba(0, 0, 0, 0.05)': 'rgba(255, 255, 255, 0.08)',
  'rgba(0, 0, 0, 0.08)': 'rgba(255, 255, 255, 0.12)',
  'rgba(0, 0, 0, 0.1)': 'rgba(255, 255, 255, 0.14)',
  'rgba(0, 0, 0, 0.3)': 'rgba(0, 0, 0, 0.58)',
};

const themedValue = (value: StyleValue, isDark: boolean): StyleValue => {
  if (!isDark) {
    return value;
  }

  if (typeof value === 'string') {
    return darkColorMap[value] ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => themedValue(entry, isDark));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        themedValue(entry, isDark),
      ]),
    );
  }

  return value;
};

export const createThemedStyleSheet = <T extends StyleSheet.NamedStyles<T>>(
  styles: T,
  isDark: boolean,
): T => StyleSheet.create(themedValue(styles as StyleValue, isDark) as T);
