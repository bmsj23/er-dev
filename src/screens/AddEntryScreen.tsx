import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { persistCapturedImageAsync } from '../services/media';
import { resolveCurrentAddressAsync } from '../services/location';
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
import { formatCoordinatePair } from '../utils/address';

type AddEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

export function AddEntryScreen({ navigation }: AddEntryScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { addEntry } = useEntries();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [draftPhoto, setDraftPhoto] = useState<DraftPhoto | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] =
    useState<LocationResolutionResult | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (cameraPermission?.granted) {
      setCameraVisible(true);
    }
  }, [cameraPermission?.granted]);

  const resetDraft = useCallback(() => {
    setDraftPhoto(null);
    setResolvedAddress(null);
    setCoordinates(null);
    setLocationState(null);
    setIsResolvingLocation(false);
    setIsSaving(false);
    setSaveError(null);
    setCameraReady(false);
    setCameraVisible(Boolean(cameraPermission?.granted));
  }, [cameraPermission?.granted]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetDraft();
      };
    }, [resetDraft]),
  );

  const canSave = Boolean(draftPhoto && resolvedAddress && coordinates) &&
    !isResolvingLocation &&
    !isSaving;

  const resolveLocation = useCallback(async () => {
    setIsResolvingLocation(true);
    setLocationState(null);
    setResolvedAddress(null);
    setCoordinates(null);

    const result = await resolveCurrentAddressAsync();
    setLocationState(result);

    if (result.kind === 'success') {
      setResolvedAddress(result.address);
      setCoordinates(result.coordinates);
    }

    setIsResolvingLocation(false);
  }, []);

  const handleEnableCamera = useCallback(async () => {
    setSaveError(null);

    if (cameraPermission?.granted) {
      setCameraVisible(true);
      return;
    }

    if (cameraPermission && !cameraPermission.canAskAgain) {
      await Linking.openSettings();
      return;
    }

    const permissionResponse = await requestCameraPermission();
    if (permissionResponse.granted) {
      setCameraVisible(true);
    }
  }, [cameraPermission, requestCameraPermission]);

  const handleRetake = useCallback(() => {
    setDraftPhoto(null);
    setResolvedAddress(null);
    setCoordinates(null);
    setLocationState(null);
    setIsResolvingLocation(false);
    setSaveError(null);
    setCameraReady(false);
    setCameraVisible(Boolean(cameraPermission?.granted));
  }, [cameraPermission?.granted]);

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
        uri: capture.uri,
        format: capture.format === 'png' ? 'png' : 'jpg',
        width: capture.width,
        height: capture.height,
      };

      setDraftPhoto(nextPhoto);
      setCameraVisible(false);
      await resolveLocation();
    } catch {
      setSaveError('We could not capture the photo. Please try again.');
    }
  }, [cameraReady, resolveLocation]);

  const handleSave = useCallback(async () => {
    if (!draftPhoto || !resolvedAddress || !coordinates || isSaving || isResolvingLocation) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const entryId = Date.now().toString();
      const persistedImageUri = await persistCapturedImageAsync(draftPhoto, entryId);

      const entry: TravelEntry = {
        id: entryId,
        imageUri: persistedImageUri,
        address: resolvedAddress,
        coordinates,
        createdAt: new Date().toISOString(),
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
        routes: notice ? [{ name: 'Home', params: { notice } }] : [{ name: 'Home' }],
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
            Capture the moment, then let the place find itself.
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
            You can only save when the photo, coordinates, and resolved address are
            all ready.
          </Text>
        </View>

        {saveError ? (
          <StatusNotice
            message={saveError}
            title="Save blocked"
            tone="error"
          />
        ) : null}

        {!draftPhoto ? (
          cameraPermission?.granted && cameraVisible ? (
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
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceMuted,
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
                    pressed && {
                      opacity: 0.88,
                    },
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
                    pressed && cameraReady && {
                      transform: [{ scale: 0.96 }],
                    },
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
            </View>
          ) : (
            <View
              style={[
                styles.permissionCard,
                theme.shadows.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <StatusNotice
                message={
                  cameraPermission && !cameraPermission.canAskAgain
                    ? 'Camera access is turned off for this app. Open your device settings to re-enable it.'
                    : 'Camera access is required to capture a travel stamp for this diary entry.'
                }
                title={
                  cameraPermission && !cameraPermission.canAskAgain
                    ? 'Camera blocked'
                    : 'Camera permission needed'
                }
                tone="info"
              />

              <ActionButton
                fullWidth
                icon={
                  <Ionicons
                    color={theme.colors.textInverse}
                    name="camera-outline"
                    size={18}
                  />
                }
                label={
                  cameraPermission && !cameraPermission.canAskAgain
                    ? 'Open Settings'
                    : 'Enable Camera'
                }
                onPress={() => {
                  void handleEnableCamera();
                }}
              />
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
                    Film preview
                  </Text>
                </View>
                {coordinates ? (
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
                  message="Reverse geocoding your current location into a usable address."
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
                  label="Retake Photo"
                  onPress={handleRetake}
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
  permissionCard: {
    borderRadius: 30,
    borderWidth: 1,
    gap: 16,
    padding: 20,
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
  captureButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  captureCore: {
    borderRadius: 999,
    height: 46,
    width: 46,
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
