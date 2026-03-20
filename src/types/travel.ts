export type ThemeMode = 'light' | 'dark';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type TravelEntry = {
  id: string;
  imageUri: string;
  address: string;
  coordinates: Coordinates;
  createdAt: string;
};

export type DraftPhoto = {
  uri: string;
  format: 'jpg' | 'png';
  width: number;
  height: number;
  photoCoordinates?: Coordinates | null;
};

export type LocationResolutionResult =
  | {
      kind: 'success';
      address: string;
      coordinates: Coordinates;
    }
  | {
      kind: 'permission-denied';
      message: string;
      canAskAgain: boolean;
    }
  | {
      kind: 'services-disabled';
      message: string;
    }
  | {
      kind: 'address-unavailable';
      message: string;
    }
  | {
      kind: 'error';
      message: string;
    };

export type NotificationResult = 'scheduled' | 'permission-denied' | 'error';
