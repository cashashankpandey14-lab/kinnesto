import { router } from 'expo-router';
import { useState } from 'react';
import { BasicsSection, draftFrom, draftToBody, LifestyleSection, PhotosSection, SearchSection, type ProfileDraft } from '@/components/ProfileForm';
import { Button, ErrorText, Screen, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function EditProfile() {
  const { user, apply } = useAuth();
  const [d, setD] = useState<ProfileDraft>(() => draftFrom(user!));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<ProfileDraft>) => setD((x) => ({ ...x, ...patch }));

  async function save() {
    setError(null);
    setBusy(true);
    try {
      apply(await api('/me', { method: 'PATCH', body: draftToBody(d) }));
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <SectionTitle>Photos</SectionTitle>
      <PhotosSection />
      <SectionTitle>Basics</SectionTitle>
      <BasicsSection d={d} set={set} />
      <SectionTitle>Looking for</SectionTitle>
      <SearchSection d={d} set={set} />
      <SectionTitle>Lifestyle</SectionTitle>
      <LifestyleSection d={d} set={set} />
      <ErrorText>{error}</ErrorText>
      <Button title="Save" onPress={save} loading={busy} style={{ marginTop: 10 }} />
    </Screen>
  );
}
