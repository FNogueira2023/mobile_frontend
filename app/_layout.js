import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from './theme/colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
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
      <Stack.Screen
        name="auth/login"
        options={{
          title: 'Sign In',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="register/step1"
        options={{
          title: 'Create Account',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="register/step2"
        options={{
          title: 'Complete Profile',
        }}
      />
      <Stack.Screen
        name="auth/forgot-password"
        options={{
          title: 'Reset Password',
        }}
      />
      <Stack.Screen
        name="auth/verify-code"
        options={{
          title: 'Verify Code',
        }}
      />
      <Stack.Screen
        name="auth/upgrade-to-student"
        options={{
          title: 'Upgrade Account',
        }}
      />
    </Stack>
  );
} 