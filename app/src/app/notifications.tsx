import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/Text';
import { Card, Empty, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { shortTime } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Notification } from '@/lib/types';

export default function Notifications() {
  const { on } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ notifications: Notification[] }>('/notifications');
    setItems(res.notifications);
  }, []);

  // Opening this screen is what marks everything read, so the badge clears once it has been seen.
  useEffect(() => {
    load().then(() => api('/notifications/read', { method: 'POST' }).catch(() => {}));
  }, [load]);

  // An announcement sent while this screen is open drops straight in.
  useEffect(() => on('notification', (n: Notification) => setItems((prev) => [n, ...(prev ?? [])])), [on]);

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <Screen>
        {!items ? (
          <ActivityIndicator color={colors.marigold} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <Empty icon="notifications-off-outline" title="Nothing yet" body="News from the Kinnesto team will show up here." />
        ) : (
          items.map((n) => (
            <Card key={n.id} style={{ marginBottom: 10, flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="megaphone" size={19} color={colors.marigold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: colors.ink, fontSize: 15 }}>{n.title}</Text>
                {!!n.body && <Text style={{ color: colors.muted, marginTop: 3, lineHeight: 20 }}>{n.body}</Text>}
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{shortTime(n.createdAt)}</Text>
              </View>
            </Card>
          ))
        )}
      </Screen>
    </>
  );
}
