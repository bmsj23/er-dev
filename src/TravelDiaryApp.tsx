import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from './components/LoadingScreen';
import { AppNavigator } from './navigation/AppNavigator';
import { initializeNotificationsAsync } from './services/notifications';
import { EntriesProvider, useEntries } from './state/EntriesContext';
import { ThemeProvider, useThemePreference } from './theme/ThemeProvider';

export default function TravelDiaryApp() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <EntriesProvider>
            <AppBootstrap />
          </EntriesProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppBootstrap() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const { hydrated: entriesHydrated } = useEntries();
  const { mode, theme, hydrated: themeHydrated } = useThemePreference();

  useEffect(() => {
    void initializeNotificationsAsync();
  }, []);

  if (!fontsLoaded || !entriesHydrated || !themeHydrated) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.background}
        style={mode === 'dark' ? 'light' : 'dark'}
      />
      <NavigationContainer theme={theme.navigation}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
