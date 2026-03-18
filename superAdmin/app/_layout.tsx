import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { theme } from '../src/constants/theme';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  const { session, loading, isSuperAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session || !isSuperAdmin) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (session && isSuperAdmin) {
      if (inAuthGroup) {
        router.replace('/(app)/');
      }
    }
  }, [session, loading, isSuperAdmin, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
