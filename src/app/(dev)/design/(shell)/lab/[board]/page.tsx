import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { WidePage } from "@/app/(dev)/design/(shell)/_shell/wide";
import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import {
  getRuling,
  SANDBOX,
  type SandboxId,
  SURFACE_LABEL,
} from "@/app/(dev)/design/touchpoints";
import { BoardFrame } from "./board-frame";
import { BOARD_COMPONENTS } from "../boards";

/**
 * THE BOARD PAGE (the Library x Lab round, 2026-09-15): one open question and
 * its candidates on the real tokens, inside the shell. The header is the
 * catalog record (the ruling so far in one line, the pointers); the page is
 * wide (the sidebar tucks away by preference, the TOC column yields to the
 * dock's Sections menu); the dock reads the board's neighbours from the
 * context this page provides. A board with a spec (sandbox/registry.ts)
 * renders through the kit's template once the lab-kit track lands it; until
 * then every board is `legacy` and draws its own body.
 */
export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { board: slug } = await params;
  const ruling = getRuling(slug);
  const board = ruling?.board;
  const entry =
    ruling && board ? BOARD_COMPONENTS[ruling.id as SandboxId] : undefined;
  if (!ruling || !board || !entry) notFound();

  const spec = boardSpec(ruling.id);
  const i = SANDBOX.findIndex((r) => r.id === ruling.id);
  const prev = SANDBOX[i - 1];
  const next = SANDBOX[i + 1];
  const { Component } = entry;

  // Marketing boards render inside the production marketing skin so the
  // [data-mkt-*] grammar (marketing.css, loaded by the root layout) reaches
  // them with the real tokens.
  const skin = ruling.surface === "marketing" ? { "data-mkt": "" } : {};

  return (
    <BoardFrame
      id={ruling.id}
      title={ruling.title}
      sections={spec?.sections.map((s) => ({ id: s.id, label: s.title })) ?? []}
      prev={prev && { href: `/design/lab/${prev.id}`, label: prev.title }}
      next={next && { href: `/design/lab/${next.id}`, label: next.title }}
    >
      <WidePage>
        <PageHeader
          title={ruling.title}
          description={spec?.question ?? `${board.note}.`}
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
                {(board.tracks ?? [ruling.id]).map((t) => (
                  <Ref key={t} to={{ kind: "track", name: t }} quiet>
                    {t}
                  </Ref>
                ))}
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
