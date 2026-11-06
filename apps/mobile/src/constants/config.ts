import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getApiUrl(): string {
  // If explicitly provided via env
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // If running in Expo Go on a physical phone or simulator
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:4000`;
  }

  // Android emulator localhost alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  // iOS simulator or Web
  return 'http://localhost:4000';
}

export const API_BASE_URL = getApiUrl();
