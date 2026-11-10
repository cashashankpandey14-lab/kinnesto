import type { Listing, Options } from './types';

export function rupees(n: number | null | undefined) {
  if (n == null) return '';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function shortRupees(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`;
  return `₹${n}`;
}

export function budgetRange(min: number | null, max: number | null) {
  if (!max) return '';
  return min ? `${shortRupees(min)}–${shortRupees(max)}/mo` : `Up to ${shortRupees(max)}/mo`;
}

export function priceLabel(l: Pick<Listing, 'price' | 'type'>, options: Options | null) {
  const unit = options?.LISTING_TYPES[l.type]?.priceUnit === 'night' ? 'night' : 'mo';
  return `${rupees(l.price)}/${unit}`;
}

export function moveInLabel(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Now';
  if (days <= 7) return 'This week';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// For mid-sentence use: "Moving now", "Moving this week", "Moving 20 Nov".
export function moveInPhrase(iso: string | null) {
  const label = moveInLabel(iso);
  return label === 'Now' || label === 'This week' ? label.toLowerCase() : label;
}

export function shortTime(iso: string) {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function dateLabel(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

// YYYY-MM-DD for date inputs.
export function isoDay(d: Date | string | null) {
  if (!d) return '';
  const x = new Date(d);
  return Number.isNaN(+x) ? '' : x.toISOString().slice(0, 10);
}

export function nights(checkIn: string, checkOut: string) {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}
