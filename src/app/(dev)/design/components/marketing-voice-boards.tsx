"use client";

import { useEffect, useRef, useState } from "react";

import { Reveal, usePrefersReducedMotion } from "./marketing-lab-shared";

/**
 * Touchpoint: the MARKETING VOICE, ROUND 2 (T2.5 cluster-4, 2026-07-08).
 *
 * Round 1 type-set four boards off a D2xD4 blend. The owner's round-2 rulings
 * reset the copy: (1) the hard-cut word swap read glitchy on text-only boards,
 * almost like a bug, so the animation gains a THREE-MODE toggle (Roll default,
 * Type, Cut); (2) the groupings leaned too hard on the reel when most of the
 * value is the effortless collection, so collection value now CO-LEADS every
 * board and the reel is the payoff, not the pitch; (3) "night" is banned as
 * identity language (it excludes conferences + trips) in favor of event/party;
 * (4) each group is rewritten around his ratified GOLDEN SET of eight lines,
 * which appear VERBATIM; (5) "the highlights" replaces "the best of it"; (6) the
 * QR/scan/share register and the factual privacy pair are kept.
 *
 * The four round-1 boards are RETIRED. In their place: three fresh groupings
 * that all anchor on the golden set but differ in H1/thesis STRATEGY.
 *   G1 Collection-led - the hero sells the effortless collection; the reel is
 *      the closing payoff section.
 *   G2 Arc-led - the hero rides the journey from scan to cut; collection + reel
 *      balanced through the stack.
 *   G3 Reel-led (tempered) - the ONE reel-led thesis, but every section beneath
 *      sells the collection first, with the reel as the ending it produces.
 *
 * Above the boards: a RATIFIED PALETTE strip type-setting the owner's eight
 * picked lines, so he reads the session as "your lines, now grouped".
 *
 * Concise clarity is the binding test on every new line (model: "Every photo
 * from your party, in one place."). Zero em-dashes (the AST guard enforces it),
 * no hype words (memories/moments/magic) on NEW lines - note "Every moment, and
 * you decide what stays" is a golden line kept verbatim. Copy is a typed data
 * array (below), not JSX soup; semicolons match the sibling lab components.
 */

// ---------------------------------------------------------------------------
// The kinetic word slot + the three-mode animation engine (shared, page-level)
// ---------------------------------------------------------------------------

const KINETIC_WORDS = ["wedding", "birthday", "festival", "send-off"] as const;
/** The shared cycle interval. The Type mode pauses this while a word is being
 *  deleted + retyped so the animation always completes before the next word. */
const KINETIC_INTERVAL_MS = 2800;

type AnimMode = "roll" | "type" | "cut";

const MODE_LABEL: Record<AnimMode, string> = {
  roll: "Roll",
  type: "Type",
  cut: "Cut",
};

/** The width the kinetic slot reserves so no board's H1 ever reflows as the
 *  word changes. "birthday" is the widest of the four; a ch-based min-width off
 *  it holds the line steady without hard-coding pixels. */
const WIDEST_WORD = KINETIC_WORDS.reduce(
  (a, b) => (b.length > a.length ? b : a),
  "",
);

/** One page-level driver advances the shared word index on the cycle interval,
 *  so every board's hero swaps in sync. Reduced motion holds the index at 0 and
 *  never starts the interval; the callers then render the neutral "event" word
 *  and skip all motion. Returns the current index so each hero can key off it. */
function useKineticIndex(reduced: boolean): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setI((n) => (n + 1) % KINETIC_WORDS.length);
    }, KINETIC_INTERVAL_MS);
    return () => clearInterval(t);
  }, [reduced]);
  return reduced ? 0 : i;
}

/**
 * The kinetic word itself, animated per the page mode. All three modes clip to
 * the line box and reserve width so the baseline never jitters.
 *
 *  - Roll (default): the outgoing word slides up + out as the incoming word
 *    slides up from below, clipped by overflow-hidden. ~260ms on the house
 *    --ease-emphasis, no bounce.
 *  - Type: the old word deletes fast, then the new word types in (~34ms/char),
 *    a subtle caret blinking at the end.
 *  - Cut: the round-1 instant swap, kept for comparison.
 *
 * Reduced motion (reduced=true) short-circuits to a static "event".
 */
function KineticWord({
  index,
  mode,
  reduced,
}: {
  index: number;
  mode: AnimMode;
  reduced: boolean;
}) {
  if (reduced) {
    return <span className="text-white">event</span>;
  }
  const word = KINETIC_WORDS[index];
  return (
    <span
      className="relative inline-flex align-baseline"
      style={{ minWidth: `${WIDEST_WORD.length}ch` }}
    >
      {mode === "roll" && <RollWord word={word} />}
      {mode === "type" && <TypeWord word={word} />}
      {mode === "cut" && (
        // key forces a fresh node each change => an instant, transition-free swap.
        <span key={word} className="text-white">
          {word}
        </span>
      )}
    </span>
  );
}

/** Roll: a vertical swap. On each new word we render the previous word leaving
 *  (slides up + fades) beneath the incoming word entering (slides up from below),
 *  both clipped to the line box. A rAF flip drives the transition so the enter
 *  starts from its offset every time. */
function RollWord({ word }: { word: string }) {
  const [prev, setPrev] = useState<string | null>(null);
  const [entered, setEntered] = useState(true);
  const wordRef = useRef(word);

  useEffect(() => {
    if (wordRef.current === word) return;
    setPrev(wordRef.current);
    wordRef.current = word;
    setEntered(false);
    // Next frame: release the incoming word from its below-the-box offset and
    // start the outgoing word's exit, so both animate together.
    const raf = requestAnimationFrame(() => setEntered(true));
    // Drop the outgoing word once its transition is done (kept > the 260ms move).
    const done = setTimeout(() => setPrev(null), 340);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [word]);

  const move = "transform 260ms var(--ease-emphasis), opacity 260ms var(--ease-emphasis)";
  return (
    <span className="relative inline-block overflow-hidden align-baseline">
      {/* A zero-opacity sizer holds the box height/width to the widest glyph run
          so the clip never crops descenders and the baseline stays put. */}
      <span aria-hidden className="invisible">
        {word}
      </span>
      {prev !== null && (
        <span
          aria-hidden
          className="absolute inset-0 text-white"
          style={{
            transition: move,
            transform: entered ? "translateY(-100%)" : "translateY(0)",
            opacity: entered ? 0 : 1,
          }}
        >
          {prev}
        </span>
      )}
      <span
        className="absolute inset-0 text-white"
        style={{
          transition: move,
          transform: entered ? "translateY(0)" : "translateY(100%)",
          opacity: entered ? 1 : 0,
        }}
      >
        {word}
      </span>
    </span>
  );
}

/** Type: delete the old word char-by-char, then type the new word in. Runs a
 *  small stepping timer; a subtle caret sits at the end. Width is reserved by
 *  the parent slot so the deleting/typing never reflows the line. */
const TYPE_MS_PER_CHAR = 34;

function TypeWord({ word }: { word: string }) {
  const [shown, setShown] = useState(word);
  const targetRef = useRef(word);

  useEffect(() => {
    if (targetRef.current === word && shown === word) return;
    targetRef.current = word;
    let current = shown;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      // Phase 1: delete down to nothing. Phase 2: type the target up.
      if (current.length > 0 && !word.startsWith(current)) {
        current = current.slice(0, -1);
      } else if (current.length < word.length) {
        current = word.slice(0, current.length + 1);
      } else {
        return; // reached the target
      }
      setShown(current);
      timer = setTimeout(() => {
        raf = requestAnimationFrame(tick);
      }, TYPE_MS_PER_CHAR);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // shown is intentionally excluded: this effect re-seeds only on a new word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  return (
    <span className="text-white">
      {shown}
      <span
        aria-hidden
        className="ml-0.5 inline-block w-[0.06em] self-stretch bg-white/70 align-baseline"
        style={{
          height: "1em",
          transform: "translateY(0.14em)",
          animation: "voice-caret 1s steps(1) infinite",
        }}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// The mode toggle (a small segmented control, lab-chrome dark)
// ---------------------------------------------------------------------------

function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: AnimMode;
  onChange: (m: AnimMode) => void;
  disabled: boolean;
}) {
  const modes: AnimMode[] = ["roll", "type", "cut"];
  return (
    <div
      role="tablist"
      aria-label="Word animation"
      className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.04] p-0.5"
    >
      {modes.map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(m)}
            className={
              "rounded-md px-3 py-1 text-[12px] font-medium transition-colors disabled:opacity-40 " +
              (active
                ? "bg-white text-black"
                : "text-white/55 hover:text-white/80")
            }
          >
            {MODE_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The ratified palette (the owner's eight picked lines, type-set cleanly)
// ---------------------------------------------------------------------------

/** The eight golden-set lines, in the owner's exact wording. They appear
 *  VERBATIM wherever a grouping uses one; this strip is the reference key. Each
 *  carries a tiny mono slot label for where it lives in a page. */
const RATIFIED_PALETTE: { slot: string; line: string }[] = [
  { slot: "Thesis", line: "The whole event, in one place, forever" },
  { slot: "Album", line: "Every photo comes to you first" },
  { slot: "Reel", line: "The whole event, cut down to the highlights" },
  { slot: "Pricing", line: "Start free, upgrade when you host again" },
  { slot: "Reel thesis", line: "Every event ends with a reel" },
  { slot: "Live demo", line: "Watch your album fill up" },
  { slot: "Arc", line: "From the first scan to the final cut" },
  { slot: "Album", line: "Every moment, and you decide what stays" },
];

// ---------------------------------------------------------------------------
// The board data model
// ---------------------------------------------------------------------------

/** A header line in the section stack: a tiny slot label, the line itself, and
 *  an optional muted note beneath (a "considered" alternate). */
type HeaderLine = {
  slot: string;
  line: string;
  alt?: string;
  /** True when this exact line is a golden-set pick (rendered verbatim). Marks
   *  it with a tiny dot so the owner sees his own lines land in place. */
  golden?: boolean;
};

/** A single factual line under the "at its most factual" label (the kept
 *  register for the trust + pricing claims). */
type FactualLine = {
  slot: string;
  line: string;
};

type Board = {
  n: number;
  name: string;
  /** The strategy tag under the name (what leads the hero). */
  desc: string;
  /** The site-wide thesis line this grouping proposes. */
  thesis: string;
  goldenThesis?: boolean;
  hero: {
    eyebrow: string;
    /** The H1 split around the {word} token: text BEFORE the kinetic slot and
     *  AFTER it, so the cycling word drops in mid-line. */
    h1Before: string;
    h1After: string;
    subcopy: string;
  };
  /** The decomposition beat: three fact lines + the closing line. */
  decomposition: {
    facts: string[];
    closing: string;
  };
  /** The section-header type stack. */
  headers: HeaderLine[];
  reel: {
    line: string;
    golden?: boolean;
    subcopy: string;
  };
  factual: FactualLine[];
  /** The muted footer: the alternates this grouping considered but did not
   *  ship, so the reasoning is on the page. */
  footer: {
    label: string;
    items: string[];
  };
};

const BOARDS: Board[] = [
  // -------------------------------------------------------------------------
  // G1 - Collection-led. The hero sells the effortless collection; the reel
  // arrives as the closing payoff section.
  // -------------------------------------------------------------------------
  {
    n: 1,
    name: "Collection-led",
    desc: "The hero sells the effortless collection. The reel is the payoff, last.",
    thesis: "The whole event, in one place, forever.",
    goldenThesis: true,
    hero: {
      eyebrow: "One QR. No app. No account.",
      // The golden thesis adapted into the cycling slot: reads with all four
      // words (wedding / birthday / festival / send-off), collection-first.
      h1Before: "The whole ",
      h1After: ", in one place, forever.",
      subcopy:
        "Guests scan one QR and every photo comes to you. No app, no account, no chasing anyone down.",
    },
    decomposition: {
      facts: ["Built from 214 photos.", "Shot by 23 guests.", "Edited by no one."],
      closing:
        "That is one event, kept whole. Every photo in one place, and a reel at the end of it.",
    },
    headers: [
      { slot: "How it works", line: "Scan the code. Upload from any phone." },
      { slot: "The live demo", line: "Watch your album fill up.", golden: true },
      { slot: "The album", line: "Every photo comes to you first.", golden: true },
      {
        slot: "Curation",
        line: "Every moment, and you decide what stays.",
        golden: true,
      },
      { slot: "Trust and privacy", line: "Your event stays yours." },
      { slot: "Pricing", line: "Start free, upgrade when you host again.", golden: true },
      {
        slot: "The reel",
        line: "Every event ends with a reel.",
        golden: true,
      },
    ],
    reel: {
      // The reel is the closing payoff. Its header is the golden reel thesis;
      // its body register is the golden "cut down to the highlights" line.
      line: "The whole event, cut down to the highlights.",
      golden: true,
      subcopy:
        "When the photos are in, they cut into a highlight video, built for you across 14 styles and rendered right on your phone, free.",
    },
    factual: [
      {
        slot: "Trust",
        line: "Location data is stripped from every photo on your phone, before a single byte is uploaded.",
      },
      {
        slot: "Pricing",
        line: "Free is the whole first event: one QR, 2 GB, and a 30-second reel. Upgrade when you host the next one.",
      },
    ],
    footer: {
      label: "Alternates considered for the hero",
      items: [
        "Every photo from your party, in one place. (the current-site line, the clarity model)",
        "One event, every angle, in one place. (tighter, but drops the golden thesis wording)",
        "Rejected: any hero that opens on the reel (buries the collection this grouping leads with).",
      ],
    },
  },

  // -------------------------------------------------------------------------
  // G2 - Arc-led. The hero rides the journey from scan to cut; collection and
  // reel are balanced through the section stack.
  // -------------------------------------------------------------------------
  {
    n: 2,
    name: "Arc-led",
    desc: "The hero rides the journey from scan to cut. Collection and reel balanced.",
    thesis: "From the first scan to the final cut.",
    goldenThesis: true,
    hero: {
      eyebrow: "You throw the party. We keep the rest.",
      // Built on the golden "From the first scan to the final cut" energy, with
      // the kinetic slot up front (reads with all four words).
      h1Before: "Your ",
      h1After: ", from the first scan to the final cut.",
      subcopy:
        "Guests scan one QR and their photos come to you. You get every angle, then a reel to close it out.",
    },
    decomposition: {
      facts: ["Built from 214 photos.", "Shot by 23 guests.", "Edited by no one."],
      closing:
        "One scan in, one cut out. Everything in between lands with you first.",
    },
    headers: [
      { slot: "How it works", line: "Scan, upload, done. No app to install." },
      { slot: "The live demo", line: "Watch your album fill up.", golden: true },
      { slot: "The album", line: "Every photo comes to you first.", golden: true },
      {
        slot: "Curation",
        line: "Every moment, and you decide what stays.",
        golden: true,
      },
      {
        slot: "Trust and privacy",
        line: "Locked to the people you invited.",
      },
      { slot: "Pricing", line: "Start free, upgrade when you host again.", golden: true },
      {
        slot: "The reel",
        line: "The whole event, cut down to the highlights.",
        golden: true,
      },
    ],
    reel: {
      // The arc's payoff header is the golden reel thesis; body sells the reel
      // as the end of the journey.
      line: "Every event ends with a reel.",
      golden: true,
      subcopy:
        "The final cut builds itself from your guests' photos. Pick a look from 14 styles and it renders on your phone, free.",
    },
    factual: [
      {
        slot: "Trust",
        line: "Location data is stripped from every photo on your phone, before a single byte is uploaded.",
      },
      {
        slot: "Pricing",
        line: "Free holds one event, 2 GB, roughly 500 photos, and a 30-second reel. Pro adds video, unlimited events, 60-second reels, and no watermark.",
      },
    ],
    footer: {
      label: "Alternates considered for the hero",
      items: [
        "From the first scan to the final cut. (the golden line straight, no kinetic slot)",
        "Your party, start to finish, in one place. (loses the scan/cut arc this grouping is built on)",
        "Note: the kinetic word tested cleanest on 'wedding' and 'birthday'; 'send-off' runs longest.",
      ],
    },
  },

  // -------------------------------------------------------------------------
  // G3 - Reel-led, tempered. Thesis + hero keep the reel energy (the ONE
  // reel-led grouping), but every section beneath sells the collection first.
  // -------------------------------------------------------------------------
  {
    n: 3,
    name: "Reel-led, tempered",
    desc: "The one reel-led thesis. Every section beneath still sells the collection first.",
    thesis: "Every event ends with a reel.",
    goldenThesis: true,
    hero: {
      eyebrow: "One QR. Every photo. One reel.",
      // The one reel-led hero: the kinetic slot rides the golden reel thesis.
      h1Before: "Every ",
      h1After: " ends with a reel.",
      subcopy:
        "It starts with the photos. Guests scan one QR, every shot comes to you, and the reel is what you get at the end.",
    },
    decomposition: {
      facts: ["Built from 214 photos.", "Shot by 23 guests.", "Edited by no one."],
      closing:
        "The reel is the ending. The 214 photos it came from are yours to keep, in full.",
    },
    headers: [
      // Reel-led thesis, but the stack leads with the collection.
      { slot: "The album", line: "Every photo comes to you first.", golden: true },
      { slot: "How it works", line: "Scan the code. Upload from any phone." },
      { slot: "The live demo", line: "Watch your album fill up.", golden: true },
      {
        slot: "Curation",
        line: "Every moment, and you decide what stays.",
        golden: true,
      },
      { slot: "Trust and privacy", line: "Your event stays yours." },
      { slot: "Pricing", line: "Start free, upgrade when you host again.", golden: true },
      {
        slot: "The reel",
        line: "The whole event, cut down to the highlights.",
        golden: true,
      },
    ],
    reel: {
      // The reel section pays off the thesis, but frames the album as the source.
      line: "The whole event, cut down to the highlights.",
      golden: true,
      subcopy:
        "Every photo your guests took, cut into a highlight video across 14 styles, rendered on your phone, free. The full album stays right where you can reach it.",
    },
    factual: [
      {
        slot: "Trust",
        line: "A locked event shows guests only its name and a photo count. What is inside stays between the people you invited.",
      },
      {
        slot: "Pricing",
        line: "Free is the whole first event: one QR, 2 GB, and a 30-second reel. Upgrade when you host the next one.",
      },
    ],
    footer: {
      label: "The tempering, made explicit",
      items: [
        "Thesis + hero lead on the reel; every section under them leads on the collection.",
        "The album header sits FIRST in the stack on purpose (the value is the easy collection).",
        "Rejected close: 'The party ends. The night doesn't.' (night banned) -> 'The party ends. The album doesn't.'",
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Small shared render pieces
// ---------------------------------------------------------------------------

/** A tiny mono slot label the section stack + factual lines + palette share. */
function SlotLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.16em] text-white/35 uppercase">
      {children}
    </span>
  );
}

/** The muted note beneath a line (a considered alternate). */
function AltLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-0.5 text-[12px] leading-snug text-white/35">{children}</p>
  );
}

/** A tiny dot marking a golden-set line rendered verbatim. */
function GoldenDot() {
  return (
    <span
      aria-hidden
      title="A ratified line, verbatim"
      className="inline-block size-1.5 shrink-0 translate-y-[-0.15em] rounded-full bg-white/60"
    />
  );
}

// ---------------------------------------------------------------------------
// The board renderer (identical structure across all three)
// ---------------------------------------------------------------------------

function VoiceBoard({
  board,
  index,
  mode,
  reduced,
}: {
  board: Board;
  index: number;
  mode: AnimMode;
  reduced: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.11_0_0)] text-[oklch(0.97_0_0)] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.5)]">
      {/* Mono eyebrow: board number + name + strategy tag. */}
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
        {/* The site-wide thesis line. */}
        <div className="mb-9">
          <div className="flex items-center gap-2">
            <SlotLabel>Site thesis</SlotLabel>
            {board.goldenThesis && <GoldenDot />}
          </div>
          <p
            data-dir-display
            className="mt-1.5 text-[26px] leading-[1.05] text-white"
          >
            {board.thesis}
          </p>
        </div>

        {/* HERO BLOCK at display scale, with the kinetic word slot. */}
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
            <KineticWord index={index} mode={mode} reduced={reduced} />
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

        {/* THE DECOMPOSITION BEAT: three fact lines + the closing line. */}
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

        {/* SECTION HEADERS as a type stack with tiny muted slot labels. Golden
            lines carry a dot; considered alternates render beneath. */}
        <div className="mt-11 border-t border-white/10 pt-8">
          <SlotLabel>Section headers</SlotLabel>
          <div className="mt-4 flex flex-col divide-y divide-white/[0.06]">
            {board.headers.map((h) => (
              <div
                key={h.slot + h.line}
                className="grid grid-cols-[128px_1fr] items-baseline gap-4 py-3.5"
              >
                <SlotLabel>{h.slot}</SlotLabel>
                <div>
                  <p
                    data-dir-display
                    className="flex items-center gap-2 text-[21px] leading-tight text-white/90"
                  >
                    {h.line}
                    {h.golden && <GoldenDot />}
                  </p>
                  {h.alt && <AltLine>{h.alt}</AltLine>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* /REEL hero line + subcopy, then the two factual lines. */}
        <div className="mt-11 border-t border-white/10 pt-8">
          <SlotLabel>/reel hero</SlotLabel>
          <p
            data-dir-display
            className="mt-2 flex items-center gap-2 text-[30px] leading-[1.04] text-white"
          >
            {board.reel.line}
            {board.reel.golden && <GoldenDot />}
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            {board.reel.subcopy}
          </p>

          <div className="mt-7">
            <SlotLabel>The voice at its most factual (trust + pricing)</SlotLabel>
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

        {/* Muted footer: the alternates this grouping considered. */}
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

// ---------------------------------------------------------------------------
// The ratified-palette strip
// ---------------------------------------------------------------------------

function RatifiedPalette() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.13_0_0)] text-[oklch(0.97_0_0)] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.5)]">
      <div className="border-b border-white/10 px-8 py-5">
        <div className="flex items-center gap-2">
          <SlotLabel>The ratified palette</SlotLabel>
          <GoldenDot />
        </div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/50">
          These eight lines are your picks from round one. They appear verbatim
          in the three groupings below, each anchored on a different one.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-8 py-7 sm:grid-cols-2">
        {RATIFIED_PALETTE.map((p) => (
          <div key={p.slot + p.line}>
            <SlotLabel>{p.slot}</SlotLabel>
            <p
              data-dir-display
              className="mt-1 text-[19px] leading-tight text-white/90"
            >
              {p.line}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

export function MarketingVoiceBoards() {
  const reduced = usePrefersReducedMotion();
  const [mode, setMode] = useState<AnimMode>("roll");
  const index = useKineticIndex(reduced);

  return (
    <div className="py-4">
      {/* The caret blink keyframe for the Type mode, scoped to this touchpoint. */}
      <style>{`@keyframes voice-caret { 0%, 50% { opacity: 1 } 50.01%, 100% { opacity: 0 } }`}</style>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Round 2, rebuilt on your ratified palette. Three groupings that all
          anchor on your eight lines but differ in what the hero leads with: G1
          the effortless collection, G2 the scan-to-cut arc, G3 the reel (the one
          reel-led thesis, tempered so every section beneath still sells the
          collection). Event and party language throughout, {`"night"`} retired.
          Copy is type-set dark-mono at display scale; a dot marks each ratified
          line landing verbatim. The kinetic H1 word cycles across all three
          boards in sync; pick how it animates below.
        </p>
        <div className="flex flex-col items-end gap-1">
          <ModeToggle mode={mode} onChange={setMode} disabled={reduced} />
          <span className="text-[11px] text-muted-foreground">
            {reduced
              ? "Reduced motion: holding “event”"
              : "Roll is the default"}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <RatifiedPalette />
      </div>

      <div className="mt-12 flex flex-col gap-12">
        {BOARDS.map((board) => (
          <VoiceBoard
            key={board.n}
            board={board}
            index={index}
            mode={mode}
            reduced={reduced}
          />
        ))}
      </div>
    </div>
  );
}
