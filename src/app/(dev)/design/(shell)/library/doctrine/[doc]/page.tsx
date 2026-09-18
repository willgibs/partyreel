import { notFound } from "next/navigation";

import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { type DocId, DOCS, readDoc } from "@/app/(dev)/design/_data/docs";

const AUTHORITY_NOTE = {
  precedent:
    "A system doc: what exists and its invariants. Under the 2026-09-12 ruling everything outside the bible and the contracts is precedent: judge it from the ground up and rebuild it in a better exploration.",
  program:
    "How the program works: roles, gates, the round. Binds the way you work, not the way things look.",
  guidance:
    "The craft skill, declared primary: the default you leave on purpose, never a wall.",
} as const;

/**
 * A DOCTRINE PAGE (the Library x Lab round, 2026-09-15): one of the five repo
 * documents the library renders, read at request time (next.config traces
 * them into the lab's functions), with its authority said once at the top.
 */
export default async function DoctrinePage({
  params,
  searchParams,
}: {
  params: Promise<{ doc: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { doc } = await params;
  if (!(doc in DOCS)) notFound();
  const meta = DOCS[doc as DocId];
  const { body } = readDoc(meta.path);
  const kind =
    meta.authority === "precedent"
      ? "not-law"
      : meta.authority === "program"
        ? "note"
        : "provisional";
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={meta.title}
        description={AUTHORITY_NOTE[meta.authority]}
        badges={<Tag>{meta.authority}</Tag>}
        meta={[
          [
            "Source",
            <Ref key="src" to={{ kind: "source", file: meta.path }} quiet />,
          ],
        ]}
      />
      <Callout
        kind={kind}
        title={
          meta.authority === "precedent"
            ? "Precedent, not law"
            : meta.authority === "program"
              ? "Program"
              : "Guidance"
        }
        className="mt-6"
      >
        {AUTHORITY_NOTE[meta.authority]}
      </Callout>
      <div className="mt-6">
        <Markdown source={body} from={meta.path} designKey={key} skipTitle />
      </div>
      <Pager />
    </div>
  );
}
