import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ReportSheet } from '@/components/ReportSheet';
import { Text, TextInput } from '@/components/Text';
import { confirm, Loading, notify } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { priceLabel, shortTime } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Listing, Message, Person } from '@/lib/types';

interface ChatData {
  match: { id: string; kind: 'roomie' | 'listing'; user: Person | null; listing: Listing | null };
  messages: Message[];
  icebreakers: string[];
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, options, on } = useAuth();
  const [data, setData] = useState<ChatData | null>(null);
  const [text, setText] = useState('');
  const [reporting, setReporting] = useState(false);
  const list = useRef<FlatList<Message>>(null);

  useEffect(() => {
    api<ChatData>(`/matches/${id}/messages`)
      .then(setData)
      .catch((e) => {
        notify('Chat unavailable', e.message);
        router.back();
      });
  }, [id]);

  useEffect(() => {
    const offMsg = on('message', ({ matchId, message }: { matchId: string; message: Message }) => {
      if (matchId !== id) return;
      setData((d) => (d && !d.messages.some((m) => m.id === message.id) ? { ...d, messages: [...d.messages, message], icebreakers: [] } : d));
      // Opening the thread marks their messages read.
      if (message.from !== user?.id) api(`/matches/${id}/messages`).catch(() => {});
    });
    const offRead = on('read', ({ matchId }: { matchId: string }) => {
      if (matchId === id) setData((d) => d && { ...d, messages: d.messages.map((m) => (m.from === user?.id && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)) });
    });
    const offUnmatch = on('unmatch', ({ matchId }: { matchId: string }) => {
      if (matchId === id) router.back();
    });
    return () => {
      offMsg();
      offRead();
      offUnmatch();
    };
  }, [on, id, user?.id]);

  if (!data || !options) return <Loading />;
  const other = data.match.user;
  const listing = data.match.listing;
  const lastMine = [...data.messages].reverse().find((m) => m.from === user?.id);

  async function send(body = text) {
    const t = body.trim();
    if (!t) return;
    setText('');
    try {
      const res = await api<{ message: Message }>(`/matches/${id}/messages`, { method: 'POST', body: { text: t } });
      setData((d) => (d && !d.messages.some((m) => m.id === res.message.id) ? { ...d, messages: [...d.messages, res.message], icebreakers: [] } : d));
    } catch (e: any) {
      setText(t);
      notify('Not sent', e.message);
    }
  }

  async function unmatch() {
    if (!(await confirm('Close this chat?', `You won’t be able to message ${other?.name ?? 'them'} again.`, 'Close chat'))) return;
    await api(`/matches/${id}`, { method: 'DELETE' }).catch(() => {});
    router.back();
  }

  async function block(reason: string, details: string) {
    try {
      await api(`/people/${other!.id}/block`, { method: 'POST', body: { reason, details } });
      setReporting(false);
      notify('Blocked and reported', `You won’t hear from ${other!.name} again, and our team will review your report.`);
      router.replace('/chats');
    } catch (e: any) {
      notify('Couldn’t block', e.message);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable onPress={() => other && router.push(`/person/${other.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={{ uri: other?.photos[0] }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.line }} />
              <Text style={{ fontWeight: '900', fontSize: 17, color: colors.ink }}>{other?.name}</Text>
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {other && (
                <Pressable onPress={() => setReporting(true)} hitSlop={10} accessibilityLabel={`Block and report ${other.name}`} style={{ paddingHorizontal: 8 }}>
                  <Ionicons name="flag-outline" size={20} color={colors.ink} />
                </Pressable>
              )}
              <Pressable onPress={unmatch} hitSlop={10} accessibilityLabel="Close chat" style={{ paddingHorizontal: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={{ flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
        {listing && (
          <Pressable onPress={() => router.push(`/listing/${listing.id}`)} style={styles.listing}>
            <Image source={{ uri: listing.photos[0] }} style={styles.listingImg} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.ink }} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={{ color: colors.place, fontWeight: '700' }}>
                {priceLabel(listing, options)} · {listing.locality}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        )}
        <FlatList
          ref={list}
          data={data.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 6, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'flex-end', gap: 10 }}>
              <Text style={{ textAlign: 'center', color: colors.muted, marginBottom: 6 }}>Break the ice with {other?.name}:</Text>
              {data.icebreakers.map((q) => (
                <Pressable key={q} onPress={() => send(q)} style={styles.ice}>
                  <Text style={{ color: colors.ink, fontWeight: '700' }}>{q}</Text>
                </Pressable>
              ))}
            </View>
          }
          renderItem={({ item: m }) => {
            const isMine = m.from === user?.id;
            return (
              <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                  <Text style={{ color: isMine ? '#fff' : colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '500' }}>{m.text}</Text>
                </View>
                <Text style={styles.time}>
                  {shortTime(m.createdAt)}
                  {m.id === lastMine?.id ? (m.readAt ? ' · Seen' : ' · Sent') : ''}
                </Text>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor="#B0A9B8" style={styles.input} multiline onSubmitEditing={() => send()} blurOnSubmit={Platform.OS === 'web'} />
          <Pressable onPress={() => send()} disabled={!text.trim()} style={[styles.send, !text.trim() && { opacity: 0.4 }]} accessibilityLabel="Send">
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
      {other && <ReportSheet title={`Block & report ${other.name}`} actionLabel="Block and report" visible={reporting} onClose={() => setReporting(false)} onSubmit={block} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  listing: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, marginBottom: 0, padding: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  listingImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.line },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  mine: { backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6 },
  time: { fontSize: 11, color: colors.muted, marginTop: 2, marginHorizontal: 6 },
  ice: { backgroundColor: colors.card, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' },
  input: { flex: 1, maxHeight: 120, backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: colors.line },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
