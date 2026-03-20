import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useThemePreference } from '../theme/ThemeProvider';

export function ThemeToggleButton() {
  const { mode, theme, toggleTheme } = useThemePreference();

  return (
    <Pressable
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        theme.shadows.floating,
        {
          backgroundColor:
            mode === 'dark' ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor:
            mode === 'dark' ? theme.colors.borderStrong : theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.outerHighlight,
          {
            backgroundColor:
              mode === 'dark'
                ? `${theme.colors.textInverse}10`
                : `${theme.colors.textInverse}A6`,
          },
        ]}
      />
      <View
        style={[
          styles.innerRing,
          {
            backgroundColor:
              mode === 'dark' ? theme.colors.surfaceMuted : theme.colors.background,
            borderColor:
              mode === 'dark'
                ? theme.colors.accentMuted
                : theme.colors.borderStrong,
          },
        ]}
      >
        <Ionicons
          color={mode === 'dark' ? theme.colors.accent : theme.colors.accentStrong}
          name={mode === 'dark' ? 'sunny' : 'moon'}
          size={20}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 50,
  },
  outerHighlight: {
    borderRadius: 999,
    height: 26,
    left: 7,
    position: 'absolute',
    top: 5,
    width: 36,
  },
  innerRing: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
