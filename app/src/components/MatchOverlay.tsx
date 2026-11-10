import { LinearGradient } from 'expo-linear-gradient';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useAuth } from '@/lib/auth';
import { colors, gradients, hard } from '@/lib/theme';
import type { Listing, Person } from '@/lib/types';
import { Button } from './ui';

export interface MatchInfo {
  matchId: string;
  kind: 'roomie' | 'listing';
  user: Person;
  listing: Listing | null;
  vibe?: number;
}

export function MatchOverlay({ match, onClose, onChat }: { match: MatchInfo; onClose: () => void; onChat: () => void }) {
  const { user } = useAuth();
  const isPlace = match.kind === 'listing';
  const theirPhoto = isPlace && match.listing ? match.listing.photos[0] : match.user.photos[0];
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <LinearGradient colors={gradients.night} style={styles.wrap}>
        <Text style={styles.kicker}>{isPlace ? 'Request accepted' : 'It’s a match'}</Text>
        <View style={[styles.titleSticker, { backgroundColor: isPlace ? colors.lime : colors.pink }]}>
          <Text style={styles.title}>{isPlace ? 'You’re in! 🔑' : 'Roomies? 🏡'}</Text>
        </View>
        <Text style={styles.sub}>
          {isPlace && match.listing
            ? `${match.user.name} accepted your request for “${match.listing.title}”.`
            : `You and ${match.user.name} both want to live together${match.vibe ? `, with a ${match.vibe}% vibe match` : ''}.`}
        </Text>
        <View style={styles.photos}>
          <Image source={{ uri: user?.photos[0] }} style={[styles.photo, { transform: [{ rotate: '-8deg' }] }]} />
          <Image source={{ uri: theirPhoto }} style={[styles.photo, { transform: [{ rotate: '8deg' }], marginLeft: -24 }]} />
        </View>
        <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
          <Button title={`Message ${match.user.name}`} variant="light" icon="chatbubble" onPress={onChat} />
          <Pressable onPress={onClose} style={styles.keep} accessibilityRole="button">
            <Text style={styles.keepText}>Keep swiping</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  kicker: { color: colors.lime, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  titleSticker: { paddingHorizontal: 18, paddingVertical: 4, borderRadius: 18, transform: [{ rotate: '-3deg' }], ...hard(5), borderColor: '#fff', boxShadow: '5px 5px 0px #ffffff' },
  title: { color: colors.ink, fontSize: 46, fontWeight: '900', letterSpacing: -1 },
  sub: { color: '#fff', fontSize: 16, textAlign: 'center', maxWidth: 340, lineHeight: 22 },
  photos: { flexDirection: 'row', marginVertical: 24 },
  keep: { height: 52, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  keepText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  photo: { width: 130, height: 170, borderRadius: 20, borderWidth: 3, borderColor: '#fff', backgroundColor: '#ddd', boxShadow: `5px 5px 0px ${colors.lime}` },
});
