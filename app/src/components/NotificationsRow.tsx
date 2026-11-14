import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { Text } from './Text';
import { Card } from './ui';

// The way into the notifications screen, with a count of what arrived since the member last looked.
export function NotificationsRow() {
  const { on } = useAuth();
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    api<{ unread: number }>('/notifications')
      .then((r) => setUnread(r.unread))
      .catch(() => {});
  }, []);

  // Re-check on focus so the badge clears after the list has been opened.
  useFocusEffect(load);
  useEffect(() => on('notification', () => setUnread((n) => n + 1)), [on]);

  return (
    <Pressable onPress={() => router.push('/notifications')} accessibilityRole="button">
      <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="notifications" size={20} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: colors.ink, fontSize: 16 }}>Notifications</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{unread > 0 ? `${unread} new ${unread === 1 ? 'update' : 'updates'}` : 'News from the Kinnesto team'}</Text>
        </View>
        {unread > 0 && (
          <View style={{ minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: colors.marigold, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.ink, fontWeight: '900', fontSize: 13 }}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}
