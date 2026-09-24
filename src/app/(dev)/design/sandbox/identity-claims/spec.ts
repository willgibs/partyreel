import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./scene";

/**
 * THE CLAIM TICKET (a NEW board on his word, 2026-09-22; "the morning
 * after the identity round": "I'd like to run most of this through
 * the lab once our foundation is complete... this introduces lots of new UI
 * and flows"; the plan-review feedback on the same page: "new claim tickets
 * should be from the dashboard, not tucked under the accounts page. This'll
 * be a future notification too.").
 *
 * The foundation is whole and shipped, `deliberately plain`
 * (`claims-card.tsx`): one card at the head of Your events, every event a
 * row, Claim or Not mine, Claim all, Finish, a confirmation whenever Finish
 * would delete something unclaimed. This board is its refinement catalog,
 * lab-only, no production byte: five decisions over Priya (`guest-capture`'s
 * and `media-viewer`'s own guest), who confirmed her email this morning at
 * Maya and Jay's wedding and finds two older events waiting under that
 * address: Tom's leaving do, really hers, and a beach bonfire she never
 * attended, uploaded under her email by someone else.
 *
 * ★ THE TICKET CANNOT TELL THE TWO APART (verbatim: "the host
 * can't see the attributed email of an unconfirmed account"). Both render as
 * ordinary rows; the distinction lives only in Priya's own memory, which is
 * exactly what lets `pass`, `confirm` and `after` show a mixed state, one
 * claimed and one left over, rather than two identical decisions.
 *
 * ★ ALL FIVE ARE ROOTS. Each holds the other four at today's shape and moves
 * only its own piece (`guest-capture`'s own note, carried here): where the
 * ticket lives, how the album points to it, how she works through more than
 * one event, how she is warned before a deletion, and what Finish leaves her
 * looking at.
 *
 * ★ WHAT IS DELIBERATELY NOT ASKED. The model itself is ruled (three levels
 * of trust, the per-event name until a claim, the public mark's word
 * "Unverified", the removal of unclaimed uploads at Finish): a confirmed
 * caller with rows waiting is the premise this board stands on, not a
 * question inside it. The RPCs (`claim_guest_rows_by_email`,
 * `disown_guest_rows_by_email`) and the grouping-by-event rule are unmoved;
 * every option here changes only what a screen says and where it says it.
 */

const IDENTITY_CLAIMS_DRAFT = defineExploration({
  id: "identity-claims",
  title: "Photos waiting for you",
  round: {
    n: 1,
    date: "2026-09-22",
    changed:
      "New board, cut once the identity round's foundation was whole on the alias, on his word.",
  },
  context:
    "Priya confirmed her email this morning at Maya and Jay's wedding (guest-capture's own world). Two older events wait under that address: Tom's leaving do, really hers, and a beach bonfire she never attended, uploaded under her email by someone else. Five decisions on the ticket that lets her sort the two: where it lives, how the album points to it, how she works through more than one, how she is warned before a deletion, and where Finish leaves her.",
  asks: [
    {
      id: "ticket",
      label: "The ticket's home",
      question:
        "Where should the claim ticket live when Priya reaches her dashboard?",
      context:
        "Today one plain card sits at the head of Your events, every row shown with Claim or Not mine. Drawn only when a confirmed account has rows waiting under its own address.",
      options: [
        {
          id: "card",
          label: "The plain card, as shipped",
          means:
            "Sits at the head of Your events with every event's Claim or Not mine already open.",
        },
        {
          id: "banner",
          label: "A slim banner that opens a sheet",
          means:
            "One line above the feed with a Review button; the detail opens in a side sheet, the feed itself untouched.",
        },
        {
          id: "bell",
          label: "A bell notification, feed untouched",
          means:
            "The bell's badge counts it; its drawer holds the same rows and Your events never grows a new card.",
        },
      ],
      recommended: "card",
      because:
        "The events list is where a host already looks first, and a confirmed caller with rows waiting is rare enough that a permanent card costs nothing the rest of the time it is gone.",
      overrule:
        "If the ticket should feel like an inbox item rather than a fixture of the page, the bell keeps Your events completely undisturbed.",
      lands:
        "Whether claiming photographs is a fixture of the dashboard or a notification a host opens on purpose.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "pointer",
      label: "The pointer from the album",
      question:
        "When Priya confirms and rows wait elsewhere, how should she learn about them?",
      context:
        "Nothing at the album says anything today. She just confirmed at Maya and Jay's wedding; two older events wait under her now-proven email.",
      options: [
        {
          id: "quiet",
          label: "Nothing here, the dashboard's the one place",
          means:
            "The moment card names only this event; what waits elsewhere stays a dashboard-only surface until she visits it.",
        },
        {
          id: "line",
          label: "A line on the moment card, with a link",
          means:
            "The moment card gains a line, six photos from two other events are waiting for you, linking to the dashboard.",
        },
        {
          id: "toast",
          label: "A toast right after confirming",
          means:
            "A second toast surfaces once alongside the moment card; missed it, the dashboard still holds every row.",
        },
      ],
      recommended: "line",
      because:
        "She is certainly reading the moment card already, so a line inside it costs nothing extra to notice, while a toast can be missed and leaves six photographs unmentioned.",
      overrule:
        "If the moment should stay narrowly about this event, naming what waits elsewhere may dilute it.",
      lands:
        "Whether confirming an email surfaces everything waiting under it at once, or only what happened here.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "pass",
      label: "Working through more than one",
      question: "How should Priya work through more than one waiting event?",
      context:
        "One card lists every event as a row today, Claim or Not mine beside each. She has two: Tom's leaving do, hers, and a beach bonfire she never attended.",
      options: [
        {
          id: "rows",
          label: "Every event as a row, as shipped",
          means:
            "Both events sit in one list at once; Claim or Not mine per row, Claim all and Finish beneath.",
        },
        {
          id: "cards",
          label: "One event at a time, as cards",
          means:
            "Tom's leaving do fills the card alone with its own small preview; deciding it advances to the bonfire.",
        },
        {
          id: "checklist",
          label: "A checklist, photos shown small",
          means:
            "Both events list as rows that open to a small photo grid right there, before Claim or Not mine.",
        },
      ],
      recommended: "rows",
      because:
        "Two events is not a queue: seeing both at once with a Claim all shortcut is faster than stepping through one at a time or opening every row's photos first.",
      overrule:
        "If recognising a fake upload takes seeing the actual photograph, the checklist earns its extra height.",
      lands:
        "Whether deciding a handful of events is one glance or a small photo review each time.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "confirm",
      label: "Warning before a deletion",
      question:
        "How should Priya be warned before an unclaimed event's uploads are deleted?",
      context:
        "Finish with anything unclaimed opens a dialog today, naming the events and the count. She left the bonfire's two untouched, which reads as not mine, delete it.",
      options: [
        {
          id: "dialog",
          label: "A dialog, as shipped",
          means:
            "Finish opens a centred dialog naming the event and the count, Delete and finish or Go back.",
        },
        {
          id: "inline",
          label: "The leftover row turns red inline",
          means:
            "Tapping Finish turns the bonfire's row destructive in place with its count, one Delete button.",
        },
        {
          id: "second-screen",
          label: "A second screen listing every photo",
          means:
            "Finish advances to one more screen: every photo the bonfire would lose, small, before deleting.",
        },
      ],
      recommended: "dialog",
      because:
        "A permanent deletion is the one action here that cannot be undone, and a dialog stops her before it happens rather than beside a row she might tap past.",
      overrule:
        "If losing photographs is the risk that matters most, only the second screen shows her what she would lose before she loses it.",
      lands:
        "How hard it is to delete a stranger's upload by accident on the way to keeping your own.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "after",
      label: "What Finish leaves her looking at",
      question: "What should Finish leave Priya looking at?",
      context:
        "A toast says it today: Added 4 photos to your account. Tonight's ruling adds more: claiming now settles Tom's leaving do into Your events as a Guest card too, the ticket gone. She claimed it and let the bonfire go.",
      options: [
        {
          id: "toast",
          label: "The toast, as shipped",
          means:
            "Added 4 photos to your account. Tom's leaving do settles quietly into Your events as an ordinary Guest card, the ticket gone.",
        },
        {
          id: "profile",
          label: "The toast, plus a profile pointer",
          means:
            "The same toast gains a second line, Choose what shows on your page, linking to the profile.",
        },
        {
          id: "strip",
          label: "The claimed event opens in a strip",
          means:
            "Unlike the baseline's quiet settle, Tom's leaving do gets one highlighted 'Just claimed' beat, expanding into a small strip with its photos right there.",
        },
      ],
      recommended: "profile",
      because:
        "Nothing today tells a fresh confirmer a profile even exists to choose from, and the instant after claiming photographs is exactly when that matters most.",
      overrule:
        "If the moment should stay small, the plain toast already closes the loop without sending her anywhere new.",
      lands:
        "Whether claiming photographs doubles as the moment a new profile gets introduced.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/** One knob per id (`guest-capture`'s own dedupe): every ask declares the
 *  same SCREEN control, so the constructor would draw it five times without this. */
export const IDENTITY_CLAIMS: typeof IDENTITY_CLAIMS_DRAFT = {
  ...IDENTITY_CLAIMS_DRAFT,
  controls: IDENTITY_CLAIMS_DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
