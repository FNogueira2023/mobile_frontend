import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.secondary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Recipe App',
        }}
      />
      <Stack.Screen
        name="recipe"
        options={{
          title: 'Recipe Details',
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: 'My Favorites',
        }}
      />
    </Stack>
  );
} 