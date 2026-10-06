import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * A HOST'S PARTY, FOUR MOMENTS (the host-moments-r1 track, cut 2026-10-06).
 *
 * The calls lab's round 15 settled four moments of a host's run of her party
 * in text on 2026-10-04, and they were built that way: a password added to an
 * album guests are already in (B1), a develop time added mid-party (Q6),
 * declining and letting back in at the door (B2), and being over her plan
 * with a goal (L3). This board asks each again as a picture: production's
 * built answer is one option (`today`), drawn on production's own components
 * (the door page, How guests add, the Guests room, the dashboard, the storage
 * list), beside real alternatives.
 *
 * ★ EVERY FRAME IS PRODUCTION'S PAGE, AND AN OPTION CHANGES ONLY ITS PIECE: a
 * candidate hides production's one line or strip in the frame and grafts its
 * own in that place (`scene.tsx`'s `Graft`), so the rest of every frame is
 * production's pixel for pixel. A frame presses production's own control
 * where the moment is mid-press (`Press`).
 *
 * ★ STAGED: the guests' side of a develop time waits on what Maya is told
 * (one answer there keeps the rolls, and the guests' moment is then moot).
 *
 * ★ ASKS NOTHING event-header r6 or brand r2 ask: the hub's doors and the
 * colour of what needs her are theirs, so every frame wears today's.
 */
export const HOST_MOMENTS = defineExploration({
  id: "host-moments",
  title: "A host's party, four moments",
  surface: "host",
  desk: 40,
  lives: [
    "docs/systems/host-app.md",
    "docs/systems/disposable-mode.md",
    "docs/systems/billing-caps.md",
    "src/components/app/event-settings/door-page.tsx",
    "src/components/app/event-settings/camera-settings.tsx",
    "src/app/(app)/dashboard/[eventId]/guests/at-the-door.tsx",
    "src/components/app/event-blocks/blocked-section.tsx",
    "src/components/app/dashboard/grace-banner.tsx",
    "src/components/app/storage/goal-strip.tsx",
    "src/components/guest/camera/camera-screen.tsx",
  ],
  tracks: ["host-moments-r1"],
  round: {
    n: 1,
    date: "2026-10-06",
    changed:
      "A new board: four moments of a host's party, settled in words on Oct 4 and built that way, now drawn as pictures with production's answer beside real alternatives.",
  },
  context:
    "Maya & Jay's wedding, tonight at 9:40 pm: 31 guests in, 3 waiting at the door, the album's camera on a roll of 24. Then the month after, when Maya stores 105.3 GB on Pro 100 GB. Every frame is production's page at 1440 or 375 (the Screen knob); a guest's frames are a phone's.",
  opening: {
    about:
      "Four moments of a host's party, built from words on Oct 4: a password mid-party, a develop time mid-party, declining at the door, and being over her plan.",
    settled: [
      "Guests already in stay in when a gate goes on: a gate stops newcomers only.",
      "A develop time mid-party starts a new period: what's already shown stays shown, and every guest's roll counts again from it.",
      "Let back in never brings anyone's uploads back unless she turns it on.",
      "Freeing room deletes for good; the size list counts what she stores, Deleted included.",
    ],
    earlier: [
      "The calls lab's round 15 (Oct 4) settled these in words; the Advisor thought a host would not expect every roll to refill.",
      "Your direction since round 13: immediate, or a clear state and a way to stop it; delight where it costs nothing in clarity.",
    ],
  },
  terms: [
    {
      term: "At the door",
      means:
        "The head of the Guests room: newcomers who confirmed an email and wait for Maya to let them in.",
    },
    {
      term: "Let back in",
      means:
        "The act on the Blocked list, at the foot of the Guests room, that lifts a block.",
    },
    {
      term: "roll",
      means:
        "A guest's shots on the album's camera, 24 here; each period of a develop starts it again.",
    },
    {
      term: "develop time",
      means: "When everything shot on the camera shows, to everyone at once.",
    },
    {
      term: "What's using space",
      means:
        "The size list: everything she stores, largest first, with a goal counting down to her plan.",
    },
  ],
  asks: [
    {
      id: "password",
      label: "A password, guests in",
      question:
        "When Maya puts a password on an album guests are already in, what should she read before she sets it?",
      where: ["Host", "Settings, Who can get in", "Choosing A password"],
      when: "9:40 pm: the door is You let each person in, 31 guests are in and 3 wait at the door, and Maya picks A password.",
      matters:
        "A gate going on mid-party is the moment a host worries she is locking her own guests out.",
      lands:
        "What every door change to a password says, before the field, whenever anyone is in or waiting.",
      context:
        "One frame: production's Who can get in page with A password just picked, its field open. Today it says the waiting line on the field and the already-in note under the gates; each other option says it in their place.",
      options: [
        {
          id: "today",
          label: "As today: the waiting line, the inside note",
          means:
            "On the field: 3 people are waiting at the door, a password asks them for it too; under the gates: 31 guests are already in, a gate stops newcomers.",
          gains: "Both facts are there, each beside what it is about.",
          costs:
            "The two halves sit apart: the one she fears, the guests in, is under the list, away from the field.",
        },
        {
          id: "both",
          label: "Both groups, said at the field",
          means:
            "Two lines where she types it: 31 are in and stay in, on every phone; 3 at the door stop waiting on you and get in with it.",
          gains:
            "Reassurance and consequence in one place, read before she types.",
          costs: "Two lines taller than today's one.",
        },
        {
          id: "picture",
          label: "What each group meets, pictured",
          means:
            "Two small pictures at the field: the album for the 31 in, the password screen for the 3 at the door.",
          gains: "Seen at a glance, with no sentence to parse.",
          costs:
            "A drawing in Settings, and the password screen pictured small is a stand-in.",
        },
      ],
      recommended: "both",
      today: "today",
      because:
        "The worry is the guests already in; saying both groups at the field answers it where she acts.",
      overrule: "If Settings should stay as short as it is, today's two lines.",
      configs: [SCREEN],
    },
    {
      id: "tell",
      label: "A develop time, told",
      question:
        "When Maya adds a develop time mid-party, what should she be told before it saves?",
      where: ["Host", "Settings, How guests add", "Choosing At a develop time"],
      when: "9:40 pm: guests have shot most of their 24 on the album's camera, every shot showing at once, and Maya picks At a develop time.",
      matters:
        "Every guest's roll starts again at 24: a host who doesn't expect it hears it from her guests.",
      lands:
        "What adding a develop time to a running camera says first, and whether a guest's roll can carry on.",
      context:
        "One frame: production's How guests add, Customize open (the camera, showing right away), the moment she picks At a develop time. Today it saves at once; the others ask first, Right away still standing.",
      options: [
        {
          id: "today",
          label: "As today: it saves, nothing said",
          means:
            "The develop time is set at once, tomorrow at 9:00 AM, and every roll refills without a word.",
          gains: "One press, immediate.",
          costs: "Her guests learn about the fresh rolls before she does.",
        },
        {
          id: "line",
          label: "The consequence line, then save",
          means:
            "A line under the choice, as every consequential change has: every roll starts again at 24, developing tomorrow at 9:00 AM. Start fresh rolls, or keep it.",
          gains:
            "No surprise, in the pattern Settings already uses for a change that reaches people.",
          costs: "One more press.",
        },
        {
          id: "choose",
          label: "Fresh rolls, or carry on",
          means:
            "The line offers both: fresh rolls of 24, or each guest carries on with what's left of theirs.",
          gains: "She decides, and a short night keeps its roll's scarcity.",
          costs:
            "A choice mid-party, and carrying on needs a database change to how a roll counts.",
        },
      ],
      recommended: "line",
      today: "today",
      because:
        "A refill that reaches every guest is a consequence; Settings says those first, and fresh rolls is the generous answer.",
      overrule:
        "If a roll's scarcity matters more than one more press, fresh rolls or carry on.",
      configs: [SCREEN],
    },
    {
      id: "fresh-roll",
      label: "A fresh roll, seen",
      question:
        "When their rolls refill, what should Maya's guests see on the camera?",
      where: ["Guest", "The album's camera", "After a develop time is added"],
      when: "Priya had 5 shots left; Maya added a develop time, and Priya opens the camera again.",
      matters:
        "A count that jumps from 5 to 24 with no word reads as a fault, and her guests can't ask anyone.",
      lands:
        "What the camera says once, the first time a guest opens it on a fresh roll.",
      context:
        "Two phone frames: Priya's camera at 9:35 pm (5 left, every shot straight in), then the next time she opens it, on a fresh roll that develops tomorrow at 9:00 AM.",
      options: [
        {
          id: "today",
          label: "As today: the count says it",
          means:
            "24 left, and the line under the name says Develops tomorrow at 9:00 AM.",
          gains: "Nothing in her way.",
          costs: "A jump from 5 to 24 with no reason given.",
        },
        {
          id: "line",
          label: "One line under the shutter",
          means:
            "Where the camera's hint stands, once: A fresh roll: Maya set a develop time.",
          gains: "Says why, in the camera's own quiet voice.",
          costs: "Easy to miss under the shutter.",
        },
        {
          id: "panel",
          label: "A fresh roll, said over the picture",
          means:
            "Once, over the finder, in the roll-done panel's shape: A fresh roll, why, when it develops, and Start shooting.",
          gains: "A small delight, and nobody wonders where their shots went.",
          costs: "One press before her first shot.",
        },
      ],
      recommended: "panel",
      today: "today",
      because:
        "A fresh roll is good news; said once, over the picture, it reads as a gift instead of a glitch.",
      overrule:
        "If nothing should stand between a guest and the shutter, the line.",
      after: { ask: "tell" },
      tile: "phone",
    },
    {
      id: "decline",
      label: "Declining at the door",
      question: "When Maya declines someone at the door, what should it do?",
      where: ["Host", "The hub's Guests room", "At the door"],
      when: "9:40 pm: Dev Kapoor, whom neither of them knows, asked 2 minutes ago, and Maya presses Decline.",
      matters:
        "A decline is a no to a person; whether he can ask again decides how a stranger at the door ends.",
      lands:
        "What Decline does at every At the door, and the door a declined newcomer meets.",
      context:
        "Two frames: the Guests room the moment after (or, for the choice, the moment of it), then what Dev meets on his phone.",
      options: [
        {
          id: "block",
          label: "As today: Decline is a block",
          means:
            "He meets the closed album and can't ask again; the toast says so, with Undo, and he waits under Blocked for Let back in.",
          gains:
            "A stranger at the door ends with one press, and never asks again.",
          costs: "A guest declined by mistake can't ask twice.",
        },
        {
          id: "again",
          label: "Decline is a no for now",
          means:
            "He meets Not this time and can ask once more; Block stays on his name in Guests.",
          gains: "Kinder to a real guest she didn't recognise.",
          costs: "A stranger can ask again, mid-party.",
        },
        {
          id: "choose",
          label: "She chooses: Not now or Block",
          means:
            "Decline opens a choice in the row: Not now (he can ask once more) or Block (he can't).",
          gains: "Says what each does, the moment she decides.",
          costs: "Two presses for every no.",
        },
      ],
      recommended: "block",
      today: "block",
      because:
        "At a party the door's no is final; Undo covers the slip, and Let back in the second thought.",
      overrule: "If a no should leave room for a real guest, she chooses.",
      configs: [SCREEN],
    },
    {
      id: "let-back",
      label: "Letting back in",
      question:
        "When Maya lets someone back in, how should she learn where they land?",
      where: ["Host", "The hub's Guests room", "Blocked"],
      when: "Twenty minutes later Jay says Dev is his cousin; Maya presses Let back in under Blocked.",
      matters:
        "Let back in can mean in, or back at the door: a host who expects in and gets the door thinks it broke.",
      lands:
        "What Let back in says and does for a declined newcomer and for someone who was in.",
      context:
        "Two frames: Blocked as she reaches Let back in (with Ray, blocked earlier, who was in), then the room and what it told her.",
      options: [
        {
          id: "today",
          label: "As today: the confirm says it",
          means:
            "A confirm: They'll be back at the door, and you can let them in from there; then the toast, back at the door.",
          gains: "Said before it happens, in a sentence.",
          costs:
            "Two presses to the door, then Let in again: three to get him in.",
        },
        {
          id: "row",
          label: "Each row says where they land",
          means:
            "The row says it before any press (back at the door; straight back in); one press lifts it, and the toast offers Let in now.",
          gains: "No confirm, and the outcome is in sight before she presses.",
          costs: "A line more on every blocked row.",
        },
        {
          id: "straight",
          label: "Let back in lets him in",
          means:
            "For a declined newcomer the act is Let in: one press, and the album opens for him where he waits.",
          gains: "The words mean what she wants: in.",
          costs:
            "A database change: lifting a decline would let him in, not back to the door.",
        },
      ],
      recommended: "straight",
      today: "today",
      because:
        "Undoing a decline means yes: one press that lets him in is the outcome she's asking for.",
      overrule:
        "If lifting a block should never open the album by itself, each row says where they land.",
      after: { ask: "decline" },
      configs: [SCREEN],
    },
    {
      id: "banner",
      label: "Over her plan",
      question:
        "When Maya is over her plan, what should the dashboard's banner say, and where should it lead?",
      where: ["Host", "Dashboard", "Over her plan"],
      when: "The month after: 105.3 GB on Pro 100 GB, 1.8 GB of it in Deleted, and until November 5 to fit.",
      matters:
        "It's the one place that says her photos are at risk; it must say how much, by when, and lead to the fix.",
      lands:
        "The over-plan banner's words and keys, and what the size list opens on.",
      context:
        "Two frames: her dashboard with the banner, then where its main key leads, the size list (production's, on her plan's cap).",
      options: [
        {
          id: "today",
          label: "As today: two links in a sentence",
          means:
            "You're over your storage limit; upgrade or free up space by November 5, with See plans or see what's using space as links in the line.",
          gains: "Calm words, both ways out named.",
          costs: "No number, and the two ways out are links inside a sentence.",
        },
        {
          id: "number",
          label: "The number, and one key",
          means:
            "5.3 GB over Pro 100 GB; free it by November 5. Free 5.3 GB opens the list counting down that same number; See plans beside it.",
          gains: "The banner and the list say one number.",
          costs: "A key that says Free 5.3 GB still asks her to choose.",
        },
        {
          id: "sweep",
          label: "What would go, named",
          means:
            "On November 5 we'll make room: Deleted (1.8 GB), then your 3 largest videos. Choose instead opens the list with those 3 picked.",
          gains:
            "The plainest truth, and a list that starts from the sweep's own pick.",
          costs: "The most alarming words on her dashboard.",
        },
      ],
      recommended: "number",
      today: "today",
      because:
        "A number she can act on, the same one the list counts down: no alarm, no hunting.",
      overrule:
        "If she should see exactly what goes, name it, and start the list from the sweep's pick.",
      configs: [SCREEN],
    },
    {
      id: "goal",
      label: "The goal, as she frees",
      question: "As Maya chooses what goes, how should the goal read?",
      where: ["Host", "What's using space", "Choosing what goes"],
      when: "Maya opened the list from the banner, 5.3 GB over, and picks her largest videos one by one.",
      matters:
        "The goal is what tells her she is done: it should read at a glance, and end clearly.",
      lands:
        "The size list's goal strip, whenever her own plan is what she's freeing room for.",
      context:
        "Two frames: the list with two videos picked (2.6 GB), then with enough picked to fit. Today it is production's strip; each other option draws its own in that place.",
      options: [
        {
          id: "today",
          label: "As today: what's left to free",
          means:
            "2.7 GB left to free to fit your plan, over a bar that fills as she picks; Enough selected at the end.",
          gains: "One number, counting down to done.",
          costs: "The plan itself is never drawn: only the gap.",
        },
        {
          id: "line",
          label: "Her plan's line, drawn",
          means:
            "What she stores as a bar with her plan's line across it; the part past the line shrinks as she picks, and Fits once these go.",
          gains:
            "The same picture as her storage ring, and where she stands under it.",
          costs: "A bar to read beside the number.",
        },
        {
          id: "sweep",
          label: "What the deadline would take",
          means:
            "2.7 GB to go; otherwise on November 5: Deleted, then 1 of your largest videos. It shrinks to Nothing of yours goes.",
          gains: "Says why it matters at every step.",
          costs:
            "The deadline's threat stays on screen the whole time she works.",
        },
      ],
      recommended: "line",
      today: "today",
      because:
        "Drawing her plan's line shows the goal and the finish in one picture, the one her storage ring already uses.",
      overrule: "If one number reads fastest, today's countdown.",
      configs: [SCREEN],
    },
  ],
});
