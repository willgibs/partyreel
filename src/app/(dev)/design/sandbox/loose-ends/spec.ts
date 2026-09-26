import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * SIX ROADMAP LOOSE ENDS, EACH A DECISION (the loose-ends track, cut 2026-09-18).
 *
 * Six one-liners the ROADMAP could not be picked from, each drawn on its own
 * real surface: the admin chart ramp's cast (light and dark, chosen
 * separately), one FAQ look for the two FAQs, the home hero between 768 and
 * 1023, and the album page's three ambient pieces (the phone's screen cycle,
 * the Live | Review photograph, the lightbox pill). No production byte moves
 * here; a pick is wired later, most in one small sweep.
 *
 * ★ THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21) TOUCHES FIVE OF THE SIX. The
 * charts' own context now names the admin portal that leads on them daily;
 * `review-photo`'s queue frame is redrawn on the real waiting tile
 * (guest-upload r1) and ranked against his own legibility test (demo-event
 * r2); `everywhere-pill` drops `hover`, which has no touch equivalent and was
 * a fiction on this very stage's own phone half (app-vocabulary r1's own
 * finding), for a new option, the product's own sweep (guest-upload r1).
 * Only `hero-tablet` and `phone-cycle` are untouched: no badge named them.
 *
 * ★ THE REFRESH'S OWN PASS (2026-09-24): `faq-look` JUDGED ON ITS OWN PAGE.
 * Its recommendation used to lean partly on pricing-page's own order (closing
 * on this look last); that is a fact about a different board, not a reason a
 * FAQ look is the right one, so the case here now stands on the FAQ alone.
 */
export const LOOSE_ENDS = defineExploration({
  id: "loose-ends",
  title: "Six loose ends",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "faq-look now judged on the FAQ alone, not pricing-page's own order; everywhere-pill's hover note restated as its own fact, not a citation. The overtaken audit's reshape stands: chart casts name the portal's daily read; review-photo's queue box redrawn on the real waiting tile.",
  },
  context:
    "Six ROADMAP one-liners nobody could pick from, each drawn on its own real surface rather than argued in prose: the admin chart ramp, one FAQ look, the home hero at a tablet width, and the album page's three ambient pieces.",
  asks: [
    /* ── 1. The admin chart ramp's cast (light, then dark, chosen separately) ── */
    {
      id: "chart-light",
      label: "Chart ramp, light",
      question: "How should the five chart tones read in light mode?",
      context:
        "`--chart-1..5` is pure grey while every surface beside it carries Graphite's cool cast. The portal now opens on these very charts, the first thing an operator reads every day (admin r1).",
      options: [
        {
          id: "today",
          label: "Today: pure grey",
          means:
            "Chroma 0 at every step, unrelated to the cast the rest of the UI wears.",
        },
        {
          id: "graphite",
          label: "Graphite's cool cast",
          means:
            "The same five tones at hue 286, the same whisper of chroma as a hairline border.",
        },
        {
          id: "accent",
          label: "One accent, four grey",
          means:
            "The first series turns a calm blue; the other four stay pure grey.",
        },
        {
          id: "warm",
          label: "A warm cast",
          means:
            "The same five tones at a warm hue, the same whisper of chroma as the cool cast.",
        },
      ],
      recommended: "graphite",
      because:
        "It is the one option that makes the ramp agree with everything beside it, at a chroma nobody consciously sees, and that read now greets an operator daily rather than sitting on a settings page nobody opens.",
      overrule:
        "If a chart should read as its own instrument, today's pure grey or the single accent.",
      lands: "--chart-1..5 in globals.css, the light block.",
    },
    {
      id: "chart-dark",
      label: "Chart ramp, dark",
      question: "How should the same five tones read in dark mode?",
      context:
        "Dark re-ramps the same five steps brighter on near-black. The portal's own devtool chrome (a 44px bar, a health band: admin r1) is what an operator now lives in daily, chosen separately from light, on the same two charts.",
      options: [
        {
          id: "today",
          label: "Today: pure grey",
          means: "Chroma 0 at every step, the ramp lit brighter on near-black.",
        },
        {
          id: "graphite",
          label: "Graphite's cool cast",
          means:
            "The same five tones at hue 286, the same whisper of chroma the room's own surfaces carry.",
        },
        {
          id: "accent",
          label: "One accent, four grey",
          means:
            "The first series turns a calm blue; the other four stay pure grey.",
        },
        {
          id: "warm",
          label: "A warm cast",
          means:
            "The same five tones at a warm hue, the same whisper of chroma as the cool cast.",
        },
      ],
      recommended: "graphite",
      because:
        "Dark leans on surface steps for depth; a cool cast already tells a card from the room an operator now opens daily, and the ramp joining it costs nothing legible.",
      overrule:
        "Same reservations as light: an instrument reads on its own in pure grey, or with one accent.",
      lands: "--chart-1..5 in globals.css, the .dark block.",
    },

    /* ── 2. One FAQ look for the two FAQs ── */
    {
      id: "faq-look",
      label: "One FAQ look",
      question: "Which look should every FAQ on the site share?",
      context:
        "Home and pricing set a question as a 16/600 heading; /events and every /features page set it quieter at 14/500 in a <summary>, read by nothing as a heading. Pricing's own FAQ is folded, one section among several.",
      options: [
        {
          id: "card",
          label: "The card step, everywhere",
          means:
            "Every question becomes a 16/600 heading, today's home and pricing look.",
        },
        {
          id: "shared",
          label: "The shared look, everywhere",
          means:
            "Every question sits at 14/500 in a <summary>, today's feature-page look.",
        },
        {
          id: "heading",
          label: "The quiet size, as a heading",
          means:
            "14/500 stays, but the question moves into a real heading, everywhere.",
        },
      ],
      recommended: "heading",
      because:
        "Judged on the FAQ alone: a <summary> is read by nothing as a heading today, wherever it sits, and this is the cheapest fix that exists for it. A nine-question feature page stays exactly as light as it is now.",
      overrule:
        "If one visual weight matters more than list density, the card step everywhere.",
      lands:
        "faq-accordion.tsx and home/faq-accordion.tsx converge on one look.",
      configs: [
        {
          id: "faq-source",
          label: "Source",
          options: [
            { id: "pricing", label: "Pricing's FAQ" },
            { id: "album", label: "The album page's FAQ" },
          ],
          default: "pricing",
        } satisfies Control,
      ],
    },

    /* ── 3. The home hero between 768 and 1023 ── */
    {
      id: "hero-tablet",
      label: "The hero at tablet widths",
      question: "What should the home hero wear between 768 and 1023?",
      context:
        "hero-stream.ts solves a phone geometry and a desktop one, and a tablet gets the phone's below 1024: its own card size and type measure, just stretched wider. Drawn static at a real 900 px window; the phone and 1440 do not change.",
      options: [
        {
          id: "today",
          label: "Today: the phone's geometry",
          means: "qr 128, card 155, a 343 px measure, unchanged from a phone.",
        },
        {
          id: "tablet",
          label: "A third geometry, composed",
          means:
            "qr 136, card 226, a 529 px measure: solved the same way, between the phone's and the desktop's.",
        },
        {
          id: "early",
          label: "The desktop geometry, early",
          means:
            "The desktop's own numbers (qr 144, card 300, a 920 px measure) starting at 768 instead of 1024.",
        },
      ],
      recommended: "tablet",
      because:
        "A composed middle geometry is what a tablet gets everywhere else on this ladder; the desktop's numbers were solved for 1440 and crowd a 900 px window.",
      overrule:
        "If a third table is not worth the upkeep before launch, the phone's geometry is the cheaper hold.",
      lands:
        "hero-stream.ts's Bp union and its GEO/BEAT/SPAN tables, or LG_MIN moved to 768.",
    },

    /* ── 4. The album's ambient pieces: the phone's screen cycle ── */
    {
      id: "phone-cycle",
      label: "The phone's screen cycle",
      question: "How fast should the phone's three screens cycle?",
      context:
        "getting-in-stage.tsx holds each of its three screens (the code, the welcome, adding a photo) for 3.2 seconds today, a number nobody graded against anything. The home hero launches a pair every 1.25s; graded against that pace, never a cap.",
      options: [
        {
          id: "today",
          label: "Today: 3.2s a screen",
          means:
            "About 2.5 hero beats: slower than anything else that moves on the page.",
        },
        {
          id: "beat",
          label: "One hero beat: 1.25s",
          means:
            "Every screen holds exactly as long as the hero's own launch beat.",
        },
        {
          id: "two-beat",
          label: "Two hero beats: 2.5s",
          means:
            "Long enough to read the welcome screen's two lines, still tied to the hero's clock.",
        },
      ],
      recommended: "two-beat",
      because:
        "It reads the welcome screen's copy in comfort while sharing one pulse with the hero above the fold, rather than a slower rate nobody set on purpose.",
      overrule:
        "If the welcome screen's two lines need more air, today's 3.2s.",
      lands: "HOLD_MS in getting-in-stage.tsx.",
    },

    /* ── 5. The album's ambient pieces: the Live | Review photograph ── */
    {
      id: "review-photo",
      label: "The Live | Review photograph",
      question:
        "Which photograph should travel through the Live | Review switch?",
      context:
        "review-switch.tsx flies one photo from phone to queue to album, now dimmed with a clock mark like the real waiting tile (guest-upload r1). His test since (demo-event r2): a visual no louder than what's behind it isn't noticeable.",
      options: [
        {
          id: "today",
          label: "Today: the champagne toast",
          means:
            "Warm and dim; reads as texture more than as a photo at the queue's small size.",
        },
        {
          id: "rings",
          label: "Clear up close: the rings",
          means:
            "Hands and a bouquet in open light; the highest contrast at a small size.",
        },
        {
          id: "arch",
          label: "In bloom: the arch florals",
          means: "Bright and colourful, no people in frame.",
        },
      ],
      recommended: "rings",
      because:
        "It stays legible at the queue's 56px size under the new dim, where today's photo turns to a dark blur his own legibility test would fail; it is still a personal, candid frame rather than a decor shot.",
      overrule:
        "If every plate should share the album's own palette instead, today's photograph already matches it.",
      lands: "The UPLOAD constant in review-switch.tsx.",
    },

    /* ── 6. The album's ambient pieces: the lightbox pill ── */
    {
      id: "everywhere-pill",
      label: "The lightbox pill",
      question:
        "Should a tile in the Everywhere stage hint that it is a real photograph, not just decoration?",
      context:
        "everywhere-stage.tsx shows a photograph landing on a laptop and phone at once; no tile hints it's real or openable. Hover has no touch equivalent, so the phone half never shows it; the newest tile takes one pass of light instead.",
      options: [
        {
          id: "none",
          label: "None, as today",
          means: "Purely ambient: nothing on a tile suggests it can be opened.",
        },
        {
          id: "corner",
          label: "A quiet corner mark",
          means:
            "A small expand glyph sits on the newest tile, always there, promising nothing on click.",
        },
        {
          id: "sweep",
          label: "The product's own sweep",
          means:
            "The same pass of light a real arrival wears (guest-upload r1), once across the newest tile: says this is real. Looped here; nothing on a demo ever really lands.",
        },
      ],
      recommended: "corner",
      because:
        "It reads as a detail, not a promise: the stage is decorative, so a mark implying a click it cannot honour is a broken affordance waiting to be tried. The sweep is real (guest-upload r1) but answers a different question, arrival, not interactivity.",
      overrule:
        "If feeling ALIVE matters more than hinting it opens, the sweep is the product's own truth, not an invented glyph, even if it marks arrival rather than a click.",
      lands: "everywhere-stage.tsx (a new prop or a copy, not yet wired).",
    },
  ],
});
