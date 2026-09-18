// Build a "not-yet-expired" filter for `find()` controllers. Entries are
// listed when:
//   - `expiredAt` (the explicit editor override) is in the future, OR
//   - `expiredAt` is null AND the natural date field is null or in the
//     future
//
// Editors get fine-grained control: set `expiredAt` to keep an old event
// visible (recurring annual), or set it to a past date to hide a future
// event early. With no `expiredAt` set, the natural date drives expiry
// — preserving the original implicit behaviour.
//
// Used by event.find (`fallbackField: 'date'`) and dining-promotion.find
// (`fallbackField: 'validTo'`). Detail-by-slug queries bypass via
// shouldApplyExpiryFilter so /events/<expired-slug> still resolves.
export function buildExpiryFilter(fallbackField: string) {
  // 'YYYY-MM-DD' in Singapore time — date fields are stored as plain dates
  // (no time), and the Club's day rolls over at midnight SGT, not UTC.
  // Containers run UTC; an ISO date would keep yesterday's events listed
  // until 8am Singapore (and out of step with the nightly KB expiry sweep).
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  return {
    $or: [
      // explicit override: editor set expiredAt → respect it
      { expiredAt: { $gte: today } },
      // no override: fall back to the natural date field
      {
        $and: [
          { expiredAt: { $null: true } },
          {
            $or: [
              { [fallbackField]: { $null: true } },
              { [fallbackField]: { $gte: today } },
            ],
          },
        ],
      },
    ],
  };
}

// Skip the expiry filter when the query is already targeting a single
// entry by slug or documentId — these are the "URL alive" code paths.
export function shouldApplyExpiryFilter(query: any): boolean {
  const f = query?.filters;
  if (!f || typeof f !== 'object') return true;
  if ('slug' in f || 'documentId' in f || 'id' in f) return false;
  return true;
}

export function withExpiryFilter(query: any, field: string) {
  if (!shouldApplyExpiryFilter(query)) return query;
  const expiry = buildExpiryFilter(field);
  const existing = query?.filters;
  // Merge: if the consumer already supplied filters, AND-combine via $and.
  if (!existing || Object.keys(existing).length === 0) {
    return { ...query, filters: expiry };
  }
  return { ...query, filters: { $and: [existing, expiry] } };
}
