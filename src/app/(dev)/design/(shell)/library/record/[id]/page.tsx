import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { readDoc, sectionOf } from "@/app/(dev)/design/_data/docs";
import {
  getRuling,
  RULINGS,
  SURFACE_LABEL,
} from "@/app/(dev)/design/touchpoints";

const RECORD = "docs/decisions/design-record.md";

/**
 * ONE RULING'S RECORD (the Library x Lab round, 2026-09-15): the registry
 * line (touchpoints.ts) and the long form from design-record.md, anchored by
 * the same id, with the board, the track and every `lives` path as a link.
 */
export default async function RecordEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { id } = await params;
  const ruling = getRuling(id);
  if (!ruling) notFound();
  const long = sectionOf(readDoc(RECORD).body, ruling.id);
  const i = RULINGS.findIndex((r) => r.id === ruling.id);
  const prev = RULINGS[i - 1];
  const next = RULINGS[i + 1];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={ruling.title}
        description={ruling.why}
        badges={
          <>
            <Tag>{SURFACE_LABEL[ruling.surface]}</Tag>
            {ruling.shipped ? (
              <Tag badge="shipped">Shipped: {ruling.shipped}</Tag>
            ) : ruling.board ? (
              <Tag badge="exploring">open</Tag>
            ) : (
              <Tag>ruled</Tag>
            )}
          </>
        }
        meta={[
          ["Ruled", ruling.ruled],
          ...(ruling.board
            ? [
                [
                  "Board",
                  <Ref key="b" to={{ kind: "board", id: ruling.id }} quiet>
                    open the board
                  </Ref>,
                ] as [string, React.ReactNode],
              ]
            : []),
          [
            "Lives",
            <span key="lives" className="inline-flex flex-wrap gap-x-2">
              {ruling.lives.map((l) => (
                <Ref key={l} to={l} quiet />
              ))}
            </span>,
          ],
          [
            "Source",
            <Ref key="src" to={{ kind: "source", file: RECORD }} quiet />,
          ],
        ]}
      />
      <div className="mt-6">
        {long ? (
          <Markdown source={long} from={RECORD} designKey={key} />
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            No section with this id in the record doc yet; the one-line ruling
            above is the whole record.
          </p>
        )}
      </div>
      <Pager
        prev={
          prev && {
            href: `/design/library/record/${prev.id}`,
            label: prev.title,
          }
        }
        next={
          next && {
            href: `/design/library/record/${next.id}`,
            label: next.title,
          }
        }
      />
    </div>
  );
}
