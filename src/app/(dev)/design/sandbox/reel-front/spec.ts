import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./scene";

/**
 * THE ALBUM'S LIVING TILE (Will, 2026-09-22, rulings.md "the reel,
 * reconceived"): the reel is no longer something a host makes; it is alive
 * from the third reel-eligible item, spliced within seconds of an upload,
 * playing from a tile at the album's head and in a full-screen view. This
 * board is the tile alone: what it is, its verbs, its small states, the beat
 * after a guest's first upload, the door's backdrop where a viewer is already
 * fully in, the keepsake state once uploads close, and its face on the host's
 * own hub. `reel-view` (the full-screen view it opens) and `reel-cut` (the
 * on-device creator it may launch, wave two) are the boards beside this one;
 * neither is asked here.
 *
 * ★ DECIDED, NOT ASKED (the brief, verbatim): the tile exists from the third
 * reel-eligible item and is absent under it or with the host's switch off; the
 * tile is its OWN slot directly above `aboveAlbum` (the demo's turn card and
 * paired lines keep their one slot, adjacent to the first photograph); the
 * reel never renders behind a door for a gated viewer (a teaser viewer sees no
 * reel; a locked event's backdrop stays the ghost pack), so `door`'s options
 * apply only where access is already `full`; every reel surface's stills are
 * `preview_key`; "yours first" reads the approved payload only. None of that
 * is a question below.
 *
 * ★ EVERY "LIVE" PIXEL IS THE REAL ENGINE, DRAWN ONCE (`engine.ts`): the
 * fixture take's own frames, cross-dissolved in plain CSS rather than a
 * mounted `CanvasReelPlayer` (which reaches for a bare `document`/
 * `IntersectionObserver` that a portalled lab frame cannot give it: see
 * engine.ts's header). Every option is drawn; nothing here is a claim with no
 * picture behind it.
 *
 * `guest-capture.moment` (when the keep-what-you-added offer first reaches a
 * guest) and `host-curation.arrivals` (what the review queue does when a
 * photo lands mid-session) sit right beside `yours` and `states` without
 * asking either of them: this board only asks what the ALBUM'S OWN TILE does,
 * never the offer card or the review queue.
 */

const COUNT: Control = {
  id: "count",
  label: "Count",
  options: [
    { id: "0", label: "0 items" },
    { id: "1", label: "1 item" },
    { id: "2", label: "2 items" },
  ],
  default: "1",
};

const DRAFT = defineExploration({
  id: "reel-front",
  title: "The album's living tile",
  round: {
    n: 1,
    date: "2026-09-22",
    changed: "New board, cut at the reel round's record.",
  },
  context:
    "The reel is reconceived whole: a live, looping montage of the album, playing from a tile at its head from the third reel-eligible item, with no host action. This board asks what that tile is, its states, its face at the door and on the hub, never the full-screen view it opens (reel-view) or the on-device creator it may launch (reel-cut, wave two).",
  bible: [4, 12, 14, 18, 22],
  asks: [
    {
      id: "tile",
      label: "The living tile",
      question:
        "What should the album's living tile actually be: the engine playing, a plain crossfade, or one framed still?",
      context:
        "The reel's own slot, directly above the album's first row. Every option is measured for what it costs the album's first paint, before a single guest photo can be judged.",
      options: [
        {
          id: "live",
          label: "The engine, playing",
          means:
            "A canvas in thumb mode, lazy-loaded and started only once the tile scrolls into view: richest, and the one option with a real script cost.",
        },
        {
          id: "crossfade",
          label: "A slow crossfade, no engine",
          means:
            "The newest stills alone, cross-dissolving every few seconds: zero canvas, zero lazy chunk, cheaper motion.",
        },
        {
          id: "framed",
          label: "One framed still",
          means:
            "A single cover photo with a play mark and a count: no motion at all, the cheapest of the three.",
        },
      ],
      recommended: "live",
      because:
        "It is the whole pitch, an immediately watchable highlight; the cost lands AFTER first paint, not during it, because the engine is a lazy boundary that only loads once the tile is in view.",
      overrule:
        "If even a deferred chunk is one too many on a page whose only job is to load fast, the no-engine crossfade keeps the motion and drops the script.",
      lands:
        "Whether the album's first paint ever waits on the reel engine, and how a guest first meets the reel.",
      tile: "phone",
    },
    {
      id: "verbs",
      label: "The tile's verbs",
      question:
        "Should the tile carry one verb or two: watch alone, watch and add, or watch and make a cut?",
      context:
        'A tap on the tile always opens the reel (ruled); a second, smaller control can sit in its corner. "Make your own" is the ruled name for the on-device creator reel-cut builds next; nothing here wires it.',
      options: [
        {
          id: "watch-add",
          label: "Watch, and Add yours",
          means:
            "A corner control jumps straight to the upload sheet, so the tile keeps driving contribution while uploads are open.",
        },
        {
          id: "watch",
          label: "Watch alone",
          means:
            "One tap, one job: open the reel. Every other verb lives inside the view once it opens.",
        },
        {
          id: "watch-make",
          label: "Watch, and Make your own",
          means:
            "A corner control jumps straight to the on-device creator, for a guest who already knows what they want.",
        },
      ],
      recommended: "watch",
      because:
        "The view itself already carries Add yours and Make your own in its own control set (reel-view's own ask); a second entry point on the tile duplicates a tap the view offers one beat later.",
      overrule:
        "If the tile is the only thing most guests ever notice, giving it a second verb converts more of them than routing everyone through the view first.",
      lands: "Whether the album's head is a one-tap door or a small dashboard of its own.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "states",
      label: "The small states",
      question:
        "Before the reel exists, and with the host's switch off, what should its slot show?",
      context:
        'The reel is absent under three reel-eligible items or with the switch off (ruled). The "Count" knob previews 1 and 2 items; 0 and the switch off both read as the very same empty slot.',
      options: [
        {
          id: "nothing",
          label: "Nothing at all",
          means:
            "No slot, no line, no box: the album looks exactly like an event with the reel off, because to a guest it is.",
        },
        {
          id: "line",
          label: 'A line: "one more and it begins"',
          means:
            "A single muted sentence in the slot, no box around it, counting down as photos land.",
        },
        {
          id: "dimmed",
          label: "A dimmed box with the count",
          means:
            "The tile's own shape, greyed and locked, so its arrival at three reads as a reveal rather than a surprise.",
        },
      ],
      recommended: "nothing",
      because:
        "A promise with nothing behind it is the empty-state failure this system already rejected once; a guest at zero or one photo has nothing to watch, and saying so twice, as a line and as a locked box, is one time too many.",
      overrule:
        'If the count itself is the hook, "two away" costs one sentence and gives every guest a reason to add the next photo.',
      lands: "Whether the reel announces itself before it exists, or only arrives once it does.",
      tile: "phone",
      configs: [SCREEN, COUNT],
    },
    {
      id: "yours",
      label: "The beat after yours",
      question:
        "The moment a guest's first photo is approved, should the tile say so?",
      context:
        '"Yours first" already reads the approved payload only (ruled): the reel leads with a guest\'s own newest approved item next time it loops. This asks whether the TILE marks the moment, apart from that reorder.',
      options: [
        {
          id: "badge",
          label: 'The tile says "yours is in it"',
          means:
            "The corner mark swaps to a personalised badge for this device only, until the next visit.",
        },
        {
          id: "unchanged",
          label: "The tile stays as it was",
          means:
            "No mark at all: the reorder is the acknowledgement, seen only once the guest actually watches.",
        },
        {
          id: "toast",
          label: "A toast, once",
          means:
            "A brief, dismissable line at the top of the screen; the tile itself never changes.",
        },
      ],
      recommended: "badge",
      because:
        "A guest who never taps the tile still deserves to know their photo made it; a mark that stays until the next visit costs nothing to build and nothing to miss, where a toast can be looked away from.",
      overrule:
        'If the corner is already carrying "The reel" or a second verb, a persistent swap crowds one small space; the toast says it once and gets out of the way.',
      lands: "Whether the reel's warmest beat is guaranteed to reach a guest, or only reaches the ones who look.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "door",
      label: "The door's backdrop",
      question:
        "Where the album is already fully unlocked, what sits behind the held welcome: the moving reel, the album's stills, or one still?",
      context:
        'The nine-tile teaser already sits blurred behind every itinerary step (ruled). This applies only where access is already "full": a teaser or locked viewer never meets the reel at all (ruled).',
      options: [
        {
          id: "moving",
          label: "The moving reel, blurred",
          means:
            "The living tile plays right where it will sit once the sheet closes: the first thing behind the welcome is already in motion.",
        },
        {
          id: "stills",
          label: "The album's stills, as shipped",
          means:
            "The real photographs, dimmed behind the sheet, exactly as today: the reward stays the album, not the reel.",
        },
        {
          id: "one",
          label: "One still",
          means:
            "A single calm photograph fills the space: the least busy of the three, and the least revealing.",
        },
      ],
      recommended: "stills",
      because:
        "The welcome teases the album, and swapping it for the reel here answers a question, is there a reel, before the guest has even given their name.",
      overrule:
        "If the reel is the flagship moment, showing it moving from the very first second reads as more exciting than a static grid.",
      lands: "What a brand-new guest's very first glimpse of the event actually is.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "closed",
      label: "Once uploads close",
      question: "Once the host closes uploads, should the tile change at all?",
      context:
        'The reel keeps its one slot in both states now (ruled: the old hero-or-inline split is gone). This asks only what happens to ITS OWN box once "Add yours" has nowhere left to send anyone.',
      options: [
        {
          id: "minus-add",
          label: "The same tile, minus Add yours",
          means:
            "Identical box, identical size: the second verb simply has nothing to do, so it is not drawn.",
        },
        {
          id: "larger",
          label: "A larger keepsake tile",
          means:
            "The same slot, but the card grows: the album is a keepsake now, and its one moving picture earns more of the page.",
        },
        {
          id: "plays",
          label: "It plays in place, always",
          means:
            "No tap needed: the tile autoplays continuously right there in the feed, the way a keepsake film would.",
        },
      ],
      recommended: "plays",
      because:
        "The old hero reel earned its keepsake status by taking over the top of the page; keeping the tile's size fixed but letting it play unprompted is the same promotion without reopening the one-slot decision.",
      overrule:
        "If a feed of tiles that autoplay is exactly what a photo-fatigued guest scrolls past fastest, minus-Add costs nothing and disturbs nothing.",
      lands: "Whether the keepsake era gets its own small ceremony, or simply loses a button.",
      tile: "phone",
      configs: [SCREEN],
    },
    {
      id: "hub",
      label: "The hub's Reel card",
      question:
        "On the host's own hub, should the Reel card show a living thumbnail, stay a label, or show a still with the count?",
      context:
        'Today the Reel card is text only: an icon, "Reel", and "Create reel" or a clip count. That verb is gone; this asks what replaces it as the reel\'s own face among the other three cards.',
      options: [
        {
          id: "living",
          label: 'A living thumbnail, with "Live"',
          means:
            'The same crossfade the album\'s tile wears, shrunk to a card face, with a small "Live"/"Off" mark.',
        },
        {
          id: "labelled",
          label: "The labelled card, as shipped",
          means:
            'Icon, "Reel", and a value line, "9 items" or "Off": no picture at all, matching the other three cards.',
        },
        {
          id: "counted",
          label: "A still, with the count and the switch",
          means:
            "One calm frame with a play mark, the item count, and whether the switch is on: motion nowhere on this row.",
        },
      ],
      recommended: "labelled",
      because:
        "The other three cards are text only by design, scannable in one glance down a sticky row; a picture on exactly one of four breaks that rhythm for the row's own consistency's sake.",
      overrule:
        "If the reel is the flagship, its own card is the one place on the hub allowed to look different, and a host scans a face faster than words.",
      lands: "Whether the sticky cards row stays one visual language, or the reel gets to be the exception.",
      configs: [SCREEN],
    },
  ],
});

export const REEL_FRONT: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
