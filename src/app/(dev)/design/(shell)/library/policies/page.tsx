import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { DOCS, landminesOf, readDoc } from "@/app/(dev)/design/_data/docs";
import { POLICY_TESTS } from "@/app/(dev)/design/_data/links";
import { BIBLE } from "@/app/(dev)/design/rules/bible";

/**
 * POLICIES AND LANDMINES (the Library x Lab round, 2026-09-15). A policy is
 * an agent-written test that holds a line across the tree; it is listed here
 * with the bible rules that cite it, so a policy no rule cites stands out (a
 * finding, since rules are provisional). A landmine is a ★ block in a system
 * doc: a silent breakage if reverted, never a design rule. Phase 0 lists the
 * fourteen policies the bible names; the lab-rules track's collector reads a
 * `@policy:` directive from every test instead.
 */
export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const policies = Object.entries(POLICY_TESTS).map(([id, file]) => ({
    id,
    file,
    citedBy: BIBLE.filter(
      (r) => r.enforcedBy !== "review" && r.enforcedBy.includes(file),
    ),
  }));
  const mines = (["design-system", "marketing-content"] as const).map(
    (doc) => ({
      doc,
      title: DOCS[doc].title,
      path: DOCS[doc].path,
      items: landminesOf(readDoc(DOCS[doc].path).body),
    }),
  );
  const uncited = policies.filter((p) => p.citedBy.length === 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Policies and landmines"
        description="The tests that hold a line across the tree, with the bible rules that cite each; and the ★ blocks in the system docs, the silent breakages a revert would cause."
      />
      <StatRow
        stats={[
          ["policies", policies.length],
          ["cited by no rule", uncited.length],
          ["landmines", mines.reduce((n, m) => n + m.items.length, 0)],
        ]}
      />
      <Section
        id="tests"
        title="Policies"
        blurb="Provisional: an agent wrote each one. The gate is red without it; a rule that blocks better work is a finding, not a wall."
      >
        <Callout kind="provisional" className="mb-4">
          A policy the bible does not cite still runs in the gate; it is listed
          so the gap is visible. The lab-rules track makes the list mechanical
          (a directive in every test) and refuses a design policy no rule cites.
        </Callout>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {policies.map((p) => (
            <li
              key={p.id}
              id={p.id}
              className="scroll-mt-[calc(var(--lab-topbar-h,0px)+12px)] px-4 py-3"
            >
              <p className="text-sm font-medium">{p.id}</p>
              <p className="mt-0.5 text-[11px]">
                <Ref to={{ kind: "source", file: p.file }} quiet />
              </p>
              <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                {p.citedBy.length === 0 ? (
                  <span>cited by no bible rule</span>
                ) : (
                  <>
                    <span>cited by</span>
                    {p.citedBy.map((r) => (
                      <Ref key={r.id} to={{ kind: "rule", id: r.id }} quiet>
                        bible {r.n}
                      </Ref>
                    ))}
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </Section>
      <Section
        id="landmines"
        title="Landmines"
        blurb="Every ★ block in the two design system docs, with the chapter it sits under. Know it before you touch its surface."
      >
        {mines.map((m) => (
          <div key={m.doc} className="mt-4 first:mt-0">
            <h3 className="text-sm font-semibold">
              <Ref to={{ kind: "doc", doc: m.doc }}>{m.title}</Ref>{" "}
              <span className="text-muted-foreground">({m.items.length})</span>
            </h3>
            <ul className="mt-2 space-y-2">
              {m.items.map((it, i) => (
                <li
                  key={`${m.doc}-${i}`}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
                >
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    ★ under{" "}
                    <Ref
                      to={{ kind: "doc", doc: m.doc, anchor: it.underId }}
                      quiet
                    >
                      {it.under}
                    </Ref>
                  </p>
                  <Markdown source={it.text} from={m.path} designKey={key} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
      <Pager />
    </div>
  );
}
