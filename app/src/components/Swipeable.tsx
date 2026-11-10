import { forwardRef, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import { colors, radius, shadow } from '@/lib/theme';

export type SwipeDir = 'like' | 'pass';
export interface SwipeableHandle {
  swipe: (dir: SwipeDir) => void;
}

const THRESHOLD = 110;

// Drag-to-swipe wrapper used by both decks. The top card is the only one that's interactive.
export const Swipeable = forwardRef<SwipeableHandle, { children: ReactNode; onSwiped: (dir: SwipeDir) => void; likeLabel?: string; passLabel?: string }>(
  function Swipeable({ children, onSwiped, likeLabel = 'LIKE', passLabel = 'NOPE' }, ref) {
    const { width } = useWindowDimensions();
    const pos = useRef(new Animated.ValueXY()).current;
    const gone = useRef(false);

    const flyOut = (dir: SwipeDir) => {
      if (gone.current) return;
      gone.current = true;
      // Animation frames pause in background tabs, so don't rely on the animation finishing.
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onSwiped(dir);
      };
      Animated.timing(pos, { toValue: { x: (dir === 'like' ? 1 : -1) * Math.max(width, 600) * 1.4, y: 30 }, duration: 240, useNativeDriver: false }).start(finish);
      setTimeout(finish, 320);
    };
    useImperativeHandle(ref, () => ({ swipe: flyOut }));

    const responder = useMemo(
      () =>
        PanResponder.create({
          onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
          onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
          onPanResponderRelease: (_, g) => {
            if (g.dx > THRESHOLD) flyOut('like');
            else if (g.dx < -THRESHOLD) flyOut('pass');
            else Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
          },
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [width]
    );

    const rotate = pos.x.interpolate({ inputRange: [-400, 0, 400], outputRange: ['-12deg', '0deg', '12deg'] });
    const likeOpacity = pos.x.interpolate({ inputRange: [20, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
    const nopeOpacity = pos.x.interpolate({ inputRange: [-THRESHOLD, -20], outputRange: [1, 0], extrapolate: 'clamp' });

    return (
      <Animated.View {...responder.panHandlers} style={[styles.card, { transform: [...pos.getTranslateTransform(), { rotate }] }]}>
        {children}
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
          <Text style={[styles.stampText, { color: colors.like }]}>{likeLabel}</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Text style={[styles.stampText, { color: colors.nope }]}>{passLabel}</Text>
        </Animated.View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.ink2,
    ...shadow.lg,
  },
  stamp: { position: 'absolute', top: 56, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, zIndex: 5, borderWidth: 3, backgroundColor: 'rgba(255,255,255,0.92)' },
  stampLike: { left: 24, borderColor: colors.like, transform: [{ rotate: '-10deg' }] },
  stampNope: { right: 24, borderColor: colors.nope, transform: [{ rotate: '10deg' }] },
  stampText: { fontSize: 30, fontWeight: '900', letterSpacing: 2 },
});
