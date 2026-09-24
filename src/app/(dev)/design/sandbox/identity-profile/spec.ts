import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PROFILE-SETUP BOARD, ROUND ONE (2026-09-22).
 *
 * A NEW BOARD ON HIS WORD ("guest identity" and "the
 * morning after the identity round"): "I'd like to run most of this through
 * the lab once our foundation is complete (including the flow around
 * '...event claim UI, profile setup, etc - this introduces lots of new UI and
 * flows)". The foundation (the door, the claim, the mark) is whole on the
 * alias; this board is the profile-setup piece of that promise, folding in the
 * ROADMAP's own standing line: a wizard "claiming a unique handle and the rest
 * the way the event wizard does".
 *
 * ★ ONE GUEST, PAST THE POINT THE OTHER TWO IDENTITY BOARDS LEAVE HER.
 * `identity-door` asks about the sheet that first meets a guest; `identity-
 * claims` asks about sorting her inbox of past events. This board's Priya has
 * already done both: verified, added photos to three events, and (her own
 * line, the manifest's) "none shown yet." Every option is her, in that same world
 * (fixtures.ts).
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED (DECIDED ALREADY, this round's identity
 * ruling): the three trust levels, the per-event name until a claim, the
 * typed address staying inert, the public mark's two states and its word
 * "Unverified", unclaimed uploads removed at Finish, and the standing model
 * this board builds ON TOP of - nothing on a profile until Priya chooses it.
 * That last one is this board's floor, not one of its four questions: every
 * option below still ships with every event off by default.
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

const DRAFT = defineExploration({
  id: "identity-profile",
  title: "Setting up a page",
  round: {
    n: 1,
    date: "2026-09-22",
    changed:
      "New board, cut on his word once the identity foundation stood whole on the alias.",
  },
  context:
    "Priya is verified, has added photos to three events (Maya and Jay's wedding among them, each one making her a guest of it), and has shown none of them: the guest identity round's own floor. This board asks four things left open once she is ready to make her page real: how setup actually happens, how she chooses what shows, when the app ever invites her to, and what a visitor meets if she claims a handle and stops there.",
  asks: [
    {
      id: "setup",
      label: "How it's set up",
      question: "How should a person actually set up their page?",
      context:
        "Today the handle, bio and events switches live inside the Public profile card, one of six on the account page. Will's ruling: a confirmed account must still visit its page to set it up, echoing the ROADMAP's own wizard line.",
      options: [
        {
          id: "cards",
          label: "The account page's cards",
          means:
            "Handle, bio and the events switches stay inside the Public profile card, exactly as shipped today.",
        },
        {
          id: "wizard",
          label: "A three-screen wizard",
          means:
            "Handle, then name and photo, then which events show: one screen at a time, the way the event wizard does.",
        },
        {
          id: "sheet",
          label: "One sheet from the moment",
          means:
            "A single scrolling sheet opened from the follow moment or the claims toast: 'Set up your page.'",
        },
      ],
      recommended: "wizard",
      because:
        "A guided flow turns one multi-part decision into the kind of moment the event wizard already proved works, rather than three fields buried among cards built for billing and passwords.",
      overrule:
        "If the account page is already where a returning host looks for this kind of setting, a second flow is one more place to remember.",
      lands:
        "Whether setup is its own dedicated flow or a section of an existing settings page.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "attended",
      label: "What shows",
      question: "How should Priya actually choose which events show?",
      context:
        "The account page already lists the three events she added photos to as switches, each off until turned on (profiles-social.md: 'nothing until chosen'). This asks how that choice gets made, never whether it defaults off.",
      options: [
        {
          id: "switches",
          label: "The switch list",
          means:
            "Event name, date and a switch, one row per event, exactly as attended-events-visibility.tsx ships it.",
        },
        {
          id: "picker",
          label: "A cover picker",
          means:
            "Tap an event's own cover to show it; the chosen ones lift off the grid.",
        },
        {
          id: "guest-menu",
          label: "Each event's own menu",
          means:
            "The toggle lives on that event's own album, offered once Priya has added a photo there, never centralized.",
        },
      ],
      recommended: "picker",
      because:
        "A cover Priya recognizes at a glance is a faster, more honest decision than a row of names and dates, and it turns the choice into the same curatorial moment the profile page's own card grid already is.",
      overrule:
        "If the switch list's plain honesty (no cover means no photograph judgment at all) is worth more than the extra visual weight, the list costs nothing to keep.",
      lands: "Whether choosing what shows is a settings decision or a visual one.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "prompt",
      label: "When it's offered",
      question: "When should the app first invite the setup at all?",
      context:
        "Never before a verified email, by decision. Past that, nothing today tells a freshly verified Priya a page exists to set up; she would have to find the Public profile card on her own.",
      options: [
        {
          id: "claim",
          label: "After the first claim",
          means:
            "Once Priya finishes claiming events from the dashboard, a card invites her to set up her page next.",
        },
        {
          id: "follow",
          label: "At the follow moment",
          means:
            "Right after her email confirms inside an album, alongside the offer to follow the host.",
        },
        {
          id: "account",
          label: "Nowhere but the account page",
          means:
            "No invitation anywhere. The Public profile card waits for her to find it on her own.",
        },
      ],
      recommended: "claim",
      because:
        "A person who just finished claiming events is already thinking about her identity across them, which is the one moment the invitation costs nothing extra to notice.",
      overrule:
        "A follow moment fires on every fresh confirmation, claim or not, so inviting there trades one interruption for a wider reach.",
      lands: "Whether the app ever proactively invites the setup, and where.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "page",
      label: "The empty page",
      question: "What should a claimed, empty page say to a visitor?",
      context:
        "Priya has claimed 'priya' and shown nothing. /u/[slug] has never drawn this state. One wrinkle: The Block Party requires an upload to view, so a count must respect that door too, or it leaks what a shown 'guest at' line hides.",
      options: [
        {
          id: "nothing",
          label: "A name, and 'Nothing here yet'",
          means:
            "Priya's name and handle stand above one quiet line. No count, no hint of what she is keeping back.",
        },
        {
          id: "count",
          label: "The name, with a count",
          means:
            "'2 events, kept private', not 3: only what this viewer could ever confirm counts, so The Block Party's own upload-to-view door keeps it out of the number too.",
        },
        {
          id: "not-found",
          label: "Not found, same as unclaimed",
          means:
            "The page 404s exactly as an unclaimed handle does, extending the same no-oracle privacy rule to an empty one.",
        },
      ],
      recommended: "count",
      because:
        "A count scoped to what this viewer could confirm still signals a real, active guest who chose privacy, without leaking a gated album she could not otherwise learn exists; 'nothing here yet' cannot do either, and the scoping matches the attended arm's own covers.",
      overrule:
        "A count that changes with who is asking is one more place to get the gate right; the plainer line never hints at what exists behind it either, gated or not.",
      lands:
        "Whether an intentionally private page reads as empty or as deliberately quiet, and whether its own count can ever say more than a gated 'guest at' line would.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ONE KNOB PER ID (`media-viewer`'s own finding, carried by every board since):
 * every ask declares the same SCREEN control on its own strip, so the
 * constructor would draw it four times without this dedupe.
 */
export const IDENTITY_PROFILE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
