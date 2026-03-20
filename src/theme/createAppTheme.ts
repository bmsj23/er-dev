import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { Platform, type ViewStyle } from 'react-native';

import type { ThemeMode } from '../types/travel';

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceElevated: string;
    surfaceMuted: string;
    card: string;
    border: string;
    borderStrong: string;
    accent: string;
    accentStrong: string;
    accentMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    danger: string;
    success: string;
    infoBackground: string;
    errorBackground: string;
    badgeBackground: string;
    imagePlaceholder: string;
    shadow: string;
    decorativePrimary: string;
    decorativeSecondary: string;
    scrim: string;
  };
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    display: string;
    title: string;
    subtitle: string;
    body: string;
    label: string;
    caption: string;
  };
  shadows: {
    card: ViewStyle;
    soft: ViewStyle;
    floating: ViewStyle;
  };
  navigation: NavigationTheme;
};

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

const typography = {
  display: 'Poppins_700Bold',
  title: 'Poppins_600SemiBold',
  subtitle: 'Poppins_500Medium',
  body: 'Poppins_400Regular',
  label: 'Poppins_500Medium',
  caption: 'Poppins_400Regular',
};

function createShadow(
  color: string,
  opacity: number,
  radiusValue: number,
  elevation: number,
  height: number,
): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radiusValue,
      shadowOffset: {
        width: 0,
        height,
      },
    },
    default: {
      elevation,
      shadowColor: color,
    },
  })!;
}

const lightPalette = {
  background: '#FFF7F8',
  backgroundAlt: '#FDEEF2',
  surface: '#FFFDFC',
  surfaceElevated: '#FFF3F6',
  surfaceMuted: '#F8E9EE',
  card: '#FFF9F6',
  border: '#EBCDD8',
  borderStrong: '#DDA8BB',
  accent: '#E883A7',
  accentStrong: '#CB668B',
  accentMuted: '#F5CDD9',
  textPrimary: '#3D2230',
  textSecondary: '#734E5E',
  textMuted: '#9C7787',
  textInverse: '#FFF8FA',
  danger: '#C55C79',
  success: '#5F9175',
  infoBackground: '#FFF0F5',
  errorBackground: '#FFF1F1',
  badgeBackground: '#FCE3EB',
  imagePlaceholder: '#F1D8E1',
  shadow: '#B67B95',
  decorativePrimary: '#F3CAD8',
  decorativeSecondary: '#FBE4DB',
  scrim: '#00000022',
};

const darkPalette = {
  background: '#0F0C10',
  backgroundAlt: '#181319',
  surface: '#181217',
  surfaceElevated: '#221A21',
  surfaceMuted: '#2C2229',
  card: '#1C151B',
  border: '#3F2D38',
  borderStrong: '#6E4B5B',
  accent: '#F09AB8',
  accentStrong: '#FF7FA7',
  accentMuted: '#543847',
  textPrimary: '#FFF2F6',
  textSecondary: '#E0C1CD',
  textMuted: '#B994A3',
  textInverse: '#171117',
  danger: '#FF93B1',
  success: '#88C0A1',
  infoBackground: '#2A1D25',
  errorBackground: '#341F28',
  badgeBackground: '#302029',
  imagePlaceholder: '#3B2C36',
  shadow: '#000000',
  decorativePrimary: '#3C2230',
  decorativeSecondary: '#2A1B24',
  scrim: '#00000055',
};

export function createAppTheme(mode: ThemeMode): AppTheme {
  const colors = mode === 'dark' ? darkPalette : lightPalette;
  const baseNavigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    mode,
    colors,
    spacing,
    radius,
    typography,
    shadows: {
      card: createShadow(colors.shadow, mode === 'dark' ? 0.34 : 0.16, 18, 8, 12),
      soft: createShadow(colors.shadow, mode === 'dark' ? 0.2 : 0.1, 10, 4, 6),
      floating: createShadow(
        colors.shadow,
        mode === 'dark' ? 0.42 : 0.22,
        24,
        12,
        16,
      ),
    },
    navigation: {
      ...baseNavigationTheme,
      colors: {
        ...baseNavigationTheme.colors,
        background: colors.background,
        card: colors.surface,
        border: colors.border,
        notification: colors.accentStrong,
        primary: colors.accentStrong,
        text: colors.textPrimary,
      },
    },
  };
}
