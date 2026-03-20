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

function parseRationalComponent(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const rationalMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (rationalMatch) {
    const numerator = Number(rationalMatch[1]);
    const denominator = Number(rationalMatch[2]);

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }

    return numerator / denominator;
  }

  const numericValue = Number(trimmed);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseCoordinateValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => parseCoordinateValue(item))
      .filter((item): item is number => item !== null);

    if (parts.length === 0) {
      return null;
    }

    const [degrees, minutes = 0, seconds = 0] = parts;
    const absoluteDegrees =
      Math.abs(degrees) + minutes / 60 + seconds / 3600;

    return degrees < 0 ? -absoluteDegrees : absoluteDegrees;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const directNumeric = parseRationalComponent(trimmed);
    if (directNumeric !== null) {
      return directNumeric;
    }

    const parts = trimmed
      .split(/[,\s]+/)
      .map((part) => parseRationalComponent(part))
      .filter((part): part is number => part !== null);

    if (parts.length === 0) {
      return null;
    }

    const [degrees, minutes = 0, seconds = 0] = parts;
    const absoluteDegrees =
      Math.abs(degrees) + minutes / 60 + seconds / 3600;

    return degrees < 0 ? -absoluteDegrees : absoluteDegrees;
  }

  return null;
}

function normalizeDirection(value: unknown): 'N' | 'S' | 'E' | 'W' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return normalized === 'N' || normalized === 'S' || normalized === 'E' || normalized === 'W'
    ? normalized
    : null;
}

function applyDirection(
  coordinate: number | null,
  direction: 'N' | 'S' | 'E' | 'W' | null,
): number | null {
  if (coordinate === null) {
    return null;
  }

  if (direction === 'S' || direction === 'W') {
    return -Math.abs(coordinate);
  }

  if (direction === 'N' || direction === 'E') {
    return Math.abs(coordinate);
  }

  return coordinate;
}

export function extractCoordinatesFromExif(
  exif: Record<string, unknown> | null | undefined,
): Coordinates | null {
  if (!exif) {
    return null;
  }

  const latitude = applyDirection(
    parseCoordinateValue(
      exif.GPSLatitude ?? exif.latitude ?? exif.Latitude,
    ),
    normalizeDirection(
      exif.GPSLatitudeRef ?? exif.latitudeRef ?? exif.LatitudeRef,
    ),
  );
  const longitude = applyDirection(
    parseCoordinateValue(
      exif.GPSLongitude ?? exif.longitude ?? exif.Longitude,
    ),
    normalizeDirection(
      exif.GPSLongitudeRef ?? exif.longitudeRef ?? exif.LongitudeRef,
    ),
  );

  const coordinates =
    latitude !== null && longitude !== null
      ? {
          latitude,
          longitude,
        }
      : null;

  return coordinates && isValidCoordinatePair(coordinates) ? coordinates : null;
}
