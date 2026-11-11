import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListingTile, PlaceCard } from '@/components/Cards';
import { CityPicker } from '@/components/CityPicker';
import { Deck } from '@/components/Deck';
import { Button, Chip, Empty, Loading, notify, Segmented } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { shortRupees } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Listing, ListingType } from '@/lib/types';

const MONTHLY_CAPS = [8000, 12000, 18000, 25000, 40000];
const NIGHTLY_CAPS = [1500, 3000, 6000];

export default function Places() {
  const { user, options } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'swipe' | 'browse'>(width >= 900 ? 'browse' : 'swipe');
  const [type, setType] = useState<ListingType | null>(null);
  const [city, setCity] = useState(user?.city ?? options?.LAUNCH_CITIES[0] ?? 'Mumbai');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<'fit' | 'price' | 'newest'>('fit');
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ city, sort, ...(type ? { type } : {}), ...(maxPrice ? { maxPrice: String(maxPrice) } : {}) });
      const res = await api<{ listings: Listing[] }>(`/listings${mode === 'swipe' ? '/deck' : ''}?${q}`);
      setItems(res.listings);
    } catch (e: any) {
      notify('Couldn’t load places', e.message);
    } finally {
      setLoading(false);
    }
  }, [city, type, maxPrice, sort, mode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function swipe(l: Listing, dir: 'like' | 'pass') {
    setItems((list) => list.filter((x) => x.id !== l.id));
    // A BnB like is a booking request, which needs dates: send them to the listing to pick them.
    if (dir === 'like' && l.type === 'bnb') {
      router.push(`/listing/${l.id}`);
      return;
    }
    try {
      const res = await api<{ request: { status: string } | null }>(`/listings/${l.id}/swipe`, { method: 'POST', body: { action: dir } });
      if (dir === 'like' && res.request?.status === 'pending') notify('Request sent', `We’ve let the host of “${l.title}” know. You’ll get a chat when they accept.`);
    } catch (e: any) {
      notify('Swipe didn’t go through', e.message);
    }
  }

  const caps = type === 'bnb' ? NIGHTLY_CAPS : MONTHLY_CAPS;
  // Space next to the desktop sidebar (220px, shown from 1000px wide; see the tabs layout).
  const avail = Math.min(width >= 1000 ? width - 220 : width, 1200);
  const cols = avail >= 1000 ? 4 : avail >= 740 ? 3 : avail >= 520 ? 2 : 1;
  // Fixed tile width so a half-full last row lines up with the rows above it.
  const tileW = (avail - 32 - 14 * (cols - 1)) / cols;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', maxWidth: mode === 'swipe' ? 560 : 1200, alignSelf: 'center', flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.ink, flex: 1 }}>Places</Text>
          <View style={{ width: 190 }}>
            <Segmented value={mode} onChange={setMode} tone="place" options={[['swipe', 'Swipe'], ['browse', 'Browse']]} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }} style={{ flexGrow: 0 }}>
          <CityPicker value={city} onChange={setCity} tone="place" />
          <Chip label="All" tone="place" selected={!type} onPress={() => setType(null)} />
          {options &&
            (Object.entries(options.LISTING_TYPES) as [ListingType, { label: string; emoji: string }][]).map(([k, v]) => (
              <Chip key={k} tone="place" label={`${v.label}`} selected={type === k} onPress={() => { setType(type === k ? null : k); setMaxPrice(null); }} />
            ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6 }} style={{ flexGrow: 0 }}>
          <Chip label="Any price" tone="place" selected={!maxPrice} onPress={() => setMaxPrice(null)} />
          {caps.map((c) => (
            <Chip key={c} tone="place" label={`Under ${shortRupees(c)}`} selected={maxPrice === c} onPress={() => setMaxPrice(maxPrice === c ? null : c)} />
          ))}
          {mode === 'browse' && (
            <>
              <View style={{ width: 1, backgroundColor: colors.line, marginRight: 8, marginBottom: 8 }} />
              {(['fit', 'price', 'newest'] as const).map((s) => (
                <Chip key={s} tone="place" label={s === 'fit' ? 'Best fit' : s === 'price' ? 'Lowest price' : 'Newest'} selected={sort === s} onPress={() => setSort(s)} />
              ))}
            </>
          )}
        </ScrollView>

        {mode === 'swipe' ? (
          <Deck
            items={items}
            loading={loading}
            onSwipe={swipe}
            likeLabel="WANT"
            likeColor={colors.sea}
            onInfo={(l) => router.push(`/listing/${l.id}`)}
            renderCard={(l) => <PlaceCard listing={l} onInfo={() => router.push(`/listing/${l.id}`)} />}
            empty={<Empty icon="home-outline" title="No new places right now" body="Kinnesto is new in Mumbai and places are added every day. Try fewer filters, switch to Browse, or list your own room." action={<Button title="List a place" variant="place" onPress={() => router.push('/edit-listing')} style={{ minWidth: 200 }} />} />}
          />
        ) : loading && !items.length ? (
          <Loading />
        ) : (
          <FlatList
            key={cols}
            data={items}
            numColumns={cols}
            keyExtractor={(l) => l.id}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            columnWrapperStyle={cols > 1 ? { gap: 14 } : undefined}
            ListEmptyComponent={<Empty icon="search" title="Nothing matches yet" body="Kinnesto is new in Mumbai and places are added every day. Try a higher budget or another type, or list your own room." action={<Button title="List a place" variant="place" onPress={() => router.push('/edit-listing')} style={{ minWidth: 200 }} />} />}
            renderItem={({ item, index }) => (
              <View style={{ width: tileW }} key={index}>
                <ListingTile listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
