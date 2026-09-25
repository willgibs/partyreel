/**
 * The durable first-party device UUID (trust-safety-forensics.md). A random UUID minted once per browser
 * and persisted in localStorage, sent with every upload COMPLETE request so `upload_forensics`
 * can correlate abuse across events even when session tokens rotate.
 *
 * ★ CAPTURE-ONLY: this id must never feed product logic, gating, analytics, or any
 * host/guest-visible surface. It exists solely for the deny-all forensic record.
 *
 * Best-effort: blocked storage (private mode, iframe policies) or a non-browser context returns
 * null and the upload proceeds without it — a missing device id must never block a guest.
 */

const STORAGE_KEY = "pr_device_id";

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const minted = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, minted);
    return minted;
  } catch {
    return null;
  }
}
