export const EVENT_PLACEHOLDER_IMAGE = '/images/event-placeholder.svg';

/**
 * Normalise time-of-day strings to uppercase AM/PM form. Handles common
 * variants written by editors and scraped copy:
 *   "8:00 p.m." → "8:00 PM"
 *   "11:30 a.m." → "11:30 AM"
 *   "9 P.M." → "9 PM"
 *   "10am" → "10 AM"
 * Periods are stripped, the AM/PM is capitalised, and a single space is
 * inserted between the time and the meridiem when missing.
 */
export function normalizeAmPm(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/(\d)\s*([ap])\s*\.?\s*m\s*\.?/gi, (_m, d, ap) => `${d} ${ap.toUpperCase()}M `)
    .replace(/  +/g, ' ')
    .replace(/ ([.,;:!?)])/g, '$1')
    .trim();
}
