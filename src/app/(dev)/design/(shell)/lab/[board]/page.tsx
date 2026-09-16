import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { WidePage } from "@/app/(dev)/design/(shell)/_shell/wide";
import { readTrackStates } from "@/app/(dev)/design/_data/tracks";
import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import {
  getRuling,
  SANDBOX,
  type SandboxId,
  SURFACE_LABEL,
} from "@/app/(dev)/design/touchpoints";
import { BoardFrame } from "./board-frame";
import { BOARD_COMPONENTS } from "../boards";
import { deskRows } from "../_desk/queue";
import { toSteps } from "../_desk/session-step";

/**
 * THE BOARD PAGE (the Library x Lab round, 2026-09-15): one open question and
 * its candidates on the real tokens, inside the shell. The header is the
 * catalog record (the ruling so far in one line, the pointers); the page is
 * wide (the sidebar tucks away by preference, the TOC column yields to the
 * dock's Sections menu); the dock reads the board's neighbours from the
 * context this page provides. A board with a spec (sandbox/registry.ts) renders
 * through the kit's template and answers in its own first block, so this header
 * stays a record card and says nothing the Answer is about to say; a board
 * without one is `legacy` and draws its own body under its note.
 *
 * `?session=<this board>.<ask>` turns it into the ANSWERING surface too (the
 * clarity round, 2026-09-15): the route builds the same open queue the desk
 * builds and hands it to the frame, and the kit's template pins the review card
 * under the dock. The queue is only built when the session names an ask on THIS
 * board, so an ordinary visit reads no ledger at all.
 */
export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { board: slug } = await params;
  const session = (await searchParams).session;
  const param = typeof session === "string" ? session : null;
  const ruling = getRuling(slug);
  const board = ruling?.board;
  const entry =
    ruling && board ? BOARD_COMPONENTS[ruling.id as SandboxId] : undefined;
  if (!ruling || !board || !entry) notFound();

  const spec = boardSpec(ruling.id);
  // A board built by a track links its manifest; a board that predates the
  // manifests (the two legacy marketing boards, the glow pair) has none.
  const tracks = readTrackStates();
  const i = SANDBOX.findIndex((r) => r.id === ruling.id);
  const prev = SANDBOX[i - 1];
  const next = SANDBOX[i + 1];
  const { Component } = entry;

  // Marketing boards render inside the production marketing skin so the
  // [data-mkt-*] grammar (marketing.css, loaded by the root layout) reaches
  // them with the real tokens.
  const skin = ruling.surface === "marketing" ? { "data-mkt": "" } : {};

  // The review, when the session names an ask here. The whole queue rides
  // along (not just this board's), because "Ask 12 of 47" counts the review
  // and Next has to reach the next board's first open ask.
  const review = param?.startsWith(`${ruling.id}.`)
    ? {
        steps: toSteps(
          deskRows(
            SANDBOX.map((r) => ({
              id: r.id,
              title: r.title,
              surfaceLabel: SURFACE_LABEL[r.surface],
              note: r.board?.note ?? r.why,
              tracks: r.board?.tracks ?? [r.id],
            })),
          ).flatMap((r) => r.open),
          boardSpec,
          key,
        ),
        param,
      }
    : undefined;

  return (
    <BoardFrame
      id={ruling.id}
      title={ruling.title}
      sections={spec?.sections.map((s) => ({ id: s.id, label: s.title })) ?? []}
      prev={prev && { href: `/design/lab/${prev.id}`, label: prev.title }}
      next={next && { href: `/design/lab/${next.id}`, label: next.title }}
      review={review}
    >
      <WidePage>
        <PageHeader
          title={ruling.title}
          // A board on the template answers in its own first block (the kit's
          // Answer: the question, the verdict, the asks as pills), so the
          // header must not say it first: two statements of the same question,
          // one above the other, is the density the template exists to end.
          description={spec ? undefined : `${board.note}.`}
          badges={
            <>
              <Tag>{SURFACE_LABEL[ruling.surface]}</Tag>
              {ruling.shipped ? (
                <Tag badge="shipped">Shipped: {ruling.shipped}</Tag>
              ) : (
                <Tag badge="exploring" />
              )}
              {entry.legacy && <Tag badge="legacy">legacy layout</Tag>}
            </>
          }
          meta={[
            ["Ruled", ruling.ruled],
            [
              "Record",
              <Ref key="record" to={{ kind: "record", id: ruling.id }} quiet>
                design-record.md#{ruling.id}
              </Ref>,
            ],
            [
              "Track",
              <span key="tracks" className="inline-flex flex-wrap gap-x-2">
                {(board.tracks ?? [ruling.id]).map((t) =>
                  tracks.has(t) ? (
                    <Ref key={t} to={{ kind: "track", name: t }} quiet>
                      {t}
                    </Ref>
                  ) : (
                    <span key={t}>no manifest (a standing board)</span>
                  ),
                )}
              </span>,
            ],
          ]}
        />
        {!spec && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ruling.why}
          </p>
        )}
        <div className="mt-4" {...skin}>
          <Component />
        </div>
      </WidePage>
    </BoardFrame>
  );
}
