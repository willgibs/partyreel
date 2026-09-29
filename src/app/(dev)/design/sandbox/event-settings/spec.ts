import { defineExploration } from "@/components/lab/exploration";

import { PLAN, SCREEN } from "./screens";

/**
 * AN EVENT'S SETTINGS, FROM THE GROUND UP, ROUND ONE (Will, 2026-09-28).
 *
 * His words, on event-safety's `choose` (answered "?"): "I genuinely believe
 * our event settings are some of our ugliest, most unintuitive UI despite being
 * some of the most critical to handling events. Would prefer a dedicated
 * exploration into revamping how settings are designed from the ground up.
 * Should be made as streamlined as possible - nesting, disabled features, pro
 * locks, groups, UI design, everything." And his principle, from `room`: "we
 * only want to add configs where the potential friction offers real
 * benefit/value."
 *
 * ★ THE FIRST QUESTION IS THE STRUCTURE, AND TODAY IS ITS REFERENCE. Five
 * contenders hold the same settings: today's seven cards (drawn as they ship,
 * his answers worn), four groups in view, a sentence per group with its detail
 * one tap in, the settings read as sentences, and presets. Each is drawn twice,
 * as it opens and as a host pauses uploads mid-party (the one urgent change
 * every structure already holds), so the comparison is of the same act.
 *
 * ★ EVERYTHING ELSE IS STAGED BEHIND IT and drawn in whichever structure he
 * picks (the step hands the answer in): how a group opens (only if he picks
 * the sentences-per-group), what a setting with no effect shows, the one Pro
 * lock, and who can get in, which is event-safety's `choose` reshaped with the
 * four asks that waited on it (`waiting`, `queue`, `inside`, `editor`, ported
 * from `git show 69afdbc5`, their drawings copied here because that board
 * retires in `safety-wiring`).
 *
 * ★ HIS GROUND, WORN AND NEVER ASKED: the guest list is always on, so its
 * switch is gone (`room=always`); blocking lives on a person's look and the
 * Guests room's foot (`safety-wiring`); Free gains the password, the custom
 * link and 60-second reels, so videos are the only Pro lock left in settings
 * (his note on `choose`, `pricing-wiring`). His answered doors ride as carried
 * calls: `newcomer=same` and `unlisted=ask`. The closed screen's words are
 * `locked-door`'s; whether a newcomer is mailed is `emails.letin`'s; how a
 * disposable-camera event is picked is `disposable-mode`'s.
 *
 * ★ THE SWITCHES FORM OF `choose` LEFT WITH THE ROUND. Three switches of which
 * one at most is on is a single choice wearing three controls; the lane drew
 * the six-rung ladder in its place, and kept the two others (two choices, the
 * door in steps).
 */
export const EVENT_SETTINGS = defineExploration({
  id: "event-settings",
  title: "An event's settings",
  round: {
    n: 1,
    date: "2026-09-28",
    changed:
      "Settings from the ground up, on Maya and Jay's wedding: five structures graded against today's seven cards, each drawn as it opens and as she pauses uploads. Then how a group opens, a setting that does nothing yet, the one Pro lock, and who can get in with its four asks.",
  },
  context:
    "Your note on event-safety's choose asked for settings redesigned from the ground up, as streamlined as possible, and a setting only where its friction pays. Drawn over production with your answers worn: the guest list always on, the password and custom link free, videos the one Pro lock. Scroll inside a panel to read the whole of it.",
  carried: [
    {
      id: "phone-first",
      question: "Which screen is each structure judged on first?",
      taken:
        "A phone, where settings is its own screen and every row costs a scroll. 1440, the panel beside the album, is on every knob.",
      overrule:
        "Lead with 1440 if settings are desk work done before the party.",
    },
    {
      id: "saves",
      question: "When does a change save?",
      taken:
        "As it is made, a typed field when you leave it, and a switch that asks first still asks. No Save button, so no Discard changes.",
      overrule:
        "One Save pinned at the foot, if a host should see every change before guests meet it.",
    },
    {
      id: "one-line",
      question: "How much does a setting say?",
      taken:
        "One line each. The long explanations move into the confirm a consequential switch already opens.",
      overrule:
        "Keep today's paragraphs in view if a host deciding needs them there.",
    },
    {
      id: "size-cap",
      question: "Where does the size cap per upload go?",
      taken:
        "Under videos, on Pro alone: its smallest step is 25 MB, so on Free it caps nothing a photo reaches.",
      overrule:
        "Keep it on every plan if a host should be able to cap a large photo.",
    },
    {
      id: "held-on",
      question: "What does a switch another choice holds on look like?",
      taken:
        "On and still, its reason on the line under it: a list and letting people in both need a confirmed email.",
      overrule:
        "Fold it into the choice's own line, if a switch that cannot move should not be drawn at all.",
    },
    {
      id: "nothing-behind",
      question: "What stands behind a waiting door?",
      taken:
        "Nothing real: the ghost river a password page shows, never the album's photographs.",
      overrule:
        "Show the teaser behind it if a newcomer should see what she is waiting for.",
    },
    {
      id: "newcomer",
      question: "What does someone new meet when the album is closed to them?",
      taken:
        "Your newcomer=same: the closed screen a blocked person meets, word for word; its words are locked-door's.",
      overrule:
        "A door that says it is closed to new guests, at the cost of a blocked person's cover.",
    },
    {
      id: "unlisted",
      question: "What does someone not on the invite list meet?",
      taken:
        "Your unlisted=ask: Ask Maya to let me in, with Use a different email as the second action.",
      overrule: "The same closed door, if the list itself should stay secret.",
    },
  ],
  asks: [
    {
      id: "structure",
      label: "The structure",
      question:
        "How should an event's settings be organised, from the ground up?",
      context:
        "Settings is a panel beside the album at a desk and its own screen in a hand. Every structure holds the same settings, your answers worn; each is drawn as it opens and as Maya pauses uploads mid-party.",
      options: [
        {
          id: "today",
          label: "Today's seven cards, as they ship",
          means:
            "Details, Visibility & access and Guest uploads behind one Save, then the reel, your profile and the Danger zone, each saving itself.",
        },
        {
          id: "groups",
          label: "Four groups, every setting in view",
          means:
            "Who can get in, what guests can add, the reel and this event, one line a setting, in one scroll; Delete a quiet row at the foot.",
        },
        {
          id: "summary",
          label: "A sentence per group, its detail one tap in",
          means:
            "Four rows that each say where things stand in one sentence and open their own settings; the whole of it fits a phone's screen.",
        },
        {
          id: "sentences",
          label: "The settings, read as sentences",
          means:
            "Each group is a sentence whose words are its controls: tap 'anyone with the link' to change who gets in, 'can add photos' to pause.",
        },
        {
          id: "presets",
          label: "Start from a kind of event",
          means:
            "A party, a wedding or invite only, each setting the door and review at once; a pause beneath, and every setting under Adjust.",
        },
      ],
      recommended: "summary",
      because:
        "A host reads where everything stands in one screen and goes one tap deep only for what they came to change, the way a phone's own settings work. Every setting keeps a home, and nothing competes for the eye.",
      overrule:
        "If every setting should stay in view with nothing to open, the four groups; if the state should read as what happens, the sentences.",
      lands:
        "What the settings kind holds: event-settings-sheet.tsx and its sections regrouped, the form's one Save retired.",
      configs: [SCREEN],
    },
    {
      id: "opens",
      label: "How a group opens",
      question:
        "With a sentence per group, should a group open as its own page or in place?",
      context:
        "Tapping a row opens its group. As its own page it slides in under a back arrow, the way a phone's settings go deeper; in place it opens under its sentence while the other rows stay.",
      options: [
        {
          id: "page",
          label: "Its own page, with a back arrow",
          means:
            "The group fills the panel, or the screen in a hand, and Back returns to the four sentences.",
        },
        {
          id: "inplace",
          label: "In place, under its sentence",
          means:
            "The row grows into its settings with the other three above and below it, one open at a time.",
        },
      ],
      recommended: "page",
      because:
        "A group's settings then start at the top of a clean page with nothing above them, and Back is a gesture a phone already knows. In place, a long group pushes the other three off the screen.",
      overrule:
        "If a host should never lose sight of the other groups, in place.",
      lands:
        "Whether the settings popup gains a second level with its own back arrow, at a desk and in a hand.",
      after: { ask: "structure", option: "summary" },
      configs: [SCREEN],
    },
    {
      id: "idle",
      label: "A setting that does nothing yet",
      question: "When a setting has no effect right now, how should it show?",
      context:
        "With the reel off its look and hold do nothing, and with uploads paused A photo first does nothing. Both cases are drawn side by side, in the structure you pick.",
      options: [
        {
          id: "hidden",
          label: "Gone until it applies",
          means:
            "The look and hold leave with the reel, A photo first while uploads are paused; each returns with the switch that gives it meaning.",
        },
        {
          id: "greyed",
          label: "Greyed, with its reason",
          means:
            "They stay where they are, dimmed and still, with one line saying what brings them back.",
        },
        {
          id: "live",
          label: "Live, with a note, as today",
          means:
            "They stay live so a host can set them for later, one line saying when they apply: today's way.",
        },
      ],
      recommended: "hidden",
      today: "live",
      because:
        "A setting that does nothing is a question the host did not ask, and it comes back beside the switch that gives it meaning, where it would be looked for. Settings stay as short as their state allows.",
      overrule:
        "If a host should set the reel's look before turning it on, live with a note.",
      lands:
        "One rule for every setting another one switches off: the reel's look and hold, A photo first, the door's steps under Only you.",
      after: { ask: "structure" },
      configs: [SCREEN],
    },
    {
      id: "lock",
      label: "The one Pro lock",
      question:
        "With videos the one thing settings locks on Free, how should that lock show?",
      context:
        "Your pricing shift leaves videos, storage past 100 MB, more events and no watermark as Pro's, and only videos lives in settings. Drawn for Maya on Free; the Plan knob shows the same place on Pro.",
      options: [
        {
          id: "chip",
          label: "Today's lock chip, on its own row",
          means:
            "Video uploads with the chip that names Pro and opens the plans; on Pro the row says Photos and video.",
        },
        {
          id: "switch",
          label: "A Videos switch that opens the plans",
          means:
            "Videos is a switch like the rest: on Free a press opens the plans, on Pro it works, so a host can keep an album to photos.",
        },
        {
          id: "line",
          label: "One quiet line, gone on Pro",
          means:
            "Under what guests can add: Videos come with Pro, and a link to the plans. On Pro nothing is said; videos just work.",
        },
      ],
      recommended: "line",
      today: "chip",
      because:
        "The lock reads as a fact with a door beside it rather than a control a host cannot use, and a Pro host meets no row that does nothing, while the upgrade is still named where guests' uploads are decided.",
      overrule:
        "If every lock should stay the one chip, today's; if a Pro host should be able to turn videos off, the switch.",
      lands:
        "How settings shows videos on Free and on Pro, and whether LockChip keeps its settings row.",
      after: { ask: "structure" },
      configs: [SCREEN, PLAN],
    },
    {
      id: "join",
      label: "Who can get in",
      question: "How should a host choose who can get in to the album?",
      context:
        "Your three closed doors join Public, Password and Private: approve newcomers, close to newcomers and an invite list, all free, everyone already in staying in. A list and approving need a confirmed email.",
      options: [
        {
          id: "ladder",
          label: "One choice of six, open to closed",
          means:
            "Anyone with the link, with the password, your list, people you let in, only people already in, only you: one pick, its line saying what a guest meets.",
        },
        {
          id: "two",
          label: "Who can see, then who can join",
          means:
            "Public, Password or Private as today, and under it a second choice: anyone, approve newcomers, closed to newcomers or an invite list.",
        },
        {
          id: "steps",
          label: "The door, step by step",
          means:
            "Numbered in the order a guest meets them: what the link opens, who may join, an email first, a photo first.",
        },
      ],
      recommended: "ladder",
      because:
        "The six are one state, never two at once: a password adds nothing to a list, and Only you outranks them all. The host answers the question they already ask, who can get in, once, with nothing to reconcile.",
      overrule:
        "If a password and approving newcomers should work together, two choices keep them apart.",
      lands:
        "One choice in settings over the visibility column and a new join mode, the email switch held on where a mode needs it.",
      after: { ask: "structure" },
      configs: [SCREEN],
    },
    {
      id: "waiting",
      label: "Waiting at the door",
      question:
        "When a host lets newcomers in one by one, what should a newcomer see while she decides?",
      context:
        "A newcomer confirms an email, then waits until the host lets her in or turns her away, which is a block. Nothing real shows behind a waiting door; whether she is mailed is emails' question.",
      options: [
        {
          id: "held",
          label: "The lit door waits, and opens itself",
          means:
            "The door she confirmed in says Maya will let her in, and opens onto the album the moment she does, from the same sheet.",
        },
        {
          id: "page",
          label: "A waiting page, the closed door's family",
          means:
            "A plain page like the private album's says Maya has been asked, and opens onto the album the moment she decides.",
        },
      ],
      recommended: "held",
      because:
        "The newcomer is standing in the door, having just confirmed an email in it; waiting there and opening from it keeps one place, where a page is a jump to a screen that has to learn to open.",
      overrule:
        "If every not-yet screen should share the closed door's page, the waiting page keeps that family whole.",
      lands:
        "What a newcomer holds while the host decides, and that it opens by itself.",
      after: { ask: "join" },
      configs: [SCREEN],
    },
    {
      id: "queue",
      label: "Letting newcomers in",
      question: "Where should a host let newcomers in, or turn them away?",
      context:
        "Newcomers wait with a confirmed address. Letting one in opens her door; turning her away blocks her. The hub has to say someone is waiting.",
      options: [
        {
          id: "room",
          label: "At the head of the Guests room",
          means:
            "An At the door section above the guests, Let in and Decline on each row; the hub's Guests card counts who waits.",
        },
        {
          id: "review",
          label: "In Review, beside held uploads",
          means:
            "Newcomers wait above the new-photos line and the grid, one count on its card; the arrows, Enter and Backspace reach photos only.",
        },
        {
          id: "hub",
          label: "A strip on the event's hub",
          means:
            "A line above the album names who is waiting, with Let in right there and Decline behind See all.",
        },
      ],
      recommended: "room",
      because:
        "The room is where the host already sees every person, their address and Block, and letting someone in is the same kind of act as blocking someone.",
      overrule:
        "If a host already works through Review on a moderated event, one queue for everything waiting beats two rooms to check.",
      lands:
        "Where newcomers wait for the host, and which hub card counts them.",
      after: { ask: "waiting" },
      configs: [SCREEN],
    },
    {
      id: "inside",
      label: "Who is already in",
      question:
        "When a host closes to newcomers, how should they see who is already in?",
      context:
        "Already in means everyone past the door, including people who have not added a photo and so are on no list or count. They keep adding; nobody new can join.",
      options: [
        {
          id: "sentence",
          label: "A sentence, no number",
          means:
            "Everyone already in keeps adding, nobody new can join. The guest count stays the only number.",
        },
        {
          id: "count",
          label: "A count of who is in",
          means:
            "31 people are in, 8 have added photos: a second number, for everyone past the door.",
        },
        {
          id: "list",
          label: "The room lists who hasn't added yet",
          means:
            "Below the guests, In with no photos yet, so the host sees everyone the closed door still lets through.",
        },
      ],
      recommended: "sentence",
      because:
        "A guest is someone who added a photo and every count says that one number; a door count would be the first place the product reads a door ticket as attendance.",
      overrule:
        "If a host closing mid-party needs to know how many can still add, the count is the only honest answer.",
      lands:
        "Whether closing to newcomers shows a second number, and whether the room ever lists people with no photos.",
      after: { ask: "join" },
      configs: [SCREEN],
    },
    {
      id: "editor",
      label: "The invite list",
      question: "How should a host put addresses on the invite list?",
      context:
        "With an invite list, listed addresses come straight in and anyone else can ask. A wedding's list can run to two hundred, usually already kept somewhere else.",
      options: [
        {
          id: "one",
          label: "One at a time",
          means:
            "A field and Add; each address becomes a row with its own remove.",
        },
        {
          id: "paste",
          label: "A box to paste them all",
          means:
            "A box that takes a pasted column or a comma list, then shows what it found and what it could not read.",
        },
        {
          id: "both",
          label: "One field that takes either",
          means:
            "Type one and press Enter, or paste two hundred and they land as chips, the unreadable ones flagged.",
        },
      ],
      recommended: "both",
      because:
        "A host adds a latecomer one at a time and a whole list from a spreadsheet once; one field that takes both needs no mode and no second control.",
      overrule:
        "If a list is pasted once and rarely touched, the paste box says what it found more plainly.",
      lands: "How addresses reach the list, and how a bad one is shown.",
      after: { ask: "join" },
      configs: [SCREEN],
    },
  ],
});
