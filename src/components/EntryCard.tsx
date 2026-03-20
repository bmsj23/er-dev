import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';

import type { TravelEntry } from '../types/travel';
import { formatEntryDate } from '../utils/date';
import { useAppTheme } from '../theme/ThemeProvider';

type EntryCardProps = {
  entry: TravelEntry;
  onOpen: (entryId: string) => void;
  onRemove: (entry: TravelEntry) => void;
};

export const EntryCard = memo(function EntryCard({
  entry,
  onOpen,
  onRemove,
}: EntryCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        theme.shadows.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.stampLabel,
            {
              color: theme.colors.accentStrong,
              fontFamily: theme.typography.label,
            },
          ]}
        >
          TRAVEL STAMP
        </Text>
        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: theme.colors.badgeBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.dateBadgeText,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.label,
              },
            ]}
          >
            {formatEntryDate(entry.createdAt)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => onOpen(entry.id)}
        style={({ pressed }) => [
          styles.openArea,
          pressed && {
            opacity: 0.92,
            transform: [{ scale: 0.995 }],
          },
        ]}
      >
        <Image
          accessibilityLabel={entry.address}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={entry.id}
          source={entry.imageUri}
          style={[
            styles.image,
            {
              backgroundColor: theme.colors.imagePlaceholder,
            },
          ]}
          transition={180}
        />

        <View
          style={[
            styles.contentPanel,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            numberOfLines={2}
            style={[
              styles.address,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.title,
              },
            ]}
          >
            {entry.address}
          </Text>
          <Text
            style={[
              styles.hint,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.caption,
              },
            ]}
          >
            Tap to open full stamp details
          </Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.perforationRow}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.perforationDot,
                {
                  backgroundColor: theme.colors.borderStrong,
                },
              ]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onRemove(entry)}
          style={({ pressed }) => [
            styles.removeButton,
            {
              backgroundColor: theme.colors.errorBackground,
              borderColor: theme.colors.danger,
            },
            pressed && {
              opacity: 0.9,
            },
          ]}
        >
          <Text
            style={[
              styles.removeLabel,
              {
                color: theme.colors.danger,
                fontFamily: theme.typography.label,
              },
            ]}
          >
            Remove
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  stampLabel: {
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 18,
  },
  dateBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  openArea: {
    gap: 14,
  },
  image: {
    borderRadius: 22,
    height: 220,
    width: '100%',
  },
  contentPanel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  address: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  perforationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  perforationDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  removeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  removeLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
