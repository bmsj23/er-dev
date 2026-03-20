import * as Location from 'expo-location';

import type { LocationResolutionResult } from '../types/travel';
import { buildAddressFromGeocodeResult } from '../utils/address';

export async function resolveCurrentAddressAsync(): Promise<LocationResolutionResult> {
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

    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    const addresses = await Location.reverseGeocodeAsync(coordinates);
    const address = buildAddressFromGeocodeResult(addresses);

    if (!address) {
      return {
        kind: 'address-unavailable',
        message: 'We could not resolve a usable address from your current location.',
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
      message: 'We could not read your current location. Please try again.',
    };
  }
}
