import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { DecorativeBackground } from '../components/DecorativeBackground';
import { StatusNotice } from '../components/StatusNotice';
import {
  resolveAddressFromCoordinatesAsync,
  resolveCurrentAddressAsync,
} from '../services/location';
import {
  persistCapturedImageAsync,
  resolveLibraryPhotoCoordinatesAsync,
} from '../services/media';
import { sendEntrySavedNotificationAsync } from '../services/notifications';
import { useEntries } from '../state/EntriesContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types/navigation';
import type {
  Coordinates,
  DraftPhoto,
  LocationResolutionResult,
  TravelEntry,
} from '../types/travel';
import {
  extractCoordinatesFromExif,
  formatCoordinatePair,
} from '../utils/address';

type AddEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

type EntryCaptureMode = 'chooser' | 'camera';
type DraftSource = 'camera' | 'gallery' | null;

type SourceNotice = {
  action: 'open-settings' | 'retry-camera' | 'retry-gallery';
  message: string;
  title: string;
};

function derivePhotoFormat(
  uri: string,
  mimeType?: string | null,
  fileName?: string | null,
): DraftPhoto['format'] {
  const normalizedMime = mimeType?.toLowerCase();
  const normalizedFileName = fileName?.toLowerCase();
  const normalizedUri = uri.toLowerCase();

  if (
    normalizedMime?.includes('png') ||
    normalizedFileName?.endsWith('.png') ||
    normalizedUri.endsWith('.png')
  ) {
    return 'png';
  }

  return 'jpg';
}

function createDraftPhotoFromLibraryAsset(
  asset: ImagePicker.ImagePickerAsset,
  photoCoordinates: Coordinates | null = null,
): DraftPhoto {
  return {
    format: derivePhotoFormat(asset.uri, asset.mimeType, asset.fileName),
    height: asset.height,
    photoCoordinates,
    uri: asset.uri,
    width: asset.width,
  };
}

export function AddEntryScreen({ navigation }: AddEntryScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { addEntry } = useEntries();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [captureMode, setCaptureMode] = useState<EntryCaptureMode>('chooser');
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [draftPhoto, setDraftPhoto] = useState<DraftPhoto | null>(null);
  const [draftSource, setDraftSource] = useState<DraftSource>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] =
    useState<LocationResolutionResult | null>(null);
  const [sourceNotice, setSourceNotice] = useState<SourceNotice | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resetDraft = useCallback(() => {
    setCaptureMode('chooser');
    setDraftPhoto(null);
    setDraftSource(null);
    setResolvedAddress(null);
    setCoordinates(null);
    setLocationState(null);
    setSourceNotice(null);
    setIsResolvingLocation(false);
    setIsSaving(false);
    setSaveError(null);
    setCameraReady(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetDraft();
      };
    }, [resetDraft]),
  );

  const canSave =
    Boolean(draftPhoto && resolvedAddress && coordinates) &&
    !isResolvingLocation &&
    !isSaving;

  const resolveLocation = useCallback(async () => {
    if (!draftPhoto) {
      return;
    }

    setIsResolvingLocation(true);
    setLocationState(null);
    setResolvedAddress(null);
    setCoordinates(null);

    let result: LocationResolutionResult;

    if (draftSource === 'gallery') {
      if (!draftPhoto.photoCoordinates) {
        result = {
          kind: 'error',
          message:
            'This gallery photo does not include saved location metadata, so we cannot resolve where it was taken.',
        };
      } else {
        result = await resolveAddressFromCoordinatesAsync(
          draftPhoto.photoCoordinates,
          'photo',
        );
      }
    } else {
      result = await resolveCurrentAddressAsync();
    }

    setLocationState(result);

    if (result.kind === 'success') {
      setResolvedAddress(result.address);
      setCoordinates(result.coordinates);
    }

    setIsResolvingLocation(false);
  }, [draftPhoto, draftSource]);

  const handleUseCamera = useCallback(async () => {
    setSaveError(null);
    setSourceNotice(null);

    const permissionResponse = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (!permissionResponse.granted) {
      setCaptureMode('chooser');
      setSourceNotice({
        action: permissionResponse.canAskAgain
          ? 'retry-camera'
          : 'open-settings',
        message: permissionResponse.canAskAgain
          ? 'Camera access is required to capture a travel stamp for this diary entry.'
          : 'Camera access is turned off for this app. Open your device settings to re-enable it.',
        title: permissionResponse.canAskAgain
          ? 'Camera permission needed'
          : 'Camera blocked',
      });
      return;
    }

    setCameraReady(false);
    setCaptureMode('camera');
  }, [cameraPermission, requestCameraPermission]);

  const handlePickFromGallery = useCallback(async () => {
    setSaveError(null);
    setSourceNotice(null);
    setCaptureMode('chooser');
    setIsResolvingLocation(true);
    setLocationState(null);
    setResolvedAddress(null);
    setCoordinates(null);

    const permissionResponse = mediaLibraryPermission?.granted
      ? mediaLibraryPermission
      : await requestMediaLibraryPermission();

    if (!permissionResponse.granted) {
      setIsResolvingLocation(false);
      setSourceNotice({
        action: permissionResponse.canAskAgain
          ? 'retry-gallery'
          : 'open-settings',
        message: permissionResponse.canAskAgain
          ? 'Photo library access is needed to choose an existing image for this stamp.'
          : 'Photo library access is turned off for this app. Open your device settings to re-enable it.',
        title: permissionResponse.canAskAgain
          ? 'Gallery permission needed'
          : 'Gallery blocked',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        exif: true,
        mediaTypes: ['images'],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets?.length) {
        setIsResolvingLocation(false);
        return;
      }

      const firstAsset = result.assets[0];
      if (firstAsset.type && firstAsset.type !== 'image') {
        setIsResolvingLocation(false);
        setSaveError('Please choose an image from your gallery.');
        return;
      }

      const fallbackCoordinates = extractCoordinatesFromExif(
        (firstAsset.exif as Record<string, unknown> | null | undefined) ?? null,
      );
      const nextDraft = createDraftPhotoFromLibraryAsset(
        firstAsset,
        fallbackCoordinates,
      );
      setDraftSource('gallery');
      setDraftPhoto(nextDraft);
      setCaptureMode('chooser');

      const photoCoordinates =
        (await resolveLibraryPhotoCoordinatesAsync(firstAsset)) ??
        fallbackCoordinates;

      setDraftPhoto((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              photoCoordinates,
            }
          : currentDraft,
      );

      if (photoCoordinates) {
        const resultFromPhoto = await resolveAddressFromCoordinatesAsync(
          photoCoordinates,
          'photo',
        );
        setLocationState(resultFromPhoto);

        if (resultFromPhoto.kind === 'success') {
          setResolvedAddress(resultFromPhoto.address);
          setCoordinates(resultFromPhoto.coordinates);
        } else {
          setResolvedAddress(null);
          setCoordinates(null);
        }
      } else {
        setLocationState({
          kind: 'error',
          message:
            'This gallery photo does not include saved location metadata, so we cannot resolve where it was taken.',
        });
        setResolvedAddress(null);
        setCoordinates(null);
      }
    } catch {
      setSaveError('We could not open your gallery. Please try again.');
    } finally {
      setIsResolvingLocation(false);
    }
  }, [mediaLibraryPermission, requestMediaLibraryPermission]);

  const handleChooseAnotherPhoto = useCallback(() => {
    resetDraft();
  }, [resetDraft]);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current || !cameraReady) {
      return;
    }

    try {
      setSaveError(null);

      const capture = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        shutterSound: false,
        skipProcessing: false,
      });

      const nextPhoto: DraftPhoto = {
        format: capture.format === 'png' ? 'png' : 'jpg',
        height: capture.height,
        photoCoordinates: null,
        uri: capture.uri,
        width: capture.width,
      };

      setDraftSource('camera');
      setDraftPhoto(nextPhoto);
      setCaptureMode('chooser');
      const currentLocationResult = await resolveCurrentAddressAsync();
      setLocationState(currentLocationResult);

      if (currentLocationResult.kind === 'success') {
        setResolvedAddress(currentLocationResult.address);
        setCoordinates(currentLocationResult.coordinates);
      } else {
        setResolvedAddress(null);
        setCoordinates(null);
      }
    } catch {
      setSaveError('We could not capture the photo. Please try again.');
    }
  }, [cameraReady]);

  const handleSave = useCallback(async () => {
    if (
      !draftPhoto ||
      !resolvedAddress ||
      !coordinates ||
      isSaving ||
      isResolvingLocation
    ) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const entryId = Date.now().toString();
      const persistedImageUri = await persistCapturedImageAsync(draftPhoto, entryId);

      const entry: TravelEntry = {
        address: resolvedAddress,
        coordinates,
        createdAt: new Date().toISOString(),
        id: entryId,
        imageUri: persistedImageUri,
      };

      await addEntry(entry);

      const notificationResult = await sendEntrySavedNotificationAsync(entry);
      const notice =
        notificationResult === 'permission-denied'
          ? 'Entry saved. Notification permission is off, so no local confirmation was shown.'
          : notificationResult === 'error'
            ? 'Entry saved, but the local confirmation notification could not be delivered.'
            : undefined;

      navigation.reset({
        index: 0,
        routes: notice
          ? [{ name: 'Home', params: { notice } }]
          : [{ name: 'Home' }],
      });
    } catch {
      setSaveError('We could not save this travel entry. Please try again.');
      setIsSaving(false);
    }
  }, [
    addEntry,
    coordinates,
    draftPhoto,
    isResolvingLocation,
    isSaving,
    navigation,
    resolvedAddress,
  ]);

  const locationMessage =
    locationState && locationState.kind !== 'success'
      ? locationState.message
      : null;

  const showRetryLocationButton =
    draftPhoto &&
    !isResolvingLocation &&
    locationState &&
    (locationState.kind === 'error' ||
      locationState.kind === 'address-unavailable' ||
      (locationState.kind === 'permission-denied' && locationState.canAskAgain));

  const showOpenSettingsButton =
    locationState &&
    ((locationState.kind === 'permission-denied' && !locationState.canAskAgain) ||
      locationState.kind === 'services-disabled');

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <DecorativeBackground variant="top-only" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.introCard,
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
            NEW STAMP
          </Text>
          <Text
            style={[
              styles.introTitle,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.display,
              },
            ]}
          >
            Capture the moment, or pick one already tucked in your gallery.
          </Text>
          <Text
            style={[
              styles.introMessage,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.body,
              },
            ]}
          >
            Choose a source first. Fresh camera shots use your current location,
            while gallery images use the location saved in the photo metadata
            when it is available.
          </Text>
        </View>

        {saveError ? (
          <StatusNotice message={saveError} title="Save blocked" tone="error" />
        ) : null}

        {!draftPhoto ? (
          captureMode === 'camera' ? (
            <View
              style={[
                styles.cameraCard,
                theme.shadows.floating,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.cameraFrame,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <CameraView
                  facing={cameraFacing}
                  mode="picture"
                  onCameraReady={() => setCameraReady(true)}
                  ref={cameraRef}
                  style={styles.camera}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.cameraOverlay,
                    {
                      borderColor: theme.colors.borderStrong,
                    },
                  ]}
                />
              </View>

              <View style={styles.cameraActions}>
                <Pressable
                  onPress={() =>
                    setCameraFacing((currentFacing) =>
                      currentFacing === 'back' ? 'front' : 'back',
                    )
                  }
                  style={({ pressed }) => [
                    styles.utilityButton,
                    styles.leftUtilityButton,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                    pressed && styles.utilityPressed,
                  ]}
                >
                  <Ionicons
                    color={theme.colors.textPrimary}
                    name="camera-reverse-outline"
                    size={18}
                  />
                </Pressable>

                <Pressable
                  disabled={!cameraReady}
                  onPress={() => {
                    void handleTakePhoto();
                  }}
                  style={({ pressed }) => [
                    styles.captureButton,
                    {
                      backgroundColor: theme.colors.accentStrong,
                      borderColor: theme.colors.surface,
                      opacity: cameraReady ? 1 : 0.45,
                    },
                    pressed && cameraReady && styles.capturePressed,
                  ]}
                >
                  <View
                    style={[
                      styles.captureCore,
                      {
                        backgroundColor: theme.colors.textInverse,
                      },
                    ]}
                  />
                </Pressable>
              </View>

              <View style={styles.cameraFooter}>
                <ActionButton
                  fullWidth
                  label="Back to Photo Options"
                  onPress={() => setCaptureMode('chooser')}
                  variant="secondary"
                />
                <ActionButton
                  fullWidth
                  label="Choose from Gallery Instead"
                  onPress={() => {
                    void handlePickFromGallery();
                  }}
                  variant="ghost"
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.sourceCard,
                theme.shadows.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sourceTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.title,
                  },
                ]}
              >
                How would you like to add your stamp?
              </Text>
              <Text
                style={[
                  styles.sourceMessage,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.body,
                  },
                ]}
              >
                Take a fresh photo on the spot or choose an image from your
                gallery.
              </Text>

              {sourceNotice ? (
                <StatusNotice
                  message={sourceNotice.message}
                  title={sourceNotice.title}
                  tone="info"
                />
              ) : null}

              <View style={styles.buttonStack}>
                <ActionButton
                  fullWidth
                  icon={
                    <Ionicons
                      color={theme.colors.textInverse}
                      name="camera-outline"
                      size={18}
                    />
                  }
                  label="Take a Picture"
                  onPress={() => {
                    void handleUseCamera();
                  }}
                />
                <ActionButton
                  fullWidth
                  icon={
                    <Ionicons
                      color={theme.colors.textPrimary}
                      name="images-outline"
                      size={18}
                    />
                  }
                  label="Choose from Gallery"
                  onPress={() => {
                    void handlePickFromGallery();
                  }}
                  variant="secondary"
                />
                {sourceNotice?.action === 'open-settings' ? (
                  <ActionButton
                    fullWidth
                    label="Open Settings"
                    onPress={() => {
                      void Linking.openSettings();
                    }}
                    variant="ghost"
                  />
                ) : null}
              </View>
            </View>
          )
        ) : (
          <>
            <View
              style={[
                styles.previewCard,
                theme.shadows.floating,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Image
                accessibilityLabel="Captured travel entry photo"
                cachePolicy="memory-disk"
                contentFit="cover"
                source={draftPhoto.uri}
                style={[
                  styles.previewImage,
                  {
                    backgroundColor: theme.colors.imagePlaceholder,
                  },
                ]}
                transition={180}
              />
              <View style={styles.previewTopRow}>
                <View
                  style={[
                    styles.previewBadge,
                    {
                      backgroundColor: theme.colors.badgeBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewBadgeText,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.label,
                      },
                    ]}
                  >
                    Photo ready
                  </Text>
                </View>
                {draftSource === 'gallery' && draftPhoto.photoCoordinates ? (
                  <Text
                    style={[
                      styles.previewCoords,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.body,
                      },
                    ]}
                  >
                    From photo metadata
                  </Text>
                ) : coordinates ? (
                  <Text
                    style={[
                      styles.previewCoords,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.typography.body,
                      },
                    ]}
                  >
                    {formatCoordinatePair(coordinates)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View
              style={[
                styles.locationCard,
                theme.shadows.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.locationTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.title,
                  },
                ]}
              >
                Resolved location
              </Text>

              {isResolvingLocation ? (
                <StatusNotice
                  message={
                    draftSource === 'gallery'
                      ? "Reading the saved place from this photo's metadata and resolving it into a usable address."
                      : 'Reverse geocoding your current location into a usable address.'
                  }
                  title="Developing location"
                  tone="info"
                />
              ) : resolvedAddress ? (
                <View
                  style={[
                    styles.addressPanel,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.addressLabel,
                      {
                        color: theme.colors.textMuted,
                        fontFamily: theme.typography.label,
                      },
                    ]}
                  >
                    READY TO SAVE
                  </Text>
                  <Text
                    style={[
                      styles.addressValue,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.body,
                      },
                    ]}
                  >
                    {resolvedAddress}
                  </Text>
                </View>
              ) : locationMessage ? (
                <StatusNotice
                  message={locationMessage}
                  title="Location blocked"
                  tone="error"
                />
              ) : null}

              <View style={styles.buttonStack}>
                <ActionButton
                  fullWidth
                  label="Choose Another Photo"
                  onPress={handleChooseAnotherPhoto}
                  variant="secondary"
                />

                {showRetryLocationButton ? (
                  <ActionButton
                    fullWidth
                    label="Retry Location"
                    onPress={() => {
                      void resolveLocation();
                    }}
                    variant="ghost"
                  />
                ) : null}

                {showOpenSettingsButton ? (
                  <ActionButton
                    fullWidth
                    label="Open Settings"
                    onPress={() => {
                      void Linking.openSettings();
                    }}
                    variant="ghost"
                  />
                ) : null}

                <ActionButton
                  disabled={!canSave}
                  fullWidth
                  icon={
                    <Ionicons
                      color={theme.colors.textInverse}
                      name="bookmark-outline"
                      size={18}
                    />
                  }
                  label={isSaving ? 'Saving Entry...' : 'Save Entry'}
                  onPress={() => {
                    void handleSave();
                  }}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introCard: {
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 18,
    padding: 22,
  },
  overline: {
    fontSize: 12,
    letterSpacing: 2.2,
    lineHeight: 18,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 10,
  },
  introMessage: {
    fontSize: 15,
    lineHeight: 24,
  },
  sourceCard: {
    borderRadius: 30,
    borderWidth: 1,
    gap: 16,
    padding: 20,
  },
  sourceTitle: {
    fontSize: 20,
    lineHeight: 28,
  },
  sourceMessage: {
    fontSize: 15,
    lineHeight: 24,
  },
  cameraCard: {
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 2,
    padding: 14,
  },
  cameraFrame: {
    borderRadius: 26,
    borderWidth: 1,
    height: 420,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    borderRadius: 24,
    borderWidth: 1.5,
    bottom: 18,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 18,
  },
  cameraActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 76,
    position: 'relative',
  },
  utilityButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  leftUtilityButton: {
    left: 0,
    position: 'absolute',
  },
  utilityPressed: {
    opacity: 0.88,
  },
  captureButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  capturePressed: {
    transform: [{ scale: 0.96 }],
  },
  captureCore: {
    borderRadius: 999,
    height: 46,
    width: 46,
  },
  cameraFooter: {
    gap: 12,
    marginTop: 16,
  },
  previewCard: {
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  previewImage: {
    borderRadius: 24,
    height: 340,
    marginBottom: 14,
    width: '100%',
  },
  previewTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewBadgeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  previewCoords: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
    textAlign: 'right',
  },
  locationCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
  },
  locationTitle: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 14,
  },
  addressPanel: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  addressLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  addressValue: {
    fontSize: 15,
    lineHeight: 24,
  },
  buttonStack: {
    gap: 12,
  },
});
