import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { TRAPS } from "@/components/lab/traps";

import { DockDemo, StepDemo } from "./kit-demos";
import { KIT_PIECES } from "./notes";

/**
 * THE TOOLBOX (the Library x Lab round, 2026-09-15; an agent's toolbox at the
 * revamp, 2026-09-16; one folder and a front door at the lab revamp,
 * 2026-09-29).
 *
 * ★ IT IS WRITTEN FOR THE AGENT WHO ARRIVES WITH A BOARD TO BUILD, and it is
 * the page that agent's brief points at: what a board is (one folder, a spec
 * of decisions and a preview per option), the pieces a preview draws with and
 * when to reach for each, what the spec turns into on Will's screen, and the
 * traps the boards before it paid for. A piece is listed here because a board
 * imports it, and nothing is listed that none does.
 *
 * ★ EVERY SPECIMEN IS REAL, NEVER A PICTURE OF ONE. The front door's pieces
 * draw into a real viewport and cannot be mounted inertly, so each row says
 * where it is working; the step and the dock, which the spec turns into, are
 * mounted live at the foot.
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
        title="The toolbox"
        description="How a board is built: one folder, holding its decisions as data and a preview per option, drawn with the few pieces the kit's front door gives it. Everything else in the kit is the machinery the board rides on."
        badges={
          <>
            <Tag>{KIT_PIECES.length} pieces</Tag>
            <Tag>{TRAPS.length} traps</Tag>
          </>
        }
        meta={[
          [
            "Front door",
            <Ref
              key="src"
              to={{ kind: "source", file: "src/components/lab/index.ts" }}
              quiet
            >
              src/components/lab/index.ts
            </Ref>,
          ],
          ["On the desk", BOARDS.map((b) => b.title).join(", ") || "none"],
        ]}
      />

      <Callout kind="note" className="mt-6" title="Adding a piece">
        A piece a new board needs joins the front door (
        <code>src/components/lab/index.ts</code>) in the change whose board
        first uses it, with its row in <code>kit/notes.ts</code> and a test for
        what it does (its function, never its look). From then on{" "}
        <code>kit-discipline.test.ts</code> refuses a board that declares its
        own copy, and one that imports the kit from anywhere else.
      </Callout>

      <Section
        id="a-board-is-one-folder"
        title="A board is one folder"
        blurb="Nothing else names it: adding a board is adding the folder, and retiring one is deleting it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">sandbox/&lt;id&gt;/spec.ts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <code>defineExploration</code>, pure data: the id (the folder),
              the title, where it stands (<code>surface</code>,{" "}
              <code>desk</code> by leverage, <code>lives</code>), the round, the{" "}
              <code>opening</code> and <code>terms</code>, and the decisions,
              each with its context (<code>where</code>, <code>when</code>,{" "}
              <code>matters</code>), its options (<code>gains</code>,{" "}
              <code>costs</code>), its recommendation and <code>because</code>.
              It imports the kit from <code>@/components/lab/exploration</code>{" "}
              alone, so a server page and a node test can read it.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">sandbox/&lt;id&gt;/board.tsx</p>
            <p className="mt-1 text-sm text-muted-foreground">
              One export: <code>ExplorationBoard</code> with the spec and a
              preview per option, typed{" "}
              <code>PreviewsFor&lt;typeof SPEC&gt;</code>, so a missing preview
              is a type error rather than a blank tile. Its drawings (scenes,
              fixtures, a stylesheet) sit beside it and import the kit from{" "}
              <code>@/components/lab</code>.
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          The registry finds the folder&rsquo;s spec and the route finds its
          board, so two boards cut at once never touch one file. A retired
          board&rsquo;s ledger in <code>docs/reviews/</code> is the
          Orchestrator&rsquo;s to delete.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>
            <code>
              pnpm new-board &lt;id&gt; &quot;&lt;title&gt;&quot; --surface
              &lt;surface&gt; --desk &lt;n&gt;
            </code>{" "}
            writes the folder: one decision with two options, every line to
            write a <code>TODO</code> that <code>registry.test.ts</code> refuses
            until it is written.
          </li>
          <li>
            <code>pnpm lab:smoke --board &lt;id&gt; --base &lt;server&gt;</code>{" "}
            crawls the board, its steps and the desk;{" "}
            <code>pnpm lab:demo --board &lt;id&gt;</code> presses every option
            and refuses two options that draw the same picture.
          </li>
          <li>
            <code>registry.test.ts</code> holds the spec: pure data, one export,
            its place on the desk, and the context on every open ask.
          </li>
        </ul>
      </Section>

      <Section
        id="front-door"
        title="The front door"
        blurb="What a board's drawings import from @/components/lab, what each piece is for, and when to reach for it."
      >
        <ul className="flex flex-col gap-5">
          {KIT_PIECES.map((piece) => (
            <li
              key={piece.names.join()}
              className="rounded-xl border border-border bg-card px-4 py-4"
            >
              <p className="text-sm font-semibold tracking-tight">
                {piece.names.join(", ")}
              </p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {piece.note}
              </p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed">
                <span className="text-muted-foreground">
                  When to reach for it:{" "}
                </span>
                {piece.reach}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <Ref to={{ kind: "source", file: piece.file }} quiet /> ·
                working on {piece.seen}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="what-it-becomes"
        title="What the spec becomes"
        blurb="The machinery a board rides on and never imports, mounted live on a fixture."
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium">The step</p>
            <p className="mt-1 mb-3 max-w-3xl text-sm text-muted-foreground">
              Each decision becomes one step: its context above, the options as
              tiles drawn from their previews, the recommendation and its
              reason, Back and Next. This is where Will meets the board.
            </p>
            <StepDemo />
          </div>
          <div>
            <p className="text-sm font-medium">The dock</p>
            <p className="mt-1 mb-3 max-w-3xl text-sm text-muted-foreground">
              Each decision&rsquo;s own control and every <code>configs</code>{" "}
              knob become the dock&rsquo;s switches, mirrored to the URL, so a
              link reopens the exact state a note was written about.
            </p>
            <DockDemo />
          </div>
        </div>
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
        so: it reads the live cascade, writes into iframe documents and hands a
        frame a candidate stylesheet, so a product page importing any of it
        would ship a dev tool to a guest. The dependency runs the other way, and
        the kit imports production components freely.
      </Callout>

      <Pager />
    </div>
  );
}
