import type { LocationGeocodedAddress } from 'expo-location';

import type { Coordinates } from '../types/travel';

function normalizeSegment(value: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueSegments(values: Array<string | null>): string[] {
  const seen = new Set<string>();

  return values.reduce<string[]>((segments, value) => {
    const normalized = normalizeSegment(value);

    if (!normalized) {
      return segments;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return segments;
    }

    seen.add(key);
    segments.push(normalized);
    return segments;
  }, []);
}

export function buildAddressFromGeocodeResult(
  places: LocationGeocodedAddress[],
): string | null {
  const firstMatch = places[0];

  if (!firstMatch) {
    return null;
  }

  const formattedAddress = normalizeSegment(firstMatch.formattedAddress ?? null);
  if (formattedAddress && formattedAddress.length >= 8) {
    return formattedAddress;
  }

  const streetLine = uniqueSegments([
    [firstMatch.streetNumber, firstMatch.street].filter(Boolean).join(' '),
    firstMatch.name,
  ]);

  const localityLine = uniqueSegments([
    firstMatch.district,
    firstMatch.city,
    firstMatch.subregion,
    firstMatch.region,
    firstMatch.country,
  ]);

  const combined = uniqueSegments([...streetLine, ...localityLine]);
  return combined.length >= 2 ? combined.join(', ') : null;
}

export function formatCoordinatePair(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
}

export function isValidCoordinatePair(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Coordinates>;
  return (
    typeof candidate.latitude === 'number' &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === 'number' &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}
