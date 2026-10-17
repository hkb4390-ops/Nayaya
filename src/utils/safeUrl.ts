/**
 * Resolve a value to an absolute http(s) URL, or return null.
 * Rejects javascript:, data:, file: and any other non-http(s) scheme.
 */
export function toSafeHttpUrl(value: string, base?: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
