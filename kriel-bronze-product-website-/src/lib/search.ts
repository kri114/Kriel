/**
 * Normalizes a string for diacritics-insensitive search matching.
 * Lowercases and strips accents/diacritics so e.g. "gërma" and "germa"
 * (or "çmimi" and "cmimi") are treated as equivalent.
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
