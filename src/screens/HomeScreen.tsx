import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { DecorativeBackground } from '../components/DecorativeBackground';
import { EntryCard } from '../components/EntryCard';
import { StatusNotice } from '../components/StatusNotice';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useEntries } from '../state/EntriesContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types/navigation';
import type { TravelEntry } from '../types/travel';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { entries, removeEntry } = useEntries();
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    route.params?.notice ?? null,
  );

  useEffect(() => {
    if (route.params?.notice) {
      setBannerMessage(route.params.notice);
      navigation.setParams({ notice: undefined });
    }
  }, [navigation, route.params?.notice]);

  const openEntry = useCallback(
    (entryId: string) => {
      navigation.navigate('StampDetails', { entryId });
    },
    [navigation],
  );

  const deleteEntry = useCallback(
    async (entry: TravelEntry) => {
      try {
        const result = await removeEntry(entry);

        if (result.mediaDeleteFailed) {
          setBannerMessage(
            'Entry removed, but the saved image file could not be deleted cleanly.',
          );
        }
      } catch {
        Alert.alert(
          'Could not remove entry',
          'Please try removing that stamp again.',
        );
      }
    },
    [removeEntry],
  );

  const confirmDelete = useCallback(
    (entry: TravelEntry) => {
      Alert.alert(
        'Remove this stamp?',
        'This will permanently remove the saved travel entry from your diary.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              void deleteEntry(entry);
            },
          },
        ],
      );
    },
    [deleteEntry],
  );

  const renderItem = useCallback(
    ({ item }: { item: TravelEntry }) => (
      <EntryCard entry={item} onOpen={openEntry} onRemove={confirmDelete} />
    ),
    [confirmDelete, openEntry],
  );

  const keyExtractor = useCallback((item: TravelEntry) => item.id, []);

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <DecorativeBackground variant="top-only" />

      <View style={styles.topBar}>
        <View>
          <Text
            style={[
              styles.overline,
              {
                color: theme.colors.accentStrong,
                fontFamily: theme.typography.label,
              },
            ]}
          >
            TRAVEL LOG
          </Text>
          <Text
            style={[
              styles.topTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.display,
              },
            ]}
          >
            Travel Diary
          </Text>
        </View>
        <ThemeToggleButton />
      </View>

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: insets.bottom + 28,
          },
        ]}
        data={entries}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
              theme.shadows.card,
            ]}
          >
            <View
              style={[
                styles.emptyIconWrap,
                {
                  backgroundColor: theme.colors.badgeBackground,
                },
              ]}
            >
              <Ionicons
                color={theme.colors.accentStrong}
                name="airplane-outline"
                size={26}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.title,
                },
              ]}
            >
              No Entries yet
            </Text>
            <Text
              style={[
                styles.emptyMessage,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.body,
                },
              ]}
            >
              Start your journal by capturing your first travel stamp.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {bannerMessage ? (
              <StatusNotice
                message={bannerMessage}
                title="Journal notice"
                tone="info"
              />
            ) : null}

            <View
              style={[
                styles.heroCard,
                theme.shadows.floating,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.heroStampRow}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <View
                    key={`hero-dot-${index}`}
                    style={[
                      styles.heroDot,
                      {
                        backgroundColor: theme.colors.borderStrong,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.display,
                  },
                ]}
              >
                Keep every place as a soft little stamp.
              </Text>
              <Text
                style={[
                  styles.heroMessage,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.body,
                  },
                ]}
              >
                Capture a photo, resolve the place, and save it into your pastel
                passport of moments.
              </Text>

              <ActionButton
                fullWidth
                icon={
                  <Ionicons
                    color={theme.colors.textInverse}
                    name="add"
                    size={18}
                  />
                }
                label="Add Travel Entry"
                onPress={() => navigation.navigate('AddEntry')}
              />
            </View>

            {entries.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.title,
                    },
                  ]}
                >
                  Saved Stamps
                </Text>
                <Text
                  style={[
                    styles.sectionCount,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.body,
                    },
                  ]}
                >
                  {entries.length} saved
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  overline: {
    fontSize: 12,
    letterSpacing: 2.2,
    lineHeight: 18,
  },
  topTitle: {
    fontSize: 28,
    lineHeight: 36,
    marginTop: 4,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  headerContent: {
    gap: 18,
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
  },
  heroStampRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  heroDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  heroTitle: {
    fontSize: 27,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroMessage: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  sectionCount: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    marginBottom: 16,
    width: 62,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
