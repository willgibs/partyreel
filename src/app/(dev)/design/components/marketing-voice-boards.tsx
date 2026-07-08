"use client";

import { useEffect, useState } from "react";

import {
  Reveal,
  usePrefersReducedMotion,
} from "./marketing-lab-shared";

/**
 * Touchpoint: the MARKETING VOICE (T2.5 cluster-4, 2026-07-08). Four voice
 * directions were drafted for the marketing rebuild's leading copy; the owner
 * RULED a blend of D2 "Warm host" x D4 "The big night", disciplined by the
 * concise clarity of the current site H1 ("Every photo from your party, in one
 * place."). Deadpan (D1) is not the spine; Documentary (D3) survives only as the
 * factual register for the trust + pricing lines.
 *
 * These boards type-set that ruling so it can be confirmed in ONE look:
 *   V1 / V2  = the TWO BLEND EXECUTIONS of the ruled D2xD4 mix (night-leaning
 *              and warm-leaning). Their subcopies and their how-it-works headers
 *              are NEWLY drafted here to the concise-clarity test; everything
 *              else is lifted verbatim from the two parents.
 *   V3 / V4  = the pure D2 and D4 SOURCE boards, copy VERBATIM from the drafting
 *              round, so the owner sees what each parent contributes.
 *
 * The night-vs-event word choice rides the boards: the owner quoted D4's thesis
 * with "event" where the draft says "night" ("night" excludes conferences and
 * trips), so every load-bearing "night" line shows its "event" alternate beneath
 * it in muted small text. His confirmation (which blend, and the night/event
 * call) gets recorded in this touchpoint's decisionNote after his session.
 *
 * The kinetic H1 word cycles wedding -> birthday -> festival -> send-off on a
 * HARD CUT (instant swap, no fade), shared ~2.8s across all four boards from ONE
 * page-level interval so they stay in sync. Reduced motion holds "event" and
 * never cycles. No other motion beyond the lab's standard quiet reveals.
 *
 * Style note: semicolons (matching the sibling lab components), zero em-dashes
 * anywhere (the AST guard enforces it), copy as a typed data array (below), not
 * JSX soup.
 */

// ---------------------------------------------------------------------------
// The kinetic word slot (shared across every board)
// ---------------------------------------------------------------------------

const KINETIC_WORDS = ["wedding", "birthday", "festival", "send-off"] as const;
const KINETIC_INTERVAL_MS = 2800;

/** One page-level interval drives every hero H1, so the boards cut in sync.
 *  Reduced motion holds "event" (also the neutral word the ruling favors). */
function useKineticWord(): string {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setI((n) => (n + 1) % KINETIC_WORDS.length);
    }, KINETIC_INTERVAL_MS);
    return () => clearInterval(t);
  }, [reduced]);
  return reduced ? "event" : KINETIC_WORDS[i];
}

// ---------------------------------------------------------------------------
// The how-it-works rewrite candidates (the ONE line the owner flagged)
// ---------------------------------------------------------------------------

/**
 * The line to replace: D2's "Three steps, and none of them are yours to chase."
 * The owner endorsed the two theses but flagged this one for a better rewrite.
 * Binding test: concise clarity (could it be shorter and plainer without losing
 * the warmth or the relief?), no hype words, zero em-dashes. All four candidates
 * keep the one true insight: three steps, and the chasing is not on the host.
 *
 * V1 (night-leaning) and V2 (warm-leaning) may pick different primaries; the
 * runners-up render in each board's muted footer.
 */
const HOWITWORKS_REWRITES = [
  "Three steps, and the chasing isn't one of them.",
  "Three steps. You do none of the chasing.",
  "Three steps, and not one of them is on you.",
  "Three steps. Nobody chases anybody.",
] as const;

// ---------------------------------------------------------------------------
// The board data model
// ---------------------------------------------------------------------------

/** A header line in the section stack: a tiny slot label, the line itself, and
 *  an optional muted alternate rendered directly beneath (the "event" form of a
 *  "night" line, or a header runner-up). */
type HeaderLine = {
  slot: string;
  line: string;
  alt?: string;
};

/** A single factual line under the "at its most factual" label (the D3
 *  register the ruling keeps for trust + pricing). */
type FactualLine = {
  slot: string;
  line: string;
};

type Board = {
  n: number;
  name: string;
  /** The eyebrow above the board: what leads where (V1/V2) or "source
   *  reference" (V3/V4). */
  desc: string;
  /** The site-wide thesis line this direction proposes. */
  thesis: string;
  /** The thesis' "event" alternate, when the thesis rides a "night" word. */
  thesisAlt?: string;
  hero: {
    eyebrow: string;
    /** The H1 with a {word} token where the kinetic slot goes. Split into the
     *  text BEFORE the token and AFTER it so the cycling word drops in. */
    h1Before: string;
    h1After: string;
    subcopy: string;
  };
  /** The decomposition beat: three fact lines + the closing line. */
  decomposition: {
    facts: string[];
    closing: string;
  };
  /** The seven section headers as a type stack. */
  headers: HeaderLine[];
  reel: {
    line: string;
    subcopy: string;
  };
  factual: FactualLine[];
  /** The muted footer: the how-it-works rewrite runners-up (V1/V2) or the
   *  direction's primary risk from the draft's table (V3/V4). */
  footer: {
    label: string;
    items: string[];
  };
};

// The "event" alternate for a "night" thesis line, shown muted beneath it.
const EVENT_ALT = (line: string) => `Or: ${line}`;

const BOARDS: Board[] = [
  // -------------------------------------------------------------------------
  // V1 - Blend: night-leaning (D4 leads the emotional beats, D2 the practical)
  // -------------------------------------------------------------------------
  {
    n: 1,
    name: "Blend: night-leaning",
    desc: "D4 leads the emotional beats, D2 leads the practical ones.",
    thesis: "The whole night, in one place, forever.",
    thesisAlt: EVENT_ALT("The whole event, in one place, forever."),
    hero: {
      eyebrow: "Nobody remembers all of it. Now nobody has to.",
      // D4's thesis adapted INTO the cycling slot (reads with all four words).
      h1Before: "The whole ",
      h1After: ", in one place, forever.",
      // NEW subcopy: D2's warm second person, clarity-disciplined.
      subcopy:
        "Your guests scan one QR and their photos come to you. The reel builds itself, free.",
    },
    decomposition: {
      // D4's three fact lines + closing, verbatim.
      facts: [
        "214 photos you would never have seen.",
        "23 guests, all of it saved.",
        "One reel of the night you were living, not filming.",
      ],
      closing:
        "Everyone was there. Partyreel turns what they saw into the film of the night.",
    },
    headers: [
      // how-it-works = the best rewrite (runners-up in the footer).
      { slot: "How it works", line: HOWITWORKS_REWRITES[0] },
      { slot: "The live demo", line: "Watch the night come back." },
      { slot: "The album", line: "Every photo comes to you first." },
      {
        slot: "Trust and privacy",
        line: "Your night stays yours.",
        alt: EVENT_ALT("Your event stays yours."),
      },
      {
        slot: "The reel",
        line: "The whole night, cut down to the best of it.",
        alt: EVENT_ALT("The whole event, cut down to the best of it."),
      },
      { slot: "Pricing", line: "Start free, upgrade when you host again." },
      {
        slot: "Cinema close",
        line: "The party ends. The night doesn't have to.",
      },
    ],
    reel: {
      // /reel hero: D4's line + D4's subcopy verbatim.
      line: "The night doesn't have to end.",
      subcopy:
        "Every photo your guests took, cut into a cinematic highlight video you can watch back for years. 14 styles, rendered on your phone, free.",
    },
    factual: [
      // The D3 register: the specified trust line + D2's pricing line verbatim.
      {
        slot: "Trust",
        line: "Location data is stripped from every photo on your phone, before a single byte is uploaded.",
      },
      {
        slot: "Pricing",
        line: "Free is the whole first event: one QR, 2 GB, and a 30-second reel to send around. Upgrade when you are ready to host the next one.",
      },
    ],
    footer: {
      label: "How-it-works rewrite, the alternates",
      items: [
        HOWITWORKS_REWRITES[1],
        HOWITWORKS_REWRITES[2],
        HOWITWORKS_REWRITES[3],
      ],
    },
  },

  // -------------------------------------------------------------------------
  // V2 - Blend: warm-leaning (D2 leads; D4 supplies the stakes at close + reel)
  // -------------------------------------------------------------------------
  {
    n: 2,
    name: "Blend: warm-leaning",
    desc: "D2 leads; D4 supplies the stakes at the close and the reel.",
    thesis: "Every event ends with a reel.",
    hero: {
      eyebrow: "You throw the party. We keep the night.",
      // D2's kinetic H1 verbatim (the cycling word already lives in it).
      h1Before: "Your ",
      h1After: ", kept by everyone who was there.",
      // D2's subcopy verbatim.
      subcopy:
        "Your guests scan one QR and their photos come to you, no app and no account to slow anyone down. You get every angle of the night and a highlight reel that builds itself.",
    },
    decomposition: {
      // D2's three fact lines + closing, verbatim.
      facts: ["214 photos, all yours.", "23 guests, no chasing.", "One reel, edited for you."],
      closing:
        "Everyone was holding a camera. Partyreel turns all of it into the film of your night.",
    },
    headers: [
      // A different rewrite pick from V1 (the warmest one reads best here).
      { slot: "How it works", line: HOWITWORKS_REWRITES[1] },
      { slot: "The live demo", line: "Watch your album fill up." },
      { slot: "The album", line: "Every photo comes to you first." },
      {
        slot: "Trust and privacy",
        line: "Your night stays yours.",
        alt: EVENT_ALT("Your event stays yours."),
      },
      {
        // D4 supplies the reel stakes here (warm board, its sharper line);
        // D2's own reel line shown as the alternate.
        slot: "The reel",
        line: "Every night has an ending. This one has a cut.",
        alt: "Or (D2's warm line): The whole night, cut down to the best of it.",
      },
      { slot: "Pricing", line: "Start free, upgrade when you host again." },
      {
        slot: "Cinema close",
        line: "The party ends. The night doesn't have to.",
      },
    ],
    reel: {
      // /reel hero: D2's line + D2's subcopy verbatim.
      line: "The night, cut down to the best of it.",
      subcopy:
        "Every event you host ends with a cinematic highlight video, built for you from your guests' photos. Pick a look from 14 styles and it renders right on your phone, free.",
    },
    factual: [
      // D2's locked-event trust line verbatim + D3's pricing line verbatim.
      {
        slot: "Trust",
        line: "A locked event shows guests only its name and a photo count. What is inside stays between the people you invited.",
      },
      {
        slot: "Pricing",
        line: "Free holds one event, 2 GB, roughly 500 photos, and a 30-second reel. Pro adds video, unlimited events, 60-second reels, and no watermark.",
      },
    ],
    footer: {
      label: "How-it-works rewrite, the alternates",
      items: [
        HOWITWORKS_REWRITES[0],
        HOWITWORKS_REWRITES[2],
        HOWITWORKS_REWRITES[3],
      ],
    },
  },

  // -------------------------------------------------------------------------
  // V3 - Warm host (source) - pure D2, verbatim from the draft
  // -------------------------------------------------------------------------
  {
    n: 3,
    name: "Warm host (source)",
    desc: "Source reference: the pure D2 parent, copy verbatim from the draft.",
    thesis: "Every event ends with a reel.",
    hero: {
      eyebrow: "You throw the party. We keep the night.",
      h1Before: "Your ",
      h1After: ", kept by everyone who was there.",
      subcopy:
        "Your guests scan one QR and their photos come to you, no app and no account to slow anyone down. You get every angle of the night and a highlight reel that builds itself.",
    },
    decomposition: {
      facts: ["214 photos, all yours.", "23 guests, no chasing.", "One reel, edited for you."],
      closing:
        "Everyone was holding a camera. Partyreel turns all of it into the film of your night.",
    },
    headers: [
      { slot: "How it works", line: "Three steps, and none of them are yours to chase." },
      { slot: "The live demo", line: "Watch your album fill up." },
      { slot: "The album", line: "Every photo comes to you first." },
      { slot: "Trust and privacy", line: "Your night stays yours." },
      { slot: "The reel", line: "The whole night, cut down to the best of it." },
      { slot: "Pricing", line: "Start free, upgrade when you host again." },
      { slot: "Cinema close", line: "Send the QR. Keep the night." },
    ],
    reel: {
      line: "The night, cut down to the best of it.",
      subcopy:
        "Every event you host ends with a cinematic highlight video, built for you from your guests' photos. Pick a look from 14 styles and it renders right on your phone, free.",
    },
    factual: [
      {
        slot: "Trust",
        line: "A locked event shows guests only its name and a photo count. What is inside stays between the people you invited.",
      },
      {
        slot: "Pricing",
        line: "Free is the whole first event: one QR, 2 GB, and a 30-second reel to send around. Upgrade when you are ready to host the next one.",
      },
    ],
    footer: {
      label: "Direction's primary risk (from the draft)",
      items: [
        "Mush. Greeting-card soft or preachy second-person if the warmth stops being paid for with specifics.",
      ],
    },
  },

  // -------------------------------------------------------------------------
  // V4 - The big night (source) - pure D4, verbatim from the draft
  // -------------------------------------------------------------------------
  {
    n: 4,
    name: "The big night (source)",
    desc: "Source reference: the pure D4 parent, copy verbatim from the draft.",
    thesis: "The whole night, in one place, forever.",
    hero: {
      eyebrow: "Nobody remembers all of it. Now nobody has to.",
      // D4's H1 is a full sentence pair with the word slot up front.
      h1Before: "The ",
      h1After: " is over. The reel keeps it going.",
      subcopy:
        "Guests scan one QR and every photo finds its way to you. The night you half-remember comes back as a highlight reel, built automatically, ready to send.",
    },
    decomposition: {
      facts: [
        "214 photos you would never have seen.",
        "23 guests, all of it saved.",
        "One reel of the night you were living, not filming.",
      ],
      closing:
        "Everyone was there. Partyreel turns what they saw into the film of the night.",
    },
    headers: [
      { slot: "How it works", line: "From the first scan to the final cut." },
      { slot: "The live demo", line: "Watch the night come back." },
      { slot: "The album", line: "Every moment, and you decide what stays." },
      { slot: "Trust and privacy", line: "Keep the night. Keep it private." },
      { slot: "The reel", line: "The night, remembered in full." },
      { slot: "Pricing", line: "Keep your first night free." },
      { slot: "Cinema close", line: "The party ends. The night doesn't have to." },
    ],
    reel: {
      line: "The night doesn't have to end.",
      subcopy:
        "Every photo your guests took, cut into a cinematic highlight video you can watch back for years. 14 styles, rendered on your phone, free.",
    },
    factual: [
      {
        slot: "Trust",
        line: "Every photo keeps for as long as you want it. Delete something by mistake and you have 30 days to bring it back.",
      },
      {
        slot: "Pricing",
        line: "Your first night is free: one QR, 2 GB, roughly 500 photos, and a 30-second reel to keep.",
      },
    ],
    footer: {
      label: "Direction's primary risk (from the draft)",
      items: [
        "Sentimental. One bad line from greeting-card; brushes the exact memories/magic hype the brief bars.",
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// The board renderer (identical structure on all four, compare like-for-like)
// ---------------------------------------------------------------------------

/** A tiny mono slot label the section stack + factual lines share. */
function SlotLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.16em] text-white/35 uppercase">
      {children}
    </span>
  );
}

/** The muted "event" alternate (or header runner-up) beneath a line. */
function AltLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-0.5 text-[12px] leading-snug text-white/35">{children}</p>
  );
}

function VoiceBoard({ board, word }: { board: Board; word: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.11_0_0)] text-[oklch(0.97_0_0)] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.5)]">
      {/* 1 - Mono eyebrow: board number + name + one-line description. */}
      <div className="flex items-baseline gap-3 border-b border-white/10 px-8 py-4">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/90 font-mono text-[11px] text-black">
          {board.n}
        </span>
        <div>
          <p data-dir-display className="text-[15px] leading-tight">
            {board.name}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-white/45">
            {board.desc}
          </p>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* The site-wide thesis line (with its event alternate when it rides
            a "night" word). */}
        <div className="mb-9">
          <SlotLabel>Site thesis</SlotLabel>
          <p
            data-dir-display
            className="mt-1.5 text-[26px] leading-[1.05] text-white"
          >
            {board.thesis}
          </p>
          {board.thesisAlt && <AltLine>{board.thesisAlt}</AltLine>}
        </div>

        {/* 2 - HERO BLOCK at display scale. */}
        <Reveal className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-7">
          <p
            data-mkt-reveal
            className="text-[12px] font-medium tracking-[0.2em] text-white/55 uppercase"
          >
            {board.hero.eyebrow}
          </p>
          <h1
            data-dir-display
            data-mkt-reveal
            className="mt-4 text-[46px] leading-[0.98] text-white"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {board.hero.h1Before}
            {/* The kinetic word: a HARD CUT (no transition, keyed to force an
                instant swap), tabular so the line does not jitter width. */}
            <span
              key={word}
              className="text-white"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {word}
            </span>
            {board.hero.h1After}
          </h1>
          <p
            data-mkt-reveal
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            {board.hero.subcopy}
          </p>
        </Reveal>

        {/* 3 - THE DECOMPOSITION BEAT: three fact lines + the closing line. */}
        <Reveal className="mt-9">
          <SlotLabel>The decomposition beat</SlotLabel>
          <div className="mt-3 flex flex-col gap-1.5">
            {board.decomposition.facts.map((fact, i) => (
              <p
                key={fact}
                data-mkt-reveal
                data-dir-display
                className="text-[22px] leading-tight tracking-tight text-white/90 tabular-nums"
                style={{ "--i": i } as React.CSSProperties}
              >
                {fact}
              </p>
            ))}
          </div>
          <p
            data-mkt-reveal
            className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {board.decomposition.closing}
          </p>
        </Reveal>

        {/* 4 - SECTION HEADERS as a type stack with tiny muted slot labels;
            alternates render directly beneath their line. */}
        <div className="mt-11 border-t border-white/10 pt-8">
          <SlotLabel>Section headers</SlotLabel>
          <div className="mt-4 flex flex-col divide-y divide-white/[0.06]">
            {board.headers.map((h) => (
              <div
                key={h.slot}
                className="grid grid-cols-[128px_1fr] items-baseline gap-4 py-3.5"
              >
                <SlotLabel>{h.slot}</SlotLabel>
                <div>
                  <p
                    data-dir-display
                    className="text-[21px] leading-tight text-white/90"
                  >
                    {h.line}
                  </p>
                  {h.alt && <AltLine>{h.alt}</AltLine>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5 - /REEL hero line + subcopy, then the two factual lines under a
            tiny "at its most factual" label. */}
        <div className="mt-11 border-t border-white/10 pt-8">
          <SlotLabel>/reel hero</SlotLabel>
          <p
            data-dir-display
            className="mt-2 text-[30px] leading-[1.04] text-white"
          >
            {board.reel.line}
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            {board.reel.subcopy}
          </p>

          <div className="mt-7">
            <SlotLabel>The voice at its most factual (the D3 register)</SlotLabel>
            <div className="mt-3 flex flex-col gap-4">
              {board.factual.map((f) => (
                <div
                  key={f.slot}
                  className="grid grid-cols-[72px_1fr] items-baseline gap-4"
                >
                  <SlotLabel>{f.slot}</SlotLabel>
                  <p className="max-w-xl text-[14px] leading-relaxed text-white/65">
                    {f.line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6 - Muted footer: the rewrite alternates (V1/V2) or the direction's
            primary risk (V3/V4). */}
        <div className="mt-10 border-t border-white/[0.06] pt-5">
          <SlotLabel>{board.footer.label}</SlotLabel>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {board.footer.items.map((item) => (
              <li key={item} className="text-[13px] leading-snug text-white/40">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function MarketingVoiceBoards() {
  const word = useKineticWord();
  return (
    <div className="py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Two blend executions of the ruled D2xD4 mix (V1 night-leaning, V2
        warm-leaning), above the two pure sources for reference (V3 Warm host, V4
        The big night). Copy is type-set dark-mono at display scale so the
        execution reads in one look. The kinetic H1 word cuts every 2.8 seconds
        in sync across all four boards (hard cut, no fade); a muted line beneath
        each load-bearing {`"night"`} line shows its {`"event"`} alternate. Where
        a line was newly drafted (the blend subcopies, the how-it-works rewrite)
        the binding test was concise clarity, modeled on the current H1{" "}
        {`"Every photo from your party, in one place."`}
      </p>
      <div className="mt-8 flex flex-col gap-12">
        {BOARDS.map((board) => (
          <VoiceBoard key={board.n} board={board} word={word} />
        ))}
      </div>
    </div>
  );
}
