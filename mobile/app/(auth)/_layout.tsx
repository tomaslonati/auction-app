import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register/personal-data" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="register/documents" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="register/pending" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="set-password" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
