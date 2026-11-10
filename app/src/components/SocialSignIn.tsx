import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { Text } from './Text';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Couldn't load ${src}`));
    document.head.appendChild(s);
  });
}

// "Continue with Google / Facebook" on the website. The server says which providers are configured;
// buttons stay hidden until their IDs are set. Native apps need the native SDKs (a dev build) first.
export function SocialSignIn({ onDone, onError }: { onDone: () => void; onError: (msg: string) => void }) {
  const { signInWith } = useAuth();
  const [ids, setIds] = useState<{ google: string | null; facebook: string | null } | null>(null);
  const [fbReady, setFbReady] = useState(false);
  const googleBox = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    api<{ google: string | null; facebook: string | null }>('/auth/providers').then(setIds).catch(() => setIds({ google: null, facebook: null }));
  }, []);

  useEffect(() => {
    if (!ids?.google) return;
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        window.google.accounts.id.initialize({
          client_id: ids.google,
          callback: async ({ credential }: { credential: string }) => {
            try {
              await signInWith('google', { credential });
              onDone();
            } catch (e: any) {
              onError(e.message);
            }
          },
        });
        const el = googleBox.current as unknown as HTMLElement;
        window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(el.offsetWidth || 360, 400) });
      })
      .catch((e) => onError(e.message));
  }, [ids?.google, signInWith, onDone, onError]);

  useEffect(() => {
    if (!ids?.facebook) return;
    window.fbAsyncInit = () => {
      window.FB.init({ appId: ids.facebook, cookie: false, xfbml: false, version: 'v21.0' });
      setFbReady(true);
    };
    loadScript('https://connect.facebook.net/en_US/sdk.js').catch((e) => onError(e.message));
    if (window.FB) window.fbAsyncInit();
  }, [ids?.facebook, onError]);

  function facebook() {
    window.FB.login(
      async (res: any) => {
        if (!res.authResponse) return; // closed the popup
        try {
          await signInWith('facebook', { accessToken: res.authResponse.accessToken });
          onDone();
        } catch (e: any) {
          onError(e.message);
        }
      },
      { scope: 'public_profile,email' }
    );
  }

  if (Platform.OS !== 'web' || !ids || (!ids.google && !ids.facebook)) return null;
  return (
    <View style={{ gap: 12, marginBottom: 6 }}>
      {ids.google && <View ref={googleBox} style={styles.google} />}
      {ids.facebook && (
        <Pressable onPress={facebook} disabled={!fbReady} style={({ pressed }) => [styles.fb, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }, !fbReady && { opacity: 0.5 }]}>
          <Ionicons name="logo-facebook" size={20} color="#fff" />
          <Text style={styles.fbText}>Continue with Facebook</Text>
        </Pressable>
      )}
      <View style={styles.or}>
        <View style={styles.line} />
        <Text style={styles.orText}>or with email</Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  google: { minHeight: 44, alignItems: 'center' },
  fb: { height: 46, borderRadius: radius.pill, backgroundColor: '#1877F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  fbText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  line: { flex: 1, height: 2, backgroundColor: colors.line },
  orText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
});
