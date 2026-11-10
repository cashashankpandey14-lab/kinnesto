import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/Text';
import { Button, Card, Field, FitPill, Loading, notify, SectionTitle, Stepper } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateLabel, isoDay, moveInPhrase, nights, priceLabel, rupees } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Listing } from '@/lib/types';

interface RequestState {
  status: 'pending' | 'accepted' | 'declined';
  checkIn?: string | null;
  checkOut?: string | null;
  matchId?: string;
}

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { options } = useAuth();
  const { width } = useWindowDimensions();
  const [listing, setListing] = useState<Listing | null>(null);
  const [mine, setMine] = useState(false);
  const [request, setRequest] = useState<RequestState | null>(null);
  const [note, setNote] = useState('');
  const [checkIn, setCheckIn] = useState(isoDay(new Date(Date.now() + 7 * 86400000)));
  const [stay, setStay] = useState(2);
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    api<{ listing: Listing; mine: boolean; request: RequestState | null }>(`/listings/${id}`)
      .then((r) => {
        setListing(r.listing);
        setMine(r.mine);
        setRequest(r.request);
        if (r.listing.minNights) setStay(Math.max(r.listing.minNights, 2));
      })
      .catch((e) => {
        notify('Listing unavailable', e.message);
        router.back();
      });
  }, [id]);

  if (!listing || !options) return <Loading />;
  const t = options.LISTING_TYPES[listing.type];
  const isBnb = listing.type === 'bnb';
  const photoW = Math.min(width, 900);
  const checkOut = isoDay(new Date(new Date(checkIn).getTime() + stay * 86400000));

  async function send() {
    setBusy(true);
    try {
      const body = isBnb ? { action: 'like', checkIn, checkOut, guests, note } : { action: 'like', note };
      const res = await api<{ request: RequestState }>(`/listings/${listing!.id}/swipe`, { method: 'POST', body });
      setRequest(res.request);
      if (res.request.matchId) router.push(`/chat/${res.request.matchId}`);
      else notify(isBnb ? 'Booking request sent' : 'Request sent', `${listing!.owner?.name ?? 'The host'} will get back to you. You’ll be able to chat once they accept.`);
    } catch (e: any) {
      notify('Couldn’t send request', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePause() {
    try {
      const res = await api<{ listing: Listing }>(`/listings/${listing!.id}`, { method: 'PATCH', body: { active: !listing!.active } });
      setListing({ ...listing!, active: res.listing.active });
    } catch (e: any) {
      notify('Couldn’t update', e.message);
    }
  }

  const facts: [string, string][] = [
    ['bed-outline', options.ROOM_TYPES[listing.roomType]],
    ['business-outline', listing.bedrooms ? `${listing.bedrooms} bedroom${listing.bedrooms > 1 ? 's' : ''}` : ''],
    ['water-outline', listing.bathrooms ? `${listing.bathrooms} bath${listing.bathrooms > 1 ? 's' : ''}` : ''],
    ['cube-outline', options.FURNISHING[listing.furnishing]],
    ['people-outline', isBnb ? `Up to ${listing.maxGuests} guests` : listing.currentFlatmates ? `${listing.currentFlatmates} living here now` : ''],
    ['male-female-outline', options.GENDER_PREFS[listing.genderPref]],
    ['calendar-outline', isBnb ? `Min ${listing.minNights} night${(listing.minNights ?? 1) > 1 ? 's' : ''}` : `Available ${moveInPhrase(listing.availableFrom) || 'now'}`],
    ['wallet-outline', !isBnb && listing.deposit ? `${rupees(listing.deposit)} deposit` : ''],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: t.label }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ width: photoW, alignSelf: 'center' }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / photoW))} scrollEventThrottle={32}>
            {listing.photos.map((p) => (
              <Image key={p} source={{ uri: p }} style={{ width: photoW, height: photoW * 0.66, maxHeight: 520, backgroundColor: colors.line }} resizeMode="cover" />
            ))}
          </ScrollView>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {photo + 1} / {listing.photos.length}
            </Text>
          </View>
        </View>

        <View style={styles.col}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={styles.type}>
              {t.emoji} {t.label}
            </Text>
            {listing.fit != null && !mine && <FitPill score={listing.fit} />}
            {!listing.active && <Text style={{ color: colors.nope, fontWeight: '800' }}>Paused</Text>}
          </View>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.loc}>
            <Ionicons name="location" size={15} color={colors.muted} /> {[listing.locality, listing.city].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.price}>{priceLabel(listing, options)}</Text>

          {!!listing.reasons?.length && !mine && (
            <View style={styles.reasons}>
              {listing.reasons.map((r) => (
                <Text key={r} style={styles.reason}>
                  ✓ {r}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.facts}>
            {facts.map(([icon, label]) => (
              <View key={label} style={styles.fact}>
                <Ionicons name={icon as any} size={18} color={colors.place} />
                <Text style={styles.factText}>{label}</Text>
              </View>
            ))}
          </View>

          {listing.description ? (
            <>
              <SectionTitle>About this place</SectionTitle>
              <Text style={styles.body}>{listing.description}</Text>
            </>
          ) : null}

          {listing.amenities.length > 0 && (
            <>
              <SectionTitle>Amenities</SectionTitle>
              <View style={styles.facts}>
                {listing.amenities.map((a) => (
                  <View key={a} style={styles.fact}>
                    <Ionicons name={(options.AMENITIES[a]?.icon ?? 'checkmark') as any} size={18} color={colors.ink} />
                    <Text style={styles.factText}>{options.AMENITIES[a]?.label ?? a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {listing.owner && !mine && (
            <>
              <SectionTitle>{isBnb ? 'Your host' : 'Posted by'}</SectionTitle>
              <Pressable onPress={() => router.push(`/person/${listing.owner!.id}`)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: listing.owner.photo ?? undefined }} style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.line }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 16, color: colors.ink }}>{listing.owner.name}</Text>
                    <Text style={{ color: colors.muted }}>
                      {listing.owner.occupation}
                      {listing.owner.recentlyActive ? ' · Active recently' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Card>
              </Pressable>
            </>
          )}

          {!mine && !request && (
            <>
              <SectionTitle>{isBnb ? 'Book a stay' : 'Interested?'}</SectionTitle>
              <Card>
                {isBnb && (
                  <>
                    <Field label="Check-in (YYYY-MM-DD)" value={checkIn} onChangeText={setCheckIn} autoCapitalize="none" maxLength={10} />
                    <Stepper label={`Nights (min ${listing.minNights ?? 1})`} value={stay} onChange={setStay} min={listing.minNights ?? 1} max={60} />
                    <Stepper label="Guests" value={guests} onChange={setGuests} min={1} max={listing.maxGuests ?? 10} />
                    {!Number.isNaN(new Date(checkIn).getTime()) && (
                      <View style={styles.total}>
                        <Text style={{ color: colors.muted }}>
                          {dateLabel(checkIn)} → {dateLabel(checkOut)} · {nights(checkIn, checkOut)} nights
                        </Text>
                        <Text style={{ fontWeight: '900', fontSize: 18, color: colors.ink }}>{rupees(listing.price * stay)}</Text>
                      </View>
                    )}
                  </>
                )}
                <Field label="Say hi (optional)" value={note} onChangeText={setNote} maxLength={300} placeholder={isBnb ? 'Arriving by train around noon…' : 'I work nearby and I’m a tidy non-smoker…'} />
              </Card>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <View style={[styles.col, { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }]}>
          {mine ? (
            <>
              <Button title={listing.active ? 'Pause' : 'Go live'} variant="secondary" onPress={togglePause} style={{ flex: 1 }} />
              <Button title="Edit listing" onPress={() => router.push(`/edit-listing?id=${listing.id}`)} style={{ flex: 1 }} />
            </>
          ) : request ? (
            <>
              <Text style={{ flex: 1, fontWeight: '800', color: request.status === 'accepted' ? colors.like : request.status === 'declined' ? colors.muted : colors.place }}>
                {request.status === 'accepted' ? (isBnb ? '✓ Stay confirmed' : '✓ Host accepted') : request.status === 'declined' ? 'The host passed this time' : '⏳ Request sent, waiting for host'}
              </Text>
              {request.status === 'accepted' && <Button title="Open chats" variant="place" onPress={() => router.push('/chats')} style={{ flex: 1 }} />}
            </>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', fontSize: 18, color: colors.ink }}>{priceLabel(listing, options)}</Text>
                {!isBnb && listing.deposit ? <Text style={{ color: colors.muted, fontSize: 13 }}>+ {rupees(listing.deposit)} deposit</Text> : null}
              </View>
              <Button title={isBnb ? 'Request to book' : 'I’m interested'} variant="place" icon={isBnb ? 'calendar' : 'heart'} onPress={send} loading={busy} style={{ flex: 1.3 }} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18 },
  counter: { position: 'absolute', right: 14, bottom: 14, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  counterText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  type: { fontWeight: '800', color: colors.place, marginTop: 18 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink, marginTop: 6, letterSpacing: -0.5 },
  loc: { color: colors.muted, marginTop: 6, fontSize: 15 },
  price: { fontSize: 22, fontWeight: '900', color: colors.ink, marginTop: 10 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  reason: { backgroundColor: colors.placeSoft, color: colors.place, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, overflow: 'hidden', fontSize: 13 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.md },
  factText: { color: colors.ink, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 6, marginBottom: 10 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderTopWidth: 2, borderTopColor: colors.ink, paddingBottom: 8 },
});
