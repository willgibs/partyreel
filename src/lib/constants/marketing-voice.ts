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
  noApp: {
    line: "Nothing to install. Nothing to sign up for.",
    status: "provisional",
    note: "Round 2 (2026-09-01): the guest-side wind-down Will asked for above the live demo. Draft line; his ruling pending.",
  },
  fullQuality: {
    line: "Everything they shoot, at the size they shot it.",
    status: "provisional",
    note: "Round 2 (2026-09-01): the second wind-down section, full-quality originals and video. Draft line; his ruling pending.",
  },
  liveDemo: {
    line: "Watch your album fill up.",
    status: "provisional",
    note: "Will entertains other ideas here. Since round 2 this section is chapter 1's closing ANCHOR, centred at the lg heading tier.",
  },
  album: {
    line: "Every photo comes to you first.",
    status: "provisional",
    note: "Wants more distinctness from the live demo before it and curation after it. Round 2, second pass (2026-09-01): the section is now the paper chapter's opener (a left masthead at the lg tier, the print laid on the desk below-right; the straddle is off and the body no longer repeats chapter 1), so the distinctness is designed in. The line itself still awaits his ruling.",
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

/**
 * The decomposition band's facts, in the order the band stacks them.
 *
 * RULED (Will, 2026-08-25): the closing fact warmed from "Edited by no one."
 * RESHAPED (Will, 2026-09-17, the `counts=hero` pick): the band used to run
 * three facts across one baseline row ("Built from 214 photos." / "Shot by 23
 * guests." / "Created for you."), quoting the demo event's real numbers. He
 * took the BIGGER pair and gave the layout himself: "I think it'd be nice to
 * make that the first line, then stacked center under, 'Created for you.'" So
 * the two counts share the first line and the closing fact sits centred under
 * it. He also corrected the ask's premise, which had called the numbers a claim
 * about the demo event: the band "is paired with a demo video, not the demo
 * event", so they read as an example reel from a conceptual event.
 *
 * ★ TWO NUMBERS ON ONE LINE is load-bearing: decomposition.tsx animates EVERY
 * integer run in a fact as its own pop-in group. Keep each count a bare integer
 * (no "1,200", no "3.5"), or a reader sees one figure where the band pops two.
 */
export const DECOMPOSITION_FACTS = [
  "312 photos from 48 guests.",
  "Created for you.",
] as const;

/** The recurring demo CTA line (DemoCtaLink renders it everywhere the demo is offered). */
export const DEMO_CTA_LABEL = "Try the live demo, no signup.";

/**
 * The site's sharpest sentence. It lives in /llms.txt, where no human reads it;
 * it is here so a human-facing surface can spend it without forking the line.
 * /about was to be the first, and its second rebuild reworded the idea into the
 * story instead, so llms.ts is still the only consumer. Kept because this is
 * the golden-copy home and the line is ruled (since the "less is more" reset,
 * 2026-09-12, no copy is pinned by a test; this file is the one home and a
 * rewrite is a ruling): the next page that wants it takes it from here rather
 * than retyping it.
 *
 * ★ The LOWERCASE CLAUSE only, never the whole sentence: llms.ts writes the
 * verdict half as "This is the failure mode ${SITE_NAME} was built against.",
 * and SITE_NAME is a PARAMETER there by explicit design ("pure builders must
 * stay unit-testable without one"). Hardcoding the name into this constant
 * would fork it back, and llms.test.ts could not catch the divergence because
 * its fixture is literally "Partyreel". Both consumers add their own framing.
 */
export const FAILURE_MODE_LINE =
  "compression ruins quality, media scatters across threads, and nothing is collected";
