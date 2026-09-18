import { requireDesignKey } from "@/lib/design-gate/server";
import { cn } from "@/lib/utils";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section, Sub } from "@/app/(dev)/design/(shell)/_shell/section";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { DOCS, landminesOf, readDoc } from "@/app/(dev)/design/_data/docs";
import {
  POLICY_VIEWS,
  uncitedDesignPolicies,
  type PolicyView,
} from "@/app/(dev)/design/_data/policies";
import { LEVEL_BY_ID } from "@/app/(dev)/design/rules/influences";
import {
  POLICY_SCOPE_LABEL,
  POLICY_SCOPES,
} from "@/app/(dev)/design/rules/rules";

import { LevelBadge } from "../rules/level-badge";

/**
 * POLICIES AND LANDMINES (the Library x Lab round, 2026-09-15). Two levels
 * that look alike from a distance and are opposites up close.
 *
 * A POLICY is a line somebody chose to hold across the tree, written as a
 * test. It binds mechanically (the gate is red without it) and it is
 * PROVISIONAL, because an agent wrote it against a design system that has
 * since moved (Will, 2026-09-01: "is this a good rule that prevents bad
 * choices, or is this a bad system that prevents good choices?"). So every row
 * says what it refuses, in the test's own words, and which bible rules cite
 * it. A design policy nothing cites fails `rules-registry.test.ts`.
 *
 * A LANDMINE is not a choice at all: a ★ block in a system doc marking
 * something that breaks SILENTLY when reverted. It is never a design
 * decision, and this page is the one place the two are told apart on purpose.
 *
 * Phase 0 read a hand-written list in `_data/links.ts`; the rows below come
 * from the `// @policy:` directive in each test's header, so a policy cannot
 * exist in the tree without appearing here.
 */
export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const uncited = uncitedDesignPolicies();
  const mines = (["design-system", "marketing-content"] as const).map(
    (doc) => ({
      doc,
      title: DOCS[doc].title,
      path: DOCS[doc].path,
      items: landminesOf(readDoc(DOCS[doc].path).body),
    }),
  );
  const mineCount = mines.reduce((n, m) => n + m.items.length, 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Policies and landmines"
        description="Every test that holds a line across the tree, what it refuses in its own words, and the bible rules that cite it. Then the landmines: the blocks in the system docs that break silently when reverted, which are traps and never rules."
        badges={
          <>
            <LevelBadge level={LEVEL_BY_ID.policy} />
            <LevelBadge level={LEVEL_BY_ID.landmine} />
            <Tag>{POLICY_VIEWS.length} policies</Tag>
            <Tag>{mineCount} landmines</Tag>
          </>
        }
        meta={[
          ["Read from", "a `// @policy:` directive in each test's header"],
          [
            "Uncited",
            uncited.length === 0
              ? "none"
              : `${uncited.length} (the gate is red)`,
          ],
        ]}
      />

      <Callout kind="provisional" className="mt-6">
        A policy is the weakest thing that still binds you: it runs in the gate,
        and an agent wrote it. If one blocks better work, that is a finding for
        your manifest and the better thing goes in the lab. What it must never
        be is invisible, which is what the hand-written list before this page
        made it.
      </Callout>

      <Section
        id="tests"
        title="The policies"
        blurb="By scope: how far the line reaches. Everywhere first, then a surface, then the carve-out for guards that are not design at all."
      >
        <div className="space-y-2">
          {POLICY_SCOPES.map((scope) => {
            const list = POLICY_VIEWS.filter((p) => p.scope === scope);
            if (list.length === 0) return null;
            return (
              <Sub
                key={scope}
                id={`scope-${scope}`}
                title={POLICY_SCOPE_LABEL[scope]}
                blurb={
                  scope === "engineering"
                    ? "A compiler footgun, a name collision, a lane manifest. No bible rule is owed a citation of these."
                    : undefined
                }
              >
                <ul className="space-y-2">
                  {list.map((p) => (
                    <PolicyRow key={p.id} policy={p} />
                  ))}
                </ul>
              </Sub>
            );
          })}
        </div>
      </Section>

      <Section
        id="landmines"
        title="The landmines"
        blurb="Every ★ block in the two system docs, with the chapter it sits under. Not a rule and not a look: a thing that has already broken once, and breaks again without a word if someone tidies it away."
      >
        <div className="space-y-6">
          {mines.map((m) => (
            <Sub
              key={m.doc}
              id={`landmines-${m.doc}`}
              title={m.title}
              blurb={`${m.items.length} in this doc.`}
            >
              <ul className="space-y-2">
                {m.items.map((it, i) => (
                  <li
                    key={`${m.doc}-${i}`}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-sm"
                  >
                    <p className="mb-1 flex flex-wrap items-baseline gap-2 text-[11px] text-muted-foreground">
                      <LevelBadge level={LEVEL_BY_ID.landmine} />
                      <span>under</span>
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
            </Sub>
          ))}
        </div>
      </Section>

      <Pager />
    </div>
  );
}

// The anchor offset lives on <html> (scroll-padding-top: the shell rule on a
// library page, the dock's inline value on a board); a scroll-margin here
// would add to it and land every section a bar's height too low (found by
// the home-hero migration, 2026-09-15).
const SCROLL_MT = "";

/**
 * One policy. The `refuses` sentence is the row's body rather than a footnote:
 * it is the only line that tells a reader what a red gate on this file
 * actually means, and it is written in the test's own header.
 */
function PolicyRow({ policy }: { policy: PolicyView }) {
  const orphan = policy.citedBy.length === 0 && policy.scope !== "engineering";
  return (
    <li
      id={policy.id}
      className={cn(
        "rounded-xl border bg-card px-4 py-3",
        SCROLL_MT,
        orphan ? "border-foreground/40" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium">{policy.title}</p>
        <Ref
          to={{ kind: "source", file: policy.file, line: policy.line }}
          quiet
          className="text-[11px]"
        />
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Refuses {policy.summary}
      </p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
        {policy.citedBy.length > 0 ? (
          <>
            <span>cited by</span>
            {policy.citedBy.map((r) => (
              <Ref key={r.id} to={{ kind: "rule", id: r.id }} quiet>
                bible {r.n}
              </Ref>
            ))}
          </>
        ) : orphan ? (
          <span className="text-foreground">
            No bible rule cites this. That is a finding, not a rule.
          </span>
        ) : (
          <span>engineering, so no rule is owed</span>
        )}
      </p>
    </li>
  );
}
