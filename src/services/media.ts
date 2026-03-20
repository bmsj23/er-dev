import type { ImagePickerAsset } from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import type { Coordinates, DraftPhoto } from '../types/travel';
import {
  extractCoordinatesFromExif,
  isValidCoordinatePair,
} from '../utils/address';

const ENTRY_PHOTOS_DIRECTORY = new Directory(Paths.document, 'travel-diary-photos');

function ensureEntriesDirectory(): void {
  ENTRY_PHOTOS_DIRECTORY.create({
    idempotent: true,
    intermediates: true,
  });
}

function coordinatesFromMediaLocation(
  location: MediaLibrary.Location | null | undefined,
): Coordinates | null {
  if (!location) {
    return null;
  }

  const coordinates = {
    latitude: location.latitude,
    longitude: location.longitude,
  };

  return isValidCoordinatePair(coordinates) ? coordinates : null;
}

export async function resolveLibraryPhotoCoordinatesAsync(
  asset: ImagePickerAsset,
): Promise<Coordinates | null> {
  if (asset.assetId) {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.assetId, {
        shouldDownloadFromNetwork: true,
      });

      const coordinatesFromLocation = coordinatesFromMediaLocation(
        assetInfo.location,
      );
      if (coordinatesFromLocation) {
        return coordinatesFromLocation;
      }

      const coordinatesFromAssetExif = extractCoordinatesFromExif(
        (assetInfo.exif as Record<string, unknown> | null | undefined) ?? null,
      );
      if (coordinatesFromAssetExif) {
        return coordinatesFromAssetExif;
      }
    } catch {
      // Fall back to the picker EXIF payload below.
    }
  }

  return extractCoordinatesFromExif(
    (asset.exif as Record<string, unknown> | null | undefined) ?? null,
  );
}

export function getImageFingerprint(uri: string): string | null {
  try {
    const file = new File(uri);
    if (!file.exists) {
      return null;
    }

    const info = file.info({ md5: true });
    return info.exists ? info.md5 ?? null : null;
  } catch {
    return null;
  }
}

export async function persistCapturedImageAsync(
  photo: DraftPhoto,
  entryId: string,
): Promise<string> {
  try {
    ensureEntriesDirectory();

    const sourceFile = new File(photo.uri);
    if (!sourceFile.exists) {
      throw new Error('Captured photo is missing.');
    }

    const destinationFile = new File(
      ENTRY_PHOTOS_DIRECTORY,
      `${entryId}.${photo.format}`,
    );

    if (destinationFile.exists) {
      destinationFile.delete();
    }

    sourceFile.copy(destinationFile);

    if (!destinationFile.exists) {
      throw new Error('Destination photo was not created.');
    }

    return destinationFile.uri;
  } catch {
    throw new Error('We could not save the captured photo to app storage.');
  }
}

export async function deletePersistedImageAsync(uri: string): Promise<boolean> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }

    return true;
  } catch {
    return false;
  }
}
