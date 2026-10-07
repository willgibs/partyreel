import { defineExploration } from "@/components/lab/exploration";

import { GROUND } from "./knobs";

/**
 * A PARTY WITH NO SIGNAL, ROUND ONE (the no-signal-r1 track, cut 2026-10-07
 * from the app-gaps walk's gap 8: "capture doesn't survive a dead zone").
 *
 * Production as built, walked offline (app-gaps-r1's ledger, G1 and G2): a send
 * whose line drops ends, once the run does, in the failure sheet ("2 of 2
 * didn't upload", the signal's mark on each row, Retry both, Not now); its Not
 * now puts the files down for good; nothing goes again when the line comes
 * back but a lost answer's own heal (`use-upload-queue.heal.ts`); the album's
 * camera alone re-sends by itself, and only while it stays open; and nothing
 * outlives the tab: no service worker, and a File is the page's (the held
 * door's IndexedDB keep, `door/wait-picks-store.ts`, is the one precedent).
 * A camera shot exists nowhere else: it is drawn on a canvas, never saved to
 * her Photos, so a cleared tab loses it for good.
 *
 * ★ THE PLATFORM, DOC-CHECKED (2026-10-07: MDN, caniuse, WebKit's own notes):
 * Background Sync and Background Fetch are Chromium's alone (Chrome, Edge,
 * Android Chrome, Samsung); Safari has neither on any platform, and every iOS
 * browser is WebKit, so on an iPhone nothing can send with the album closed.
 * Safari 17+ gives an origin up to 60% of the disk, evicts whole origins
 * least-recently-used under pressure, and deletes script-written storage
 * (IndexedDB included) after seven days of Safari use with no tap on the site
 * (a home-screen web app is exempt; `persist()` is granted by heuristics);
 * private browsing keeps nothing past the tab. `navigator.onLine` says online
 * on a venue's Wi-Fi with no internet, so "the line is back" is a request that
 * answers, never the event alone.
 *
 * ★ THREE ASKS, THE PROMISE FIRST: how far her unsent photos are carried (the
 * brief's keep and resume as one ladder, since a resume on her next open
 * needs the phone's keep and two asks would offer what cannot be built); what
 * she sees the moment the line drops (staged after it, drawn in its answer, so
 * its words promise only what the answer keeps); and a Disposable's roll
 * offline, Will's one-way door. The send's glow and toast (album-moments),
 * the camera's re-shoots (camera-wiring) and the status set's colours
 * (brand-marks) are never asked here.
 *
 * ★ EVERY FRAME IS PRODUCTION'S SURFACE: the cover, the album's rows, the
 * stack, its stand-in, the shutter, the failure sheet, the camera's parts and
 * her shots are production's components; an option draws only what it
 * changes, in today's tokens.
 */
export const NO_SIGNAL = defineExploration({
  id: "no-signal",
  title: "A party with no signal",
  surface: "guest",
  desk: 14,
  lives: [
    "docs/systems/uploads-and-r2.md",
    "docs/systems/guest-flow.md",
    "docs/systems/disposable-mode.md",
    "src/lib/guest/use-upload-queue.ts",
    "src/lib/guest/use-upload-queue.heal.ts",
    "src/components/guest/upload/stack-tile.tsx",
    "src/components/guest/upload/sending-stand-in.tsx",
    "src/components/guest/upload/failure-sheet.tsx",
    "src/components/guest/upload-tracker.tsx",
    "src/components/guest/camera/album-camera.tsx",
    "src/lib/guest/camera/roll-view.ts",
    "src/components/guest/door/wait-picks-store.ts",
  ],
  round: {
    n: 1,
    date: "2026-10-07",
    changed:
      "A new board from the app-gaps walk's gap 8: how far a guest's unsent photos are carried when the line drops, what she sees the moment it does, and a Disposable's roll offline.",
  },
  opening: {
    about:
      "A party with no signal: how far her unsent photos are carried, what she sees when the line drops mid-send, and a Disposable's roll in a dead zone.",
    settled: [
      "A dropped line is never hidden, and is never her fault: today's sentence stays the uploader's one ('Your connection dropped…').",
      "Nothing is sent twice: a lost answer is asked again, never re-uploaded (built: uploads on a bad line).",
      "The send's glow and its toast are album-moments'; the camera's re-shoots camera-wiring's; the status set's colours brand-marks'.",
      "A status is a point and its word; waiting for the line is Standby, half-lit with no hue, never a fault's colour.",
      "No email or push is assumed (your X11): nothing here reaches her outside the album.",
    ],
    earlier: [
      "Your standing note: immediate, or a clear state and a way out; a failure says what happened, that nothing was lost, and the fix.",
      "The app-gaps walk, offline: '2 of 2 didn't upload… Retry', and nothing went again when the line came back.",
      "The careers page: 'Borrowed phones, patchy venue wifi… Real conditions are the spec.'",
    ],
  },
  terms: [
    {
      term: "dead zone",
      means:
        "A place at the party with no signal: a cellar, a field, a barn whose walls stop the phone's line.",
    },
    {
      term: "Standby",
      means:
        "A state that waits on nothing she must do: a half-lit point with no hue, and its word.",
    },
    {
      term: "the stack",
      means:
        "What her phone is sending, at the album's head: the photo in the air on top, the rest under it, a bar.",
    },
    {
      term: "her uploads",
      means:
        "The round button beside Add that lists her own photos and where each stands (today, on albums that wait).",
    },
    {
      term: "Disposable",
      means:
        "The album style where guests shoot with the album's own camera, a roll of frames each, developing later.",
    },
    {
      term: "service worker",
      means:
        "A small script a browser keeps for a site, able to run with its page closed (for sending: Android only).",
    },
  ],
  carried: [
    {
      id: "whole",
      question: "What does her phone keep while a photo waits?",
      taken:
        "Every file whole, while her phone has room; a file it can't hold waits in the page, as today, never refused.",
      overrule:
        "The camera's shots alone (they exist nowhere else); a library pick waits as its name, to pick again.",
    },
    {
      id: "next-open",
      question: "On her next open, does what waited go by itself?",
      taken:
        "Yes, as the album opens: she pressed Send, and her uploads still let her take one back before it lands.",
      overrule:
        "Asked first: '2 photos from last night are waiting. Send them?'",
    },
    {
      id: "check",
      question: "How does the page know the line is back?",
      taken:
        "A tiny static file asked when the phone says online, on return to the page and every 20 s while one waits: no function runs.",
      overrule:
        "The phone's own word alone, which says online on venue Wi-Fi with no internet.",
    },
  ],
  asks: [
    {
      id: "carry",
      label: "How far it's carried",
      question:
        "When her photos can't send, how far should Partyreel carry them to the album?",
      where: ["Guest", "Her photos on their way", "The line gone"],
      when: "Priya sends three from the dance floor at 11:41 pm; the first lands, the line drops on the second, and it is back at 12:40 am.",
      matters:
        "A photo she pressed Send on that never reaches the album is the one failure a party can't forgive.",
      lands:
        "Where unsent photos wait (the page, or her phone) and what sends them again: her Retry, the line's return, her next open, or the background.",
      context:
        "Priya's phone at the same moments on every rung: 12:40 am, the line back with the page open; 9:10 am, after the page closed in the night (an iPhone, then Android, on the background rung). With them, her two photos through the night.",
      options: [
        {
          id: "retry",
          label: "As today: the open page, until Retry",
          means:
            "Unsent photos live in the open page; nothing goes again until she presses Retry (the camera retries by itself, only while open).",
          gains:
            "Built; nothing moves without her, and nothing of hers is kept on her phone.",
          costs:
            "The line comes back in her pocket and nothing happens; a closed page loses them.",
        },
        {
          id: "return",
          label: "The open page, sent by itself",
          means:
            "The page sends what waits the moment the line is back or she returns to it, and the send's toast says it landed.",
          gains:
            "The usual night, the line back while the album is open, just works.",
          costs:
            "iOS clears pages left in the background: a closed or cleared page still loses them.",
        },
        {
          id: "phone",
          label: "Her phone, until each one lands",
          means:
            "A copy of each unsent file waits in this browser for this album (as the held door keeps her picks) and goes when the line is back or she opens it.",
          gains:
            "Nothing she sent is lost to a closed page; her next open sends it.",
          costs:
            "A second copy on her phone as it waits; Safari clears it after 7 days away, a private tab on close.",
        },
        {
          id: "background",
          label: "Her phone, and the background where it can",
          means:
            "Her phone's keep, plus a service worker: on Android it sends with the album closed once the line is back; on an iPhone, at her next open.",
          gains:
            "An Android guest's photos land with the album closed, her phone still in her pocket.",
          costs:
            "The app's first service worker to own, for Android alone; nothing tells her until she opens it.",
        },
      ],
      recommended: "phone",
      today: "retry",
      because:
        "The one promise worth making, 'nothing you sent is lost', on a keep production already has; the background adds Android alone.",
      overrule:
        "If her phone should keep nothing of hers, the open page sent by itself; if Android is worth a service worker, the background.",
      configs: [GROUND],
    },
    {
      id: "drop",
      label: "The moment it drops",
      question: "When the line drops mid-send, what should she see?",
      where: ["Guest", "The album", "The line drops mid-send"],
      when: "Priya has pressed Send on three photos at 11:41 pm; the first is in, and the line drops as the second goes up.",
      matters:
        "The first minute decides whether she trusts the album with the rest of her night, or stops adding.",
      lands:
        "The send's state when the line drops (the stack, its stand-in, the shutter's ring) and its words, wherever what she adds shows at once.",
      context:
        "Maya & Jay's album at a phone, in your answer to how far it's carried (its words promise only what it keeps): the moment the line drops, at the album's head; two minutes on, scrolled into the album; then her press on what says it.",
      options: [
        {
          id: "sheet",
          label: "As today: a sheet once the run ends",
          means:
            "When the run ends a sheet opens over the album: '2 of 3 didn't upload', Retry both and Not now; the send's toast says the one that joined.",
          gains: "Built, and impossible to miss.",
          costs:
            "Says 'didn't upload' over photos only waiting, in a sheet over the party, beside a 'joined' toast.",
        },
        {
          id: "standby",
          label: "The send stands by where it is",
          means:
            "The stack keeps her photo and holds its bar: 'No signal', half-lit, its promise under it; the stand-in and the shutter's ring hold too, and nothing opens.",
          gains:
            "Said once, where she is already looking, in the send's own place; nothing interrupts the party.",
          costs:
            "A queue state that waits, where a dropped file errors today; a held bar can read as stuck.",
        },
        {
          id: "uploads",
          label: "Her uploads hold them",
          means:
            "The stack steps out; the send's toast says what joined, and her uploads' button stands over the Add as a chip, '2 waiting to send', its list saying each waits.",
          gains:
            "The album shows only what is in it, as for a held photo; one home for hers not in yet.",
          costs:
            "Her uploads' button on every album and a row that waits; her photo leaves where it will land.",
        },
      ],
      recommended: "standby",
      today: "sheet",
      because:
        "Waiting is a state of sending: said once, in the send's own place and words, one object, never a second.",
      overrule:
        "If what waits belongs with her uploads, the chip; if it must be impossible to miss, today's sheet.",
      after: { ask: "carry" },
      configs: [GROUND],
    },
    {
      id: "roll",
      label: "The roll, offline",
      question:
        "On a Disposable, when does a shot taken with no signal spend its frame?",
      where: ["Guest", "The album's camera", "In a dead zone"],
      when: "Sam has 4 frames left of his 24 when he goes down to the cellar, where there is no signal, and keeps shooting.",
      matters:
        "The count he shoots by must be the count he has, or a shot he took is thrown away later.",
      lands:
        "How the camera counts a shot it can't send yet, and whether a shot past his roll is taken at all. One-way: the count is the roll's promise, and guests learn it.",
      context:
        "The album's camera in the cellar: his second shot; still pressing; then upstairs as the line returns (today the refusal shows only on the album's sheet). Under them, each press's count and fate, and the reel at twice its size.",
      options: [
        {
          id: "lands",
          label: "As today: when it lands",
          means:
            "A shot that can't send leaves the count and the reel at once: it stays at 4 and nothing stops him; the line back, the last 2 of his 6 are refused.",
          gains: "Built; the count is always the album's own.",
          costs:
            "The count lies offline; shots past his roll are thrown away, said only on the album's sheet.",
        },
        {
          id: "taken",
          label: "When he takes it, like film",
          means:
            "Every press spends a frame at once, sent or not: the count steps down in the cellar, the roll ends at 0 with 4 waiting, and all 4 land.",
          gains:
            "The count he shoots by is the count he has; no shot he took is refused for the roll.",
          costs:
            "The camera must count its waiting shots itself; a cleared page loses them and frees their frames.",
        },
      ],
      recommended: "taken",
      today: "lands",
      because:
        "A Disposable is film: the shutter spends the frame, so no shot he took is ever thrown away for the roll.",
      overrule:
        "If the album's count must be the only count, as today, and a shot past it is refused when it lands.",
    },
  ],
});
