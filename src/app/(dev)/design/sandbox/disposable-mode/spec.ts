import { defineExploration } from "@/components/lab/exploration";

import { SCREEN, STOCK } from "./knobs";

/**
 * A DISPOSABLE CAMERA INSIDE PARTYREEL, ROUND THREE (his round two answers,
 * 2026-10-02).
 *
 * Settled and drawn as given, never asked again: the reveal is a host
 * setting (9 am the next day by default, with Develop now); the reel
 * premieres the roll at develop time and the room's screen plays his live
 * slideshow until then (`wall=slideshow`); 24 shots each, the server's count,
 * at full size; the host's album waits under a cover (`peek=covered`, polished
 * in its wiring, not re-asked); Create's step is the two cards
 * (`create=cards`, redrawn on the create-wizard board).
 *
 * ★ HIS NOTES ARE THIS ROUND'S DIRECTION. The camera: "carry over the album's
 * own camera and the camera that shoots on a reel ... branch 2 new design
 * ideas from each", loving the first's minimalism ("subtle design touches
 * like the tick count around the shot button") and the reel's tie to the
 * product, wary of the reel's "more vintage feel within our far more modern
 * app design". The waiting room: "another round of these to get the best
 * option", and "for grids, I'd prefer not to get messy and begin tilting
 * anything". The look: "I'm not sure I want to include - feels like filters
 * are going to make the majority of guest photos worse".
 *
 * ★ FIVE DECISIONS, IN THE ORDER A NIGHT RUNS: the camera (the two he kept,
 * as drawn, and two modern branches of each), how it takes a video and what
 * a video costs (both drawn in the camera picked, staged behind it), the
 * waiting room, and whether the developed roll wears a look at all, judged
 * on twelve real party photographs in twelve lights with "no look" its own
 * option. What Save does with a look is now a carried call: it only matters
 * if a look stays.
 *
 * Nothing here asks what another standing board asks: the door before
 * joining is `locked-door`'s (this waiting room is inside the album, after
 * it), and the album's head is `event-header`'s.
 */
export const DISPOSABLE_MODE = defineExploration({
  id: "disposable-mode",
  title: "A disposable camera",
  surface: "guest",
  desk: 80,
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/uploads-and-r2.md",
    "docs/systems/billing-caps.md",
    "docs/systems/reel.md",
    "src/components/guest/event-experience.tsx",
    "src/components/guest/gallery-rows.tsx",
    "src/components/guest/upload/intent-sheet.tsx",
    "src/components/guest/reel/live-reel-view.tsx",
    "src/components/shared/media-lightbox-parts/actions.tsx",
    "src/lib/guest/use-upload-queue.ts",
    "src/lib/constants/tiers.ts",
  ],
  round: {
    n: 3,
    date: "2026-10-02",
    changed:
      "From your round two notes: the two cameras you kept and two modern branches of each, a new round of waiting rooms with nothing tilted, and the look judged on twelve real lights beside no look at all. Video and its cost wait on the camera.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-29",
      changed:
        "From your notes: the camera (your two pushed, two new), the waiting room, the room's screen until 9 am, whether the host peeks, Create's step, how a video is taken and what it costs, and whether a saved photo wears the look.",
    },
    {
      n: 1,
      date: "2026-09-28",
      changed:
        "Six decisions over Maya and Jay's wedding. You kept the album's camera and the drawn one, took three looks you can switch, a develop time as a host setting, the count as a waiting room's seed, a step of its own and full size.",
    },
  ],
  context:
    "Round three over Maya and Jay's wedding: 10:40 pm, 142 shots from 12 guests with Priya six into her 24, then the morning after. Every camera's live picture is a party photograph standing in for the phone's stream, drawn as the phone sees it. The look is judged on twelve real party photographs, each in its own light; the dock's Try your photos swaps in any of yours, on your device, and sends nothing anywhere.",
  opening: {
    about:
      "A disposable-camera mode for an event: each guest shoots a limited roll, nobody sees it until it develops, and the reel premieres it.",
    settled: [
      "The reveal is the host's setting: straight away, or a develop time guests can see (9 am the next day by default), with Develop now.",
      "At develop time the reel premieres the roll on every phone; until then the room's screen plays your live slideshow.",
      "24 shots each, counted by the server, at full size; a deleted shot never gives its frame back, and a video runs up to 10 seconds.",
      "The host's album waits under a cover she can lift (polished in its wiring), and Create's two cards are redrawn on the create board.",
    ],
    earlier: [
      "The camera: 'I love the more minimalist camera design of the first ... subtle design touches like the tick count around the shot button are a nice touch.'",
      "'The reel idea really ties into the product ... my main pushback on this one may be the reel having a more vintage feel within our far more modern app.'",
      "The waiting room: 'another round of these to get the best option', and 'for grids, I'd prefer not to get messy and begin tilting anything.'",
      "The look: 'I'm not sure I want to include - feels like filters are going to make the majority of guest photos worse that don't match the palette well.'",
    ],
  },
  terms: [
    {
      term: "roll",
      means:
        "The shots a guest takes in disposable mode, 24 each, hidden from everyone until they develop.",
    },
    {
      term: "develop time",
      means:
        "When the roll is revealed to everyone: 9 am the next day by default, set by the host.",
    },
    {
      term: "ticks",
      means:
        "The 24 short marks round the shutter, one a shot, each going dark as it is spent.",
    },
    {
      term: "sealed",
      means:
        "A frame already shot: dark, its minute on it, until the roll develops.",
    },
    {
      term: "waiting room",
      means: "What a guest meets in the album before the roll develops.",
    },
    {
      term: "contact sheet",
      means:
        "A photographer's sheet of every frame on a roll, small and side by side.",
    },
    {
      term: "the look",
      means:
        "A treatment drawn over every developed photo on screen, never saved into the original.",
    },
    {
      term: "grain",
      means: "The fine speckle film leaves over a photograph.",
    },
  ],
  carried: [
    {
      id: "live",
      question: "Does the camera's live picture wear the roll's look?",
      taken:
        "No: the camera shows the phone's own picture, and a look arrives with the reveal, the way film's look arrives when it is developed.",
      overrule:
        "The live picture wears it, so she frames each shot in the look she will get.",
    },
    {
      id: "save",
      question: "If the roll wears a look, what does Save hand a guest?",
      taken:
        "What she saw: Save draws the look into her copy on her phone, and Download all hands over the originals (round two's recommendation).",
      overrule:
        "Always the untouched original, or a choice of the two at every Save.",
    },
    {
      id: "end",
      question: "What does the camera do once her 24 are spent?",
      taken:
        "Says the roll is done and when it comes back, with her shots one tap away and the album behind it; the shutter goes.",
      overrule:
        "It stays open on a quiet shutter that says the roll is done when pressed.",
    },
  ],
  asks: [
    /* ── 1. The camera ───────────────────────────────────────────────────── */
    {
      id: "camera",
      label: "The camera",
      question:
        "Which camera should a guest shoot with at a disposable-camera event?",
      where: ["Guest", "The disposable camera", "Mid-party, 10:40 pm"],
      when: "The event is in disposable mode: Priya has shot 6 of her 24, and nobody sees a shot until it develops at 9 am.",
      matters:
        "It is the feature's face: what guests hold all night, and what makes the mode worth showing off.",
      context:
        "Your two from round two, as drawn, and two modern branches of each: framing her seventh, the moment after (it replays, motion allowed), and her roll done at 24. The live picture is the phone's own; the look is its own question.",
      options: [
        {
          id: "viewfinder",
          label: "The album's own camera, as drawn",
          means:
            "Round two's: the whole live picture, the shutter the one act, and 24 ticks round it going dark a shot at a time, the count beside it.",
          gains:
            "The plainest and clearest: everything is understood at a glance.",
          costs:
            "Looks like any phone's camera, so the mode feels less its own.",
        },
        {
          id: "shutter",
          label: "The count inside the shutter",
          means:
            "The viewfinder pushed: the picture fills the screen under glass controls, and the count sits inside the shutter, in its ring of ticks.",
          gains:
            "The fewest objects: the one thing she presses also says how many are left.",
          costs:
            "A numeral on the shutter is new: she may hesitate the first time she presses it.",
        },
        {
          id: "rim",
          label: "The roll round the picture",
          means:
            "The viewfinder's ticks leave the shutter and frame the live picture: 24 segments round its edge, each going dark as a shot spends it.",
          gains:
            "The roll frames every shot, and a video's ten seconds trace the edge in red.",
          costs:
            "A framed picture is smaller than a full screen, and the rim takes a beat to read.",
        },
        {
          id: "reel",
          label: "The camera on a reel, as drawn",
          means:
            "Round two's: the whole live picture over a strip of film, sprockets and edge print, winding on a frame with every shot.",
          gains: "The most playful: the roll runs out before her eyes.",
          costs: "The film stock reads vintage beside the rest of the app.",
        },
        {
          id: "timeline",
          label: "The reel as a timeline",
          means:
            "The reel without its film: 24 rounded frames under the picture, the one she is on holding the live picture, gliding on a frame a shot.",
          gains:
            "The reel's fun in the app's own look: she watches each shot go onto the reel.",
          costs:
            "A strip under the picture leaves it a little smaller than the plain camera's.",
        },
        {
          id: "scroll",
          label: "The screen scrolls like a reel",
          means:
            "Her roll as a column of frames: the live one in the middle, the last sealed above, the next under her thumb; each shot scrolls the reel on.",
          gains:
            "The boldest: taking a photo moves her on through the roll, the way a reel scrolls.",
          costs:
            "The live picture is a card rather than the whole screen: the least like a camera.",
        },
      ],
      recommended: "timeline",
      because:
        "It keeps the plain camera you loved and the reel's moving roll, in the app's own look: each shot visibly goes onto the reel, and nothing reads vintage.",
      overrule:
        "If the plainest camera should win outright, the count inside the shutter.",
      lands:
        "The guest page's own live camera, how it counts the roll, and how it ends once her 24 are spent.",
      tile: "phone",
    },

    /* ── 2. Taking a video ───────────────────────────────────────────────── */
    {
      id: "video",
      label: "Taking a video",
      question: "On Event Pass and Pro, how should the camera take a video?",
      where: ["Guest", "The disposable camera", "On a paid event"],
      when: "The event is on Event Pass or Pro with Videos on, so the camera can film; Priya wants a few seconds of the toast.",
      matters:
        "Filming has to be easy to find in the dark without making a photo any harder to take.",
      context:
        "Video is paid and the host can switch it off, so Free or Videos off means photos only; the word is video, never clip (the reel's). Drawn in the camera you pick above: framing on a paid event, then four seconds into a video.",
      options: [
        {
          id: "hold",
          label: "Hold the shutter to film",
          means:
            "A press takes a photo; holding films, filling up to 10 seconds, and letting go stops it. One button and no mode.",
          gains:
            "One button and no modes, the hold-to-film habit social apps taught.",
          costs: "A press held too long by accident films instead of shooting.",
        },
        {
          id: "switch",
          label: "A Photo and Video switch",
          means:
            "A small switch over the shutter, as the phone's own camera has; in Video the shutter turns red and a press starts and stops it.",
          gains: "Never ambiguous: in Video the shutter turns red.",
          costs:
            "One more control in the dark, and a photo lost to a forgotten switch.",
        },
        {
          id: "button",
          label: "A video button of its own",
          means:
            "A second, smaller button beside the shutter films up to 10 seconds; the shutter itself only ever takes a photo.",
          gains:
            "The shutter only ever takes a photo; filming has its own button.",
          costs:
            "Two buttons on a camera meant to have one, the second small to find.",
        },
      ],
      recommended: "hold",
      because:
        "It keeps the camera's one button and the hold-to-film habit every social camera taught; a switch is one more thing to miss in the dark.",
      overrule: "If a held press should never surprise anyone, the switch.",
      lands:
        "How the page's camera records (its microphone ask with it) and what its shutter does on a paid event.",
      after: { ask: "camera" },
      tile: "phone",
    },

    /* ── 3. What a video costs ───────────────────────────────────────────── */
    {
      id: "cost",
      label: "What a video costs",
      question: "How should a video count against a guest's 24 shots?",
      where: ["Guest", "The disposable camera", "Just after a video"],
      when: "On a paid event Priya has just filmed a six-second video, and her camera's count shows what it spent.",
      matters:
        "It decides whether a video feels like any other shot or a treat that eats the roll.",
      context:
        "A 10-second video takes about three photos' storage at 1080p (the pricing page's figures), and a paid event's storage starts at 75 GB. Drawn in your camera and way to film: just after a six-second video, then her shots in the waiting room.",
      options: [
        {
          id: "one",
          label: "A video is one shot",
          means:
            "24 shots is 24 photos or videos in any mix, and the count goes down by one either way.",
          gains: "The simplest count: 24 shots, photos or videos in any mix.",
          costs:
            "A roll of videos takes about three times a roll of photos' storage.",
        },
        {
          id: "three",
          label: "A video is three shots",
          means:
            "What it weighs: a video spends three of her 24, and the camera says so before she films.",
          gains:
            "Honest to storage: a video costs what it weighs, and says so first.",
          costs:
            "Arithmetic on a party camera, and a few videos use up most of her roll.",
        },
        {
          id: "own",
          label: "Videos count on their own",
          means:
            "24 photos and 3 videos each, two counts on the camera; neither spends the other.",
          gains: "Photos and videos never compete: 24 photos plus 3 videos.",
          costs:
            "Two counts on the camera, and only three videos for the night.",
        },
      ],
      recommended: "one",
      because:
        "A paid plan's storage starts at 75 GB, so pricing a video in photos adds arithmetic and nothing else: a shot is a shot.",
      overrule:
        "If a roll of videos should cost what it weighs, three shots a video.",
      lands:
        "What the server's count counts on a paid event, and what the camera's count says after a video.",
      after: { ask: "video" },
      tile: "phone",
    },

    /* ── 4. The waiting room ─────────────────────────────────────────────── */
    {
      id: "waiting",
      label: "The waiting room",
      question:
        "What should a guest meet in the album while the roll develops?",
      where: ["Guest", "The album", "Before it develops"],
      when: "Any visit to the album before develop time: she is past the door, and the roll is still hidden.",
      matters:
        "Guests come back here all night; it decides whether the wait feels exciting or like an empty album.",
      context:
        "A new round, full screen, nothing tilted. The count moves live on the album's own sync; her shots are hers alone to see and delete. Drawn at 10:40 pm as a shot lands (motion allowed), her shots opened, a delete; 1440 on the knob.",
      options: [
        {
          id: "sheet",
          label: "The party's contact sheet",
          means:
            "Every shot of the night as a square on one contact sheet, filling live: everyone's dark until 9 am, hers lit with her own photographs.",
          gains:
            "The whole night at a glance, and hers easy to find among everyone's.",
          costs:
            "Many small squares on a phone, and the sheet grows all night.",
        },
        {
          id: "stack",
          label: "The stack, squared",
          means:
            "Your mystery stack, straight: the party's prints face down in one neat deck that thickens as shots land, hers marked by tabs on its edge.",
          gains:
            "Your stack idea made calm: one object in the middle, growing.",
          costs: "Her own shots are tabs in the deck, one step further away.",
        },
        {
          id: "glow",
          label: "The party's colours",
          means:
            "The room lit by the party's own colours, each shot adding its light to a slow glow; no picture shows, and her shots sit in a row below.",
          gains:
            "The most atmospheric: the party's light without a single photo of it.",
          costs:
            "Each shot's colours are read on the phone that took it: a small new field.",
        },
        {
          id: "dial",
          label: "The night on a dial",
          means:
            "The night as a clock face: every shot a mark at its minute round the dial, the busiest moments tallest, the hand sweeping on to 9 am.",
          gains:
            "The night's story in one figure: when it peaked, and how long until 9 am.",
          costs: "Abstract: a chart where the others give her objects to hold.",
        },
      ],
      recommended: "sheet",
      because:
        "Your count and your stack at once, laid flat: each shot lands as a square, hers glow among them, and at 9 am the same sheet develops.",
      overrule:
        "If one calm object should hold the middle, the stack, squared.",
      lands:
        "Whether the album before develop time is a room of its own, and what each new shot's arrival does to it.",
      configs: [SCREEN],
      tile: "phone",
    },

    /* ── 5. The look ─────────────────────────────────────────────────────── */
    {
      id: "look",
      label: "The roll's look",
      question:
        "Should the roll wear a look when it develops, and if so, which?",
      where: ["Guest", "The developed album", "9:02 am, the morning after"],
      when: "The roll developed at 9 am and Priya opens the album: every photograph wears the roll's look, or none.",
      matters:
        "Every photo of the night is seen through it: a look that flatters one light can spoil the next.",
      context:
        "Twelve real party photographs in twelve lights, from string lights to a club to an overcast sky: the album at 9:02 am, then two up close. The look is drawn over the original, never saved. Try your photos swaps in yours.",
      options: [
        {
          id: "none",
          label: "No look: as each phone took it",
          means:
            "The photographs exactly as taken: the disposable is the hidden roll and the reveal, never a filter over the night.",
          gains:
            "Every photo looks its best in its own light; nothing to choose or explain.",
          costs:
            "Nothing on a photo says disposable: the feature's character is the wait.",
        },
        {
          id: "grain",
          label: "Grain and the date, no colour",
          means:
            "Each photo keeps its own colour and light; the roll adds only a film's grain, a soft edge and the date a disposable prints in its corner.",
          gains:
            "The disposable's signature on every photo, and no light spoilt.",
          costs: "Grain on every photo, including the ones that wanted none.",
        },
        {
          id: "stocks",
          label: "Warm, Cool or B&W, the host's pick",
          means:
            "Round one's three colour looks, one picked by the host for the whole roll, with the grain and the date: Warm on the knob, then Cool and B&W.",
          gains:
            "The strongest character: a whole roll in one colour, like real film.",
          costs:
            "A cast suits some lights and muddies others, as your note feared.",
        },
      ],
      recommended: "grain",
      because:
        "It keeps what makes a disposable recognisable (the grain, the date) and leaves every photo its own colour, so no light is spoilt.",
      overrule:
        "If even grain should stay off the photos, no look: the wait is the disposable.",
      lands:
        "Whether the developed roll wears the look (the album, the viewer, the reel), and which; Save follows the carried call.",
      configs: [STOCK, SCREEN],
      tile: "phone",
    },
  ],
});
