/**
 * THE marketing voice single-source (Track B). Two layers:
 *
 * 1. GOLDEN_LINES: the eight lines Will ratified verbatim in the voice round (2026-07-08,
 *    round 2). The historical palette the site was drafted around; kept as reference and for
 *    lines still standing unchanged.
 * 2. THE 2026-08-25 IN-CHAT RULING (supersedes the boards' grouping question): Will supplied the
 *    site thesis, the hero subhead, and a per-section header map directly. Ruled lines are final;
 *    "provisional" ones are HIS OWN words that he explicitly wants alternatives for (his notes in
 *    each entry), so they ship as the working line until a replacement is ruled.
 *
 * The ruled voice around all of it: warm-host ease x big-event stakes, disciplined by concise
 * clarity; "night" is BANNED as identity language; collection value co-leads the reel. Byte-match
 * pins make any rewrite a deliberate act, never drift.
 */

export const GOLDEN_LINES = {
  thesis: "The whole event, in one place, forever",
  album: "Every photo comes to you first",
  reel: "The whole event, cut down to the highlights",
  pricing: "Start free, upgrade when you host again",
  reelThesis: "Every event ends with a reel",
  liveDemo: "Watch your album fill up",
  arc: "From the first scan to the final cut",
  curation: "Every moment, and you decide what stays",
} as const;

/** RULED (Will, 2026-08-25). The kinetic hero renders it as "The whole {word}, in one album." */
export const SITE_THESIS = "The whole event, in one album.";
export const SITE_THESIS_STATUS: "provisional" | "ruled" = "ruled";

/** RULED (Will, 2026-08-25), verbatim. */
export const SITE_SUBHEAD =
  "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.";

export type HeaderStatus = "ruled" | "provisional";

/**
 * The home-arc section headers (Will, 2026-08-25). status "provisional" = his line ships as the
 * working copy while alternatives go to him (his appetite recorded in `note`); NEVER silently
 * replace a line here: a change lands with his ruling and a pin update.
 */
export const SECTION_HEADERS: Record<
  string,
  { line: string; status: HeaderStatus; note?: string }
> = {
  howItWorks: {
    line: "Scan, upload, done. No app to install.",
    status: "ruled",
  },
  liveDemo: {
    line: "Watch your album fill up.",
    status: "provisional",
    note: "Will entertains other ideas here.",
  },
  album: {
    line: "Every photo comes to you first.",
    status: "provisional",
    note: "Wants more distinctness from the live demo before it and curation after it.",
  },
  curation: {
    line: "Every moment, and you decide what stays.",
    status: "provisional",
    note: "Wants guest-side benefits in the frame, not only host moderation.",
  },
  privacy: {
    line: "Your event stays yours.",
    status: "provisional",
    note: "Wants it cleaner; privacy benefits may also spread into the curation section.",
  },
  reel: {
    line: "The whole event, cut down to the highlights.",
    status: "provisional",
    note: "Explore a share-the-highlights framing that feels more alive.",
  },
  pricing: { line: "Start free, upgrade for more events.", status: "ruled" },
} as const;

/** RULED (Will, 2026-08-25): the decomposition's third fact warmed from "Edited by no one." */
export const DECOMPOSITION_FACTS = [
  "Built from 214 photos.",
  "Shot by 23 guests.",
  "Created for you.",
] as const;

/** The recurring demo CTA line (DemoCtaLink renders it everywhere the demo is offered). */
export const DEMO_CTA_LABEL = "Try the live demo, no signup.";

/**
 * PROVISIONAL (2026-08-26 chapter round): the mono chapter labels at the
 * dark→paper cuts (PaperChapter's kicker slot). One entry per chapter that
 * USES a kicker — home's morning-after chapter deliberately has none (its
 * album section opens with its own eyebrow + ruled header, and the straddling
 * card is the seam signature; two devices at one cut would be noise). Awaiting
 * Will's word alongside the five provisional section headers.
 */
export const CHAPTER_KICKERS = {
  /** /pricing's paper document: "on paper" = plain written terms, and the
   *  surface literally turns to paper. */
  pricing: "On paper",
} as const;
