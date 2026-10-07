import { defineExploration } from "@/components/lab/exploration";

import { PHOTOS, SCREEN } from "./knobs";

/**
 * YOUR OWN ACCOUNT, ROUND TWO: WHAT A FOLLOW SAYS, AND THE INVITATION ON HER
 * PAGE (the account-moments-r2 track, cut 2026-10-07 from Will's round one
 * batch, `docs/reviews/account-moments.json`).
 *
 * Round one's block, tidy and me-page picks are built (account-moments-wiring:
 * the blocked well, Connections' rows that stay turned back, `/me` wearing her
 * page's head marked private), so they leave the asks and stand in the opening
 * as settled. Two asks remain, each drawn on production as it now is:
 *
 *  - `follow`, which came back split: his note wants the words at a first
 *    follow and never at the thousandth. Three contenders, each drawn in the
 *    same three moments (her first follow, her fortieth, Connections) and each
 *    saying the same sentence: said once at the press, a private mark that
 *    speaks when asked, and today's button alone. ★ "Said where follows live"
 *    was drawn too and landed on today's answer plus one line, so it is
 *    `once`'s standing note in Connections now (the manifest's Questions).
 *  - `invite`, picked as today's visible card and to be redrawn ("We can do
 *    much better than the design itself"): three takes in Aperture (brand r2's
 *    pick), each beautiful and inviting and never loud, beside today's card as
 *    the reference his note grades against: one lit plate, her address set as
 *    an invitation, and her events on one lit plate (the fresh-eyes pass's
 *    cross of the first and the events). The Photos knob swaps her
 *    photographs, so the plates' light is seen to be read from them.
 *
 * ★ THE CONSENT MODEL IS NEVER DRAWN AWAY (profiles-social.md): a page is
 * public only by her choice, and claiming a handle is the consent act. No
 * invitation here publishes anything; each leads to the setup, which claims
 * the handle last, at Finish.
 *
 * ★ ASKS NOTHING ANOTHER BOARD ASKS: the calls lab's X17 asks what a follow is
 * for (this asks how it feels); brand-marks r1 and signature r1 own the marks,
 * the tokens and where the light lives across the app (this draws the
 * invitation in Aperture as picked); a guests-room board will polish
 * `GuestPeek` and the person rows.
 */
export const ACCOUNT_MOMENTS = defineExploration({
  id: "account-moments",
  title: "Your own account: following, blocking, your page",
  surface: "shared",
  desk: 50,
  lives: [
    "docs/systems/profiles-social.md",
    "src/components/social/relation-toggle.tsx",
    "src/components/social/follow-button.tsx",
    "src/app/(guest)/u/[slug]/page.tsx",
    "src/app/(app)/account/page-connections.tsx",
    "src/app/(app)/me/page.tsx",
    "src/components/app/dashboard/page-invite-card.tsx",
  ],
  tracks: ["account-moments-r1", "account-moments-r2"],
  round: {
    n: 2,
    date: "2026-10-07",
    changed:
      "From your round one batch: block, tidy and her page are built. A follow asked again from your split note, four ways, each with its first time and what comes after; the invitation you kept visible, redrawn three ways in Aperture beside today's card.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-06",
      changed:
        "A new board: following, blocking and her page before it's public. You picked the blocked well, rows that stay turned back and her page marked private, all built since; follow came back split, and the invitation stayed visible.",
    },
  ],
  context:
    "Round two, two decisions, for Priya, who confirmed her email at Maya & Jay's wedding and has no public page: how a follow tells her it's private, on Maya's page as built, and the invitation on her own page, on /me as wired. Every frame is production's page at 375 or 1440 (the Screen knob); every press works and writes nothing; each caption is read off its frame.",
  opening: {
    about:
      "Round two: how a follow says it's private without saying it every time, and her page's invitation, kept visible, redrawn beautiful and never loud.",
    settled: [
      "A page is public only by her choice: claiming a handle is the consent act, and nothing here changes that.",
      "Follows are private to their owner: Maya sees a count of followers, never who.",
      "Your round one picks, built: the blocked well on his page, Connections rows that stay turned back, her page marked private.",
      "The invitation stays a visible card on her page, never folded to a line: your round one pick.",
      "Drawn in Aperture, brand r2's pick: on paper, light lives only inside a dark piece of the room, one lit plate a screen.",
    ],
    earlier: [
      "On a follow: 'I'm split here. I'd like to know what you think.'",
      "'Imagine following 1000+ users on Instagram and being told 1000 times what a follow does.'",
      "'Our solutions also need to be a bit more polished.'",
      "On the invitation: 'The whole goal of this page is to be activated and become public.'",
      "'Making it more minimal may lead users to think it's already active.'",
      "'This design should feel very beautiful and inviting, but not yelling or in your face.'",
    ],
  },
  terms: [
    {
      term: "Following",
      means: "The Follow button once pressed; pressing it again unfollows.",
    },
    {
      term: "Connections",
      means:
        "The card in Account listing whom she follows and whom she blocked; only she sees it.",
    },
    {
      term: "the private line",
      means:
        "A lock and a few muted words, the way her own page says 'Only you can see this page.'",
    },
    {
      term: "Your profile",
      means:
        "Her own page at /me, marked private, until she sets up a public one.",
    },
    {
      term: "lit plate",
      means:
        "Aperture's one dark piece of the room on a paper page, its light inside it; one a screen.",
    },
    {
      term: "the setup",
      means:
        "Three steps that make her page public: her address, how she shows up, which events show.",
    },
  ],
  carried: [
    {
      id: "once-memory",
      question: "If a follow is said once, where is 'once' remembered?",
      taken:
        "On the server, from her list being empty before the press: no new column, every device alike.",
      overrule:
        "On the device (a new phone hears it again), or a stored flag (a migration).",
    },
    {
      id: "once-few",
      question:
        "Once means her first follow, or her first few, as your note allowed?",
      taken:
        "Her first: one line answers it, and Connections keeps saying it for whenever she looks.",
      overrule:
        "Her first three (her list under three before the press), read the same way.",
    },
  ],
  asks: [
    {
      id: "follow",
      label: "What a follow says",
      question:
        "How should Priya learn that only she sees who she follows, without hearing it on every follow?",
      where: ["Shared", "Maya's page", "Pressing Follow"],
      when: "Signed in, Priya opens Maya's page from the wedding album and follows her; weeks later she follows her fortieth.",
      matters:
        "Nobody would guess a follow is private, and nobody wants to be told so a thousand times.",
      lands:
        "What a follow says, the first time and after: on a profile, beside an album, in a guest's look.",
      context:
        "Three frames an option, the same three moments: Maya's page after her first follow, Theo's after her fortieth, and Connections, where her follows live. The sentence is the same in each; only where and when differ.",
      options: [
        {
          id: "today",
          label: "As today: the button alone",
          means:
            "Follow becomes Following, nothing more; Connections says 'Only you can see this' in passing.",
          gains: "Nothing to read, ever.",
          costs: "Who sees a follow is never answered where she wonders.",
        },
        {
          id: "once",
          label: "Said once, at her first follow",
          means:
            "Her first follow ever: the private line under the button. Every follow after is the button alone; Connections keeps the line.",
          gains: "Answers the question when it's new, then never again.",
          costs:
            "Every place she can follow from needs room for the line, once.",
        },
        {
          id: "mark",
          label: "Following wears a private mark",
          means:
            "A small lock at the end of every Following says the line when she taps or points at it; nothing is said unless she asks.",
          gains:
            "The privacy shows on every Following, and says more only when asked.",
          costs:
            "A lock on every Following for a lesson learned once; a lock can read as Maya's page being locked.",
        },
      ],
      recommended: "once",
      today: "today",
      because:
        "The question comes with her first follow: answered there in one line, every follow after is the button alone, and the thousandth is quiet.",
      overrule: "If the privacy should show on every Following, the mark.",
      configs: [SCREEN],
    },
    {
      id: "invite",
      label: "The invitation",
      question:
        "Which invitation should stand on Priya's page until she makes it public?",
      where: ["Shared", "Your profile", "Before it's public"],
      when: "Priya has six photos from the wedding and a birthday, no handle, and opens Your profile from her menu.",
      matters:
        "Her page exists to go public: the way there should draw her eye without shouting.",
      lands:
        "The invitation on /me and the dashboard's same card: its look, its words, its weight.",
      context:
        "One frame an option: /me as wired, her head marked private, the invitation under it, at 375 or 1440. Every press works and goes nowhere; each caption is read off its frame.",
      options: [
        {
          id: "today",
          label: "As today: the card",
          means:
            "Set up your page, Nothing shows until you finish, and Choose what shows, on a plain card.",
          gains: "Plain, and the way to a page leads.",
          costs: "Reads as a settings card, not an invitation.",
        },
        {
          id: "plate",
          label: "One lit plate, in her own light",
          means:
            "A compact dark plate under her head, its top edge lit in her own photographs' colours, holding the words and the way to the setup.",
          gains:
            "The most beautiful thing on her page is the way to share it, lit by her own photographs.",
          costs:
            "A dark object on a light page, and a light at rest, which only Get Pro's card has today.",
        },
        {
          id: "address",
          label: "Her address, set as an invitation",
          means:
            "'Your page could live at partyreel.com/u/priya-shah', her name pencilled on a reply card's blank, a paper card in either theme, with Make it yours.",
          gains:
            "Says exactly what she would gain, her name pencilled on a blank: offered, never shown as live.",
          costs:
            "Quiet print that invites by words, not light; in the dark theme it is a white card.",
        },
        {
          id: "window",
          label: "Her events on one lit plate",
          means:
            "One dark plate under her head holding her two events' covers, their own light falling from them, each Not shown yet, with the way to choose what shows.",
          gains:
            "Her own events invite her, lit by their own light, and plainly not shown yet.",
          costs:
            "The tallest take and a light at rest; with no event to show yet, it is the plate.",
        },
      ],
      recommended: "window",
      today: "today",
      because:
        "Her own events, lit and plainly not shown yet: what going public gives her, and that it waits on her, in the one lit piece of her page.",
      overrule:
        "If the invitation should stay small, the plate; if it should be calm print, her address.",
      configs: [SCREEN, PHOTOS],
    },
  ],
});
