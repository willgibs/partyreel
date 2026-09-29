import { marketingImage } from "@/lib/constants/marketing-media";
import { NAV, type NavItem } from "@/lib/admin/nav";

/**
 * ONE OPERATOR'S SATURDAY NIGHT, ROUND TWO: fifteen open reports on fourteen
 * things, at the hour weddings are actually running, and every option on the
 * board wears the same night.
 *
 * ★ A NIGHT BIG ENOUGH TO SWEEP. Round one drew three open reports, which
 * cannot tell a batch-first queue from a one-at-a-time one: every shape fits
 * three. Will's note asked for "fast/batch handling rather than slow, one at a
 * time", so this night is mostly the reports a sweep exists for (a wrong event,
 * a blurry photo, last year's party, a spam album, two that are already gone)
 * with a few that are clear harm among them, which is what a real night of an
 * open report button looks like. Every shape draws the SAME rows, so a shape is
 * judged on how it handles this queue, never on how much data its author gave
 * it.
 *
 * ★ EVERY FACT ON A REPORT IS ONE THE PRODUCT CAN READ TODAY, BUT ONE. The
 * frame and its presign, the reason, the album and its host, the uploader's
 * public name and whether it is verified (the lightbox's own caption), how
 * many more she sent to this album, the reports on her other uploads, whether
 * the photo is still up (`media.status`, `removed_by_uploader`), a hold
 * (`legal_hold_at`, operator-only) and several reports on one photo are all
 * rows that exist. WHO REPORTED is new: `reports` stores no reporter by
 * choice, so "a signed-out guest" and "a signed-in guest" would be one new
 * column that keeps the kind and never the person. The handoff names it.
 *
 * ★ THE KIND IS ONLY WORN WHERE THE `harm` ASK SAYS SO. Every report carries
 * the kind its reporter would pick if the form asked one, because the kinds
 * and steer answers draw it; in today's world (the form asks nothing) no
 * surface reads it, and the queue has only the operator's own eye.
 *
 * ★ NOTHING HERE TOUCHES THE DATABASE, and every frame is a `MARKETING_IMAGES`
 * still, so the pictures are all lovely: judge the SIZE and the PLACE of the
 * reported frame, never its content. Every time is a pre-formatted string, so
 * a capture taken twice is the same capture (admin-observability.md's #418).
 */

/* ── What a report can say it is about (the `harm` ask) ─────────────────── */

export type Kind =
  | "sexual"
  | "violence"
  | "private"
  | "consent"
  | "pretend"
  | "other";

/** The words a guest picks from, in the form's order. */
export const KIND_WORDS: Record<Kind, string> = {
  sexual: "Sexual content, or a child at risk",
  violence: "Violence, a threat or hate",
  private: "Someone's private details on show",
  consent: "Me or my child, and I want it down",
  pretend: "Someone pretending to be me",
  other: "Something else",
};

/** The shorter name a queue wears on its chip. */
export const KIND_CHIP: Record<Kind, string> = {
  sexual: "Sexual, or a child at risk",
  violence: "Violence or a threat",
  private: "Private details",
  consent: "Me or my child",
  pretend: "Pretending to be me",
  other: "Something else",
};

/**
 * What the album's Report offers. `pretend` is the person form's (the menu on
 * `/u/<slug>`), not an album's: nobody pretends to be someone in a photograph.
 */
export const FORM_KINDS: readonly Kind[] = [
  "sexual",
  "violence",
  "private",
  "consent",
  "other",
];

/** Worst first: the order the front of the queue is read in. */
const SEVERITY: Record<Kind, number> = {
  sexual: 0,
  violence: 1,
  private: 2,
  consent: 3,
  pretend: 4,
  other: 9,
};

export const isHarmKind = (k: Kind) => k !== "other";

/* ── The night ──────────────────────────────────────────────────────────── */

export type Album = {
  id: string;
  name: string;
  /** The host's address, which an operator sees and a host never learns was read. */
  host: string;
  uploads: number;
  guests: number;
};

export type Uploader = {
  /** The public name the lightbox captions her upload with. */
  name: string;
  /** False when no proved email stands behind the name (the unverified mark). */
  verified: boolean;
  /** How many more she sent to this album. */
  more: number;
  /** Reports on her other uploads here, open or closed. */
  otherReports: number;
  /** Her other uploads under a legal hold. */
  heldOthers: number;
};

/** Where the reported photo is right now. */
export type ItemState = "up" | "hidden" | "withdrawn";

/** Who reported: the one new fact (see the header). */
export type Reporter = "guest" | "account";

export type OneReport = {
  id: string;
  when: string;
  reason: string | null;
  reporter: Reporter;
  /** What she would pick if the form asked (worn only where `harm` says). */
  kind: Kind;
  /** She confirmed her email as she reported (worn only under `proof=confirm`). */
  confirmed?: true;
};

export type Entry = {
  /** The newest report's id: an entry is the thing reported, with its reports. */
  id: string;
  subject: "item" | "album" | "person";
  album: Album | null;
  person: { name: string; slug: string | null } | null;
  media: { id: string; image: string; type: "photo" | "video" } | null;
  uploader: Uploader | null;
  state: ItemState | null;
  /** This photo is under a legal hold already. */
  held: boolean;
  /** Newest first; more than one is several people reporting one photo. */
  reports: readonly [OneReport, ...OneReport[]];
};

const A = {
  hannah: {
    id: "a1",
    name: "Hannah and Theo",
    host: "maya.whitlock@gmail.com",
    uploads: 212,
    guests: 64,
  },
  riverside: {
    id: "a2",
    name: "Riverside Summer Party",
    host: "sam@riversideclub.co",
    uploads: 540,
    guests: 180,
  },
  northgate: {
    id: "a3",
    name: "Northgate Formal",
    host: "office@northgate.sch.uk",
    uploads: 388,
    guests: 120,
  },
  priya: {
    id: "a4",
    name: "Priya and Dev",
    host: "priya.n@outlook.com",
    uploads: 176,
    guests: 52,
  },
  okafor: {
    id: "a5",
    name: "Okafor Reunion",
    host: "chidi.okafor@gmail.com",
    uploads: 94,
    guests: 30,
  },
  lakeside: {
    id: "a6",
    name: "Lakeside Gala",
    host: "events@lakesidegala.org",
    uploads: 61,
    guests: 40,
  },
  marlow: {
    id: "a7",
    name: "Marlow Christening",
    host: "j.marlow@fastmail.com",
    uploads: 48,
    guests: 22,
  },
} satisfies Record<string, Album>;

const KERRY: Uploader = {
  name: "Kerry",
  verified: false,
  more: 14,
  otherReports: 1,
  heldOthers: 0,
};
const ARJUN: Uploader = {
  name: "Arjun",
  verified: false,
  more: 6,
  otherReports: 2,
  heldOthers: 0,
};
const TOLA: Uploader = {
  name: "Tola A.",
  verified: true,
  more: 10,
  otherReports: 1,
  heldOthers: 0,
};

/**
 * The fourteen things reported tonight, newest first. The ids are real-shaped
 * (a v4 UUID is what a hold is set on, and shortening it would draw that act
 * smaller than it is).
 */
export const ENTRIES: readonly Entry[] = [
  {
    id: "8d2f0b14-6a37-4c51-9f0e-2b7a41c9de83",
    subject: "item",
    album: A.hannah,
    person: null,
    media: {
      id: "c47d91a2-5e08-4b6f-8a13-0d5f7e2c9481",
      image: "wedding-toast",
      type: "photo",
    },
    uploader: KERRY,
    state: "up",
    held: false,
    reports: [
      {
        id: "8d2f0b14-6a37-4c51-9f0e-2b7a41c9de83",
        when: "22:41",
        reason:
          "That's my daughter in the background and she is twelve. Please take it down, I don't know the person who posted it and nobody asked us.",
        reporter: "guest",
        kind: "consent",
        confirmed: true,
      },
    ],
  },
  {
    id: "5a7c2e90-1b4d-4f8e-9c36-0e2d8b7f4a15",
    subject: "item",
    album: A.riverside,
    person: null,
    media: {
      id: "e91b3c7d-2a54-4e0f-b8c6-7d1f9a2e5b43",
      image: "reception-table",
      type: "photo",
    },
    uploader: {
      name: "Dan Whelan",
      verified: true,
      more: 31,
      otherReports: 0,
      heldOthers: 0,
    },
    state: "up",
    held: false,
    reports: [
      {
        id: "5a7c2e90-1b4d-4f8e-9c36-0e2d8b7f4a15",
        when: "22:30",
        reason:
          "My driving licence is on the table in this one and you can read my address on it.",
        reporter: "account",
        kind: "private",
      },
    ],
  },
  {
    id: "f3b9d104-7e2a-4c85-a16d-5c0e8f2b9a71",
    subject: "item",
    album: A.northgate,
    person: null,
    media: {
      id: "2c8e5f1a-9d37-4b60-8e24-f1a7c3d9b056",
      image: "festival-crowd",
      type: "photo",
    },
    // Her photo of 8 September was held (round one's closed report af30c682):
    // the one fact on the night that says this uploader is not new to a report.
    uploader: {
      name: "Maddie R.",
      verified: false,
      more: 8,
      otherReports: 1,
      heldOthers: 1,
    },
    state: "up",
    held: false,
    reports: [
      {
        id: "f3b9d104-7e2a-4c85-a16d-5c0e8f2b9a71",
        when: "22:12",
        reason:
          "There is a photo in here of a student from our school. She is under 18 and it should not be public. I have told the school as well.",
        reporter: "guest",
        kind: "sexual",
      },
    ],
  },
  {
    id: "b62d8e3f-4c19-47a0-8f5b-3e9c1a7d2b64",
    subject: "item",
    album: A.hannah,
    person: null,
    media: {
      id: "7a1c9e4b-3f62-4d85-b0e7-9c2f5a8d1e36",
      image: "wedding-rings",
      type: "photo",
    },
    uploader: KERRY,
    state: "up",
    held: false,
    // Two reports on one photo: one entry, counted, each reason inside.
    reports: [
      {
        id: "b62d8e3f-4c19-47a0-8f5b-3e9c1a7d2b64",
        when: "22:07",
        reason: "please delete this one",
        reporter: "account",
        kind: "other",
      },
      {
        id: "0e4a7c2d-8b31-4f96-a5e0-6d2b9f8c1a47",
        when: "22:05",
        reason: "I look awful in this one, can you delete it",
        reporter: "account",
        kind: "other",
      },
    ],
  },
  {
    id: "3e81c5a9-47d2-4f60-b1e8-9a2c6d0f7b35",
    subject: "person",
    album: null,
    person: { name: "Jordan Pike", slug: "jordanpike" },
    media: null,
    uploader: null,
    state: null,
    held: false,
    reports: [
      {
        id: "3e81c5a9-47d2-4f60-b1e8-9a2c6d0f7b35",
        when: "21:37",
        reason: "This account is using my name and a photo of me. It isn't me.",
        // The person arm is signed-in by construction (`/api/reports`).
        reporter: "account",
        kind: "pretend",
      },
    ],
  },
  {
    id: "1f6c3a87-9d24-40be-b5c7-83a1e0f4d726",
    subject: "album",
    album: A.riverside,
    person: null,
    media: null,
    uploader: null,
    state: null,
    held: false,
    reports: [
      {
        id: "1f6c3a87-9d24-40be-b5c7-83a1e0f4d726",
        when: "21:08",
        reason: null,
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "4b9e57d0-2c16-4a83-a7f1-6e30b8c5d294",
    subject: "item",
    album: A.priya,
    person: null,
    media: {
      id: "a05b6f39-71c4-4d2e-9b80-3f1a8e6c4057",
      image: "party-dj",
      type: "video",
    },
    uploader: ARJUN,
    state: "up",
    held: false,
    reports: [
      {
        id: "4b9e57d0-2c16-4a83-a7f1-6e30b8c5d294",
        when: "20:15",
        reason: "wrong event",
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "7d0e2b95-3a64-4f18-8c2e-b5a9d1f6e083",
    subject: "item",
    album: A.priya,
    person: null,
    media: {
      id: "d4f8a2c6-0b93-4e57-9a1d-8e3c7b5f2a09",
      image: "party-balloons",
      type: "photo",
    },
    uploader: ARJUN,
    state: "up",
    held: false,
    reports: [
      {
        id: "7d0e2b95-3a64-4f18-8c2e-b5a9d1f6e083",
        when: "19:58",
        reason: "blurry",
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "38c5f1d7-9a20-4e6b-8f43-c7e1a9d2b506",
    subject: "item",
    album: A.okafor,
    person: null,
    media: {
      id: "a7d3e9b2-5c41-4f80-9b16-e2c8f4a7d039",
      image: "reception-hall",
      type: "photo",
    },
    uploader: TOLA,
    state: "up",
    held: false,
    reports: [
      {
        id: "38c5f1d7-9a20-4e6b-8f43-c7e1a9d2b506",
        when: "19:40",
        reason: "this is from last year's reunion not this one",
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "d70f2b95-8e41-4c06-9a37-b5c82e1d6f49",
    subject: "album",
    album: A.lakeside,
    person: null,
    media: null,
    uploader: null,
    state: null,
    held: false,
    reports: [
      {
        id: "d70f2b95-8e41-4c06-9a37-b5c82e1d6f49",
        when: "18:22",
        reason: "this whole album is spam",
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "0d9b6e3a-4f72-4c18-b5a1-9e3c7d2f8b40",
    subject: "item",
    album: A.priya,
    person: null,
    media: {
      id: "f6a2d8c4-3e19-4b75-8c0d-1a9e5b7f3c28",
      image: "concert-confetti",
      type: "photo",
    },
    uploader: ARJUN,
    state: "up",
    held: false,
    reports: [
      {
        id: "0d9b6e3a-4f72-4c18-b5a1-9e3c7d2f8b40",
        when: "18:10",
        reason: null,
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "6b1d4e8a-73c2-4f05-9e8d-2a5c7f0b3d61",
    subject: "item",
    album: A.hannah,
    person: null,
    media: {
      id: "4e7a2c9d-1b58-4f36-a0e2-8d5b3c7f9a14",
      image: "wedding-arch",
      type: "photo",
    },
    uploader: {
      name: "Sophie L.",
      verified: true,
      more: 22,
      otherReports: 0,
      heldOthers: 0,
    },
    state: "up",
    held: false,
    reports: [
      {
        id: "6b1d4e8a-73c2-4f05-9e8d-2a5c7f0b3d61",
        when: "17:55",
        reason: "My ex posted this to embarrass me",
        reporter: "account",
        kind: "other",
      },
    ],
  },
  {
    id: "c5e7a913-2d48-4b06-9f1c-7a3e0b8d5c24",
    subject: "item",
    album: A.marlow,
    person: null,
    media: {
      id: "3b9d2f7e-6c15-4a80-8e4b-1f7a9c3d6e52",
      image: "wedding-petals",
      type: "photo",
    },
    uploader: {
      name: "Ben",
      verified: false,
      more: 2,
      otherReports: 0,
      heldOthers: 0,
    },
    state: "hidden",
    held: false,
    reports: [
      {
        id: "c5e7a913-2d48-4b06-9f1c-7a3e0b8d5c24",
        when: "17:30",
        reason: "not appropriate for a christening",
        reporter: "guest",
        kind: "other",
      },
    ],
  },
  {
    id: "e2a9c7f0-5b36-4d18-a4e9-0c6b3f8d2a75",
    subject: "item",
    album: A.okafor,
    person: null,
    media: {
      id: "9f3c6a1e-8d24-4b57-b2f0-6e9a3c1d7b48",
      image: "festival-lights",
      type: "photo",
    },
    uploader: TOLA,
    state: "withdrawn",
    held: false,
    reports: [
      {
        id: "e2a9c7f0-5b36-4d18-a4e9-0c6b3f8d2a75",
        when: "16:48",
        reason: "delete this",
        reporter: "guest",
        kind: "other",
      },
    ],
  },
];

/** Every open report tonight, however they are grouped. */
export const OPEN_REPORT_COUNT = ENTRIES.reduce(
  (n, e) => n + e.reports.length,
  0,
);

/** The reports the board leans on by name. */
export const DAUGHTER = ENTRIES[0];
export const LICENCE = ENTRIES[1];
export const STUDENT = ENTRIES[2];

/** The worst kind any of an entry's reports names. */
export const kindOf = (e: Entry): Kind =>
  e.reports
    .map((r) => r.kind)
    .reduce((a, b) => (SEVERITY[b] < SEVERITY[a] ? b : a));

/** The newest report's time, which is the entry's place in the queue. */
export const whenOf = (e: Entry) => e.reports[0].when;

/** The still a reported frame draws. Throws on a typo rather than drawing a gap. */
export const stillOf = (e: Entry) =>
  e.media ? marketingImage(e.media.image) : null;

/* ── The lanes, as each `harm` answer sorts the night ──────────────────── */

export type HarmShape = "eye" | "kinds" | "steer";

export type Lane = {
  id: "harm" | "people" | "items" | "rest";
  label: string;
  entries: readonly Entry[];
  /** A lane swept in a batch, or one judged a report at a time. */
  sweep: boolean;
};

/**
 * ★ TODAY'S WORLD HAS NO KIND, SO THE FRONT IS THE OPERATOR'S OWN. Under
 * `eye` the only thing ahead of the sweep is what she moved there herself:
 * mid-night, the daughter's report, one press of It's harm at 22:44. The
 * page's own order follows it (people first, then albums and items, since
 * 20260919130000), and the licence and the student still sit in the sweep in
 * time order, because nothing has told the queue they are harm yet. That is
 * the honest cost the `harm` ask weighs.
 */
export const MOVED_BY_YOU: ReadonlySet<string> = new Set([DAUGHTER.id]);
export const MOVED_AT = "22:44";

export function lanesOf(harm: HarmShape): Lane[] {
  if (harm === "eye") {
    const front = ENTRIES.filter((e) => MOVED_BY_YOU.has(e.id));
    const rest = ENTRIES.filter((e) => !MOVED_BY_YOU.has(e.id));
    return [
      { id: "harm", label: "Clear harm", entries: front, sweep: false },
      {
        id: "people",
        label: "People",
        entries: rest.filter((e) => e.subject === "person"),
        sweep: false,
      },
      {
        id: "items",
        label: "Albums and items",
        entries: rest.filter((e) => e.subject !== "person"),
        sweep: true,
      },
    ];
  }
  // Worst first, then newest: the student before the licence before the
  // daughter, whatever time they came in.
  const harmful = ENTRIES.filter((e) => isHarmKind(kindOf(e))).sort(
    (a, b) => SEVERITY[kindOf(a)] - SEVERITY[kindOf(b)],
  );
  const lanes: Lane[] = [
    { id: "harm", label: "Clear harm", entries: harmful, sweep: false },
  ];
  // Under `steer` Something else is never filed: the form sent those guests
  // to their hosts, so the queue holds only what the kinds let through.
  if (harm === "kinds")
    lanes.push({
      id: "rest",
      label: "Everything else",
      entries: ENTRIES.filter((e) => !isHarmKind(kindOf(e))),
      sweep: true,
    });
  return lanes;
}

/** Every report a lane set holds, which is what the rail and the bell count. */
export const reportsIn = (lanes: readonly Lane[]) =>
  lanes.reduce(
    (n, l) => n + l.entries.reduce((m, e) => m + e.reports.length, 0),
    0,
  );

/**
 * ★ THE SWEEP IS MID-WAY, IN EVERY SHAPE. Seven are ticked (the wrong event,
 * the blurry one, last year's reunion, the spam album, the wordless one, the
 * one the host already hid and the one its uploader already took back), so a
 * frame shows the batch in the act rather than a grid of boxes nobody has
 * touched, and every shape ticks the same seven.
 */
export const TICKED: ReadonlySet<string> = new Set([
  "4b9e57d0-2c16-4a83-a7f1-6e30b8c5d294",
  "7d0e2b95-3a64-4f18-8c2e-b5a9d1f6e083",
  "38c5f1d7-9a20-4e6b-8f43-c7e1a9d2b506",
  "d70f2b95-8e41-4c06-9a37-b5c82e1d6f49",
  "0d9b6e3a-4f72-4c18-b5a1-9e3c7d2f8b40",
  "c5e7a913-2d48-4b06-9f1c-7a3e0b8d5c24",
  "e2a9c7f0-5b36-4d18-a4e9-0c6b3f8d2a75",
]);

/** The report the keyboard's cursor is on as a frame opens. */
export const CURSOR = LICENCE.id;

/* ── Asking for proof (the `proof` ask) ─────────────────────────────────── */

export type ProofShape = "none" | "account" | "confirm";

/**
 * ★ ONLY A CONFIRMED ADDRESS IS KEPT, AND ONLY UNTIL THE REPORT CLOSES. His
 * emails r1 `reporter=note` settled the privacy line: a report may keep who
 * sent it, a confirmed address only, until it closes, for its one closing
 * note. Every answer here rides that same kept address or none at all, and
 * none of them ever shows it to an operator: Ask for proof sends the mail,
 * the portal never prints where it went.
 *
 * The mother reported signed out, as most guests at a party do, so `account`
 * cannot reach her; under `confirm` she confirmed her address on the form with
 * the door's own code.
 */
export const MOTHER = { address: "sarah.kemp@outlook.com" };

/** The question an operator sends, and the answer that comes back. */
export const ASKED = {
  when: "22:52",
  question:
    "Thanks for telling us. To take this photo down we need to know it's your child in it. Which photo is it, and is there anything that shows she's yours, like the host knowing your family?",
};
export const ANSWERED = {
  when: "23:06",
  text: "It's the one of the toast, she's the girl in the green dress behind the bride. Maya (the bride) is my sister-in-law and can confirm. I've added one from our own phone of the two of us at the ceremony.",
  attached: 1,
};

/* ── The rail (the retired `admin` board's answer, as it shipped) ────────── */

export type NavEntry = NavItem & { count: number };

/** The counts the operator's night really carries; everything else is quiet. */
const COUNTS: Record<string, number> = {
  "/admin/support": 9,
  "/admin/applicants": 2,
  "/admin/reports": OPEN_REPORT_COUNT,
};

export const SURFACES: NavEntry[] = NAV.map((n) => ({
  ...n,
  count: COUNTS[n.href] ?? 0,
}));

/** The rail's groups; `reports` overrides the Reports row's count for a step. */
export function surfaceGroups(
  over: { reports?: number } = {},
): { group: string; items: NavEntry[] }[] {
  const out: { group: string; items: NavEntry[] }[] = [];
  for (const base of SURFACES) {
    const item =
      over.reports !== undefined && base.href === "/admin/reports"
        ? { ...base, count: over.reports }
        : base;
    const last = out.at(-1);
    if (last?.group === item.group) last.items.push(item);
    else out.push({ group: item.group, items: [item] });
  }
  return out;
}

export const REPORTS_SURFACE =
  SURFACES.find((s) => s.href === "/admin/reports") ?? SURFACES[0];

export const ALERTS = {
  support: 9,
  applicants: 2,
  reports: OPEN_REPORT_COUNT,
};
