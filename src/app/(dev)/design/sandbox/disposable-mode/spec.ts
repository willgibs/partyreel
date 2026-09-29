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
      context:
        "Your two from round one, pushed, and two new ones, at 10:40 pm with Priya six in: framing, the moment after, then the phone asking (her first press, a refusal, an iPhone asking again, as Safari asks each visit).",
      options: [
        {
          id: "viewfinder",
          label: "The album's own camera, pushed",
          means:
            "The live picture at the phone's whole frame and 24 ticks round the shutter, one going dark with each shot: the fastest to frame, the plainest.",
        },
        {
          id: "body",
          label: "The drawn disposable, pushed",
          means:
            "The back of a real disposable: frame through its little window, wind the thumb wheel after every shot, read the counter dial and the ready light.",
        },
        {
          id: "reel",
          label: "A camera that shoots on a reel",
          means:
            "The live picture over a strip of film: each shot exposes a frame and winds the strip on, so her roll is always in sight and runs out before her eyes.",
        },
        {
          id: "wrapper",
          label: "The event's own disposable",
          means:
            "A paper camera printed with the host's names, like a real disposable's wrapper: the party in its window, the counter through its cut. Each event gets its own.",
        },
      ],
      recommended: "reel",
      because:
        "It keeps the viewfinder's speed and whole frame and adds what makes a disposable one: a roll you watch run out. It is also the product's name, and its strip can carry on into the waiting room and the reel that premieres the roll.",
      overrule:
        "If holding a real object is the fun, the drawn disposable's wind and window.",
      lands:
        "The guest page's own live camera, its permission states, and whether the roll's strip carries into the waiting room.",
      configs: [STOCK],
      tile: "phone",
    },

    /* ── 2. The waiting room ─────────────────────────────────────────────── */
    {
      id: "waiting",
      label: "The waiting room",
      question:
        "What should a guest meet in the album while the roll develops?",
      context:
        "Every visit before 9 am lands here, full screen, inside the album after the door. The count rides the album's own sync; her shots are hers alone to see and delete. At 10:40 pm: the room, her shots, a delete; 1440 on the knob.",
      options: [
        {
          id: "stack",
          label: "Your darkroom, whole",
          means:
            "The safelight, the party's count, and her own shots as a face-down stack in the middle; a tap turns them face up, each hers to delete.",
        },
        {
          id: "tray",
          label: "Her shots, coming up in the tray",
          means:
            "Her shots float in the developer as faint latent images that deepen toward 9 am: she can tell which is which, never how one came out.",
        },
        {
          id: "pile",
          label: "The party's pile, landing live",
          means:
            "Every shot anyone takes lands face down on one pile, the newest on top as the sync brings it; hers carry a folded corner and pull out to her.",
        },
        {
          id: "strip",
          label: "Her roll, out of its canister",
          means:
            "Her roll as a strip of film, the reel camera's own: her exposed frames dark with their minutes, the rest waiting; a tap opens hers to delete.",
        },
      ],
      recommended: "pile",
      because:
        "It is your count and your stack at once: the pile grows as the party shoots, so the room is alive without showing a photograph, and hers are the corners she can pull out.",
      overrule:
        "If the reel camera wins and the night should be one object, her roll on its strip.",
      lands:
        "Whether the album before develop time is a room of its own, and whether the sync's count drives a pile's landings.",
      configs: [STOCK, SCREEN],
      tile: "phone",
    },

    /* ── 3. The room's screen ────────────────────────────────────────────── */
    {
      id: "wall",
      label: "The room's screen",
      question: "What should the room's screen show until the roll develops?",
      context:
        "The reel's own screen on the wall, the host signed in, until 9 am. Phones wait in the waiting room either way, and at 9 am the reel premieres the roll on every phone and here. Drawn at 10:40 pm, then as Priya's shot lands.",
      options: [
        {
          id: "darkroom",
          label: "The darkroom, building to 9 am",
          means:
            "The count climbing under the safelight, a dark frame landing each time anyone shoots, and the code to scan: no photograph until 9 am.",
        },
        {
          id: "slideshow",
          label: "Your live slideshow",
          means:
            "The reel plays the roll as it is shot, on this screen only: the room sees the party live and keeps shooting, while phones wait for 9 am.",
        },
        {
          id: "glimpse",
          label: "A glimpse of each new shot",
          means:
            "Each new shot surfaces for a few seconds, soft and grainy as if still developing, then sinks back into the dark: a tease, nothing kept.",
        },
      ],
      recommended: "slideshow",
      because:
        "It keeps the reel at the party, where it is strongest (your worry that a disposable kills the reel side), and a shot on the wall is what sends people back to shoot; every phone still gets the whole roll at 9 am.",
      overrule:
        "If the surprise is the point, the darkroom keeps every photograph for 9 am, the wall's included.",
      lands:
        "What the reel's screen posture plays before develop time, and whether it may show the roll while phones cannot.",
      configs: [STOCK],
    },

    /* ── 4. The host's peek ──────────────────────────────────────────────── */
    {
      id: "peek",
      label: "The host's peek",
      question: "Should the host see the roll before it develops?",
      context:
        "Review needs her to see a shot first (with review on, a shot develops once approved); the surprise wants it hidden, hers too. Her hub at 10:40 pm, then her next act; 1440 and review on the knobs.",
      options: [
        {
          id: "lands",
          label: "Yes, as it lands",
          means:
            "Her album fills as the party shoots, marked Developing; she takes anything out before 9 am, and review works as it does today.",
        },
        {
          id: "covered",
          label: "Covered, one tap to look",
          means:
            "Her album waits under a cover with the count; Look anyway opens it for this visit, so the surprise is hers to keep or spend.",
        },
        {
          id: "waits",
          label: "She waits with everyone",
          means:
            "Her album is the darkroom too, until 9 am or her Develop now; with review on she sees each shot in the queue, one at a time, and nowhere else.",
        },
      ],
      recommended: "covered",
      because:
        "Most hosts want both: to tidy the roll before the reveal and to be surprised by it. The cover makes looking her act, one tap a visit, and review and a report still reach any shot they need to.",
      overrule:
        "If tidying up comes first at every party, her album fills as it lands.",
      lands:
        "Whether the host's album before develop time shows the roll, a cover, or the darkroom, and what Review holds.",
      configs: [SCREEN, REVIEW, STOCK],
    },

    /* ── 5. Create's step ────────────────────────────────────────────────── */
    {
      id: "create",
      label: "Create's step",
      question:
        "How should Create's new step offer an album or a disposable camera?",
      context:
        "Your pick: a step of its own after the name, context for each, easy to switch later both ways in Settings. Create as it ships, now Name, Guests add, Style, Ready: the step, then the camera picked.",
      options: [
        {
          id: "cards",
          label: "Two big cards, a picture each",
          means:
            "An album or a disposable camera, each a picture of what a guest gets over three plain facts; picking the camera shows its three defaults.",
        },
        {
          id: "phone",
          label: "One phone that shows the choice",
          means:
            "A switch over a phone showing what a guest will meet, the facts beside it: flip it and watch the guest's screen change.",
        },
        {
          id: "compare",
          label: "The two, row by row",
          means:
            "Two columns of one table (how guests add, when they see it, the reel, what Free holds), so the difference reads at a glance.",
        },
      ],
      recommended: "cards",
      because:
        "Each experience gets its picture and its facts at a glance, the way the style step shows every code, and the camera's defaults appear only for the host who picked it.",
      overrule: "If hosts need to see a guest's screen to choose, the phone.",
      lands:
        "Create's second step and the event's first mode, and where the camera's three defaults are first set.",
      configs: [SCREEN, STOCK],
    },

    /* ── 6. Taking a video ───────────────────────────────────────────────── */
    {
      id: "video",
      label: "Taking a video",
      question: "On Event Pass and Pro, how should the camera take a video?",
      context:
        "Video is paid, so a Free event's camera takes photos only; the word is video, never clip (the reel's). In the camera you pick above: framing, four seconds in, and the first press asking for the microphone too.",
      options: [
        {
          id: "hold",
          label: "Hold the shutter to film",
          means:
            "A press takes a photo; holding films, the ring filling up to 10 seconds, and letting go stops it. One button and no mode.",
        },
        {
          id: "switch",
          label: "A Photo and Video switch",
          means:
            "A small switch over the shutter, as the phone's own camera has; in Video the shutter turns red and a press starts and stops it.",
        },
        {
          id: "button",
          label: "A video button of its own",
          means:
            "A second, smaller button beside the shutter films up to 10 seconds; the shutter itself only ever takes a photo.",
        },
      ],
      recommended: "hold",
      because:
        "It keeps the disposable's one button and is the grammar every social camera already taught; a mode switch is one more thing to get wrong in the dark.",
      overrule: "If a held press should never surprise anyone, the switch.",
      lands:
        "How the page's camera records (its microphone ask with it) and what its shutter does on a paid event.",
      after: { ask: "camera" },
      configs: [STOCK],
      tile: "phone",
    },

    /* ── 7. What a video costs ───────────────────────────────────────────── */
    {
      id: "cost",
      label: "What a video costs",
      question: "How should a video count against a guest's 24 shots?",
      context:
        "A 10 second video is about three photos' room at 1080p (the pricing page's figures); a paid event's room starts at 75 GB. In the camera and the way you picked: just after a six second video, then her shots.",
      options: [
        {
          id: "one",
          label: "A video is one shot",
          means:
            "24 shots is 24 photos or videos in any mix, and the count goes down by one either way.",
        },
        {
          id: "three",
          label: "A video is three shots",
          means:
            "What it weighs: a video spends three of her 24, and the camera says so before she films.",
        },
        {
          id: "own",
          label: "Videos count on their own",
          means:
            "24 photos and 3 videos each, two counts on the camera; neither spends the other.",
        },
      ],
      recommended: "one",
      because:
        "On a paid plan the room is 75 GB or more, so weighing a video in photos buys arithmetic and nothing else: a shot is a shot.",
      overrule:
        "If a roll of videos should cost what it weighs, three shots a video.",
      lands:
        "What the server's count counts on a paid event, and what the camera's count says after a video.",
      after: { ask: "video" },
      tile: "phone",
    },

    /* ── 8. Saving the look ──────────────────────────────────────────────── */
    {
      id: "save",
      label: "Saving the look",
      question:
        "When a guest saves a developed photo, should it wear the roll's look?",
      context:
        "The look is never baked: the original stays as taken and the album and reel wear it on the device, so Save hands over a file. At 9:02 am: Save in the viewer, what lands in her Photos, Download all; 1440 on the knob.",
      options: [
        {
          id: "original",
          label: "The original, always",
          means:
            "Save and Download all hand over the photograph as taken; the look is how the album shows it, and a saved photo is plain.",
        },
        {
          id: "save",
          label: "Save wears it, Download all is original",
          means:
            "What she saves is what she saw: Save draws the look into her copy on her phone, while Download all hands over the originals and says so.",
        },
        {
          id: "ask",
          label: "Hers to choose at Save",
          means:
            "Save asks, With the look or The original, as she saves; Download all stays the originals, with a line saying so.",
        },
        {
          id: "always",
          label: "The look, always",
          means:
            "Save and Download all both wear it, drawn on her phone before the zip, so a big album downloads more slowly.",
        },
      ],
      recommended: "save",
      because:
        "A guest saves a photo to post it, and it should look the way it did in the album; the archive, Download all, keeps the originals the look never touched.",
      overrule:
        "If a guest should always get the untouched original, Save hands it over plain.",
      lands:
        "Whether the viewer's Save and Share draw the look into a copy on the device, and what Download all says.",
      configs: [STOCK, SCREEN],
      tile: "phone",
    },
  ],
});
