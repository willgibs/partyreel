import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * CREATE, ROUND THREE: THE ADD STEP, A SECOND TIME (his r2 note on `add`,
 * 2026-10-03): "These are all presented well already. This is really tough for
 * me to decide, so let's run a second exploration so I can pick from an even
 * more polished option set. Really important we can cleanly (yet beautifully)
 * nail the distinction for hosts here, without overcomplicating or decision
 * paralysis."
 *
 * ★ ONE DECISION, IN THE ROOM AS WIRED. His other r2 picks are production now
 * (`wizard-wiring`, merged at feca808e: the room, `flow=carry`, `look=places`,
 * `beat=develop`), so every frame is that room itself: production's head, its
 * question, its foot, its carry, its name, its look and its beat, with only
 * the add step's centre drawn here (`add.tsx`), and its own carry (the pick
 * dropping into its hairline, which `carry.ts` left to this round).
 *
 * ★ IN THE-WAIT'S MODEL (`wait-wiring`, beside this lane): Settings asks one
 * album style of three picture cards (Live, Reviewed, Disposable), the preset
 * is Disposable, approval never stands with a develop, and a guest meets every
 * wait as Developing. The add step is where a host meets that choice first,
 * so its names, its lines and its guests' screens are those words; one option
 * is Settings' own cards, so Create and Settings can speak one language.
 *
 * ★ THE OPTIONS PART ON TWO THINGS AT ONCE, because they are the real
 * answers: how many styles Create offers (the two experiences, Reviewed left
 * to Settings, or Settings' three) and how the night shows them (two phones,
 * three cards, one phone, or the night laid out). Each says in its one line or
 * its picture what a host gives up by picking it, and none asks her to read
 * more than a line to choose.
 *
 * Nothing here asks what another board asks tonight: the album styles, their
 * words and the guest's wait are `the-wait`'s (wired by `wait-wiring`), the
 * camera is `disposable-mode`'s, and the hub's head `event-header`'s.
 */
export const CREATE_WIZARD = defineExploration({
  id: "create-wizard",
  title: "The create wizard",
  surface: "host",
  desk: 60,
  lives: [
    "src/components/app/create-event-wizard.tsx",
    "src/components/app/create-event-wizard/",
    "src/app/(app)/dashboard/actions.ts",
    "src/components/app/event-settings/camera-settings.tsx",
    "docs/systems/host-app.md",
  ],
  round: {
    n: 3,
    date: "2026-10-03",
    changed:
      "From your round two note on how guests add: the add step a second time, more polished, in the room as it ships and in the-wait's words (Live, Reviewed, Disposable). Four ways to tell them apart, one of them Settings' own cards, each to try.",
  },
  history: [
    {
      n: 2,
      date: "2026-10-02",
      changed:
        "The room designed screen by screen in your layout. You picked each answer rising into the head, the code where guests meet it and the sample developing into her code, all wired now; how guests add came back for this round.",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Create redrawn whole for Maya & Jay's wedding. You picked a room of its own, the cards playing the night, and the code alone, lit.",
    },
  ],
  context:
    "Round three, one decision, for Maya & Jay's wedding: the add step in production's own room (its head, question, foot, carry, name, look and beat), between the name and the code's look. Each option opens on Try it, Create running from the add step; every press works. The guests' screens speak the-wait's words. Each caption counts the words a host reads.",
  opening: {
    about:
      "The add step again: how a host tells Live, Reviewed and Disposable apart and picks one, in the room as it ships, in the-wait's words.",
    settled: [
      "The room as wired: your layout, each answer rising into the head, the code where guests meet it, the sample developing into her code.",
      "Your night slider shows a style from guests arriving to the morning after; the add step stays right after the name.",
      "The-wait's words: Settings' album styles (Live, Reviewed, Disposable), Disposable the preset's name, every guest's wait Developing.",
      "Approval never stands with a develop: a disposable keeps only its develop time, standing under the pick where its control mounts.",
    ],
    earlier: [
      "On round two's add: 'These are all presented well already ... let's run a second exploration so I can pick from an even more polished option set.'",
      "'Really important we can cleanly (yet beautifully) nail the distinction for hosts here, without overcomplicating or decision paralysis.'",
      "On the-wait's Settings: 'the option 2 album styles settings design seems far superior - cleaner design/presentation, difference feels more clear'.",
      "Round two's other picks (carry, places, develop) are wired, so this round draws in them.",
    ],
  },
  terms: [
    {
      term: "the room",
      means:
        "Create as a screen of its own: the whole screen, dark, nothing of the app around it.",
    },
    {
      term: "album style",
      means:
        "Settings' one pick of a named album: Live, Reviewed (each let in by the host) or Disposable.",
    },
    {
      term: "Disposable",
      means:
        "The album's own camera, 24 shots each; everyone's photos develop at once, 9 am the next morning.",
    },
    {
      term: "night slider",
      means:
        "The track under the pictures that moves them from guests arriving, to the party, to the next morning.",
    },
    {
      term: "develop time",
      means:
        "When a disposable's photos open to everyone at once: 9 am the morning after, unless she moves it.",
    },
    {
      term: "Try it",
      means:
        "An option's first frame: Create itself, running, opening on the add step; every press works.",
    },
  ],
  carried: [
    {
      id: "question",
      question: "What does the add step ask, now its answer is an album style?",
      taken:
        "'Pick your album's style', Settings' own word, over 'Change it any time in Settings'; Reviewed is not a way to add, so r2's question no longer fits.",
      overrule: "'How will guests add photos?', as round two asked it.",
    },
    {
      id: "moments",
      question: "Does the night name clock times?",
      taken:
        "No: Arriving, The party and Next morning, so a morning-only or a two-day event reads as well as an evening's.",
      overrule: "8 pm, 10:40 pm and 9 am, as round two drew it.",
    },
    {
      id: "default",
      question: "Which style stands picked as the step opens?",
      taken:
        "Live, the album most hosts want and the schema's own default, so Continue alone keeps it.",
      overrule: "None: Continue waits until she picks one.",
    },
    {
      id: "drop",
      question: "What does Continue carry into the head from the add step?",
      taken:
        "The pick's own picture, dropping into its hairline as the look arrives, the way the name rises off the first step.",
      overrule: "Nothing: the hairline fills, as it does off the look.",
    },
  ],
  asks: [
    {
      id: "add",
      label: "How guests add, a second time",
      question:
        "How should the add step show Live, Reviewed and Disposable, so a host tells them apart at a glance and picks one?",
      where: ["Host", "Create an event", "Pick your album's style"],
      when: "Maya has named the wedding; before the code's look she picks her album style, which Settings shows again later.",
      matters:
        "One of an event's biggest choices, met here first: it has to read at a glance, with nothing to agonize over.",
      lands:
        "Create's second step: the album style the event is made with, its develop time, and the words Create shares with Settings.",
      context:
        "In the room as wired: Try it (Create from the add step, the night playing once; every press works), Disposable picked as guests arrive, then the morning. Settings' own cards add Settings on paper.",
      options: [
        {
          id: "pair",
          label: "Two phones, the night under both",
          means:
            "Live and Disposable as two phones side by side, each line saying what it gives up at that moment; Reviewed waits in Settings.",
          gains:
            "The two experiences seen at once, at every moment of the night.",
          costs:
            "Reviewed is met only in Settings, and at a phone each picture is about 150 px wide.",
        },
        {
          id: "styles",
          label: "Settings' three cards, the night in each",
          means:
            "Live, Reviewed and Disposable as Settings' own cards, the same picture and line each; the night slider moves every picture.",
          gains:
            "One language with Settings: the cards she picks here are the cards she meets there.",
          costs:
            "Three to weigh where two would compare, and each picture is smaller than a phone.",
        },
        {
          id: "one",
          label: "One phone, the three named over it",
          means:
            "One phone as large as the room allows, with Live, Reviewed and Disposable a switch over it and the night under it.",
          gains:
            "The largest picture and the least to look at, in Settings' names.",
          costs: "Never two side by side: comparing means switching.",
        },
        {
          id: "strip",
          label: "The night laid out, a row each",
          means:
            "Live and Disposable each a row of the night's three moments, one over the other; the whole row is the choice, nothing to drag.",
          gains:
            "Both whole nights seen at once, with nothing to press but the pick.",
          costs:
            "Six small pictures at a phone, and Reviewed waits in Settings.",
        },
      ],
      recommended: "styles",
      because:
        "Your pick in Settings, met first here: the same three cards and lines, the night showing the difference, so Create and Settings speak one language.",
      overrule:
        "If the step should compare only the two experiences at their largest, two phones side by side.",
      configs: [SCREEN],
    },
  ],
});
