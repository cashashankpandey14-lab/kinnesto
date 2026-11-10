export type ListingType = 'flat' | 'pg' | 'hostel' | 'coliving' | 'bnb';
export type Intent = 'have_place' | 'need_place' | 'team_up';
export type Gender = 'male' | 'female' | 'nonbinary';
export type GenderPref = 'any' | 'male' | 'female';

export interface Options {
  LISTING_TYPES: Record<ListingType, { label: string; emoji: string; blurb: string; priceUnit: 'month' | 'night' }>;
  ROOM_TYPES: Record<string, string>;
  FURNISHING: Record<string, string>;
  GENDER_PREFS: Record<GenderPref, string>;
  GENDERS: Record<Gender, string>;
  AMENITIES: Record<string, { label: string; icon: string }>;
  INTENTS: Record<Intent, { label: string; blurb: string; emoji: string }>;
  LIFESTYLE: Record<string, { label: string; icon: string; options: string[]; ordered?: boolean }>;
  INTERESTS: string[];
  CITIES: string[];
  LAUNCH_CITIES: string[];
  REPORT_REASONS: string[];
}

interface ProfileBase {
  id: string;
  name: string;
  age: number | null;
  gender: Gender | null;
  occupation: string;
  company: string;
  bio: string;
  photos: string[];
  city: string | null;
  localities: string[];
  intent: Intent | null;
  budgetMin: number | null;
  budgetMax: number | null;
  moveIn: string | null;
  lifestyle: Record<string, string>;
  interests: string[];
}

export interface Me extends ProfileBase {
  email: string;
  birthYear: number | null;
  flatmateGender: GenderPref;
  onboarded: boolean;
  isAdmin?: boolean;
}

export interface Person extends ProfileBase {
  recentlyActive: boolean;
  vibe?: number;
  reasons?: string[];
  likedYou?: boolean;
  place?: Listing | null;
}

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  city: string;
  locality: string;
  price: number;
  deposit: number;
  roomType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: string;
  genderPref: GenderPref;
  amenities: string[];
  photos: string[];
  availableFrom: string | null;
  currentFlatmates: number;
  maxGuests: number | null;
  minNights: number | null;
  active: boolean;
  createdAt: string;
  ownerId: string;
  owner: { id: string; name: string; photo: string | null; occupation: string; recentlyActive: boolean } | null;
  fit?: number;
  reasons?: string[];
  saved?: boolean;
  pendingRequests?: number;
}

export interface MatchSummary {
  id: string;
  kind: 'roomie' | 'listing';
  user: Person;
  listing: Listing | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
  createdAt: string;
}

export interface Message {
  id: string;
  from: string;
  text: string;
  createdAt: string;
  readAt: string | null;
}

export interface RequestItem {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  note: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  createdAt: string;
  user: Person;
  listing: Listing;
}
