import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * YOUR OWN ACCOUNT: FOLLOWING, BLOCKING, YOUR PAGE (the account-moments-r1
 * track, cut 2026-10-06).
 *
 * The calls lab's round 15 settled two moments of a person's own account in
 * text on 2026-10-04, and they were built that way: Follow and Block stay
 * quiet (I4: a landed flip says nothing, a Connections row leaves at once with
 * no undo), and an account with no public page keeps its uploads, likes and
 * follows at `/me` under a standing invitation (I5). This board asks each again
 * as a picture: production's built answer is one option (`today`), drawn on
 * production's own controls (`RelationToggle`, the profile menu,
 * `BlockConfirm`, `PageInviteCard`) beside real alternatives.
 *
 * ★ THE CONSENT MODEL IS NEVER DRAWN AWAY (profiles-social.md): every option
 * on the page asks keeps "a page is public only by her choice". Nothing here
 * publishes her, and the invitation's options change only its weight.
 *
 * ★ A REFUSED FLIP IS SETTLED, NOT ASKED: it springs back with the server's
 * words in one toast on every face, and no option here changes that.
 *
 * ★ STAGED: how the invitation reads waits on what her own page is, since the
 * invitation is drawn on the page he picks.
 *
 * ★ ASKS NOTHING guest-moments r1 asks (its follow is the confirmation card's
 * own row, the album's; this board's Follow is the profile's), and wears
 * today's brand and headers (brand r2's take, event-header r6's).
 */
export const ACCOUNT_MOMENTS = defineExploration({
  id: "account-moments",
  title: "Your own account: following, blocking, your page",
  surface: "shared",
  desk: 50,
  lives: [
    "docs/systems/profiles-social.md",
    "src/components/social/relation-toggle.tsx",
    "src/components/social/profile-actions-menu.tsx",
    "src/app/(app)/account/page.tsx",
    "src/app/(guest)/u/[slug]/page.tsx",
    "src/app/(guest)/u/[slug]/owner-sections.tsx",
    "src/app/(app)/me/page.tsx",
    "src/components/app/dashboard/page-invite-card.tsx",
  ],
  tracks: ["account-moments-r1"],
  round: {
    n: 1,
    date: "2026-10-06",
    changed:
      "A new board: following, blocking and her own page before it's public, settled in words on Oct 4 and built that way, now drawn with production's answer beside real alternatives.",
  },
  context:
    "Priya confirmed her email at Maya & Jay's wedding, so she has an account and no public page. She follows Maya from Maya's page, blocks Jordan from his, tidies her Connections, and opens Your profile. Every frame is production's page at 375 or 1440 (the Screen knob).",
  opening: {
    about:
      "Two moments in a person's own account, built from words on Oct 4: Follow and Block staying quiet, and her own page before she has a public one.",
    settled: [
      "A page is public only by her choice: claiming a handle is the consent act, and nothing here changes that.",
      "Follows are private to their owner: Maya sees a count of followers, never who.",
      "A block is private and mutual, asks first, and the other side is never told.",
      "A refused flip springs back with the server's words in one toast.",
    ],
    earlier: [
      "The calls lab's round 15 (Oct 4) settled these in words: a landed flip says nothing, a row leaves at once.",
      "Your direction since round 13: immediate, or a clear state and a way to stop it; nothing depends on a timeline.",
    ],
  },
  terms: [
    {
      term: "Connections",
      means:
        "The card in Account listing whom she follows and whom she blocked; only she sees it.",
    },
    {
      term: "Your profile",
      means:
        "Her own page at /me: her uploads, likes and follows, until she sets up a public page.",
    },
    {
      term: "Following",
      means: "The Follow button once pressed; pressing it again unfollows.",
    },
  ],
  asks: [
    {
      id: "follow",
      label: "A follow, landed",
      question: "When Priya follows someone, what should tell her it worked?",
      where: ["Shared", "Maya's page", "Pressing Follow"],
      when: "Priya, signed in, opened Maya's page from the wedding album and pressed Follow.",
      matters:
        "Following shows her nothing new anywhere yet: the press is the one moment that can say what it means.",
      lands:
        "What every Follow says when it lands: the profile's, the album's quieter one, a guest list's.",
      context:
        "One frame: Maya's page the moment after Follow, signed in as Priya. Today the button turns and nothing more; each other option adds its line or its toast.",
      options: [
        {
          id: "today",
          label: "As today: the button turns",
          means: "Follow becomes Following, and nothing else is said.",
          gains: "Nothing to read: the button is the answer.",
          costs: "She can't tell who sees it, or where it went.",
        },
        {
          id: "line",
          label: "A line under her name, once",
          means:
            "The button turns, and a line arrives under the row: Maya is in your Connections; only you see who you follow.",
          gains: "Answers the worry, who sees this, where she pressed.",
          costs: "A line the page didn't have, until she leaves it.",
        },
        {
          id: "toast",
          label: "A toast that says it",
          means:
            "The button turns, and a toast says You follow Maya, who sees it, with See all.",
          gains: "The app's usual voice for a thing done.",
          costs:
            "Says loudly what the button already shows, and goes on a timer.",
        },
      ],
      recommended: "line",
      today: "today",
      because:
        "Following is private, and nobody would guess it: one quiet line where she pressed says so.",
      overrule: "If a follow should never need words, the button alone.",
      configs: [SCREEN],
    },
    {
      id: "block",
      label: "A block, done",
      question:
        "Once Priya blocks someone from their page, what should the page show her?",
      where: ["Shared", "Jordan's page", "After the block's ask"],
      when: "Jordan, a guest at the wedding, keeps turning up; Priya opens his page, presses Block in the menu, then Block in the ask.",
      matters:
        "Follow vanishes from the row: with nothing said, a block reads as a glitch, and the way back hides in a menu.",
      lands:
        "What a blocked person's page shows the one who blocked, every visit, and what a block says when it lands.",
      context:
        "Two frames: production's ask (the same in every option), then Jordan's page the moment after. Today Follow goes and the menu's row reads Unblock.",
      options: [
        {
          id: "today",
          label: "As today: Follow just goes",
          means:
            "The row loses Follow; Unblock waits in the menu and in Account.",
          gains: "The page barely changes, so nothing is made of it.",
          costs: "A button vanishing is the only sign it worked.",
        },
        {
          id: "line",
          label: "The page says it, to her alone",
          means:
            "Where Follow stood, a quiet well: You blocked Jordan, Jordan isn't told, and Unblock beside it, on every visit.",
          gains: "A clear state, and the way to stop it in sight.",
          costs: "Her block stays named on his page whenever she visits.",
        },
        {
          id: "toast",
          label: "A toast with Undo",
          means:
            "The page changes as today, and a toast says Jordan is blocked and isn't told, with Undo.",
          gains: "Confirms the act and catches a slip.",
          costs: "Undo lasts as long as the toast; then it's the menu again.",
        },
      ],
      recommended: "line",
      today: "today",
      because:
        "A block is a standing state, not an event: said where Follow was, with Unblock in reach, it's never a mystery.",
      overrule:
        "If her page should look the same blocked or not, today's quiet.",
      configs: [SCREEN],
    },
    {
      id: "tidy",
      label: "Tidying Connections",
      question:
        "When Priya unfollows or unblocks someone in Connections, what should their row do?",
      where: ["Shared", "Account", "Connections"],
      when: "Priya follows 4 people and blocks 2; she presses Following on Sam, then Unblock on Ray.",
      matters:
        "Every other face of a relation is undone by one more press; here the row leaves, and a slip means finding them again.",
      lands: "What the Connections card does when a row's relation flips off.",
      context:
        "Two frames: Account scrolled to Connections, the moment after Following on Sam, then after Unblock on Ray.",
      options: [
        {
          id: "today",
          label: "As today: the row leaves at once",
          means:
            "Sam's row is gone, then Ray's; nothing is said, and there is no undo here.",
          gains: "The list is always exactly true.",
          costs: "A slip can't be undone here: she must find their page.",
        },
        {
          id: "stays",
          label: "The row stays, turned back",
          means:
            "Sam's row stays with Follow, Ray's with Block; one more press undoes it, and they leave when she comes back.",
          gains: "Undo is the same press as everywhere else, with no timer.",
          costs:
            "The list is a visit old, and a red Block stands in Ray's row.",
        },
        {
          id: "toast",
          label: "The row leaves, a toast offers Undo",
          means:
            "The row goes as today, and a toast says You unfollowed Sam, or Ray is unblocked, with Undo.",
          gains: "The list stays true and the slip is caught.",
          costs: "Undo lives on a timer, then it's gone.",
        },
      ],
      recommended: "stays",
      today: "today",
      because:
        "The relation control promises one more press undoes a flip; a row that stays keeps that promise here too.",
      overrule: "If the list must always be exactly true, the toast.",
      configs: [SCREEN],
    },
    {
      id: "me-page",
      label: "Her page, not public",
      question: "Before Priya has a public page, what should her own page be?",
      where: ["Shared", "Your profile", "No public page yet"],
      when: "Priya has 6 uploads, 9 likes and 2 follows, no handle, and opens Your profile from her menu.",
      matters:
        "It's where her photos live after the night: it should feel like hers, whether or not she ever goes public.",
      lands:
        "What /me is: its head, and whether it reads as her page or a list of her things.",
      context:
        "One frame: /me at the top, as she opens it. Today's invitation card is drawn in every option; how it reads is the next question.",
      options: [
        {
          id: "today",
          label: "As today: her lists, under an invitation",
          means:
            "Your profile, the invitation, then Only you can see the sections below: uploads, likes, connections.",
          gains: "Plain, and the way to a public page leads.",
          costs: "It reads as a settings page about a page she doesn't have.",
        },
        {
          id: "private",
          label: "Her page, before it's public",
          means:
            "The public page's own head, her photo and name, marked Only you can see this page, then her things.",
          gains: "Already her page; going public later changes who sees it.",
          costs: "Looks like a public page, so the private mark has to carry.",
        },
        {
          id: "halves",
          label: "The public half, drawn empty",
          means:
            "A dashed well first: nobody can find you here yet, and what a page would show; then her things.",
          gains: "Shows exactly what going public would add.",
          costs: "Leads with what she doesn't have.",
        },
      ],
      recommended: "private",
      today: "today",
      because:
        "Her page is hers before it's public: the same head she'd have, marked private, makes going public a choice of who sees it.",
      overrule: "If /me should stay a plain list of her things, today's.",
      configs: [SCREEN],
    },
    {
      id: "invite",
      label: "The invitation",
      question:
        "How should her own page invite her to go public, and can she put it away?",
      where: ["Shared", "Your profile", "The invitation"],
      when: "Priya has opened Your profile a few times since the wedding and hasn't set up a page.",
      matters:
        "Ignoring it should cost her nothing: a card she can never put away stands between her and her photos on every visit.",
      lands:
        "The invitation on /me: its words, its weight, and whether Not now exists there.",
      context:
        "Drawn on the page you picked above: one frame, or for Not now, the card, then the page after she presses it.",
      options: [
        {
          id: "today",
          label: "As today: a card with no Not now",
          means:
            "Set up your page, Nothing shows until you finish, Choose what shows; it stands on every visit.",
          gains: "The way to a page is never lost.",
          costs: "Can't be put away, and leads every visit.",
        },
        {
          id: "line",
          label: "One quiet line, always there",
          means:
            "Want a page others can visit? You choose what shows. Set up your page, as a link in the line.",
          gains: "Always in reach, never in her way.",
          costs: "Easy to miss for someone who'd want a page.",
        },
        {
          id: "notnow",
          label: "The card, with Not now",
          means:
            "Today's card with the dashboard's Not now; Not now folds it to the quiet line, never away.",
          gains: "Invites once, firmly, then steps back at her word.",
          costs: "A press to put away, and two shapes to keep.",
        },
      ],
      recommended: "line",
      today: "today",
      because:
        "She came for her photos: an invitation in one line is always there and never asks her to step around it.",
      overrule:
        "If a public page should be pushed harder, the card with Not now.",
      after: { ask: "me-page" },
      configs: [SCREEN],
    },
  ],
});
