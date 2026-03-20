import { Directory, File, Paths } from 'expo-file-system';

import type { DraftPhoto } from '../types/travel';

const ENTRY_PHOTOS_DIRECTORY = new Directory(Paths.document, 'travel-diary-photos');

function ensureEntriesDirectory(): void {
  ENTRY_PHOTOS_DIRECTORY.create({
    idempotent: true,
    intermediates: true,
  });
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
