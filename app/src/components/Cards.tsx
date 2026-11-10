import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useAuth } from '@/lib/auth';
import { budgetRange, moveInPhrase, priceLabel } from '@/lib/format';
import { colors, gradients, hard, radius } from '@/lib/theme';
import type { Listing, Person } from '@/lib/types';
import { FitPill, VibePill } from './ui';

// Tap the left/right side of a card to flip through its photos.
function PhotoFlipper({ photos, children }: { photos: string[]; children?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const list = photos.length ? photos : [''];
  return (
    <>
      <Image source={{ uri: list[i] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {list.length > 1 && (
        <View style={styles.bars}>
          {list.map((p, k) => (
            <View key={p + k} style={[styles.bar, k === i && { backgroundColor: '#fff' }]} />
          ))}
        </View>
      )}
      <Pressable style={[styles.tap, { left: 0 }]} onPress={() => setI(Math.max(0, i - 1))} accessibilityLabel="Previous photo" />
      <Pressable style={[styles.tap, { right: 0 }]} onPress={() => setI(Math.min(list.length - 1, i + 1))} accessibilityLabel="Next photo" />
      {children}
    </>
  );
}

export function PersonCard({ person, onInfo }: { person: Person; onInfo: () => void }) {
  const { options } = useAuth();
  const intent = person.intent ? options?.INTENTS[person.intent] : null;
  const life = Object.entries(person.lifestyle).filter(([k]) => ['food', 'sleep', 'cleanliness', 'smoking'].includes(k));
  return (
    <PhotoFlipper photos={person.photos}>
      {person.likedYou && (
        <View style={styles.banner}>
          <Ionicons name="heart" size={13} color={colors.ink} />
          <Text style={styles.bannerText}>{person.name} wants to live with you</Text>
        </View>
      )}
      <LinearGradient colors={gradients.scrim} style={styles.info} pointerEvents="box-none">
        <View style={{ flex: 1 }} pointerEvents="none">
          <View style={styles.pills}>
            {person.vibe != null && <VibePill score={person.vibe} dark />}
            {intent && (
              <View style={styles.darkPill}>
                <Text style={styles.darkPillText}>
                  {intent.emoji} {intent.label}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {person.name}
            {person.age ? <Text style={{ fontWeight: '400' }}> {person.age}</Text> : null}
          </Text>
          {person.occupation ? (
            <Text style={styles.meta} numberOfLines={1}>
              {[person.occupation, person.company].filter(Boolean).join(' at ')}
            </Text>
          ) : null}
          <Text style={styles.meta} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color="#eee" /> {person.localities.slice(0, 2).join(', ') || person.city}
            {person.budgetMax ? `  ·  ${budgetRange(person.budgetMin, person.budgetMax)}` : ''}
            {person.moveIn ? `  ·  Moving ${moveInPhrase(person.moveIn)}` : ''}
          </Text>
          {person.place && (
            <View style={styles.placeRow}>
              <Ionicons name="key" size={13} color="#B5F5EC" />
              <Text style={styles.placeText} numberOfLines={1}>
                Has a room: {person.place.title} · {priceLabel(person.place, options)}
              </Text>
            </View>
          )}
          {!!person.reasons?.length && (
            <View style={styles.chips}>
              {person.reasons.map((r) => (
                <View key={r} style={[styles.chip, styles.chipHot]}>
                  <Text style={[styles.chipText, { color: colors.ink }]}>✓ {r}</Text>
                </View>
              ))}
            </View>
          )}
          {!person.reasons?.length && life.length > 0 && (
            <View style={styles.chips}>
              {life.map(([k, v]) => (
                <View key={k} style={styles.chip}>
                  <Text style={styles.chipText}>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Pressable onPress={onInfo} style={styles.infoBtn} accessibilityLabel="Open full profile" hitSlop={10}>
          <Ionicons name="arrow-up" size={20} color={colors.ink} />
        </Pressable>
      </LinearGradient>
    </PhotoFlipper>
  );
}

export function PlaceCard({ listing, onInfo }: { listing: Listing; onInfo: () => void }) {
  const { options } = useAuth();
  const type = options?.LISTING_TYPES[listing.type];
  return (
    <PhotoFlipper photos={listing.photos}>
      <LinearGradient colors={gradients.scrim} style={styles.info} pointerEvents="box-none">
        <View style={{ flex: 1 }} pointerEvents="none">
          <View style={styles.pills}>
            {listing.fit != null && <FitPill score={listing.fit} dark />}
            <View style={styles.darkPill}>
              <Text style={styles.darkPillText}>
                {type?.emoji} {type?.label} · {options?.ROOM_TYPES[listing.roomType]}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>{priceLabel(listing, options)}</Text>
          <Text style={[styles.name, { fontSize: 24 }]} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color="#eee" /> {[listing.locality, listing.city].filter(Boolean).join(', ')}
            {listing.type !== 'bnb' && listing.availableFrom ? `  ·  From ${moveInPhrase(listing.availableFrom)}` : ''}
            {listing.genderPref !== 'any' ? `  ·  ${options?.GENDER_PREFS[listing.genderPref]}` : ''}
          </Text>
          <View style={styles.chips}>
            {(listing.reasons?.length ? listing.reasons.map((r) => `✓ ${r}`) : listing.amenities.slice(0, 4).map((a) => options?.AMENITIES[a]?.label ?? a)).map((t) => (
              <View key={t} style={[styles.chip, listing.reasons?.length ? styles.chipLime : null]}>
                <Text style={[styles.chipText, listing.reasons?.length ? { color: colors.ink } : null]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Pressable onPress={onInfo} style={styles.infoBtn} accessibilityLabel="Open listing" hitSlop={10}>
          <Ionicons name="arrow-up" size={20} color={colors.ink} />
        </Pressable>
      </LinearGradient>
    </PhotoFlipper>
  );
}

// Grid tile for browsing places.
export function ListingTile({ listing, onPress, footer }: { listing: Listing; onPress: () => void; footer?: React.ReactNode }) {
  const { options } = useAuth();
  const type = options?.LISTING_TYPES[listing.type];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}>
      <View style={styles.tilePhoto}>
        <Image source={{ uri: listing.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.tileType}>
          <Text style={styles.tileTypeText}>
            {type?.emoji} {type?.label}
          </Text>
        </View>
        {listing.saved && (
          <View style={styles.saved}>
            <Ionicons name="heart" size={14} color={colors.ink} />
          </View>
        )}
        {!listing.active && (
          <View style={styles.paused}>
            <Text style={styles.pausedText}>Paused</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Text style={styles.tilePrice}>{priceLabel(listing, options)}</Text>
          {listing.fit != null && <FitPill score={listing.fit} />}
        </View>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.tileMeta} numberOfLines={1}>
          {[listing.locality, listing.city].filter(Boolean).join(', ')} · {options?.ROOM_TYPES[listing.roomType]}
        </Text>
        {footer}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bars: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', gap: 4, zIndex: 2 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  tap: { position: 'absolute', top: 0, bottom: '45%', width: '45%', zIndex: 1 },
  banner: { position: 'absolute', top: 26, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, zIndex: 3, backgroundColor: colors.pink, ...hard(3), transform: [{ rotate: '-3deg' }] },
  bannerText: { color: colors.ink, fontWeight: '800', fontSize: 13 },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingBottom: 18, paddingTop: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  infoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.ink },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  darkPill: { backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.ink },
  darkPillText: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  name: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  price: { color: colors.lime, fontSize: 20, fontWeight: '900' },
  meta: { color: '#F3EFF5', fontSize: 14, marginTop: 4 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: colors.lime, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, maxWidth: '100%', borderWidth: 1.5, borderColor: colors.ink },
  placeText: { color: colors.ink, fontWeight: '700', fontSize: 13, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chipHot: { backgroundColor: colors.lilac, borderWidth: 1.5, borderColor: colors.ink },
  chipLime: { backgroundColor: colors.lime, borderWidth: 1.5, borderColor: colors.ink },
  tile: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', flex: 1, ...hard(4) },
  tilePhoto: { aspectRatio: 4 / 3, backgroundColor: '#EEE7E2', borderBottomWidth: 2, borderBottomColor: colors.ink },
  tileType: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.lime, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.ink, transform: [{ rotate: '-3deg' }] },
  tileTypeText: { fontWeight: '800', fontSize: 12, color: colors.ink },
  saved: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  paused: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  pausedText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  tilePrice: { fontSize: 20, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 },
  tileTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  tileMeta: { fontSize: 13, color: colors.muted },
});
