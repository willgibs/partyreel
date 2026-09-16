"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  type BoardApi,
  BoardPage,
  Cell,
  ConceptCard,
  FitStage,
  Labeled,
  type Mode,
  ReplayButton,
  Specimen,
  Stage,
  useMountOnApproach,
  useReplay,
} from "@/components/lab";
import { CinemaHero } from "@/components/marketing/sections/home/cinema-hero";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { inflow } from "./inflow";
import { scan } from "./scan";
import {
  type Concept,
  type ConceptId,
  copyFor,
  type CopyMode,
  FRAMES,
  GUTTER,
  LADDER,
  Photo,
} from "./shared";
import { source } from "./source";
import { HOME_HERO } from "./spec";

/**
 * THE HOME HERO BOARD (rounds one to four, 2026-09-12 to 2026-09-15; on the
 * kit's template since the Library x Lab migration wave, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` and only there: the question, the
 * verdict, the four one-word calls, the three concepts with the copy each one
 * proposes, the departures and the assets. What is left here is what a board
 * should be and nothing else, the evidence for each declared section as a
 * function of the declared state.
 *
 * Three things the migration changed about how it reads, all of them the
 * template's rather than this board's taste:
 *
 * 1. THE ANSWER IS THE FIRST SCREEN. Round four opened with two paragraphs of
 *    how the ruling got here and hung each concept's metadata off the foot of
 *    its stage in an 11px table. The verdict and the pills a reviewer can reply
 *    with are above everything now, and the history is one collapsed button at
 *    the end.
 * 2. THE CONCEPT SWITCH IS DECLARED STATE, so `?candidate=scan` opens the scan
 *    alone and a review note can be pasted as a link. Clicking a card's name
 *    isolates it and clicking again returns the comparison.
 * 3. THE SHIPPED HERO IS BACK AT THE BOTTOM. Round one's whole case was the
 *    scroll from the candidates to the thing they replace, and round two lost
 *    it when the board was rebuilt around the QR question. It is mounted from
 *    production code, on approach, in the same canvas.
 *
 * ★ NO `bodySkin` ON THESE STAGES, and that is a deliberate reversal of round
 * four. `data-mkt-skin` flips the whole page through `body:has(...)`, which
 * made the lab's own chrome cinema-dark whatever theme the reviewer had chosen;
 * harmless when the board was three stages and nothing else, wrong now that the
 * first screen is the answer block and the last is the review panel. Will's
 * lab-surface ruling is that dark and light are chosen separately. The stages
 * carry cinema themselves, which is where it belongs.
 *
 * Lab convention, deliberate and unchanged: nothing here wires
 * use-ambient-pause on scroll (the lab never pauses; side-by-side comparison
 * wants everything running). Loops pause on a hidden TAB only, through the
 * stage's data-paused, which costs nothing and cannot misfire. Production
 * wiring is use-ambient-pause, exactly as the shipped hero has it.
 */

/** The engines, by the id the spec's candidates carry. */
const ENGINES: Record<ConceptId, Concept> = { source, scan, inflow };
const ORDER: readonly ConceptId[] = ["source", "scan", "inflow"];

export function HomeHeroBoard() {
  const { runId, replay } = useReplay();
  const qrUrl = DEMO_EVENT_URL ?? null;
  // The shipped hero is 25 images with 7 of them eager; mounting it with the
  // board would cost the three candidates their first paint for nothing.
  const [todayRef, todaySeen] = useMountOnApproach();

  return (
    <BoardPage
      spec={HOME_HERO}
      dock={() => <ReplayButton runId={runId} onReplay={replay} />}
      evidence={(id, state, api) => {
        const mode = state.canvas as Mode;
        const copy = state.copy as CopyMode;
        const pick = state.candidate as ConceptId | "all";
        switch (id) {
          case "concepts":
            return (
              <Concepts
                mode={mode}
                copy={copy}
                pick={pick}
                qrUrl={qrUrl}
                runId={runId}
                api={api}
              />
            );
          case "words":
            return <Words mode={mode} />;
          case "stand-ins":
            return <StandIns mode={mode} />;
          case "today":
            return (
              <div ref={todayRef}>
                {/* The note carries the lockup ask's OTHER option by name: the
                    board builds no "left" candidate, so the shipped hero is
                    the only place a reviewer can see what Left, like every
                    other page actually looks like. */}
                <Labeled
                  name="The shipped hero"
                  note="cinema-hero.tsx, from production code, in the canvas the candidates are judged in. Its type runs Left, like every other page, which is the lockup ask's other option."
                >
                  <Stage
                    key={`today-${mode}-${runId}`}
                    mode={mode}
                    ground="cinema"
                  >
                    {todaySeen ? <CinemaHero /> : null}
                  </Stage>
                </Labeled>
              </div>
            );
          default:
            return null;
        }
      }}
    />
  );
}

/**
 * The three concepts, each on its own cinema canvas inside the kit's card.
 *
 * ★ THE STAGE IS KEYED ON EVERY PIECE OF STATE THAT CHANGES THE COMPOSITION.
 * Every arrival on this board is a CSS animation with `animation-fill-mode:
 * both`, so the honest way to run one again is a remount; a canvas or a copy
 * flip is a different composition and has to arrive rather than cut.
 */
function Concepts({
  mode,
  copy,
  pick,
  qrUrl,
  runId,
  api,
}: {
  mode: Mode;
  copy: CopyMode;
  pick: ConceptId | "all";
  qrUrl: string | null;
  runId: number;
  api: BoardApi;
}) {
  const shown = pick === "all" ? ORDER : [pick];
  return (
    <div className="flex flex-col gap-8">
      {shown.map((id) => {
        const candidate = HOME_HERO.candidates.find((c) => c.id === id);
        if (!candidate) return null;
        return (
          <ConceptCard
            key={id}
            candidate={candidate}
            selected={pick === id}
            // The name is the switch: one click isolates this concept (and
            // writes it into the URL), a second returns the comparison.
            onSelect={() =>
              api.setState({ candidate: pick === id ? "all" : id })
            }
          >
            <Stage
              key={`${id}-${mode}-${copy}-${runId}`}
              mode={mode}
              ground="cinema"
            >
              {ENGINES[id].render({ mode, copy, scrim: false, qrUrl, runId })}
            </Stage>
          </ConceptCard>
        );
      })}
    </div>
  );
}

/**
 * The four lockups at the size they ship.
 *
 * ★ EACH ONE IS LABELLED WITH THE HEADLINE ASK'S OWN OPTION (the clarity round,
 * 2026-09-15). That ask offers "The site's one line" and "The picture's own
 * line", and those exact words are now the labels here AND on the dock's
 * Headline switch, so a reviewer who met the ask on the desk finds the words he
 * was offered on the thing he is judging. "The site thesis" and "Proposed by"
 * were the board's own names for them and nobody else's.
 *
 * ★ THE HEADLINE IS A `<p>` HERE, NOT AN `<h1>`, and this is the only place on
 * the board where that is true. The candidates above render real h1s inside
 * real compositions, which is what the h1 rules are about; four more h1s in a
 * type specimen would put four page titles in one document for a screen reader
 * and prove nothing the classes do not. The face, the ladder rung and the
 * leading are the shipped ones.
 *
 * ★ AND THE LEADING COMES AFTER THE LADDER CLASS. A Tailwind size utility may
 * carry a line-height, so a `leading-*` written before it is the one that
 * loses; it bit two concepts before it was written down.
 */
function Words({ mode }: { mode: Mode }) {
  const lockups = [
    {
      id: "ruled",
      name: "The site's one line",
      note: "The site thesis, ruled 2026-08-25 in marketing-voice.ts. What all three pictures render unless the dock's Headline switch is on the picture's own line.",
      copy: copyFor({ id: "source" }, "ruled"),
    },
    // The note names WHICH picture proposed it; the card above already carries
    // that picture's case, so nothing here repeats the argument.
    ...ORDER.map((id) => ({
      id,
      name: "The picture's own line",
      note: `Proposed by ${HOME_HERO.candidates.find((c) => c.id === id)?.name ?? id}.`,
      copy: copyFor({ id }, "proposed"),
    })),
  ];

  return (
    <div className="flex flex-col gap-8">
      {lockups.map((l) => (
        <Labeled key={l.id} name={l.name} note={l.note}>
          <FitStage mode={mode} ground="cinema">
            <div
              className={`flex flex-col items-center gap-5 py-14 text-center ${GUTTER[mode].x}`}
            >
              <p
                className={`font-heading text-balance text-white ${LADDER.xl[mode]} leading-[1.02]`}
              >
                {l.copy.h1}
              </p>
              <p
                className={`max-w-[46ch] text-white/70 ${mode === "desktop" ? "text-lg" : "text-sm"} leading-relaxed`}
              >
                {l.copy.subhead}
              </p>
              <p className="text-[11px] tracking-wide text-white/45 uppercase">
                {l.copy.primary.label}
                <span className="mx-2 text-white/25">|</span>
                {l.copy.secondary}
              </p>
            </div>
          </FitStage>
        </Labeled>
      ))}
    </div>
  );
}

/**
 * The twelve stand-ins at 120px, the size the corridor reads them at.
 *
 * The asset ask on this board is the biggest one it carries and it is written
 * as a sentence about framing ("tight enough to read at 120 px, never a wide
 * room shot"). A sentence about a size is a thing to look at, so it is looked
 * at: on the cinema ground, at that size, in the order the corridor cycles
 * them. Lazy on purpose, the one place on the board where that is right: these
 * are not a hero, they are a catalogue of what a hero is waiting for.
 */
function StandIns({ mode }: { mode: Mode }) {
  return (
    <FitStage mode={mode} ground="cinema">
      <div className={`py-8 ${GUTTER[mode].x}`}>
        <Specimen cols={mode === "desktop" ? 6 : 2} gap={4}>
          {FRAMES.map((id, i) => (
            <Cell key={id} name={id}>
              <Photo
                index={i}
                sizes="120px"
                eager={false}
                className="size-[120px] rounded-[3px]"
              />
            </Cell>
          ))}
        </Specimen>
      </div>
    </FitStage>
  );
}
