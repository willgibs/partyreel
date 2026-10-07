import { defineExploration } from "@/components/lab/exploration";

import { GROUND, SCREEN } from "./knobs";

/**
 * THE SIGNATURE, ROUND ONE (the signature-r1 track, cut 2026-10-07 from brand
 * r2's pick, take = aperture): where Aperture's light lives across the APP,
 * surface by surface, each screen's one light placed, at rest and answering
 * what happens. The marketing half of the brief (the footer's edge, the
 * privacy hero's runners-up, a gradient word on marketing paper) waits for the
 * marketing round (Will's order to launch, 2026-10-07: the app first).
 *
 * ★ THE BRAND IS SETTLED; THIS BOARD PLACES IT. Afterglow's light (never
 * paint; from the photographs, then the event's seed, then the house ember)
 * drawn only as a Ring, a Seam or a Bloom, one to a screen, still until
 * something happens; Aperture's answer to paper: the light never touches a
 * light page, it lives in a piece of the room the page holds. What is left is
 * where each form stands and how it answers, which production answers today
 * with lamps side by side (the door's sheet, Create's floor) and a breath that
 * loops on the Add.
 *
 * ★ FIVE SURFACES, ONE QUESTION EACH, the guest's first: the album (where its
 * one light lives), the Add (how it rests and answers; drawn in the album's
 * answer, so it waits on it), the door's sheet, the camera while a clip rolls
 * and Create's room. The hub's Seam is event-header r6's, wired this wave: it
 * is drawn beside the guest's album as the host's cover, never asked. The
 * marks and tokens are brand-marks r1's, drawn as today.
 *
 * ★ EVERY FRAME IS PRODUCTION'S SURFACE: the cover, the shutter, the door's
 * sheet, the hub's cards, the camera's parts and Create's room are production's
 * components; an option draws only its light beside them (`light.tsx`), its
 * colour production's sampler's reads of the stills (`fixtures.ts`).
 */
export const SIGNATURE = defineExploration({
  id: "signature",
  title: "The signature",
  surface: "shared",
  desk: 8,
  lives: [
    "docs/systems/design-system.md",
    "src/components/ui/shutter.css",
    "src/components/guest/event-experience-head.tsx",
    "src/components/guest/door/lit.css",
    "src/components/guest/camera/camera.css",
    "src/components/app/event-feed/event-hub-head-seam.css",
    "src/components/app/create-event-wizard/room.tsx",
  ],
  round: {
    n: 1,
    date: "2026-10-07",
    changed:
      "A new board from your brand r2 pick: Aperture's light placed across the app, surface by surface, one light to a screen, at rest and answering what happens.",
  },
  opening: {
    about:
      "Where Aperture's light lives in the app, screen by screen: the album, the Add, the door, the camera and Create, one light each.",
    settled: [
      "Aperture is the brand (your brand r2 pick): light, never paint; from the photographs, then the event's seed, then the house ember.",
      "Drawn only as a Ring, a Seam or a Bloom, one to a screen, still until something happens.",
      "On paper the light never touches the page: it lives in a piece of the room, as bright as in the room.",
      "The hub keeps its Seam (event-header r6, wired this wave); the marks and tokens are brand-marks', drawn here as today.",
      "The marketing site's light waits for its own round, after the app (your order to launch).",
    ],
    earlier: [
      "Brand r2: you picked Aperture, light kept in pieces of the room, over Ink and Cast.",
      "Desk 4: 'Remember this should feel polished, not like a junior designer was told to build a rainbow app.'",
      "Desk 4: 'While afterglow looks effortlessly beautiful on dark UI, it is very tough to nail on anything light.'",
    ],
  },
  terms: [
    {
      term: "Ring",
      means:
        "The light round the Add, the one thing that adds a photograph; on paper it sits in a dark puck.",
    },
    {
      term: "Seam",
      means:
        "Light born where a photograph ends, in that edge's own colours, spent before any words.",
    },
    {
      term: "Bloom",
      means:
        "Light behind a screen's one live subject (the code, the picture), lit once and resting lit.",
    },
    {
      term: "house ember",
      means:
        "The light where there is no photograph and no seed: one warm glow, amber to coral, never a spectrum.",
    },
    {
      term: "piece of the room",
      means:
        "On paper, a dark thing the page holds (a puck, a plate, a strip), with the light inside it.",
    },
    {
      term: "envelope",
      means:
        "How a light answers a signal, as a voice meter does: quick to rise, slow to settle.",
    },
  ],
  carried: [
    {
      id: "face",
      question: "Does the Add's face change with its light?",
      taken:
        "No: production's face stays (white in the room, ink on paper); the icon and its puck are brand-marks'.",
      overrule: "Draw the Add as Aperture's dark disc inside its ring.",
    },
    {
      id: "ring",
      question: "What colour is the Ring in a new option?",
      taken:
        "The album's one key light, lit from the top-left; today's three hues sweeping round it read as the spectrum creeping back.",
      overrule: "Keep the album's three hues round the Ring.",
    },
    {
      id: "colour",
      question: "Where does each picture's colour come from?",
      taken:
        "Production's own reads: the cover's edge read live as the hub's is, the stills' sampled light; never a hue chosen by hand.",
      overrule: "Tune a light by eye where the read looks wrong.",
    },
    {
      id: "hub",
      question: "Does the hub get a question of its own?",
      taken:
        "No: its Seam is wired (event-header r6) and is its one light; it is drawn beside the guest's album at a laptop, as built.",
      overrule: "Ask the hub's light again beside the guest's.",
    },
  ],
  asks: [
    {
      id: "album",
      label: "The album's light",
      question: "On a guest's album, where does its one light live?",
      where: ["Guest", "The album", "At rest, then scrolled"],
      when: "She is through the door: the cover over Maya & Jay's album, then the album as she scrolls, the Add docked at its foot.",
      matters:
        "It is the screen a guest spends the night on, and the light says where to look first.",
      lands:
        "The guest's cover and the Add: whether the cover's foot is lit as the hub's is, and when the Add's Ring lights.",
      context:
        "Maya & Jay's album at a phone or a laptop (Screen), in the room or on paper (Ground): its first screen, the moment the Add docks, then scrolled in; at a laptop, the host's hub as built.",
      options: [
        {
          id: "ring",
          label: "The Add's Ring alone",
          means:
            "Today's placement: the cover ends on a clean edge, and the Ring round the docked Add is the album's one light.",
          gains:
            "The light always marks the act; the cover stays the photograph alone.",
          costs:
            "The first screen is unlit, and the guest's cover differs from the hub's.",
        },
        {
          id: "seam",
          label: "The cover's Seam alone",
          means:
            "The hub's own Seam under the guest's cover; the Add rests unlit and lights only while her photos send.",
          gains:
            "Guest and host covers share one light, born from the photographs.",
          costs:
            "Nothing is lit once she is in the album, and the first row starts lower.",
        },
        {
          id: "follow",
          label: "The Seam, then the Ring",
          means:
            "The hub's Seam while the cover is in view; once its foot has scrolled away, the light passes to the Add's Ring.",
          gains:
            "Every view holds exactly one light, where she is looking: the photograph, then the act.",
          costs:
            "The Add docks unlit while the Seam is still in view; the first row starts lower.",
        },
      ],
      recommended: "follow",
      today: "ring",
      because:
        "Every view keeps exactly one light: the photograph's edge at the top, the Add once she is in the album.",
      overrule:
        "If the first screen should be the photograph alone, the Ring; if the Add should rest quiet, the Seam.",
      configs: [SCREEN, GROUND],
    },
    {
      id: "add",
      label: "The Add, answering",
      question:
        "How does the Add's Ring rest, and how does it answer photos landing?",
      where: ["Guest", "The album", "The Add, at the foot"],
      when: "She is scrolled into the album: she adds three photos, they send and land, and the party keeps adding around her.",
      matters:
        "The Add is the light a guest sees most, so how it moves is most of how the brand moves.",
      lands:
        "The shutter's motion at rest, while files send, as they land, and whether other guests' photos move it.",
      context:
        "The album's foot at a phone, in the room or on paper (Ground), in your album answer: playing, then at rest, a photo landing, the run landed, a guest's photo; the trace under it is the glow over time.",
      options: [
        {
          id: "breath",
          label: "As today: a deep breath at rest",
          means:
            "Today's three hues breathe on a loop at rest, dim and fill round as her files send, then show a check as they land.",
          gains: "Built; the shutter always reads as ready.",
          costs:
            "A deep loop with nothing happening, which 'still until something happens' rules out.",
        },
        {
          id: "still",
          label: "Still, then lit once as they land",
          means:
            "Rests low and still; the light fills round as her files send, flares once as the run lands, and settles.",
          gains: "Aperture's own motion: light only when something happens.",
          costs: "A quiet album's Add never moves, so it can read as asleep.",
        },
        {
          id: "answer",
          label: "The envelope: each photo lifts it",
          means:
            "Rests low and still; each of her photos that lands lifts a halo round it at once, which settles over two seconds.",
          gains:
            "A run of twelve reads as twelve beats of light: the Add answers her.",
          costs: "A long run is lively, and a quiet album's Add never moves.",
        },
        {
          id: "party",
          label: "The envelope, on everyone's photos",
          means:
            "The same envelope, lifted by every photo landing in the album: hers fully, another guest's at less than half.",
          gains: "The Add glows while others add, inviting her in.",
          costs:
            "Lit most of a busy night, beside each arrival's own glow: two lights.",
        },
      ],
      recommended: "answer",
      today: "breath",
      because:
        "It answers each of her photos the moment it lands and is still otherwise: alive, never asking.",
      overrule:
        "If nothing may move at rest, Still; if the Add should carry the party's pulse, the envelope on everyone's.",
      after: { ask: "album" },
      configs: [GROUND],
    },
    {
      id: "door",
      label: "The door's light",
      question:
        "Where the door's sheet meets the album, what light does it carry?",
      where: ["Guest", "The door", "The sheet over the album"],
      when: "A new guest has scanned the code: the album waits blurred behind a held sheet asking her name, then her first photo.",
      matters:
        "It is the first light a guest ever sees, and today it is three lamps side by side.",
      lands:
        "The door's lamp, its pools and lit glyphs, on every sheet of the door's family, in both themes.",
      context:
        "The door's sheet over Maya & Jay's album, asking her name, then her first photo: from the foot at a phone, from the right at a laptop (Screen), in the room or on paper (Ground).",
      options: [
        {
          id: "lamps",
          label: "As today: three lamps along its edge",
          means:
            "Three of the album's hues as soft light along the sheet's free edge, drifting slowly; on paper the same, paler.",
          gains: "Built, and rich in the room.",
          costs:
            "Three hues side by side read as a spectrum, and on paper they wash out to pastel.",
        },
        {
          id: "seam",
          label: "One Seam at the album's edge",
          means:
            "The cover's own light, born where the album meets the sheet and rising into the album's dark; the sheet stays clean.",
          gains:
            "One light, from the photograph she is about to enter, the same in both themes.",
          costs: "Quieter than today's lamps, and it never touches the sheet.",
        },
        {
          id: "grows",
          label: "One Seam that grows with her steps",
          means:
            "The same Seam, short at her first step and reaching further at each step she clears, whole at her last.",
          gains:
            "The light answers her progress: the album's light reaches her as she nears it.",
          costs:
            "A one-step door shows it whole at once, and a step's change is subtle.",
        },
        {
          id: "none",
          label: "No light: the album behind is enough",
          means:
            "The sheet is plain; the blurred album through the scrim is the only colour on the screen.",
          gains: "The most restrained, with nothing to tune on paper.",
          costs:
            "The door loses its welcome glow, and the sheet reads as a form.",
        },
      ],
      recommended: "seam",
      today: "lamps",
      because:
        "One still light from the cover she is about to enter, never on the sheet, the same in the room and on paper.",
      overrule:
        "If the light should mark her progress, the Seam that grows; if the blurred album is welcome enough, none.",
      configs: [SCREEN, GROUND],
    },
    {
      id: "clip",
      label: "The camera, filming",
      question:
        "While a clip rolls in the album's camera, what light does the camera hold?",
      where: ["Guest", "The camera", "Filming a clip"],
      when: "She holds the shutter to film the toast: the clip rolls toward its length, the microphone open, or refused.",
      matters:
        "Nothing shows her the microphone is hearing the room; a refused one films silence and looks the same.",
      lands:
        "The camera while it films: what lights, and whether it follows the sound.",
      context:
        "The album's camera at a phone, filming the toast: four seconds in with the room loud, the same clip in a quiet moment, and a clip whose microphone was refused. The red face and ring stay in every option.",
      options: [
        {
          id: "red",
          label: "As today: the red ring alone",
          means:
            "The face turns red and a red ring fills to the clip's length; the time stands in the picture; nothing is lit.",
          gains: "A camera's own grammar, read at the thumb.",
          costs: "Nothing tells her the microphone hears anything.",
        },
        {
          id: "seam",
          label: "A Seam under the picture, with the sound",
          means:
            "Light born at the picture's foot rises with the room's sound and settles slowly; flat when the microphone is refused.",
          gains: "It answers a real signal honestly: no sound, no light.",
          costs: "A second thing moving while she films, short above the reel.",
        },
        {
          id: "bloom",
          label: "The picture lit round its edges",
          means:
            "The live picture glows in its own colours from the moment it rolls, lit once and resting, whatever the sound.",
          gains: "Unmistakable: the whole picture reads as recording.",
          costs:
            "It says nothing of the microphone, and light round the finder crowds it.",
        },
      ],
      recommended: "seam",
      today: "red",
      because:
        "It answers a real signal and tells the truth about the microphone, at the picture's edge where light belongs.",
      overrule:
        "If filming should stay a camera's red alone, as today; if recording should be unmistakable, the Bloom.",
    },
    {
      id: "create",
      label: "Create's room",
      question: "While a host makes her event, what lights Create's room?",
      where: ["Host", "Create", "Every step"],
      when: "A host makes her event: its name, its album's style, the code's look, then the code made real.",
      matters:
        "Create is a host's first room, and its light today is five lamps drifting at the floor on every step.",
      lands:
        "Create's light on every step, and how the code's Bloom arrives at the close.",
      context:
        "Create for Maya & Jay's wedding at a phone or a laptop (Screen): the name, the album's style with Live picked, and the close with her code made.",
      options: [
        {
          id: "field",
          label: "As today: the aurora at the floor",
          means:
            "Five lamps rise from the room's floor on a slow drift, dimmed at the close for the code's Bloom.",
          gains: "Built; the room always glows.",
          costs: "A spectrum and a loop, on every step.",
        },
        {
          id: "dark",
          label: "Dark until her code",
          means:
            "Every step still and unlit; the room's first light is the code's, lit once in the event's seed at the close.",
          gains:
            "The close becomes the payoff: her event's first light is its code.",
          costs: "The steps read plainer; their pictures carry them.",
        },
        {
          id: "chosen",
          label: "Her answer, lit",
          means:
            "The chosen style's card glows in its own photographs' light; the code is lit in the event's seed at the close.",
          gains: "The light follows her choices all the way to the code.",
          costs:
            "A light that moves with every pick, where the choice is already marked.",
        },
      ],
      recommended: "dark",
      today: "field",
      because:
        "Nothing competes with the code, so her event's first light is the code turning real.",
      overrule:
        "If the steps need warmth, her answer lit; if the room should always glow, as today.",
      configs: [SCREEN],
    },
  ],
});
