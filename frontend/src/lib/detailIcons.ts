export type DetailIconName =
  | 'clock'
  | 'location'
  | 'reservation'
  | 'dresscode'
  | 'capacity'
  | 'menu'
  | 'sponsorship';

/**
 * Pick the closest semantic DetailSection icon for a free-text sub-section
 * title (e.g. "Operating Hours" → clock, "Sponsorship" → sponsorship).
 * Shared by VenueDetailPage and the reusable ImageTextPanels component.
 */
export function resolveIcon(title: string): DetailIconName {
  const lower = title.toLowerCase();
  if (lower.includes('sponsor') || lower.includes('partner')) return 'sponsorship';
  if (lower.includes('reserv') || lower.includes('book')) return 'reservation';
  if (lower.includes('menu') || lower.includes('food') || lower.includes('cuisine')) return 'menu';
  if (lower.includes('hour') || lower.includes('time')) return 'clock';
  if (lower.includes('location') || lower.includes('contact')) return 'location';
  if (lower.includes('dress') || lower.includes('attire')) return 'dresscode';
  if (lower.includes('capac') || lower.includes('seat')) return 'capacity';
  return 'reservation';
}
