import type { ReactNode } from "react";

import {
  type Ask,
  type AskAfter,
  type BoardSpec,
  type BoardState,
  type CarriedCall,
  type Control,
  defineBoard,
  type Section,
} from "./board-spec";

/**
 * AN EXPLORATION IS A LIST OF DECISIONS (Will, 2026-09-17).
 *
 * His bar, in his words: a decision should take under a minute. "Read a
 * question, worded in clean natural language, that clearly asks me to make one
 * decision (winner) within the group · Preview each option fully,
 * visuals-forward where possible, to quickly find a favorite or request
 * refinements, with any relevant configs included · Select my winner, leave
 * optional notes, and onto the next." When that holds, agents can be run in
 * parallel on anything and real decisions come back with nothing lost.
 *
 * ★ THE MACHINERY WAS NEVER THE PROBLEM; THE AUTHORING SURFACE WAS. `BoardSpec`
 * asks an agent to write a PAGE (sections, candidates, departures, assets, a
 * verdict, links, a catalog) and the steps are DERIVED from it. Two things
 * follow, and both are what he keeps objecting to:
 *
 *  1. An option's preview is not something you write. It is "a section id plus
 *     a state patch" that some section has to be built to vary on, `look` is
 *     the legal way out, and on 2026-09-17 **eight of eighteen open steps had
 *     nothing to press**. Nothing in the shape required an option to be drawn.
 *  2. The question arrives wrapped in the page's argument.
 *
 * So this is a CONSTRUCTOR, not a second system. It takes the questions and
 * emits an ordinary `BoardSpec`, which means the desk, the walk, the step, the
 * review store, the grammar, `lab:review` and `lab:demo` all keep working with
 * no seam. Three things downstream made that the only safe route: `CopySoFar`
 * resolves a board through `boardSpec()` IN THE BROWSER and silently drops the
 * answers of a board it cannot find; the step's cross-board Next hardcodes
 * `/design/lab/<board>`; and `registry.test.ts` and `lab-review.mjs` share a
 * `sandbox/<id>/spec.ts` gate that pulls both ways.
 *
 * ★ EVERY OPTION IS PICTURED BY CONSTRUCTION. `drawable()` in `step.tsx` is
 * `board && step.section && (option.state || step.control)`. This fills in all
 * three for every ask, so the shape where an option has nothing to press no
 * longer exists. That is the eight-of-eighteen closed at its source rather than
 * policed by another test.
 *
 * What is deliberately NOT here: keep / refine / kill over N cards. It is not
 * "one winner within the group", it was the wordiest step in the lab, and it
 * reaches back into `Catalog`, which needs a hand-written board.
 */

/** One option: the token the ledger stores, the name he reads, the cost. */
export type DecisionOption = {
  /** One word, hyphens allowed. The ledger stores this. */
  readonly id: string;
  /** What he reads on the tile: "On the ladder: 18 at a phone". */
  readonly label: string;
  /** One sentence: what picking it does, and what it costs. */
  readonly means?: string;
};

/** One decision: a question, its options, and which one the agent recommends. */
export type Decision = {
  /** Stable kebab id. The ledger stores it, never the question text. */
  readonly id: string;
  /** A real question in plain words, ending in a question mark. */
  readonly question: string;
  /**
   * Two to four words naming the decision, for the places a whole question
   * does not fit: the section's title, its control's label, the evidence pill.
   * Defaults to the question, cut at a word boundary, which is always legal but
   * rarely as good as a name.
   */
  readonly label?: string;
  /** What the thing is and where it lives, for someone who has not read anything. */
  readonly context: string;
  /** Two or more. Each one is drawn; there is no shape here where it is not. */
  readonly options: readonly [DecisionOption, DecisionOption, ...DecisionOption[]];
  /** The id of one of `options`. */
  readonly recommended: string;
  /**
   * THE OPTION THAT IS THE SURFACE AS BUILT, when one of them is (lab-tides,
   * 2026-09-19).
   *
   * ★ EVERY OTHER AXIS STARTS AT TODAY, NOT AT THIS DECISION'S RECOMMENDATION.
   * The derived control's default is the state the board is READ in, so a board
   * that defaults every control to its own recommendation draws the seven
   * decisions around the one being asked already wearing candidates: app-shape
   * caught "one urgency-ordered scroll, AS TODAY" drawn with the candidate
   * share block in it, and "the inbox of everything, as today" drawn in rows.
   * An option that says "as today" has to BE today. Four boards then carried a
   * `TODAY` map and re-mapped the controls after the constructor had run; this
   * is that workaround lifted into the constructor, where it belongs.
   *
   * The step still OPENS on the recommendation for its own question
   * (`step.tsx` reads `step.recommended`, never the control's default), so
   * declaring this changes what the other decisions wear and nothing else.
   * Left out, the default stays the recommendation, which is why every standing
   * board is untouched by this.
   */
  readonly today?: string;
  /** Why, in one or two sentences. */
  readonly because?: string;
  /** The one thing that would change the recommendation. */
  readonly overrule?: string;
  /** What the answer decides platform-wide, in words. */
  readonly lands?: string;
  /**
   * The decision this one waits on. This is how a big task is shaped
   * progressively: a question can unlock another once it is answered, and two
   * decisions with no `after` between them are independent components he can
   * take in any order.
   */
  readonly after?: AskAfter;
  /** Extra declared controls to show beside the evidence (its own is automatic). */
  readonly configs?: readonly Control[];
  /**
   * The canvas an option's tile draws in. "phone" when the previews ARE a 375
   * column, so the tiles are that column rather than it adrift in an empty 1440
   * room. The first exploration in this shape found it the hard way: three
   * questions about type at a phone, every tile a thumbnail.
   */
  readonly tile?: "desktop" | "phone";
};

export type ExplorationInput = {
  readonly id: string;
  readonly title: string;
  readonly round: { readonly n: number; readonly date: string; readonly changed: string };
  readonly history?: BoardSpec["history"];
  /** How the exploration got here, if it needs saying at all. */
  readonly context?: string;
  readonly asks: readonly [Decision, ...Decision[]];
  /**
   * The calls this lane's goal left open and it took on its own recommendation
   * (its manifest's Questions), drawn above the board's sections so they reach
   * him where he is reading rather than in the round's record.
   */
  readonly carried?: readonly CarriedCall[];
  /** The bible rules in play, by number. */
  readonly bible?: readonly number[];
};

/**
 * The key a preview is written under: `"<decision>.<option>"`.
 *
 * ★ TYPED, NOT TESTED (his steer, 2026-09-17: "adding more tests reduces how
 * dynamic the system can be"). Because `defineExploration` takes a `const`
 * generic, this resolves to the exact set of keys an exploration declares, so a
 * missing or orphaned preview is a TYPE error at the board rather than a blank
 * tile at the review.
 */
export type PreviewKey<E extends ExplorationInput> = {
  [A in E["asks"][number] as A["id"]]: `${A["id"]}.${A["options"][number]["id"]}`;
}[E["asks"][number]["id"]];

/**
 * An ordinary board, carrying its own preview keys in the type system.
 *
 * `__keys` is a PHANTOM: never read, never present at runtime. It exists so the
 * board file can say `PreviewsFor<typeof THE_EXPLORATION>` and have TypeScript
 * insist on exactly one node per option, without the agent repeating the ask
 * ids anywhere. Without it the const generic dies at the return and the map
 * degrades to a plain record, which is how a blank tile reaches a review.
 */
export type Exploration<E extends ExplorationInput = ExplorationInput> =
  BoardSpec<readonly Section[]> & { readonly __keys?: PreviewKey<E> };

/**
 * ONE OPTION'S PICTURE: a node, or a function of the board's state.
 *
 * ★ A FUNCTION WHEN THE PICTURE DEPENDS ON ANOTHER ANSWER (2026-09-18). A
 * decision staged behind another (`after`) is asked in a world where the first
 * one is settled, so its options have to be drawn IN that world: the gap
 * between photographs is judged at the pace he picked, not at whatever the
 * board happened to default to. The step hands `evidence` the state with every
 * decided answer of the board worn (`step.tsx`, `stateFor`), and a function
 * preview reads the ones it needs: `(s) => <Spirals pace={s.pace} gap="half" />`.
 * A plain node is still the common case and needs nothing.
 */
export type Preview = ReactNode | ((state: BoardState) => ReactNode);

/** The exhaustive preview map an exploration's board owes. */
export type PreviewsFor<S> = S extends { __keys?: infer K }
  ? Readonly<Record<K & string, Preview>>
  : never;

/**
 * Every decision's evidence lives in a section of its own, named for it, so the
 * anchor a pill links to is `<board>-<decision>` and nothing has to be invented.
 */
/** A name short enough for a title, whatever the agent wrote. */
const nameOf = (d: Decision): string => {
  if (d.label) return d.label;
  const bare = d.question.replace(/\?$/, "");
  if (bare.length <= 60) return bare;
  return `${bare.slice(0, 57).replace(/\s+\S*$/, "")}...`;
};

const sectionFor = (d: Decision): Section => ({
  id: d.id,
  title: nameOf(d),
  lede: d.context,
});

/**
 * ★ THE DERIVED CONTROL IS LOAD-BEARING. `useBoardState` filters the board's
 * state through its declared controls, and `setState` DROPS any key that is not
 * a declared control holding that exact option id. So the option-id channel the
 * step presses through only works when a control mirrors the ask exactly, which
 * `registry.test.ts` separately enforces. Deriving it is what makes that
 * impossible to get wrong.
 */
const controlFor = (d: Decision): Control => ({
  id: d.id,
  label: nameOf(d),
  options: d.options.map((o) => ({ id: o.id, label: o.label })),
  // Today where the decision names it, the recommendation where it does not
  // (see `Decision.today`): the axis being asked opens on the recommendation
  // from the step, and every other axis has to be the surface as built.
  default: d.today ?? d.recommended,
});

/**
 * ★ ONE KNOB PER ID, WHOEVER ASKED FOR IT (lab-tides, 2026-09-19). A screen
 * knob eight decisions share arrives eight times through `configs`, and the
 * dock then draws it eight times with React warning on the duplicate key.
 * Seven boards hit it and every one of them filed the same finding: the
 * constructor could dedupe by id itself. It does now, first declaration wins,
 * so a derived control is never displaced by a config of the same id, and the
 * hand-rolled filter those boards still carry stays correct (deduping twice is
 * deduping once).
 */
const byId = (controls: readonly Control[]): Control[] =>
  controls.filter((c, i, all) => all.findIndex((d) => d.id === c.id) === i);

const askFor = (d: Decision): Ask => ({
  id: d.id,
  question: d.question,
  context: d.context,
  options: d.options.map((o) => ({
    id: o.id,
    label: o.label,
    means: o.means,
    // The patch the step hands `evidence`, which is how a preview is found.
    state: { [d.id]: o.id },
  })) as unknown as Ask["options"],
  recommended: d.recommended,
  because: d.because,
  overrule: d.overrule,
  lands: d.lands,
  after: d.after,
  evidence: d.id,
  control: d.id,
  strip: d.configs?.map((c) => c.id),
  tile: d.tile,
});

/**
 * The questions in, an ordinary board out.
 *
 * An agent writes the decisions and the previews and nothing else: the
 * sections, the controls, the state patches, the verdict and the empty
 * candidate, departure and asset lists are all derived here.
 */
export function defineExploration<const E extends ExplorationInput>(
  input: E,
): Exploration<E> {
  const first = input.asks[0];
  return defineBoard({
    id: input.id,
    title: input.title,
    // The board's own headline question is the first decision's, because an
    // exploration has no thesis of its own any more: it is its decisions.
    question: first.question,
    round: input.round,
    history: input.history,
    context: input.context,
    verdict: {
      recommendation: first.options.find((o) => o.id === first.recommended)!
        .label,
      because:
        first.because ??
        "Every decision here carries its own recommendation; this is the first one's.",
    },
    asks: input.asks.map(askFor),
    candidates: [],
    departures: [],
    assets: [],
    sections: input.asks.map(sectionFor),
    carried: input.carried,
    controls: byId([
      ...input.asks.map(controlFor),
      ...input.asks.flatMap((d) => d.configs ?? []),
    ]),
    links: { bible: input.bible ?? [] },
  });
}
