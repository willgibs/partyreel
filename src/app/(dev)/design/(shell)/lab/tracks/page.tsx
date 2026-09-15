import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { StatRow } from "@/app/(dev)/design/(shell)/_shell/stat-row";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";
import { listTracks } from "@/app/(dev)/design/_data/docs";
import { trackAlias } from "@/app/(dev)/design/_data/tracks";

export default async function TracksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const tracks = listTracks();
  const live = tracks.filter((t) => t.status !== "integrated");
  const done = tracks.filter((t) => t.status === "integrated");
  const row = (t: (typeof tracks)[number]) => (
    <li
      key={t.name}
      className="flex flex-wrap items-baseline gap-x-3 px-4 py-2"
    >
      <LabLink
        href={`/design/lab/tracks/${t.name}`}
        className="text-sm font-medium hover:underline"
      >
        {t.name}
      </LabLink>
      <Tag badge={t.status === "integrated" ? "retired" : undefined}>
        {t.status}
      </Tag>
      {t.preview && t.status !== "integrated" && (
        <a
          href={trackAlias(t.name)}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-muted-foreground underline underline-offset-2"
        >
          its preview
        </a>
      )}
    </li>
  );
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Tracks"
        description="Every lp/<track> branch with a manifest under docs/tracks: what it claims, what it handed off, what it recorded. Rendered from the manifests; nothing here is a second copy."
      />
      <StatRow
        stats={[
          ["live", live.length],
          ["integrated", done.length],
        ]}
      />
      <Section id="live" title="Live">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {live.length ? (
            live.map(row)
          ) : (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              None open.
            </li>
          )}
        </ul>
      </Section>
      <Section id="integrated" title="Integrated">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {done.map(row)}
        </ul>
      </Section>
      <Pager />
    </div>
  );
}
