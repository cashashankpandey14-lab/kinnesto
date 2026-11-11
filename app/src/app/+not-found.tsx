import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { LogoMark } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Button } from '@/components/ui';
import { colors } from '@/lib/theme';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: 'Page not found', headerShown: false }} />
      <LogoMark size={56} />
      <Text style={{ fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.8, textAlign: 'center' }}>This page doesn’t exist</Text>
      <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center', maxWidth: 380 }}>The link may be old or mistyped. Let’s get you back to finding a place.</Text>
      <Button title="Go to Kinnesto" onPress={() => router.replace('/')} style={{ minWidth: 220, marginTop: 6 }} />
    </View>
  );
}
