import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import {
  type BoardSpec,
  optionId,
  optionLabel,
} from "@/components/lab/board-spec";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { listSpecs } from "@/app/(dev)/design/_data/docs";
import { readTrackStates, trackAlias } from "@/app/(dev)/design/_data/tracks";
import {
  libraryRulings,
  windowNotesFor,
} from "@/app/(dev)/design/review/ledger";
import { itemById } from "@/app/(dev)/design/gallery/registry";
import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { SANDBOX, SURFACE_LABEL } from "@/app/(dev)/design/touchpoints";

import {
  type BoardRow,
  boardWork,
  deskRows,
  transcribedFrom,
} from "./_desk/queue";
import { HeldBadge } from "./_desk/held-badge";
import { buildStamp } from "@/app/(dev)/design/_data/build-stamp";

import { ReviewSession } from "./_desk/review-session";
import { SAMPLE_BOARD } from "./_desk/sample-spec";
import { type SessionStep, stepParam, toSteps } from "./_desk/session-step";
import { CopySoFar } from "./_desk/copy-so-far";
import { StartReview } from "./_desk/start-review";
import { stepId } from "./_desk/step-id";

/**
 * THE DESK (the review wave, 2026-09-14; Will's queue since the Library x Lab
 * round). One page that answers three questions in this order: what waits on
 * you, what is every board asking, and where is the work. Everything on it is
 * read from the repo at request time (the specs in sandbox/registry.ts, the
 * manifests in docs/tracks/, the answers in docs/reviews/); the desk never
 * writes, and neither does the review session it opens.
 *
 * THE ANSWERING MOVED ONTO THE BOARDS (the clarity round, 2026-09-15). Every
 * way into an ask from here now opens it ON ITS BOARD, where the review card
 * pins the question over the evidence that argues it: the desk keeps the queue,
 * the progress and the summary, and the board keeps the answering. The step
 * view below is still here for the dry run (`?session=sample`, a fixture board
 * with no page of its own) and as the fallback for a board that has no page;
 * `?session=end` is the summary that composes the message.
 */

const DESK_HREF = "/design/lab";

/** Where an ask is answered: on its board, with the card open on it. */
const askHref = (board: string, ask: string) =>
  `/design/lab/${board}?session=${stepId(board, ask)}`;

/** Where any step is answered, whichever kind it is. */
const stepHref = (s: SessionStep) =>
  `/design/lab/${s.board}?session=${stepParam(s)}`;

/** What a staged row is waiting for, in the words of the question it waits on. */
function afterLabel(
  step: SessionStep,
  specOf: (board: string) => BoardSpec | undefined,
): string {
  const after = step.after;
  if (!after) return "";
  const spec = specOf(step.board);
  if ("ask" in after) {
    const q = spec?.asks.find((a) => a.id === after.ask)?.question;
    return q ? `after "${q}"` : `after ${after.ask}`;
  }
  const name = spec?.candidates.find((c) => c.id === after.item)?.name;
  return `after ${name ?? after.item}`;
}

type Params = Promise<Record<string, string | string[] | undefined>>;

/**
 * One line of "Waiting on you": an unanswered ask, or a board's catalog as a
 * single row. The catalog comes FIRST for its board, the order the session
 * walks it in, because a board's asks are what is left open once its cards have
 * been ruled on.
 */
/**
 * ★ A QUEUE ROW STACKS ON A PHONE (the sweep's finding, 2026-09-16). The board
 * name, the question and the answer pill are three things, and `flex-wrap` on
 * one baseline put all three on one 375 line where they collided. Below the
 * `sm` breakpoint the row is a column and each part gets its own line; from
 * there up it is the one baseline it was.
 */
const ROW =
  "flex flex-col gap-1 px-4 py-3 transition-colors duration-150 hover:bg-muted/40 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1";

/**
 * ★ THE DESK'S ROWS ARE THE WALK'S STEPS (the stepped review, 2026-09-16). The
 * queue used to be built here from the rows and the steps built again in
 * `toSteps`, and the two disagreed the day a catalog stopped queueing its
 * cards. One derivation now: every row IS a step, so "waiting on you" and
 * "step 7 of 23" count the same list.
 */
export default async function DeskPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const key = await requireDesignKey(searchParams);
  const session = (await searchParams).session;
  const param = typeof session === "string" ? session : null;

  const tracks = readTrackStates();
  const proposals = new Set(listSpecs().map((s) => s.slug));
  // The notes that bind every board this round, as opposed to a board's own,
  // which ride its row.
  const windowNotes = windowNotesFor(null);

  const rows = deskRows(
    SANDBOX.map((r) => ({
      id: r.id,
      title: r.title,
      surfaceLabel: SURFACE_LABEL[r.surface],
      note: r.board?.note ?? r.why,
      tracks: r.board?.tracks ?? [r.id],
    })),
  );

  const specOf = (board: string) => BOARDS.find((b) => b.id === board);
  const steps = toSteps(boardWork(rows), specOf, key);
  const transcribed = transcribedFrom(rows);
  // Which commit drew this page. A build cannot know a newer one exists, so
  // this rides the paste and `lab:review` compares it with the tree it writes.
  const build = buildStamp()?.sha ?? null;
  // A staged step is listed (dim) but not counted: it is not a question yet.
  const waiting = steps.filter((s) => !s.after || s.afterRuled).length;

  // The dry run: one fixture board, walked the same way, so the session can be
  // judged before a standing board carries a spec. It carries a catalog too,
  // so the items step is walkable without a standing board declaring one.
  const sample = param?.startsWith(SAMPLE_BOARD.id) === true;
  if (param) {
    const walk = sample
      ? toSteps(
          [
            {
              items: SAMPLE_BOARD.candidates.map((item) => ({
                board: SAMPLE_BOARD.id,
                boardTitle: SAMPLE_BOARD.title,
                round: SAMPLE_BOARD.round.n,
                item,
                ruling: null,
              })),
              asks: SAMPLE_BOARD.asks.map((ask) => ({
                board: SAMPLE_BOARD.id,
                boardTitle: SAMPLE_BOARD.title,
                round: SAMPLE_BOARD.round.n,
                ask,
                answer: null,
                // Nothing is ruled on a dry run, so a staged ask is staged
                // until the walk itself answers what it waits on.
                staged: Boolean(ask.after),
                moot: false,
              })),
            },
          ],
          (id) => (id === SAMPLE_BOARD.id ? SAMPLE_BOARD : undefined),
          key,
        )
      : steps;
    if (walk.length > 0) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
          <ReviewSession
            steps={walk}
            // A bare `?session=sample` always opens at the first ask: a dry
            // run is walked, not resumed.
            param={param === SAMPLE_BOARD.id ? stepParam(walk[0]) : param}
            sample={sample}
            build={build}
            transcribed={transcribed}
            title="The message"
            blurb="One line per board, in the ledger grammar. Paste it into chat and the answers land in docs/reviews."
          />
        </div>
      );
    }
  }

  const live = [...tracks.values()].filter((t) => t.status !== "integrated");
  const withSpec = rows.filter((r) => r.spec);
  const answeredNow = rows.reduce(
    (n, r) => n + r.asks.filter((a) => a.answer?.choice).length,
    0,
  );
  // The catalogs: every card on every board that declares one, and the ones
  // with no verdict yet. A board with no catalog contributes nothing.
  const itemsNow = rows.reduce((n, r) => n + r.items.length, 0);
  const openItemsNow = rows.reduce((n, r) => n + r.openItems.length, 0);
  const redesigns = libraryRulings().filter((r) => r.verdict !== "keep");
  // Asks Will marked "not clear to me": still waiting, and the board owes a
  // clearer question before he is asked again.
  const unclearNow = rows.reduce(
    (n, r) =>
      n + r.asks.filter((a) => a.answer && a.answer.choice === null).length,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="The desk"
        description="What waits on you, what every board is asking, and where the work is. Everything here is read from the repo: the boards' own specs, the manifests, and your answers so far. Nothing on this page writes anything."
      />
      {/* ★ WHICH BUILD THIS IS. A page cannot know a newer one exists, and on a
          stale deployment the round, the ledger and the spec all agree because
          they came from one build, which is how a batch once arrived a round
          behind with nothing on screen to say so (Will, 2026-09-17). The paste
          carries this line and `pnpm lab:review` compares it with the tree. */}
      {build && (
        <p
          className="mt-3 text-[11px] text-faint"
          title="A page cannot know that a newer build exists. Your paste carries this line, and pnpm lab:review compares it with the tree it writes into."
        >
          Serving build <span className="tabular-nums">{build}</span>, and your
          paste says so.
        </p>
      )}
      <StatRow
        stats={[
          ["waiting on you", waiting],
          ["items to rule", `${openItemsNow} of ${itemsNow}`],
          ["answered this round", answeredNow],
          ["asked for a clearer question", unclearNow],
          ["standing boards", rows.length],
          ["tracks in flight", live.length],
        ]}
      />

      <Section
        id="waiting"
        title="Waiting on you"
        blurb="Every catalog with a card still unruled and every question with no answer, in board order. The review walks them one at a time and ends in one message to paste."
        aside={
          steps.length > 0 ? (
            <span className="flex flex-wrap items-center gap-2">
              <CopySoFar transcribed={transcribed} build={build} />
              <StartReview
                steps={steps.map((step) => ({ step, href: stepHref(step) }))}
              />
            </span>
          ) : undefined
        }
      >
        {steps.length > 0 ? (
          <ol
            data-dir-stagger
            className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
          >
            {steps.map((step, i) => {
              // A staged step is dim and says what it waits on: it is on the
              // list so the reviewer can see the round has more in it, and out
              // of the way so it is not a question he thinks he owes an answer.
              const staged = Boolean(step.after) && !step.afterRuled;
              return (
                <li
                  key={stepParam(step)}
                  style={{ "--i": i } as React.CSSProperties}
                  className={staged ? "opacity-55" : undefined}
                >
                  <LabLink href={stepHref(step)} className={ROW}>
                    <span className="text-xs text-muted-foreground">
                      {step.boardTitle}
                    </span>
                    <span className="min-w-0 text-sm font-medium sm:flex-1">
                      {step.kind === "items"
                        ? `The ${step.items.length} in the catalog: keep, refine or kill each one`
                        : step.question}
                    </span>
                    <HeldBadge step={step} />
                    {staged ? (
                      <Tag>{afterLabel(step, specOf)}</Tag>
                    ) : step.kind === "items" ? (
                      <Tag>{`${step.items.length} cards`}</Tag>
                    ) : (
                      <Tag>
                        {step.options.find((o) => o.id === step.recommended)
                          ?.label ?? step.recommended}
                      </Tag>
                    )}
                  </LabLink>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-sm">
              {withSpec.length === 0
                ? "No board carries a spec yet, so nothing is queued here."
                : "Every question is answered and every catalog is ruled on this round."}
            </p>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {withSpec.length === 0
                ? "The boards move onto the kit's template in the wave after this round; each one declares its questions then, and they queue here. Until then a board argues on its own page."
                : "A new round opens the questions again. The answers so far are on each board below."}
            </p>
            <p className="mt-3">
              <LabLink
                href={`${DESK_HREF}?session=${SAMPLE_BOARD.id}`}
                data-dir-press
                className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-muted/40"
              >
                Dry run the review
              </LabLink>
            </p>
          </div>
        )}
      </Section>

      {/* The redesign queue. A catalog entry marked `redesign` or `retire` is
          a track waiting to be cut, and it is the only thing on this page that
          comes from outside a board. `keep` is not listed: a kept entry needs
          nobody's attention, and printing ninety of them would bury the three
          that do. */}
      {redesigns.length > 0 && (
        <Section
          id="redesigns"
          title="Redesigns you asked for"
          blurb="From docs/reviews/_library.json: the catalog entries you marked redesign or retire while scrolling the components. This is the queue the Orchestrator cuts tracks from."
          aside={<Tag>{redesigns.length}</Tag>}
        >
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {redesigns.map((r) => {
              const entry = itemById(r.entry);
              return (
                <li
                  key={r.entry}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
                >
                  {entry ? (
                    <LabLink
                      href={`/design/library/${r.entry}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {entry.title}
                    </LabLink>
                  ) : (
                    <span className="text-sm font-medium">{r.entry}</span>
                  )}
                  <Tag tone={r.verdict === "retire" ? "quiet" : "strong"}>
                    {r.verdict}
                  </Tag>
                  {r.note && (
                    <span className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {r.note}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section
        id="boards"
        title="Every standing board"
        blurb="In registry order, the same order the board pages page through. A board with a spec shows its verdict and its questions; one without shows what it is exploring."
      >
        <ol className="space-y-2">
          {rows.map((row) => (
            <BoardCard
              key={row.id}
              row={row}
              designKey={key}
              tracks={tracks}
              hasProposal={proposals.has(row.id)}
            />
          ))}
        </ol>
      </Section>

      <Section
        id="tracks"
        title="Tracks in flight"
        blurb="Every branch with an open manifest: what it is for, and the line its handoff says to look at first."
        aside={
          <LabLink
            href="/design/lab/tracks"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            All tracks
          </LabLink>
        }
      >
        {live.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {live.map((t) => (
              <li key={t.track} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <LabLink
                    href={`/design/lab/tracks/${t.track}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {t.track}
                  </LabLink>
                  <Tag>{t.status}</Tag>
                  {t.rounds > 0 && <Tag>{`round ${t.rounds}`}</Tag>}
                  {/* Built at handed-off, or on a [preview] commit while the
                      manifest says it intends one. */}
                  {(t.status === "handed-off" || t.preview) && (
                    <a
                      href={withDesignKey(
                        `${trackAlias(t.track)}/design/lab`,
                        key,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-muted-foreground underline underline-offset-2"
                    >
                      its preview
                    </a>
                  )}
                </div>
                {t.goal && (
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                    {t.goal}
                  </p>
                )}
                {t.lookAtFirst && (
                  <p className="mt-1 max-w-3xl text-xs leading-relaxed">
                    <span className="text-muted-foreground">
                      Look at first:{" "}
                    </span>
                    {t.lookAtFirst}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            No track is open. Every manifest in docs/tracks is integrated.
          </p>
        )}
      </Section>

      {windowNotes.length > 0 && (
        <Section
          id="notes"
          title="Your notes this window"
          blurb="From docs/reviews/_window.json: what you said this round that binds every board, not one of them."
        >
          <ul className="space-y-2">
            {windowNotes.map((n, i) => (
              <li key={`${n.on ?? "all"}-${i}`}>
                <Callout
                  kind={n.by === "Will" ? "will" : "note"}
                  title={n.on ? `On ${n.on}` : "Every board"}
                >
                  {n.text}
                </Callout>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** One board: its verdict or its exploration, its asks, and every way in. */
function BoardCard({
  row,
  designKey,
  tracks,
  hasProposal,
}: {
  row: BoardRow;
  designKey: string | null;
  tracks: Map<string, { status: string }>;
  hasProposal: boolean;
}) {
  const built = row.tracks.map((name) => ({
    name,
    status: tracks.get(name)?.status ?? null,
  }));
  const live = built.filter((b) => b.status && b.status !== "integrated");
  const answered = row.asks.filter((a) => a.answer?.choice).length;

  return (
    <li className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <LabLink
          href={`/design/lab/${row.id}`}
          className="text-sm font-medium hover:underline"
        >
          {row.title}
        </LabLink>
        <Tag>{row.surfaceLabel}</Tag>
        {row.legacy && <Tag badge="legacy" />}
        {row.spec && <Tag>{`round ${row.spec.round.n}`}</Tag>}
        {built.map((b) => (
          <Tag key={b.name}>
            {b.status ? `${b.name} · ${b.status}` : b.name}
          </Tag>
        ))}
      </div>

      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        {row.spec ? row.spec.verdict.recommendation : row.note}
      </p>

      {/* What you already said about THIS board, which is what the round it is
          in is answering. The notes that bind every board are printed once, at
          the foot of the page, rather than on all fourteen rows. */}
      {row.notes.length > 0 && (
        <ul className="mt-2 space-y-1 border-l border-border pl-3">
          {row.notes.map((n, i) => (
            <li
              key={`${n.at}-${i}`}
              className="max-w-3xl text-xs leading-relaxed"
            >
              <span className="text-muted-foreground">{n.by}: </span>
              {n.text}
            </li>
          ))}
        </ul>
      )}

      {row.spec && row.asks.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {row.asks
            .filter((a) => !a.moot)
            .map((a) => (
            <li key={a.ask.id}>
              <LabLink
                // An answered ask, or one marked unclear, is not in the walk:
                // it opens the board rather than a step that is not there.
                href={
                  a.answer
                    ? `/design/lab/${row.id}`
                    : askHref(row.id, a.ask.id)
                }
                title={
                  a.answer && a.answer.choice === null
                    ? `Not clear to you: ${a.answer.note ?? ""}`
                    : undefined
                }
                className={
                  a.answer?.choice
                    ? "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                    : "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[11px] transition-colors duration-150 hover:bg-muted/60"
                }
              >
                {a.ask.question}
                {a.answer?.choice && (
                  <span className="font-medium text-foreground">
                    {optionLabel(
                      a.ask.options.find(
                        (o) => optionId(o) === a.answer?.choice,
                      ) ?? a.answer.choice,
                    )}
                  </span>
                )}
                {a.answer && a.answer.choice === null && (
                  <span className="font-medium text-foreground">
                    not clear, waiting on a clearer question
                  </span>
                )}
              </LabLink>
              </li>
            ))}
        </ul>
      )}

      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        <LabLink
          href={`/design/lab/${row.id}`}
          className="underline underline-offset-2"
        >
          {live.length > 0 ? "the board here" : "open the board"}
        </LabLink>
        {live.map((b) => (
          <a
            key={b.name}
            href={withDesignKey(
              `${trackAlias(b.name)}/design/lab/${row.id}`,
              designKey,
            )}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline underline-offset-2"
          >
            {live.length > 1 ? `${b.name} on its preview` : "on its preview"}
          </a>
        ))}
        {hasProposal && (
          <Ref to={{ kind: "proposal", slug: row.id }} quiet>
            the proposal
          </Ref>
        )}
        {built
          .filter((b) => b.status)
          .map((b) => (
            <Ref key={b.name} to={{ kind: "track", name: b.name }} quiet>
              {built.length > 1 ? `manifest: ${b.name}` : "the manifest"}
            </Ref>
          ))}
        {row.spec && (
          <span className="text-muted-foreground">
            {answered} of {row.asks.length} answered
            {row.items.length > 0
              ? `, ${row.items.length - row.openItems.length} of ${row.items.length} ruled`
              : ""}
          </span>
        )}
      </p>
    </li>
  );
}
