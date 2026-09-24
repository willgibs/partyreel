import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Sub } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import {
  BIBLE,
  BIBLE_GROUP_LABEL,
  BIBLE_GROUPS,
  type BibleRule,
} from "@/app/(dev)/design/rules/bible";

/**
 * THE TEN: the bible's principles, each a statement and its reason, and
 * nothing else on the page. Every principle's slug is its anchor, so a link
 * written as `/design/library/rules#media-is-the-color` lands on it (the
 * search and `bible 6` refs resolve there). The glossary is a quiet link at
 * the foot.
 */
export default async function TheTenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="The bible's ten"
        description="The principles every design starts from, each with its reason. Will owns the wording, and like everything else here each one is a working version, kept in one place so it changes with one edit."
      />

      <div className="mt-8 space-y-2">
        {BIBLE_GROUPS.map((group) => (
          <Sub
            key={group}
            id={`ten-${group.replace(/\s+/g, "-")}`}
            title={BIBLE_GROUP_LABEL[group]}
          >
            <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {BIBLE.filter((r) => r.group === group).map((rule) => (
                <Principle key={rule.id} rule={rule} />
              ))}
            </ol>
          </Sub>
        ))}
      </div>

      <p className="mt-6 text-[13px] text-muted-foreground">
        The words these pages use are in{" "}
        <LabLink
          href="/design/library/glossary"
          className="underline-offset-2 hover:text-foreground hover:underline"
        >
          the glossary
        </LabLink>
        .
      </p>

      <Pager />
    </div>
  );
}

/** A principle, one row: the statement, then its reason. */
function Principle({ rule }: { rule: BibleRule }) {
  return (
    <li id={rule.id} className="px-4 py-3">
      <p className="text-sm">
        <span className="mr-2 text-[11px] text-muted-foreground tabular-nums">
          {rule.n}
        </span>
        <span className="font-medium">{rule.statement}</span>
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        {rule.why}
      </p>
    </li>
  );
}
