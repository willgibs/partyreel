import { existsSync } from "node:fs";
import { join } from "node:path";

import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { inlineText, listSpecs, readDoc } from "@/app/(dev)/design/_data/docs";
import { readTrackStates } from "@/app/(dev)/design/_data/tracks";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

import { proposalStatus } from "../status";

/**
 * ONE PROPOSAL (the Library x Lab round, 2026-09-15). The document, rendered,
 * with the two things a reader needs beside it: the board it argues for (open
 * it to answer) and the track writing it. Its standing comes from its own
 * opening blockquote, de-wrapped into one clause (status.ts), rather than from
 * the raw source line the listing carries.
 */
export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { slug } = await params;
  // Any docs/specs file renders (a doc may link one the listing leaves out,
  // such as the shipped reel spec); the listing is what the nav shows.
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const file = `docs/specs/${slug}.md`;
  if (!existsSync(join(process.cwd(), file))) notFound();
  const listed = listSpecs().find((s) => s.slug === slug);
  const { body } = readDoc(file);
  const h1 = body.split("\n").find((l) => /^# /.test(l));
  const spec = {
    slug,
    title: listed?.title ?? (h1 ? inlineText(h1.replace(/^# /, "")) : slug),
    status:
      proposalStatus(body) ??
      (listed
        ? "A board's settled argument; not law until Will rules."
        : "A settled spec, not an open proposal."),
  };
  const board = SANDBOX.find((r) => r.id === slug);
  const tracks = readTrackStates();
  const builders = (board?.board?.tracks ?? (board ? [board.id] : [])).filter(
    (n) => tracks.has(n),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={spec.title}
        description={spec.status}
        badges={
          <>
            <Tag badge="proposal" />
            {board && <Tag>{`board: ${board.title}`}</Tag>}
          </>
        }
        meta={[
          ["Source", <Ref key="s" to={{ kind: "source", file }} quiet />],
          ...(board
            ? ([
                [
                  "Board",
                  <Ref key="b" to={{ kind: "board", id: slug }} quiet>
                    open the board
                  </Ref>,
                ],
              ] as [string, React.ReactNode][])
            : []),
          ...(builders.length > 0
            ? ([
                [
                  "Written by",
                  <span key="t" className="inline-flex flex-wrap gap-2">
                    {builders.map((n) => (
                      <Ref key={n} to={{ kind: "track", name: n }} quiet />
                    ))}
                  </span>,
                ],
              ] as [string, React.ReactNode][])
            : []),
        ]}
      />
      <Callout kind="not-law" className="mt-6">
        A proposal argues; the bible binds. The asks Will answers are on the
        board, and the desk queues them.
      </Callout>
      {/* See the note on the track page: a long unbroken path inside inline
          code overflows a phone until the shared prose learns to break it. */}
      <div className="mt-6 [&_a]:break-words [&_code]:break-words [&_table]:block [&_table]:overflow-x-auto">
        <Markdown source={body} from={file} designKey={key} skipTitle />
      </div>
      <Pager />
    </div>
  );
}
