import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BasicsSection, draftFrom, draftToBody, LifestyleSection, PhotosSection, SearchSection, type ProfileDraft } from '@/components/ProfileForm';
import { Button, ErrorText, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

const STEPS = [
  { title: 'The basics', sub: 'So flatmates know who they’re talking to.' },
  { title: 'Your photos', sub: 'Faces build trust. Rooms come later.' },
  { title: 'What you’re looking for', sub: 'We use this to find people and places that fit.' },
  { title: 'How you live', sub: 'The secret sauce of your vibe-match score.' },
];

export default function Onboarding() {
  const { user, apply, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<ProfileDraft>(() => draftFrom(user!));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<ProfileDraft>) => setD((x) => ({ ...x, ...patch }));

  const blocker = [
    !d.name ? 'Add your name' : !d.birthYear ? 'Add your year of birth' : !d.gender ? 'Pick your gender' : null,
    user!.photos.length ? null : 'Add a photo',
    !d.intent ? 'Tell us why you’re here' : !d.city ? 'Pick a city' : null,
    null,
  ][step];

  async function next() {
    setError(null);
    setBusy(true);
    try {
      const last = step === STEPS.length - 1;
      apply(await api('/me', { method: 'PATCH', body: { ...draftToBody(d), finishOnboarding: last } }));
      if (last) router.replace(d.intent === 'have_place' ? '/host' : '/roomies');
      else setStep(step + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingTop: 12, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {STEPS.map((s, i) => (
          <View key={s.title} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? colors.marigold : colors.line }} />
        ))}
      </View>
      <Screen>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={10}>
              <Text style={{ color: colors.muted, fontWeight: '700' }}>‹ Back</Text>
            </Pressable>
          ) : (
            <Pressable onPress={async () => { await signOut(); router.replace('/welcome'); }} hitSlop={10}>
              <Text style={{ color: colors.muted, fontWeight: '700' }}>Sign out</Text>
            </Pressable>
          )}
          <Text style={{ color: colors.muted, fontWeight: '700' }}>
            {step + 1} of {STEPS.length}
          </Text>
        </View>
        <Text style={{ fontSize: 30, fontWeight: '900', color: colors.ink, marginTop: 18, letterSpacing: -0.6 }}>{STEPS[step].title}</Text>
        <Text style={{ fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 20 }}>{STEPS[step].sub}</Text>

        {step === 0 && <BasicsSection d={d} set={set} />}
        {step === 1 && <PhotosSection />}
        {step === 2 && <SearchSection d={d} set={set} />}
        {step === 3 && <LifestyleSection d={d} set={set} />}

        <View style={{ height: 20 }} />
        <ErrorText>{error}</ErrorText>
        <Button title={step === STEPS.length - 1 ? 'Start swiping' : blocker ?? 'Continue'} onPress={next} loading={busy} disabled={!!blocker} />
      </Screen>
    </View>
  );
}
