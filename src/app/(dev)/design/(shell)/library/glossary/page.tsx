import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { GLOSSARY, RETIRED } from "@/app/(dev)/design/_data/glossary";

export default async function GlossaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Glossary"
        description="The words this app uses, each told from its neighbours in one sentence, and the words that left, with what they mean now."
      />
      <Section id="terms" title="The words">
        <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {GLOSSARY.map((t) => (
            <div key={t.term} className="px-4 py-3">
              <dt className="text-sm font-medium">
                {t.href ? (
                  <LabLink href={t.href} className="hover:underline">
                    {t.term}
                  </LabLink>
                ) : (
                  t.term
                )}
              </dt>
              <dd className="mt-0.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {t.meaning}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="retired" title="Words that left">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
          {RETIRED.map((r) => (
            <li key={r.term} className="flex flex-wrap gap-x-2 px-4 py-2">
              <span className="font-medium line-through decoration-muted-foreground/60">
                {r.term}
              </span>
              <span className="text-muted-foreground">now {r.now}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Pager />
    </div>
  );
}
