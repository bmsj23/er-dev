import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';
import { DecorativeBackground } from './DecorativeBackground';

export function LoadingScreen() {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <DecorativeBackground />
      <View
        style={[
          styles.card,
          theme.shadows.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.overline,
            {
              color: theme.colors.accentStrong,
            },
          ]}
        >
          TRAVEL DIARY
        </Text>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textPrimary,
            },
          ]}
        >
          Packing your journal...
        </Text>
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          Loading saved stamps, theme colors, and fonts.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 24,
  },
});
