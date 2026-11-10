// Kinnesto "Midnight & Marigold": deep ink, cool off-white, one warm saffron accent and a sea-teal for places.
// Depth comes from soft shadows and hairlines, not outlines. Photography does the talking.
export const colors = {
  ink: '#121119',
  ink2: '#2B2838',
  paper: '#F6F5F2',
  marigold: '#F4A51C',
  marigoldSoft: '#FFF3DC',
  sea: '#11615F',
  seaSoft: '#E2F1EF',
  rose: '#E2546B',

  // Semantic tokens used across screens.
  brand: '#B86E00', // marigold, deepened for text on light backgrounds
  brandDark: '#7A4800',
  brandSoft: '#FFF3DC',
  place: '#11615F',
  placeSoft: '#E2F1EF',
  bg: '#F6F5F2',
  card: '#FFFFFF',
  muted: '#6C6878',
  line: '#E5E2DC',
  like: '#1E9E6A',
  nope: '#E2546B',
  gold: '#F4A51C',
  goldSoft: '#FFF3DC',
};

export const gradients = {
  brand: ['#F8B840', '#F4A51C', '#E58E0B'] as const,
  place: ['#167A77', '#11615F'] as const,
  night: ['#0C0B12', '#1A1826', '#25212F'] as const,
  scrim: ['transparent', 'rgba(12,11,18,0.45)', 'rgba(12,11,18,0.9)'] as const,
};

export const fonts = {
  display: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  bold: 'PlusJakartaSans_700Bold',
  semibold: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  regular: 'PlusJakartaSans_400Regular',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

// Soft elevation used for cards and floating controls (boxShadow works on iOS, Android and web).
export const shadow = {
  sm: { boxShadow: '0px 1px 2px rgba(18,17,25,0.06), 0px 2px 8px rgba(18,17,25,0.05)' },
  md: { boxShadow: '0px 2px 6px rgba(18,17,25,0.06), 0px 12px 32px rgba(18,17,25,0.08)' },
  lg: { boxShadow: '0px 8px 24px rgba(18,17,25,0.10), 0px 32px 64px rgba(18,17,25,0.14)' },
};

// A hairline-bordered surface with soft elevation. (Kept under the old name so existing callers restyle with it.)
export const hard = (level: 1 | 2 | 3 | 4 | 5 | 6 = 2) => ({
  borderWidth: 1,
  borderColor: colors.line,
  ...(level >= 5 ? shadow.lg : level >= 3 ? shadow.md : shadow.sm),
});

// Content column width on wide (web/tablet) screens.
export const MAX_WIDTH = 1160;
