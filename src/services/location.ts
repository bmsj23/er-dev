import * as Location from 'expo-location';

import type { Coordinates, LocationResolutionResult } from '../types/travel';
import { buildAddressFromGeocodeResult } from '../utils/address';

async function ensureLocationPermission(): Promise<
  | {
      kind: 'granted';
    }
  | Exclude<LocationResolutionResult, { kind: 'success' }>
> {
  try {
    const locationPermission = await Location.requestForegroundPermissionsAsync();

    if (!locationPermission.granted) {
      return {
        kind: 'permission-denied',
        message: locationPermission.canAskAgain
          ? 'Location access is needed to resolve an address before saving this stamp.'
          : 'Location access is turned off for this app. Enable it in Settings to save this stamp.',
        canAskAgain: locationPermission.canAskAgain,
      };
    }

    return {
      kind: 'granted',
    };
  } catch {
    return {
      kind: 'error',
      message: 'We could not access location permissions. Please try again.',
    };
  }
}

export async function resolveAddressFromCoordinatesAsync(
  coordinates: Coordinates,
  source: 'device' | 'photo' = 'device',
): Promise<LocationResolutionResult> {
  const permissionResult = await ensureLocationPermission();
  if (permissionResult.kind !== 'granted') {
    return permissionResult;
  }

  try {
    const addresses = await Location.reverseGeocodeAsync(coordinates);
    const address = buildAddressFromGeocodeResult(addresses);

    if (!address) {
      return {
        kind: 'address-unavailable',
        message:
          source === 'photo'
            ? "We could not resolve a usable address from this photo's saved capture location."
            : 'We could not resolve a usable address from your current location.',
      };
    }

    return {
      kind: 'success',
      address,
      coordinates,
    };
  } catch {
    return {
      kind: 'error',
      message:
        source === 'photo'
          ? "We could not read this photo's saved location. Please try a different photo."
          : 'We could not read your current location. Please try again.',
    };
  }
}

export async function resolveCurrentAddressAsync(): Promise<LocationResolutionResult> {
  const permissionResult = await ensureLocationPermission();
  if (permissionResult.kind !== 'granted') {
    return permissionResult;
  }

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        kind: 'services-disabled',
        message: 'Location services are turned off on this device. Turn them on before saving this stamp.',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return resolveAddressFromCoordinatesAsync(
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      'device',
    );
  } catch {
    return {
      kind: 'error',
      message: 'We could not read your current location. Please try again.',
    };
  }
}
