import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { listSpecs } from "@/app/(dev)/design/_data/docs";

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const specs = listSpecs();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Proposals"
        description="Every board's settled argument under docs/specs, rendered from the repo. A proposal is not law until Will rules on it; a bible rule that inherits one says so on its page."
      />
      <Callout kind="not-law" className="mt-6">
        These documents argue; the bible binds.
      </Callout>
      <Section id="list" title={`${specs.length} proposals`}>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {specs.map((s) => (
            <li key={s.slug} className="px-4 py-3">
              <LabLink
                href={`/design/lab/proposals/${s.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {s.title}
              </LabLink>
              <Tag badge="proposal" className="ml-2" />
              {s.status && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {s.status}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Section>
      <Pager />
    </div>
  );
}
