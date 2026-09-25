import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE DOOR SHEET, WITH AN EMAIL (the refresh, round one, 2026-09-24).
 *
 * The lab's own redesign of the guest door, once identity's foundation (the
 * schema, the wire, the door, the claim) stood whole on the alias: six
 * decisions on the shipped pieces a guest actually meets between her QR scan
 * and the album.
 *
 * ★ ONE GUEST, THE WHOLE BOARD. Every option is Priya, `guest-capture`'s own
 * guest, at Maya and Jay's wedding, met a step earlier than that board finds
 * her: before her name is typed, before any photograph is sent. A reader who
 * has answered `guest-capture` meets her again here, at the door she walked
 * through to get there.
 *
 * ★ THE ORDER IS HER OWN WALK THROUGH THE DOOR: whether the welcome earns its
 * own screen before her name does, the optional email under that name, a way
 * to sign in if she is already a member, the framing she would meet had Maya
 * asked for a confirmed email instead, then her own menu once she is inside
 * and where undoing an email lives. All six are roots: each holds the other
 * five at today's shape and moves only its own piece.
 *
 * ★ WHAT IS HELD STEADY, NOT ASKED HERE. Whether an event requires a
 * verified email at all, the three levels of trust, the claim per event, the
 * mark's word: all outside this board's six questions. The steps behind the
 * name field (the gate before the upload, the itinerary's "no exit") stay
 * put too; only whether the WELCOME half of the walk deserves its own screen
 * is open, in `walk` below. The flows around the claim ticket itself and the
 * profile it can lead to are the two boards beside this one,
 * `identity-claims` and `identity-profile`.
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
  id: "identity-door",
  title: "Asking for an email at the door",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "The refresh: a sixth question (`walk`) asks whether the welcome deserves its own screen at all; the gate's copy no longer leans on being 'the ruled line' to justify itself; every comment drops the earlier round's authority framing.",
  },
  context:
    "Every option is Priya at Maya and Jay's wedding, the world guest-capture already uses, met at the door she walks through to reach it. This board asks whether the welcome deserves its own screen, where the optional email sits against her name, whether a member gets a way to sign in instead, how the verified gate sells itself, and what her own menu offers once she is inside.",
  asks: [
    {
      id: "walk",
      label: "The welcome step",
      question:
        "Does the welcome deserve its own screen before Priya can even start typing her name?",
      context:
        "Today a first-time visitor meets one screen alone (an eyebrow, the event's name, two benefit rows, one Continue) before the name step behind it ever shows; a returning device skips straight to the plain name step already.",
      options: [
        {
          id: "separate",
          label: "Its own screen, once, as shipped",
          means:
            "A first visit meets the welcome alone; Continue reveals the name step. A returning device skips straight to the name step, as today.",
        },
        {
          id: "combined",
          label: "Combined, on a first visit only",
          means:
            "The welcome's two lines sit above the name field itself, one screen, one Continue. A returning device meets exactly today's name step.",
        },
        {
          id: "gone",
          label: "Retired: every visit meets one screen",
          means:
            "The dedicated welcome step goes; its two lines fold into the name step's own heading, so first-time and returning guests meet the same screen.",
        },
      ],
      recommended: "combined",
      because:
        "The welcome's own words move above the field she is about to fill instead of behind a tap that reveals it: one fewer screen for a first look, with the return visit (already the common case) untouched.",
      overrule:
        "If the arrival's own beat is worth an extra tap, the shipped two screens keep it dedicated rather than a field she reads past on her way in.",
      lands:
        "Whether a guest's very first look at an event costs one screen or two before she can start typing her name.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "field",
      label: "The field",
      question:
        "Where should the optional email sit against the name Priya is already typing?",
      context:
        'Today it is a second field, always open under the name, labelled "Email (optional)" with its own helper line. One held sheet, no exit; the nine-tile teaser sits blurred behind it the whole way.',
      options: [
        {
          id: "shown",
          label: "A second field, always open, as shipped",
          means:
            'Both fields stand open together: the name, then "Email (optional)" with its helper line beneath, one Continue for both.',
        },
        {
          id: "ghost",
          label: "A ghost line that opens on tap",
          means:
            'Only the name shows. A quiet line, "Add an email to come back anytime", stands where the field would be; a tap swaps it for the real input.',
        },
        {
          id: "step",
          label: "Its own soft step, with Skip",
          means:
            'The name step ends at Continue. A second screen in the same held sheet asks for the email alone, a "Skip for now" beside the button.',
        },
      ],
      recommended: "ghost",
      because:
        "An always-open second field asks two things before Continue even though one is optional; a closed line reads as one question with an easy afterthought, which fits his 'fun, safe, easy and streamlined' bar better than a whole extra screen too.",
      overrule:
        "If a quiet line goes unnoticed entirely, the open field is the only one of the three that guarantees the email is even seen.",
      lands:
        "Whether the door ever asks two things before Continue, or teaches one question with an easy add-on.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "nudge",
      label: "The sign-in nudge",
      question:
        "At a names-mode door, where should an existing member be offered a way to sign in instead?",
      context:
        'Today: nowhere on the door itself. A member typing a name here mints a fresh, unlinked guest row; her own account and its photographs are only "Sign in" away in the menu, once she is already inside and past the point of avoiding it.',
      options: [
        {
          id: "underfield",
          label: "A ghost link under the field",
          means:
            'Beneath the name and email fields, a quiet line: "Already on Partyreel? Sign in and your photos go with it."',
        },
        {
          id: "welcome",
          label: "A row on the welcome step",
          means:
            "The same sentence, as a third benefit row on the welcome screen itself, beside the two the invitation already carries.",
        },
        {
          id: "none",
          label: "Nothing new, as shipped",
          means:
            "The door stays as it is; the menu's own Sign in row, reachable only after she has already joined by name, is left to cover it.",
        },
      ],
      recommended: "underfield",
      because:
        "It meets her exactly where the decision is being made, about to type a name, without adding a row to the welcome that almost nobody needs; the menu's Sign in only exists after she has already minted a fresh, unlinked guest.",
      overrule:
        "The welcome is the one screen every guest reads before deciding anything, so a row there reaches a member before she has typed a single character.",
      lands:
        "Whether a returning member ever learns she can skip the name and email entirely before she does the work, or only after.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "gate",
      label: "The gate's framing",
      question:
        "On the verified-required gate, should the benefit framing stay the one shipped line, or say more?",
      context:
        'Today: "The host has asked guests to confirm an email for safety. One tap and you\'re in." An earlier draft paired it with a second benefit, saving the event; that half is gone now, leaving one true benefit: her photos stay in her account.',
      options: [
        {
          id: "line",
          label: "The one line, as shipped",
          means:
            "The shipped sentence alone, under the eyebrow 'Almost in': the ask, the reason, the cost, in one breath.",
        },
        {
          id: "list",
          label: "The line, plus what confirming buys her",
          means:
            'The same sentence, then one added line: "Every photo you add from here stays in your account."',
        },
        {
          id: "eyebrow",
          label: "The host named in the eyebrow",
          means:
            "\"Almost in\" becomes the host's own name (\"Maya's event\"); the shipped reason line stands unchanged beneath it.",
        },
      ],
      recommended: "line",
      because:
        "The one truthful benefit left, a forward promise about photos she has not added yet, is thinner alone than the pair an earlier draft paired it with. The shipped line already carries the ask, the reason and the cost in one breath.",
      overrule:
        "If even one true benefit is worth surfacing at the gate, the added line costs nothing and answers the question she is about to ask herself anyway.",
      lands:
        "Whether the gate sells a guest on what confirming buys her, or leaves that to be discovered afterward.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "menu",
      label: "The guest menu",
      question:
        "Should Priya's own menu stay a plain list of rows, or say more about her state?",
      context:
        'Today: her name, "Unverified" beneath it, then Add your email, Change name, a divider, Sign in. The mark\'s popover explains "Unverified" already. guest-capture\'s tracker ask may grow the sheet option into her batch status; not asked here.',
      options: [
        {
          id: "rows",
          label: "The label and rows, as shipped",
          means:
            "A plain list: the status label, then one action row per thing she can do, nothing explained twice.",
        },
        {
          id: "card",
          label: "A card explaining the state, with one action",
          means:
            'The menu opens on a small card, one sentence ("You\'re Unverified: anyone can type a name.") and one button, before the remaining rows.',
        },
        {
          id: "sheet",
          label: 'One "Your photos" row, opening a sheet',
          means:
            "The menu collapses to a single row; tapping it opens a bigger sheet holding her name, status and every action together.",
        },
      ],
      recommended: "rows",
      because:
        "The label already says the state and the very next row is the one action that matters; a card repeats what the mark's popover already explains, and one generic row hides the state behind a tap instead of showing it.",
      overrule:
        "If the menu should teach what Unverified costs her, not just let her act on it, the card's sentence does that right where she is already looking.",
      lands:
        "Whether the menu stays a plain action list, or becomes a second place a guest reads what her own status means.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "remove",
      label: "Removing the email",
      question:
        'For a guest who typed an email, where should "Remove your email" live?',
      context:
        "Today: nowhere. The row's own address can only be detached from a confirmed account's dashboard later; the menu offers Confirm your email and nothing to undo it before then.",
      options: [
        {
          id: "menu-row",
          label: "A row in the menu",
          means:
            'A persistent "Remove your email" row sits beside Confirm your email, reachable in one tap from the menu itself.',
        },
        {
          id: "quiet-link",
          label: "A quiet link inside the confirm door",
          means:
            'Opening "Confirm your email" shows its usual empty code door, with "Remove this email instead" as a quiet link beneath it.',
        },
        {
          id: "nowhere",
          label: "Nowhere yet, as shipped",
          means:
            "No control at all while the address is unconfirmed; undoing it waits for the dashboard's own tools once it is a real account.",
        },
      ],
      recommended: "quiet-link",
      because:
        "It mirrors the shipped Add-email dialog's own idiom exactly, a quiet second path inside the primary door, rather than growing the menu with a row most guests never need and one could tap by mistake.",
      overrule:
        "A guest who wants out and nothing else has to open the confirm door first to find it; a menu row costs one line and reaches her without that detour.",
      lands:
        "Whether undoing an email costs a guest one extra door, or one more row she scans past every time.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ONE KNOB PER ID (`media-viewer`'s own finding, carried by every board over
 * this world): every ask declares the same SCREEN control on its own strip,
 * so the constructor would draw it six times without this dedupe.
 */
export const IDENTITY_DOOR: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
