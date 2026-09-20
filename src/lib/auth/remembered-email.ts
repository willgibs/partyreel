/**
 * WHAT THIS DEVICE REMEMBERS ABOUT THE LAST HOST THROUGH THE DOOR.
 *
 * ★ RULED (Will, 2026-09-20, `app-door` r1 `return=tap`), and FLAGGED back in
 * one sentence: a press that signs anyone in without a credential is never
 * acceptable, and a passkey IS a credential, so the one-press is right exactly
 * as far as passkeys reach. Everything in THIS file is the fallback underneath
 * it: a hint, never an authorization. Nothing here signs anyone in, nothing
 * here is read by a server, and a forged value buys an attacker a prefilled
 * text field.
 *
 * ★ WHERE THE HINT IS ALLOWED TO SHOW, AND WHY THAT IS NOT A PREFERENCE.
 * `/login` only. The guest gate and the Save dialog pass no hint at all,
 * because the phone they run on is passed around a party and the iPad they run
 * on belongs to the venue: showing the last guest's address to the next guest
 * is the one failure mode this whole idea has, and a per-surface rule is the
 * only thing that closes it. No email ever goes in a URL either, for the same
 * reason plus the referrer.
 *
 * ★ AND IT MUST SURVIVE HAVING NO STORAGE AT ALL. Private windows, blocked
 * site data and the server render all make `localStorage` absent or throwing,
 * and a door that cannot open is worse than a door that forgot you, so every
 * read and write is wrapped and every failure is "we remember nothing".
 */

/** How the remembered host last got in. Decides which one-press to offer. */
export type DoorMethod = "code" | "google" | "password" | "passkey";

export type RememberedDoor = {
  email: string;
  method: DoorMethod;
};

const DOOR_KEY = "pr_door_last";

/**
 * Set at passkey REGISTRATION, read at the door. It is not proof a passkey
 * exists (the browser owns that, and only `navigator.credentials` can answer
 * it): it is what lets the door draw the one-press button without firing a
 * WebAuthn ceremony on page load, which would throw a system sheet at a
 * stranger. A stale hint costs one refused press and clears itself.
 */
const PASSKEY_KEY = "pr_passkey_hint";

/** Set once the door has offered to save a passkey, so it offers once. */
const PASSKEY_OFFERED_KEY = "pr_passkey_offered";

const METHODS: readonly DoorMethod[] = ["code", "google", "password", "passkey"];

/**
 * The store, or null. Reading `globalThis.localStorage` THROWS (not returns
 * undefined) when site data is blocked, so even the lookup is wrapped.
 */
function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    store()?.setItem(key, value);
  } catch {
    // A full or blocked store means this device remembers nothing. That is a
    // complete, working outcome here, never an error worth surfacing.
  }
}

function drop(key: string): void {
  try {
    store()?.removeItem(key);
  } catch {
    // see write()
  }
}

/** Remember the address and the method that just worked. */
export function rememberDoor(door: RememberedDoor): void {
  if (!door.email) return;
  write(DOOR_KEY, JSON.stringify({ email: door.email, method: door.method }));
}

/**
 * What this device remembers, or null. Anything malformed reads as null: the
 * value is attacker-writable by definition (it is the visitor's own storage),
 * so it is parsed like untrusted input rather than trusted because we wrote it.
 */
export function readRememberedDoor(): RememberedDoor | null {
  const raw = read(DOOR_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const { email, method } = parsed as { email?: unknown; method?: unknown };
    if (typeof email !== "string" || !email.includes("@")) return null;
    if (typeof method !== "string") return null;
    if (!METHODS.includes(method as DoorMethod)) return null;
    return { email, method: method as DoorMethod };
  } catch {
    return null;
  }
}

/** "Not you?" — the device forgets, and the door resets to a stranger's. */
export function forgetRememberedDoor(): void {
  drop(DOOR_KEY);
  drop(PASSKEY_KEY);
  drop(PASSKEY_OFFERED_KEY);
}

/** Stamped when a passkey is registered on this device. */
export function rememberPasskey(): void {
  write(PASSKEY_KEY, "1");
}

export function hasPasskeyHint(): boolean {
  return read(PASSKEY_KEY) === "1";
}

export function forgetPasskey(): void {
  drop(PASSKEY_KEY);
}

/** The offer is made once per device, whatever the answer. */
export function passkeyOffered(): boolean {
  return read(PASSKEY_OFFERED_KEY) === "1";
}

export function markPasskeyOffered(): void {
  write(PASSKEY_OFFERED_KEY, "1");
}

/**
 * The address, shown rather than spelled: "nadia@gmail.com" reads as
 * "n••••@gmail.com". Enough for a host to recognise their own account, not
 * enough to hand a stranger a working address off a shared screen.
 *
 * Pure, and the one piece of this module a test can hold to exact output.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return `${local}${domain}`;
  return `${local[0]}${"•".repeat(Math.min(local.length - 1, 5))}${domain}`;
}
