import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { Text, TextInput } from './Text';
import { Button } from './ui';

// Pick a reason (and optionally add details) before reporting a member or a listing.
export function ReportSheet({ title, actionLabel, visible, onClose, onSubmit }: { title: string; actionLabel: string; visible: boolean; onClose: () => void; onSubmit: (reason: string, details: string) => Promise<void> }) {
  const { options } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    try {
      await onSubmit(reason, details);
      setReason(null);
      setDetails('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={styles.sub}>Reports are private. Our team reviews every one.</Text>
          {(options?.REPORT_REASONS ?? []).map((r) => (
            <Pressable key={r} onPress={() => setReason(r)} style={[styles.reason, reason === r && styles.reasonOn]} accessibilityRole="radio" accessibilityState={{ checked: reason === r }}>
              <Ionicons name={reason === r ? 'radio-button-on' : 'radio-button-off'} size={18} color={reason === r ? colors.ink : colors.muted} />
              <Text style={styles.reasonText}>{r}</Text>
            </Pressable>
          ))}
          <TextInput value={details} onChangeText={setDetails} placeholder="Anything else we should know? (optional)" placeholderTextColor="#A19DAB" style={styles.input} multiline maxLength={1000} />
          <Button title={actionLabel} variant="danger" onPress={submit} loading={busy} disabled={!reason} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(18,17,25,0.5)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, width: '100%', maxWidth: 440, alignSelf: 'center', ...shadow.lg },
  title: { fontSize: 19, fontWeight: '900', color: colors.ink },
  sub: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: 8 },
  reasonOn: { borderColor: colors.ink, backgroundColor: colors.paper },
  reasonText: { fontSize: 15, color: colors.ink, fontWeight: '600', flex: 1 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, minHeight: 70, fontSize: 15, color: colors.ink, marginVertical: 8, textAlignVertical: 'top' },
});
