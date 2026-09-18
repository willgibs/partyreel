import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { headingsOf, readDoc } from "@/app/(dev)/design/_data/docs";
import { LEVEL_BY_ID } from "@/app/(dev)/design/rules/influences";

import { LevelBadge } from "../rules/level-badge";

const FILE = "docs/design/guidance.md";

/**
 * GUIDANCE (the Library x Lab round, 2026-09-15): the craft stack, the skills,
 * and how a board is built so a review is quick. The level below the law, the
 * contracts and the policies: it never binds, and a departure from it is
 * flagged on the board rather than argued for in advance.
 *
 * It used to be a chapter of `design-system.md`, which made it read as
 * precedent (what shipped) rather than as guidance (what to reach for). This
 * round moved it to `docs/design/guidance.md`, beside the levels that define
 * it, and left a pointer in the system doc. The page renders the file at
 * request time, so the file is the page: nothing about the craft stack is
 * written twice.
 */
export default async function GuidancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { body } = readDoc(FILE);
  const chapters = headingsOf(body, 2).filter((h) => h.depth === 2);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Guidance"
        description="The craft stack, the installed skills, and the shape a board takes so one screen answers its question. This is what an agent reaches for by default, and leaves only on purpose."
        badges={<LevelBadge level={LEVEL_BY_ID.guidance} />}
        meta={[
          [
            "Source",
            <Ref key="src" to={{ kind: "source", file: FILE }} quiet />,
          ],
          ["Chapters", String(chapters.length)],
          [
            "The primary skill",
            <Ref key="craft" to={{ kind: "doc", doc: "craft" }} quiet>
              emil-design-eng
            </Ref>,
          ],
        ]}
      />

      <Callout kind="provisional" className="mt-6">
        Guidance never binds. Departing from it is a normal move, and the only
        thing it owes you is a line saying what you departed from and what it
        cost: a departure with its cost written down is a finding, and the same
        departure unmentioned is a regression nobody can tell from a decision.
      </Callout>

      <div className="mt-8">
        <Markdown source={body} from={FILE} designKey={key} skipTitle />
      </div>

      <Pager />
    </div>
  );
}
