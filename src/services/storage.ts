import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeMode, TravelEntry } from '../types/travel';
import { isValidCoordinatePair } from '../utils/address';
import { sortEntriesByNewest } from '../utils/entries';

const ENTRIES_STORAGE_KEY = '@travel-diary/entries';
const THEME_STORAGE_KEY = '@travel-diary/theme';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isValidTravelEntry(value: unknown): value is TravelEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.imageUri === 'string' &&
    value.imageUri.trim().length > 0 &&
    typeof value.address === 'string' &&
    value.address.trim().length > 0 &&
    isValidCoordinatePair(value.coordinates) &&
    isValidIsoDate(value.createdAt)
  );
}

async function clearInvalidEntriesPayload(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ENTRIES_STORAGE_KEY);
  } catch {
    // Swallow storage cleanup failures and fall back to an empty list.
  }
}

export async function loadEntriesFromStorage(): Promise<TravelEntry[]> {
  const rawValue = await AsyncStorage.getItem(ENTRIES_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      await clearInvalidEntriesPayload();
      return [];
    }

    const validEntries = parsedValue.filter(isValidTravelEntry);
    const sortedEntries = sortEntriesByNewest(validEntries);

    if (validEntries.length !== parsedValue.length) {
      await saveEntriesToStorage(sortedEntries);
    }

    return sortedEntries;
  } catch {
    await clearInvalidEntriesPayload();
    return [];
  }
}

export async function saveEntriesToStorage(entries: TravelEntry[]): Promise<void> {
  const sortedEntries = sortEntriesByNewest(entries);
  await AsyncStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(sortedEntries));
}

export async function loadThemePreference(): Promise<ThemeMode> {
  const rawValue = await AsyncStorage.getItem(THEME_STORAGE_KEY);

  if (rawValue === 'light' || rawValue === 'dark') {
    return rawValue;
  }

  if (rawValue !== null) {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      // Ignore invalid theme cleanup failures and fall back to light mode.
    }
  }

  return 'light';
}

export async function saveThemePreference(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
}
