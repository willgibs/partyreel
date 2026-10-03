import { marketingImage } from "@/lib/constants/marketing-media";
import { previewJoinUrl } from "@/lib/events/share-urls";

/**
 * ONE WEDDING, THE SITE'S OWN: Maya & Jay's (hosted by Maya), the one
 * fictional album the marketing site and the desk's boards already follow.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every board's rule). A
 * board's folder is deleted the moment the board retires, so importing
 * another board's fixtures would tie this board's life to a folder it does
 * not own. The camera's numbers are `disposable-mode`'s settled ones, retyped.
 *
 * ★ THE ALBUM STYLES' WORDS ARE `wait-wiring`'s, RETYPED (`lib/disposable/
 * album-style.ts` on its branch, not yet on `launch-prep`): the three names
 * Settings' cards carry and the line under each, which that file says Create's
 * card reads "when the create wizard asks how guests add". The wiring that
 * follows this board imports them from there and drops these copies; a word
 * changed there is the word, and these follow it.
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset, nothing to track the rights of), standing in for a guest's photos.
 * A style's own small picture is drawn from the guest ghost pack Settings'
 * cards draw from, so the two pictures are one picture.
 */

export const EVENT = {
  name: "Maya & Jay's Wedding",
  short: "Maya & Jay",
  host: "Maya",
} as const;

export const SITE = "https://partyreel.com";

/** What every sample code encodes: production's stand-in, which opens no album. */
export const SAMPLE_LINK = previewJoinUrl(SITE);

/** The disposable's settled numbers (disposable-mode r1 to r3): a roll each, developed the next morning. */
export const ROLL = { shots: 24, develops: "9 am" } as const;

/* ── the album styles ─────────────────────────────────────────────────── */

/** Settings' three styles, in its order (`ALBUM_STYLES`): Live, Reviewed, Disposable. */
export const STYLES = ["live", "approval", "disposable"] as const;
export type StyleId = (typeof STYLES)[number];

/** The two a compare of experiences draws: Reviewed is a live album its host lets in. */
export const TWO: readonly StyleId[] = ["live", "disposable"];

export const STYLE_NAMES: Record<StyleId, string> = {
  live: "Live",
  approval: "Reviewed",
  disposable: "Disposable",
};

/** The one line under each name, Settings' own (`styleLine`). */
export const STYLE_LINES: Record<StyleId, string> = {
  live: "Every photo shows the moment it's added.",
  approval: "You let each photo in before anyone sees it.",
  disposable: `The album's camera, ${ROLL.shots} shots each. Everyone's develop at once.`,
};

/* ── the night ────────────────────────────────────────────────────────── */

/**
 * THE NIGHT'S THREE MOMENTS, NAMED BY WHAT HAPPENS, NEVER BY A CLOCK (the
 * round's direction: nothing depends on a timeline, so a morning-only or a
 * two-day event reads as well as an evening's). The disposable's develop time
 * defaults to 9 am the day after the party (`defaultDevelopAt`), so the third
 * moment is the morning after whatever the event is.
 */
export const MOMENTS = [
  { id: "arrive", label: "Arriving" },
  { id: "party", label: "The party" },
  { id: "morning", label: "Next morning" },
] as const;

export type MomentId = (typeof MOMENTS)[number]["id"];
export const MOMENT_IDS: readonly MomentId[] = MOMENTS.map((m) => m.id);

/**
 * EACH STYLE'S LINE AT EACH MOMENT, for the compositions that draw a phone a
 * style (a phone's column is too narrow for Settings' whole line): what a
 * guest meets then, and with it what the host gives up by picking it. The
 * disposable's says it plainly at the party: only their own until 9 am.
 */
export const LINE_AT: Record<MomentId, Record<StyleId, string>> = {
  arrive: {
    live: "Any photo from their phones",
    approval: "Any photo, once you let it in",
    disposable: `${ROLL.shots} shots each, in the album's camera`,
  },
  party: {
    live: "Everyone sees each as it lands",
    approval: "Seen once you let each one in",
    disposable: `Only their own until ${ROLL.develops}`,
  },
  morning: {
    live: "All of it, and the highlight reel",
    approval: "All you let in, and the reel",
    disposable: "Everyone's at once, with a premiere",
  },
};

/** What the night holds: the party's numbers, as a guest's album would count them. */
export const NIGHT = {
  guests: 12,
  /** Everyone's by 10:40 pm, and by the morning. */
  party: 142,
  morning: 214,
  /** On a reviewed album at the party: let in so far, and still waiting for Maya. */
  letIn: 104,
  waiting: 38,
  /** Priya's own shots on her roll by the party. */
  hers: 6,
} as const;

/* ── the stills ───────────────────────────────────────────────────────── */

export type Still = { id: string; src: string };

const still = (id: string): Still => ({ id, src: marketingImage(id).src });

/** What a guest's album holds, newest first, the way the rows lay it. */
export const ALBUM_STILLS: readonly Still[] = [
  "wedding-toast",
  "wedding-petals",
  "party-dj",
  "wedding-golden",
  "reception-table",
  "wedding-rings",
  "concert-confetti",
  "wedding-arch",
  "reception-hall",
  "party-balloons",
  "festival-lights",
  "festival-crowd",
].map(still);

/** The camera's live picture as guests arrive: the arch, before anyone has shot. */
export const ARRIVING = still("wedding-arch");

/** The roll's premiere the morning after: the toast under the string lights. */
export const PREMIERE = still("wedding-toast");

/** The album's own highlight reel the morning after. */
export const REEL = still("wedding-golden");

/** Priya's own six, the only pictures the contact sheet may show her before the develop. */
export const HERS: readonly Still[] = [
  "wedding-golden",
  "wedding-petals",
  "party-dj",
  "wedding-rings",
  "reception-table",
  "wedding-toast",
].map(still);
