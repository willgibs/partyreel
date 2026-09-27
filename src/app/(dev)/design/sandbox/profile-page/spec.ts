import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PERSON IS ON PARTYREEL, ROUND TWO: WHAT HE LEFT OPEN (2026-09-19);
 * `head` ASKED AGAIN BY THE REFRESH (2026-09-24).
 *
 * Round one answered whole (docs/reviews/profile-page.json; the fourth
 * batch, verbatim): whether a person has a page,
 * what stands above it, what fills it, what its top says, block, who is
 * named, the claim, and the closed shape of a big guest list (`list=faces`).
 * `profile-wiring` lands all eight on the real profile and guest list at this
 * same cut. His own notes on that batch that stayed questions are drawn on
 * the SAME board:
 *
 *  - `head=guest`, verbatim: "Seems like it'd be very easy to get far away
 *    from the original event you scanned if you start clicking guests,
 *    risking not getting back in certain cases... maybe not the best overall
 *    solution for our nav in general here." → `way-back`.
 *
 * ★ `view-all` AND `quick-look` MOVED TO THE `popups` BOARD (2026-09-27), every
 * option kept: how the full guest list opens is its `lists` ask, and what a
 * tapped name opens first is its `peek`. Both were a choice of surface, which
 * that board now asks once per kind of popup rather than once per screen.
 *
 * ★ ROUND ONE'S EIGHT ASKS ARE GONE FROM `asks` ON PURPOSE (the `privacy-hero`
 * precedent: a round replaces its questions rather than accreting them). The
 * ledger keeps their answers for ever; the board only ever carries what is
 * still open. `reach.tsx` holds one function per question.
 *
 * ★ THE REFRESH ASKS `head` AGAIN (2026-09-24), BECAUSE ITS OWN PREMISE
 * CHANGED. Round one won `guest` (the album's own header) on ONE argument:
 * without its account menu, a signed-in visitor loses their way back after
 * clicking through guests. `way-back` was written for that exact worry and
 * now answers it directly, for every visitor, signed in or not; the argument
 * that decided `head` no longer has to be the header's job alone. `head`
 * gains a `quiet` option his three original ones never offered (the logo with
 * no control at all, not even `today`'s button), and `profile.tsx`'s `Head`
 * grows that one case. The recommendation still holds today's header, but for
 * a narrower reason than it first won on, stated in the ask itself.
 *
 * ★ THE GROUND IS THE IDENTITY MODEL (rechecked 2026-09-22). A guest is a
 * typed name (Unverified: the plain disc, the mark, no page), a confirmed
 * account without a handle (no page), or an account with a handle, whose page
 * shows only the events its owner turned on. What a claimed page with
 * nothing on it says is `identity-profile.page`'s question; `way-back` draws
 * Maya's page and Priya's.
 *
 * ★ THE PRIVACY DOCTRINE STILL BINDS (profiles-social.md), unchanged by any
 * option here: no public counts, the follow graph stays owner-private, and a
 * "way back" is a link to an event the viewer already reached (their own
 * recent navigation), never a new grant to anyone who has not been there.
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21): `way-back` keeps its three
 * options; its context folds in where the crumb trail actually lives (the
 * host's own bar, not a guest's), the guest's own second-round chrome, and
 * the account menu's standing-row precedent.
 */

/**
 * THE SCREEN, the knob every decision shares. Declared HERE as pure data
 * rather than imported from the board's scene: a spec is what a SERVER page
 * reads, and a control lifted out of a client module drags that module's
 * tree along with it.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** Whose page `way-back` draws: a host's, and a guest's who chose what shows.
 *  A claimed page with nothing on it is `identity-profile.page`'s to say. */
const WHO: Control = {
  id: "who",
  label: "Whose page",
  options: [
    { id: "maya", label: "Maya, who hosts" },
    { id: "priya", label: "Priya, who chose two events" },
  ],
  default: "priya",
};

/** `way-back`'s own knob: whether this visit began on the album a chip was
 *  tapped from, or landed on the profile some other way (a shared link, a
 *  search result, a second tab). Only `pill` and `menu` read it. */
const ARRIVED: Control = {
  id: "arrived",
  label: "Arrived from",
  options: [
    { id: "album", label: "Tapped a name on the wedding" },
    { id: "direct", label: "Opened the link directly" },
  ],
  default: "album",
};

const DRAFT = defineExploration({
  id: "profile-page",
  title: "What a person is here",
  round: {
    n: 2,
    date: "2026-09-24",
    changed:
      "A fourth question, head, asked again: way-back now answers the exact worry that decided it in round one, so the header no longer has to carry that argument alone. A new quiet option (logo, no menu) joins today's header and bare; today still holds, for a narrower reason.",
  },
  context:
    "Maya hosts; Priya has a page and chose two events for it. Every option is the shipped profile with one thing changed, phone first with 1440 on the knob. How the full guest list opens and what a tapped name opens moved to the popups board (lists, peek), every option kept. Nothing here reaches a Server Function or a row: the social controls stay forked to local state, as round one forked them.",
  asks: [
    {
      id: "way-back",
      label: "Way back",
      question: "How should a profile keep the scanned event reachable?",
      context:
        "Click ten names down a list and the album is ten navigations behind. A crumb trail rides the host's bar (app-shape r1); the guest's chrome had a second round (guest-shape r2); the menu carries a standing row too (app-pricing r1).",
      options: [
        {
          id: "pill",
          label: "A 'Back to <event>' pill under the header",
          means:
            "One link under the header, shown only when the visit began on that album. Works whether the visitor is signed in or not.",
        },
        {
          id: "menu",
          label: "One more row in the account menu",
          means:
            "The signed-in menu names the event. A signed-out visitor, who has no account menu at all, gets nothing extra here.",
        },
        {
          id: "none",
          label: "Nothing: the browser's own back",
          means:
            "No new surface. A shared link or a second tab has no back at all.",
        },
      ],
      recommended: "pill",
      because:
        "It is the only option that works whether or not the visitor is signed in: at a verified party every guest is, at a names-mode one most are not. It costs one line, and naming the host's event under the header is bible 7's own ask, not a new one.",
      overrule:
        "If the chrome should stay quiet, the account menu reaches every guest at a verified party; at a names-mode party most keep only the browser's back.",
      lands:
        "Whether a profile carries any memory of where a visit began, and whether a signed-out guest gets a way back at all.",
      tile: "phone",
      configs: [SCREEN, WHO, ARRIVED],
    },
    {
      id: "head",
      label: "The head, asked again",
      question:
        "What should stand above a person's page, now that way-back exists?",
      context:
        "Round one answered this once (guest, the album's own header) with his own doubt: getting lost clicking through guests, 'maybe not the best overall solution for our nav in general.' way-back's pill now answers that, signed in or not.",
      options: [
        {
          id: "today",
          label: "The album's own header, as shipped",
          means:
            "Logo and, signed in, the account menu; the pill sits under it too now. Two ways back doing overlapping jobs.",
        },
        {
          id: "quiet",
          label: "The logo alone, no menu",
          means:
            "The same bar, nothing on its right: bible 7's own ask, now that the pill, not the menu, carries the way back.",
        },
        {
          id: "bare",
          label: "Nothing above them",
          means:
            "The page opens on the face; the pill is the only thing above it at all.",
        },
      ],
      recommended: "today",
      because:
        "The menu still does more than get a visitor back: settings, billing, sign-out, one tap away while browsing someone else's page. The pill narrows round one's own argument rather than replacing the menu's other jobs, so today's header earns its place for a smaller reason than it first won on.",
      overrule:
        "If a guest surface should carry as little Partyreel as the pages it curates (bible 7), quiet is built for that now the pill, not the menu, gets anyone back.",
      lands:
        "Whether the profile keeps its account menu at all, now that way-back answers the reason round one gave it.",
      tile: "phone",
      configs: [SCREEN, WHO],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT. `defineExploration`
 * flattens every decision's `configs` into the board's controls, so a screen
 * knob two decisions share arrives twice: the dock would draw it twice and
 * React would warn on the duplicate key (`guest-upload` found it first).
 * Each decision keeps it on its own strip; the board declares it once.
 */
export const PROFILE_PAGE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
