import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST'S SIDE OF THE REEL, ROUND ONE, RE-CUT ON HIS FIRST ANSWERS
 * (2026-09-24). Nothing on this board has been answered yet, so it keeps round
 * one and re-cuts its asks.
 *
 * The reel makes itself from the second reel-eligible item: no Studio, no
 * publish, no file. What is left for a host is a handful of small acts spread
 * over the surfaces they already visit, and this board places each one.
 *
 * ★ HIS ANSWERS ARE GIVENS ON EVERY DRAWING (reel-view r1, reel-front r1,
 * reel-screen r1, and his ruling in chat, "The view is the wall"):
 *   - the view has a slim glass bar at rest that morphs into the dock; one top
 *     row of icons (play/pause, Include videos, Style, Hold, Show the code, Add
 *     yours as an icon) with "Make your own" as the single primary beneath; a
 *     top-left arrival chip that stacks into a short feed; full bleed; a 3 s
 *     hold adjustable in the dock; the code as a white plate bottom right; no
 *     event name on the picture;
 *   - Play on a screen opens that same view with the code on and a one-tap
 *     Start (there is no wall mode);
 *   - the hub's Reel card is the labelled card wearing a calm living thumbnail
 *     as a full background under an overlay;
 *   - the reel's minimum is TWO, and guests see nothing below it.
 *
 * ★ TWO QUESTIONS ARE MERGED, EVERY OPTION KEPT (his rule for repeats:
 * "instead of removing one, merge options under the same question"). `open` is
 * this board's old `screen` with reel-screen's `open`; `review` is this
 * board's old `review` with reel-screen's `review` and host-curation's `count`
 * (the desk-refresh-standing lane removes it there). Two of those options drew
 * the same picture (the counts as wired, and nothing at all), so they are one
 * option here, which is a finding rather than a road closed.
 *
 * ★ EVERY REEL FRAME IS THE REAL ENGINE'S (`stills.tsx`), over the reel's own
 * take of the fixture album, never an album photograph behind a chrome.
 */

// ★ "viewport", NEVER "screen": the id a knob takes becomes a board state key,
// and a question about a big screen is exactly where a second `screen` would
// read as the one being asked. Every board else calls this knob `screen`.
const VIEWPORT: Control = {
  id: "viewport",
  label: "Viewport",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** The progression's path, drawn at each of its three states. */
const ITEMS: Control = {
  id: "items",
  label: "Photos so far",
  options: [
    { id: "0", label: "None yet" },
    { id: "1", label: "One" },
    { id: "2", label: "Two: it starts" },
  ],
  default: "1",
};

export const REEL_HOST = defineExploration({
  id: "reel-host",
  title: "The host's side of the reel",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "Re-cut on his first answers: open and review merged in from reel-screen and host-curation, every option kept; Style becomes the reel's defaults; the switch gains the reel's own card; pulse redrawn for two; a new ask, the way to the reel.",
  },
  context:
    "The reel makes itself from the second photo; a host has a few small acts left, spread over the hub, Settings and the dashboard. Seven decisions on those real surfaces over Mia and Theo's wedding, each drawn on his answers: the view's glass bar and dock, the living Reel card, a screen that carries only the code, a minimum of two.",
  carried: [
    {
      id: "look",
      question: "Which mood do the view's frames wear while these are judged?",
      taken:
        "Sunset, full bleed. The default, Cinematic, letterboxes and would put the view's corners over black bars.",
      overrule:
        "Worth knowing alone: a host who touches nothing gets Cinematic's bars on every screen.",
    },
    {
      id: "screen-rec",
      question: "Which way onto a screen does the board recommend now?",
      taken:
        "The view's own control, over the hub door both boards recommended: his ruling made the screen a posture of the view.",
      overrule:
        "If a host should meet the screen while planning, before opening the reel, the hub door is the pick again.",
    },
    {
      id: "host-line",
      question: "Does a host-only line in the view ever reach a big screen?",
      taken:
        "No: the screen posture drops it, so only the chip and the room line options ever put words beside the code.",
      overrule:
        "If the host's own laptop drives the screen and should see it there, the line rides the screen too.",
    },
  ],
  asks: [
    {
      id: "progress",
      label: "The way to the reel",
      question:
        "How should the event page show a host the way to their reel before it starts?",
      context:
        "The reel starts at the second photo and guests see nothing before it. His words: it would be easy for a host to open an event with one image and think \"where's my reel??\".",
      options: [
        {
          id: "card",
          label: "The Reel card counts to two",
          means:
            "The Reel card shows its one photo behind \"1 more photo\" and two pips, then wears the living crossfade at two. No new block.",
        },
        {
          id: "band",
          label: "A band that fills with the photos",
          means:
            "Above the album, two frames: the first photo in one, the next waited for. At two it says the reel is live, once, and leaves.",
        },
        {
          id: "tile",
          label: "A waiting tile in the album",
          means:
            "The album keeps a dashed tile beside its one photo, \"One more starts your highlight reel\", gone when the second lands.",
        },
        {
          id: "step",
          label: "A step in what is left",
          means:
            "The launch list gains \"Start your highlight reel\", and that one row stays above the album until the second photo lands.",
        },
      ],
      recommended: "card",
      because:
        "The Reel card is where a host goes looking for the reel, so the answer to \"where is it\" belongs on it, and it grows into his living card at two with no block that has to come and go.",
      overrule:
        "If a host reads the album before the cards row, the band says it where the eye already is and makes the unlock a moment.",
      lands:
        "How the host app shows a feature that switches itself on, before it does, and the Reel card's face below the minimum.",
      configs: [VIEWPORT, ITEMS],
    },
    {
      id: "open",
      label: "Onto a big screen",
      question: "How should a host put the reel on a big screen?",
      context:
        "The view is the wall: Play on a screen opens the same view with the code on and a one-tap Start. This asks where that door sits. Merged from reel-host.screen and reel-screen.open.",
      options: [
        {
          id: "view",
          label: "A control in the view's dock",
          means:
            "One more icon in the dock's top row turns the view into the screen: fullscreen, awake, the code on. Any laptop that opens the reel has it.",
        },
        {
          id: "hub",
          label: "A door in the hub's cards row",
          means:
            "\"Play on a screen\" beside Review, Reel, Guests and Settings opens the view in a new tab on its Start plate.",
        },
        {
          id: "share",
          label: "In the share sheet",
          means:
            "Share gathers every way people meet the event; Play on a screen joins the code and the readable link as one more block.",
        },
        {
          id: "settings",
          label: "In Settings, beside Show the reel",
          means:
            "A host sets the screen up once, so it sits in the reel's own Settings card beside the switch, not among the rooms.",
        },
        {
          id: "link",
          label: "The hub door, plus a screen link",
          means:
            "The door, and a copyable link that opens a gated event's screen on a machine that is not yours. A token that expires: its own later build.",
        },
      ],
      recommended: "view",
      because:
        "The screen is a posture of the view now, so its door belongs in the view: one press from the reel on any laptop that can open the album, and a public event's venue computer never needs the host signed in.",
      overrule:
        "If hosts should discover the screen while planning the night, before ever opening the reel, the hub door announces it.",
      lands:
        "Where the screen lives in the product, and whether a screen link that needs no sign-in is on the roadmap.",
      configs: [VIEWPORT],
    },
    {
      id: "review",
      label: "Waiting uploads",
      question:
        "What should tell a host that uploads are waiting, and so are not in the reel yet?",
      context:
        "The reel plays approved items only, so a moderated queue never reaches it. Merged from reel-host.review, reel-screen.review and host-curation.count; each option drawn on the host's phone and on the screen.",
      options: [
        {
          id: "wired",
          label: "Nothing new: the counts as wired",
          means:
            "The bell, the event card's chip and Review's header keep their counts, disagreeing quietly. The reel and the screen say nothing.",
        },
        {
          id: "agree",
          label: "The counts agree and lead there",
          means:
            "The bell names the event and opens its queue, and every count reads one number. The reel and the screen say nothing.",
        },
        {
          id: "card",
          label: "One count, on the event card",
          means:
            "The dashboard card's chip is the only count; the bell drops its review row and Review keeps its queue.",
        },
        {
          id: "header",
          label: "Review's header says it",
          means:
            "Review gains one line: \"Approved photos join the highlight reel right away.\" Nothing on the reel or the screen.",
        },
        {
          id: "feed",
          label: "The host's arrival feed says it",
          means:
            "In the host's own view the top-left feed carries \"3 waiting to review\" under the arrivals, opening Review. A screen never shows it.",
        },
        {
          id: "chip",
          label: "A host's chip on the screen",
          means:
            "A small chip on the screen, \"3 waiting, on your phone\". Meant for one person, read by the whole room.",
        },
        {
          id: "room",
          label: "A line the room reads",
          means:
            "\"New photos appear once Mia approves them\", across the top of the screen, so a guest knows why theirs is not up yet.",
        },
      ],
      recommended: "feed",
      because:
        "The host feels the gap while watching the reel, and the feed is where the reel already says what is arriving: a line there reaches the one person who can act, and nothing is said to the room.",
      overrule:
        "If the reel should carry nothing but playback, the counts that agree and lead to the queue say it wherever else a host looks.",
      lands:
        "Whether the reel or a public screen ever carries a host-only signal, and how many places count a waiting queue.",
    },
    {
      id: "style",
      label: "The reel's defaults",
      question:
        "Where should a host set the reel's defaults, its mood and its hold?",
      context:
        "Style and Hold already sit in the view's dock for every viewer, each a device's own choice. The event still starts everyone somewhere: a mood (Cinematic unless set) and his 3 second hold.",
      options: [
        {
          id: "view",
          label: "The host's own moves in the view",
          means:
            "When the host changes Style or Hold in the view, that is where every guest starts, and the popover says so.",
        },
        {
          id: "sheet",
          label: "A Reel card in Settings",
          means:
            "The eight moods as real frames and the hold's steps in one card; the view's controls stay each viewer's own, the host's too.",
        },
        {
          id: "both",
          label: "Settings, and \"for everyone\" in the view",
          means:
            "The Settings card holds the defaults, and the host's popover in the view offers \"Set for everyone\" beside the pick.",
        },
      ],
      recommended: "both",
      because:
        "A default is set best while it plays and should never change by accident: a host slowing the hold for a wall would otherwise slow every phone. An explicit \"Set for everyone\" in the view and a card that shows what is set cover both.",
      overrule:
        "If a second home for Style is one too many, the host's own moves in the view set it, and the popover says so.",
      lands:
        "Whether an event's default look is set while watching or in Settings, and whether a host's own moves ever change a guest's view.",
      configs: [VIEWPORT],
    },
    {
      id: "switch",
      label: "Show the reel",
      question: "Where should the host's \"Show the reel\" switch sit?",
      context:
        "The reel is on for every event unless the host turns it off, which hides it everywhere: the album's tile, the view and any screen. Settings already carries one such switch, beside the guest list.",
      options: [
        {
          id: "guestlist",
          label: "Beside the guest list switch",
          means:
            "A third row in the Profile & guests card, one sentence of consequence, the shape Show the guest list already wears.",
        },
        {
          id: "first",
          label: "At the head of Settings",
          means:
            "Its own Reel card above Details, Visibility and Uploads: the reel is the event's public face now.",
        },
        {
          id: "inview",
          label: "In the view, the host's own",
          means:
            "No Settings row: a host-only switch closes the dock's top row, where the host can see what turning it off costs.",
        },
        {
          id: "card",
          label: "On the reel's own card on the page",
          means:
            "A reel card above the album counts to two before the reel starts and, once it plays, holds the switch beside the living thumbnail.",
        },
      ],
      recommended: "guestlist",
      because:
        "Show the guest list already proved the pattern, a loud one-line consequence beside a switch, and a host reads that card end to end; the reel's visibility is exactly that kind of decision.",
      overrule:
        "If the reel is the event's headline feature rather than one more visibility switch, the head of Settings says so by placement alone.",
      lands:
        "Whether turning the reel off sits with the other visibility switches, on the reel's own card, or inside the reel.",
      configs: [VIEWPORT],
    },
    {
      id: "pulse",
      label: "The dashboard's line",
      question: "How should the dashboard say an event's reel is live?",
      context:
        "\"Has a reel\" becomes \"the reel is live\": the switch on and two or more items. The dashboard's cards already say what each event needs; the reel's life is new information they could carry, or not.",
      options: [
        {
          id: "counts",
          label: "A line that counts to two",
          means:
            "Under two items the card says \"1 more photo starts the highlight reel\"; from two, \"Highlight reel live\".",
        },
        {
          id: "threshold",
          label: "Nothing until two, then the line",
          means:
            "Under two items the card says nothing extra; the moment the second lands, \"Highlight reel live\" appears under it.",
        },
        {
          id: "cover",
          label: "The card's cover crossfades",
          means:
            "No line, no words: a live event's cover slowly crossfades through the reel's stills, at his tile's calm pace.",
        },
      ],
      recommended: "cover",
      because:
        "The reel's pitch is that it is watchable, not merely present: a card whose cover moves at his tile's slow crossfade shows it in the one place a host looks every morning.",
      overrule:
        "A moving dashboard is also the busiest one; if that reads as noise, the plain line says the same fact at rest.",
      lands:
        "Whether the dashboard states the reel's life as a fact, counts toward it, or lets the card show it.",
      configs: [VIEWPORT],
    },
    {
      id: "cut",
      label: "A host's own cut, added",
      question: "What should happen when a host adds their own cut to the album?",
      context:
        "A finished cut on a paid event can go through 'Add to the album', spending the host's own storage; the live reel skips it. It always lands approved, never a Review queue, so this asks what the album shows, never whether it is held.",
      options: [
        {
          id: "marked",
          label: "Lands approved, a small cut mark",
          means:
            "The tile carries a small badge distinct from the video play mark, so it reads as made from the reel.",
        },
        {
          id: "plain",
          label: "Lands approved, no mark at all",
          means:
            "The video sits in the album exactly like any other host upload: a play mark, nothing more.",
        },
        {
          id: "confirm",
          label: "A confirm sheet first",
          means:
            "Before it lands: 'Add this cut to the album? This uses about 8 MB of your storage.' Cancel or add.",
        },
      ],
      recommended: "confirm",
      because:
        "This is the one reel-related act that spends something real, the host's own storage cap, and every other place in the product that spends a host's bytes on their say-so asks first rather than acting silently.",
      overrule:
        "If the cost is trivial next to the plan, one more sheet is worse than the silence, and the plain landing is the faster path.",
      lands:
        "Whether adding a cut is a silent act, a marked one, or a confirmed one.",
      configs: [VIEWPORT],
    },
  ],
});
