import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { LEVEL_BY_ID } from "@/app/(dev)/design/rules/influences";
import { type Ruling, SURFACE_LABEL } from "@/app/(dev)/design/touchpoints";

import { LevelBadge } from "../rules/level-badge";
import { recordGroups, RECORD_FILE } from "./sections";

/**
 * THE RECORD (the Library x Lab round, 2026-09-15): every ruling the lab has
 * taken, one row each, derived from `RULINGS` and from the record doc's own
 * headings. Nothing here is typed twice: the markdown table that used to head
 * `design-record.md` said the same thing in a second hand and had already
 * drifted from the registry, so it is gone and this page is the table.
 *
 * History, never law. The rules a reader must obey are the bible and the
 * component contracts; a ruling is how one of them was reached.
 */
export default async function RecordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { open, ruled, recordOnly, missingSection } = recordGroups();
  const thin = new Set(missingSection.map((r) => r.id));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="The record"
        description="Every ruling the lab has taken: what was asked, what shipped, and where the rule lives now. Boards leave the sandbox when their ruling lands; git keeps them, and the long form stays here."
        badges={
          <>
            <LevelBadge level={LEVEL_BY_ID.ruling} />
            <Tag>{open.length} open</Tag>
            <Tag>{ruled.length} ruled</Tag>
          </>
        }
        meta={[
          [
            "The long form",
            <Ref key="src" to={{ kind: "source", file: RECORD_FILE }} quiet />,
          ],
          [
            "The registry",
            <Ref
              key="reg"
              to={{
                kind: "source",
                file: "src/app/(dev)/design/touchpoints.ts",
              }}
              quiet
            />,
          ],
        ]}
      />

      <StatRow
        stats={[
          ["rulings", open.length + ruled.length],
          ["still open", open.length],
          ["record only", recordOnly.length],
          ["awaiting a write-up", missingSection.length],
        ]}
      />

      <Callout kind="not-law" className="mt-6">
        A ruling is history. When a ruling and the bible disagree, the bible is
        wrong and that is a finding, not a licence to follow the older word.
      </Callout>

      <Section
        id="open"
        title={`Open (${open.length})`}
        blurb="Boards still standing in the lab. The question is live and the answer is not Will's yet."
      >
        <RecordTable rows={open} thin={thin} />
      </Section>

      <Section
        id="ruled"
        title={`Ruled (${ruled.length})`}
        blurb="Decided. The board is deleted; the record doc and git history keep it."
      >
        <RecordTable rows={ruled} thin={thin} />
      </Section>

      {recordOnly.length > 0 && (
        <Section
          id="record-only"
          title={`Record only (${recordOnly.length})`}
          blurb="A section in the record doc with no entry in the registry: a ruling the lab wrote up and never gave a touchpoint. Listed rather than hidden, because a link in the docs can still reach it."
        >
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
            {recordOnly.map((s) => (
              <li key={s.id} className="flex flex-wrap gap-x-3 px-4 py-2.5">
                <LabLink
                  href={`/design/library/record/${s.id}`}
                  className="font-medium hover:underline"
                >
                  {s.title}
                </LabLink>
                <span className="text-[11px] text-muted-foreground">
                  design-record.md#{s.id}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Pager />
    </div>
  );
}

function RecordTable({ rows, thin }: { rows: Ruling[]; thin: Set<string> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[52rem] text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
            {/* Plain words, not the field names (the sweep, 2026-09-16):
                "Lives" read as a verb with no subject. */}
            <th className="px-3 py-2 font-medium">Ruling</th>
            <th className="px-3 py-2 font-medium">Surface</th>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Shipped</th>
            <th className="px-3 py-2 font-medium">Why</th>
            <th className="px-3 py-2 font-medium">Where it lives now</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              id={r.id}
              className="border-b border-border align-top last:border-0"
            >
              <td className="px-3 py-2.5">
                <LabLink
                  href={`/design/library/record/${r.id}`}
                  className="font-medium hover:underline"
                >
                  {r.title}
                </LabLink>
                <p className="text-[11px] text-muted-foreground">
                  {thin.has(r.id)
                    ? "no write-up in the record doc yet"
                    : `design-record.md#${r.id}`}
                </p>
              </td>
              <td className="px-3 py-2.5">{SURFACE_LABEL[r.surface]}</td>
              <td className="px-3 py-2.5 text-[11px] tabular-nums">
                {r.ruled}
              </td>
              <td className="px-3 py-2.5">
                {r.shipped ?? (r.board ? "open" : "see the record")}
              </td>
              <td className="max-w-md px-3 py-2.5 text-muted-foreground">
                {r.why}
              </td>
              <td className="px-3 py-2.5">
                <span className="flex flex-col gap-0.5 text-[11px]">
                  {r.lives.map((l) => (
                    <Ref key={l} to={l} quiet />
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
