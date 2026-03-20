import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  compact?: boolean;
};

function resolveVariantColors(
  variant: ButtonVariant,
  theme: ReturnType<typeof useAppTheme>,
) {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        textColor: theme.colors.textPrimary,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: theme.colors.border,
        textColor: theme.colors.textSecondary,
      };
    case 'danger':
      return {
        backgroundColor: theme.colors.errorBackground,
        borderColor: theme.colors.danger,
        textColor: theme.colors.danger,
      };
    case 'primary':
    default:
      return {
        backgroundColor: theme.colors.accentStrong,
        borderColor: theme.colors.accentStrong,
        textColor: theme.colors.textInverse,
      };
  }
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  fullWidth = false,
  compact = false,
}: ActionButtonProps) {
  const theme = useAppTheme();
  const variantColors = resolveVariantColors(variant, theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantColors.backgroundColor,
          borderColor: variantColors.borderColor,
          paddingHorizontal: compact ? theme.spacing.md : theme.spacing.lg,
          paddingVertical: compact ? theme.spacing.sm : theme.spacing.md,
          opacity: disabled ? 0.45 : 1,
        },
        theme.shadows.soft,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <Text
          style={[
            styles.label,
            {
              color: variantColors.textColor,
              fontFamily: theme.typography.label,
              fontSize: compact ? 14 : 15,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    lineHeight: 20,
  },
});
