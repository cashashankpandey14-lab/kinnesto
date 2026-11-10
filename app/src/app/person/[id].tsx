import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/Text';
import { ListingTile } from '@/components/Cards';
import { Button, Card, Chip, confirm, Loading, notify, SectionTitle, VibePill } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { budgetRange, moveInPhrase } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Listing, Person } from '@/lib/types';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, options } = useAuth();
  const { width } = useWindowDimensions();
  const [person, setPerson] = useState<Person | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    api<{ person: Person; listings: Listing[] }>(`/people/${id}`)
      .then((r) => {
        setPerson(r.person);
        setListings(r.listings);
      })
      .catch((e) => {
        notify('Profile unavailable', e.message);
        router.back();
      });
  }, [id]);

  if (!person || !options) return <Loading />;
  const isMe = person.id === user?.id;
  const intent = person.intent ? options.INTENTS[person.intent] : null;
  const mine = new Set(user?.interests ?? []);
  const photoW = Math.min(width, 560);

  async function swipe(action: 'like' | 'pass') {
    try {
      await api(`/people/${person!.id}/swipe`, { method: 'POST', body: { action } });
      router.back();
    } catch (e: any) {
      notify('Didn’t go through', e.message);
    }
  }

  async function block() {
    if (!(await confirm(`Block ${person!.name}?`, 'They won’t see you and you won’t see them. Any chat with them will close. We’ll review the report.', 'Block & report'))) return;
    try {
      await api(`/people/${person!.id}/block`, { method: 'POST', body: { reason: 'Reported from profile' } });
      router.replace('/roomies');
    } catch (e: any) {
      notify('Couldn’t block', e.message);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: person.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {person.photos.map((p) => (
            <Image key={p} source={{ uri: p }} style={{ width: photoW, height: photoW * 1.15, backgroundColor: colors.line }} />
          ))}
        </ScrollView>
        <View style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text style={styles.name}>
              {person.name}
              {person.age ? <Text style={{ fontWeight: '400' }}> {person.age}</Text> : null}
            </Text>
            {person.vibe != null && !isMe && <VibePill score={person.vibe} />}
          </View>
          {person.occupation ? <Text style={styles.meta}>{[person.occupation, person.company].filter(Boolean).join(' at ')}</Text> : null}
          {person.recentlyActive && <Text style={{ color: colors.like, fontWeight: '700', marginTop: 4 }}>● Active recently</Text>}

          {!!person.reasons?.length && !isMe && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {person.reasons.map((r) => (
                <Text key={r} style={styles.reason}>
                  ✓ {r}
                </Text>
              ))}
            </View>
          )}

          {person.bio ? <Text style={styles.bio}>{person.bio}</Text> : null}

          <SectionTitle>Looking for</SectionTitle>
          <Card>
            {intent && (
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 8 }}>
                {intent.emoji} {intent.label}
              </Text>
            )}
            {[
              ['location-outline', person.localities.join(', ') || person.city],
              ['wallet-outline', budgetRange(person.budgetMin, person.budgetMax)],
              ['calendar-outline', person.moveIn ? `Moving ${moveInPhrase(person.moveIn)}` : ''],
            ]
              .filter(([, v]) => v)
              .map(([icon, v]) => (
                <View key={icon} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 4 }}>
                  <Ionicons name={icon as any} size={17} color={colors.muted} />
                  <Text style={{ color: colors.ink, fontSize: 15 }}>{v}</Text>
                </View>
              ))}
          </Card>

          {Object.keys(person.lifestyle).length > 0 && (
            <>
              <SectionTitle>How they live</SectionTitle>
              <View style={styles.grid}>
                {Object.entries(person.lifestyle).map(([k, v]) => {
                  const same = user?.lifestyle[k] === v;
                  return (
                    <View key={k} style={[styles.life, same && { borderColor: colors.ink, backgroundColor: colors.lilac }]}>
                      <Ionicons name={(options.LIFESTYLE[k]?.icon ?? 'ellipse') as any} size={16} color={same ? colors.ink : colors.muted} />
                      <View>
                        <Text style={styles.lifeLabel}>{options.LIFESTYLE[k]?.label}</Text>
                        <Text style={styles.lifeVal}>{v}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {person.interests.length > 0 && (
            <>
              <SectionTitle>Interests</SectionTitle>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {person.interests.map((i) => (
                  <Chip key={i} label={i} selected={mine.has(i)} />
                ))}
              </View>
            </>
          )}

          {listings.length > 0 && (
            <>
              <SectionTitle>{`${person.name}’s places`}</SectionTitle>
              <View style={{ gap: 12 }}>
                {listings.map((l) => (
                  <ListingTile key={l.id} listing={l} onPress={() => router.push(`/listing/${l.id}`)} />
                ))}
              </View>
            </>
          )}

          {!isMe && <Button title={`Block & report ${person.name}`} variant="ghost" onPress={block} style={{ marginTop: 24 }} />}
        </View>
      </ScrollView>
      {!isMe && (
        <View style={styles.bar}>
          <Button title="Pass" variant="secondary" icon="close" onPress={() => swipe('pass')} style={{ flex: 1 }} />
          <Button title="Like" icon="heart" onPress={() => swipe('like')} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 },
  meta: { color: colors.muted, fontSize: 16, marginTop: 4 },
  reason: { backgroundColor: colors.brandSoft, color: colors.brandDark, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, overflow: 'hidden', fontSize: 13 },
  bio: { fontSize: 16, lineHeight: 24, color: colors.ink, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  life: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, minWidth: '46%', flexGrow: 1 },
  lifeLabel: { fontSize: 11, color: colors.muted, fontWeight: '800', textTransform: 'uppercase' },
  lifeVal: { fontSize: 15, color: colors.ink, fontWeight: '700' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, padding: 14, paddingBottom: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line },
});
