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
import { listSpecs, readDoc } from "@/app/(dev)/design/_data/docs";
import { SANDBOX } from "@/app/(dev)/design/touchpoints";

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
  const spec = listed ?? {
    slug,
    title: h1 ? h1.replace(/^# /, "") : slug,
    status: "A settled spec, not an open proposal.",
  };
  const board = SANDBOX.some((r) => r.id === slug);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title={spec.title}
        description={
          spec.status ?? "A board's settled argument; not law until Will rules."
        }
        badges={<Tag badge="proposal" />}
        meta={[
          ["Source", <Ref key="s" to={{ kind: "source", file }} quiet />],
          ...(board
            ? [
                [
                  "Board",
                  <Ref key="b" to={{ kind: "board", id: slug }} quiet>
                    open the board
                  </Ref>,
                ] as [string, React.ReactNode],
              ]
            : []),
        ]}
      />
      <Callout kind="not-law" className="mt-6">
        A proposal argues; the bible binds. The board carries the asks Will
        answers.
      </Callout>
      <div className="mt-6">
        <Markdown source={body} from={file} designKey={key} skipTitle />
      </div>
      <Pager />
    </div>
  );
}
