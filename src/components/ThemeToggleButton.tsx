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
        theme.shadows.soft,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        <Ionicons
          color={theme.colors.accentStrong}
          name={mode === 'dark' ? 'sunny' : 'moon'}
          size={18}
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
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
