import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersonCard } from '@/components/Cards';
import { CityPicker } from '@/components/CityPicker';
import { Deck } from '@/components/Deck';
import { LogoMark } from '@/components/Logo';
import { Button, Chip, Empty, notify } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';
import type { Intent, Person } from '@/lib/types';

export default function Roomies() {
  const { user, options } = useAuth();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [city, setCity] = useState(user?.city ?? options?.LAUNCH_CITIES[0] ?? 'Mumbai');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ city, ...(intent ? { intent } : {}) });
      const res = await api<{ people: Person[] }>(`/people/deck?${q}`);
      setPeople(res.people);
    } catch (e: any) {
      notify('Couldn’t load people', e.message);
    } finally {
      setLoading(false);
    }
  }, [city, intent]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function swipe(p: Person, dir: 'like' | 'pass') {
    setPeople((list) => list.filter((x) => x.id !== p.id));
    try {
      // A mutual like arrives as a 'match' socket event, which opens the match screen.
      await api(`/people/${p.id}/swipe`, { method: 'POST', body: { action: dir } });
    } catch (e: any) {
      notify('Swipe didn’t go through', e.message);
    }
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 }}>
          <LogoMark size={30} />
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.ink, flex: 1 }}>Roomies</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }} style={{ flexGrow: 0 }}>
          <CityPicker value={city} onChange={setCity} />
          <Chip label="Everyone" selected={!intent} onPress={() => setIntent(null)} />
          {options &&
            (Object.entries(options.INTENTS) as [Intent, { label: string; emoji: string }][]).map(([k, v]) => (
              <Chip key={k} label={`${v.label}`} selected={intent === k} onPress={() => setIntent(intent === k ? null : k)} />
            ))}
        </ScrollView>
        <Deck
          items={people}
          loading={loading}
          onSwipe={swipe}
          onInfo={(p) => router.push(`/person/${p.id}`)}
          renderCard={(p) => <PersonCard person={p} onInfo={() => router.push(`/person/${p.id}`)} />}
          empty={
            <Empty
              icon="people"
              title="You’ve seen everyone here"
              body={`New people join ${city} every day. Try another city or filter, or browse places meanwhile.`}
              action={<Button title="Browse places" variant="place" onPress={() => router.push('/places')} style={{ minWidth: 200 }} />}
            />
          }
        />
      </View>
    </View>
  );
}
