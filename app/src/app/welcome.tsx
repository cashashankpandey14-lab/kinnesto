import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Button } from '@/components/ui';
import { colors, MAX_WIDTH, radius, shadow } from '@/lib/theme';

const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop`;
const HERO = img('1502672260266-1c1ef2d93688', 1400);
const OWNER = img('1556020685-ae41abfc9365');
const FACE = img('1580489944761-15a19d654956', 300);

const TYPES = [
  { key: 'Flats & flatshares', body: 'Private rooms in shared flats, or a whole apartment.', photo: img('1522708323590-d24dbb6b0267', 700) },
  { key: 'PGs', body: 'Paying-guest rooms, often with meals and housekeeping.', photo: img('1540518614846-7eded433c457', 700) },
  { key: 'Hostels', body: 'Budget beds for students and interns, by the month.', photo: img('1555854877-bab0e564b8d5', 700) },
  { key: 'Co-living', body: 'Managed shared homes with bills and cleaning included.', photo: img('1560448204-e02f11c3d0e2', 700) },
  { key: 'BnB stays', body: 'Short stays while you house-hunt or travel.', photo: img('1631049307264-da0ec9d70304', 700) },
];

const AREAS = ['Andheri', 'Bandra', 'Powai', 'Lower Parel', 'Goregaon', 'Malad', 'Chembur', 'Kandivali', 'Thane', 'Vashi'];

const LOOKING = ['A room', 'A PG', 'A flatmate', 'A short stay'];

const FEATURES = [
  { icon: 'pulse', title: 'Compatibility, scored', body: 'Every flatmate and every listing shows a match score built from budget, move-in date and how you actually live.' },
  { icon: 'chatbubbles-outline', title: 'Talk directly', body: 'Mutual likes and accepted requests open a private chat with the owner or flatmate. No middlemen.' },
  { icon: 'shield-checkmark-outline', title: 'Built for safety', body: 'Only the area is public, never the exact address. Block and report in two taps.' },
] as const;

const BREAKDOWN: [string, number][] = [
  ['Sleep schedule', 100],
  ['Food habits', 100],
  ['Budget overlap', 90],
  ['Cleanliness', 80],
  ['Guests', 60],
];

const FAQ = [
  ['Is Kinnesto free?', 'Yes. Creating a profile, swiping, matching, chatting and listing a place are all free. There is no brokerage.'],
  ['How is the match score calculated?', 'From your budget and move-in date, what you are looking for, and lifestyle answers like sleep schedule, food, cleanliness, guests and pets. The reasons are shown on every card.'],
  ['Which cities are live?', 'Mumbai, from Andheri and Bandra to Powai, Thane and Navi Mumbai. More cities are coming soon.'],
];

// react-native-web renders a Text with href as a real <a>, which crawlers follow.
const webLink = (href: string) => (Platform.OS === 'web' ? ({ href, role: 'link' } as object) : { onPress: () => Linking.openURL(`https://kinnesto.com${href}`) });

export default function Welcome() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 960;
  const mid = width >= 640;
  const [looking, setLooking] = useState(LOOKING[0]);
  const [open, setOpen] = useState<number | null>(0);
  const go = () => router.push('/auth?mode=register');
  const h1 = wide ? 64 : mid ? 50 : 40;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={{ paddingTop: insets.top }}>
      {/* Nav */}
      <View style={[styles.col, styles.nav]}>
        <Logo size={30} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wide ? 28 : 8 }}>
          {wide && (
            <>
              <Text {...webLink('/in/mumbai')} style={styles.navLink}>Mumbai</Text>
              <Text {...webLink('/about')} style={styles.navLink}>About</Text>
              <Text {...webLink('/safety')} style={styles.navLink}>Safety</Text>
            </>
          )}
          <Button title="Sign in" variant="ghost" small onPress={() => router.push('/auth?mode=login')} />
          <Button title="Get started" small onPress={go} />
        </View>
      </View>

      {/* Hero */}
      <View style={[styles.col, styles.hero, wide && { flexDirection: 'row', alignItems: 'center', gap: 56 }]}>
        <View style={{ flex: wide ? 1 : undefined, maxWidth: 580 }}>
          <View style={styles.eyebrow}>
            <View style={styles.liveDot} />
            <Text style={styles.eyebrowText}>Now live in Mumbai</Text>
          </View>
          <Text style={[styles.h1, { fontSize: h1, lineHeight: h1 * 1.08 }]}>
            Find your place.{'\n'}
            <Text style={{ color: colors.brand }}>And the people to share it with.</Text>
          </Text>
          <Text style={styles.lead}>Flats, PGs, hostels, co-living and stays across Mumbai, plus flatmates matched on budget, timing and lifestyle. Free, with no brokers.</Text>

          {/* Search-style starter */}
          <View style={[styles.search, !mid && { flexDirection: 'column', alignItems: 'stretch', paddingLeft: 14 }]}>
            <View style={styles.searchCity}>
              <Ionicons name="location-outline" size={18} color={colors.muted} />
              <View>
                <Text style={styles.searchLabel}>City</Text>
                <Text style={styles.searchValue}>Mumbai</Text>
              </View>
            </View>
            {mid && <View style={styles.searchDivider} />}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.searchLabel, { marginLeft: 4 }]}>Looking for</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {LOOKING.map((l) => (
                  <Pressable key={l} onPress={() => setLooking(l)} style={[styles.lookChip, looking === l && styles.lookChipOn]} accessibilityState={{ selected: looking === l }}>
                    <Text style={[styles.lookText, looking === l && { color: '#fff' }]}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Button title="Start" icon="arrow-forward" onPress={go} style={mid ? { alignSelf: 'center' } : undefined} />
          </View>
          <View style={styles.trust}>
            {['Free to use', 'No brokerage', 'Direct chat with owners'].map((t) => (
              <View key={t} style={styles.trustItem}>
                <Ionicons name="checkmark" size={16} color={colors.sea} />
                <Text style={styles.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Visual */}
        <View style={[styles.visual, wide ? { flex: 1, height: 560 } : { height: mid ? 520 : 440, marginTop: 40 }]}>
          <Image source={{ uri: HERO }} style={styles.heroImg} accessibilityLabel="Bright living room in a shared flat" />
          <View style={[styles.floatCard, { left: wide ? -36 : 12, bottom: 28 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: FACE }} style={styles.face} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fcName}>Priya, 27</Text>
                <Text style={styles.fcMeta}>Analyst · has a room in Bandra</Text>
              </View>
              <View style={styles.score}>
                <Text style={styles.scoreNum}>91%</Text>
              </View>
            </View>
            <View style={styles.fcDivider} />
            {['Both early risers', 'Similar budget', 'Moving in December'].map((r) => (
              <View key={r} style={styles.fcRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.sea} />
                <Text style={styles.fcReason}>{r}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.floatChip, { right: wide ? -20 : 12, top: 28 }]}>
            <Ionicons name="home" size={14} color={colors.marigold} />
            <Text style={styles.floatChipText}>Room in Bandra West · ₹32,000/mo</Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={[styles.col, styles.section]}>
        <Text style={styles.kicker}>Why Kinnesto</Text>
        <Text style={[styles.h2, wide && { maxWidth: 720 }]}>Most rental sites stop at the room. We match the people too.</Text>
        <View style={[styles.grid3, { marginTop: 36 }]}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.feature, { flexBasis: wide ? '30%' : '100%' }]}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color={colors.brand} />
              </View>
              <Text style={styles.h3}>{f.title}</Text>
              <Text style={styles.body}>{f.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Compatibility band */}
      <View style={styles.dark}>
        <View style={[styles.col, { paddingVertical: wide ? 88 : 64 }, wide && { flexDirection: 'row', alignItems: 'center', gap: 64 }]}>
          <View style={{ flex: wide ? 1 : undefined }}>
            <Text style={[styles.kicker, { color: colors.marigold }]}>Vibe match</Text>
            <Text style={[styles.h2, { color: '#fff' }]}>Know how you’ll live together before you move in.</Text>
            <Text style={[styles.body, { color: '#BDB8CA', fontSize: 17, lineHeight: 27, marginTop: 16 }]}>
              Night owl or early riser? Weekend guests or quiet evenings? Kinnesto turns everyday habits into a clear score, so the important conversations happen at the start, not three months into a lease.
            </Text>
          </View>
          <View style={[styles.breakdown, { flex: wide ? 0.9 : undefined, marginTop: wide ? 0 : 36 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <View>
                <Text style={styles.bdLabel}>Example match</Text>
                <Text style={styles.bdTitle}>You and Priya</Text>
              </View>
              <Text style={styles.bdTotal}>91%</Text>
            </View>
            {BREAKDOWN.map(([k, v]) => (
              <View key={k} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.bdRow}>{k}</Text>
                  <Text style={styles.bdVal}>{v}%</Text>
                </View>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${v}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Types */}
      <View style={[styles.col, styles.section]}>
        <Text style={styles.kicker}>Every kind of home</Text>
        <Text style={styles.h2}>From a PG near college to a flat in Bandra.</Text>
        <View style={[styles.types, { marginTop: 36 }]}>
          {TYPES.map((t) => (
            <View key={t.key} style={[styles.type, { flexBasis: wide ? '18%' : mid ? '30%' : '46%' }]}>
              <Image source={{ uri: t.photo }} style={styles.typeImg} />
              <View style={{ padding: 14, gap: 4 }}>
                <Text style={styles.typeTitle}>{t.key}</Text>
                <Text style={styles.typeBody}>{t.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.areas}>
          <Text style={styles.areasLabel}>Popular in Mumbai</Text>
          {AREAS.map((a) => (
            <View key={a} style={styles.area}>
              <Text style={styles.areaText}>{a}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Steps */}
      <View style={[styles.col, styles.section, { paddingTop: 0 }]}>
        <Text style={styles.kicker}>How it works</Text>
        <Text style={styles.h2}>Three steps to your next home.</Text>
        <View style={[styles.grid3, { marginTop: 36 }]}>
          {[
            ['Create your profile', 'Add your budget, move-in date, preferred areas and a few lifestyle answers. It takes two minutes.'],
            ['Swipe on people and places', 'Like a flatmate or a room. Every card shows a score and the reasons behind it.'],
            ['Match and move in', 'When the interest is mutual, chat directly, plan a visit and agree terms. No brokerage.'],
          ].map(([t, b], i) => (
            <View key={t} style={[styles.step, { flexBasis: wide ? '30%' : '100%' }]}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.h3}>{t}</Text>
              <Text style={styles.body}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Owners */}
      <View style={[styles.col, { paddingBottom: 88 }]}>
        <View style={[styles.owner, wide && { flexDirection: 'row' }]}>
          <Image source={{ uri: OWNER }} style={[styles.ownerImg, wide ? { width: '46%', minHeight: 380 } : { height: 240 }]} />
          <View style={{ flex: 1, padding: wide ? 48 : 24, justifyContent: 'center' }}>
            <Text style={styles.kicker}>For owners and hosts</Text>
            <Text style={[styles.h2, { fontSize: wide ? 34 : 28, lineHeight: wide ? 40 : 34 }]}>List a room, PG or stay. Choose who moves in.</Text>
            {['Free to list, no commission', 'Requests arrive with a profile and match score', 'Accept, chat and confirm in one place'].map((p) => (
              <View key={p} style={[styles.trustItem, { marginTop: 12 }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.sea} />
                <Text style={[styles.body, { color: colors.ink2 }]}>{p}</Text>
              </View>
            ))}
            <Button title="List your place" variant="place" onPress={go} style={{ alignSelf: 'flex-start', marginTop: 24 }} />
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={[styles.col, { paddingBottom: 88, maxWidth: 820 }]}>
        <Text style={[styles.h2, { textAlign: 'center', marginBottom: 28 }]}>Questions</Text>
        {FAQ.map(([q, a], i) => (
          <Pressable key={q} onPress={() => setOpen(open === i ? null : i)} style={styles.faq} accessibilityRole="button" accessibilityState={{ expanded: open === i }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Text style={styles.faqQ}>{q}</Text>
              <Ionicons name={open === i ? 'remove' : 'add'} size={20} color={colors.ink} />
            </View>
            {open === i && <Text style={[styles.body, { marginTop: 10 }]}>{a}</Text>}
          </Pressable>
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.col, { paddingBottom: 72 }]}>
        <View style={styles.cta}>
          <Text style={[styles.h2, { color: '#fff', textAlign: 'center', maxWidth: 640 }]}>Your next home in Mumbai starts here.</Text>
          <Text style={[styles.body, { color: '#BDB8CA', textAlign: 'center' }]}>Create a free profile in two minutes.</Text>
          <Button title="Get started" variant="accent" icon="arrow-forward" onPress={go} style={{ minWidth: 220, marginTop: 8 }} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.col, { flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', gap: 28 }]}>
          <View style={{ gap: 10, maxWidth: 320 }}>
            <Text style={styles.footBrand}>kinnesto</Text>
            <Text style={styles.footText}>Find your place and the people to share it with. Made in India.</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 56, flexWrap: 'wrap' }}>
            <View style={{ gap: 10 }}>
              <Text style={styles.footHead}>Explore</Text>
              <Text {...webLink('/in/mumbai')} style={styles.footLink}>Mumbai</Text>
              <Text {...webLink('/about')} style={styles.footLink}>About</Text>
              <Text {...webLink('/safety')} style={styles.footLink}>Safety</Text>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={styles.footHead}>Legal</Text>
              <Text {...webLink('/privacy')} style={styles.footLink}>Privacy</Text>
              <Text {...webLink('/terms')} style={styles.footLink}>Terms</Text>
              <Text {...webLink('/delete-account')} style={styles.footLink}>Delete account</Text>
            </View>
          </View>
        </View>
        <View style={[styles.col, { marginTop: 36 }]}>
          <Text style={styles.footText}>© {new Date().getFullYear()} Kinnesto · kinnesto.com</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  col: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 20 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  navLink: { fontWeight: '600', color: colors.ink2, fontSize: 15 },
  hero: { paddingTop: 36, paddingBottom: 96 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginBottom: 24 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.like },
  eyebrowText: { fontWeight: '600', fontSize: 13, color: colors.ink2 },
  h1: { fontWeight: '900', color: colors.ink, letterSpacing: -2 },
  lead: { color: colors.muted, fontSize: 18, lineHeight: 29, marginTop: 20, maxWidth: 520 },
  search: { marginTop: 32, backgroundColor: '#fff', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: 12, paddingLeft: 18, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, ...shadow.md },
  searchCity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  searchValue: { fontSize: 15, fontWeight: '700', color: colors.ink },
  searchDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.line },
  lookChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.paper },
  lookChipOn: { backgroundColor: colors.ink },
  lookText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
  trust: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 22 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { fontWeight: '600', color: colors.ink2, fontSize: 14 },
  visual: { position: 'relative', width: '100%' },
  heroImg: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: '#E8E5DF' },
  floatCard: { position: 'absolute', width: 300, maxWidth: '88%', backgroundColor: '#fff', borderRadius: 22, padding: 18, ...shadow.lg },
  face: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.line },
  fcName: { fontWeight: '900', fontSize: 16, color: colors.ink },
  fcMeta: { fontSize: 13, color: colors.muted },
  score: { backgroundColor: colors.marigoldSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  scoreNum: { fontWeight: '900', color: colors.brandDark, fontSize: 16 },
  fcDivider: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
  fcRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  fcReason: { fontSize: 14, color: colors.ink2, fontWeight: '500' },
  floatChip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.ink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, ...shadow.md },
  floatChipText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: { paddingVertical: 88 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: colors.brand, marginBottom: 14 },
  h2: { fontSize: 38, lineHeight: 44, fontWeight: '900', color: colors.ink, letterSpacing: -1.2 },
  h3: { fontSize: 19, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 },
  body: { fontSize: 15.5, lineHeight: 24, color: colors.muted },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  feature: { flexGrow: 1, gap: 10, paddingRight: 8 },
  featureIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.marigoldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dark: { backgroundColor: colors.ink },
  breakdown: { backgroundColor: '#1D1B27', borderRadius: 26, padding: 28, borderWidth: 1, borderColor: '#2E2B3B' },
  bdLabel: { color: '#8C8899', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  bdTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  bdTotal: { color: colors.marigold, fontSize: 48, fontWeight: '900', letterSpacing: -1.5 },
  bdRow: { color: '#D9D5E3', fontSize: 14, fontWeight: '600' },
  bdVal: { color: '#8C8899', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  bar: { height: 6, borderRadius: 3, backgroundColor: '#2E2B3B', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.marigold },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  type: { flexGrow: 1, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  typeImg: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E8E5DF' },
  typeTitle: { fontSize: 16, fontWeight: '900', color: colors.ink },
  typeBody: { fontSize: 13.5, lineHeight: 20, color: colors.muted },
  areas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 28 },
  areasLabel: { fontWeight: '700', color: colors.ink, marginRight: 6, fontSize: 14 },
  area: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  areaText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
  step: { flexGrow: 1, backgroundColor: '#fff', borderRadius: radius.lg, padding: 24, gap: 10, borderWidth: 1, borderColor: colors.line },
  stepNum: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.ink, color: '#fff', textAlign: 'center', lineHeight: 34, fontWeight: '700', overflow: 'hidden', marginBottom: 4 },
  owner: { backgroundColor: '#fff', borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, ...shadow.sm },
  ownerImg: { backgroundColor: '#E8E5DF' },
  faq: { backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 20, marginBottom: 12 },
  faqQ: { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1 },
  cta: { backgroundColor: colors.ink, borderRadius: 32, paddingVertical: 64, paddingHorizontal: 24, alignItems: 'center', gap: 14 },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 48 },
  footBrand: { fontSize: 24, fontWeight: '900', color: colors.ink, letterSpacing: -0.6 },
  footHead: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  footLink: { fontSize: 15, fontWeight: '600', color: colors.ink2 },
  footText: { fontSize: 14, color: colors.muted, lineHeight: 21 },
});
