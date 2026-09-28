import { defineExploration } from "@/components/lab/exploration";

import { SCREEN, SHOTS } from "./knobs";

/**
 * A DISPOSABLE CAMERA INSIDE PARTYREEL, ROUND ONE (2026-09-28).
 *
 * Will, on export-flow's `means`: "if we simply restricted both a guest's
 * ability to add with only taking live photos in-app (no library uploads)
 * plus an upload count limit, that's effectively a disposables mode we could
 * market as well, but simply within our product rather than being built
 * around it. Swallow all of https://pov.camera/ future potential users." And:
 * "hosts shouldn't have to feel they're having to study docs or fight UI to
 * set up an event how they'd like."
 *
 * ★ WHAT POV IS (pov.camera, its App Store page and three reviews, read
 * 2026-09-28): a host sets shots per guest, a reveal time and a style; guests
 * join by QR (an App Clip on iOS, the web on Android) and shoot in its own
 * camera with a disposable's filter; the gallery reveals during the event or
 * on a set date, the host able to remove photos first; free under 10 guests,
 * then $4.99 (25) to $89.99 (250) by guest count; photobooks. Its reviews'
 * complaints: glitches loading photos, caps that feel tight over a long day,
 * and galleries that expire. Partyreel's answers are already built: the live
 * album and the reel on the room's screen, curation, an album that persists
 * until its host deletes it.
 *
 * ★ SIX DECISIONS, IN THE ORDER A NIGHT RUNS: the guest's camera and its look
 * (the look waits on the camera, since it is drawn in it), when the roll
 * develops and what the album shows until then (the second waits on the
 * first), how a host turns it on, and its price. The limits are drawn, not
 * hidden: camera-only is a rule of the page, the count is the server's, and
 * nothing proves a shot was taken live (the carried call `proof`).
 *
 * Nothing here asks what another standing board asks: whether the reveal
 * sends an email is `emails`' `moments`, and how Settings is structured is
 * `event-settings`' (the camera's rows are drawn in the sheet as it ships, and
 * move with whatever structure wins there).
 */
export const DISPOSABLE_MODE = defineExploration({
  id: "disposable-mode",
  title: "A disposable camera",
  round: {
    n: 1,
    date: "2026-09-28",
    changed:
      "A disposable camera inside Partyreel, drawn over Maya and Jay's wedding at 375: the guest's camera and its look, when the roll develops and what the album shows until then, how a host turns it on, and where it sits between Free, Event Pass and Pro.",
  },
  context:
    "Your export-flow note: guests shoot live in the album, no library and a shot limit, a disposable inside Partyreel rather than a product built around one, set up without studying anything. POV, the one built around it, sets shots per guest, a reveal time and a style, and is free under 10 guests. Every frame is Maya and Jay's wedding: the party at 10:40 pm, 142 shots in, and the morning after.",
  carried: [
    {
      id: "shots",
      question: "How many shots does each guest get?",
      taken:
        "24, a roll's worth, set the moment the camera is turned on; the host makes it 10, 36 or any number in Settings.",
      overrule: "27, a real disposable's count, or 10 for a dinner.",
    },
    {
      id: "count",
      question: "Whose count is it, when she switches phones?",
      taken:
        "A confirmed email's, across her phones (verified emails is the default); a typed name's is her phone's, so clearing it starts a new roll.",
      overrule:
        "Turning the camera on turns Require verified emails on, and keeps it on.",
    },
    {
      id: "spent",
      question: "Does a deleted shot give its frame back?",
      taken:
        "No: a shot counts the moment it is taken, as a disposable's frame does, so deleting it later, hers or the host's, never refunds it.",
      overrule: "Her own delete gives it back, so a pocket shot costs nothing.",
    },
    {
      id: "host-first",
      question: "Does the host see the roll before it develops?",
      taken:
        "Yes, as it lands, so she can take out what should not be in the reveal; guests see nothing of it until it develops.",
      overrule: "She waits with everyone, and tidies up after.",
    },
    {
      id: "after",
      question: "What does the camera do once the roll has developed?",
      taken:
        "It stays open, still camera-only and counted, and a late shot joins the album at once; closing uploads stays her one switch.",
      overrule: "It closes with the reveal, like a finished roll.",
    },
    {
      id: "door",
      question: "What does the door ask at a disposable-camera event?",
      taken:
        "Its upload step opens the camera for a first shot, with no library row, and the welcome says the roll: 24 shots each, developed at 9 am.",
      overrule:
        "The door asks nothing of the camera, and the first shot waits for the album.",
    },
    {
      id: "proof",
      question: "What keeps a library photo out of the roll?",
      taken:
        "The page offers only its camera and the server counts every shot; nothing proves a shot was live, since a changed page can send any file.",
      overrule:
        "Flag any shot whose capture time is older than the party, for the host to look at.",
    },
  ],
  asks: [
    /* ── 1. The guest's camera ───────────────────────────────────────────── */
    {
      id: "camera",
      label: "The guest's camera",
      question: "At a disposable-camera event, what should a guest shoot with?",
      context:
        "Add offers Take a photo (the phone's camera) and Choose from your album; a disposable keeps the camera alone, photos only, and counts it. The album's own camera asks the phone once for its camera. Drawn at 10:40 pm, Priya six shots in.",
      options: [
        {
          id: "phone",
          label: "The phone's own camera",
          means:
            "Take a photo opens the phone's camera app, with its flash, its lenses and its own Retake; the album counts what she sends, not what she shot.",
        },
        {
          id: "viewfinder",
          label: "The album's own camera",
          means:
            "A live viewfinder fills the screen: one big shutter with the shots left beside it, no retake and no library; each shot is sent the moment it is taken.",
        },
        {
          id: "body",
          label: "A disposable, drawn",
          means:
            "The same live camera in a disposable's body: a small window to frame in, the count in its dial, and a wind of the wheel before the next shot.",
        },
      ],
      recommended: "viewfinder",
      because:
        "Only the page's own camera can hold the rules it is named for (no retake, the count on the shutter, the look in the frame) and stay a photograph first. The phone's camera keeps its Retake, so its count counts what she kept, not what she shot.",
      overrule:
        "If night shots need the phone's own flash and lenses more than the rules need holding, the phone's own camera.",
      lands:
        "Whether the guest page gains a live camera of its own, or keeps the file input's capture with the library row gone.",
    },

    /* ── 2. The look (after the camera) ──────────────────────────────────── */
    {
      id: "look",
      label: "The camera's look",
      question: "Should the camera's shots wear a film look?",
      context:
        "What a shot looks like as she frames it and once it develops. POV sells a style; a real disposable prints warm, grainy and dated. Drawn in the camera you picked, on the toast under the string lights, then the album the morning after.",
      options: [
        {
          id: "clean",
          label: "The photograph as taken",
          means:
            "No look: the count and the wait are what make it a disposable, and every shot keeps the phone's own colour.",
        },
        {
          id: "film",
          label: "One film look, on by default",
          means:
            "A warm cast, soft grain and the date in the corner, baked into every shot; the host can turn it off, with nothing to choose between.",
        },
        {
          id: "stocks",
          label: "Three looks, the host's pick",
          means:
            "Warm, cool or black and white, picked once in Settings; the viewfinder wears it, so every guest sees the roll's look as she frames.",
        },
      ],
      recommended: "film",
      because:
        "It is the disposable's own signature (the grain, the warmth, the date in the corner) at no setup, with one switch to turn it off. A choice of three is a row a host has to think about for a difference most guests never notice.",
      overrule:
        "If hosts ask for a black and white roll, the three looks earn their row in Settings.",
      lands:
        "Whether the camera bakes a look into the shot it saves, and whether Settings gains a look row or one switch.",
      after: { ask: "camera" },
    },

    /* ── 3. When it develops ─────────────────────────────────────────────── */
    {
      id: "reveal",
      label: "When it develops",
      question: "When should a disposable's shots develop for everyone to see?",
      context:
        "A disposable's pictures are seen together, later; POV reveals on a set date. The live album and the reel on the room's screen are where Partyreel is strongest. Drawn at 375: the party at 10:40 pm, then the moment the roll is seen.",
      options: [
        {
          id: "morning",
          label: "At a set time, 9 am the next day",
          means:
            "The host can move the time, or develop it early from her album; the album opens with the reel playing the whole roll.",
        },
        {
          id: "host",
          label: "When the host develops it",
          means:
            "No clock: the roll waits for her Develop, at the party on the room's screen or the next day, with a reminder the next morning.",
        },
        {
          id: "hour",
          label: "An hour after each shot",
          means:
            "A one-hour lab: every shot develops on its own an hour after it is taken, so the album and the reel run an hour behind the party.",
        },
        {
          id: "live",
          label: "Straight away, like any album",
          means:
            "Nothing waits: the camera and the count make it a disposable, and every shot joins the album and the reel as it is taken.",
        },
      ],
      recommended: "morning",
      because:
        "It is the disposable's own moment, everyone seeing the roll at once the next morning, and a time set by default means a roll never waits on a host who forgot; her Develop now still makes it a reveal at the party.",
      overrule:
        "If the reel on the room's screen is what a party should remember, the one-hour lab keeps it moving.",
      lands:
        "Whether a shot gains a developing state the album withholds until a time or her Develop, and what the reel plays until then.",
    },

    /* ── 4. While it develops (after the reveal) ─────────────────────────── */
    {
      id: "waiting",
      label: "While it develops",
      question: "What should the album show while the roll develops?",
      context:
        "Every guest opens the album to shoot, so this is what she meets each time. Drawn at 10:40 pm, 142 shots from 12 guests with Priya's six among them, in the wait you picked (at a set time if nothing waits).",
      options: [
        {
          id: "count",
          label: "The count, and nothing more",
          means:
            "A darkroom under the camera: 142 shots developing and when; nobody sees a photograph, her own included.",
        },
        {
          id: "frames",
          label: "A frame for every shot",
          means:
            "The rows fill with undeveloped frames as the party shoots, each with its time and shape; nothing in one can be seen until it develops.",
        },
        {
          id: "hers",
          label: "Her own, for her alone",
          means:
            "Her six develop for her at once, so she knows they came out; everyone else's wait behind a count.",
        },
      ],
      recommended: "frames",
      because:
        "The album still moves with the party (a frame lands each time anyone shoots), which is Partyreel's live album without spoiling one picture, and her own frames tell her each shot went.",
      overrule:
        "If a guest needs to see that hers came out, her own six, with the rest a count.",
      lands:
        "Whether the album's reads send a developing shot's shape and time without its picture, or only a count.",
      after: { ask: "reveal" },
      // One phone an option, so the three stand side by side at a desk.
      tile: "phone",
    },

    /* ── 5. How a host turns it on ───────────────────────────────────────── */
    {
      id: "pick",
      label: "Turning it on",
      question: "How should a host turn an event into a disposable camera?",
      context:
        "Create asks one thing today, the name (Name it and it exists), then the code's style. Drawn on the real Create card and in Settings after, 1440 on the knob; a link from the site can open Create with the camera on.",
      options: [
        {
          id: "line",
          label: "One line under the name",
          means:
            "A quiet switch under the name turns it on and says its defaults in one line; Settings changes each of them.",
        },
        {
          id: "cards",
          label: "Two cards under the name",
          means:
            "An album or a disposable camera, side by side under the name, each a small picture of what a guest gets.",
        },
        {
          id: "step",
          label: "A step of its own",
          means:
            "Name, then how guests add photos, then the code: a whole step of two big cards, before the style.",
        },
        {
          id: "settings",
          label: "In Settings, never in Create",
          means:
            "Create stays the name and the code; Guest uploads gains the camera, and the new event offers it once on its first screen.",
        },
      ],
      recommended: "line",
      because:
        "It keeps Create one field for a host making an album, shows every host the camera exists (the reason the style step stayed: hosts may not know), and costs the camera's host one tap.",
      overrule:
        "If a disposable should feel like a product of its own, the two cards give it the album's billing.",
      lands:
        "Whether Create gains a row, a choice or a step, and where Guest uploads says how guests add photos.",
      configs: [SCREEN],
    },

    /* ── 6. Its price ────────────────────────────────────────────────────── */
    {
      id: "price",
      label: "Its price",
      question:
        "Where should a disposable camera sit between Free, Event Pass and Pro?",
      context:
        "Your new Free is 100 MB, about 30 photos at a phone's full size; a 10-guest roll of 24 is about 700 MB. POV is free under 10 guests, then $4.99 to $89.99 by guest count. Drawn where a Free host turns it on, then where it ends.",
      options: [
        {
          id: "full",
          label: "Storage decides, at full size",
          means:
            "Every plan; each shot is the phone's full photo, about 3 MB, so Free develops about 30 and a real party needs the $24 Event Pass.",
        },
        {
          id: "lab",
          label: "Storage decides, at a lab scan's size",
          means:
            "Every plan saves a shot at 1600 px, about 0.4 MB with the look, so Free develops about 250: ten guests' rolls of 24, with no new rule.",
        },
        {
          id: "guests",
          label: "A guest count, as POV prices it",
          means:
            "Free's camera takes ten guests' rolls, at the lab's size so they fit, and the eleventh is told it's full; an Event Pass opens it to all.",
        },
        {
          id: "paid",
          label: "A paid camera, like video",
          means:
            "Event Pass and Pro only: a Free host meets the camera behind a lock with the pass's price, the upgrade's newest reason.",
        },
      ],
      recommended: "lab",
      because:
        "It reaches POV's free line through the one model Partyreel already has, storage, so Free stays the whole experience your free/pro shift asks for; the size is the camera's look on every plan, never a Free lever.",
      overrule:
        "If disposable shots should print large, full size keeps the phone's photo and leaves every real party to the Event Pass.",
      lands:
        "Whether the camera saves at one size on every plan, and whether a guest count joins storage as a limit.",
      configs: [SHOTS],
    },
  ],
});
