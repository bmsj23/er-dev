import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

type DecorativeBackgroundProps = {
  variant?: 'full' | 'top-only';
};

export function DecorativeBackground({
  variant = 'full',
}: DecorativeBackgroundProps) {
  const theme = useAppTheme();

  if (variant === 'top-only') {
    return (
      <View pointerEvents="none" style={styles.topOnlyWrap}>
        <View
          style={[
            styles.blob,
            {
              backgroundColor: theme.colors.decorativePrimary,
              top: -220,
              right: -44,
              width: 312,
              height: 312,
              opacity: 0.78,
            },
          ]}
        />
      </View>
    );
  }

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
  topOnlyWrap: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    height: 160,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
});
