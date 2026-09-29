import { defineExploration } from "@/components/lab/exploration";

/**
 * PRESS, FOLDED INTO ABOUT (the about-press track, round one, cut 2026-09-29).
 *
 * His press-page r1 answers (docs/reviews/press-page.json): press does not
 * deserve its own page right now, so fold the kit into /about cleanly and
 * remove /press, or, if it cannot be worked in, remove the kit too; the
 * boilerplate goes (no press outreach is planned: partners, free passes, social
 * ads, the llms files, the blog and SEO carry it); the future partners page is
 * its own and never shared with press; and whether the facts help About came
 * back to us as his question.
 *
 * ★ TWO QUESTIONS, ONE STAGED. `kit` asks where the kit lives on About and in
 * what form (the whole sheet, a short band, a line in the close, or none), each
 * drawn on the real page at the place it would take; `facts` waits on it and
 * is drawn in the world it picked, because four facts sit inside a kit when
 * there is one and on their own after the convictions when there is not.
 *
 * ★ press-page's LAST OPEN ASK RETIRES HERE AS A CARRIED CALL. `a-human`
 * (whether anyone is named) waited on /press staying a page; the fold answers
 * it (the kit's one door is /contact's Press & partnerships topic, and About's
 * "we" names nobody), so it is carried rather than asked again.
 *
 * ★ SETTLED, NOT ASKED: the usage line (his usage-note pick) rides every kit
 * that stays; the boilerplate and the one-liner leave with /press. Not in this
 * round: the redirect, the nav, the footer, the sitemap and the llms files (the
 * wiring after his pick), and any production byte.
 */
export const ABOUT_PRESS = defineExploration({
  id: "about-press",
  title: "Press, folded into About",
  surface: "marketing",
  desk: 95,
  lives: [
    "docs/systems/marketing-content.md",
    "src/app/(marketing)/(cinema)/about/page.tsx",
    "src/lib/constants/about.ts",
    "src/app/(marketing)/(cinema)/press/page.tsx",
    "src/components/marketing/press/press-sheet.tsx",
    "src/lib/constants/press.ts",
  ],
  round: {
    n: 1,
    date: "2026-09-29",
    changed:
      "From your press-page answers: the press kit folded into /about three ways or dropped, and four of its facts with it or not, each drawn on the real page.",
  },
  context:
    "Your press-page answers (2026-09-29): fold the kit into About and remove /press, or remove the kit too if it will not fit; drop the boilerplate; keep partners for a page of its own. Every drawing is production's About (the hero, the gather, the story, the six convictions, the careers close, the footer) with only the kit and the facts changed.",
  opening: {
    about:
      "Where the press kit lives now that /press folds into /about, in what form or not at all, and whether four of its facts earn a place there.",
    settled: [
      "/press goes and redirects to /about; the partners page will be its own, never shared with press.",
      "The boilerplate and the one-liner go with /press, as you said: no press outreach is planned.",
      "Any kit that stays keeps your usage line: use the marks as provided.",
    ],
    earlier: [
      "'Let's find a clean way to fold that press kit into about... If we can't work it in, maybe we remove the press kit for now too.'",
      "'Wanted to at least try to see what a press + about infusion looks like.'",
      "On the facts: 'Is this helpful to infuse into the About page, or do we get rid of it as well?'",
    ],
  },
  terms: [
    {
      term: "press kit",
      means:
        "The brand files a writer downloads in one zip: the marks, the app icon, the share card and a QR code.",
    },
    {
      term: "usage line",
      means:
        "One sentence beside the files: use the marks as provided, no recoloring, no stretching.",
    },
    {
      term: "stand-in mark",
      means:
        "The Aperture glyph every Partyreel mark wears until your v1 icon lands (ASSETS row 19).",
    },
    {
      term: "convictions",
      means:
        "About's six promises under 'Six things we will not trade away', each linking to its proof.",
    },
  ],
  carried: [
    {
      id: "named",
      question: "Does anyone get named beside the kit, now it lives on About?",
      taken:
        "No: the kit's one door is /contact's Press & partnerships topic and About's 'we' names nobody, so press-page's named-contact ask retires.",
      overrule:
        "Name one person beside the kit, the way a masthead lists an editor.",
    },
    {
      id: "four",
      question: "Which four facts would a strip carry?",
      taken:
        "Founded, How it works, Guests need and Pricing, read from the fact sheet's own rows, the ones /llms-full.txt is built from.",
      overrule:
        "Name the four; any of the fact sheet's twelve rows can stand in.",
    },
  ],
  asks: [
    {
      id: "kit",
      label: "Where the kit lives",
      question: "How should the press kit live on /about, if at all?",
      where: ["Marketing", "About", "After the six convictions"],
      when: "A writer lands from /press's redirect, or reads About to its end, and wants the logo for a story.",
      matters:
        "About earned its place with one story; a kit asks it to serve a second reader too, and /press's visitors land here.",
      lands:
        "What About adds after its convictions, where /press lands, and whether public/press/ and its zip stay.",
      context:
        "The real /about at 1440 and 375, each frame opened where the kit would sit, between the six convictions and the careers close. The kit is today's /press sheet, every mark the stand-in mark.",
      options: [
        {
          id: "chapter",
          label: "Its own chapter, the whole sheet",
          means:
            "The /press sheet moves in whole: a heading like the convictions', then all eight plates, a step wider than the ledger, and Download all.",
          gains:
            "Nothing is lost: every file and plate a writer had on /press, one scroll down.",
          costs:
            "About gains a logo grid at least as tall as its story, and the page ends on files.",
        },
        {
          id: "band",
          label: "A short band before the close",
          means:
            "One muted band: four plates, one download and the usage line; /press lands right on it.",
          gains:
            "The whole kit stays in its zip at about a third of the chapter's height; the story still leads.",
          costs:
            "A second reader's block on a story page, handing out the stand-in mark until the v1 icon.",
        },
        {
          id: "line",
          label: "One line in the close",
          means:
            "The careers close gains a quiet line under its button: writing about us, download the kit. No plates.",
          gains:
            "The lightest fold: About keeps its shape, and the files are one press away.",
          costs:
            "A writer downloads without seeing the marks, and the close's one ask gains a rider.",
        },
        {
          id: "none",
          label: "No kit, About as today",
          means:
            "Nothing is added; /press redirects to About, and the kit's files retire until the v1 mark.",
          gains:
            "About stays one story, and no stand-in mark goes out to be printed.",
          costs: "A writer who needs the logo asks through /contact.",
        },
      ],
      today: "none",
      recommended: "band",
      because:
        "It keeps the whole kit one press from /press's redirect at about a third of a chapter's height, and About's story still leads.",
      overrule:
        "If any download block reads as off-mission on About, no kit: the files wait for the v1 mark.",
    },
    {
      id: "facts",
      label: "Whether the facts stay",
      question: "Should four plain facts from the fact sheet stay on /about?",
      where: ["Marketing", "About", "Before the careers close"],
      when: "A writer checking the basics for a piece, or a host wondering who is behind Partyreel, reaches About's end.",
      matters:
        "Your question: do the facts help About, or go with the boilerplate? All twelve stay in /llms-full.txt either way.",
      lands:
        "Whether About carries a four-fact strip read from constants/press.ts, or the facts live in the llms files alone.",
      context:
        "Drawn in the kit you picked. The strip holds four of the fact sheet's twelve rows, from the array /llms-full.txt is built from; with no kit, or only the line, it sits after the convictions.",
      options: [
        {
          id: "none",
          label: "No facts, as today",
          means:
            "About says nothing more; all twelve facts live on in /llms-full.txt, which the wiring keeps current.",
          gains:
            "About stays a story, and the convictions stay its only checkable claims.",
          costs:
            "A writer after the founding year or the price looks on /pricing or asks.",
        },
        {
          id: "strip",
          label: "Four facts in a strip",
          means:
            "Founded, How it works, Guests need and Pricing in one strip: inside the kit, or after the convictions with no kit.",
          gains:
            "A writer gets the four basics at a glance, the founding year among them.",
          costs:
            "Three of the four repeat what the convictions and /pricing already say.",
        },
      ],
      today: "none",
      recommended: "none",
      because:
        "The six convictions already are About's checkable claims, each linked; the strip's one new fact is the founding year.",
      overrule:
        "If a writer's first need is the checkable basics, the strip, beside the kit.",
      after: { ask: "kit" },
    },
  ],
});
