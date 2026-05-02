const STORAGE_KEY = "cloudide-user-key";

/**
 * Returns a stable per-browser UUID used to scope projects.
 * Generated on first visit and stored in localStorage.
 */
export function getUserKey(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-f0-9-]{32,36}$/i.test(existing)) return existing;

    const newKey = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, newKey);
    return newKey;
  } catch {
    // SSR / private browsing fallback
    return "00000000-0000-0000-0000-000000000000";
  }
}
