import { Ionicons } from '@expo/vector-icons';
import { useRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, shadow } from '@/lib/theme';
import { Swipeable, type SwipeDir, type SwipeableHandle } from './Swipeable';

// A stack of swipe cards with Pass / Info / Like buttons. Shows two cards so the next one peeks.
export function Deck<T extends { id: string }>({
  items,
  loading,
  renderCard,
  onSwipe,
  onInfo,
  empty,
  likeLabel,
  likeColor = colors.marigold,
}: {
  items: T[];
  loading: boolean;
  renderCard: (item: T) => ReactNode;
  onSwipe: (item: T, dir: SwipeDir) => void;
  onInfo: (item: T) => void;
  empty: ReactNode;
  likeLabel?: string;
  likeColor?: string;
}) {
  const top = useRef<SwipeableHandle>(null);
  if (loading && !items.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }
  if (!items.length) return <View style={styles.center}>{empty}</View>;

  const visible = items.slice(0, 2).reverse();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stack}>
        {visible.map((item) => {
          const isTop = item.id === items[0].id;
          return isTop ? (
            <Swipeable key={item.id} ref={top} onSwiped={(dir) => onSwipe(item, dir)} likeLabel={likeLabel}>
              {renderCard(item)}
            </Swipeable>
          ) : (
            <View key={item.id} style={[StyleSheet.absoluteFill, styles.under]} pointerEvents="none">
              {renderCard(item)}
            </View>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => top.current?.swipe('pass')} accessibilityLabel="Pass">
          <Ionicons name="close" size={30} color={colors.nope} />
        </Pressable>
        <Pressable style={[styles.action, styles.small]} onPress={() => onInfo(items[0])} accessibilityLabel="More info">
          <Ionicons name="information" size={22} color={colors.muted} />
        </Pressable>
        <Pressable style={[styles.action, { backgroundColor: likeColor }]} onPress={() => top.current?.swipe('like')} accessibilityLabel="Like">
          <Ionicons name="heart" size={28} color={likeColor === colors.marigold ? colors.ink : '#fff'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { flex: 1, marginHorizontal: 14, marginTop: 4 },
  under: { borderRadius: 24, overflow: 'hidden', transform: [{ scale: 0.95 }, { translateY: 14 }], opacity: 0.7, backgroundColor: colors.ink2 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, paddingVertical: 14 },
  action: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  small: { width: 50, height: 50 },
});
