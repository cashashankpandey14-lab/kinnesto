import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { Text } from './Text';

// Native Google sign-in. Asking for the web client ID makes Google issue an ID token for that audience,
// so the server verifies it exactly like a sign-in from the website.
export function NativeGoogleButton({ webClientId, onDone, onError }: { webClientId: string; onDone: () => void; onError: (msg: string) => void }) {
  const { signInWith } = useAuth();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      GoogleSignin.configure({ webClientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      if (!isSuccessResponse(res)) return; // closed the account picker
      if (!res.data.idToken) throw new Error('Google didn’t return a sign-in token, please try again');
      await signInWith('google', { credential: res.data.idToken });
      onDone();
    } catch (e: any) {
      if (isErrorWithCode(e) && (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)) return;
      onError(isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ? 'Google Play services are needed for Google sign-in' : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable onPress={go} disabled={busy} style={({ pressed }) => [styles.btn, (pressed || busy) && { opacity: 0.7 }]} accessibilityRole="button">
      <Ionicons name="logo-google" size={19} color={colors.ink} />
      <Text style={styles.text}>Continue with Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 48, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  text: { color: colors.ink, fontWeight: '800', fontSize: 15 },
});
