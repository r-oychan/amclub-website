// Build a "not-yet-expired" filter for `find()` controllers. The entry is
// listed when the date field is null OR still in the future (or today).
// Used by event.find and dining-promotion.find to drop past entries from
// listings; detail-by-slug queries bypass via shouldApplyExpiryFilter so
// /events/<expired-slug> still resolves.
export function buildExpiryFilter(field: string) {
  // 'YYYY-MM-DD' — both event.date and dining-promotion.validTo are stored
  // as date (no time), so this matches Postgres date comparison semantics.
  const today = new Date().toISOString().slice(0, 10);
  return {
    $or: [
      { [field]: { $null: true } },
      { [field]: { $gte: today } },
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
