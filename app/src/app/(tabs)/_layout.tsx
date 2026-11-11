import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { MatchOverlay, type MatchInfo } from '@/components/MatchOverlay';
import { homeRouteFor, useAuth } from '@/lib/auth';
import { colors, fonts } from '@/lib/theme';

export default function TabsLayout() {
  const { user, on } = useAuth();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const wide = useWindowDimensions().width >= 1000;

  // Matches can land from anywhere (a host accepting your request, someone liking you back).
  useEffect(() => on('match', (m: MatchInfo) => setMatch(m)), [on]);

  const home = homeRouteFor(user);
  if (home !== '/roomies') return <Redirect href={home} />;

  return (
    <>
      <Tabs
        screenOptions={{
          // Dark ink tab bar with a marigold highlight.
          tabBarActiveTintColor: colors.marigold,
          tabBarInactiveTintColor: '#8C8899',
          // On wide screens (the website on a laptop) the tabs become a left sidebar, like a web app.
          tabBarPosition: wide ? 'left' : 'bottom',
          tabBarVariant: wide ? 'material' : 'uikit',
          tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
          tabBarStyle: wide
            ? { backgroundColor: colors.ink, borderRightWidth: 0, width: 220, paddingTop: 28 }
            : { backgroundColor: colors.ink, borderTopWidth: 0, height: 66, paddingTop: 7, paddingBottom: 9 },
          tabBarItemStyle: wide ? { borderRadius: 12, marginHorizontal: 12, marginVertical: 2, paddingHorizontal: 12 } : undefined,
          tabBarActiveBackgroundColor: wide ? '#2A2737' : undefined,
          tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: wide ? 15 : 11 },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="roomies" options={{ title: 'Roomies', headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="people" color={color} size={24} /> }} />
        <Tabs.Screen
          name="places"
          options={{ title: 'Places', headerShown: false, tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={23} /> }}
        />
        <Tabs.Screen name="host" options={{ title: 'Host', tabBarIcon: ({ color }) => <Ionicons name="key" color={color} size={23} /> }} />
        <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" color={color} size={24} /> }} />
        <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: ({ color }) => <Ionicons name="person-circle" color={color} size={25} /> }} />
      </Tabs>
      {match && (
        <MatchOverlay
          match={match}
          onClose={() => setMatch(null)}
          onChat={() => {
            setMatch(null);
            router.push(`/chat/${match.matchId}`);
          }}
        />
      )}
    </>
  );
}
