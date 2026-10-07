import { defineExploration } from "@/components/lab/exploration";

import { GROUND } from "./knobs";

/**
 * A PARTY WITH NO SIGNAL, ROUND ONE (the no-signal-r1 track, cut 2026-10-07
 * from the app-gaps walk's gap 8: "capture doesn't survive a dead zone").
 *
 * Production as built, walked offline (app-gaps-r1's ledger, G1 and G2): a send
 * whose line drops ends, once the run does, in the failure sheet ("2 of 3
 * didn't upload", the signal's mark on each row, Retry both, Not now) beside
 * the send's toast for what did land; any close of that sheet puts the files
 * down for good; nothing goes again when the line comes back but a lost
 * answer's own heal (`use-upload-queue.heal.ts`); the album's camera alone
 * re-sends by itself, and only while it stays open; and nothing outlives the
 * tab: no service worker, and a File is the page's (the held door's
 * IndexedDB keep, `door/wait-picks-store.ts`, is the one precedent). A camera
 * shot exists nowhere else: it is drawn on a canvas, never saved to her
 * Photos, so a cleared tab loses it for good. A photograph goes up as one PUT
 * (under 100 MB), so one dropped part way goes again from the start.
 *
 * ★ THE PLATFORM, DOC-CHECKED (2026-10-07: MDN, caniuse, WebKit's own notes):
 * Background Sync and Background Fetch are Chromium's alone (Chrome, Edge,
 * Android Chrome, Samsung); Safari has neither on any platform, and every iOS
 * browser is WebKit, so on an iPhone nothing can send with the album closed,
 * and a page in the background is suspended within seconds (it sends when she
 * looks at it again). Safari 17+ gives an origin up to 60% of the disk, evicts
 * whole origins least-recently-used under pressure, and deletes
 * script-written storage (IndexedDB included) after seven days of Safari use
 * with no tap on the site (a home-screen web app is exempt; `persist()` is
 * granted by heuristics); private browsing keeps nothing past the tab.
 * `navigator.onLine` says online on a venue's Wi-Fi with no internet, so "the
 * line is back" is a request that answers, never the event alone.
 *
 * ★ THREE ASKS, THE PROMISE FIRST: how far her unsent photos are carried (the
 * brief's keep and resume as one ladder of three, since a resume on her next
 * open needs the phone's keep and two asks would offer what cannot be built;
 * Android's background send is a carried call, since for every iPhone it
 * lands on the phone's answer); what she sees the moment the line drops, as a
 * question of the container (over the party, in the send's place, in her
 * list), staged after the carry and drawn in its words; and a Disposable's
 * roll offline, Will's one-way door, phrased to hold in every carry. The
 * send's glow and toast (album-moments), the camera's re-shoots
 * (camera-wiring), the status set's colours (brand-marks) and the Add's ring
 * (signature) are never asked here.
 *
 * ★ EVERY FRAME IS PRODUCTION'S SURFACE: the cover, the album's rows, the
 * stack, the Add, the sheets, the toast's words, the camera's parts and his
 * shots are production's components; an option draws only what it changes,
 * in today's tokens, and in the house's own words for the line ("Your
 * connection dropped", "Waiting for your connection").
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
      "A dropped line is never hidden or her fault: a send that waits says so in the house's words ('Waiting for your connection'), never 'failed'.",
      "Nothing lands twice: a lost answer is asked again, never re-uploaded (built: uploads on a bad line).",
      "The send's glow and toast are album-moments'; re-shoots camera-wiring's; status colours brand-marks'; the Add's ring signature's.",
      "A status is a point and its word; waiting for the line is Standby, half-lit with no hue, never a fault's colour.",
      "No email or push is assumed (your X11): nothing here reaches her outside the album.",
    ],
    earlier: [
      "Your E6 (2026-10-04): a dropped connection is never hidden, so she neither tries in vain nor blames the app (your crowded stadium).",
      "Your standing note: immediate, or a clear state and a way out; a failure says what happened, that nothing was lost, and the fix.",
      "The app-gaps walk, offline: '2 of 2 didn't upload… Retry', and nothing went again when the line came back.",
      "The careers page: 'Borrowed phones, patchy venue wifi… Real conditions are the spec.'",
    ],
  },
  terms: [
    {
      term: "dead zone",
      means:
        "A place at the party with no connection: a cellar, a field, a barn whose walls stop the phone's line.",
    },
    {
      term: "Standby",
      means:
        "A state that waits for the line, not for her: a half-lit point with no hue, and its word.",
    },
    {
      term: "the stack",
      means:
        "What her phone is sending, at the album's head: the photo in the air on top, the rest under it, a bar.",
    },
    {
      term: "the stand-in",
      means:
        "The pill above the Add that stands in for the stack while it is scrolled out of sight: its photo, word and x.",
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
  ],
  carried: [
    {
      id: "whole",
      question: "What does her phone keep while a photo waits?",
      taken:
        "Every file whole, copied as she sends, while her phone has room; a file it can't hold waits in the page, as today.",
      overrule:
        "The camera's shots alone (they exist nowhere else); a library pick waits as its name, to pick again.",
    },
    {
      id: "next-open",
      question: "On her next open, does what waited go by itself?",
      taken:
        "Yes, as the album opens: she pressed Send, and the stack's x still stops one before it lands.",
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
    {
      id: "background",
      question: "Should Android send with the album closed?",
      taken:
        "Not yet: a service worker for Android alone (iPhones have none), and Background Sync gives up after a few tries.",
      overrule:
        "Build it now: Android guests' photos land with the album closed, in a pocket; iPhones still send at the next open.",
    },
    {
      id: "waits",
      question:
        "On an album that waits (her host's yes, a develop), where does a waiting photo stand?",
      taken:
        "In her uploads, already there on those albums: its row half-lit, 'Waiting for your connection'.",
      overrule: "Today's sheet there, whatever the album answers here.",
    },
    {
      id: "ring",
      question: "How does the Add's ring look while photos wait?",
      taken:
        "Production's sending ring, held still at what landed with its count; its waiting look is signature's to finish.",
      overrule: "The ring with its hue drained, drawn here.",
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
        "Where unsent photos wait (the page, or her phone) and what sends them again: her Retry, her return to the page, or her next open.",
      context:
        "Priya's phone at the same two moments on every rung: 12:40 am, back on the open page with the line back; 9:10 am, the album opened after the page closed in the night. With them, her two photos through the night.",
      options: [
        {
          id: "retry",
          label: "As today: the open page, until Retry",
          means:
            "Unsent photos live in the open page; nothing goes again until she presses Retry (the camera retries by itself, only while open).",
          gains:
            "Built; nothing moves without her, and nothing of hers is kept on her phone.",
          costs:
            "Back on the album with the line back, nothing goes till she presses Retry; a closed page loses them.",
        },
        {
          id: "return",
          label: "The open page, sent by itself",
          means:
            "When she comes back to the open page with the line back, what waits goes by itself, and the send's toast says it landed.",
          gains:
            "The usual night, the line back while the album is still open, just works.",
          costs:
            "Small: a listener and the line check; iOS clears a backgrounded page, and a closed page loses them.",
        },
        {
          id: "phone",
          label: "Her phone, until each one lands",
          means:
            "A copy of each unsent file waits in this browser for this album (as the held door keeps her picks) and goes when the line is back, or at her next open.",
          gains:
            "Nothing she sent is lost to a closed page; her next open sends it.",
          costs:
            "Each send is copied to her phone first; Safari clears it after 7 days away, a private tab on close.",
        },
      ],
      recommended: "phone",
      today: "retry",
      because:
        "The one promise worth making, 'a closed page loses nothing you sent', on the held door's kind of keep.",
      overrule:
        "If her phone should keep nothing of hers, the open page sent by itself (Android's background send is a carried call).",
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
        "Where a send that waits is said (over the party, in the send's place, in her list), on an album that shows what she adds at once.",
      context:
        "Maya & Jay's album at a phone, in your answer to how far it's carried (its words promise only what it keeps): the moment the line drops; two minutes on, as she sends one more; then her press on what says it.",
      options: [
        {
          id: "sheet",
          label: "A sheet once the send ends, as today",
          means:
            "A sheet opens over the album as the send ends, in the carry's words (today '2 of 3 didn't upload' and Retry both), beside the toast for the one that joined.",
          gains: "Built, and impossible to miss.",
          costs:
            "A sheet over the party at every send that waits; once it is closed, nothing says they wait.",
        },
        {
          id: "standby",
          label: "The send stands by where it is",
          means:
            "The stack keeps her photo, its bar giving way to a half-lit point and 'No connection', its promise under it; the stand-in says it too, and nothing opens.",
          gains:
            "Said once, where she is already looking, in the send's own place; nothing interrupts the party.",
          costs:
            "A queue state that waits, where a dropped file errors today; a photo goes again from the start.",
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
        "If what waits belongs with her uploads, the chip; if it must be impossible to miss, a sheet.",
      after: { ask: "carry" },
      configs: [GROUND],
    },
    {
      id: "roll",
      label: "The roll, offline",
      question:
        "On a Disposable, when does a shot taken with no connection spend its frame?",
      where: ["Guest", "The album's camera", "In a dead zone"],
      when: "Sam has 4 frames left of his 24 when he goes down to the cellar, where there is no connection, and keeps shooting.",
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
            "A shot that can't send isn't counted or put on the reel: the count stays at 4 and nothing stops him; back upstairs, the last 2 of his 6 are refused.",
          gains: "Built; the count is always the album's own.",
          costs:
            "The count lies offline; shots past his roll are thrown away, said only on the album's sheet.",
        },
        {
          id: "taken",
          label: "When he takes it, like film",
          means:
            "Every press spends a frame at once, sent or not: the count steps down, the roll ends at 0 with 4 waiting on the reel, half-lit, and all 4 land.",
          gains:
            "The count he shoots by is the count he has; no shot this phone took is refused for the roll.",
          costs:
            "The camera counts its own waiting shots; unless her phone keeps them, a cleared page loses them.",
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
