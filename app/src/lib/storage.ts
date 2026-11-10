import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore (Keychain / Keystore) on devices; localStorage on web.
export const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem('kn_token');
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync('kn_token');
  },
  async set(token: string | null) {
    if (Platform.OS === 'web') {
      try {
        if (token) localStorage.setItem('kn_token', token);
        else localStorage.removeItem('kn_token');
      } catch {}
      return;
    }
    if (token) await SecureStore.setItemAsync('kn_token', token);
    else await SecureStore.deleteItemAsync('kn_token');
  },
};
