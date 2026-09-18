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
 */
export const LOOSE_ENDS = defineExploration({
  id: "loose-ends",
  title: "Six loose ends",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round: the chart ramp's cast, one FAQ look, the hero at tablet widths, and the album's three ambient pieces, each drawn on its real surface with a recommendation.",
  },
  bible: [1, 5, 12, 14],
  context:
    "Six ROADMAP one-liners nobody could pick from, each drawn on its own real surface rather than argued in prose: the admin chart ramp, one FAQ look, the home hero at a tablet width, and the album page's three ambient pieces.",
  asks: [
    /* ── 1. The admin chart ramp's cast (light, then dark, chosen separately) ── */
    {
      id: "chart-light",
      label: "Chart ramp, light",
      question: "How should the five chart tones read in light mode?",
      context:
        "`--chart-1..5` is pure grey while every surface beside it, from the card to the hairline border, carries Graphite's cool cast. Drawn on the real MetricsCharts with a five-source distribution and a two-line trend.",
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
        "It is the one option that makes the ramp agree with everything beside it, at a chroma nobody consciously sees.",
      overrule:
        "If a chart should read as its own instrument, today's pure grey or the single accent.",
      lands: "--chart-1..5 in globals.css, the light block.",
    },
    {
      id: "chart-dark",
      label: "Chart ramp, dark",
      question: "How should the same five tones read in dark mode?",
      context:
        "Dark re-ramps the same five steps brighter on near-black. Chosen separately from light, on the same two charts, the card on the room's own dark ground.",
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
        "Dark leans on surface steps for depth; a cool cast already tells a card from the room, and the ramp joining it costs nothing legible.",
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
        "Home and pricing set a question as a 16/600 heading; /events and every /features page set it quieter at 14/500 in a <summary>, not a heading. Flip Source to compare pricing against the album page, both at 1440 and 375.",
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
        "It fixes the one real gap, a summary read by nothing as a heading, without making a nine-question feature page heavier.",
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
        "review-switch.tsx flies one photograph from the phone to the queue to the album, the same image throughout. Today's champagne toast is dim and busy at the queue's 56 px size. Drawn on the real switch, both positions.",
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
        "It stays legible at the queue's 56 px size, where today's photo turns to a dark blur, and it is still a personal, candid frame rather than a decor shot.",
      overrule:
        "If every plate should share the album's own palette instead, today's photograph already matches it.",
      lands: "The UPLOAD constant in review-switch.tsx.",
    },

    /* ── 6. The album's ambient pieces: the lightbox pill ── */
    {
      id: "everywhere-pill",
      label: "The lightbox pill",
      question: "Should a tile in the Everywhere stage hint that it opens?",
      context:
        "everywhere-stage.tsx shows the same photograph landing on a laptop and a phone at once; today no tile hints it is a real, openable photo. Drawn on the real stage, both devices.",
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
          id: "hover",
          label: "The real hover pill",
          means:
            "The product's hover pill, shown revealed (it hides until pointed at) on the newest tile.",
        },
      ],
      recommended: "corner",
      because:
        "It reads as a detail rather than a promise: the stage is decorative, and a hover pill that leads nowhere on a decorative demo is a broken affordance waiting to be clicked.",
      overrule:
        "If foreshadowing the real interaction matters more than restraint, the hover pill.",
      lands: "everywhere-stage.tsx (a new prop or a copy, not yet wired).",
    },
  ],
});
