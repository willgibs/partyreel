"use client";

// the board's own sheet (moved out of design.css); it leaves with the board.
import "./marketing-open.css";

import Image from "next/image";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { DesktopFrame } from "../components/marketing-lab-shared";

/**
 * Touchpoint: MARKETING HERO SUBSTRATE (Track B F5 round 2, 2026-08-25).
 *
 * Decides the PRODUCTION hero. The cinema hero is ruled (Direction B) but two
 * things were never judged against MOVING footage: the word animation (the
 * round-2 voice finding: a hard cut needs an IMAGE cut to motivate it) and
 * the substrate mechanism itself. This page is the full-bleed cinema-dark
 * hero with:
 *
 *  - a SUBSTRATE SLOT that plays /marketing/reels/hero-candidate-01.mp4 when
 *    the render session has landed it (poster-first, play() rejection caught
 *    so the poster stays, use-ambient-pause wired) and FALLS BACK to the
 *    4-shot Ken Burns crossfade montage over manifest images while the file
 *    404s. The page works both ways; a status chip says which one is live.
 *  - the kinetic H1 parameterized across ALL THREE voice groupings (a
 *    segmented control, like the boards), so an unanswered voice pick cannot
 *    stall the round; the words cycle wedding/birthday/festival/send-off.
 *  - the word-animation toggle Roll / Type / Cut (the three components ported
 *    from the voice boards; Roll default). The point: judge each against the
 *    footage's own cuts.
 *  - story-style progress segments + the mono timecode, synced STATELESSLY to
 *    video.currentTime against the candidate's shot-boundary array (the
 *    requestVideoFrameCallback + rAF-fallback pattern; boundaries are
 *    prop-drilled so the render session can update them), or to the crossfade
 *    timer in fallback mode.
 *
 * Reduced motion: the static poster (or first still), the word "event", no
 * cycling, no loops (use-ambient-pause composes the preference).
 */

/* ---------------------------------------------------------------------------
 * The candidate contract. The render session lands the files and updates
 * THESE numbers only (shot cuts in seconds, exact 1/24 multiples); everything
 * below derives from them, montage rhythm included, so the two substrates
 * stay comparable.
 * ------------------------------------------------------------------------- */

export type HeroCandidate = {
  src: string;
  poster: string;
  durationSeconds: number;
  /** Shot-cut times in seconds, first shot at 0, strictly ascending. */
  shotBoundaries: number[];
};

// Values from the F4 render session (recipe: mixed-6 clips, classic, seed 73 —
// see MARKETING_REELS "hero-candidate-01"): planReel-extracted transition
// midpoints, so the word flips exactly where the engine actually cuts.
const HERO_CANDIDATE: HeroCandidate = {
  src: "/marketing/reels/hero-candidate-01.mp4",
  poster: "/marketing/posters/hero-candidate-01.jpg",
  durationSeconds: 13.083333333333334,
  shotBoundaries: [0, 2.375, 4.5, 6.541666666666667, 8.666666666666666, 10.75],
};

/** Montage stills, one per shot/word (wedding, birthday, festival, send-off). */
const MONTAGE_IDS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-toast",
];

/* ---------------------------------------------------------------------------
 * The kinetic word engine, ported from marketing-voice-boards.tsx (round 2).
 * The one behavioral change: the INDEX is driven by the SHOT (video boundary
 * or montage timer), not a free-running interval, so the word cuts WITH the
 * image, which is exactly what this round judges.
 * ------------------------------------------------------------------------- */

const KINETIC_WORDS = ["wedding", "birthday", "festival", "send-off"] as const;

type AnimMode = "roll" | "type" | "cut";

const MODE_LABEL: Record<AnimMode, string> = {
  roll: "Roll",
  type: "Type",
  cut: "Cut",
};

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
  const word = KINETIC_WORDS[index % KINETIC_WORDS.length];
  return (
    <span className="relative inline-flex align-baseline">
      {mode === "roll" && <RollWord word={word} />}
      {mode === "type" && <TypeWord word={word} />}
      {mode === "cut" && (
        // key forces a fresh node each change: an instant, transition-free cut.
        // A cut's width snap is part of the cut (it lands WITH an image cut).
        <span key={word} className="text-white">
          {word}
        </span>
      )}
    </span>
  );
}

/** Roll: a vertical swap, outgoing up + fading beneath the incoming word
 *  sliding up from below, both clipped to the line box. The box WIDTH is
 *  measured per word and transitioned alongside the roll: the old widest-word
 *  reservation left "a huge inline gap" on short words (Will, 2026-08-25) --
 *  the sentence must close up around each word, smoothly. */
function RollWord({ word }: { word: string }) {
  const [prev, setPrev] = useState<string | null>(null);
  const [entered, setEntered] = useState(true);
  const [width, setWidth] = useState<number | null>(null);
  const wordRef = useRef(word);
  const sizerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (wordRef.current === word) return;
    setPrev(wordRef.current);
    wordRef.current = word;
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    const done = setTimeout(() => setPrev(null), 340);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [word]);

  // Measure the incoming word off the hidden sizer (same font by inheritance)
  // and animate the explicit width to it. Re-measures per word change, so a
  // late font load self-corrects on the next cycle.
  useLayoutEffect(() => {
    if (sizerRef.current) setWidth(sizerRef.current.offsetWidth);
  }, [word]);

  const move =
    "transform 260ms var(--ease-emphasis), opacity 260ms var(--ease-emphasis)";
  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{
        width: width === null ? undefined : width,
        transition: `width 260ms var(--ease-emphasis)`,
      }}
    >
      {/* The sizer holds the box pre-measure (first paint) and is the
          measuring target after; the explicit width owns layout from then on. */}
      <span aria-hidden ref={sizerRef} className="invisible whitespace-nowrap">
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

/** Type: delete the old word char-by-char, then type the new word in, a
 *  subtle caret blinking at the end (mkt-caret keyframe, design.css). */
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
      if (current.length > 0 && !word.startsWith(current)) {
        current = current.slice(0, -1);
      } else if (current.length < word.length) {
        current = word.slice(0, current.length + 1);
      } else {
        return;
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
          animation: "mkt-caret 1s steps(1) infinite",
        }}
      />
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * The voice groupings (H1 split around the kinetic slot; eyebrow + subcopy
 * from the round-2 boards so each grouping reads in its own register).
 * ------------------------------------------------------------------------- */

type Grouping = {
  id: string;
  label: string;
  eyebrow: string;
  before: string;
  after: string;
  subcopy: string;
};

const GROUPINGS: Grouping[] = [
  {
    // RULED (Will, 2026-08-25, in-chat): the site thesis + subhead verbatim
    // (see marketing-voice.ts). G2/G3 stay mounted for comparison only.
    id: "g1",
    label: "Ruled thesis",
    eyebrow: "One QR. No app. No account.",
    before: "The whole ",
    after: ", in one album.",
    subcopy:
      "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
  },
  {
    id: "g2",
    label: "G2 Arc",
    eyebrow: "You throw the party. We keep the rest.",
    before: "Your ",
    after: ", from the first scan to the final cut.",
    subcopy:
      "Guests scan one QR and their photos come to you. You get every angle, then a reel to close it out.",
  },
  {
    id: "g3",
    label: "G3 Reel",
    eyebrow: "One QR. Every photo. One reel.",
    before: "Every ",
    after: " ends with a reel.",
    subcopy:
      "It starts with the photos. Guests scan one QR, every shot comes to you, and the reel is what you get at the end.",
  },
];

/* ---------------------------------------------------------------------------
 * The hero
 * ------------------------------------------------------------------------- */

type Substrate = "probing" | "video" | "montage";

/** rVFC feature detection without depending on the lib.dom version. */
type VfcVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    cb: (now: number, meta: { mediaTime: number }) => void,
  ) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

function formatTimecode(t: number, dur: number) {
  const ss = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
  return `00:${ss(t)} / 00:${ss(Math.round(dur))}`;
}

function SubstrateHero({
  grouping,
  mode,
  substrate,
  candidate,
}: {
  grouping: Grouping;
  mode: AnimMode;
  substrate: Substrate;
  candidate: HeroCandidate;
}) {
  const reduced = usePrefersReducedMotion();
  // The loop-pause contract: offscreen/hidden/reduced all pause the substrate
  // (the video imperatively, the montage via data-paused + the timer gate).
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const [shot, setShot] = useState(0);
  const [videoLive, setVideoLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timeRef = useRef<HTMLSpanElement | null>(null);

  const boundaries = candidate.shotBoundaries;
  const shotCount = boundaries.length;
  const dur = candidate.durationSeconds;
  // The montage derives its rhythm from the same boundary math as the video,
  // so Roll/Type/Cut read against the same cut cadence either way.
  const montageHoldMs = (dur / shotCount) * 1000;

  // Video transport: play/pause rides the ambient-pause signal; a rejected
  // play() (iOS Low Power Mode, data saver) leaves the poster, never a spinner.
  useEffect(() => {
    if (substrate !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else
      v.play().catch(() => {
        // The poster stays; no spinner (the production contract).
      });
  }, [substrate, paused]);

  // STATELESS sync: every presented frame derives the shot index + segment
  // fills + timecode from currentTime against the boundaries. Nothing
  // increments, so the native loop wrap self-heals. rVFC (mediaTime) with an
  // rAF fallback; fills and timecode write through refs (no re-render per
  // frame), only a shot CHANGE goes through state (the word needs React).
  useEffect(() => {
    if (substrate !== "video" || reduced) return;
    const v = videoRef.current as VfcVideo | null;
    if (!v) return;
    let raf = 0;
    let vfc = 0;
    let alive = true;

    const sync = (t: number) => {
      let idx = 0;
      for (let i = 0; i < boundaries.length; i++)
        if (t >= boundaries[i]) idx = i;
      setShot((s) => (s === idx ? s : idx));
      boundaries.forEach((b, i) => {
        const fill = segRefs.current[i];
        if (!fill) return;
        const end = i + 1 < boundaries.length ? boundaries[i + 1] : dur;
        const p = t >= end ? 1 : t < b ? 0 : (t - b) / (end - b);
        fill.style.transform = `scaleX(${p})`;
      });
      if (timeRef.current) timeRef.current.textContent = formatTimecode(t, dur);
    };

    if (v.requestVideoFrameCallback && v.cancelVideoFrameCallback) {
      const loop = (_now: number, meta: { mediaTime: number }) => {
        if (!alive) return;
        sync(meta.mediaTime);
        vfc = v.requestVideoFrameCallback!(loop);
      };
      vfc = v.requestVideoFrameCallback(loop);
      return () => {
        alive = false;
        v.cancelVideoFrameCallback?.(vfc);
      };
    }
    const loop = () => {
      if (!alive) return;
      sync(v.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [substrate, reduced, boundaries, dur]);

  // Montage transport: the crossfade timer, gated by the pause signal (the
  // hold restarts on resume; the Ken Burns drift freezes via data-paused).
  useEffect(() => {
    if (substrate !== "montage" || reduced || paused) return;
    const t = setInterval(() => {
      setShot((s) => (s + 1) % shotCount);
    }, montageHoldMs);
    return () => clearInterval(t);
  }, [substrate, reduced, paused, shotCount, montageHoldMs]);

  const word = reduced ? 0 : shot;
  const montageShots = MONTAGE_IDS.map((id) => marketingImage(id));

  return (
    <section
      ref={pauseRef}
      data-paused={paused ? "true" : undefined}
      className="relative h-[560px] overflow-hidden"
    >
      {/* THE SUBSTRATE SLOT. Video mode is poster-first: the poster image sits
          UNDER the video (the production LCP contract; never the <video>
          poster attribute) and the video fades over it once frames flow. */}
      {substrate === "video" && (
        <div className="absolute inset-0" aria-hidden>
          <Image
            src={candidate.poster}
            alt=""
            fill
            sizes="992px"
            priority
            className="object-cover"
          />
          <video
            ref={videoRef}
            src={candidate.src}
            preload="metadata"
            muted
            loop
            playsInline
            onPlaying={() => setVideoLive(true)}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
              videoLive ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}
      {substrate === "montage" && (
        <div className="absolute inset-0" aria-hidden>
          {montageShots.map((m, i) => (
            <div
              key={m.id}
              className="absolute inset-0 transition-opacity duration-[800ms] ease-linear"
              style={{ opacity: i === shot ? 1 : 0 }}
            >
              <div
                data-mkt-shot
                className="absolute inset-0"
                style={{ "--shot-i": i } as React.CSSProperties}
              >
                <Image
                  src={m.src}
                  alt=""
                  fill
                  sizes="992px"
                  priority={i === 0}
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* The scrim keeps the lower-third type legible over any footage. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-10 py-6">
        <span data-dir-display className="text-lg text-white">
          Partyreel
        </span>
        <div className="flex items-center gap-6 text-[13px] text-white/70">
          <span>Pricing</span>
          <button
            type="button"
            data-dir-press
            className="h-8 rounded-[var(--radius-action-sm)] border border-white/25 px-4 text-[13px] font-medium text-white"
          >
            Log in
          </button>
        </div>
      </header>

      <div className="absolute inset-x-0 bottom-0 px-10 pb-8">
        <p className="text-[12px] font-medium tracking-[0.22em] text-white/60 uppercase">
          {grouping.eyebrow}
        </p>
        <h1
          data-dir-display
          className="mt-3 text-[52px] leading-[1.0] text-white"
        >
          {grouping.before}
          <KineticWord index={word} mode={mode} reduced={reduced} />
          {grouping.after}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
          {grouping.subcopy}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            data-dir-press
            className="h-11 rounded-[var(--radius-action)] bg-white px-6 text-sm font-medium text-black"
          >
            Start free
          </button>
          <button
            type="button"
            data-dir-press
            className="flex h-11 items-center gap-2 rounded-[var(--radius-action)] border border-white/25 px-5 text-sm font-medium text-white"
          >
            <Play className="size-4 fill-current" />
            Watch a sample reel
          </button>
        </div>

        {/* Story-style progress + the mono timecode. Video mode writes the
            fills statelessly per frame; montage mode rides the shot-keyed
            mkt-progress animation ([data-mkt-progress] joins the pause rule). */}
        <div className="mt-7 flex items-center gap-4">
          <div className="flex flex-1 gap-1.5">
            {boundaries.map((b, i) => (
              <span
                key={b}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
              >
                {substrate === "video" ? (
                  <span
                    ref={(el) => {
                      segRefs.current[i] = el;
                    }}
                    className="block h-full w-full origin-left bg-white"
                    style={{ transform: "scaleX(0)" }}
                  />
                ) : (
                  <span
                    key={`${shot}-${i}`}
                    data-mkt-progress
                    className="block h-full w-full origin-left bg-white"
                    style={{
                      transform: i < shot ? "scaleX(1)" : "scaleX(0)",
                      animation:
                        !reduced && substrate === "montage" && i === shot
                          ? `mkt-progress ${montageHoldMs}ms linear both`
                          : undefined,
                    }}
                  />
                )}
              </span>
            ))}
          </div>
          <span
            ref={timeRef}
            className="font-mono text-[11px] text-white/50 tabular-nums"
          >
            {substrate === "video"
              ? formatTimecode(0, dur)
              : formatTimecode((shot * dur) / shotCount, dur)}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The page: controls above one hero (grouping x word-mode x substrate), so
 * every pairing is inspectable live against the same footage.
 * ------------------------------------------------------------------------- */

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={
              "rounded-md px-3 py-1 text-[12px] font-medium transition-colors " +
              (active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function MarketingHeroSubstrateVariants() {
  const reduced = usePrefersReducedMotion();
  // Default = the ruled thesis (Will, 2026-08-25); g2/g3 remain for comparison.
  const [groupingId, setGroupingId] = useState("g1");
  const [mode, setMode] = useState<AnimMode>("roll");
  const [substrate, setSubstrate] = useState<Substrate>("probing");
  const [runId, setRunId] = useState(0);

  // Probe the candidate mp4 once: present -> the video substrate, absent ->
  // the montage fallback (the render session lands the file later; the
  // prototype must work both ways).
  useEffect(() => {
    let alive = true;
    fetch(HERO_CANDIDATE.src, { method: "HEAD" })
      .then((r) => {
        if (alive) setSubstrate(r.ok ? "video" : "montage");
      })
      .catch(() => {
        if (alive) setSubstrate("montage");
      });
    return () => {
      alive = false;
    };
  }, []);

  const grouping = GROUPINGS.find((g) => g.id === groupingId) ?? GROUPINGS[0];

  return (
    <div className="flex flex-col gap-6 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        The production hero, judged against moving footage. Switch the voice
        grouping and the word animation below; the word cuts WITH the
        substrate&apos;s shots either way (the round-2 finding: a hard cut needs
        an image cut to motivate it). When the render session lands
        hero-candidate-01.mp4 this same page plays it poster-first; until then
        it runs the Ken Burns montage fallback on the same cut rhythm.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel="Voice grouping"
          options={GROUPINGS.map((g) => ({ id: g.id, label: g.label }))}
          value={groupingId}
          onChange={setGroupingId}
        />
        <SegmentedControl
          ariaLabel="Word animation"
          options={(Object.keys(MODE_LABEL) as AnimMode[]).map((m) => ({
            id: m,
            label: MODE_LABEL[m],
          }))}
          value={mode}
          onChange={setMode}
        />
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-transform active:scale-95"
        >
          <RotateCcw className="size-3.5" />
          Restart
        </button>
        <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {substrate === "probing" && "Probing the substrate"}
          {substrate === "video" && "Substrate: hero-candidate-01.mp4"}
          {substrate === "montage" &&
            "Substrate: montage fallback (mp4 not rendered yet)"}
        </span>
        {reduced && (
          <span className="text-[11px] text-muted-foreground">
            Reduced motion: static still, the word {'"event"'}
          </span>
        )}
      </div>

      <div className="mono" data-mode="dark">
        <DesktopFrame>
          <div className="bg-[oklch(0.11_0_0)] text-[oklch(0.97_0_0)]">
            <SubstrateHero
              key={runId}
              grouping={grouping}
              mode={mode}
              substrate={substrate}
              candidate={HERO_CANDIDATE}
            />
            {/* Below-the-fold runway so the ambient pause can be FELT: scroll
                the hero away inside the frame and the loop stops; scroll back
                and it resumes. */}
            {/* Taller than the frame viewport on purpose: the hero must be able
                to scroll FULLY out of it before the IO can report it gone. */}
            <div className="flex h-[900px] flex-col items-center justify-center gap-2 border-t border-white/10 px-10 text-center">
              <p className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">
                Below the fold
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-white/55">
                With the hero scrolled away (or the tab hidden) the substrate
                pauses; scroll back up and it resumes. use-ambient-pause owns
                the wiring, exactly as production will.
              </p>
            </div>
          </div>
        </DesktopFrame>
      </div>
    </div>
  );
}
