import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE WAIT: ONE WAITING EXPERIENCE FOR EVERY ALBUM THAT HOLDS PHOTOS BACK
 * (Will's live walk, 2026-10-02).
 *
 * At a hold-for-approval album his upload "landed" and then "vanished back to
 * the empty state ... a new guest would likely think that's a bug". His read:
 * approval is "basically just disposables mode but more visible to the host at
 * upload time, less everything appears at once", and both "have that same feel
 * of here's only your photos, you'll see everyone else's on the develop date or
 * when host approves". He left the model open: "I don't want to suggest the
 * correct solution".
 *
 * ★ WHAT PRODUCTION DOES TODAY, MEASURED IN ITS CODE. Her photo never enters
 * the album: from the press it waits in her uploads' round (`stack-tile.tsx`'s
 * `held=uploads`; a sealed one "Waiting to develop"; crumbs-54 kept the one in
 * the air out of the album's head too, by the page's live reading of
 * `uploadsWait`), so the album she just added to reads as the empty state,
 * everyone's invisible, until something arrives. The sync already
 * carries what a wait needs (`waiting: {count, minutes, developsAt}`, never an
 * id), and her own ride `/api/guests/mine`; nothing of either is drawn yet.
 *
 * ★ SIX DECISIONS, THE MODEL FIRST. `model` is his to find: four syntheses
 * drawn end to end (Settings, her album held and developing, the trickle).
 * Everything after it waits on it (`after`) and is drawn wearing it: her wait
 * (the contact sheet the anchor), the arrival (the trickle and the premiere,
 * after the wait), the host's cover, the preset's name, and whether approval
 * and a develop may stand together.
 *
 * ★ EVERY GUEST FRAME IS PRODUCTION'S ALBUM: the real `AlbumCover`, Add, her
 * uploads' round and `GuestActionDock`, with only the wait drawn in; Settings'
 * as-built control is the real `CaptureAndReveal`. Nothing here asks what
 * another board asks: the camera is `disposable-camera`'s wiring, the hub's
 * head `event-header` r2's, taking photos home `take-home`'s.
 */
export const THE_WAIT = defineExploration({
  id: "the-wait",
  title: "The wait",
  surface: "shared",
  desk: 35,
  lives: [
    "src/components/guest/event-experience.tsx",
    "src/components/guest/live-gallery.tsx",
    "src/components/guest/gallery-empty-state.tsx",
    "src/components/guest/upload-tracker.tsx",
    "src/components/guest/upload/stack-tile.tsx",
    "src/lib/guest/upload-tracker.ts",
    "src/components/app/event-settings/camera-settings.tsx",
    "src/components/app/event-feed/event-gallery.tsx",
    "src/lib/disposable/",
    "docs/systems/disposable-mode.md",
    "docs/systems/guest-flow.md",
  ],
  round: {
    n: 1,
    date: "2026-10-02",
    changed:
      "A new board from your live walk, where an upload landed and then vanished back to an empty album: the model for every album that holds photos back, then her wait, the arrival, the host's cover and the words.",
  },
  context:
    "Maya & Jay's wedding, Saturday 10 October, on two albums that hold photos back: one held for Maya's approval (10:40 pm, 38 waiting, none let in yet) and one developing at 9 am on the album's camera (142 shots, Priya six into her 24). Every guest frame is production's album as it ships (the cover and its Add, Take photos on the camera's album, her uploads' round, the shutter) with only the wait drawn in; Maya's frames are her Settings and her hub. The Screen knob draws 1440. Each caption is read off its frame.",
  opening: {
    about:
      "One waiting experience for every album that holds photos back, for approval or until a develop time: the model first, then her wait, the arrival, the words.",
    settled: [
      "The schema serves any model here: how guests add and when everyone sees are two answers on the event, and a model is words and drawings over them.",
      "A guest sees her own waiting photos and takes any back; everyone else's reach her as a count and the minutes they landed in, never a picture.",
      "From disposable-mode: the camera's reel timeline, the room's screen plays the live slideshow, the reel premieres the roll, no look.",
      "The camera is disposable-camera's, the hub's head event-header's, taking photos home take-home's: nothing here asks theirs.",
    ],
    earlier: [
      "Your walk: the upload 'landed', then 'vanished back to the empty state ... a new guest would likely think that's a bug'.",
      "'Some cool way to represent that pending approval, but uploads are stacking idea. Otherwise it feels like there's zero momentum.'",
      "'Turning on moderation is basically just disposables mode but more visible to the host at upload time, less everything appears at once.'",
      "'They both have that same feel of here's only your photos, you'll see everyone else's on the develop date or when host approves.'",
      "The contact sheet (disposable-mode r3): 'revisit the event page while developing to see your shots in similar small tiles'.",
      "The host's cover (r2): 'keeping the host within the develop experience ... an easy skip ... Could probably polish this design more.'",
    ],
  },
  terms: [
    {
      term: "held",
      means:
        "An upload waiting for the host's approval: only the guest who added it sees it until it is let in.",
    },
    {
      term: "develop time",
      means:
        "When an album opens to everyone at once; until then each guest sees only her own.",
    },
    {
      term: "the wait",
      means:
        "What a guest sees of an album while photos wait: her own, lit, and everyone's as a count.",
    },
    {
      term: "contact sheet",
      means:
        "A photographer's sheet of every frame on a roll, small and side by side.",
    },
    {
      term: "trickle",
      means: "Held photos arriving a few at a time, as the host lets each in.",
    },
    {
      term: "premiere",
      means:
        "The reel playing the developed roll, the first thing everyone sees at the develop.",
    },
    {
      term: "the host's cover",
      means:
        "What keeps the album from the host until the develop, which she can lift for a look.",
    },
  ],
  carried: [
    {
      id: "screen",
      question:
        "Should the room's screen get a link of its own, opened without signing in as Maya? Whoever holds it watches every photo land.",
      taken:
        "Yes, guarded: it plays the slideshow and nothing else, Maya turns it off in one press, and it ends at the develop.",
      overrule:
        "No: the screen signs in as Maya, as today, so no link plays the sealed roll to whoever holds it.",
    },
    {
      id: "remove",
      question: "Does taking one of hers back ask first?",
      taken:
        "No: one press, as her uploads list does today; it says Removing, and on a roll the shot comes back at once.",
      overrule:
        "It asks first, since a camera shot she takes back is purged that night.",
    },
    {
      id: "round",
      question:
        "Does her uploads' round stay beside Add once her own photos stand in the wait?",
      taken:
        "Yes, as production has it on both albums since door-reveal: the list stays her one place for all of hers.",
      overrule: "It goes once the wait shows hers: one place, not two.",
    },
  ],
  asks: [
    /* ── 1. The model ─────────────────────────────────────────────────────── */
    {
      id: "model",
      label: "The model",
      question:
        "Which one idea should hosts and guests share for an album whose photos wait, for Maya's approval or until a develop time?",
      where: ["Host and guest", "Settings, then the album", "A delayed album"],
      when: "Maya sets how her album shows what's added; at 10:40 pm Priya adds to it while nothing of anyone else's shows yet.",
      matters:
        "It names what a host chooses and what a guest waits for, in Create, Settings, the album and the help alike.",
      lands:
        "How Settings and Create ask it, what the album calls the wait, and the words a guest and a host read for it.",
      context:
        "Four frames each, end to end: Maya's Settings; Priya's album at 10:40 pm, held for approval, then developing at 9 am; and 11:20 pm, when Maya lets 24 in. The wait is drawn in its recommended shape, so only the model moves.",
      options: [
        {
          id: "questions",
          label: "Two questions, as built",
          means:
            "How guests add, then when everyone sees: right away, once you approve each, or at a develop time; Disposable is a preset of both.",
          gains:
            "Each answer is plain and independent, and it is what the schema and Settings already say.",
          costs:
            "A guest meets two waits in two words, approval's and the develop's.",
        },
        {
          id: "styles",
          label: "Album styles",
          means:
            "One pick of a named album (Live, Reviewed, Disposable), each a card with its picture; the two answers wait under Customize.",
          gains:
            "One pick a host remembers, the name a guest reads, and a switch is one tap.",
          costs:
            "A mix outside the styles, a camera that shows live, hides under Customize.",
        },
        {
          id: "time",
          label: "One question of time",
          means:
            "Only when everyone sees, as one track from live to approval to a develop time; the camera is a way to add, and every wait develops.",
          gains:
            "Approval and the develop become one wait with one word, the way you said they feel.",
          costs:
            "Approval reads as developing, so a photo Maya turns down needs its own plain word.",
        },
        {
          id: "apart",
          label: "Approval apart",
          means:
            "Approval stays the host's filter and never a wait: her held photos stand in the live album, marked only-you; only a develop waits.",
          gains: "A held album feels live, and only the develop is an event.",
          costs:
            "Until Maya approves, a held album holds nothing but hers: no momentum.",
        },
      ],
      recommended: "time",
      because:
        "Your read: both are 'only yours now, everyone's later', so a host chooses only when, and a guest learns one wait.",
      overrule:
        "If a host should pick an experience by name, as Create's cards do, album styles.",
      configs: [SCREEN],
    },

    /* ── 2. Her wait ──────────────────────────────────────────────────────── */
    {
      id: "wait",
      label: "Her wait",
      question:
        "What should Priya meet in the album while everyone's photos wait: her own lit, and theirs stacking up all night?",
      where: ["Guest", "The album", "While photos wait"],
      when: "Priya has just added her third photo at 10:40 pm; nothing of anyone else's shows yet, held for Maya or developing until 9 am.",
      matters:
        "Today her photo goes to her uploads list, never the album, and the album reads empty all night; guests keep coming back.",
      lands:
        "What the album draws under its cover while photos wait: hers, everyone's count and minutes, the clock, and her Remove.",
      context:
        "Three frames each on production's album, in the model you pick: held for approval as her photo lands (it stays), developing scrolled to the shutter, and one of hers opened to take back.",
      options: [
        {
          id: "sheet",
          label: "The contact sheet",
          means:
            "Your disposable-mode pick on the album itself: a square a photo in the order taken, everyone's dark and filling live, hers lit.",
          gains:
            "The whole night at a glance, and, your words, everyone's will land right here.",
          costs:
            "At a thousand photos it is pages of squares, so the oldest fold away.",
        },
        {
          id: "stack",
          label: "Uploads stacking",
          means:
            "The album's own rows with her photos in them, marked waiting, and one tile more: everyone's, a stack that thickens as uploads land.",
          gains:
            "Her photo lands as a photo in the album and stays; everyone's is one object.",
          costs:
            "The album's shape jumps when everyone's arrive: one stack becomes many tiles.",
        },
        {
          id: "reel",
          label: "The night's reel",
          means:
            "The night as a timeline: a bar every five minutes for everyone's, hers riding it as lit frames, now marked, the clock at its end.",
          gains:
            "Momentum as a shape, ending at the reveal, like the camera's own reel.",
          costs: "A chart where the others give her photographs to hold.",
        },
        {
          id: "cover",
          label: "The cover carries it",
          means:
            "Everyone's count and the clock ride the cover, hers dissolving there on her phone; the album under it is hers, marked.",
          gains:
            "Nothing new to learn: the cover already leads every album, and hers fill it.",
          costs:
            "Everyone's momentum is one line on the cover, and it scrolls away.",
        },
      ],
      recommended: "sheet",
      because:
        "Your pick ported whole: hers lit among everyone's dark, the count over it, and the album to come drawn in the very place it will land.",
      overrule:
        "If her photo should land as a photo among the album's tiles, uploads stacking.",
      after: { ask: "model" },
      configs: [SCREEN],
    },

    /* ── 3. The arrival ───────────────────────────────────────────────────── */
    {
      id: "arrival",
      label: "The arrival",
      question:
        "How should everyone's photos arrive: Maya's approvals as she makes them, and the roll at the develop?",
      where: ["Guest", "The album", "When photos arrive"],
      when: "Maya lets 24 in from her phone at 11:20 pm; at 9 am the roll develops and Priya opens the album over breakfast.",
      matters:
        "It is the payoff the wait promised: the trickle has to read as news, and the develop as a premiere.",
      lands:
        "What the album does as photos leave the wait, and how the reel's premiere opens the morning after.",
      context:
        "Two frames each, drawn in the model and the wait you pick: 11:20 pm on the held album as Maya's 24 arrive, and 9 am on the developing one as the roll develops.",
      options: [
        {
          id: "place",
          label: "Into place",
          means:
            "Each arrival leaves the wait for its place in the album, with the album's own glow; at 9 am the album is simply there, Premiere on its round.",
          gains:
            "Calm and true: the album fills where she was already looking.",
          costs:
            "The morning's premiere is a press away, not the first thing she sees.",
        },
        {
          id: "develops",
          label: "It develops in place",
          means:
            "The wait itself develops: each dark square fills with its photograph in the night's order, the reel playing in the cover, then the rows.",
          gains:
            "The wait she watched all night turns into the album before her eyes.",
          costs:
            "A few seconds of motion on the morning's first visit, every guest.",
        },
        {
          id: "premiere",
          label: "The premiere first",
          means:
            "The first visit after the develop opens on the reel playing the roll full screen, then the album; Maya's batch arrives as Watch 24.",
          gains:
            "The morning is an event: the roll plays before anything else.",
          costs:
            "A guest who came for one photo presses past a reel to reach it.",
        },
      ],
      recommended: "develops",
      because:
        "The wait and the album become one object: what she watched fill all night is what develops, and the reel's premiere plays over it.",
      overrule:
        "If the morning should open on the premiere itself, the premiere first.",
      after: { ask: "wait" },
      configs: [SCREEN],
    },

    /* ── 4. The host's cover ──────────────────────────────────────────────── */
    {
      id: "cover",
      label: "The host's cover",
      question:
        "Until the develop, what should Maya's own album be: covered like her guests', with an easy way to look?",
      where: ["Host", "Her event's hub", "Before the develop"],
      when: "Maya opens her hub at 10:40 pm between dances; 142 shots are sealed until 9 am, and her guests see only their own.",
      matters:
        "She can see everything; the cover keeps her inside the develop with her guests unless she chooses otherwise.",
      lands:
        "What her hub's album draws before the develop, how she lifts the cover for a look, and how it covers again.",
      context:
        "Three frames each on Maya's hub as it ships (its head and rooms are event-header's): the developing album covered at 10:40 pm, lifted for a look, and the held album, where Review is her look.",
      options: [
        {
          id: "card",
          label: "The card, polished",
          means:
            "Round two's cover made calm: one dark card over her album with the count, the night's minutes, the develop time, Look and Develop now.",
          gains: "The plainest: one card, one look, one Develop now.",
          costs: "It is a card about the album rather than the album.",
        },
        {
          id: "guests",
          label: "What her guests see",
          means:
            "Her hub draws the very wait her guests meet (her own lit), with Look lifting it for this visit and Cover it putting it back.",
          gains:
            "She waits with her guests, sees what they see, and lifts it in one press.",
          costs:
            "Her album looks like a guest's until she lifts it, every visit.",
        },
        {
          id: "frost",
          label: "Frosted, hold to peek",
          means:
            "Her album drawn whole under frosted glass, its colour and momentum showing through; hold to see it clear, let go and it frosts.",
          gains:
            "The party's colour without spoiling it, and a peek that cannot stick.",
          costs: "Hold to peek is a gesture she has to discover.",
        },
      ],
      recommended: "guests",
      because:
        "She waits with her guests and sees exactly what they meet, and the lift is one press that puts itself back.",
      overrule: "If her hub should stay a working page, the card, polished.",
      after: { ask: "model" },
      configs: [SCREEN],
    },

    /* ── 5. The preset's name ─────────────────────────────────────────────── */
    {
      id: "name",
      label: "The preset's name",
      question:
        "What should the album's camera with a develop time be called, where a host picks it and a guest meets it?",
      where: [
        "Host and guest",
        "Create, then the album",
        "Picking and meeting it",
      ],
      when: "Maya picks it in Create for the wedding; Priya meets its name on the album's cover and again the morning after.",
      matters:
        "It is the feature's name on the site, in Create and on every guest's phone: the word people repeat.",
      lands:
        "The preset's name wherever it is said: Create's card, Settings, the album's cover, the camera, the help and the site.",
      context:
        "Three frames each: Create's card as Maya picks it, the album's cover at 10:40 pm as Priya meets it, and the morning after's line. Drawn in the model you pick.",
      options: [
        {
          id: "disposable",
          label: "Disposable",
          means:
            "The wedding-table camera everyone knows, and the word the disposable-camera apps made familiar.",
          gains: "Understood at a glance, by a guest of 18 and of 50.",
          costs: "It also means throwaway, beside photos people keep.",
        },
        {
          id: "film",
          label: "Film",
          means:
            "Shoot on film: a roll each, developed in the morning; the album says Film and the camera says the roll.",
          gains: "Warm and current, and it says roll and develop by itself.",
          costs: "Nothing here is film, and a guest may expect a film look.",
        },
        {
          id: "darkroom",
          label: "Darkroom",
          means:
            "It names the wait: the night's photos go into the darkroom and come out at the develop time.",
          gains: "Names the wait itself, the part that is new.",
          costs: "It names the wait, not the camera a guest holds.",
        },
      ],
      recommended: "disposable",
      because:
        "Every guest already knows the ritual it names, and nothing else says 'a roll each, see them later' in one word.",
      overrule: "If it should name the wait rather than the camera, Darkroom.",
      after: { ask: "model" },
      configs: [SCREEN],
    },

    /* ── 6. Approval and a develop ────────────────────────────────────────── */
    {
      id: "both",
      label: "Approval and a develop",
      question:
        "Should a host be able to approve each photo and still hold them all for a develop time?",
      where: ["Host", "Settings", "When everyone sees"],
      when: "Maya wants the 9 am surprise, and with a school crowd at the wedding she wants to check each photo first.",
      matters:
        "The schema allows both; offering it adds an answer, and a guest's photo then waits twice.",
      lands:
        "Whether Settings offers approval with a develop time, and what a guest's photo says while it waits for both.",
      context:
        "Three frames each, in the model you pick: Maya's Settings, Priya's album at 10:40 pm with the develop set, and Maya's hub, where her approvals stand.",
      options: [
        {
          id: "never",
          label: "Never: the cover is her check",
          means:
            "A develop has its own screening: before 9 am Maya lifts her cover and takes out what she must. Three answers stay three.",
          gains: "Three answers, and the look approval would give her already.",
          costs: "Checking a develop is her own sweep, with no queue to clear.",
        },
        {
          id: "under",
          label: "A switch under the develop",
          means:
            "The develop time carries 'Approve each first': held photos wait in Review, then for 9 am.",
          gains: "A careful host gets her queue, and the surprise stays.",
          costs:
            "A guest's photo waits twice, and the album's words say two things.",
        },
        {
          id: "own",
          label: "Approval, a switch of its own",
          means:
            "Approval is a switch beside any timing: four answers in all, approval and the develop independent.",
          gains: "Every combination, nothing hidden.",
          costs: "Two controls where one answer read cleanly.",
        },
      ],
      recommended: "never",
      because:
        "Her cover already gives her every photo before 9 am, so a queue on top only makes a guest's photo wait twice.",
      overrule:
        "If a careful host needs a queue to clear, a switch under the develop.",
      after: { ask: "model" },
      configs: [SCREEN],
    },
  ],
});
