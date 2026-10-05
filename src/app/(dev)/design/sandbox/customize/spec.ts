import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * CUSTOMIZE, ROUND ONE: A PARTY HER WAY (the customize-r1 track, cut
 * 2026-10-04 from Will's ask: "24 seems like an arbitrary shot in the dark on
 * our side ... I always hate when I'm using an app and think 'why can't I do
 * it this way'", and his Linear note: rocket ship control that still makes
 * sense to a brand new user).
 *
 * ★ FOUR DECISIONS, THE ROLL FIRST. `roll` is his ask itself: how a host picks
 * the shots each guest gets, in Settings and in Create, and how a guest's
 * camera reads a roll of 12 or of 36. `home` and `mine` are the pattern every
 * later choice follows: where a finer choice lives, and how one becomes her
 * usual for every party after. `order` is the audit's first case with its own
 * answer to give (the album read the morning after runs the night backwards).
 * The audit's other top cases (what guests take home) are drawn inside the
 * pattern's frames, so he judges the pattern on real choices.
 *
 * ★ THE NOTES BEHIND IT live in the lane's scratch, never here: Linear's
 * lessons as principles (`_scratch/customize/linear.md`) and every assumption
 * classified and ranked (`_scratch/customize/audit.md`). The board quotes
 * neither.
 *
 * ★ PRODUCTION DRAWS EVERY FRAME. Settings is production's (the provider, the
 * album styles, the furniture, the live words), its writes inert; Create is
 * production's room; the camera is production's parts round a still; the
 * guest's album is production's cover and rows. An option adds only its own
 * piece: a control production does not have yet.
 *
 * Nothing here asks what a standing board asks: the add step's look is
 * create-wizard's (this draws only what stands under the Disposable pick),
 * the hub's head and cover are event-header's and the-wait's, the dashboard's
 * display is host-dashboard's, and a shot removal's confirm is the calls
 * lab's UI board's.
 */
export const CUSTOMIZE = defineExploration({
  id: "customize",
  title: "Customize: a party her way",
  surface: "host",
  desk: 15,
  // The system docs and the production paths the board redraws: a wiring
  // lane's owns start here, and a merge that touches one flags the open asks.
  lives: [
    "docs/systems/disposable-mode.md",
    "docs/systems/host-app.md",
    "src/components/app/event-settings/",
    "src/components/app/create-event-wizard/",
    "src/lib/disposable/roll.ts",
    "src/lib/events/album-wire.ts",
  ],
  tracks: ["customize-r1"],
  round: {
    n: 1,
    date: "2026-10-04",
    changed:
      "From your ask: hosts shape their party their way. The roll's size first, then where finer choices live, how one becomes her usual, and the album's order as the first case.",
  },
  opening: {
    about:
      "Your ask: hosts shape their party their way. The roll's size first, then where finer choices live, how one becomes her usual, and a first case.",
    settled: [
      "Re-shoots stay a flat 3 at any roll size, your word, and the develop time stays its own choice.",
      "Every choice starts at an answer we stand behind, so a party nobody shapes is still finished.",
      "The three album styles stay three; every new choice lives inside one of them, never beside them.",
      "A bigger roll costs nothing past the plan's storage and monthly uploads, which already bound every album.",
    ],
    earlier: [
      "'24 seems like an arbitrary shot in the dark on our side.'",
      "'I always hate when I'm using an app and think: why can't I do it this way, their way is brutal.'",
      "'Picking up rocket ship control potential, but it all makes sense for a brand new user somehow.'",
    ],
  },
  terms: [
    {
      term: "roll",
      means:
        "Each guest's shots on the album's camera: 24 unless the host picks another size.",
    },
    {
      term: "re-shoots",
      means:
        "The 3 shots past the roll that removing shots can free, at any roll size.",
    },
    {
      term: "develop",
      means:
        "When a Disposable's photos open to everyone at once: 9 am the morning after, unless she moves it.",
    },
    {
      term: "live word",
      means:
        "A word in a Settings sentence that is its own control: press it to change it in place.",
    },
    {
      term: "usual",
      means:
        "A choice a host made her own: every party she creates after it starts with it.",
    },
  ],
  carried: [
    {
      id: "bounds",
      question: "What sizes may a roll be, and what is it unless she says?",
      taken:
        "1 to 99, two digits on the camera's count; 24 unless she picks, the middle of film's three. Yours to answer in the manifest.",
      overrule: "24 stays the most, and a host picks only fewer.",
    },
    {
      id: "create",
      question: "Does Create ask the roll's size?",
      taken:
        "Never as a question: it stands under the Disposable pick at her usual, a press to change, the way the develop time does.",
      overrule: "Create leaves the roll to Settings.",
    },
    {
      id: "take-home",
      question: "What may a host choose about what guests take home?",
      taken:
        "Everything (today's, the default), their own photos, or just to look; the line says a screenshot is still a screenshot.",
      overrule: "One switch: everything, or nothing.",
    },
    {
      id: "taken",
      question: "What does the night in order go by?",
      taken:
        "Each photo's own time taken, kept from now on when its location is stripped; one with no time (a screenshot) by when it arrived.",
      overrule: "When each arrived, the only time the album keeps today.",
    },
    {
      id: "which",
      question: "Which choices can become her usual?",
      taken:
        "The style, the roll, the develop's hour, the album's order and take-home; never a password, a link, a date or the note.",
      overrule: "Every choice on every page.",
    },
  ],
  asks: [
    /* ── 1. The roll's size, his ask ─────────────────────────────────────── */
    {
      id: "roll",
      label: "The roll's size",
      question:
        "How should a host choose how many shots each guest's roll holds?",
      where: ["Host", "Settings and Create", "A Disposable's roll"],
      when: "Maya makes her wedding Disposable, in Create or later in Settings; at the party each guest opens the album's camera.",
      matters:
        "24 was our guess: a dinner for eight wants more shots each, a wedding of 150 fewer, and only she knows which.",
      lands:
        "The roll's control in Create and Settings, its sizes and bounds, and what a guest's camera says at any size.",
      context:
        "Settings for the wedding of 150 (12 picked), Create for Dinner at Maya's, eight guests (more picked), then a guest's camera on a roll of 12 and of 36.",
      options: [
        {
          id: "film",
          label: "Film's three: 12, 24 or 36",
          means:
            "Film's three sizes as boxes beside the develop time, each with a strip as long as its roll; nothing else to set.",
          gains:
            "A glance and a press, on a scale anyone who has bought film knows.",
          costs: "No 8 for a tiny dinner, no 50 for a weekend away.",
        },
        {
          id: "count",
          label: "Any count, 1 to 99",
          means:
            "A stepper beside the develop time, from 1 to 99, opening on 24 for a new party.",
          gains: "Exactly the roll she wants, with nothing to round.",
          costs: "A bare number, with nothing to say what most parties pick.",
        },
        {
          id: "both",
          label: "Film's three, or any count",
          means:
            "12, 24 and 36 as film boxes, and Other beside them, which opens a stepper from 1 to 99 under them.",
          gains:
            "A glance for most hosts, and any count one press further for the rest.",
          costs: "Two ways to say one number.",
        },
        {
          id: "wind",
          label: "A frame counter to wind",
          means:
            "A strip of numbers she winds like a camera's frame counter, 1 to 99, with 12, 24 and 36 marked as film's.",
          gains:
            "Tactile and playful, with film's sizes as landmarks on the way.",
          costs: "Harder to land on an exact number, at a phone above all.",
        },
      ],
      recommended: "both",
      because:
        "Most hosts pick a film size at a glance; the rare 8 or 50 is one press further, so nobody meets a wall and nobody has to type a number.",
      overrule:
        "If no host needs fewer than 12 or more than 36, film's three alone.",
      configs: [SCREEN],
    },

    /* ── 2. Where a finer choice lives ───────────────────────────────────── */
    {
      id: "home",
      label: "Where choices live",
      question:
        "Where should a party's finer choices live, so a newcomer sees a finished party and a host who wants more finds each one?",
      where: ["Host", "Her event's Settings", "Shaping the party"],
      when: "After Create, Maya wants a roll of 12, the album told in order once it is over, and guests keeping only their own photos.",
      matters:
        "Every choice we add lands somewhere: in the wrong home it is buried, or it crowds every host who never needs it.",
      lands:
        "Where every choice past Create lives: a live word in Settings, a row on its page, the album itself, or More.",
      context:
        "The audit's top choices in each home (the roll, the album's order, what guests take home): where Maya makes each one, and what Settings says once she has.",
      options: [
        {
          id: "words",
          label: "Live words in Settings' sentences",
          means:
            "Settings' first screen says each choice in its sentence, every live word a choice made in place, its page holding the same choice whole.",
          gains:
            "The whole party read in five sentences, every choice one press away.",
          costs: "Longer sentences, and a word is a quieter control than a row.",
        },
        {
          id: "rows",
          label: "A row each, on its page",
          means:
            "The first screen stays as it is; each choice is a row on its page: What guests can add, and a new page, The album.",
          gains: "One familiar place for each, the way every settings page works.",
          costs: "Found only by opening the page it is on.",
        },
        {
          id: "album",
          label: "On the album, where it shows",
          means:
            "Her hub's album says how guests see it in one quiet line over its photos (its order, what they take home), each a live word.",
          gains: "Found at the moment she wonders, with its effect in sight.",
          costs: "No one place lists everything she changed.",
        },
        {
          id: "more",
          label: "Settings as today, More for the rest",
          means:
            "Every page keeps today's rows; More for this party at its foot opens the new choices in place.",
          gains: "Nothing new in a newcomer's path, ever.",
          costs: "The deepest choices are the hardest to find.",
        },
      ],
      recommended: "words",
      because:
        "Settings already tells the party in sentences of live words; new choices join them, so a newcomer reads a finished party and every choice is a word away.",
      overrule:
        "If she should meet the album's choices on the album itself, On the album.",
      configs: [SCREEN],
    },

    /* ── 3. Making a choice her usual ────────────────────────────────────── */
    {
      id: "mine",
      label: "Her own usual",
      question:
        "How should a host make a choice her own, so every party she creates after this one starts with it?",
      where: ["Host", "Settings, then Create", "Her next party"],
      when: "Maya set her wedding's roll to 12 and its develop to noon; next month she creates Maya's 30th, Disposable again.",
      matters:
        "A host of ten parties sets the same choices ten times, or never learns a party could start her way.",
      lands:
        "How a choice becomes her usual, where it is kept (her account), and how Create opens with it.",
      context:
        "Each option where Maya makes the roll and the develop her usual, then Create for her 30th, Disposable picked, opening at her usual or at ours.",
      options: [
        {
          id: "offer",
          label: "Offered where she changes it",
          means:
            "Once she changes a choice, a quiet line under it says what new parties start with and offers this one; Account lists her usual.",
          gains: "Met at the one moment it matters, never before it.",
          costs: "Her usual grows one choice at a time.",
        },
        {
          id: "account",
          label: "Her usual, set in Account",
          means:
            "Account holds Your new parties: the style, the roll, the develop's hour and take-home, each set on purpose.",
          gains: "Her whole usual in one place, read at a glance.",
          costs: "A page she has to find, and fill before it helps.",
        },
        {
          id: "copy",
          label: "Start like a past party",
          means:
            "Create asks whether to start fresh or like Maya & Jay's Wedding, and copies its choices, never its name or photos.",
          gains: "Nothing new to learn: her last party is the template.",
          costs: "Copies every choice, a password too, wanted or not.",
        },
        {
          id: "remember",
          label: "Her last party, remembered",
          means:
            "Every new party starts as her last one did, said in Create with Start fresh beside it.",
          gains: "No effort at all: a repeat host's usual makes itself.",
          costs: "One odd party quietly becomes the next one's start.",
        },
      ],
      recommended: "offer",
      because:
        "It asks nothing of a newcomer and meets a repeat host the moment she changes something; her usual then stands in one list to read or undo.",
      overrule: "If hosts mostly repeat whole parties, Start like a past party.",
      configs: [SCREEN],
    },

    /* ── 4. The first case: the album's order ────────────────────────────── */
    {
      id: "order",
      label: "The album's order",
      question:
        "Which way should the album run for guests, while the party is on and once it is over?",
      where: ["Guest", "The album", "The party, then the morning"],
      when: "Priya opens the wedding's Live album at the party, then again the morning after, once it has stopped growing.",
      matters:
        "Newest first suits a party in progress; read the morning after, the album tells the night backwards, last dance first.",
      lands:
        "The order every guest's album opens in, whether it turns once the party is over, and so the order a develop lands in.",
      context:
        "Priya's album at the party, then the morning after, in each option's order: the first rows say which way the night runs (the dance floor first, or the arch).",
      options: [
        {
          id: "newest",
          label: "Newest first, as today",
          means:
            "Always the latest photo first, at the party and on every visit after it.",
          gains: "The party's newest moment always on top.",
          costs: "After the party, the night reads backwards.",
        },
        {
          id: "night",
          label: "The night in order",
          means:
            "First photo first, always: the album reads the way the night happened.",
          gains: "A story from the arch to the last dance.",
          costs: "At the party, what just landed sits at the very end.",
        },
        {
          id: "turns",
          label: "Newest while it's on, then in order",
          means:
            "Newest first while the party is on; from the morning after its last day, or its develop, the night in order.",
          gains: "Each moment gets the order it needs, with nothing to set.",
          costs: "An undated album that never closes stays newest first.",
        },
      ],
      recommended: "turns",
      today: "newest",
      because:
        "The party wants what just landed and the morning after wants the story; turning at the party's own end gives each its order with nothing to set.",
      overrule: "If guests mostly come back during the party, newest first stays.",
      configs: [SCREEN],
    },
  ],
});
