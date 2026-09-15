import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";

const PIECES: { name: string; file: string; note: string }[] = [
  {
    name: "BoardDock",
    file: "src/components/dev/board/dock.tsx",
    note: "A board's page-wide controls, always on screen; the shell's reading controls at its right end.",
  },
  {
    name: "Stage",
    file: "src/components/dev/board/stage.tsx",
    note: "A real viewport's pixels on a real ground, 1:1 by default.",
  },
  {
    name: "Toggle",
    file: "src/components/dev/board/toggle.tsx",
    note: "The segmented control every board's switches use.",
  },
  {
    name: "BoardMeta",
    file: "src/components/dev/board/board-meta.tsx",
    note: "The question, the candidates, the asks Will rules on.",
  },
  {
    name: "Lab preferences",
    file: "src/components/dev/board/lab-prefs.ts",
    note: "fit (1:1 or Fit), sidebar (open or collapsed on a wide page), the editor root.",
  },
  {
    name: "BoardPageContext",
    file: "src/components/dev/board/board-page-context.tsx",
    note: "What a board page tells its dock: id, title, sections, prev and next.",
  },
];

/**
 * THE KIT (the Library x Lab round, 2026-09-15): the pieces every board
 * composes. Phase 0 lists what exists under src/components/dev/board; the
 * lab-kit track moves the kit to src/components/lab, indexes it like any
 * component (a for-line, a specimen, contracts) and renders each piece here.
 */
export default async function KitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="The lab kit"
        description="The pieces every board composes: the dock, the stage, the frame, the compare, the specimen. A board is its candidates and nothing else; everything a board would otherwise rebuild lives here once."
      />
      <Callout kind="note" className="mt-6">
        The kit is being lifted from the boards that got each piece right (the
        lab-kit track). This page lists the pieces that exist today.
      </Callout>
      <Section id="pieces" title="Pieces">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {PIECES.map((p) => (
            <li key={p.name} className="px-4 py-3">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.note}</p>
              <p className="mt-1 text-[11px]">
                <Ref to={{ kind: "source", file: p.file }} quiet />
              </p>
            </li>
          ))}
        </ul>
      </Section>
      <Pager />
    </div>
  );
}
