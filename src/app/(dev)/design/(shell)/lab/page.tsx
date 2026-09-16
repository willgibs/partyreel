import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

import {
  anchorFor,
  type BoardSpec,
  optionId,
  optionLabel,
  optionMeans,
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
import { windowNotesFor } from "@/app/(dev)/design/review/ledger";
import { BOARDS } from "@/app/(dev)/design/sandbox/registry";
import { SANDBOX, SURFACE_LABEL } from "@/app/(dev)/design/touchpoints";

import { type AskState, type BoardRow, deskRows } from "./_desk/queue";
import { ReviewSession, type SessionStep } from "./_desk/review-session";
import { SAMPLE_BOARD } from "./_desk/sample-spec";
import { StartReview } from "./_desk/start-review";
import { holdId, stepId } from "./_desk/step-id";

/**
 * THE DESK (the review wave, 2026-09-14; Will's queue since the Library x Lab
 * round). One page that answers three questions in this order: what waits on
 * you, what is every board asking, and where is the work. Everything on it is
 * read from the repo at request time (the specs in sandbox/registry.ts, the
 * manifests in docs/tracks/, the answers in docs/reviews/); the desk never
 * writes, and neither does the review session it opens.
 *
 * `?session=<board>.<ask>` turns the page into that session (review-session.tsx),
 * so an interrupted review resumes from its own URL; `?session=sample` is the
 * dry run on the fixture board, which is the only way to see the session until
 * the standing boards carry specs.
 */

const DESK_HREF = "/design/lab";

type Params = Promise<Record<string, string | string[] | undefined>>;

/** The steps a session walks, built from the asks with their evidence resolved. */
function toSteps(
  asks: AskState[],
  specOf: (board: string) => BoardSpec | undefined,
  key: string | null,
): SessionStep[] {
  return asks.map((a) => {
    const spec = specOf(a.board);
    const section = spec?.sections.find((s) => s.id === a.ask.evidence);
    const board = `/design/lab/${a.board}`;
    return {
      board: a.board,
      boardTitle: a.boardTitle,
      round: a.round,
      askId: a.ask.id,
      question: a.ask.question,
      context: a.ask.context,
      look: a.ask.look,
      options: a.ask.options.map((o) => ({
        id: optionId(o),
        label: optionLabel(o),
        means: optionMeans(o),
      })),
      recommended: a.ask.recommended,
      because: a.ask.because,
      overrule: a.ask.overrule,
      // A dry run has no board page, so it has no evidence to open.
      evidence:
        spec && section && a.board !== SAMPLE_BOARD.id
          ? {
              title: section.title,
              href: withDesignKey(
                `${board}#${anchorFor(a.board, section.id)}`,
                key,
              ),
            }
          : null,
      boardHref: a.board === SAMPLE_BOARD.id ? DESK_HREF : board,
    };
  });
}

const holdKey = (s: SessionStep) => holdId(s.board, s.round, s.askId);

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

  const queue = rows.flatMap((r) => r.open);
  const specOf = (board: string) => BOARDS.find((b) => b.id === board);
  const steps = toSteps(queue, specOf, key);

  // The dry run: one fixture board, walked the same way, so the session can be
  // judged before a standing board carries a spec.
  const sample = param?.startsWith(SAMPLE_BOARD.id) === true;
  if (param) {
    const walk = sample
      ? toSteps(
          SAMPLE_BOARD.asks.map((ask) => ({
            board: SAMPLE_BOARD.id,
            boardTitle: SAMPLE_BOARD.title,
            round: SAMPLE_BOARD.round.n,
            ask,
            answer: null,
          })),
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
            param={
              param === SAMPLE_BOARD.id
                ? `${SAMPLE_BOARD.id}.${SAMPLE_BOARD.asks[0].id}`
                : param
            }
            sample={sample}
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
      <StatRow
        stats={[
          ["waiting on you", queue.length],
          ["answered this round", answeredNow],
          ["asked for a clearer question", unclearNow],
          ["standing boards", rows.length],
          ["tracks in flight", live.length],
        ]}
      />

      <Section
        id="waiting"
        title="Waiting on you"
        blurb="Every ask with no answer in its board's current round, in board order. The review walks them one at a time and ends in one message to paste."
        aside={
          queue.length > 0 ? (
            <StartReview total={steps.length} stepKeys={steps.map(holdKey)} />
          ) : undefined
        }
      >
        {queue.length > 0 ? (
          <ol
            data-dir-stagger
            className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
          >
            {queue.map((a, i) => (
              <li
                key={`${a.board}.${a.ask.id}`}
                style={{ "--i": i } as React.CSSProperties}
              >
                <LabLink
                  href={`${DESK_HREF}?session=${stepId(a.board, a.ask.id)}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 transition-colors duration-150 hover:bg-muted/40"
                >
                  <span className="text-xs text-muted-foreground">
                    {a.boardTitle}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {a.ask.question}
                  </span>
                  {a.answer && a.answer.choice === null ? (
                    <Tag badge="updated">you asked for a clearer question</Tag>
                  ) : (
                    <Tag>
                      {optionLabel(
                        a.ask.options.find(
                          (o) => optionId(o) === a.ask.recommended,
                        ) ?? a.ask.recommended,
                      )}
                    </Tag>
                  )}
                </LabLink>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-sm">
              {withSpec.length === 0
                ? "No board carries a spec yet, so nothing is queued here."
                : "Every ask on every board has an answer this round."}
            </p>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {withSpec.length === 0
                ? "The boards move onto the kit's template in the wave after this round; each one declares its asks then, and they queue here. Until then a board argues on its own page."
                : "A new round opens the asks again. The answers so far are on each board below."}
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

      <Section
        id="boards"
        title="Every standing board"
        blurb="In registry order, the same order the board pages page through. A board with a spec shows its verdict and its asks; one without shows what it is exploring."
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
          {row.asks.map((a) => (
            <li key={a.ask.id}>
              <LabLink
                href={
                  a.answer?.choice
                    ? `/design/lab/${row.id}`
                    : `${DESK_HREF}?session=${stepId(row.id, a.ask.id)}`
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
                    not clear, asked again
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
        <Ref to={{ kind: "record", id: row.id }} quiet>
          the record
        </Ref>
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
          </span>
        )}
      </p>
    </li>
  );
}
