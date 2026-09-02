import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  FlaskConical,
  LayoutGrid,
  Palette,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { COUNTS, ZONES } from "./catalog";
import { requireDesignKey, withDesignKey } from "@/lib/design-gate/server";

// THE WORKBENCH LANDING (2026-06-19). The lab is Partyreel's one internal UI
// tool, with two halves: a LIVE reference of the real shipped UI (synced by
// construction) and a SANDBOX for prototyping new designs. This page is the calm
// home; the sidebar owns browsing. Real app tokens (it IS the live tool).
export default async function DesignIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const link = (href: string) => withDesignKey(href, key);

  const sandboxSurfaces = ZONES.find((z) => z.id === "sandbox")?.groups ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-8 pb-20">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Partyreel · design lab
      </p>
      <h1 className="font-heading mt-2 text-4xl text-balance">The Workbench</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        One place for Partyreel&rsquo;s UI: a live reference of the real shipped
        components and tokens, synced by construction, plus a sandbox to
        prototype new designs before they reach the app. Browse the whole library
        from the sidebar.
      </p>

      {/* The two halves. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ZoneCard
          href={link("/design/foundations")}
          icon={<Palette className="size-4" />}
          title="Reference"
          count={`${COUNTS.reference} references`}
          blurb="The real shipped UI, rendered from production source. Browse it here to tune it everywhere."
        />
        <ZoneCard
          href={link(`/design/c/${firstSandboxId(sandboxSurfaces)}`)}
          icon={<FlaskConical className="size-4" />}
          title="Sandbox"
          count={`${COUNTS.sandbox} explorations`}
          blurb="Polished prototypes of new designs, built before integrating into the data-heavy app."
        />
      </div>

      {/* Jump straight into the live reference (the stars of the tool). */}
      <h2 className="mt-10 text-sm font-semibold">Jump in</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <JumpCard
          href={link("/design/foundations")}
          icon={<Palette className="size-4" />}
          title="Foundations"
          blurb="Color, type, radius, motion."
        />
        <JumpCard
          href={link("/design/components")}
          icon={<Boxes className="size-4" />}
          title="Components"
          blurb="The live UI primitives."
        />
        <JumpCard
          href={link("/design/system")}
          icon={<LayoutGrid className="size-4" />}
          title="Composed screens"
          blurb="The system across surfaces."
        />
      </div>

      {/* The sandbox library, grouped by surface (quiet size signal). */}
      <h2 className="mt-10 text-sm font-semibold">Sandbox</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Explorations grouped by surface. Each records the shipped direction and
        why.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {sandboxSurfaces.map((group) => (
          <div
            key={group.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="flex items-baseline gap-2 text-sm font-medium">
              {group.label}
              <span className="font-mono text-xs text-muted-foreground">
                {group.entries.length}
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {group.entries.filter((e) => e.status === "shipped").length}{" "}
              shipped
            </p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-xs text-muted-foreground">
        Internal lab. Not linked anywhere, not indexed, and absent from
        production without the key.
      </p>
    </main>
  );
}

function firstSandboxId(groups: { entries: { href: string }[] }[]): string {
  const href = groups[0]?.entries[0]?.href ?? "/design/c/entry";
  return href.replace("/design/c/", "");
}

function ZoneCard({
  href,
  icon,
  title,
  count,
  blurb,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  count: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
        {icon}
      </span>
      <span>
        <span className="flex items-center gap-2 font-medium">
          {title}
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
          {count}
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </span>
      </span>
    </Link>
  );
}

function JumpCard({
  href,
  icon,
  title,
  blurb,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30",
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </span>
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {title}
        <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className="text-xs leading-relaxed text-muted-foreground">
        {blurb}
      </span>
    </Link>
  );
}
