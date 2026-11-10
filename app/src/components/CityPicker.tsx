import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useAuth } from '@/lib/auth';
import { colors, radius } from '@/lib/theme';
import { Chip } from './ui';

export function CityPicker({ value, onChange, tone }: { value: string; onChange: (c: string) => void; tone?: 'brand' | 'place' }) {
  const { options } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Chip label={`${value}  ▾`} icon="location-outline" selected tone={tone} onPress={() => setOpen(true)} />
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Choose a city</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {options?.CITIES.map((c) => {
                const live = options.LAUNCH_CITIES.includes(c);
                return (
                  <Pressable
                    key={c}
                    style={styles.row}
                    disabled={!live}
                    onPress={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.city, !live && { color: colors.muted }, c === value && { color: tone === 'place' ? colors.place : colors.brand }]}>{c}</Text>
                    {live ? c === value && <Ionicons name="checkmark" size={20} color={tone === 'place' ? colors.place : colors.brand} /> : <Text style={styles.soon}>Coming soon</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,20,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, width: '100%', maxWidth: 380, alignSelf: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  city: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  soon: { fontSize: 12, fontWeight: '700', color: colors.muted },
});
