import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { TRAPS } from "@/components/lab/traps";

import {
  CatalogDemo,
  CompareDemo,
  CopyDemo,
  CostDemo,
  DockDemo,
  ItemVerdictDemo,
  LoupeDemo,
  NotesDemo,
  PasteDemo,
  BeforeAfterDemo,
  StepDemo,
  SelectTableDemo,
  SpecimenDemo,
  SpotCompareDemo,
  StageDemo,
  ToggleDemo,
  WalkDemo,
} from "./kit-demos";
import { KIT_PIECES } from "./notes";

/**
 * THE TOOLBOX (the Library x Lab round, 2026-09-15; reorganised as an agent's
 * toolbox at the revamp, 2026-09-16).
 *
 * ★ IT IS WRITTEN FOR THE AGENT WHO ARRIVES WITH A BOARD TO BUILD, which is a
 * different reader from the one the first version served. A catalogue of nouns
 * tells you what exists; it does not tell you which tool your evidence wants,
 * and the alternative to answering that is the thing the kit exists to end (a
 * board building its own Part, its own Knob, its own paste, for the third
 * time). So every row says what the tool is FOR, WHEN to reach for it against
 * the tool beside it, and shows it working.
 *
 * ★ AND EVERY DEMO IS REAL, NEVER A PICTURE OF ONE. A kit page that drew a
 * screenshot of a dock would be exactly the failure the kit exists to prevent.
 * Two pieces cannot be shown inertly and say so: the Frame, which would load
 * real pages into this page, and the template, which IS the boards.
 */
const DEMOS: Record<string, React.ComponentType> = {
  catalog: CatalogDemo,
  compareTwo: SpotCompareDemo,
  compare: CompareDemo,
  itemVerdict: ItemVerdictDemo,
  stage: StageDemo,
  specimen: SpecimenDemo,
  selectTable: SelectTableDemo,
  loupe: LoupeDemo,
  dock: DockDemo,
  walk: WalkDemo,
  cost: CostDemo,
  paste: PasteDemo,
  copy: CopyDemo,
  notes: NotesDemo,
  step: StepDemo,
  beforeAfter: BeforeAfterDemo,
  toggle: ToggleDemo,
};

export default async function KitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const shown = KIT_PIECES.filter((p) => p.demo).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="The toolbox"
        description="Every tool a board is built from, what each one is for, and when to reach for it. A board is its evidence and nothing else: build the tool your evidence needs HERE, with the discipline below, and never a local copy inside a board."
        badges={
          <>
            <Tag>{KIT_PIECES.length} tools</Tag>
            <Tag>{shown} live</Tag>
            <Tag>{TRAPS.length} traps</Tag>
          </>
        }
        meta={[
          [
            "Home",
            <Ref
              key="src"
              to={{ kind: "source", file: "src/components/lab" }}
              quiet
            >
              src/components/lab
            </Ref>,
          ],
          ["On the template", BOARDS.map((b) => b.title).join(", ") || "none"],
        ]}
      />

      <Callout kind="note" className="mt-6" title="Adding a tool">
        A new piece arrives with a row in <code>kit/notes.ts</code>, a live
        demo in <code>kit/kit-demos.tsx</code>, a test for what it does (its
        function, never its look), and its name on{" "}
        <code>kit-discipline.test.ts</code>&rsquo;s owned list, which is what
        stops a board re-declaring it.
      </Callout>

      <Section
        id="a-board-is-two-files"
        title="A board is two files"
        blurb="Everything else is the kit's."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">sandbox/&lt;id&gt;/spec.ts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pure data: the question, the round, the verdict, the asks, the
              candidates (written out, never mapped), the catalog, the
              departures, the assets, the sections, the controls, the walk and
              the notes. No React, no CSS, no import of its own board, so a
              server page and a node test can both read it.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">sandbox/&lt;id&gt;/board.tsx</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The evidence for each declared section, as a function of the
              declared state. It renders <code>BoardPage</code>, which puts the
              answer first and the argument under it, in one order for every
              board.
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>
            <code>
              node scripts/new-board.mjs &lt;id&gt; &quot;&lt;title&gt;&quot;
            </code>{" "}
            scaffolds a CATALOG: cards ruled keep, refine or kill, a Pick that
            drives the page, and A and B for any two.
          </li>
          <li>
            <code>--spots</code> scaffolds the other shape, where one idea is
            applied in many real places and the evidence is those places under
            two cards.
          </li>
          <li>
            <code>--plain</code> keeps asks and sections only, for a board with
            genuinely nothing to choose between.
          </li>
          <li>
            <code>pnpm lab:smoke</code> weighs every board page: the words
            outside every closed fold, against the reading budget. A specimen
            does not count, because a specimen is looked at rather than read.
          </li>
        </ul>
      </Section>

      <Section
        id="tools"
        title="The tools"
        blurb="What each one is for, when to reach for it, and it working. Nothing here is a screenshot."
      >
        <ul className="flex flex-col gap-5">
          {KIT_PIECES.map((piece) => {
            const Demo = piece.demo ? DEMOS[piece.demo] : undefined;
            return (
              <li
                key={piece.name}
                className="rounded-xl border border-border bg-card px-4 py-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold tracking-tight">
                    {piece.name}
                  </p>
                  {!Demo && <Tag tone="outline">no specimen</Tag>}
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {piece.note}
                </p>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed">
                  <span className="text-muted-foreground">
                    When to reach for it:{" "}
                  </span>
                  {piece.reach}
                </p>
                <p className="mt-1 text-[11px]">
                  <Ref to={{ kind: "source", file: piece.file }} quiet />
                </p>
                {Demo ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <Demo />
                  </div>
                ) : (
                  piece.inert && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Not mounted here: {piece.inert}.
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        id="traps"
        title="The traps"
        blurb="Every one of these cost a round. They were found on one board, commented in that board's file, and rediscovered on the next, which is the whole reason the kit exists."
        aside={<Tag>{TRAPS.length}</Tag>}
      >
        <ul className="flex flex-col gap-3">
          {TRAPS.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <p className="text-sm font-medium">{t.tried}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="text-foreground">What happens: </span>
                {t.breaks}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="text-foreground">The kit does: </span>
                {t.instead}
              </p>
              <p className="mt-1 text-[11px]">
                <Ref to={{ kind: "source", file: t.file }} quiet />
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Callout kind="note" className="mt-8">
        Nothing outside <code>/design</code> may import the kit, and a test says
        so: it reads the live cascade, writes into iframe documents and hands
        the whole site a candidate stylesheet, so a product page importing any
        of it would ship a dev tool to a guest. The dependency runs the other
        way, and the kit imports production components freely.
      </Callout>

      <Pager />
    </div>
  );
}
