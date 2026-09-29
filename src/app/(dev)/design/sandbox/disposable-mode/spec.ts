import { defineExploration } from "@/components/lab/exploration";

import { REVIEW, SCREEN, STOCK } from "./knobs";

/**
 * A DISPOSABLE CAMERA INSIDE PARTYREEL, ROUND TWO (2026-09-29).
 *
 * Round one's answers (docs/reviews/disposable-mode.json) and the replies he
 * approved are settled and drawn as given, never asked again: the reveal is a
 * host setting (straight away, or a develop time guests can see, 9 am the
 * next day by default, with Develop now); the reel becomes the reveal,
 * premiering the whole roll at develop time; 24 shots each, the server's
 * count; camera-only is the page's rule (a capture time can flag a library
 * shot, honestly said); Warm, Cool and B&W, the host's pick, never baked;
 * full size, storage deciding; with review on a shot develops once approved;
 * and switching goes both ways any time (`settings-wiring` builds the
 * consequence line).
 *
 * ★ HIS NOTES ARE THIS ROUND'S DIRECTION. `camera=viewfinder` with "I like
 * both options 2 and 3 ... continue finding more disposable camera designs
 * that can define Partyreel. Really marketable feature, needs to be cool."
 * `waiting=count` as the seed of "an atmospheric waiting room ... an
 * intriguing mystery stack of media in the center ... their uploaded media
 * becomes the media stack ... with a way to manage (like delete an upload).
 * ... don't get locked to mine." `reveal=morning` with his worry that a
 * disposable could kill the reel side, and "maybe host has slideshow access
 * either way to play live at event". `pick=step` with "plenty of context for
 * each experience-type". `price=full` with "videos should also work in pro
 * disposable events".
 *
 * ★ EIGHT DECISIONS, IN THE ORDER A NIGHT RUNS: the camera, the waiting room,
 * the room's screen, the host's peek, Create's step, how a video is taken
 * and what it costs (the second waits on the first, both drawn in the camera
 * picked), and whether a saved photo wears the look. Video is one question
 * the manifest named and two answers here, since how a video is taken and
 * what it spends are separate winners.
 *
 * ★ THE MEASURE. Round two's brief asked for the viewfinder's real capture
 * size on an iPhone and an Android; the dock's Measure a phone reads it on
 * the phone it is pressed on. What the platforms document, until a phone is
 * measured: an iPhone hands a page frames of its live video, at most 4032 by
 * 3024 (WebKit's capture source offers the camera's own video formats, and
 * Safari 27 ships no ImageCapture), where the camera app takes 24 MP on an
 * iPhone 15 or later and fuses frames at night; Android's Chrome takes a real
 * photo through ImageCapture.
 *
 * Nothing here asks what another standing board asks: the door before
 * joining is `locked-door`'s (this waiting room is inside the album, after
 * it), and how Settings is laid out is `settings-wiring`'s to build.
 */
export const DISPOSABLE_MODE = defineExploration({
  id: "disposable-mode",
  title: "A disposable camera",
  surface: "shared",
  desk: 80,
  lives: [
    "docs/systems/guest-flow.md",
    "docs/systems/uploads-and-r2.md",
    "docs/systems/billing-caps.md",
    "docs/systems/reel.md",
    "src/components/guest/event-experience.tsx",
    "src/components/guest/upload/intent-sheet.tsx",
    "src/components/guest/reel/live-reel-view.tsx",
    "src/components/app/create-event-wizard.tsx",
    "src/components/app/event-feed/host-album.tsx",
    "src/components/shared/media-lightbox-parts/actions.tsx",
    "src/lib/constants/tiers.ts",
  ],
  round: {
    n: 2,
    date: "2026-09-29",
    changed:
      "From your notes: the camera (your two pushed, two new), the waiting room, the room's screen until 9 am, whether the host peeks, Create's step, how a video is taken and what it costs, and whether a saved photo wears the look.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-28",
      changed:
        "Six decisions over Maya and Jay's wedding. You kept the album's camera and the drawn one, took three looks you can switch, a develop time as a host setting, the count as a waiting room's seed, a step of its own and full size.",
    },
  ],
  context:
    "Round two over Maya and Jay's wedding: 10:40 pm, 142 shots from 12 guests with Priya six into her 24, then the morning. Every frame wears what you settled: the roll develops at 9 am (the host's setting, with Develop now) and the reel premieres it, 24 shots counted by the server, Warm, Cool or B&W on the device, full size. Camera-only is the page's rule, not proof: a changed page can send any file, so a shot with an older capture time is flagged for the host. The dock's Measure a phone reads a real phone's capture size.",
  opening: {
    about:
      "A disposable-camera mode for an event: each guest shoots a limited roll, nobody sees it until it develops, and the reel premieres it.",
    settled: [
      "The reveal is the host's setting: straight away, or a develop time guests can see (9 am next day by default), with Develop now.",
      "The reel becomes the reveal: at develop time it premieres the whole roll on every phone.",
      "24 shots each, counted by the server; shots come from the page's camera, and an older photo sent anyway is flagged.",
      "Warm, Cool or B&W, the host's pick, drawn over the original on the device and never saved into it.",
      "Full size, storage deciding; with review on, a shot develops once approved; the mode switches both ways any time.",
    ],
    earlier: [
      "The camera: you liked both the album's own camera and the drawn disposable: 'Really marketable feature, needs to be cool.'",
      "The waiting room: your count, grown into 'an atmospheric waiting room' with a mystery stack and her own uploads to manage.",
      "The reveal: a develop time, with your worry that disposables kill the reel, and 'maybe host has slideshow access'.",
      "Create: 'its own focused step' with context for each, easy to switch later; and 'videos should also work' on paid events.",
    ],
  },
  terms: [
    {
      term: "roll",
      means:
        "The shots taken in disposable mode, 24 a guest, hidden from everyone until they develop.",
    },
    {
      term: "develop time",
      means:
        "When the roll is revealed to everyone: 9 am the next day by default, set by the host.",
    },
    {
      term: "Develop now",
      means: "The host's button that reveals the roll early.",
    },
    {
      term: "the look",
      means:
        "The roll's colour treatment (Warm, Cool or B&W), drawn over each photo on screen.",
    },
    {
      term: "waiting room",
      means: "What a guest sees in the album before the roll develops.",
    },
    {
      term: "room's screen",
      means:
        "A TV or projector at the party playing the reel, with the host signed in.",
    },
    {
      term: "safelight",
      means:
        "The dim red light of a photo darkroom, drawn as the waiting room's only colour.",
    },
    {
      term: "darkroom",
      means:
        "Where film is developed; here, a dim red-lit screen that waits for develop time.",
    },
    {
      term: "drawn disposable",
      means:
        "Round one's camera drawn as the back of a real disposable: a small window, a wheel, a counter.",
    },
    {
      term: "album's own camera",
      means:
        "The plain live camera inside the album: the whole picture and one shutter.",
    },
  ],
  carried: [
    {
      id: "size",
      question: "What size is a shot from the album's camera?",
      taken:
        "The largest a phone gives a page: an iPhone's live-video frame, at most 12 MP by WebKit's own source and without night mode; Android's full photo.",
      overrule:
        "The phone's own camera app on an iPhone, for 24 MP and night mode, Retake and all. The dock's Measure a phone reads yours.",
    },
    {
      id: "refused",
      question: "What can a guest do once she has refused the camera?",
      taken:
        "Turn it back on in Safari's Website Settings and try again, or shoot in the phone's own camera one at a time, counted the same.",
      overrule:
        "The album's camera or nothing, since the phone's own keeps its Retake.",
    },
    {
      id: "spent",
      question: "Does deleting a shot from her stack give the frame back?",
      taken:
        "No: the frame was spent when she shot it, as on a real disposable, and Delete takes the shot out for everyone, Maya included.",
      overrule:
        "Her own delete refunds the frame, so a pocket shot costs nothing, and a retake comes back with it.",
    },
    {
      id: "ten",
      question: "How long can a video run?",
      taken:
        "10 seconds: a moment, not a speech, about three photos' room at 1080p, the ring filling as it goes.",
      overrule: "15 seconds, a story's length, or 30 for the toasts.",
    },
    {
      id: "sound",
      question: "Does a video carry its sound?",
      taken:
        "Yes: on Event Pass and Pro the first press asks for the camera and the microphone in one prompt.",
      overrule:
        "Silent videos, so the phone asks for the camera alone; the reel plays silent anyway.",
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
      context:
        "Your two from round one, pushed, and two new ones, each drawn framing a shot, just after it, and as the phone asks for the camera: her first press, a refusal, an iPhone asking again, as Safari does each visit.",
      options: [
        {
          id: "viewfinder",
          label: "The album's own camera, pushed",
          means:
            "The live picture at the phone's whole frame and 24 ticks round the shutter, one going dark with each shot: the fastest to frame, the plainest.",
          gains:
            "The fastest: the whole live picture, and the 24 shots counted round the shutter.",
          costs:
            "The plainest: it looks like any phone camera, so the mode feels less special.",
        },
        {
          id: "body",
          label: "The drawn disposable, pushed",
          means:
            "The back of a real disposable: frame through its little window, wind the thumb wheel after every shot, read the counter dial and the ready light.",
          gains:
            "Feels like holding a real disposable: the wheel to wind, the counter to read.",
          costs:
            "Frames through a small window, and she must wind the wheel after every shot.",
        },
        {
          id: "reel",
          label: "A camera that shoots on a reel",
          means:
            "The live picture over a strip of film: each shot exposes a frame and winds the strip on, so her roll is always in sight and runs out before her eyes.",
          gains:
            "The fast full-frame picture, plus a strip that shows her roll running out.",
          costs:
            "Busier than a plain camera: a film strip of 24 frames runs across the screen.",
        },
        {
          id: "wrapper",
          label: "The event's own disposable",
          means:
            "A paper camera printed with the host's names, like a real disposable's wrapper: the party in its window, the counter through its cut. Each event gets its own.",
          gains:
            "Every event gets its own printed camera, the hosts' names on it: made to be posted.",
          costs:
            "A smaller live picture in a paper window, and a tab to pull before the first shot.",
        },
      ],
      recommended: "reel",
      because:
        "It keeps the fast full-frame camera and adds a roll she watches run out, a strip that can carry on into the waiting room and the reel.",
      overrule:
        "If holding a real object is the fun, the drawn disposable's wind and window.",
      lands:
        "The guest page's own live camera, its permission states, and whether the roll's strip carries into the waiting room.",
      matters:
        "It is the feature's face: what guests hold all night, and what makes the mode worth showing off.",
      configs: [STOCK],
      tile: "phone",
    },

    /* ── 2. The waiting room ─────────────────────────────────────────────── */
    {
      id: "waiting",
      label: "The waiting room",
      question:
        "What should a guest meet in the album while the roll develops?",
      where: ["Guest", "The album", "Before it develops"],
      when: "Any visit to the album before develop time: she is past the door, and the roll is still hidden.",
      context:
        "Full screen, on every visit before 9 am. The party's count updates live; her own shots are hers alone to see and delete. Drawn at 10:40 pm: the room, her shots, a delete; 1440 on the knob.",
      options: [
        {
          id: "stack",
          label: "Your darkroom, whole",
          means:
            "The safelight, the party's count, and her own shots as a face-down stack in the middle; a tap turns them face up, each hers to delete.",
          gains:
            "Your idea whole: the red glow, the party's count, her shots to turn over.",
          costs:
            "Only her own shots are in the room; the party's is just a number.",
        },
        {
          id: "tray",
          label: "Her shots, coming up in the tray",
          means:
            "Her shots float in the developer as faint images that deepen toward 9 am: she can tell which is which, never how one came out.",
          gains:
            "The most darkroom-like: her shots slowly come up toward 9 am.",
          costs:
            "Faint versions of her own shots show early, a small spoiler of the reveal.",
        },
        {
          id: "pile",
          label: "The party's pile, landing live",
          means:
            "Every shot anyone takes lands face down on one pile, the newest on top as it arrives; hers carry a folded corner and pull out to her.",
          gains:
            "Alive all night: every shot anyone takes lands on the pile as it happens.",
          costs:
            "Busy on a big night; her own shots are folded corners she must find.",
        },
        {
          id: "strip",
          label: "Her roll, out of its canister",
          means:
            "Her roll as a strip of film, the reel camera's own: her exposed frames dark with their minutes, the rest waiting; a tap opens hers to delete.",
          gains:
            "One object from the camera to the reveal, if the reel camera wins.",
          costs:
            "Only fits the reel camera; with any other camera it is a new look to learn.",
        },
      ],
      recommended: "pile",
      because:
        "It is your count and your stack at once: the pile grows as the party shoots, alive without showing a photo, and hers pull out.",
      overrule:
        "If the reel camera wins and the night should be one object, her roll on its strip.",
      lands:
        "Whether the album before develop time is a room of its own, and whether each new shot's arrival moves it.",
      matters:
        "Guests come back here all night; it decides whether the wait feels exciting or like an empty album.",
      configs: [STOCK, SCREEN],
      tile: "phone",
    },

    /* ── 3. The room's screen ────────────────────────────────────────────── */
    {
      id: "wall",
      label: "The room's screen",
      question: "What should the room's screen show until the roll develops?",
      where: ["Host", "The reel on the room's TV", "Until 9 am"],
      when: "Maya has the reel playing on a TV at the party, signed in, while every phone waits for 9 am.",
      context:
        "Phones wait in the waiting room either way, and at 9 am the reel premieres the roll on every phone and on this screen. Drawn at 10:40 pm, then as Priya's shot lands.",
      options: [
        {
          id: "darkroom",
          label: "The darkroom, building to 9 am",
          means:
            "The count climbing under the safelight, a dark frame landing each time anyone shoots, and the code to scan: no photograph until 9 am.",
          gains:
            "The surprise stays whole: the room sees a climbing count, no photos.",
          costs:
            "The reel has nothing to play at the party, your worry about disposables.",
        },
        {
          id: "slideshow",
          label: "Your live slideshow",
          means:
            "The reel plays the roll as it is shot, on this screen only: the room sees the party live and keeps shooting, while phones wait for 9 am.",
          gains:
            "The reel plays the party live on the TV, which keeps people shooting.",
          costs:
            "The room sees every shot before 9 am, so only phones get the surprise.",
        },
        {
          id: "glimpse",
          label: "A glimpse of each new shot",
          means:
            "Each new shot surfaces for a few seconds, soft and grainy as if still developing, then sinks back into the dark: a tease, nothing kept.",
          gains:
            "A tease: each new shot surfaces soft and grainy for a few seconds, then sinks.",
          costs:
            "Half of each: the surprise leaks a little, and nothing stays on screen to enjoy.",
        },
      ],
      recommended: "slideshow",
      because:
        "It keeps the reel at the party, your worry about disposables, and a shot on the TV sends people back to shoot; phones wait for 9 am.",
      overrule:
        "If the surprise is the point, the darkroom keeps every photograph for 9 am, the wall's included.",
      lands:
        "What the reel plays on the room's screen before develop time, and whether it may show the roll while phones cannot.",
      matters:
        "The screen is the party's centrepiece: it can keep people shooting, or keep the surprise whole.",
      configs: [STOCK],
    },

    /* ── 4. The host's peek ──────────────────────────────────────────────── */
    {
      id: "peek",
      label: "The host's peek",
      question: "Should the host see the roll before it develops?",
      where: ["Host", "Her event page", "Before it develops"],
      when: "Maya opens her event page at 10:40 pm, while the roll is still hidden from every guest.",
      context:
        "Two pulls: with review on she must see a shot to approve it, and the surprise wants the roll hidden from her too. Drawn at 10:40 pm, then her next act; 1440 and review on the knobs.",
      options: [
        {
          id: "lands",
          label: "Yes, as it lands",
          means:
            "Her album fills as the party shoots, marked Developing; she takes anything out before 9 am, and review works as it does today.",
          gains:
            "She can tidy anything before 9 am, and review works as it does today.",
          costs:
            "She sees every shot as it lands, so the reveal is no surprise for her.",
        },
        {
          id: "covered",
          label: "Covered, one tap to look",
          means:
            "Her album waits under a cover with the count; Look anyway opens it for this visit, so the surprise is hers to keep or spend.",
          gains: "The surprise is hers to keep or spend, one tap a visit.",
          costs:
            "One more tap each visit, and tidying means spending the surprise.",
        },
        {
          id: "waits",
          label: "She waits with everyone",
          means:
            "Her album is the darkroom too, until 9 am or her Develop now; with review on she sees each shot in the queue, one at a time, and nowhere else.",
          gains:
            "She is surprised with everyone at 9 am, or at her Develop now.",
          costs:
            "No tidying before the reveal; with review on she sees shots only in the queue.",
        },
      ],
      recommended: "covered",
      because:
        "Most hosts want both, to tidy the roll and to be surprised by it; the cover makes looking her choice, one tap a visit.",
      overrule:
        "If tidying up comes first at every party, her album fills as it lands.",
      lands:
        "Whether the host's album before develop time shows the roll, a cover, or the darkroom, and what Review holds.",
      matters:
        "She is the one person who may need to act before 9 am, and the one who most wants the surprise.",
      configs: [SCREEN, REVIEW, STOCK],
    },

    /* ── 5. Create's step ────────────────────────────────────────────────── */
    {
      id: "create",
      label: "Create's step",
      question:
        "How should Create's new step offer an album or a disposable camera?",
      where: ["Host", "Create an event", "Right after the name"],
      when: "Maya is creating the wedding's event; just after naming it, she picks an album or a disposable camera.",
      context:
        "Your round one pick: a step of its own after the name, with context for each and easy to switch later in Settings. Create becomes Name, Guests add, Style, Ready; drawn: the step, then the camera picked.",
      options: [
        {
          id: "cards",
          label: "Two big cards, a picture each",
          means:
            "An album or a disposable camera, each a picture of what a guest gets over three plain facts; picking the camera shows its three defaults.",
          gains:
            "Each choice is a picture over three plain facts, read at a glance.",
          costs:
            "A still picture: she imagines the guest's night rather than seeing it.",
        },
        {
          id: "phone",
          label: "One phone that shows the choice",
          means:
            "A switch over a phone showing what a guest will meet, the facts beside it: flip it and watch the guest's screen change.",
          gains:
            "She sees the exact screen a guest will meet, changing as she flips.",
          costs:
            "One choice at a time, so comparing means flipping back and forth.",
        },
        {
          id: "compare",
          label: "The two, row by row",
          means:
            "Two columns of one table (how guests add, when they see it, the reel, what Free holds), so the difference reads at a glance.",
          gains:
            "The differences line up row by row: adding, seeing, the reel, Free.",
          costs:
            "Reads like a pricing table: clear, but it sells neither experience.",
        },
      ],
      recommended: "cards",
      because:
        "Each gets a picture and its facts at a glance, as the style step shows every code, and the camera's defaults show only once picked.",
      overrule: "If hosts need to see a guest's screen to choose, the phone.",
      lands:
        "Create's second step and the event's first mode, and where the camera's three defaults are first set.",
      matters:
        "It is one of the biggest choices for an event, and most hosts will make it from this one screen.",
      configs: [SCREEN, STOCK],
    },

    /* ── 6. Taking a video ───────────────────────────────────────────────── */
    {
      id: "video",
      label: "Taking a video",
      question: "On Event Pass and Pro, how should the camera take a video?",
      where: ["Guest", "The disposable camera", "On a paid event"],
      when: "The event is on Event Pass or Pro, so the camera can film; Priya wants a few seconds of the toast.",
      context:
        "Video is paid, so a Free event's camera takes photos only; the word is video, never clip (the reel's). In the camera you pick above: framing, four seconds in, and the first press asking for the microphone too.",
      options: [
        {
          id: "hold",
          label: "Hold the shutter to film",
          means:
            "A press takes a photo; holding films, the ring filling up to 10 seconds, and letting go stops it. One button and no mode.",
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
        "It keeps the disposable's one button and the hold-to-film habit every social camera taught; a switch is one more thing to miss.",
      overrule: "If a held press should never surprise anyone, the switch.",
      lands:
        "How the page's camera records (its microphone ask with it) and what its shutter does on a paid event.",
      matters:
        "Filming has to be easy to find in the dark without making a photo any harder to take.",
      after: { ask: "camera" },
      configs: [STOCK],
      tile: "phone",
    },

    /* ── 7. What a video costs ───────────────────────────────────────────── */
    {
      id: "cost",
      label: "What a video costs",
      question: "How should a video count against a guest's 24 shots?",
      where: ["Guest", "The disposable camera", "Just after a video"],
      when: "On a paid event Priya has just filmed a six-second video, and her camera's count shows what it spent.",
      context:
        "A 10 second video takes about three photos' storage at 1080p (the pricing page's figures), and a paid event's storage starts at 75 GB. Drawn in your camera and way to film: just after a six second video, then her shots.",
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
      matters:
        "It decides whether a video feels like any other shot or a treat that eats the roll.",
      after: { ask: "video" },
      tile: "phone",
    },

    /* ── 8. Saving the look ──────────────────────────────────────────────── */
    {
      id: "save",
      label: "Saving the look",
      question:
        "When a guest saves a developed photo, should it wear the roll's look?",
      where: ["Guest", "A developed photo", "Saving it, 9:02 am"],
      when: "The roll developed at 9 am, and Priya saves a photo from the album to her phone.",
      context:
        "The look is drawn on screen over the original, which is never changed, so Save has a choice to make. Drawn at 9:02 am: Save in the viewer, what lands in her Photos, and Download all; 1440 on the knob.",
      options: [
        {
          id: "original",
          label: "The original, always",
          means:
            "Save and Download all hand over the photograph as taken; the look is how the album shows it, and a saved photo is plain.",
          gains: "Always the untouched photo, exactly as taken.",
          costs:
            "What she saves and posts looks different from what she saw in the album.",
        },
        {
          id: "save",
          label: "Save wears it, Download all is original",
          means:
            "What she saves is what she saw: Save draws the look into her copy on her phone, while Download all hands over the originals and says so.",
          gains:
            "What she saves is what she saw; Download all still gives originals.",
          costs:
            "Two rules to learn: Save keeps the look, Download all does not.",
        },
        {
          id: "ask",
          label: "Hers to choose at Save",
          means:
            "Save asks, With the look or The original, as she saves; Download all stays the originals, with a line saying so.",
          gains: "She decides each time, with the look or the original.",
          costs:
            "A question at every save, on the one tap that should be instant.",
        },
        {
          id: "always",
          label: "The look, always",
          means:
            "Save and Download all both wear it, drawn on her phone before the zip, so a big album downloads more slowly.",
          gains: "Everything matches the album, the zip included.",
          costs:
            "She never gets an original, and a big album downloads more slowly.",
        },
      ],
      recommended: "save",
      because:
        "She saves a photo to post it, so it should look as it did in the album; Download all keeps the untouched originals.",
      overrule:
        "If a guest should always get the untouched original, Save hands it over plain.",
      lands:
        "Whether the viewer's Save and Share draw the look into a copy on the device, and what Download all says.",
      matters:
        "Guests save photos to post them, so what they save is what the world sees of the party.",
      configs: [STOCK, SCREEN],
      tile: "phone",
    },
  ],
});
