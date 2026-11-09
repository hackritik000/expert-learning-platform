import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

function RootNavigation() {
  const { isAuthenticated, isRestoringSession, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isRestoringSession) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if unauthenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if logged in and trying to access auth pages
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestoringSession, segments, router]);

  if (isRestoringSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Home page',
        }}
      />
      <Stack.Screen
        name="educator/[id]"
        options={{
          headerShown: true,
          title: 'Educator Profile',
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          statusBarTranslucent: false,
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="educator/manage-slots"
        options={{
          headerShown: false,
          title: 'Manage Availability Slots',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="booking/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Confirm Consultation',
          headerTintColor: colors.primary,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          title: 'Consultation Chat',
          headerTintColor: colors.primary,
        }}
      />
      <Stack.Screen
        name="profile/edit-student"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="profile/edit-educator"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider statusBarTranslucent={true}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
            <RootNavigation />
          </SafeAreaView>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
