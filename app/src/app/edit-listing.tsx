import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { ListingPhotos } from '@/components/Photos';
import { Button, ChipGroup, confirm, DateField, ErrorText, Field, Loading, notify, Screen, SectionTitle, Stepper } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isoDay } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { GenderPref, Listing, ListingType } from '@/lib/types';

interface Draft {
  type: ListingType;
  title: string;
  description: string;
  city: string;
  locality: string;
  price: string;
  deposit: string;
  roomType: string;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  genderPref: GenderPref;
  amenities: string[];
  photos: string[];
  availableFrom: string;
  currentFlatmates: number;
  maxGuests: number;
  minNights: number;
}

// Sensible defaults per type so posting a PG or a BnB takes a few taps.
const TYPE_DEFAULTS: Record<ListingType, Partial<Draft>> = {
  flat: { roomType: 'private', bedrooms: 2, bathrooms: 2 },
  pg: { roomType: 'shared', bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'meals', 'housekeeping', 'power'] },
  hostel: { roomType: 'bed', bedrooms: 1, bathrooms: 2, amenities: ['wifi', 'housekeeping', 'security'] },
  coliving: { roomType: 'private', bedrooms: 3, bathrooms: 3, amenities: ['wifi', 'housekeeping', 'washer', 'kitchen'] },
  bnb: { roomType: 'entire', bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'ac', 'kitchen'] },
};

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, options } = useAuth();
  const [d, setD] = useState<Draft | null>(
    id
      ? null
      : {
          type: 'flat',
          title: '',
          description: '',
          city: user?.city ?? 'Bengaluru',
          locality: user?.localities[0] ?? '',
          price: '',
          deposit: '',
          furnishing: 'furnished',
          genderPref: 'any',
          photos: [],
          availableFrom: isoDay(new Date()),
          currentFlatmates: 1,
          maxGuests: 2,
          minNights: 1,
          amenities: [],
          roomType: 'private',
          bedrooms: 2,
          bathrooms: 2,
        }
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<{ listing: Listing }>(`/listings/${id}`).then(({ listing: l }) =>
      setD({
        type: l.type,
        title: l.title,
        description: l.description,
        city: l.city,
        locality: l.locality,
        price: String(l.price),
        deposit: l.deposit ? String(l.deposit) : '',
        roomType: l.roomType,
        bedrooms: l.bedrooms ?? 1,
        bathrooms: l.bathrooms ?? 1,
        furnishing: l.furnishing,
        genderPref: l.genderPref,
        amenities: l.amenities,
        photos: l.photos,
        availableFrom: isoDay(l.availableFrom),
        currentFlatmates: l.currentFlatmates,
        maxGuests: l.maxGuests ?? 2,
        minNights: l.minNights ?? 1,
      })
    );
  }, [id]);

  if (!d || !options) return <Loading />;
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x!, ...patch }));
  const isBnb = d.type === 'bnb';
  const unit = isBnb ? 'night' : 'month';
  const blocker = !d.photos.length ? 'Add at least one photo' : !d.title.trim() ? 'Add a title' : !d.price ? `Add the price per ${unit}` : null;

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const body = { ...d, price: Number(d!.price), deposit: Number(d!.deposit || 0), availableFrom: d!.availableFrom || null };
      const res = await api<{ listing: Listing }>(id ? `/listings/${id}` : '/listings', { method: id ? 'PATCH' : 'POST', body });
      router.replace(`/listing/${res.listing.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm('Delete this listing?', 'It will disappear from Kinnesto and pending requests will be removed. This can’t be undone.', 'Delete'))) return;
    try {
      await api(`/listings/${id}`, { method: 'DELETE' });
      router.replace('/host');
    } catch (e: any) {
      notify('Couldn’t delete', e.message);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? 'Edit listing' : 'Post a place' }} />
      <SectionTitle>What are you listing?</SectionTitle>
      <ChipGroup
        tone="place"
        options={Object.fromEntries(Object.entries(options.LISTING_TYPES).map(([k, t]) => [k, `${t.emoji} ${t.label}`])) as Record<ListingType, string>}
        value={d.type}
        onChange={(type) => set({ type, ...(id ? {} : TYPE_DEFAULTS[type]) })}
      />
      <Text style={{ color: colors.muted, marginBottom: 6 }}>{options.LISTING_TYPES[d.type].blurb}</Text>

      <SectionTitle>Photos</SectionTitle>
      <ListingPhotos photos={d.photos} onChange={(photos) => set({ photos })} />

      <SectionTitle>Basics</SectionTitle>
      <Field label="Title" value={d.title} onChangeText={(title) => set({ title })} maxLength={80} placeholder={isBnb ? 'Sea-view studio for workations' : 'Sunny room in a 3BHK near the metro'} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8 }}>City</Text>
      <ChipGroup tone="place" options={options.CITIES} value={d.city} onChange={(city) => set({ city })} />
      <Field label="Area / locality" value={d.locality} onChangeText={(locality) => set({ locality })} maxLength={60} placeholder="Koramangala" hint="Only the area is shown. Share the exact address in chat." />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label={`Price (₹ per ${unit})`} value={d.price} onChangeText={(v) => set({ price: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder={isBnb ? '2500' : '15000'} />
        {!isBnb && <Field label="Deposit (₹)" value={d.deposit} onChangeText={(v) => set({ deposit: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="30000" />}
      </View>

      <SectionTitle>The space</SectionTitle>
      <ChipGroup tone="place" options={options.ROOM_TYPES} value={d.roomType} onChange={(roomType) => set({ roomType })} />
      <ChipGroup tone="place" options={options.FURNISHING} value={d.furnishing} onChange={(furnishing) => set({ furnishing })} />
      <Stepper label="Bedrooms" value={d.bedrooms} onChange={(bedrooms) => set({ bedrooms })} max={20} />
      <Stepper label="Bathrooms" value={d.bathrooms} onChange={(bathrooms) => set({ bathrooms })} max={20} />
      {isBnb ? (
        <>
          <Stepper label="Max guests" value={d.maxGuests} onChange={(maxGuests) => set({ maxGuests })} min={1} max={30} />
          <Stepper label="Minimum nights" value={d.minNights} onChange={(minNights) => set({ minNights })} min={1} max={60} />
        </>
      ) : (
        <>
          <Stepper label="People living there now" value={d.currentFlatmates} onChange={(currentFlatmates) => set({ currentFlatmates })} max={20} />
          <DateField label="Available from" value={d.availableFrom} onChange={(availableFrom) => set({ availableFrom })} />
        </>
      )}

      <SectionTitle>Who can stay</SectionTitle>
      <ChipGroup tone="place" options={options.GENDER_PREFS} value={d.genderPref} onChange={(genderPref) => set({ genderPref: genderPref as GenderPref })} />

      <SectionTitle>Amenities</SectionTitle>
      <ChipGroup
        tone="place"
        options={Object.fromEntries(Object.entries(options.AMENITIES).map(([k, a]) => [k, a.label]))}
        icons={Object.fromEntries(Object.entries(options.AMENITIES).map(([k, a]) => [k, a.icon]))}
        value={d.amenities}
        onChange={(a) => set({ amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] })}
      />

      <SectionTitle>Description</SectionTitle>
      <Field
        label="Tell people about it"
        value={d.description}
        onChangeText={(description) => set({ description })}
        multiline
        maxLength={2000}
        placeholder={isBnb ? 'What’s nearby, check-in time, house rules…' : 'Who lives there, house rules, what’s included in rent, commute…'}
      />

      <ErrorText>{error}</ErrorText>
      <Button title={blocker ?? (id ? 'Save changes' : 'Post listing')} variant="place" onPress={save} loading={busy} disabled={!!blocker} />
      {id && <Button title="Delete listing" variant="ghost" onPress={remove} style={{ marginTop: 10 }} />}
    </Screen>
  );
}
