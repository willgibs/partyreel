/**
 * THE PARTY'S OWN TIME ZONE (event-zone; Will, 2026-10-05: "It feels unfair to unlock the album at different times for
 * certain guests based on geographical location. Is there a way to standardize this?").
 *
 * An event keeps one IANA zone, `events.time_zone` (20261005220000), so the morning after the party is ONE morning, the
 * party's, for every reader wherever they are: the album turns at 9 am there and a disposable's default develop is the
 * same 9 am (`zone-morning.ts`). The zone is captured, never asked: Create sends the host's own browser zone, a Settings
 * save of the dates writes it where a row has none, and only her explicit choice of the party's city moves it. A host
 * who never travels never sees a zone.
 *
 * ★ A ZONE IS READ ONLY WHERE THE RUNTIME CAN READ IT (`readableZone`): an IANA-shaped name (never an offset like
 * "+05:30", which `Intl` accepts and the column refuses) that this runtime's `Intl` constructs. The browser's word is a
 * claim, so the server asks again before it stores one.
 *
 * ★ ONE FALLBACK, SAID HERE (`PARTY_ZONE_FALLBACK`): a row with no zone (test data from before the column) or one the
 * runtime cannot read turns in UTC, album-order's own fallback for an unreadable zone, so even then every reader meets
 * one moment.
 *
 * ★ STORED AS GIVEN, COMPARED AS THE RUNTIME RESOLVES IT. Node's ICU resolves "Asia/Kolkata" to "Asia/Calcutta" and
 * "Europe/Kyiv" to "Europe/Kiev", so a zone is kept in the browser's own spelling (its place names say the modern
 * city), and two spellings of one zone are one zone (`sameZone`).
 *
 * Pure and isomorphic: the page's server, Settings and Create all read it.
 */

/** The one zone a party with none, or one the runtime cannot read, turns in. */
export const PARTY_ZONE_FALLBACK = "UTC";

/**
 * THE COLUMN'S ENVELOPE, mirrored by `events_time_zone_shape` (20261005220000) under `zone-migration.test.ts`: at most
 * 64 characters (the longest IANA name is 32), a letter first, then letters, digits and `_ + / -`. An envelope, never
 * the list of zones, so a zone added to the database of zones needs no migration.
 */
export const ZONE_MAX_LENGTH = 64;
export const ZONE_PATTERN = "^[A-Za-z][A-Za-z0-9_+/-]*$";
const ZONE_SHAPE = new RegExp(ZONE_PATTERN);

/**
 * A zone this runtime can read, in its own spelling as given (trimmed), or null: not a string, outside the envelope
 * (an offset, a space, too long), or a name `Intl` refuses ("Etc/Unknown", a zone this runtime's database lacks).
 */
export function readableZone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const zone = raw.trim();
  if (!zone || zone.length > ZONE_MAX_LENGTH || !ZONE_SHAPE.test(zone)) {
    return null;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return null;
  }
}

/** The zone a party turns in: its own where the runtime can read it, else the one fallback. */
export function partyZoneOf(stored: string | null | undefined): string {
  return readableZone(stored) ?? PARTY_ZONE_FALLBACK;
}

/**
 * The runtime's own name for a readable zone, the key two spellings of one zone share ("Asia/Kolkata" and
 * "Asia/Calcutta"), or null. A formatter is built to answer it, so a list compares keys it resolved once.
 */
export function zoneKey(zone: string | null | undefined): string | null {
  const readable = readableZone(zone);
  if (!readable) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: readable,
  }).resolvedOptions().timeZone;
}

/** Whether two names are one zone to this runtime (never true of a zone it cannot read). */
export function sameZone(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ra = zoneKey(a);
  return ra !== null && ra === zoneKey(b);
}

/**
 * Where the browser's own name for its zone is read, the one place (a test names a host's zone by spying on
 * `zoneName`, since bending `Intl` itself would bend `sameZone`'s own resolution too).
 */
export const browserZone = {
  zoneName: (): string | undefined =>
    Intl.DateTimeFormat().resolvedOptions().timeZone,
};

/**
 * THE HOST'S OWN ZONE, as her browser names it, or null where it names none this runtime can read (an old engine, a
 * system zone it reports as "Etc/Unknown"). ★ A BROWSER'S ANSWER ONLY: called on the server it names the server's own
 * zone, so a caller reads it in an event handler or after hydration, never in a render the server also draws.
 */
export function deviceZone(): string | null {
  try {
    return readableZone(browserZone.zoneName());
  } catch {
    return null;
  }
}

/**
 * THE PARTY'S ZONE AS ITS HOST'S OWN SCREENS READ IT (Create, Settings): its own where it has one; else hers, since a
 * party with none takes her zone with its next save of a time (Create's capture, Settings' date); null where neither
 * can be named (a browser that names no zone this runtime reads), and a caller keeps the browser's own clock then. A
 * browser's answer, like `deviceZone`.
 */
export function hostPartyZone(
  stored: string | null | undefined,
): string | null {
  return readableZone(stored) ?? deviceZone();
}

/**
 * THE PARTY'S ZONE WHERE IT IS NOT THE HOST'S OWN (the far-from-home words, `zone-words.ts`): its readable zone when her
 * browser names another (or none it can read), else null, and a time on her screens is then her own clock, as it always
 * was. A browser's answer, like `deviceZone`: read after hydration.
 */
export function farZone(stored: string | null | undefined): string | null {
  const party = readableZone(stored);
  if (party === null) return null;
  return sameZone(party, deviceZone()) ? null : party;
}

/* ───────────────────────────── its place ─────────────────────────────── */

/**
 * ICU's legacy spellings of cities since renamed (its canonical ids keep the old names), said in the city's own modern
 * name. Display only: the stored zone is never rewritten.
 */
const RENAMED: Record<string, string> = {
  Asmera: "Asmara",
  Calcutta: "Kolkata",
  Coral_Harbour: "Atikokan",
  Enderbury: "Kanton",
  Faeroe: "Faroe",
  Godthab: "Nuuk",
  Katmandu: "Kathmandu",
  Kiev: "Kyiv",
  Ponape: "Pohnpei",
  Rangoon: "Yangon",
  Saigon: "Ho Chi Minh",
  Truk: "Chuuk",
  Ulan_Bator: "Ulaanbaatar",
};

/**
 * THE PLACE A ZONE NAMES, as a host reads it: its city ("America/Mexico_City" is "Mexico City",
 * "America/Argentina/Buenos_Aires" is "Buenos Aires"), "UTC" for UTC, and a fixed offset for the `Etc/GMT` zones,
 * whose sign POSIX inverts ("Etc/GMT+5" is UTC-5).
 */
export function zonePlace(zone: string): string {
  if (zoneKey(zone) === "UTC") return "UTC";
  const offset = /^Etc\/GMT([+-])(\d{1,2})$/.exec(zone);
  if (offset) return `UTC${offset[1] === "+" ? "−" : "+"}${offset[2]}`;
  const city = zone.split("/").pop() ?? zone;
  return RENAMED[city] ?? city.replace(/_/g, " ");
}
