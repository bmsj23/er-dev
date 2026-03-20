import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

type InfoChipProps = {
  label: string;
  value: string;
};

export function InfoChip({ label, value }: InfoChipProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textMuted,
            fontFamily: theme.typography.label,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.body,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 126,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
  },
});
