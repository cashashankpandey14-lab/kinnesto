import { Ionicons } from '@expo/vector-icons';
import { useRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, hard } from '@/lib/theme';
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
  likeColor = colors.lime,
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
        <Pressable style={[styles.action, { backgroundColor: colors.pink }]} onPress={() => top.current?.swipe('pass')} accessibilityLabel="Pass">
          <Ionicons name="close" size={32} color={colors.ink} />
        </Pressable>
        <Pressable style={[styles.action, styles.small]} onPress={() => onInfo(items[0])} accessibilityLabel="More info">
          <Ionicons name="information" size={24} color={colors.ink} />
        </Pressable>
        <Pressable style={[styles.action, { backgroundColor: likeColor }]} onPress={() => top.current?.swipe('like')} accessibilityLabel="Like">
          <Ionicons name="heart" size={30} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { flex: 1, marginHorizontal: 14, marginTop: 4 },
  under: { borderRadius: 22, overflow: 'hidden', transform: [{ rotate: '3deg' }, { scale: 0.96 }], backgroundColor: colors.plum, borderWidth: 3, borderColor: colors.ink },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, paddingVertical: 14 },
  action: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...hard(4),
  },
  small: { width: 50, height: 50, backgroundColor: colors.lilac },
});
