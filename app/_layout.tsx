import { colors } from '@/constants/theme';
import { getToken, clearToken } from '@/lib/api';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import type { User } from '@/types/database';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, setAuth, setLoading, clear } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getToken();
        if (token) {
          const profile = await api.get<User>('/user/me');
          setAuth(token, profile);
        } else {
          clear();
        }
      } catch {
        await clearToken();
        clear();
      } finally {
        setLoading(false);
        setReady(true);
      }
    }
    bootstrap();
  }, [setAuth, setLoading, clear]);

  useEffect(() => {
    if (!ready || isLoading) return;

    const inLoginRoute = segments[0] === 'login';

    if (!user && !inLoginRoute) {
      router.replace('/login');
    } else if (user && inLoginRoute) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, ready, router]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
        </Stack>
        <StatusBar style="light" backgroundColor={colors.bgPrimary} />
      </AuthGate>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
