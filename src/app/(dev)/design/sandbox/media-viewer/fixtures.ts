import type { GridMedia } from "@/components/app/media-grid";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE OPEN WEDDING ALBUM, AND THE PHOTOGRAPH A TAP OPENS INSIDE IT.
 *
 * Every picture on this board is the same event so that what moves between
 * options is the VIEWER and never the content: Maya and Jay's wedding, hosted
 * by Maya, 14 June, twenty-six items from nine guests. The board opens the
 * seventeenth, a portrait a guest called Priya sent at 11:42 at night, because
 * a portrait is what a phone shoots and it is the shape the viewer handles
 * worst (a 3:4 at 375 fills the screen; the same picture at 1440 leaves half
 * the window black).
 *
 * ★ THE PHOTOGRAPHS ARE THE TWELVE MARKETING STILLS, RE-SHAPED, as
 * `guest-shape` established. They are the only stills the repo holds, the real
 * set is the Higgsfield month's, and eleven of the twelve are 3:2 landscapes,
 * which a party album is not. Each still is DECLARED at a shape a phone
 * actually produces and `MediaTile`'s object-cover crops it, exactly as the
 * real album crops a real upload.
 *
 * ★ THE ONE CLIP IS A STAND-IN AND IT IS REAL BYTES. `video` asks whether a
 * clip that has not been played should look like a photograph, and the two
 * answers that differ (the OS bar drawn by the browser itself, and a muted
 * autoplay) cannot be judged from a poster: one is another company's design
 * language and the other is motion. So `public/lab/media-viewer/clip.mp4` is an
 * 85 KB, four second, 540 by 810 pan across the reception toast, a still the
 * album does not otherwise open on, so nobody mistakes the clip for the
 * photograph beside it.
 * A real party clip is asked for in the Handoff; when it lands this file is the
 * only thing that changes.
 */

/** The event, in the words the viewer would carry. */
export const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "2026-06-14",
  token: "maya-jay",
  guests: 9,
} as const;

/** The shapes a phone's camera roll actually holds, as width to height. */
const SHAPES = {
  P: [3, 4],
  T: [9, 16],
  L: [4, 3],
  S: [1, 1],
  F: [4, 5],
  W: [16, 9],
} as const;

/** Sixteen portraits, four landscapes, two squares, two at 4:5, one wide, one tall. */
const ROLL = "PLPTPSPLFPPWPTLPPFLPTPSLPP";

/**
 * The still each tile wears. Searched the way `guest-shape` searched its own:
 * twelve stills over twenty-six tiles repeat about twice each, and where the
 * repeats LAND is the only part an author controls. No two copies of one
 * photograph sit side by side or within a tile's height of each other at two
 * columns of 166 px or six of 230 px.
 */
const ORDER = [
  4, 10, 0, 7, 2, 9, 5, 11, 1, 8, 3, 6, 10, 0, 4, 9, 11, 2, 7, 5, 1, 6, 3, 8, 0,
  9,
] as const;

/** Nine guests, in the mix a real album has: mostly named, one host, one anonymous. */
const WHO: readonly (Pick<
  GridMedia,
  "uploaderName" | "isHost" | "isAnonymous" | "uploaderEmail"
> & { at: string })[] = [
  { uploaderName: "Maya", isHost: true, at: "6:10 pm" },
  { uploaderName: "Tom", at: "7:02 pm" },
  { uploaderName: "Sam", at: "11:04 pm" },
  { uploaderName: "Dan", at: "9:18 pm" },
  { uploaderName: "Aunt Bev", at: "8:31 pm" },
  { uploaderName: "Nina", at: "10:05 pm" },
  { uploaderName: "Leah", at: "7:47 pm" },
  { uploaderName: "Priya", at: "11:42 pm" },
  { uploaderName: "Ife", at: "9:52 pm" },
];

/**
 * ★ EVERY UPLOAD CARRIES A NAME, AT ONE OF THREE LEVELS OF TRUST (the identity
 * model, docs/systems/guest-flow.md "Joining + identity"). A typed name, with or
 * without an address nobody has proved, reads publicly as the same thing: the
 * plain disc, the Unverified mark, and no page behind it. A confirmed account is
 * the only identity that uploads as itself: its seeded face, and a page once it
 * has a handle. Priya took the photograph the board opens on and confirmed
 * nothing, so the mark is on the stage rather than three tiles down it.
 */
const UNPROVEN = new Set(["Priya", "Nina"]);

/** Whether this upload's name is a typed one nobody has proved. */
export const isUnproven = (item: GridMedia) =>
  !item.isHost && UNPROVEN.has(item.uploaderName ?? "");

/**
 * The seed behind the face a CONFIRMED account wears (`seed-avatar` r1 and r2),
 * and nothing for a typed name: a colour is an identity on every other surface,
 * so a name nobody proved wears the plain disc, exactly as the shipped guest list
 * draws it (src/components/social/guest-list.tsx, `Face`).
 *
 * A fixture NAME rather than an id: `seedFor` is server-only by design and a raw
 * account id must never reach a browser that does not already hold it
 * (src/lib/avatar/seed.ts), so a board that only needs a stable hue per person
 * hashes something it invented.
 */
export const seedOf = (item: GridMedia) =>
  isUnproven(item)
    ? undefined
    : `mv-${(item.uploaderName ?? "guest").toLowerCase()}`;

/**
 * Whether a person's page stands behind this credit. A typed name has none (a
 * profile is a 404 until a confirmed account claims a handle); every confirmed
 * uploader in this album has claimed one, so their credit is a door.
 */
export const hasPage = (item: GridMedia) => !isUnproven(item);

/** The index the board opens on: a portrait, sent late, by a guest with a name. */
export const OPENED = 16;

/**
 * The confirmed guest `who` is asked about beside Priya: Leah, who confirmed an
 * address and claimed a handle, so her credit wears her seeded face and is a
 * door to her page.
 */
export const CONFIRMED_NAME = "Leah";

/**
 * The same guest's LANDSCAPE, for the knob that asks a decision twice. Priya
 * took both, so flipping the shape never changes who took it: the only thing
 * that moves is the geometry the viewer has to solve.
 */
export const LANDSCAPE_AT = 7;

/** The clip's place in the album, so the same album answers `video` too. */
export const CLIP_AT = 20;

/** The one this device added, so `who` can be asked on a guest's own photograph. */
export const MINE_AT = 5;

export const CLIP_SRC = "/lab/media-viewer/clip.mp4";

/**
 * The album. `uploaderEmail` rides only on the HOST's copy below, because it is
 * host-gallery-only by construction and a guest's viewer must never hold it.
 */
export const ALBUM: GridMedia[] = [...ROLL].map((letter, i) => {
  const img = MARKETING_IMAGES[ORDER[i] % MARKETING_IMAGES.length];
  const [w, h] = SHAPES[letter as keyof typeof SHAPES];
  const who = WHO[i % WHO.length];
  const isClip = i === CLIP_AT;
  return {
    id: `mv-${i}`,
    type: isClip ? "video" : "photo",
    url: isClip ? CLIP_SRC : img.src,
    downloadUrl: isClip ? CLIP_SRC : img.src,
    status: "approved",
    width: isClip ? 540 : w * 400,
    height: isClip ? 810 : h * 400,
    durationSeconds: isClip ? 4 : undefined,
    uploaderName: who.uploaderName,
    isHost: who.isHost,
    // The shipped field every credit reads the mark from (`isVerified: false`
    // draws it), set the way `resolveUploaderIdentity` would: the host and every
    // confirmed guest true, a typed name false.
    isVerified: who.isHost || !UNPROVEN.has(who.uploaderName ?? ""),
    isAnonymous: who.isAnonymous,
  } satisfies GridMedia;
});

/** When each item was sent, for the chrome that says WHEN as well as who. */
export const SENT_AT: string[] = ALBUM.map(
  (_, i) => WHO[i % WHO.length].at ?? "9:00 pm",
);

/**
 * The same album as its HOST sees it: the like counts, and an address only where
 * one was PROVED.
 *
 * ★ THE HOST SEES A BADGE, NEVER AN UNPROVED ADDRESS (the identity model; the
 * one precedence rule, src/lib/media/uploader-identity.ts). A confirmed guest's
 * address is the one `resolveUploaderIdentity` returns, and the shipped host
 * viewer prints it under the name; a typed name returns none, whatever address
 * was typed at the door, and the host's own upload carries none either. An
 * address under Priya's name would print the exact impersonation the identity
 * model exists to prevent: a claim the host has no way to check.
 */
export const HOST_ALBUM: GridMedia[] = ALBUM.map((m, i) => ({
  ...m,
  likeCount: [0, 3, 11, 1, 0, 6, 2, 0, 4][i % 9],
  uploaderEmail:
    m.isHost || isUnproven(m)
      ? null
      : `${(m.uploaderName ?? "guest").toLowerCase().replace(/\s+/g, ".")}@example.com`,
  status: i === 12 ? "pending" : m.status,
}));

/** The photograph the board opens on, and its two neighbours. */
export const CURRENT = ALBUM[OPENED];
export const LANDSCAPE = ALBUM[LANDSCAPE_AT];
export const BEFORE = ALBUM[OPENED - 1];
export const AFTER = ALBUM[OPENED + 1];
export const CLIP = ALBUM[CLIP_AT];

/**
 * THE SAME PHOTOGRAPH, CREDITED TO A CONFIRMED ACCOUNT, for the knob `who` is
 * asked on. The set holds one portrait still, so Leah's own photograph would
 * change the picture under the credit being judged: here the knob changes whose
 * credit it is and nothing else. The host's copy carries the address the one
 * precedence rule hands over for a confirmed account.
 */
export const CONFIRMED: GridMedia = {
  ...CURRENT,
  uploaderName: CONFIRMED_NAME,
  isVerified: true,
};
export const HOST_CONFIRMED: GridMedia = {
  ...HOST_ALBUM[OPENED],
  uploaderName: CONFIRMED_NAME,
  isVerified: true,
  uploaderEmail: `${CONFIRMED_NAME.toLowerCase()}@example.com`,
};

/** Where an item sits in the album, in the words the counter uses. */
export const indexOf = (item: GridMedia) =>
  ALBUM.findIndex((m) => m.id === item.id);
export const positionOf = (item: GridMedia) =>
  `${indexOf(item) + 1} of ${ALBUM.length}`;
export const sentAt = (item: GridMedia) => SENT_AT[indexOf(item)] ?? "9:00 pm";

/** The nine frames a filmstrip would carry: four back, the current, four on. */
export const STRIP = ALBUM.slice(OPENED - 4, OPENED + 5);

/** "17 of 26", the counter the shipped viewer never turns off. */
export const POSITION = positionOf(CURRENT);

/* ── the second origin: the live reel ─────────────────────────────────────── */

/**
 * ★ A PHOTOGRAPH OPENS FROM TWO PLACES NOW (the reel round, 2026-09-22). The
 * live reel plays everything the album shows, and `reel-view.tap` asks whether
 * a tap on its picture opens that item in this viewer. So the three questions
 * about arriving, leaving and a video are drawn from both origins: a tile in the
 * album, and the reel paused on the photograph a guest tapped.
 *
 * The reel's look is a stand-in, named as one, exactly as `reel-view`'s own
 * fixtures name it: Cinematic (`classic`), today's default mood, because the
 * loop-tuned default the ruling asks for has not been designed yet. The take is
 * the tapped item and the two photographs after it, the fewest a live reel plays
 * (it is alive from the third item).
 */
export const REEL_STYLE = "classic";
export const REEL_SEED = 482_913;

/**
 * How far into the clip the reel was when a guest tapped it: the live reel
 * plays a WINDOW of a video (muted, from Include videos), so the viewer may be
 * opened mid-clip. 1.5 s of the fixture's four.
 */
export const REEL_MOMENT_SEC = 1.5;

/** The take a reel frame of `item` is drawn from: the item first, then two photographs after it. */
export function reelTakeOf(item: GridMedia): GridMedia[] {
  const at = indexOf(item);
  const after = [...ALBUM.slice(at + 1), ...ALBUM.slice(0, at)].filter(
    (m) => m.type === "photo",
  );
  return [item, ...after.slice(0, 2)];
}
