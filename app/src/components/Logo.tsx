import { Image, View } from 'react-native';
import { Text } from '@/components/Text';
import { colors } from '@/lib/theme';

// The app icon itself (swipe cards + house with a heart), drawn by design/make_icons.py.
const ICON = require('../../assets/icon.png');

export function LogoMark({ size = 36 }: { size?: number }) {
  return <Image source={ICON} style={{ width: size, height: size, borderRadius: size * 0.26 }} accessibilityLabel="Kinnesto" />;
}

export function Logo({ size = 36, light }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      <Text style={{ fontSize: size * 0.7, fontWeight: '900', letterSpacing: -0.9, color: light ? '#fff' : colors.ink }}>kinnesto</Text>
    </View>
  );
}
