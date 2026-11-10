import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { isoDay } from '@/lib/format';
import { colors, MAX_WIDTH, radius, shadow } from '@/lib/theme';
import { Text, TextInput } from './Text';

type Variant = 'primary' | 'place' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'light';

const BTN: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.ink, fg: '#FFFFFF' },
  accent: { bg: colors.marigold, fg: colors.ink },
  place: { bg: colors.sea, fg: '#FFFFFF' },
  secondary: { bg: colors.card, fg: colors.ink, border: colors.line },
  light: { bg: '#FFFFFF', fg: colors.ink },
  danger: { bg: colors.nope, fg: '#FFFFFF' },
  ghost: { bg: 'transparent', fg: colors.ink },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
}) {
  const isDisabled = disabled || loading;
  const v = BTN[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed, hovered }: any) => [
        styles.btn,
        small && { height: 42, paddingHorizontal: 16 },
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        variant !== 'ghost' && shadow.sm,
        hovered && variant !== 'ghost' && { opacity: 0.92 },
        pressed && { transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.btnRow}>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} />}
          <Text style={[styles.btnText, { color: v.fg }, small && { fontSize: 14 }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14, flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#A19DAB" {...props} style={[styles.input, props.multiline && { minHeight: 110, textAlignVertical: 'top' }, props.style]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon, tone = 'brand' }: { label: string; selected?: boolean; onPress?: () => void; icon?: string; tone?: 'brand' | 'place' }) {
  const on = { backgroundColor: tone === 'place' ? colors.sea : colors.ink, borderColor: tone === 'place' ? colors.sea : colors.ink };
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.chip, selected && on]} accessibilityState={{ selected }} accessibilityRole={onPress ? 'button' : undefined}>
      {icon ? <Ionicons name={icon as any} size={14} color={selected ? '#fff' : colors.muted} /> : null}
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  tone,
  icons,
}: {
  options: Record<T, string> | T[];
  value: T | T[] | null | undefined;
  onChange: (v: T) => void;
  tone?: 'brand' | 'place';
  icons?: Partial<Record<T, string>>;
}) {
  const entries: [T, string][] = Array.isArray(options) ? options.map((o) => [o, o]) : (Object.entries(options) as [T, string][]);
  const isOn = (k: T) => (Array.isArray(value) ? value.includes(k) : value === k);
  return (
    <View style={styles.wrap}>
      {entries.map(([k, label]) => (
        <Chip key={k} label={label} selected={isOn(k)} onPress={() => onChange(k)} tone={tone} icon={icons?.[k]} />
      ))}
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

// Scrollable page with a centred, max-width column so screens read well on desktop web.
export function Screen({ children, scroll = true, style, width = 720 }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>; width?: number }) {
  const inner = <View style={[{ width: '100%', maxWidth: Math.min(width, MAX_WIDTH), alignSelf: 'center', padding: 20 }, style]}>{children}</View>;
  if (!scroll) return <View style={{ flex: 1, backgroundColor: colors.bg }}>{inner}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void; tone?: 'brand' | 'place' }) {
  return (
    <View style={styles.seg}>
      {options.map(([k, label]) => (
        <Pressable key={k} onPress={() => onChange(k)} style={[styles.segItem, value === k && styles.segOn]} accessibilityRole="tab" accessibilityState={{ selected: value === k }}>
          <Text style={[styles.segText, value === k && { color: colors.ink }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Stepper({ label, value, onChange, min = 0, max = 20 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.stepper}>
      <Text style={[styles.label, { marginBottom: 0, flex: 1 }]}>{label}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel={`Fewer ${label}`}>
        <Ionicons name="remove" size={18} color={colors.ink} />
      </Pressable>
      <Text style={styles.stepVal}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))} accessibilityLabel={`More ${label}`}>
        <Ionicons name="add" size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const inDays = (d: number) => isoDay(new Date(Date.now() + d * 86400000));

// Quick picks plus a typed YYYY-MM-DD, which works the same on phones and the web.
export function DateField({ label, value, onChange, quick = true }: { label: string; value: string; onChange: (v: string) => void; quick?: boolean }) {
  const picks: [string, string][] = [
    ['Now', inDays(0)],
    ['In 2 weeks', inDays(14)],
    ['Next month', inDays(30)],
    ['In 2 months', inDays(60)],
  ];
  return (
    <View style={{ marginBottom: 6 }}>
      <Field label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" autoCapitalize="none" maxLength={10} />
      {quick && (
        <View style={[styles.wrap, { marginTop: -6, marginBottom: 6 }]}>
          {picks.map(([l, v]) => (
            <Chip key={l} label={l} selected={value === v} onPress={() => onChange(v)} />
          ))}
        </View>
      )}
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon: keyof typeof Ionicons.glyphMap; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.brand} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.ink} size="large" />
    </View>
  );
}

// Score badges. `dark` = sitting on a photo.
export function VibePill({ score, dark }: { score: number; dark?: boolean }) {
  return (
    <View style={[styles.pill, dark ? styles.pillDark : { backgroundColor: colors.marigoldSoft }]}>
      <View style={[styles.dot, { backgroundColor: colors.marigold }]} />
      <Text style={[styles.pillText, { color: dark ? '#fff' : colors.brandDark }]}>{score}% vibe match</Text>
    </View>
  );
}

export function FitPill({ score, dark }: { score: number; dark?: boolean }) {
  return (
    <View style={[styles.pill, dark ? styles.pillDark : { backgroundColor: colors.seaSoft }]}>
      <View style={[styles.dot, { backgroundColor: dark ? '#5FD3C8' : colors.sea }]} />
      <Text style={[styles.pillText, { color: dark ? '#fff' : colors.sea }]}>{score}% fit</Text>
    </View>
  );
}

// Cross-platform confirm dialog (Alert buttons don't work on web).
export function confirm(title: string, message: string, okLabel = 'OK'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ])
  );
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 5 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink2 },
  error: { color: colors.nope, fontSize: 14, marginBottom: 12, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, borderWidth: 1, borderColor: colors.line, ...shadow.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  section: { fontSize: 19, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 },
  seg: { flexDirection: 'row', backgroundColor: '#ECEAE5', borderRadius: radius.pill, padding: 4 },
  segItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  segOn: { backgroundColor: '#fff', ...shadow.sm },
  segText: { fontWeight: '700', color: colors.muted, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepVal: { fontSize: 17, fontWeight: '700', minWidth: 24, textAlign: 'center', color: colors.ink },
  empty: { alignItems: 'center', padding: 32, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.marigoldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: colors.ink, textAlign: 'center', letterSpacing: -0.4 },
  emptyBody: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22, maxWidth: 340, marginBottom: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillDark: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
});
