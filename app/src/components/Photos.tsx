import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { api, upload, type LocalFile } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { notify } from './ui';

// fileName and mimeType are both documented as sometimes null on Android.
const assetToFile = (a: ImagePicker.ImagePickerAsset): LocalFile => ({ uri: a.uri, name: a.fileName || 'photo.jpg', type: a.mimeType || 'image/jpeg' });

async function pickImage(aspect: [number, number]) {
  // Android picks were dying at the crop step: the crop screen never appeared, nothing threw and
  // nothing crashed, so the tap just looked ignored while no upload was ever attempted. Skipping
  // the editor there costs little, since every photo is displayed cover-cropped to its cell shape
  // anyway. iOS keeps the editor, where it has always worked.
  const allowsEditing = Platform.OS !== 'android';
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing, aspect, quality: 0.8 });
  if (result.canceled) return null;
  return assetToFile(result.assets[0]);
}

// Android may kill MainActivity while the picker (and its cropper) is in front, which on a phone
// that is short of memory is ordinary behaviour, not a fault. The pick is then lost: the promise
// from launchImageLibraryAsync never settles, so there is nothing to catch and nothing to show,
// and the tap simply looks ignored. Expo keeps the result and hands it over on the next launch.
let pendingTaken = false;

function usePendingPick(use: (file: LocalFile) => void) {
  useEffect(() => {
    if (Platform.OS !== 'android' || pendingTaken) return;
    pendingTaken = true; // whoever mounts first claims it; it is only ever one pick
    ImagePicker.getPendingResultAsync()
      .then((res) => {
        if (!res) return; // null on every other platform, and when nothing was lost
        if ('code' in res) return notify('Could not open your photos', res.message);
        if (!res.canceled && res.assets[0]) use(assetToFile(res.assets[0]));
      })
      .catch(() => {});
    // Deliberately once per mount: a recovered pick is handed back exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

  const run = async (fn: () => Promise<any>, failTitle: string) => {
    try {
      apply(await fn());
    } catch (e: any) {
      notify(failTitle, e.message);
    }
  };

  const send = async (file: LocalFile) => {
    setUploading(true);
    await run(() => upload('/me/photos', 'photo', file), 'Upload failed');
    setUploading(false);
  };

  usePendingPick(send);
  if (!user) return null;

  return (
    <Grid
      photos={user.photos}
      max={6}
      aspect={3 / 4}
      uploading={uploading}
      onAdd={async () => {
        // A throw from the picker used to reject into nothing: no message, no upload, no trace
        // anywhere. Whatever goes wrong here, the member should at least be told what it was.
        try {
          const file = await pickImage([3, 4]);
          if (file) await send(file);
        } catch (e: any) {
          notify('Could not open your photos', e.message);
          setUploading(false);
        }
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
        try {
          const file = await pickImage([4, 3]);
          if (!file) return;
          setUploading(true);
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
