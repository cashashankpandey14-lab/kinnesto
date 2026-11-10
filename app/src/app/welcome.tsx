import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, hard, MAX_WIDTH, radius } from '@/lib/theme';

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;
const ROOM = img('1522708323590-d24dbb6b0267');
const PERSON = img('1534528741775-53994a69daeb', 700);

const CITIES = ['Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Gurugram', 'Chennai', 'Goa', 'Noida', 'Kolkata'];
const TYPE_COLORS = [colors.lime, colors.lilac, colors.pink, colors.tangerine, '#FFFFFF'];

const STEPS = [
  { n: '01', title: 'Drop your vibe', body: 'Budget, move-in date, areas, and the real stuff: food, sleep, cleanliness, guests, pets.' },
  { n: '02', title: 'Swipe people & places', body: 'Right on a flatmate who gets you. Right on a room you love. Every card shows a match score.' },
  { n: '03', title: 'Match, chat, move in', body: 'Mutual likes and accepted requests open a chat. No brokers. No spam calls.' },
];

const FOR_WHO = [
  { icon: 'school', title: 'Students & interns', body: 'Hostels, PGs and budget rooms near campus or your first office.' },
  { icon: 'briefcase', title: 'First-jobbers & pros', body: 'Flatshares with people on your wavelength, not random strangers.' },
  { icon: 'people', title: 'Couples & families', body: 'Entire flats and short stays while you settle into a new city.' },
  { icon: 'key', title: 'Owners & hosts', body: 'List a room, PG or BnB free, and pick tenants by vibe, not just paperwork.' },
] as const;

const VIBES = ['🌙 Night owl', '🥦 Veg', '✨ Neat freak', '🎮 Gamer', '🐶 Pet parent', '☕ WFH', '🎉 Social', '🧘 Calm'];

// Text with a hand-drawn highlighter block behind it.
function Marker({ children, color, size }: { children: string; color: string; size: number }) {
  return (
    <View style={[styles.marker, { backgroundColor: color }]}>
      <Text style={[styles.h1, { fontSize: size, lineHeight: size * 1.05 }]}>{children}</Text>
    </View>
  );
}

function Sticker({ children, color, style }: { children: ReactNode; color: string; style?: ViewStyle }) {
  return <View style={[styles.sticker, { backgroundColor: color }, style]}>{children}</View>;
}

export default function Welcome() {
  const { options } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 900;
  const h1 = wide ? 84 : width >= 420 ? 56 : 48;
  const go = () => router.push('/auth?mode=register');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ paddingTop: insets.top, overflow: 'hidden' }}>
      {/* Nav */}
      <View style={[styles.col, styles.nav]}>
        <Logo size={34} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Sign in" variant="secondary" small onPress={() => router.push('/auth?mode=login')} style={{ paddingHorizontal: 18 }} />
          {wide && <Button title="Get started" small onPress={go} style={{ paddingHorizontal: 18 }} />}
        </View>
      </View>

      {/* Hero */}
      <View style={[styles.col, styles.hero, wide && { flexDirection: 'row', alignItems: 'center', gap: 40 }]}>
        <View style={{ flex: wide ? 1.15 : undefined }}>
          <Sticker color={colors.lilac} style={{ transform: [{ rotate: '-2deg' }], marginBottom: 22 }}>
            <Text style={styles.stickerText}>🏠 Flats · PGs · Hostels · Co-living · BnBs</Text>
          </Sticker>
          <Text style={[styles.h1, { fontSize: h1, lineHeight: h1 * 1.05 }]}>Find your</Text>
          <View style={{ flexDirection: 'row' }}>
            <Marker color={colors.lime} size={h1}>
              place.
            </Marker>
          </View>
          <Text style={[styles.h1, { fontSize: h1, lineHeight: h1 * 1.05, marginTop: 6 }]}>Find your</Text>
          <View style={{ flexDirection: 'row' }}>
            <Marker color={colors.pink} size={h1}>
              people.
            </Marker>
          </View>
          <Text style={styles.lead}>
            Swipe on rooms <Text style={{ fontWeight: '800' }}>and</Text> roommates. Kinnesto matches you by budget, timing and how you actually live, so your next flat feels like home from day one.
          </Text>
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14, marginTop: 26 }}>
            <Button title="Start swiping, it’s free" icon="flash" onPress={go} style={wide ? { minWidth: 250 } : undefined} />
            <Button title="List your place" variant="place" icon="key" onPress={go} style={wide ? { minWidth: 200 } : undefined} />
          </View>
          <View style={styles.proof}>
            {['No brokers', 'No spam calls', 'Free to use'].map((t) => (
              <View key={t} style={styles.proofItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.violet} />
                <Text style={styles.proofText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card stack */}
        <View style={[styles.stage, wide ? { width: 420, height: 520 } : { height: 470, marginTop: 44 }]}>
          <View style={[styles.stackCard, styles.backCard]}>
            <Image source={{ uri: ROOM }} style={StyleSheet.absoluteFill} />
            <View style={styles.backInfo}>
              <Text style={styles.backPrice}>₹18,500/mo</Text>
              <Text style={styles.backTitle}>Sunny room · Koramangala</Text>
            </View>
          </View>
          <View style={[styles.stackCard, styles.frontCard]}>
            <Image source={{ uri: PERSON }} style={StyleSheet.absoluteFill} />
            <View style={styles.frontInfo}>
              <Text style={styles.frontName}>
                Ananya <Text style={{ fontWeight: '400', color: '#fff', fontSize: 26 }}>26</Text>
              </Text>
              <Text style={styles.frontMeta}>Product designer · has a room</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <View style={[styles.miniTag, { backgroundColor: colors.lilac }]}>
                  <Text style={styles.miniTagText}>✓ Both night owls</Text>
                </View>
                <View style={[styles.miniTag, { backgroundColor: colors.lime }]}>
                  <Text style={styles.miniTagText}>✓ Similar budget</Text>
                </View>
              </View>
            </View>
          </View>
          <Sticker color={colors.pink} style={{ position: 'absolute', top: 6, right: wide ? -14 : 4, transform: [{ rotate: '8deg' }] }}>
            <Text style={styles.stickerText}>🔥 92% vibe</Text>
          </Sticker>
          <Sticker color={colors.lime} style={{ position: 'absolute', bottom: -6, left: wide ? -26 : 0, transform: [{ rotate: '-10deg' }], paddingVertical: 8 }}>
            <Text style={[styles.stickerText, { fontSize: 22, fontWeight: '900' }]}>LIKE ♥</Text>
          </Sticker>
        </View>
      </View>

      {/* City strip: tilted and wider than the screen, so clip it to avoid sideways scrolling */}
      <View style={styles.stripClip}>
        <View style={styles.strip}>
          <Text style={styles.stripText} numberOfLines={1}>
            {[...CITIES, ...CITIES].join('  ✦  ')}
          </Text>
        </View>
      </View>

      <View style={styles.col}>
        {/* Types */}
        <Text style={styles.h2}>Every kind of home</Text>
        <View style={styles.grid}>
          {options &&
            Object.entries(options.LISTING_TYPES).map(([k, t], i) => (
              <View key={k} style={[styles.typeCard, { backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length], flexBasis: wide ? '18%' : '46%', transform: [{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }] }]}>
                <Text style={{ fontSize: 34 }}>{t.emoji}</Text>
                <Text style={styles.typeTitle}>{t.label}</Text>
                <Text style={styles.typeBody}>{t.blurb}</Text>
              </View>
            ))}
        </View>

        {/* Steps */}
        <Text style={styles.h2}>How it works</Text>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18 }}>
          {STEPS.map((s) => (
            <View key={s.n} style={[styles.step, wide && { flex: 1 }]}>
              <Text style={styles.stepNum}>{s.n}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Vibe block */}
      <View style={[styles.col, { marginTop: 56 }]}>
        <View style={[styles.vibeBlock, wide && { flexDirection: 'row', alignItems: 'center', gap: 40 }]}>
          <View style={{ flex: wide ? 1 : undefined }}>
            <Text style={[styles.h2, { color: '#fff', marginTop: 0 }]}>Your vibe, decoded.</Text>
            <Text style={[styles.lead, { color: '#D9D2F0', marginTop: 0 }]}>
              Night owl or 6am runner? Biryani every Sunday or strictly veg? We turn the little things into a match score, so the awkward flatmate talks happen before you move in, not after.
            </Text>
          </View>
          <View style={[styles.vibeChips, wide && { flex: 1 }]}>
            {VIBES.map((v, i) => (
              <View key={v} style={[styles.vibeChip, { backgroundColor: [colors.lime, colors.lilac, colors.pink, '#fff'][i % 4], transform: [{ rotate: `${(i % 3) - 1}deg` }] }]}>
                <Text style={styles.vibeChipText}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.col}>
        {/* For everyone */}
        <Text style={styles.h2}>Made for every kind of mover</Text>
        <View style={styles.grid}>
          {FOR_WHO.map((f) => (
            <View key={f.title} style={[styles.who, { flexBasis: wide ? '23%' : '100%' }]}>
              <View style={styles.whoIcon}>
                <Ionicons name={f.icon} size={22} color={colors.ink} />
              </View>
              <Text style={styles.typeTitle}>{f.title}</Text>
              <Text style={styles.typeBody}>{f.body}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Text style={[styles.h2, { marginTop: 0, textAlign: 'center', fontSize: wide ? 48 : 34 }]}>Your next home is one swipe away.</Text>
          <Button title="Create your profile" variant="place" icon="arrow-forward" onPress={go} style={{ minWidth: 240 }} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.col, { flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', gap: 14, alignItems: wide ? 'center' : 'flex-start' }]}>
          <Text style={[styles.h1, { color: colors.lime, fontSize: 30 }]}>kinnesto</Text>
          <Text style={{ color: '#A79FC2' }}>© {new Date().getFullYear()} Kinnesto · kinnesto.com · Made in India 🇮🇳</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  col: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 20 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  hero: { paddingTop: 28, paddingBottom: 56 },
  h1: { fontWeight: '900', color: colors.ink, letterSpacing: -2 },
  marker: { paddingHorizontal: 10, borderRadius: 10, marginTop: 4, transform: [{ rotate: '-1.5deg' }], borderWidth: 2.5, borderColor: colors.ink },
  lead: { color: '#3D3653', fontSize: 18, lineHeight: 28, maxWidth: 560, marginTop: 24 },
  sticker: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, ...hard(3) },
  stickerText: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  proof: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 24 },
  proofItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proofText: { fontWeight: '700', color: colors.ink },
  stage: { position: 'relative', alignSelf: 'center', width: '100%', maxWidth: 420 },
  stackCard: { position: 'absolute', borderRadius: 26, overflow: 'hidden', backgroundColor: colors.plum, ...hard(6), borderWidth: 3 },
  backCard: { top: 30, right: 0, width: '78%', height: '80%', transform: [{ rotate: '7deg' }] },
  frontCard: { top: 50, left: 0, width: '78%', height: '82%', transform: [{ rotate: '-5deg' }] },
  backInfo: { position: 'absolute', left: 0, right: 0, top: 0, padding: 16, paddingLeft: '30%', alignItems: 'flex-end', backgroundColor: 'rgba(23,17,43,0.6)' },
  backPrice: { color: colors.lime, fontWeight: '900', fontSize: 20 },
  backTitle: { color: '#fff', fontWeight: '700' },
  frontInfo: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingTop: 60, backgroundColor: 'rgba(23,17,43,0.62)' },
  frontName: { color: '#fff', fontWeight: '900', fontSize: 34, letterSpacing: -1 },
  frontMeta: { color: '#EDE8FA', fontWeight: '600' },
  miniTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.ink },
  miniTagText: { fontWeight: '800', fontSize: 12, color: colors.ink },
  stripClip: { width: '100%', overflow: 'hidden', paddingVertical: 14 },
  strip: { backgroundColor: colors.ink, paddingVertical: 16, overflow: 'hidden', transform: [{ rotate: '-1.2deg' }], width: '110%', marginLeft: '-5%' },
  stripText: { color: colors.lime, fontWeight: '900', fontSize: 24, letterSpacing: 1, textTransform: 'uppercase' },
  h2: { fontSize: 40, fontWeight: '900', color: colors.ink, letterSpacing: -1.2, marginTop: 56, marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  typeCard: { flexGrow: 1, borderRadius: radius.lg, padding: 18, gap: 4, ...hard(4) },
  typeTitle: { fontSize: 20, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 },
  typeBody: { fontSize: 14, color: '#3D3653', lineHeight: 20 },
  step: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 22, gap: 8, ...hard(4) },
  stepNum: { fontSize: 54, fontWeight: '900', color: colors.violet, letterSpacing: -2, lineHeight: 58 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.4 },
  stepBody: { fontSize: 15, color: '#3D3653', lineHeight: 22 },
  vibeBlock: { backgroundColor: colors.plum, borderRadius: 30, padding: 28, gap: 24, ...hard(6) },
  vibeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.ink },
  vibeChipText: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  who: { flexGrow: 1, backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, gap: 6, ...hard(4) },
  whoIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.ink, marginBottom: 4 },
  cta: { marginTop: 64, marginBottom: 56, backgroundColor: colors.lime, borderRadius: 30, padding: 32, alignItems: 'center', gap: 20, ...hard(6) },
  footer: { backgroundColor: colors.ink, paddingVertical: 28 },
});
