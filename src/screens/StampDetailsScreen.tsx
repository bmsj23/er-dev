import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { ActionButton } from '../components/ActionButton';
import { DecorativeBackground } from '../components/DecorativeBackground';
import { InfoChip } from '../components/InfoChip';
import { StatusNotice } from '../components/StatusNotice';
import { useEntries } from '../state/EntriesContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types/navigation';
import { formatEntryDateTime } from '../utils/date';

type StampDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'StampDetails'
>;

export function StampDetailsScreen({
  navigation,
  route,
}: StampDetailsScreenProps) {
  const theme = useAppTheme();
  const { getEntryById } = useEntries();
  const entry = getEntryById(route.params.entryId);

  if (!entry) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.fallbackScreen,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <DecorativeBackground variant="top-only" />
        <View style={styles.fallbackContent}>
          <StatusNotice
            message="This stamp was removed from your diary, so there is no saved entry to show anymore."
            title="Stamp not found"
            tone="info"
          />
          <ActionButton
            label="Return Home"
            onPress={() => navigation.popToTop()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <DecorativeBackground variant="top-only" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.imageCard,
            theme.shadows.floating,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Image
            accessibilityLabel={entry.address}
            cachePolicy="memory-disk"
            contentFit="cover"
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
              styles.imageBadge,
              {
                backgroundColor: theme.colors.badgeBackground,
              },
            ]}
          >
            <Ionicons
              color={theme.colors.accentStrong}
              name="location"
              size={14}
            />
            <Text
              style={[
                styles.imageBadgeText,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.label,
                },
              ]}
            >
              Saved stamp
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.detailsCard,
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
                fontFamily: theme.typography.label,
              },
            ]}
          >
            PASSPORT ENTRY
          </Text>
          <Text
            style={[
              styles.addressTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.display,
              },
            ]}
          >
            {entry.address}
          </Text>
          <Text
            style={[
              styles.detailMessage,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.body,
              },
            ]}
          >
            A saved travel moment with its captured place, date, and coordinate
            stamp.
          </Text>

          <View style={styles.infoGrid}>
            <InfoChip label="Created" value={formatEntryDateTime(entry.createdAt)} />
          </View>

          <View
            style={[
              styles.addressSheet,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sheetLabel,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.label,
                },
              ]}
            >
              Saved Address
            </Text>
            <Text
              style={[
                styles.sheetValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.body,
                },
              ]}
            >
              {entry.address}
            </Text>
          </View>

          <View
            style={[
              styles.addressSheet,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sheetLabel,
                {
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.label,
                },
              ]}
            >
              Latitude / Longitude
            </Text>
            <Text
              style={[
                styles.sheetValue,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.body,
                },
              ]}
            >
              {entry.coordinates.latitude.toFixed(6)}
              {'\n'}
              {entry.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  imageCard: {
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
    padding: 14,
  },
  image: {
    borderRadius: 24,
    height: 360,
    width: '100%',
  },
  imageBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 6,
  },
  detailsCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
  },
  overline: {
    fontSize: 12,
    letterSpacing: 2.2,
    lineHeight: 18,
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 10,
  },
  detailMessage: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  addressSheet: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  sheetLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sheetValue: {
    fontSize: 15,
    lineHeight: 24,
  },
  fallbackScreen: {
    flex: 1,
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
