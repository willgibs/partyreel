import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * SEND TO GOOGLE DRIVE, ROUND ONE (the drive-export-r1 track, cut 2026-10-04).
 *
 * Will's ask of 2026-10-04 02:50Z: "if it's that easy to dump into Google
 * Drive and we can basically swallow WedUploader/WeddingQR/PixBearer's entire
 * feature set ... that's a hilariously great win ... let's ensure this is fully
 * planned and reviewed, then do it. lab exploration first to nail UI." The
 * architecture is the design note beside the research
 * (`_scratch/drive-export/design.md`: `drive.file` only, a Worker streaming R2
 * into Google's resumable uploads, every file checked against our MD5, every
 * failure a named state with one act); this board draws every moment a host
 * meets it, so the wiring lane builds his picks on that note.
 *
 * ★ EVERY FRAME IS PRODUCTION'S LOOK AS WIRED (identity's voice=camera,
 * layers=display, status=lights): the real `Popup` in its `plan` kind for
 * Take it home, the real `Progress` (the twelve-frame meter), `Badge` (a light
 * and its word), `Button`, `Card` and the storage chart trash-in-storage
 * wired, around quoted chrome (the hub's bar and album rows, Your events, the
 * toaster's display) where production's own component needs a session.
 *
 * ★ NOTHING HERE CONNECTS TO GOOGLE, and nothing draws Google's own screens as
 * theirs: the consent screen and her Drive are neutral stand-ins that carry
 * our words and our names, never Google's look. Google's Drive mark goes in at
 * the wiring, by its own brand rules; a lucide glyph stands in here.
 *
 * ★ STAGED: the hard moments are drawn on the place While it sends picks, and
 * freeing an album's room behind When it's done.
 */
export const DRIVE_EXPORT = defineExploration({
  id: "drive-export",
  title: "Send to Google Drive",
  surface: "host",
  desk: 20,
  lives: [
    "src/components/app/export/take-home-panel.tsx",
    "src/components/app/export/export-toast.tsx",
    "src/components/app/dashboard/events-section.tsx",
    "src/components/app/dashboard/storage-meter.tsx",
    "src/components/app/storage/storage-list.tsx",
    "src/app/(app)/account/page.tsx",
    "docs/systems/uploads-and-r2.md",
  ],
  tracks: ["drive-export-r1"],
  round: {
    n: 1,
    date: "2026-10-04",
    changed:
      "A new board from your ask of 2:50 am: Send to Google Drive, every moment a host meets it, drawn while the Advisor reviews the design note under it.",
  },
  context:
    "Maya & Jay, the wedding of 12 September: 1,284 photos and videos, 7.4 GB, from 31 guests. Maya is on Pro 100 GB and her Google Drive has 12.6 GB free. Every frame is production's look as wired (the hub, Take it home, the toaster, Your events, Account, the storage chart), at 1440 or 375 on the Screen knob. Nothing connects to Google: its consent screen and her Drive are neutral stand-ins carrying our words.",
  opening: {
    about:
      "Send to Google Drive: every moment a host meets, from the way in and connecting, through the send and its hard moments, to done and freeing the album's room.",
    settled: [
      "Partyreel asks Google for drive.file only: it sees only the files it puts in her Drive, so there is no security audit (your word).",
      "Originals only, streamed by our own Worker from storage: her tab can close any time, and an email says when it's done.",
      "Before anything leaves Partyreel, the app itself checks every file in her Drive byte for byte against ours.",
      "Deleted counts in storage now (trash-in-storage), and Make room from Deleted is on by default.",
    ],
    earlier: [
      "Your ask: 'if it's that easy to dump into Google Drive ... that's a hilariously great win.'",
      "'the easy delete after export makes it easy to manage our storage and never need to upgrade, that's such good UX.'",
      "'let's ensure this is fully planned and reviewed, then do it. lab exploration first to nail UI.'",
    ],
  },
  terms: [
    {
      term: "drive.file",
      means:
        "Google's narrowest Drive permission: Partyreel sees and changes only the files it puts in her Drive.",
    },
    {
      term: "Worker",
      means:
        "Our own small server at Cloudflare that streams each file from storage straight into her Drive.",
    },
    {
      term: "byte for byte",
      means:
        "Each file in her Drive matched to ours by its size and its fingerprint (MD5) before it counts as safe.",
    },
    {
      term: "Take it home",
      means:
        "The album's Download panel: Originals to keep for good, Phone size to post tonight.",
    },
    {
      term: "Deleted",
      means:
        "Where a deleted album waits 30 days before it leaves for good; it now counts in her storage.",
    },
    {
      term: "Make room from Deleted",
      means:
        "Her setting, on by default: an upload that needs room takes it from Deleted, oldest first.",
    },
    {
      term: "What's using space",
      means:
        "The storage list: everything she stores, largest first, opened from the dashboard's storage ring.",
    },
  ],
  carried: [
    {
      id: "plans",
      question: "Which plans get Send to Google Drive?",
      taken:
        "Every plan, Free included: it costs us about nothing and a way out is a promise. Live sync, next, is where a paid line belongs.",
      overrule:
        "Paid plans only: Free sees it in Take it home with a Pro mark.",
    },
    {
      id: "live-sync",
      question:
        "Does live sync (every upload copied to her Drive as it arrives) come in this version?",
      taken:
        "The next one, on the same machinery: this one proves the send, and Send on a sent album takes only what's new.",
      overrule:
        "This version: an album's own switch, Also save every upload to Drive.",
    },
    {
      id: "where",
      question: "Where in her Drive does a send land?",
      taken:
        "My Drive, a Partyreel folder in our colour, one folder an album: she can move them anywhere and we follow.",
      overrule: "She picks a folder first, in Google's own picker.",
    },
  ],
  asks: [
    {
      id: "way-in",
      label: "The way in",
      question: "Where should Send to Google Drive sit in Take it home?",
      where: ["Host", "The hub's album", "Take it home"],
      when: "Maya opens Download on her album the morning after, never having connected Drive.",
      matters:
        "It's where she first meets the feature: a host who never sees it never sends.",
      lands:
        "Where every album's Download offers Google Drive, at a desk and on a phone.",
      context:
        "Two frames: Take it home opened over the hub before Drive is connected, then once it is (connected as maya@example.com, 12.6 GB free). At 1440 the panel opens wide over the hub; at 375 it covers the screen.",
      options: [
        {
          id: "third",
          label: "A third way: Google Drive",
          means:
            "A third card with Originals and Phone size (at a desk, a row of its own under them), pictured by the album as a folder, its act Send to Drive.",
          gains:
            "Equal billing with the two sets: she sees it the first time she opens Download.",
          costs:
            "The panel grows a row taller at a desk, and a phone scrolls past two cards to reach it.",
        },
        {
          id: "originals",
          label: "A second act on Originals",
          means:
            "Originals keeps Download and gains Send to Drive beside it: the same full-size set, kept in her Drive instead.",
          gains:
            "Says exactly what goes, the originals, with nothing new to read.",
          costs:
            "A second button on one card is easy to miss, and a phone's lead card is Phone size.",
        },
        {
          id: "row",
          label: "A row under the two sets",
          means:
            "A line across the panel under the cards: Send the originals to Google Drive, its act at the end.",
          gains:
            "The two sets stay as they are, and Drive reads as one more way home.",
          costs:
            "A line is quieter than a card: on a phone it reads as a footnote.",
        },
      ],
      recommended: "third",
      because:
        "Drive is a third way home, as plain as the other two, and the album pictured as a folder says where it goes.",
      overrule:
        "If three cards crowd a desk, the row; if Drive should read as the originals only, the second act.",
      configs: [SCREEN],
    },
    {
      id: "doors",
      label: "The other doors",
      question: "Where else should she find Send to Google Drive?",
      where: ["Host", "Dashboard and storage", "Beyond one album"],
      when: "Maya hosts three albums this year, and her plan's 100 GB is nearly full.",
      matters:
        "A host clearing storage or keeping a season thinks in albums, not one Download at a time.",
      lands:
        "Whether Your events sends several albums at once, and whether What's using space offers Drive.",
      context:
        "Two frames: her dashboard's Your events, then What's using space filtered to one album. Each option draws its doors, or the screen as it is today.",
      options: [
        {
          id: "both",
          label: "Your events and storage too",
          means:
            "Your events gains Send to Drive (pick albums, send them in one go), and What's using space offers Send, then free, on an album.",
          gains:
            "A season goes in one press, and a full plan meets its way out where she looks.",
          costs: "Two more doors to build and keep in step with the panel.",
        },
        {
          id: "storage",
          label: "Storage too, when space runs short",
          means:
            "Only What's using space adds a door: filtered to an album, Send to Drive, then free its 7.4 GB.",
          gains: "Drive appears exactly when room is the question.",
          costs:
            "Several albums still go one at a time, each from its own panel.",
        },
        {
          id: "panel",
          label: "Take it home alone",
          means:
            "Drive lives only in each album's Take it home; Your events and storage stay as they are.",
          gains: "One door: nothing new to learn or to build.",
          costs:
            "A host with a full plan has to know to open each album's Download.",
        },
      ],
      recommended: "both",
      because:
        "Hosts clear albums by the season, and a full plan should point at its own way out.",
      overrule: "If one door is enough for a first version, storage alone.",
      configs: [SCREEN],
    },
    {
      id: "connect",
      label: "Connecting",
      question:
        "What should she read before Google's own screen, and where should she land after it?",
      where: ["Host", "Take it home", "Connecting Google Drive"],
      when: "Maya presses Send to Drive for the first time; Google will ask her to pick an account and allow access.",
      matters:
        "Google's screen says 'see, edit, create and delete': ours must say first how little that is.",
      lands:
        "The words before every Drive connection, and whether a send starts on her return or waits for a press.",
      context:
        "Three frames: what she reads before Google, Google's own screen (a neutral stand-in: it's Google's, never drawn as theirs), and where she lands back in Take it home.",
      options: [
        {
          id: "promise",
          label: "Our promise, then a final press",
          means:
            "A step in the panel: what we make in her Drive, what we can and can't see, how to disconnect; back from Google, the account, its room, Send.",
          gains:
            "She knows what Google's words mean, and confirms the account and the room first.",
          costs: "One more press than sending at once.",
        },
        {
          id: "straight",
          label: "Straight to Google, sending on return",
          means:
            "One line under the button says what we can see; back from Google, the send starts at once, with Cancel.",
          gains: "The fewest presses: Send means send.",
          costs:
            "A wrong account or a full Drive is found only once the send has started.",
        },
        {
          id: "mirror",
          label: "Google's screen, said first",
          means:
            "A step that says in our words each line Google is about to show, so nothing on its screen surprises her; back, a final press.",
          gains:
            "The most reassuring for a host wary of 'delete' on Google's screen.",
          costs: "The most words before anything happens.",
        },
      ],
      recommended: "promise",
      because:
        "Her first send must not surprise her: the account and the room are worth one press.",
      overrule:
        "If one press matters more than a check, straight to Google and sending on return.",
      configs: [SCREEN],
    },
    {
      id: "progress",
      label: "While it sends",
      question: "While an album sends, where should she see how it's going?",
      where: ["Host", "Anywhere in the app", "During a send"],
      when: "1,284 files are on their way, about 25 minutes; Maya keeps working, then goes back to her dashboard.",
      matters:
        "A send outlasts a page: she should always know it's moving, and that she can close the tab.",
      lands:
        "Where every send shows its folder, count, size and Cancel, and says the tab can close.",
      context:
        "Two frames: the hub mid-send (412 of 1,284, 2.4 of 7.4 GB), then her dashboard once she has moved on.",
      options: [
        {
          id: "album",
          label: "On the album it's sending",
          means:
            "A strip at the album's head with the folder, the count, the size and the meter; its tile on the dashboard wears a light; a toast says started and done.",
          gains:
            "The state lives with what it's about, and stays quiet everywhere else.",
          costs: "On another page she sees a light, not the numbers.",
        },
        {
          id: "toast",
          label: "A toast that follows her",
          means:
            "One toast at the top of every page carries the folder, the meter and Cancel, as Download all's toast does today.",
          gains: "Always in sight, wherever she goes: the zip's own pattern.",
          costs: "A 25-minute toast sits over every page she visits.",
        },
        {
          id: "panel",
          label: "Inside Take it home",
          means:
            "The panel's Drive card becomes the progress, and the album's Download button wears the count while it runs.",
          gains: "Nothing new on any page: reopen Download to see it.",
          costs:
            "Out of sight unless she goes looking, and nothing on the dashboard.",
        },
      ],
      recommended: "album",
      because:
        "A long send belongs to its album: a quiet strip there and a light on the dashboard, never a 25-minute toast.",
      overrule:
        "If she must see the numbers on every page, the toast that follows her.",
      configs: [SCREEN],
    },
    {
      id: "hard",
      label: "The hard moments",
      question: "When a send has to stop, how loudly should it say so?",
      where: ["Host", "During a send", "When it stops"],
      when: "Her Drive fills, Google's 750 GB a day runs out, she removes Partyreel at Google, or two files won't go.",
      matters:
        "Each stop needs one act from her or a promise from us; too loud and a pause reads as a failure.",
      lands:
        "The words, the light and the one act for Drive full, paused until tomorrow, disconnected and partly done.",
      context:
        "Four frames, a hard moment each, drawn where your answer to While it sends puts a send: Drive full, paused until tomorrow (a videographer's 918 GB album), disconnected, partly done.",
      options: [
        {
          id: "in-place",
          label: "On the send itself, one act each",
          means:
            "The send's own place turns to an amber light with its words and its one act (Check again, Reconnect, Retry), and one email for each stop.",
          gains:
            "Calm and specific: what happened, where she'd look, with its fix beside it.",
          costs: "Missed until she next looks, unless she reads the email.",
        },
        {
          id: "banner",
          label: "A banner across the app",
          means:
            "Until it's resolved, a banner under the app bar on every page names the stop and carries its act.",
          gains: "Impossible to miss, on any page.",
          costs: "Loud for a pause that carries on by itself tomorrow.",
        },
        {
          id: "email",
          label: "The email carries it",
          means:
            "The send's place shows only a quiet Paused light; the email says what happened and carries the act.",
          gains: "Nothing in the app shouts: she hears once, where she'll act.",
          costs: "In the app, the light alone doesn't say what to do.",
        },
      ],
      recommended: "in-place",
      because:
        "Most stops carry on by themselves or need one press: the send's own place, in its light, says which.",
      overrule: "If a stop must never go unseen, the banner across the app.",
      after: { ask: "progress" },
      configs: [SCREEN],
    },
    {
      id: "done",
      label: "When it's done",
      question: "When the send is done, what should she see first?",
      where: ["Host", "The hub's album", "When it's done"],
      when: "All 1,284 files are in her Drive and checked, 26 minutes after she pressed Send.",
      matters:
        "It's where the feature earns its keep, and the natural moment to offer the way out.",
      lands:
        "What a finished send says and offers, on the album and in its email.",
      context:
        "Two frames: the album the moment the send finishes, then the email that says it's done.",
      options: [
        {
          id: "open-free",
          label: "Open in Drive, then free its room",
          means:
            "In your Drive, every one checked: Open in Drive leads, and a quieter line offers Free 7.4 GB from Partyreel.",
          gains: "Celebrates the send first; the way out is one press away.",
          costs: "The way out is easy to read past.",
        },
        {
          id: "free-first",
          label: "Free its room, first",
          means:
            "Leads with the way out: Everything's in your Drive. Free 7.4 GB from Partyreel? Open in Drive beside it.",
          gains: "The storage win is the headline you described.",
          costs:
            "Asks about deleting her wedding the moment she wanted to look at it.",
        },
        {
          id: "done-only",
          label: "Done here, freeing in storage",
          means:
            "Done, every one checked, Open in Drive; freeing its room lives only in What's using space.",
          gains: "No delete is ever suggested in the moment.",
          costs: "The easy delete you liked is no longer easy to find.",
        },
      ],
      recommended: "open-free",
      because:
        "She looks first, then frees: the way out one quiet press away, never the headline over her wedding.",
      overrule:
        "If the storage win should be the headline, free its room first.",
      configs: [SCREEN],
    },
    {
      id: "exit",
      label: "Freeing its room",
      question: "When she frees the album's room, where should the album go?",
      where: ["Host", "After the send", "Freeing its room"],
      when: "Maya presses Free 7.4 GB from Partyreel; Make room from Deleted is on, as it is by default.",
      matters:
        "It's the one step that deletes her wedding from Partyreel: it must be safe, and its storage win plain.",
      lands:
        "What freeing an album does after a fresh check of her Drive, and what her storage shows after.",
      context:
        "Three frames: the confirm once the app has checked every item the album holds (hidden, waiting and developing ones too) in her Drive, her storage chart after, and the confirm when the check finds a gap.",
      options: [
        {
          id: "to-deleted",
          label: "To Deleted, after a fresh check",
          means:
            "The app checks every item in her Drive again, then moves the album to Deleted: its 7.4 GB makes room for new uploads; it leaves for good in 30 days.",
          gains:
            "Safe from any bug for 30 days, and with Make room from Deleted on, the room is hers now.",
          costs:
            "Her storage counts it until it leaves; a smaller plan needs Delete for good.",
        },
        {
          id: "for-good",
          label: "For good, after a fresh check",
          means:
            "The app checks every item in her Drive again, then deletes the album for good: 7.4 GB free at once, no way back on Partyreel.",
          gains: "The plainest storage win: the bar drops and nothing waits.",
          costs: "If anything went wrong, Partyreel has no undo.",
        },
        {
          id: "choose",
          label: "She chooses, in the confirm",
          means:
            "The confirm offers both, Move to Deleted or Delete for good, each saying what it does to her storage.",
          gains: "She picks what fits: a smaller plan, or a careful keeper.",
          costs: "A choice at the moment she wanted one press.",
        },
      ],
      recommended: "to-deleted",
      because:
        "It follows a long send where a bug would cost a wedding; Deleted's 30 days cost her nothing with Make room from Deleted on.",
      overrule:
        "If freeing should mean freed today, for good after the fresh check.",
      after: { ask: "done" },
      configs: [SCREEN],
    },
    {
      id: "account",
      label: "The connection",
      question:
        "Where in Account should she see which Google account is connected, and end it?",
      where: ["Host", "Account", "Google Drive"],
      when: "Maya sent two albums last month and wants to see where they went, or to disconnect.",
      matters:
        "A connection to someone's Google account must be easy to find and easy to end.",
      lands:
        "Where Account shows the connection, what it says, and how Disconnect confirms.",
      context:
        "Two frames: Account with the connection under Plan, then Disconnect's confirm.",
      options: [
        {
          id: "card",
          label: "Its own card",
          means:
            "A Google Drive card under Plan: connected as maya@example.com, the Partyreel folder, what's been sent, Disconnect.",
          gains:
            "Everything about the connection in one place, its folder included.",
          costs: "A whole card for one connection.",
        },
        {
          id: "in-plan",
          label: "A line in the Plan card",
          means:
            "The Plan card, where storage lives, gains one line: Google Drive, maya@example.com, Disconnect.",
          gains: "Beside the storage it frees, and nothing new on the page.",
          costs: "The folder and what's been sent have no place.",
        },
        {
          id: "apps",
          label: "A Connected apps card",
          means:
            "A card listing every service connected to her account: Google Drive now, Dropbox when it comes.",
          gains: "Ready for Dropbox: one place for every connection.",
          costs: "A generic card for a single row today.",
        },
      ],
      recommended: "card",
      because:
        "Which account, where the files are and the way out belong together; Dropbox can join the card later.",
      overrule: "If Account should stay as short as it is, the line in Plan.",
      configs: [SCREEN],
    },
    {
      id: "naming",
      label: "Folder and file names",
      question:
        "How should the album's folder and files be named in her Drive?",
      where: ["Host", "Her Google Drive", "The album's folder"],
      when: "Maya opens the Partyreel folder in her Drive the day after the send.",
      matters:
        "Her Drive is where the album lives on: names decide whether it reads as her evening or a pile.",
      lands:
        "The folder and file names of every send, which stay in her Drive for good.",
      context:
        "One frame: the album's folder in her Drive as a list sorted by name and as a grid of pictures (a neutral stand-in: the app is Google's, the names are ours). We hold when each file reached the album and who sent it.",
      options: [
        {
          id: "when-who",
          label: "When it arrived, then who",
          means:
            "Partyreel › Maya & Jay · 12 Sep 2026 › 2026-09-12 21.14.05 · Priya.jpg: the evening in order, each file saying who sent it.",
          gains: "Sorts into the evening's order and names every guest.",
          costs:
            "A batch sent the next morning sorts by when it arrived, not when it was taken.",
        },
        {
          id: "by-guest",
          label: "A folder per guest",
          means:
            "Partyreel › Maya & Jay › Priya › 2026-09-12 21.14.05.jpg: each guest's files in a folder of their own.",
          gains: "Priya's photos are one folder away.",
          costs: "The evening is split across 31 folders.",
        },
        {
          id: "zip",
          label: "As the zip names them",
          means:
            "Partyreel › Maya & Jay › maya-and-jay-ab12cd34.jpg: the names Download's zip already gives.",
          gains: "One naming everywhere, and short names.",
          costs: "The names say nothing: not when, not who.",
        },
      ],
      recommended: "when-who",
      because:
        "Names that sort into the evening and say who sent each one read as the album, years from now.",
      overrule:
        "If finding one guest's photos matters most, a folder per guest.",
      configs: [SCREEN],
    },
  ],
});
