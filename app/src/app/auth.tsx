import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { LogoMark } from '@/components/Logo';
import { SocialSignIn } from '@/components/SocialSignIn';
import { Button, ErrorText, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';
import { Linking, Platform } from 'react-native';

const webLink = (href: string) => (Platform.OS === 'web' ? ({ href, role: 'link' } as object) : { onPress: () => Linking.openURL(`https://kinnesto.com${href}`) });

export default function Auth() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(params.mode === 'login' ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const onSocialDone = useCallback(() => router.replace('/'), []);
  const onSocialError = useCallback((msg: string) => setError(msg), []);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await (isLogin ? signIn : signUp)(email, password);
      router.replace('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen width={440}>
      <View style={{ alignItems: 'center', marginVertical: 20, gap: 14 }}>
        <LogoMark size={56} />
        <Text style={{ fontSize: 28, fontWeight: '900', color: colors.ink }}>{isLogin ? 'Welcome back' : 'Join Kinnesto'}</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>{isLogin ? 'Sign in to your matches and chats.' : 'Find a room, a flatmate, or both.'}</Text>
      </View>
      <SocialSignIn onDone={onSocialDone} onError={onSocialError} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={isLogin ? 'current-password' : 'new-password'}
        placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
        onSubmitEditing={submit}
      />
      <ErrorText>{error}</ErrorText>
      <Button title={isLogin ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} disabled={!email || !password} />
      {isLogin && (
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 14 }}>
          Forgot your password? Use “Continue with Google” with the same email to get back in, or write to hello@kinnesto.com.
        </Text>
      )}
      {!isLogin && (
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 18 }}>
          By creating an account you agree to our <Text {...webLink('/terms')} style={{ color: colors.ink, fontWeight: '600', textDecorationLine: 'underline' }}>Terms</Text> and{' '}
          <Text {...webLink('/privacy')} style={{ color: colors.ink, fontWeight: '600', textDecorationLine: 'underline' }}>Privacy Policy</Text>. You must be 18 or older.
        </Text>
      )}
      <Pressable onPress={() => setMode(isLogin ? 'register' : 'login')} style={{ marginTop: 18, alignItems: 'center' }}>
        <Text style={{ color: colors.brand, fontWeight: '700' }}>{isLogin ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text>
      </Pressable>
      {__DEV__ ? (
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24 }}>Demo: ananya@demo.kinnesto.app / kinnesto123</Text>
      ) : null}
    </Screen>
  );
}
