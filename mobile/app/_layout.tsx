import '../global.css';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { User } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function AppSplash() {
  return (
    <LinearGradient
      colors={['#6A7472', '#D7E0DD', '#FEFFFF']}
      style={splash.container}
    >
      <View style={splash.content}>
        <View style={splash.logoBox}>
          <Text style={splash.logoLetter}>A</Text>
        </View>
        <Text style={splash.appName}>Aucty</Text>
        <Text style={splash.tagline}>Subastas en tiempo real</Text>
      </View>
      <ActivityIndicator color="rgba(255,255,255,0.6)" style={splash.loader} />
    </LinearGradient>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading, setSession, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data } = await api.get<User>('/api/users/me');
        setUser(data);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inApp = segments[0] === '(app)';

    if (!session && !inAuth) {
      router.replace('/(auth)');
    } else if (session && !inApp) {
      router.replace('/(app)/(tabs)' as never);
    }
  }, [session, isLoading, segments]);

  if (isLoading) return <AppSplash />;

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <AppSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthGate>
    </GestureHandlerRootView>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoLetter: {
    fontSize: 44,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    lineHeight: 52,
  },
  appName: {
    fontSize: 36,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.3,
  },
  loader: {
    position: 'absolute',
    bottom: 60,
  },
});
