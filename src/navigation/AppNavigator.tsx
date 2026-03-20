import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { StampDetailsScreen } from '../screens/StampDetailsScreen';
import { useAppTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const theme = useAppTheme();
  const detailScreenAnimation =
    Platform.OS === 'ios' ? 'simple_push' : 'slide_from_right';

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        headerBackButtonDisplayMode: 'minimal',
        headerRight: () => <ThemeToggleButton />,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.title,
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        component={HomeScreen}
        name="Home"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        component={AddEntryScreen}
        name="AddEntry"
        options={{
          animation: detailScreenAnimation,
          animationDuration: Platform.OS === 'ios' ? 240 : undefined,
          headerRight: () => null,
          title: 'Add Travel Entry',
        }}
      />
      <Stack.Screen
        component={StampDetailsScreen}
        name="StampDetails"
        options={{
          animation: detailScreenAnimation,
          animationDuration: Platform.OS === 'ios' ? 240 : undefined,
          headerRight: () => null,
          title: 'Stamp Details',
        }}
      />
    </Stack.Navigator>
  );
}
