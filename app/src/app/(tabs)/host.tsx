import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/Text';
import { ListingTile } from '@/components/Cards';
import { Button, Card, Empty, notify, Screen, SectionTitle, Segmented, VibePill } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { dateLabel, nights } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Listing, RequestItem } from '@/lib/types';

export default function Host() {
  const { on } = useAuth();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<'requests' | 'listings'>('requests');
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const load = useCallback(async () => {
    try {
      const [l, r] = await Promise.all([api<{ listings: Listing[] }>('/listings/mine'), api<{ requests: RequestItem[] }>('/requests')]);
      setListings(l.listings);
      setRequests(r.requests);
    } catch (e: any) {
      notify('Couldn’t load', e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useEffect(() => on('request', load), [on, load]);

  const [responding, setResponding] = useState<string | null>(null);

  async function respond(r: RequestItem, accept: boolean) {
    if (responding) return;
    setResponding(r.id);
    try {
      const res = await api<{ matchId?: string }>(`/requests/${r.id}/respond`, { method: 'POST', body: { accept } });
      setRequests((list) => list.map((x) => (x.id === r.id ? { ...x, status: accept ? 'accepted' : 'declined' } : x)));
      if (res.matchId) router.push(`/chat/${res.matchId}`);
    } catch (e: any) {
      notify('Couldn’t update request', e.message);
    } finally {
      setResponding(null);
    }
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const done = requests.filter((r) => r.status !== 'pending');
  const cols = width >= 900 ? 3 : width >= 560 ? 2 : 1;

  const requestCard = (r: RequestItem) => (
    <Card key={r.id} style={{ marginBottom: 12, padding: 14 }}>
      <Pressable onPress={() => router.push(`/person/${r.user.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Image source={{ uri: r.user.photos[0] }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.line }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontWeight: '900', fontSize: 16, color: colors.ink }}>
            {r.user.name}
            {r.user.age ? `, ${r.user.age}` : ''} <Text style={{ fontWeight: '500', color: colors.muted }}>· {r.user.occupation}</Text>
          </Text>
          <Text style={{ color: colors.muted }} numberOfLines={1}>
            {r.listing.type === 'bnb' ? 'Wants to book' : 'Interested in'} {r.listing.title}
          </Text>
          {r.checkIn && r.checkOut ? (
            <Text style={{ color: colors.place, fontWeight: '700' }}>
              {dateLabel(r.checkIn)} → {dateLabel(r.checkOut)} · {nights(r.checkIn, r.checkOut)} nights · {r.guests} guest{r.guests === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
        {r.user.vibe != null && <VibePill score={r.user.vibe} />}
      </Pressable>
      {r.note ? <Text style={{ marginTop: 10, color: colors.ink, fontStyle: 'italic' }}>“{r.note}”</Text> : null}
      {r.status === 'pending' ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Button title="Decline" variant="secondary" small disabled={responding === r.id} onPress={() => respond(r, false)} style={{ flex: 1 }} />
          <Button title={r.listing.type === 'bnb' ? 'Confirm stay' : 'Accept & chat'} small loading={responding === r.id} onPress={() => respond(r, true)} style={{ flex: 1 }} />
        </View>
      ) : (
        <Text style={{ marginTop: 10, fontWeight: '800', color: r.status === 'accepted' ? colors.like : colors.muted }}>{r.status === 'accepted' ? '✓ Accepted' : 'Declined'}</Text>
      )}
    </Card>
  );

  return (
    <Screen width={tab === 'listings' ? 1100 : 720}>
      <Button title="Post a place" icon="add-circle" onPress={() => router.push('/edit-listing')} />
      <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 18, fontSize: 13 }}>Flat, PG, hostel, co-living or BnB. Free, no brokerage.</Text>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          ['requests', `Requests${pending.length ? ` (${pending.length})` : ''}`],
          ['listings', `My places (${listings.length})`],
        ]}
      />
      {tab === 'requests' ? (
        requests.length ? (
          <>
            {pending.length > 0 && <SectionTitle>Waiting for you</SectionTitle>}
            {pending.map(requestCard)}
            {done.length > 0 && <SectionTitle>Earlier</SectionTitle>}
            {done.map(requestCard)}
          </>
        ) : (
          <Empty icon="mail-open" title="No requests yet" body="When someone swipes right on one of your places, they show up here with their vibe score." />
        )
      ) : listings.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 }}>
          {listings.map((l) => (
            <View key={l.id} style={{ width: cols === 1 ? '100%' : `${100 / cols - 2}%` }}>
              <ListingTile
                listing={l}
                onPress={() => router.push(`/listing/${l.id}`)}
                footer={
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <Button title="Edit" small variant="secondary" icon="create-outline" onPress={() => router.push(`/edit-listing?id=${l.id}`)} style={{ flex: 1 }} />
                    {l.pendingRequests ? <Button title={`${l.pendingRequests} new`} small onPress={() => setTab('requests')} style={{ flex: 1 }} /> : null}
                  </View>
                }
              />
            </View>
          ))}
        </View>
      ) : (
        <Empty icon="key" title="Nothing posted yet" body="Have a spare room, a PG, or a holiday home? Post it and swipe through the people who want in." />
      )}
    </Screen>
  );
}
