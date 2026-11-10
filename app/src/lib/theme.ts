// Kinnesto "Lime & Plum": warm paper, ink outlines, hard shadows, electric lime for actions,
// violet for people, lime-green for places. Loud enough for Gen Z, calm enough to read for everyone.
export const colors = {
  ink: '#17112B',
  paper: '#FBF7EF',
  lime: '#CCFF4D',
  limeSoft: '#EEFFC4',
  violet: '#6C3BFF',
  lilac: '#BBA6FF',
  pink: '#FF5FA2',
  plum: '#2A1660',
  tangerine: '#FF7A3D',

  // Semantic tokens used across screens.
  brand: '#6C3BFF',
  brandDark: '#3A1C9E',
  brandSoft: '#EEE7FF',
  place: '#177245',
  placeSoft: '#EEFFC4',
  bg: '#FBF7EF',
  card: '#FFFFFF',
  muted: '#6B6580',
  line: '#E8E0D3',
  like: '#19B86B',
  nope: '#FF4D6D',
  gold: '#F59E0B',
  goldSoft: '#FEF3C7',
};

export const gradients = {
  brand: ['#6C3BFF', '#A24BFF', '#FF5FA2'] as const,
  place: ['#CCFF4D', '#9BF27A'] as const,
  night: ['#1B0F3D', '#2A1660', '#4B1F86'] as const,
  scrim: ['transparent', 'rgba(23,17,43,0.55)', 'rgba(23,17,43,0.94)'] as const,
};

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  bold: 'PlusJakartaSans_700Bold',
  semibold: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  regular: 'PlusJakartaSans_400Regular',
};

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

// Ink outline + hard offset shadow: the signature look. boxShadow works on iOS, Android and web.
export const hard = (offset = 4) => ({ borderWidth: 2, borderColor: colors.ink, boxShadow: `${offset}px ${offset}px 0px ${colors.ink}` });

// Content column width on wide (web/tablet) screens.
export const MAX_WIDTH = 1120;
