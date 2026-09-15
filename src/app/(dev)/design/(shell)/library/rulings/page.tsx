import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { readDoc } from "@/app/(dev)/design/_data/docs";

const FILE = "docs/design/rulings.md";

/**
 * WILL'S RULINGS, rendered from the repo (the Library x Lab round,
 * 2026-09-15): what he said, verbatim and dated, and what each became. Never
 * owned by a track; the Orchestrator appends. Read at request time, so the
 * page is the file.
 */
export default async function RulingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { body } = readDoc(FILE);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Will's rulings"
        description="What Will said, verbatim where it was written down and paraphrased where it was not, dated, newest first, with what each ruling became: a bible rule, a program line, guidance."
        meta={[
          [
            "Source",
            <Ref key="src" to={{ kind: "source", file: FILE }} quiet />,
          ],
        ]}
      />
      <Callout kind="will" className="mt-6">
        A ruling binds until it becomes a rule or is superseded by a later one.
        These are the hidden influences made visible: before this round they
        lived in memory files outside the repo.
      </Callout>
      <div className="mt-6">
        <Markdown source={body} from={FILE} designKey={key} skipTitle />
      </div>
      <Pager />
    </div>
  );
}
