import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { api } from '@/lib/api';
import { colors, radius } from '@/lib/theme';
import type { Me } from '@/lib/types';
import { BasicsSection, draftFrom, draftToBody, LifestyleSection, SearchSection, type ProfileDraft } from './ProfileForm';
import { Text } from './Text';
import { Button, ErrorText, notify, SectionTitle } from './ui';

// Lets an admin fill in or correct anyone's profile using the same form members see, and switch
// the profile on even when details are missing — support's way of unblocking someone by hand.
export function AdminMemberEditor({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<ProfileDraft | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ user: Me; missing: string[] }>(`/admin/users/${userId}`)
      .then((r) => {
        setD(draftFrom(r.user));
        setMissing(r.missing);
        setOnboarded(r.user.onboarded);
        setEmail(r.user.email);
      })
      .catch((e) => setError(e.message));
  }, [userId]);

  const set = (patch: Partial<ProfileDraft>) => setD((x) => (x ? { ...x, ...patch } : x));

  async function save(alsoComplete?: boolean) {
    if (!d) return;
    setBusy(true);
    setError(null);
    try {
      const body = { ...draftToBody(d), ...(alsoComplete === undefined ? {} : { onboarded: alsoComplete }) };
      const r = await api<{ user: Me; missing: string[] }>(`/admin/users/${userId}`, { method: 'PATCH', body });
      setMissing(r.missing);
      setOnboarded(r.user.onboarded);
      onSaved();
      notify('Saved', `${r.user.name || email} updated.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(18,17,25,0.55)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', width: '100%', maxWidth: 760, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '900', color: colors.ink, fontSize: 18 }}>Edit member</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
                {email}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>

          {!d ? (
            <ActivityIndicator color={colors.marigold} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: radius.md,
                  marginBottom: 16,
                  backgroundColor: onboarded ? colors.seaSoft : colors.marigoldSoft,
                }}
              >
                <Ionicons name={onboarded ? 'checkmark-circle' : 'alert-circle'} size={20} color={onboarded ? colors.sea : colors.brandDark} />
                <Text style={{ flex: 1, color: colors.ink, fontSize: 13 }}>
                  {onboarded ? 'Profile is live and visible to others.' : missing.length ? `Still missing: ${missing.join(', ')}.` : 'Everything filled in, but the profile is switched off.'}
                </Text>
              </View>

              <SectionTitle>Basics</SectionTitle>
              <BasicsSection d={d} set={set} />
              <SectionTitle>Looking for</SectionTitle>
              <SearchSection d={d} set={set} />
              <SectionTitle>Lifestyle</SectionTitle>
              <LifestyleSection d={d} set={set} />

              <ErrorText>{error}</ErrorText>
              <Button title="Save changes" onPress={() => save()} loading={busy} style={{ marginTop: 16 }} />
              <Button
                title={onboarded ? 'Switch profile off' : 'Mark profile complete'}
                variant="secondary"
                icon={onboarded ? 'eye-off-outline' : 'checkmark-done-outline'}
                onPress={() => save(!onboarded)}
                disabled={busy}
                style={{ marginTop: 10 }}
              />
              {!onboarded && !!missing.length && (
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8, textAlign: 'center' }}>Marking it complete works even with details missing.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
