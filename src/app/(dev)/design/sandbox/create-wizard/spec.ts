import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * CREATE, ROUND FIVE: CREATE FINISHES THE EVENT, ITS CLOSE THE PAYOFF; THE STYLES TOLD APART WITHOUT THREE STORIES.
 *
 * His round four picks are production now (create-wizard-wiring): Disposable's own screen, the beat's one quiet line,
 * a failure held where she is. His two notes are this round's brief, and their wording is the point: the close felt
 * "only halfway done" (the "Get it ready" foot into Settings, the line's "Guests still need", the hub's checklist
 * meeting her "2 of 3"), and the style step asks her to hold "9 screens in your head" with "3 things happen at once".
 *
 * ★ THE HALFWAY IS PRESENTATION, NOT A MISSING SETTING (`readiness.ts`): Create already does every essential but the
 * code's first open, which Create can never do. So the close is asked as where the beat leads (into her event, through
 * an invite, through her first photos), and her event's first greeting as its own decision, one answer of which fixes
 * the readiness at its source (`done`), since PRD's core loop now says Create finishes the event.
 *
 * ★ EVERY FRAME IS PRODUCTION'S OWN ROOM, ATOMS AND PAGE (`create.tsx`, `hub.tsx`): the room's head, question and
 * foot, the carry, the steps, the beat's code and rounds, the hub's shell, cover, cards, checklist and album, all
 * imported; an option draws only what differs.
 *
 * Nothing here asks what another standing board asks: brand-marks r1 and signature r1 (the marks, the tokens, where the
 * light lives, so the beat's bloom and the hub's light stand as built), account-moments r2 (follow, the invitation on
 * her page), and a date in Create (the calls' X1 asks it; host-app.md's "The sole create path" holds that Create asks
 * none today).
 */
export const CREATE_WIZARD = defineExploration({
  id: "create-wizard",
  title: "The create wizard",
  surface: "host",
  desk: 60,
  lives: [
    "src/components/app/create-event-wizard.tsx",
    "src/components/app/create-event-wizard/",
    "src/components/app/event-feed/checklist.tsx",
    "src/components/app/event-uploads.tsx",
    "src/components/app/event-settings/camera-settings-style-picture.tsx",
    "src/lib/events/readiness.ts",
    "docs/systems/host-app.md",
  ],
  round: {
    n: 5,
    date: "2026-10-07",
    changed:
      "From your round four notes: Create's last screen drawn three ways as the payoff, each stepping into her event; how her event first greets her; and the styles told apart without three pictures moving at once.",
  },
  history: [
    {
      n: 4,
      date: "2026-10-06",
      changed:
        "The styles polished, and the beat's close, wait and failure drawn. You picked Disposable's own screen, one line under the code, the sample breathing as built and a failure held where she is; all wired.",
    },
    {
      n: 3,
      date: "2026-10-03",
      changed:
        "The add step a second time, in the room as wired and the-wait's words. You picked Settings' three cards, the night in each: wired since, as Review, Disposable's time under its card.",
    },
    {
      n: 2,
      date: "2026-10-02",
      changed:
        "The room designed screen by screen in your layout. You picked each answer rising into the head, the code where guests meet it and the sample developing into her code, all wired now.",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Create redrawn whole for Maya & Jay's wedding. You picked a room of its own, the cards playing the night, and the code alone, lit.",
    },
  ],
  context:
    "Round five, three decisions, for Maya & Jay's wedding, all in production's own room and her event's own page: where Create's last screen leads, how her event first greets her, and the styles' pictures. Each option stands at rest, then Try it, Create running from the moment asked: every press works and nothing is made. Each caption is read off its frame.",
  opening: {
    about:
      "Round five, from your round four notes: Create's last screen as the payoff, how her event first greets her, and the styles told apart calmly.",
    settled: [
      "Your round four picks are built: Disposable's own screen, one quiet line under the code, a failure held where she is.",
      "The beat's moment stays as built: the sample developing into her code, lit, and her event's name above it, live.",
      "Not asked here: the light, the marks and the tokens (brand-marks r1, signature r1), nor a date in Create (your calls' X1).",
    ],
    earlier: [
      "On the close: 'it felt weird to go through a create wizard, complete, then feel like you're only halfway done.'",
      "'Rather than shouting about what's done and what's to come, we should simply continue naturally guiding them through.'",
      "'Nailing this seamless creation and entry would be a huge win.'",
      "On the styles: 'kind of hard mental model to keep 9 screens in your head ... overwhelming seeing 3 things happen at once.'",
      "'Maybe one can play the live visual demo of the active selection, while the others stay still until selected.'",
    ],
  },
  terms: [
    {
      term: "the room",
      means:
        "Create as a screen of its own: the whole screen, dark, nothing of the app around it.",
    },
    {
      term: "the beat",
      means:
        "Create's last screen: her code developing into the real one, lit, the moment the event exists.",
    },
    {
      term: "the checklist",
      means:
        "The card at the head of her event's page saying what the event still needs before guests arrive.",
    },
    {
      term: "story",
      means:
        "A style's small album through three moments: guests arriving, the party, next morning.",
    },
    {
      term: "Try it",
      means:
        "A frame that is Create itself, running from the moment asked: every press works, nothing is made.",
    },
  ],
  carried: [
    {
      id: "kind",
      question:
        "Should Create ask what kind of party it is (a wedding, a birthday) to set its defaults and stock covers?",
      taken:
        "No: the name says it, and a kind would set little she does not pick a screen later; a step before the payoff costs more.",
      overrule:
        "A kind chip on the name screen, picking the style and the look's photograph.",
    },
    {
      id: "entry",
      question: "How does she step from Create into her event, whichever button takes her?",
      taken:
        "The room opens into it: the dark rises into her cover and her code flies to its place there. Under reduced motion, a cut.",
      overrule: "A plain change of page.",
    },
    {
      id: "album",
      question: "What does her event's empty album say, under every greeting?",
      taken:
        "The house's empty voice, your pick: 'The album starts with you', Add the first photos its one door.",
      overrule: "Production's 'No photos yet' and its line.",
    },
    {
      id: "close-x",
      question: "On the beat, what becomes of the head's close once the event exists?",
      taken:
        "Where the foot goes into her event it goes; where the foot does something else it stays, and on Add your first photos it reads Your event.",
      overrule: "It always stays an X, Go to your event.",
    },
  ],
  asks: [
    {
      id: "close",
      label: "Create's last screen",
      question:
        "Once her event is made, where should Create's last screen lead her?",
      where: ["Host", "Create an event", "Her code, made"],
      when: "Create event has made the wedding: her code stands lit, her event's name above it, live.",
      matters:
        "The payoff of all of Create: she should leave it excited and finished, never halfway done.",
      lands:
        "The beat's words and its one button, and how she steps from Create into her event.",
      context:
        "Each option: the beat made, where its button leads, her event as she lands (wearing the greeting you pick next), then Try it from the code's look: Create event, the beat, its button, her event.",
      options: [
        {
          id: "enter",
          label: "Into her event, her code carried there",
          means:
            "The beat's line says share it, under the question; Print and Share under her code; Go to your event opens the room into her event, her code flying to its place.",
          gains:
            "One press from the payoff into her event; her own code is the first thing she meets there.",
          costs:
            "Sharing stays a choice on the beat: she can walk in with her code unsent.",
        },
        {
          id: "invite",
          label: "Invite your guests, then in",
          means:
            "The beat is her code alone; Invite guests opens one screen: the message guests will get, Share, Copy link and Print, then Go to your event.",
          gains:
            "The one thing a new event lacks gets a focused screen; she leaves Create with it sent.",
          costs:
            "One more screen before her event, passed by every host who shares later.",
        },
        {
          id: "photos",
          label: "Her first photos, then in",
          means:
            "Print and Share under her code, and the album starts with you; Add your first photos sends a few of hers up, and she lands in her event with them in it.",
          gains:
            "Her event opens alive: her photos on its cover and in the album, the reel already playing.",
          costs:
            "Before the party many hosts have no photos, and the button becomes a step to skip.",
        },
      ],
      recommended: "enter",
      because:
        "Your note's own words, a seamless creation and entry: one press carries her code into her event, the share said as an invitation, never a debt.",
      overrule:
        "If the code's share should have a screen of its own before she leaves Create.",
      configs: [SCREEN],
    },
    {
      id: "arrival",
      label: "Her event's first greeting",
      question:
        "When she first lands in her event, what should the checklist at its head say?",
      where: ["Host", "Her event's page", "The first visit"],
      when: "Create has just made the wedding and she has stepped in: no photos yet, nobody has opened the code.",
      matters:
        "Whether her event reads made or half done: today it greets her with 2 of 3.",
      lands:
        "What a new event's checklist says and shows, and whether ready waits on the code's first open.",
      context:
        "Her event as she lands from Create, in the way you pick for Create's last screen, then Try it from the beat: its button, and the step into her event.",
      options: [
        {
          id: "list",
          label: "As built: the whole checklist",
          means:
            "Before guests arrive, 2 of 3 with its bar, then five rows: who can get in and what guests can add ticked, the code, the first photos, the welcome.",
          gains: "Everything ahead in one place, each row with the button that finishes it.",
          costs:
            "It greets a just-made event as unfinished: the halfway your trial run felt.",
        },
        {
          id: "share",
          label: "One line: share your code",
          means:
            "Ready still waits on the code's first open, but a new event's checklist is one line, share your code, said as the beat says it, with Invite and Print.",
          gains:
            "One warm next step, nothing to audit, and the code still counts until it is opened.",
          costs: "The date and the note are never offered here; they wait in Settings.",
        },
        {
          id: "done",
          label: "Ready for guests, the rest worth doing",
          means:
            "A new event counts as ready, since guests can get in and add; the code's share leads what is worth doing, and the checklist is one line, Ready for guests.",
          gains:
            "Her event and Create's last screen say the same thing: it is made, and ready.",
          costs:
            "Ready stops vouching that anyone has the code; the line's Invite is the nudge.",
        },
      ],
      recommended: "done",
      because:
        "Create finishes the event, yet ready waits on a scan Create can never make; fixed at the source, the beat and her event say one thing: made, and ready.",
      overrule:
        "If a new event should stay unready until someone has opened its code.",
      configs: [SCREEN],
    },
    {
      id: "previews",
      label: "The styles, told apart",
      question:
        "How should the three styles show, so she can tell them apart at a glance?",
      where: ["Host", "Create an event", "Pick your album's style"],
      when: "Maya has named the wedding; she picks Live, Review or Disposable before the code's look.",
      matters:
        "One of an event's biggest choices, met here first: today three pictures move through three moments together.",
      lands:
        "What each style's picture shows, when it moves, and whether the slider stays under them.",
      context:
        "Try it (the step as it opens; every press works), then Disposable picked; where a story plays, a still of it where Disposable looks least like Live. Disposable's own screen after it stays as built.",
      options: [
        {
          id: "built",
          label: "As built: all three move, a slider under",
          means:
            "Three cards, each a small album; the slider moves all three through arriving, the party and next morning, and they play once as the step opens.",
          gains: "Every style's whole story, side by side, at her hand.",
          costs:
            "Three pictures moving at once, nine to hold in mind, and two moments look alike.",
        },
        {
          id: "one",
          label: "The picked one plays, the others still",
          means:
            "Three cards resting on the moment they differ; only the picked card plays its story once, its moment named on it, then rests. No slider.",
          gains:
            "At rest the three compare on one moment; the one she picks shows its whole story.",
          costs:
            "A story shows only once picked: a host who keeps Live never sees Disposable develop.",
        },
        {
          id: "open",
          label: "The picked one opens, the others words",
          means:
            "Three rows of words; the picked row opens on its album, large, playing its story once, its three moments under it to stop on. No slider.",
          gains:
            "One album at a time, large enough to show its rhythm: one by one, let in, all at once.",
          costs: "Never side by side: comparing means picking each in turn.",
        },
        {
          id: "still",
          label: "One moment each, nothing plays",
          means:
            "Three cards standing still on the moment they differ: all in, all but the newest, only hers. No slider, no story; the lines carry the when.",
          gains:
            "The calmest: one look tells them apart, and nothing moves while she reads.",
          costs: "How each album ends is said, never shown, and the step loses its opening play.",
        },
      ],
      recommended: "one",
      today: "built",
      because:
        "At rest the three compare on the one moment they differ; only her pick moves, once, so nothing competes while she reads.",
      overrule: "If seeing each style's story should never wait on picking it.",
      configs: [SCREEN],
    },
  ],
});
