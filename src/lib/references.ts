/**
 * Astro 7.2.0 does NOT fail the build when a `reference()` points at a missing
 * entry — it logs "Entry <collection> → <id> was not found.", exits 0, and
 * renders the reference as nothing at all. That is silent data loss: a product
 * quietly loses its applications and no one finds out.
 *
 * Spec §4 promises typed cross-linking that breaks loudly, so pages resolve
 * references through this guard instead of trusting getEntry() to have found
 * something. Kept free of Astro imports so it stays unit-testable.
 */

/** What Astro's reference() produces once parsed, or the raw id before parsing. */
export type EntryRef = string | { collection: string; id: string };

export function refToId(ref: EntryRef): string {
  return typeof ref === 'string' ? ref : ref.id;
}

export function mustResolve<T>(
  entry: T | undefined,
  ref: EntryRef,
  referencedBy: string,
): T {
  if (entry === undefined || entry === null) {
    throw new Error(
      `Broken reference: "${referencedBy}" points at "${refToId(ref)}", which does not exist. ` +
        `Create the entry or remove the reference — a missing reference must never render as blank.`,
    );
  }
  return entry;
}
