import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { api, upload } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { notify } from './ui';

async function pickImage(aspect: [number, number]) {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.8 });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.fileName || 'photo.jpg', type: a.mimeType || 'image/jpeg' };
}

function Grid({
  photos,
  max,
  uploading,
  onAdd,
  onRemove,
  onMain,
  aspect,
}: {
  photos: string[];
  max: number;
  uploading: boolean;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMain: (i: number) => void;
  aspect: number;
}) {
  const slots = Array.from({ length: max }, (_, i) => photos[i]);
  return (
    <View style={styles.grid}>
      {slots.map((p, i) =>
        p ? (
          <View key={p} style={[styles.cell, { aspectRatio: aspect }]}>
            <Image source={{ uri: p }} style={styles.photo} />
            {i === 0 ? (
              <View style={styles.mainTag}>
                <Text style={styles.mainText}>Cover</Text>
              </View>
            ) : (
              <Pressable style={styles.star} onPress={() => onMain(i)} accessibilityLabel="Make cover photo" hitSlop={6}>
                <Ionicons name="star" size={13} color="#fff" />
              </Pressable>
            )}
            <Pressable style={styles.remove} onPress={() => onRemove(i)} accessibilityLabel="Remove photo" hitSlop={6}>
              <Ionicons name="close" size={15} color={colors.nope} />
            </Pressable>
          </View>
        ) : (
          <Pressable key={`empty-${i}`} style={[styles.cell, styles.empty, { aspectRatio: aspect }]} onPress={onAdd} disabled={uploading || i !== photos.length} accessibilityLabel="Add photo">
            {uploading && i === photos.length ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <View style={[styles.plus, i !== photos.length && { opacity: 0.3 }]}>
                <Ionicons name="add" size={20} color="#fff" />
              </View>
            )}
          </Pressable>
        )
      )}
    </View>
  );
}

// The signed-in member's profile photos, saved straight to the server.
export function ProfilePhotos() {
  const { user, apply } = useAuth();
  const [uploading, setUploading] = useState(false);
  if (!user) return null;

  const run = async (fn: () => Promise<any>, failTitle: string) => {
    try {
      apply(await fn());
    } catch (e: any) {
      notify(failTitle, e.message);
    }
  };

  return (
    <Grid
      photos={user.photos}
      max={6}
      aspect={3 / 4}
      uploading={uploading}
      onAdd={async () => {
        const file = await pickImage([3, 4]);
        if (!file) return;
        setUploading(true);
        await run(() => upload('/me/photos', 'photo', file), 'Upload failed');
        setUploading(false);
      }}
      onRemove={(i) => run(() => api(`/me/photos/${i}`, { method: 'DELETE' }), 'Could not remove photo')}
      onMain={(i) => run(() => api(`/me/photos/${i}/main`, { method: 'POST' }), 'Could not reorder')}
    />
  );
}

// Listing photos live in the editor's draft until the listing is saved.
export function ListingPhotos({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  return (
    <Grid
      photos={photos}
      max={9}
      aspect={4 / 3}
      uploading={uploading}
      onAdd={async () => {
        const file = await pickImage([4, 3]);
        if (!file) return;
        setUploading(true);
        try {
          const { url } = await upload<{ url: string }>('/listings/photos', 'photo', file);
          onChange([...photos, url]);
        } catch (e: any) {
          notify('Upload failed', e.message);
        } finally {
          setUploading(false);
        }
      }}
      onRemove={(i) => onChange(photos.filter((_, j) => j !== i))}
      onMain={(i) => onChange([photos[i], ...photos.filter((_, j) => j !== i)])}
    />
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  cell: { width: '31.5%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  photo: { width: '100%', height: '100%' },
  empty: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#F1CFC7', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF4F1' },
  plus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', bottom: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  mainTag: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.brand, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  mainText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
