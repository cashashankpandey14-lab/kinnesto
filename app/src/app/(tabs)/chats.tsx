import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Empty, Loading, notify } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { shortTime } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { MatchSummary } from '@/lib/types';

export default function Chats() {
  const { on } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);

  const load = useCallback(async () => {
    try {
      setMatches((await api<{ matches: MatchSummary[] }>('/matches')).matches);
    } catch (e: any) {
      notify('Couldn’t load chats', e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useEffect(() => {
    const offs = ['match', 'message', 'unmatch'].map((e) => on(e, load));
    return () => offs.forEach((off) => off());
  }, [on, load]);

  if (!matches) return <Loading />;
  if (!matches.length) {
    return <Empty icon="chatbubbles" title="No chats yet" body="Like someone who likes you back, or get a request accepted by a host, and you can chat here." />;
  }

  const fresh = matches.filter((m) => !m.lastMessage);
  const convos = matches.filter((m) => m.lastMessage);
  const photoOf = (m: MatchSummary) => (m.kind === 'listing' && m.listing ? m.listing.photos[0] : m.user.photos[0]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: 40 }}
      data={convos}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={
        fresh.length ? (
          <View>
            <Text style={styles.section}>New matches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
              {fresh.map((m) => (
                <Pressable key={m.id} onPress={() => router.push(`/chat/${m.id}`)} style={{ alignItems: 'center', width: 78 }}>
                  <Image source={{ uri: m.user.photos[0] }} style={styles.fresh} />
                  <Text numberOfLines={1} style={styles.freshName}>
                    {m.user.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {convos.length > 0 && <Text style={styles.section}>Messages</Text>}
          </View>
        ) : (
          <Text style={styles.section}>Messages</Text>
        )
      }
      renderItem={({ item: m }) => (
        <Pressable onPress={() => router.push(`/chat/${m.id}`)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FFF4F0' }]}>
          <View>
            <Image source={{ uri: photoOf(m) }} style={styles.avatar} />
            {m.kind === 'listing' && <Image source={{ uri: m.user.photos[0] }} style={styles.mini} />}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name} numberOfLines={1}>
                {m.user.name}
              </Text>
              <View style={[styles.kind, m.kind === 'listing' ? { backgroundColor: colors.placeSoft } : { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.kindText, { color: m.kind === 'listing' ? colors.place : colors.brandDark }]}>
                  {m.kind === 'listing' ? (m.listing?.type === 'bnb' ? 'Stay' : 'Place') : 'Roomie'}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              {m.lastMessageAt && <Text style={styles.time}>{shortTime(m.lastMessageAt)}</Text>}
            </View>
            {m.listing && (
              <Text style={styles.listing} numberOfLines={1}>
                {m.listing.title}
              </Text>
            )}
            <Text style={[styles.last, m.unread > 0 && { color: colors.ink, fontWeight: '700' }]} numberOfLines={1}>
              {m.lastMessage}
            </Text>
          </View>
          {m.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{m.unread}</Text>
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 10, paddingHorizontal: 16 },
  fresh: { width: 70, height: 70, borderRadius: 35, borderWidth: 2.5, borderColor: colors.marigold, backgroundColor: colors.line },
  freshName: { marginTop: 6, fontWeight: '700', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  avatar: { width: 58, height: 58, borderRadius: radius.md, backgroundColor: colors.line },
  mini: { position: 'absolute', right: -6, bottom: -6, width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#fff' },
  name: { fontWeight: '900', fontSize: 16, color: colors.ink, flexShrink: 1 },
  kind: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  kindText: { fontSize: 11, fontWeight: '800' },
  time: { color: colors.muted, fontSize: 12 },
  listing: { color: colors.place, fontSize: 13, fontWeight: '600' },
  last: { color: colors.muted, fontSize: 14 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.marigold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: colors.ink, fontWeight: '800', fontSize: 12 },
});
