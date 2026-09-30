import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { WidePage } from "@/app/(dev)/design/(shell)/_shell/wide";
import { SURFACE_LABEL } from "@/components/lab/board-spec";

import { readTrackStates } from "@/app/(dev)/design/_data/tracks";
import { BOARDS, boardSpec } from "@/app/(dev)/design/sandbox/registry";
import { BoardFrame } from "./board-frame";
import { BOARD_COMPONENTS } from "./board-components";
import { SampleBoardPage } from "./sample-board";
import { SAMPLE_BOARD } from "../_desk/sample-spec";
import { buildStamp } from "@/app/(dev)/design/_data/build-stamp";

import {
  boardWork,
  deskBoards,
  deskRows,
  transcribedFrom,
} from "../_desk/queue";
import { toSteps } from "../_desk/session-step";

/**
 * THE BOARD PAGE (the Library x Lab round, 2026-09-15): one open question and
 * its options on the real tokens, inside the shell. The header is the record
 * card (the surface, the asks by name, the tracks); the page is wide (the
 * sidebar tucks away by preference, the TOC column yields to the dock's
 * Sections menu); the dock reads the board's neighbours from the context this
 * page provides. The board is its folder (`sandbox/<id>/`): the registry finds
 * its spec and `board-components.ts` its board, so a folder with either missing
 * is no board and answers 404. The kit's template answers in its own first
 * block, so this header says nothing the Answer is about to say.
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
  // ★ THE TEMPLATE'S OWN DRY RUN (lab-tides, 2026-09-19). `/design/lab/sample`
  // renders the fixture board through the kit's template, so a change to the
  // template is looked at on a board nobody is being asked to answer. It is
  // deliberately not in the registry: it is a tool, not a board.
  if (slug === SAMPLE_BOARD.id) {
    return (
      <BoardFrame
        id={SAMPLE_BOARD.id}
        title={SAMPLE_BOARD.title}
        sections={SAMPLE_BOARD.sections.map((s) => ({
          id: s.id,
          label: s.title,
        }))}
      >
        <WidePage>
          <SampleBoardPage />
        </WidePage>
      </BoardFrame>
    );
  }
  const session = (await searchParams).session;
  const param = typeof session === "string" ? session : null;
  const spec = boardSpec(slug);
  const Component = spec ? BOARD_COMPONENTS[spec.id] : undefined;
  if (!spec || !Component) notFound();

  // A board built by a track links its manifest; a board no manifest names
  // (its track integrated long ago) says so.
  const tracks = readTrackStates();
  const i = BOARDS.findIndex((b) => b.id === spec.id);
  const prev = BOARDS[i - 1];
  const next = BOARDS[i + 1];

  // Marketing boards render inside the production marketing skin so the
  // [data-mkt-*] grammar (marketing.css, loaded by the root layout) reaches
  // them with the real tokens.
  const skin = spec.surface === "marketing" ? { "data-mkt": "" } : {};

  // The review, when the session names an ask here. The whole queue rides
  // along (not just this board's), because "Ask 12 of 47" counts the review
  // and Next has to reach the next board's first open ask.
  const rows = param?.startsWith(`${spec.id}.`) ? deskRows(deskBoards()) : null;
  const review = rows
    ? {
        steps: toSteps(boardWork(rows), boardSpec, key),
        param,
        // What the ledger holds, so the step's "Copy so far" sends only what
        // this sitting added (the stepped review, 2026-09-16).
        transcribed: transcribedFrom(rows),
        // Which commit drew this page, so a batch composed on a stale alias can
        // be told apart from one composed on the tree (Will, 2026-09-17).
        build: buildStamp()?.sha ?? null,
      }
    : undefined;

  // ★ IN SESSION MODE THE STEP IS THE WHOLE PAGE (lab-focus, 2026-09-29): it
  // fills the window under the top bar to the pixel, so a whole stage takes
  // exactly the room above the dock. The wide page's foot padding and the
  // board's top margin would each push the dock a scroll below the stage, and
  // its max width would hold the stage to 1024 when the reader's fit is Fit.
  if (review)
    return (
      <BoardFrame
        id={spec.id}
        title={spec.title}
        sections={spec.sections.map((s) => ({ id: s.id, label: s.title }))}
        prev={prev && { href: `/design/lab/${prev.id}`, label: prev.title }}
        next={next && { href: `/design/lab/${next.id}`, label: next.title }}
        review={review}
      >
        <div data-lab-wide className="board-page w-full px-4">
          <div {...skin}>
            <Component />
          </div>
        </div>
      </BoardFrame>
    );

  return (
    <BoardFrame
      id={spec.id}
      title={spec.title}
      sections={spec.sections.map((s) => ({ id: s.id, label: s.title }))}
      prev={prev && { href: `/design/lab/${prev.id}`, label: prev.title }}
      next={next && { href: `/design/lab/${next.id}`, label: next.title }}
    >
      <WidePage>
        {/* ★ IN SESSION MODE THE STEP IS THE PAGE (the stepped review,
            2026-09-16). "One context and its questions alone on the screen"
            cannot survive a record card, a badge row and a meta table above it:
            the spine says which board this is and links the whole thing. The
            session returned above, so this is the whole board. */}
        <PageHeader
          title={spec.title}
          // The kit's Answer states the question in the board's own first
          // block, so the header does not: two statements of the same
          // question, one above the other, is the density the template ends.
          badges={
            <>
              <Tag>{SURFACE_LABEL[spec.surface]}</Tag>
              <Tag badge="exploring" />
            </>
          }
          meta={[
            ["Asks", spec.sections.map((s) => s.title).join(" · ")],
            [
              "Track",
              <span key="tracks" className="inline-flex flex-wrap gap-x-2">
                {(spec.tracks ?? [spec.id]).map((t) =>
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
        <div className="mt-4" {...skin}>
          <Component />
        </div>
      </WidePage>
    </BoardFrame>
  );
}
