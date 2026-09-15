import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section, Sub } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { TRAPS } from "@/components/lab/traps";

import {
  CompareDemo,
  CopyDemo,
  LoupeDemo,
  PasteDemo,
  SelectTableDemo,
  SpecimenDemo,
  StageDemo,
  ToggleDemo,
} from "./kit-demos";
import { KIT_PIECES } from "./notes";

/**
 * THE KIT (the Library x Lab round, 2026-09-15): the pieces every board
 * composes, the traps each of them exists to prevent, and the two files a board
 * actually is.
 *
 * The page is deliberately shaped like a library component's page rather than
 * like a board: a header, a list with a line each, live specimens, and the
 * contracts. The kit IS a component family; it just happens to be one no
 * product page may import (boundary.test.ts).
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
        description="The pieces every board composes: the template, the dock, the true-viewport frame, the compare, the specimen, the measurements and the review panel. A board is its evidence and nothing else; everything it would otherwise rebuild lives here once."
        badges={
          <>
            <Tag badge="new">the kit round</Tag>
            <Tag>{KIT_PIECES.length} pieces</Tag>
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
          [
            "On the template",
            BOARDS.map((b) => b.title).join(", ") || "none yet",
          ],
        ]}
      />

      <Callout kind="note" className="mt-6">
        Nothing outside <code>/design</code> may import the kit, and a test says
        so: it reads the live cascade, writes into iframe documents and hands
        the whole site a candidate stylesheet, so a product page importing any
        of it would ship a dev tool to a guest. The dependency runs the other
        way, and the kit imports production components freely.
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
              candidates, the departures, the assets, the sections, the
              controls, the walk and the notes. No React, no CSS, no import of
              its own board, so a server page and a node test can both read it.
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
        <p className="mt-3 text-sm text-muted-foreground">
          <code>
            node scripts/new-board.mjs &lt;id&gt; &quot;&lt;title&gt;&quot;
          </code>{" "}
          scaffolds both and prints the two registrations the tests demand.
        </p>
      </Section>

      <Section
        id="pieces"
        title="The pieces"
        blurb="One line each: what it is for in this lab, not what category it belongs to."
      >
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {KIT_PIECES.map((p) => (
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

      <Section
        id="specimens"
        title="The specimens"
        blurb="Real, never a picture of one. The Frame and the template are the two that cannot be shown inertly: the frame would load real pages into this page, and the template IS the boards."
      >
        <Sub id="s-toggle" title="Toggle and Knob">
          <ToggleDemo />
        </Sub>
        <Sub id="s-stage" title="Stage">
          <StageDemo />
        </Sub>
        <Sub id="s-specimen" title="Specimen, Cell and the label rule">
          <SpecimenDemo />
        </Sub>
        <Sub
          id="s-compare"
          title="Compare"
          blurb="The wipe, for a difference at the edge of perception."
        >
          <CompareDemo />
        </Sub>
        <Sub id="s-loupe" title="Loupe" blurb="Hover it.">
          <LoupeDemo />
        </Sub>
        <Sub id="s-table" title="SelectTable">
          <SelectTableDemo />
        </Sub>
        <Sub id="s-paste" title="Paste">
          <PasteDemo />
        </Sub>
        <Sub id="s-copy" title="CopyButton">
          <CopyDemo />
        </Sub>
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

      <Pager />
    </div>
  );
}
