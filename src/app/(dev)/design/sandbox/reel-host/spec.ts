import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE HOST'S SIDE OF THE REEL, ROUND ONE, REFRESHED (2026-09-24).
 *
 * The reel makes itself from the second reel-eligible item: no Studio, no
 * publish, no file. What is left for a host is a handful of small acts spread
 * over the surfaces they already visit, and this board places each one, plus
 * the door the others hang off: what the Reel card opens once the stored reel's
 * room is gone.
 *
 * ★ WHAT EVERY DRAWING STANDS ON, AND WHY IT IS GROUND RATHER THAN A FENCE. A
 * host-side question is judged on the reel that will ship, so the reel's other
 * answers are drawn as its surfaces will be: the view's slim glass bar that
 * becomes the dock (one row of icons, Make your own beneath), the top-left
 * arrival chip, a 3 s hold the viewer can change, the white code plate bottom
 * right, full bleed; the Reel card as the labelled card over a calm living
 * thumbnail; a minimum of two, below which guests see nothing. An option may
 * still move any of them where its own question is about it.
 *
 * ★ REPEATS MERGE, AND NO OPTION IS LOST TO THE MERGE. `open` holds this
 * board's screen door and reel-screen's way in; `review` holds this board's
 * waiting queue with reel-screen's and host-curation's count. Two of those
 * options drew the same picture (the counts as wired, and nothing at all), so
 * they are one option here, which is a finding rather than a road closed.
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
      "Refreshed: a new ask for what the Reel card opens; the way to the reel gains a reel the host sees from the first photo; the dashboard gains its What needs you step and a quiet option; the screen link becomes a link to send; the hub draws its real album.",
  },
  context:
    "The reel makes itself from the second photo, so a host is left a few small acts spread over the hub, its sheets and the dashboard. Eight decisions on those real surfaces over Mia and Theo's wedding, each drawn on the reel that will ship: the view's glass bar and dock, the living Reel card, the code in its corner, a minimum of two.",
  carried: [
    {
      id: "home-drawn",
      question:
        "Which door to the reel do the screen, defaults and switch asks draw behind?",
      taken:
        "The Reel card opening the view, the reel's current plan. A room or a sheet from the home ask would gather those three controls.",
      overrule:
        "Each of the three still says what a host gets beyond that home: a hub door, a Settings row, a switch on the page.",
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
        "The reel starts at the second photo and guests see nothing before it, so a host who opens an event with one photograph can fairly ask where the reel is. Each option is drawn at none, one and two photos on the knob.",
      options: [
        {
          id: "card",
          label: "The Reel card counts to two",
          means:
            'The Reel card shows its one photo behind "1 more photo" and two pips, then wears the living crossfade at two. No new block.',
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
            'The album keeps a dashed tile at its head, "One more starts your highlight reel", gone when the second photo lands.',
        },
        {
          id: "step",
          label: "A step in what is left",
          means:
            'The launch list gains "Start your highlight reel", and that one row stays above the album until the second photo lands.',
        },
        {
          id: "preview",
          label: "The host's reel plays from the first photo",
          means:
            'At one photo the Reel card already lives and opens the reel for the host alone, reading "Guests see it at 2". It plays, so nothing needs explaining.',
        },
      ],
      recommended: "card",
      because:
        'The Reel card is where a host goes looking for the reel, so the answer to "where is it" belongs on it, and it grows into the living card at two with no block that has to come and go.',
      overrule:
        "If a host reads the album before the cards row, the band says it where the eye already is and makes the unlock a moment.",
      lands:
        "How the host app shows a feature that switches itself on, before it does, and the Reel card's face below the minimum.",
      configs: [VIEWPORT, ITEMS],
    },
    {
      id: "home",
      label: "What the Reel card opens",
      question:
        "What should the Reel card open for the host, now that the reel makes itself?",
      context:
        "The hub's Reel card opens the stored reel's room today, and that room leaves with the stored reel. The reel's plan opens the same full-screen view guests watch; a room or a sheet would give the host's reel controls one home.",
      options: [
        {
          id: "view",
          label: "The view, full screen",
          means:
            "The card opens the view guests watch, full bleed; the host's few extras ride its dock (on a laptop, Play on a screen), one press from the reel.",
        },
        {
          id: "room",
          label: "A Reel room, like Review and Guests",
          means:
            "A page with a crumb: the reel playing large, with Watch, Play on a screen, the mood and hold every guest starts on, and Show the reel.",
        },
        {
          id: "sheet",
          label: "A Reel sheet, like Settings and Share",
          means:
            "A sheet over the album: the reel playing in its head, Watch and Play on a screen under it, then the defaults and the switch.",
        },
      ],
      recommended: "view",
      because:
        "The reel is a thing to watch, not to manage: the card opening the view the guests see is the one place a host can judge it, and the few controls a host needs ride its dock with no second place to learn.",
      overrule:
        "If the reel's host settings should sit together where they can be read at a glance, a Reel sheet gathers them without leaving the album.",
      lands:
        "The Reel card's destination, and whether the host's reel controls gather in one place or ride the view.",
      configs: [VIEWPORT],
    },
    {
      id: "open",
      label: "Onto a big screen",
      question: "How should a host put the reel on a big screen?",
      context:
        "The screen is the view in another posture: the code on, and a press to fill the screen. A venue laptop reaches it like any guest, through the event's link and the welcome, so this asks where the host's door sits.",
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
            '"Play on a screen" beside Review, Reel, Guests and Settings opens the view in a new tab, in its screen posture.',
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
          id: "send",
          label: "The hub door, plus a link to send",
          means:
            "The door, and a copyable link that opens the reel on a screen: the event's own, so a venue laptop meets the welcome like any guest.",
        },
      ],
      recommended: "view",
      because:
        "A venue laptop reaches the reel through the event's link like any guest, so a door inside the view is the one every screen can reach, and on the host's own laptop it is one press from the reel.",
      overrule:
        "If hosts should find the screen while planning the night, before ever opening the reel, the hub door announces it.",
      lands:
        "Where the screen lives in the product, and whether a link made for the screen earns its own row.",
      configs: [VIEWPORT],
    },
    {
      id: "review",
      label: "Waiting uploads",
      question:
        "What should tell a host that uploads are waiting, and so are not in the reel yet?",
      context:
        "The reel plays approved items only, so a moderated queue never reaches it. Each option is drawn on the host's phone and on the screen, since some speak to the host and some to the room.",
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
            'Review gains one line: "Approved photos join the highlight reel right away." Nothing on the reel or the screen.',
        },
        {
          id: "feed",
          label: "The host's arrival feed says it",
          means:
            'In the host\'s own view the top-left feed carries "3 waiting to review" under the arrivals, opening Review. A screen never shows it.',
        },
        {
          id: "chip",
          label: "A host's chip on the screen",
          means:
            'A small chip on the screen, "3 waiting, on your phone". Meant for one person, read by the whole room.',
        },
        {
          id: "room",
          label: "A line the room reads",
          means:
            '"New photos appear once Mia approves them", across the top of the screen, so a guest knows why theirs is not up yet.',
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
        "Style and Hold already sit in the view's dock for every viewer, each a device's own choice. The event still starts everyone somewhere: a mood (Cinematic unless set) and a 3 second hold.",
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
          label: 'Settings, and "for everyone" in the view',
          means:
            'The Settings card holds the defaults, and the host\'s popover in the view offers "Set for everyone" beside the pick.',
        },
      ],
      recommended: "both",
      because:
        'A default is set best while it plays and should never change by accident: a host slowing the hold for a wall would otherwise slow every phone. An explicit "Set for everyone" in the view and a card that shows what is set cover both.',
      overrule:
        "If a second home for Style is one too many, the host's own moves in the view set it, and the popover says so.",
      lands:
        "Whether an event's default look is set while watching or in Settings, and whether a host's own moves ever change a guest's view.",
      configs: [VIEWPORT],
    },
    {
      id: "switch",
      label: "Show the reel",
      question: 'Where should the host\'s "Show the reel" switch sit?',
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
      label: "The dashboard's word",
      question: "What should the dashboard say about each event's reel?",
      context:
        'Each event\'s card says what it is, and the What needs you band above says what it wants; its reel step still offers the stored reel ("has no reel yet"), so every option says what becomes of it. Drawn over a live event and one a photo short.',
      options: [
        {
          id: "counts",
          label: "A line that counts to two",
          means:
            'Under two items a card says "1 more photo starts the highlight reel"; from two, "Highlight reel live". The band\'s reel step retires.',
        },
        {
          id: "threshold",
          label: "Nothing until two, then the line",
          means:
            'Under two a card says nothing extra; the moment the second lands, "Highlight reel live" appears under it. The band\'s step retires.',
        },
        {
          id: "cover",
          label: "The card's cover crossfades",
          means:
            "No line, no words: a live event's cover slowly crossfades through the reel's stills at the tile's calm pace. The band's step retires.",
        },
        {
          id: "band",
          label: "A step in What needs you, below two",
          means:
            "The band's reel step tells the truth: \"1 more photo starts the reel on Ruby's 30th\". It leaves at two, and no card says more.",
        },
        {
          id: "quiet",
          label: "Nothing: the reel needs nothing",
          means:
            "The band's reel step retires and no card mentions the reel: a feature that runs itself never asks for a host's attention.",
        },
      ],
      recommended: "band",
      because:
        "The band already carries a reel step, and it goes stale the day the stored reel does. The true step there, and nothing once the reel runs, keeps the dashboard about what needs the host and adds no new part.",
      overrule:
        "If a live reel should show itself where a host looks every morning, the card's cover crossfades through it at the tile's calm pace.",
      lands:
        "What the dashboard says about a reel before and after it starts, and what becomes of the band's reel step.",
      configs: [VIEWPORT],
    },
    {
      id: "cut",
      label: "A host's own cut, added",
      question:
        "What should happen when a host adds their own cut to the album?",
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
