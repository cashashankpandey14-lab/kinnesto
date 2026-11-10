import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { ListingTile } from '@/components/Cards';
import { Button, Card, Chip, confirm, notify, Screen, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { budgetRange, moveInLabel } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Listing } from '@/lib/types';

interface Saved {
  status: 'pending' | 'accepted' | 'declined';
  listing: Listing;
}

const STATUS = { pending: 'Request sent', accepted: '✓ Accepted', declined: 'Not this time' };

export default function MeTab() {
  const { user, options, signOut } = useAuth();
  const [saved, setSaved] = useState<Saved[]>([]);

  useFocusEffect(
    useCallback(() => {
      api<{ saved: Saved[] }>('/listings/saved')
        .then((r) => setSaved(r.saved))
        .catch(() => {});
    }, [])
  );

  if (!user || !options) return null;
  const intent = user.intent ? options.INTENTS[user.intent] : null;
  const answered = Object.keys(user.lifestyle).length;
  const strength = Math.round(
    (Math.min(user.photos.length, 3) / 3) * 30 + (answered / Object.keys(options.LIFESTYLE).length) * 40 + (user.bio ? 15 : 0) + (user.interests.length >= 3 ? 15 : 0)
  );

  async function deleteAccount() {
    if (!(await confirm('Delete your account?', 'Your profile, listings, matches and chats will be permanently deleted. This can’t be undone.', 'Delete'))) return;
    try {
      await api('/me', { method: 'DELETE' });
      await signOut();
      router.replace('/welcome');
    } catch (e: any) {
      notify('Couldn’t delete account', e.message);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Image source={{ uri: user.photos[0] }} style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: colors.line }} />
        <Text style={{ fontSize: 26, fontWeight: '900', color: colors.ink }}>
          {user.name}
          {user.age ? `, ${user.age}` : ''}
        </Text>
        <Text style={{ color: colors.muted }}>{[user.occupation, user.city].filter(Boolean).join(' · ')}</Text>
        {intent && <Chip label={`${intent.emoji} ${intent.label}`} selected />}
      </View>

      <Card style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontWeight: '800', color: colors.ink }}>Profile strength</Text>
          <Text style={{ fontWeight: '900', color: colors.ink, fontSize: 18 }}>{strength}%</Text>
        </View>
        <View style={{ height: 14, borderRadius: 7, backgroundColor: colors.paper, overflow: 'hidden', borderWidth: 2, borderColor: colors.ink }}>
          <View style={{ width: `${strength}%`, height: '100%', backgroundColor: colors.lime, borderRadius: radius.pill }} />
        </View>
        {strength < 100 && <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>More photos, lifestyle answers and a bio make your vibe scores more accurate.</Text>}
        <Button title="Edit profile" variant="secondary" icon="create-outline" onPress={() => router.push('/edit-profile')} style={{ marginTop: 14 }} />
      </Card>

      <SectionTitle>Looking for</SectionTitle>
      <Card>
        {[
          ['Budget', budgetRange(user.budgetMin, user.budgetMax) || 'Not set'],
          ['Areas', user.localities.join(', ') || 'Anywhere in ' + (user.city ?? 'the city')],
          ['Move-in', moveInLabel(user.moveIn) || 'Flexible'],
          ['Flatmates', options.GENDER_PREFS[user.flatmateGender]],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: colors.muted }}>{k}</Text>
            <Text style={{ color: colors.ink, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{v}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>{`Places you liked (${saved.length})`}</SectionTitle>
      {saved.length ? (
        <View style={{ gap: 12 }}>
          {saved.map((s) => (
            <ListingTile
              key={s.listing.id}
              listing={s.listing}
              onPress={() => router.push(`/listing/${s.listing.id}`)}
              footer={<Text style={{ fontWeight: '800', marginTop: 4, color: s.status === 'accepted' ? colors.like : s.status === 'declined' ? colors.muted : colors.place }}>{STATUS[s.status]}</Text>}
            />
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.muted }}>Swipe right on places and they’ll be saved here.</Text>
      )}

      <SectionTitle>Account</SectionTitle>
      <Card style={{ padding: 0 }}>
        <Text style={{ padding: 16, color: colors.muted, borderBottomWidth: 1, borderBottomColor: colors.line }}>{user.email}</Text>
        <Pressable onPress={async () => { await signOut(); router.replace('/welcome'); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ fontWeight: '700', color: colors.ink }}>Sign out</Text>
        </Pressable>
        <Pressable onPress={deleteAccount} style={{ padding: 16 }}>
          <Text style={{ fontWeight: '700', color: colors.nope }}>Delete account</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
