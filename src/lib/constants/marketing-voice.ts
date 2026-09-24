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
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────────
 * ★ THE ACCOUNT RULE (Will, 2026-09-19, `voice` r1 `absence=named`; bible 10 ruled PERMISSIVE).
 *
 * NEVER PROMISE "NO ACCOUNT" ANYWHERE. A host may require one, and Require verified emails
 * DEFAULTS ON for a new event, so "No app, no account." was a promise the product breaks on most
 * events. His instruction, verbatim: "since many events will likely require guests accounts,
 * let's change 'No app, no account.' to 'No app required.'" That exact swap ran through every
 * surface (the OG cards, the trust strip, the footer, six feature pages, the guest door, the
 * wizard, help and the blog).
 *
 * "NO APP" STAYS, as a benefit we are allowed to say: "No app is a big benefit we're allowed to
 * mention. The rule was meant to be avoid 'we're not cloud storage, we're not vsco, etc'." The
 * fence is only on defining Partyreel AGAINST another product, never on naming an absence a guest
 * is wary of.
 *
 * Which lines survive the sweep: a line that PROMISES a guest needs no account changes; a line
 * that describes the per-event switch truthfully, or reports a fact about a different act
 * (reporting is anonymous; the demo opens with no sign-up), stays. The trap is the SUGGESTED HOST
 * ANNOUNCEMENT: a help or blog line handing a host the words "no sign-up" becomes a support
 * question a hundred times over the moment their event asks for an email, which our own
 * conference article already warns about. Those were the lines that had to move.
 *
 * ★ THE SUBHEAD SHAPE (Will, 2026-09-19, `hero-sub`). SITE_SUBHEAD below is his own sentence, and
 * he named what makes it work: "This frames the opportunity, then what we do, then the benefit
 * all together." That ORDER is the rule every subhead written after it takes. The opportunity is
 * the READER'S, not ours (their guests already shot the best photographs of the day); what we do
 * is one clause with no mechanism in it; the benefit is the failure it spares them.
 *
 * ★ THE EMPTY-STATE VOICE (the finding of `voice` r1). Two questions were put deliberately
 * identically, one for the host with no events (`host-empty`) and one for the guest in an album
 * with no photographs (`empty`), and he picked the same voice for both: the ALBUM as the noun and
 * "starts" as the verb ("Your first album starts here" / "The album starts with you"). His reason
 * is about the VERB rather than the noun: "This incentivizes action (first upload) rather than
 * feeling passive and waiting for a picture to land." An empty state here names the thing that is
 * about to exist and puts the reader at the start of it. It never describes the void, and it
 * never waits.
 * ───────────────────────────────────────────────────────────────────────────────────────────────
 * ★ THE IDENTITY RULE (the identity reshape, 2026-09-21; "the identity
 * reshape"). Anonymity left the product on Will's ruling: the host's switch is Require verified
 * emails, on by default; off, a guest still types a display name at the door and uploads under
 * it, shown with a small unverified mark. NEVER WRITE "ANONYMOUS": every upload carries a name,
 * verified or marked, so no surface may call an upload, a guest, or a contributor anonymous again.
 * Say the true thing instead — a name wearing the unverified mark, or a guest who has not
 * confirmed their email. (Reporting abuse stays its own thing: "reports are anonymous" describes
 * who FILES a report, never who uploaded, and this rule leaves it untouched.)
 * ───────────────────────────────────────────────────────────────────────────────────────────────
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

/**
 * RULED (Will, 2026-09-19, `voice` r1 `hero-sub`), VERBATIM: his own alternate answer, supplied in
 * the note rather than picked from the four drawn candidates. It supersedes the 2026-08-25 line,
 * which opened on the mechanism ("with one QR code") and asserted what we do before the reader had
 * anything at stake.
 *
 * The shape is the rule (see the head comment): the opportunity, then what we do, then the
 * benefit. Note it never names the QR code. The mechanism is the page's job below the fold; the
 * hero's job is that the best photographs of the event already exist and are not yours yet.
 *
 * ★ 144 CHARACTERS, which is why SITE_DESCRIPTION is no longer composed from it. `site.ts` used to
 * build the meta description as `${SITE_THESIS} ${SITE_SUBHEAD}` (175 here, past the ~160 a
 * description gets read at), so it carries a line of its own that still interpolates the thesis.
 */
export const SITE_SUBHEAD =
  "Your guests took the best photos and videos at your event. Partyreel collects them with one easy link. No more chasing group chats the next day.";

/**
 * The META DESCRIPTION's own sentence, composed with SITE_THESIS in `site.ts`
 * (which is where every consumer already imports SITE_DESCRIPTION from, and
 * which touches `env.ts`, so the COPY lives here where a pure test can measure
 * it and the composition lives there).
 *
 * ★ WHY IT IS NOT THE SUBHEAD ANY MORE. `SITE_DESCRIPTION` was
 * `${SITE_THESIS} ${SITE_SUBHEAD}`, which was fine while the subhead was one
 * sentence. His ruled hero line is three and runs 144 characters on its own, so
 * the composed form hit 175 and every search result and unfurl cut it mid-clause
 * at roughly 160, losing precisely the closing benefit the sentence was built to
 * land. A hero subhead and a meta description are read by different people in
 * different places and only ever happened to be one string.
 *
 * It keeps the ruled shape in the same order (the thesis carries the
 * opportunity, this carries what we do, then the benefit) and must leave the
 * composed line under 160; `home-sections.test.ts` pins both.
 */
export const SITE_DESCRIPTION_LINE =
  "Partyreel collects your guests’ photos and videos with one easy link, so nobody chases a group chat the next day.";

/**
 * The Pro plan's one-liner, RULED (Will, 2026-09-19, `voice` r1 `pro-line=video`), verbatim:
 * "Close, but let's go with 'For videos and unlimited events.' States direct benefit, but longer
 * reel isn't as important. Videos and unlimited events is huge."
 *
 * ★ ONE HOME, and an ORDER the four siblings share. `plan-cards.tsx` renders this constant; the
 * four other places Pro's value is stated in one breath (`pricing-teaser.tsx`, `faq-data.ts`,
 * `how-much-fits.tsx` and `llms.ts`) are DIFFERENT sentences for different readers, so they are
 * not made to import it (`single-source-policy.test.ts` would refuse a second UPPER_SNAKE home
 * anyway). What they share is his ranking: VIDEO FIRST, unlimited events second. Before this
 * round three of them led with unlimited events, which is the weaker half of the pair.
 */
export const PRO_LINE = "For videos and unlimited events.";

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
    line: "Nothing to install. Just the browser they already have.",
    status: "provisional",
    note: "Round 2 (2026-09-01): the guest-side wind-down Will asked for above the live demo. Draft line; his ruling pending. Second half rewritten 2026-09-19 (voice r1, absence=named): it read 'Nothing to sign up for', which is the account promise the rule now forbids. The replacement keeps the parallel shape and says the true thing, that the album opens where they already are.",
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
