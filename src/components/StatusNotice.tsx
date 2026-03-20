import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

type NoticeTone = 'info' | 'error' | 'success';

type StatusNoticeProps = {
  title: string;
  message: string;
  tone?: NoticeTone;
};

function resolveNoticeColors(
  tone: NoticeTone,
  theme: ReturnType<typeof useAppTheme>,
) {
  switch (tone) {
    case 'error':
      return {
        backgroundColor: theme.colors.errorBackground,
        borderColor: theme.colors.danger,
        titleColor: theme.colors.danger,
      };
    case 'success':
      return {
        backgroundColor: theme.colors.infoBackground,
        borderColor: theme.colors.success,
        titleColor: theme.colors.success,
      };
    case 'info':
    default:
      return {
        backgroundColor: theme.colors.infoBackground,
        borderColor: theme.colors.borderStrong,
        titleColor: theme.colors.textPrimary,
      };
  }
}

export function StatusNotice({
  title,
  message,
  tone = 'info',
}: StatusNoticeProps) {
  const theme = useAppTheme();
  const colors = resolveNoticeColors(tone, theme);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: colors.titleColor,
            fontFamily: theme.typography.title,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.body,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
  },
});
