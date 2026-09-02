import { requireDesignKey } from "@/lib/design-gate/server";
import { RefHeader, RefSection } from "../reference/reference-ui";
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
  await requireDesignKey(searchParams);
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
        <RecordTable rows={open} />
      </RefSection>
      <RefSection
        title={`Ruled (${ruled.length})`}
        blurb="Boards deleted; the record doc and git history keep them."
      >
        <RecordTable rows={ruled} />
      </RefSection>
    </main>
  );
}

function RecordTable({ rows }: { rows: Ruling[] }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
