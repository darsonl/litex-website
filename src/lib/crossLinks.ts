import { refToId, type EntryRef } from './references';

/**
 * The reverse half of the dual-entry IA (spec §2): products declare their
 * applications, so "which products claim this application" is a lookup rather
 * than a second hand-maintained list that can drift out of sync.
 */
export function productsClaiming<T extends { data: { applications: EntryRef[] } }>(
  products: T[],
  applicationId: string,
): T[] {
  return products.filter((product) =>
    product.data.applications.some((ref) => refToId(ref) === applicationId),
  );
}
