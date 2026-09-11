import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";
import { RefHeader, RefSection } from "../reference/reference-ui";
import { RULES } from "../rules/rules";
import { type Ruling, RULINGS, SURFACE_LABEL } from "../touchpoints";

// THE RECORD: every ruling the lab has taken, one line each, from
// touchpoints.ts. The long form (the ruling verbatim, the round's context, the
// board's files and last SHA) is docs/decisions/design-record.md, anchored by
// the same ids; the rules a reader must obey live in the system docs named
// under "Lives". Open boards are the ones still standing in the sandbox.
export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const rulesHref = withDesignKey("/design/rules", key);
  const open = RULINGS.filter((r) => r.board !== undefined);
  const ruled = RULINGS.filter((r) => r.board === undefined);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · history"
        title="The record"
        blurb="Every ruling the lab has taken, one line each. The long form, verbatim, is docs/decisions/design-record.md; the rules themselves live where each row says. Boards leave the sandbox when their ruling lands; git keeps them."
      />
      <RefSection
        title={`Open (${open.length})`}
        blurb="Boards still standing in the sandbox."
      >
        <RecordTable rows={open} rulesHref={rulesHref} />
      </RefSection>
      <RefSection
        title={`Ruled (${ruled.length})`}
        blurb="Boards deleted; the record doc and git history keep them."
      >
        <RecordTable rows={ruled} rulesHref={rulesHref} />
      </RefSection>
    </main>
  );
}

/** How many enforced rules live where the ruling says its rule lives (a
 *  prefix on the path, the anchor for a doc): derived, never hand-written,
 *  so a ruling nothing enforces shows as exactly that. */
function enforcedRuleCount(lives: string[]): number {
  return RULES.filter((rule) =>
    lives.some((entry) => {
      const [path, anchor] = entry.split("#");
      if (rule.source === "doc") {
        return rule.file === path && (!anchor || rule.suite[0] === anchor);
      }
      return rule.file.startsWith(path.replace(/\.[jt]sx?$/, ""));
    }),
  ).length;
}

function RecordTable({
  rows,
  rulesHref,
}: {
  rows: Ruling[];
  rulesHref: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[56rem] text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
            <th className="px-3 py-2 font-medium">Touchpoint</th>
            <th className="px-3 py-2 font-medium">Surface</th>
            <th className="px-3 py-2 font-medium">Ruled</th>
            <th className="px-3 py-2 font-medium">Shipped</th>
            <th className="px-3 py-2 font-medium">Why</th>
            <th className="px-3 py-2 font-medium">Lives</th>
            <th className="px-3 py-2 font-medium">Enforced</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-border align-top last:border-0"
            >
              <td className="px-3 py-2.5">
                <p className="font-medium">{r.title}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  design-record.md#{r.id}
                </p>
              </td>
              <td className="px-3 py-2.5">{SURFACE_LABEL[r.surface]}</td>
              <td className="px-3 py-2.5 font-mono text-[11px]">{r.ruled}</td>
              <td className="px-3 py-2.5">
                {r.shipped ?? (r.board ? "open" : "see the record")}
              </td>
              <td className="max-w-md px-3 py-2.5 text-muted-foreground">
                {r.why}
              </td>
              <td className="px-3 py-2.5">
                {r.lives.map((l) => (
                  <p
                    key={l}
                    className="font-mono text-[11px] text-muted-foreground"
                  >
                    {l}
                  </p>
                ))}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">
                {enforcedRuleCount(r.lives) === 0 ? (
                  <span className="text-muted-foreground">nothing</span>
                ) : (
                  <a href={`${rulesHref}#r-${r.id}`} className="underline">
                    {enforcedRuleCount(r.lives)} rule
                    {enforcedRuleCount(r.lives) === 1 ? "" : "s"}
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
