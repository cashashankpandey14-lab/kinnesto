import { View } from 'react-native';
import { Text } from '@/components/Text';
import { useAuth } from '@/lib/auth';
import { isoDay } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Gender, GenderPref, Intent, Me } from '@/lib/types';
import { ProfilePhotos } from './Photos';
import { Chip, ChipGroup, DateField, Field, SectionTitle } from './ui';

// The editable bits of a profile, kept as strings so inputs stay controlled.
export interface ProfileDraft {
  name: string;
  birthYear: string;
  gender: Gender | null;
  occupation: string;
  company: string;
  bio: string;
  intent: Intent | null;
  city: string | null;
  localities: string;
  budgetMin: string;
  budgetMax: string;
  moveIn: string;
  flatmateGender: GenderPref;
  lifestyle: Record<string, string>;
  interests: string[];
}

export function draftFrom(u: Me): ProfileDraft {
  return {
    name: u.name,
    birthYear: u.birthYear ? String(u.birthYear) : '',
    gender: u.gender,
    occupation: u.occupation,
    company: u.company,
    bio: u.bio,
    intent: u.intent,
    city: u.city,
    localities: u.localities.join(', '),
    budgetMin: u.budgetMin ? String(u.budgetMin) : '',
    budgetMax: u.budgetMax ? String(u.budgetMax) : '',
    moveIn: isoDay(u.moveIn),
    flatmateGender: u.flatmateGender,
    lifestyle: { ...u.lifestyle },
    interests: [...u.interests],
  };
}

export function draftToBody(d: ProfileDraft) {
  return {
    name: d.name,
    birthYear: d.birthYear ? Number(d.birthYear) : undefined,
    gender: d.gender ?? undefined,
    occupation: d.occupation,
    company: d.company,
    bio: d.bio,
    intent: d.intent ?? undefined,
    city: d.city ?? undefined,
    localities: d.localities.split(',').map((s) => s.trim()).filter(Boolean),
    budgetMin: d.budgetMin ? Number(d.budgetMin) : 0,
    budgetMax: d.budgetMax ? Number(d.budgetMax) : 0,
    moveIn: d.moveIn || null,
    flatmateGender: d.flatmateGender,
    lifestyle: d.lifestyle,
    interests: d.interests,
  };
}

type Props = { d: ProfileDraft; set: (patch: Partial<ProfileDraft>) => void };

export function BasicsSection({ d, set }: Props) {
  const { options } = useAuth();
  return (
    <View>
      <Field label="First name" value={d.name} onChangeText={(name) => set({ name })} placeholder="What should flatmates call you?" maxLength={40} />
      <Field label="Year of birth" value={d.birthYear} onChangeText={(v) => set({ birthYear: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="1998" maxLength={4} />
      <Text style={label}>Gender</Text>
      {options && <ChipGroup options={options.GENDERS} value={d.gender} onChange={(gender) => set({ gender })} />}
      <View style={{ height: 10 }} />
      <Field label="What do you do?" value={d.occupation} onChangeText={(occupation) => set({ occupation })} placeholder="Product designer, student, chef…" maxLength={60} />
      <Field label="Company or college (optional)" value={d.company} onChangeText={(company) => set({ company })} maxLength={60} />
    </View>
  );
}

export function PhotosSection() {
  return (
    <View>
      <Text style={{ color: colors.muted, marginBottom: 14, lineHeight: 20 }}>Add at least one clear photo of yourself. Profiles with 3+ photos get twice the matches.</Text>
      <ProfilePhotos />
    </View>
  );
}

export function SearchSection({ d, set }: Props) {
  const { options } = useAuth();
  if (!options) return null;
  return (
    <View>
      <Text style={label}>I’m here because…</Text>
      {(Object.entries(options.INTENTS) as [Intent, (typeof options.INTENTS)[Intent]][]).map(([k, v]) => (
        <Chip key={k} label={`${v.label}: ${v.blurb}`} selected={d.intent === k} onPress={() => set({ intent: k })} />
      ))}
      <SectionTitle>City</SectionTitle>
      <ChipGroup options={options.LAUNCH_CITIES} value={d.city} onChange={(city) => set({ city })} />
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>Live in {options.LAUNCH_CITIES.join(', ')}. More cities coming soon.</Text>
      <Field label="Preferred areas" value={d.localities} onChangeText={(localities) => set({ localities })} placeholder="Andheri West, Powai" hint="Separate with commas. Up to 5." />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field label="Budget from (₹/mo)" value={d.budgetMin} onChangeText={(v) => set({ budgetMin: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="10000" />
        <Field label="Budget up to (₹/mo)" value={d.budgetMax} onChangeText={(v) => set({ budgetMax: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="20000" />
      </View>
      <DateField label="Move-in date" value={d.moveIn} onChange={(moveIn) => set({ moveIn })} />
      <Text style={label}>Flatmates I’m comfortable with</Text>
      <ChipGroup options={options.GENDER_PREFS} value={d.flatmateGender} onChange={(flatmateGender) => set({ flatmateGender: flatmateGender as GenderPref })} />
    </View>
  );
}

export function LifestyleSection({ d, set }: Props) {
  const { options } = useAuth();
  if (!options) return null;
  return (
    <View>
      <Text style={{ color: colors.muted, marginBottom: 6, lineHeight: 20 }}>Your vibe-match score comes from these. Be honest: a neat freak and a relaxed roomie can still work, if they know upfront.</Text>
      {Object.entries(options.LIFESTYLE).map(([key, def]) => (
        <View key={key}>
          <SectionTitle>{def.label}</SectionTitle>
          <ChipGroup
            options={def.options}
            value={d.lifestyle[key]}
            onChange={(v) => {
              const next = { ...d.lifestyle };
              if (next[key] === v) delete next[key];
              else next[key] = v;
              set({ lifestyle: next });
            }}
          />
        </View>
      ))}
      <SectionTitle>{`Interests (${d.interests.length}/8)`}</SectionTitle>
      <ChipGroup
        options={options.INTERESTS}
        value={d.interests}
        onChange={(i) => set({ interests: d.interests.includes(i) ? d.interests.filter((x) => x !== i) : [...d.interests, i].slice(0, 8) })}
      />
      <View style={{ height: 12 }} />
      <Field label="About you" value={d.bio} onChangeText={(bio) => set({ bio })} multiline maxLength={500} placeholder="Weekend plans, house rules you swear by, your signature dish…" />
    </View>
  );
}

const label = { fontSize: 13, fontWeight: '700' as const, color: colors.muted, marginBottom: 8 };
