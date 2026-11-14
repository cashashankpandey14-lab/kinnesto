import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TextInput } from '@/components/Text';
import { AdminMemberEditor } from '@/components/AdminMemberEditor';
import { Button, Card, confirm, Empty, Field, Loading, notify, Screen, Segmented } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { priceLabel, shortTime } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import type { Listing, Notification } from '@/lib/types';

type SentNotification = Notification & { sentBy: string | null };

type Tab = 'overview' | 'users' | 'listings' | 'reports' | 'notify';

interface Stats {
  users: { total: number; onboarded: number; newThisWeek: number; activeThisWeek: number; banned: number };
  listings: { total: number; active: number; byType: Record<string, number> };
  matches: { total: number; roomie: number; listing: number };
  messages: number;
  requests: { pending: number; accepted: number };
  openReports: number;
  signupsByDay: { day: string; signups: number }[];
}
interface UserRow {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  city: string | null;
  intent: string | null;
  onboarded: boolean;
  banned: boolean;
  provider: 'email' | 'google' | 'facebook';
  isDemo: boolean;
  createdAt: string;
  lastActive: string;
}
interface ReportRow {
  id: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved';
  createdAt: string;
  from: { id: string; name: string; email: string } | null;
  user: { id: string; name: string; email: string; photo: string | null; banned: boolean } | null;
  listing: { id: string; title: string } | null;
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Card>
  );
}

function Overview({ stats }: { stats: Stats }) {
  const { options } = useAuth();
  const max = Math.max(1, ...stats.signupsByDay.map((d) => d.signups));
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '–');
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.statGrid}>
        <Stat label="Members" value={stats.users.total} sub={`${stats.users.newThisWeek} new this week`} />
        <Stat label="Profiles complete" value={pct(stats.users.onboarded, stats.users.total)} sub={`${stats.users.onboarded} of ${stats.users.total}`} />
        <Stat label="Active this week" value={stats.users.activeThisWeek} />
        <Stat label="Live listings" value={stats.listings.active} sub={`${stats.listings.total} total`} />
        <Stat label="Matches" value={stats.matches.total} sub={`${stats.matches.roomie} roomie · ${stats.matches.listing} place`} />
        <Stat label="Requests waiting" value={stats.requests.pending} sub={`${stats.requests.accepted} accepted`} />
        <Stat label="Messages" value={stats.messages} />
        <Stat label="Open reports" value={stats.openReports} sub={stats.users.banned ? `${stats.users.banned} banned` : undefined} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Sign-ups, last 14 days</Text>
        <View style={styles.chart}>
          {stats.signupsByDay.map((d) => (
            <View key={d.day} style={styles.barCol}>
              <Text style={styles.barNum}>{d.signups || ''}</Text>
              <View style={[styles.bar, { height: `${Math.max(3, (d.signups / max) * 100)}%`, backgroundColor: d.signups ? colors.marigold : colors.line }]} />
              <Text style={styles.barDay}>{new Date(d.day).getDate()}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Listings by type</Text>
        {Object.entries(options?.LISTING_TYPES ?? {}).map(([k, t]) => {
          const n = stats.listings.byType[k] || 0;
          return (
            <View key={k} style={styles.typeRow}>
              <Text style={{ width: 110, color: colors.ink2, fontWeight: '600' }}>{t.label}</Text>
              <View style={styles.typeTrack}>
                <View style={[styles.typeFill, { width: `${stats.listings.total ? (n / stats.listings.total) * 100 : 0}%` }]} />
              </View>
              <Text style={{ width: 40, textAlign: 'right', color: colors.muted, fontVariant: ['tabular-nums'] }}>{n}</Text>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

function Search({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#A19DAB" style={styles.searchInput} autoCapitalize="none" />
    </View>
  );
}

function Users() {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'banned'>('all');
  const [data, setData] = useState<{ users: UserRow[]; total: number } | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ q, ...(filter !== 'all' ? { status: filter } : {}) });
    setData(await api(`/admin/users?${qs}`));
  }, [q, filter]);
  useEffect(() => {
    const t = setTimeout(() => load().catch((e) => notify('Couldn’t load users', e.message)), 250);
    return () => clearTimeout(t);
  }, [load]);

  async function ban(u: UserRow) {
    if (!u.banned && !(await confirm(`Ban ${u.name || u.email}?`, 'They will be signed out, can’t sign back in, and their listings are hidden.', 'Ban'))) return;
    try {
      await api(`/admin/users/${u.id}/ban`, { method: 'POST', body: { banned: !u.banned } });
      load();
    } catch (e: any) {
      notify('Couldn’t update', e.message);
    }
  }
  async function remove(u: UserRow) {
    if (!(await confirm(`Delete ${u.name || u.email}?`, 'This permanently deletes their profile, photos, listings, matches and messages. It can’t be undone.', 'Delete'))) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      notify('Couldn’t delete', e.message);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.toolbar}>
        <Search value={q} onChange={setQ} placeholder="Search name or email" />
        <View style={{ width: 300, maxWidth: '100%' }}>
          <Segmented value={filter} onChange={setFilter} options={[['all', 'All'], ['incomplete', 'Incomplete'], ['banned', 'Banned']]} />
        </View>
      </View>
      {!data ? (
        <Loading />
      ) : !data.users.length ? (
        <Empty icon="people-outline" title="No members found" />
      ) : (
        <Card style={{ padding: 0 }}>
          <Text style={[styles.countLine, { padding: 16, paddingBottom: 4 }]}>{data.total.toLocaleString('en-IN')} members</Text>
          {data.users.map((u) => (
            <View key={u.id} style={styles.row}>
              {u.photo ? <Image source={{ uri: u.photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarEmpty]}><Ionicons name="person" size={18} color={colors.muted} /></View>}
              <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => u.onboarded && router.push(`/person/${u.id}`)}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {u.name || 'No name yet'} {u.isDemo ? <Text style={styles.badge}> DEMO </Text> : null}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {u.email} · {u.provider} · joined {shortTime(u.createdAt)} · active {shortTime(u.lastActive)}
                </Text>
              </Pressable>
              <View style={[styles.status, { backgroundColor: u.banned ? '#FDE7EA' : u.onboarded ? colors.seaSoft : colors.marigoldSoft }]}>
                <Text style={[styles.statusText, { color: u.banned ? colors.nope : u.onboarded ? colors.sea : colors.brandDark }]}>{u.banned ? 'Banned' : u.onboarded ? 'Active' : 'Incomplete'}</Text>
              </View>
              <Button title="Edit" small variant="secondary" icon="create-outline" onPress={() => setEditing(u.id)} />
              <Button title={u.banned ? 'Unban' : 'Ban'} small variant="secondary" onPress={() => ban(u)} />
              <Pressable onPress={() => remove(u)} accessibilityLabel={`Delete ${u.email}`} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.nope} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
      {editing && <AdminMemberEditor userId={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </View>
  );
}

function Listings() {
  const { options } = useAuth();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [data, setData] = useState<{ listings: (Listing & { ownerEmail: string | null })[]; total: number } | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ q, ...(filter !== 'all' ? { status: filter } : {}) });
    setData(await api(`/admin/listings?${qs}`));
  }, [q, filter]);
  useEffect(() => {
    const t = setTimeout(() => load().catch((e) => notify('Couldn’t load listings', e.message)), 250);
    return () => clearTimeout(t);
  }, [load]);

  async function toggle(l: Listing) {
    try {
      await api(`/admin/listings/${l.id}`, { method: 'PATCH', body: { active: !l.active } });
      load();
    } catch (e: any) {
      notify('Couldn’t update', e.message);
    }
  }
  async function remove(l: Listing) {
    if (!(await confirm(`Delete “${l.title}”?`, 'This permanently removes the listing and its requests.', 'Delete'))) return;
    try {
      await api(`/admin/listings/${l.id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      notify('Couldn’t delete', e.message);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.toolbar}>
        <Search value={q} onChange={setQ} placeholder="Search title or area" />
        <View style={{ width: 280, maxWidth: '100%' }}>
          <Segmented value={filter} onChange={setFilter} options={[['all', 'All'], ['active', 'Live'], ['paused', 'Hidden']]} />
        </View>
      </View>
      {!data ? (
        <Loading />
      ) : !data.listings.length ? (
        <Empty icon="home-outline" title="No listings found" />
      ) : (
        <Card style={{ padding: 0 }}>
          <Text style={[styles.countLine, { padding: 16, paddingBottom: 4 }]}>{data.total.toLocaleString('en-IN')} listings</Text>
          {data.listings.map((l) => (
            <View key={l.id} style={styles.row}>
              <Image source={{ uri: l.photos[0] }} style={styles.thumb} />
              <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => router.push(`/listing/${l.id}`)}>
                <Text style={styles.rowTitle} numberOfLines={1}>{l.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {options?.LISTING_TYPES[l.type]?.label} · {priceLabel(l, options)} · {[l.locality, l.city].filter(Boolean).join(', ')} · {l.owner?.name ?? ''} {l.ownerEmail ? `(${l.ownerEmail})` : ''}
                </Text>
              </Pressable>
              <View style={[styles.status, { backgroundColor: l.active ? colors.seaSoft : '#ECEAE5' }]}>
                <Text style={[styles.statusText, { color: l.active ? colors.sea : colors.muted }]}>{l.active ? 'Live' : 'Hidden'}</Text>
              </View>
              <Button title={l.active ? 'Hide' : 'Show'} small variant="secondary" onPress={() => toggle(l)} />
              <Pressable onPress={() => remove(l)} accessibilityLabel={`Delete ${l.title}`} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.nope} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

function Reports() {
  const [status, setStatus] = useState<'open' | 'resolved'>('open');
  const [items, setItems] = useState<ReportRow[] | null>(null);
  const load = useCallback(async () => {
    setItems((await api<{ reports: ReportRow[] }>(`/admin/reports?status=${status}`)).reports);
  }, [status]);
  useEffect(() => {
    load().catch((e) => notify('Couldn’t load reports', e.message));
  }, [load]);

  async function resolve(r: ReportRow) {
    await api(`/admin/reports/${r.id}/resolve`, { method: 'POST', body: { reopen: r.status === 'resolved' } }).catch((e) => notify('Couldn’t update', e.message));
    load();
  }
  async function ban(r: ReportRow) {
    if (!r.user || !(await confirm(`Ban ${r.user.name || r.user.email}?`, 'They will be signed out and their listings hidden.', 'Ban'))) return;
    await api(`/admin/users/${r.user.id}/ban`, { method: 'POST', body: { banned: true } }).catch((e) => notify('Couldn’t ban', e.message));
    await api(`/admin/reports/${r.id}/resolve`, { method: 'POST', body: {} }).catch(() => {});
    load();
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={{ width: 260 }}>
        <Segmented value={status} onChange={setStatus} options={[['open', 'Open'], ['resolved', 'Resolved']]} />
      </View>
      {!items ? (
        <Loading />
      ) : !items.length ? (
        <Empty icon="shield-checkmark-outline" title={status === 'open' ? 'No open reports' : 'Nothing resolved yet'} body={status === 'open' ? 'When members block and report someone, it shows up here.' : undefined} />
      ) : (
        items.map((r) => (
          <Card key={r.id} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={styles.rowTitle}>{r.reason || 'Report'}</Text>
              <Text style={styles.rowSub}>{shortTime(r.createdAt)}</Text>
            </View>
            {r.user && (
              <Text style={{ color: colors.ink2 }}>
                Reported member: <Text style={{ fontWeight: '700' }}>{r.user.name || 'No name'}</Text> ({r.user.email}){r.user.banned ? ' · already banned' : ''}
              </Text>
            )}
            {r.listing && <Text style={{ color: colors.ink2 }}>Listing: {r.listing.title}</Text>}
            {r.details ? <Text style={{ color: colors.muted }}>“{r.details}”</Text> : null}
            {r.from && <Text style={styles.rowSub}>From {r.from.name || r.from.email}</Text>}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {r.user && <Button title="View profile" small variant="secondary" onPress={() => router.push(`/person/${r.user!.id}`)} />}
              {r.user && !r.user.banned && r.status === 'open' && <Button title="Ban member" small variant="danger" onPress={() => ban(r)} />}
              <Button title={r.status === 'open' ? 'Mark resolved' : 'Reopen'} small onPress={() => resolve(r)} />
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function Notify() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{ notifications: SentNotification[]; recipients: number } | null>(null);

  const load = useCallback(async () => setData(await api('/admin/notifications')), []);
  useEffect(() => {
    load().catch((e) => notify('Couldn’t load notifications', e.message));
  }, [load]);

  async function send() {
    if (!title.trim()) return notify('Add a title', 'The title is what members see first.');
    if (!(await confirm('Send to everyone?', `“${title.trim()}” goes to all ${data?.recipients ?? 0} members. It can’t be unsent.`, 'Send'))) return;
    setBusy(true);
    try {
      await api('/admin/notifications', { method: 'POST', body: { title, body } });
      setTitle('');
      setBody('');
      await load();
      notify('Sent', 'Everyone online sees it now; the rest on their next visit.');
    } catch (e: any) {
      notify('Couldn’t send', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(n: SentNotification) {
    if (!(await confirm('Delete this notification?', 'It disappears from everyone’s list. People who already read it won’t see it again.', 'Delete'))) return;
    try {
      await api(`/admin/notifications/${n.id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      notify('Couldn’t delete', e.message);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <Text style={styles.cardTitle}>New announcement</Text>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Kinnesto is live in Mumbai" maxLength={80} />
        <Field
          label="Message"
          hint="Optional. Keep it short — it shows under the title."
          value={body}
          onChangeText={setBody}
          placeholder="Browse new PGs and flats added this week."
          multiline
          numberOfLines={3}
          maxLength={500}
          style={{ height: 88, textAlignVertical: 'top', paddingTop: 12 }}
        />
        <Button title={`Send to all ${data ? data.recipients.toLocaleString('en-IN') : ''} members`} icon="megaphone-outline" onPress={send} loading={busy} style={{ marginTop: 14 }} />
      </Card>

      {!data ? (
        <Loading />
      ) : !data.notifications.length ? (
        <Empty icon="megaphone-outline" title="Nothing sent yet" body="Announcements you send appear here." />
      ) : (
        <Card style={{ padding: 0 }}>
          <Text style={[styles.countLine, { padding: 16, paddingBottom: 4 }]}>{data.notifications.length} sent</Text>
          {data.notifications.map((n) => (
            <View key={n.id} style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{n.title}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {n.body ? `${n.body} · ` : ''}sent {shortTime(n.createdAt)}{n.sentBy ? ` by ${n.sentBy}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => remove(n)} accessibilityLabel={`Delete ${n.title}`} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.nope} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.isAdmin) api<Stats>('/admin/stats').then(setStats).catch((e) => notify('Couldn’t load stats', e.message));
  }, [user?.isAdmin, tab]);

  if (!user?.isAdmin) {
    return <Empty icon="lock-closed-outline" title="Admins only" body="This page is only available to Kinnesto admins." action={<Button title="Go home" onPress={() => router.replace('/')} />} />;
  }

  return (
    <Screen width={1120}>
      <Stack.Screen options={{ title: 'Admin' }} />
      <View style={{ flexDirection: width >= 700 ? 'row' : 'column', justifyContent: 'space-between', gap: 14, marginBottom: 20 }}>
        <View>
          <Text style={styles.h1}>Dashboard</Text>
          <Text style={{ color: colors.muted }}>Signed in as {user.email}</Text>
        </View>
        <View style={{ width: width >= 700 ? 460 : '100%' }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              ['overview', 'Overview'],
              ['users', 'Users'],
              ['listings', 'Listings'],
              ['reports', `Reports${stats?.openReports ? ` (${stats.openReports})` : ''}`],
              ['notify', 'Notify'],
            ]}
          />
        </View>
      </View>
      {tab === 'overview' && (stats ? <Overview stats={stats} /> : <Loading />)}
      {tab === 'users' && <Users />}
      {tab === 'listings' && <Listings />}
      {tab === 'reports' && <Reports />}
      {tab === 'notify' && <Notify />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  stat: { flexGrow: 1, flexBasis: 150, gap: 4, padding: 16 },
  statLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  statValue: { fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  statSub: { fontSize: 13, color: colors.muted },
  cardTitle: { fontSize: 16, fontWeight: '900', color: colors.ink, marginBottom: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 160 },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  bar: { width: '100%', borderRadius: 6, minHeight: 3 },
  barNum: { fontSize: 11, color: colors.muted, fontVariant: ['tabular-nums'] },
  barDay: { fontSize: 11, color: colors.muted },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  typeTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  typeFill: { height: '100%', backgroundColor: colors.sea, borderRadius: 4 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 14, flexGrow: 1, flexBasis: 260, maxWidth: 480 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.ink },
  countLine: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.line },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 56, height: 42, borderRadius: 8, backgroundColor: colors.line },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 13, color: colors.muted },
  badge: { fontSize: 10, fontWeight: '700', color: colors.brandDark, backgroundColor: colors.marigoldSoft },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: 12, fontWeight: '700' },
});
