import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

export function DecorativeBackground() {
  const theme = useAppTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.blob,
          {
            backgroundColor: theme.colors.decorativePrimary,
            top: -120,
            right: -80,
            width: 260,
            height: 260,
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            backgroundColor: theme.colors.decorativeSecondary,
            bottom: 120,
            left: -120,
            width: 280,
            height: 280,
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            backgroundColor: theme.colors.accentMuted,
            bottom: -70,
            right: 30,
            width: 170,
            height: 170,
            opacity: 0.35,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
});
