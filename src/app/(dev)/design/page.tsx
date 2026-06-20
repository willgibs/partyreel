import Link from "next/link";
import { ArrowRight, Palette, Sparkles } from "lucide-react";

import { requireDesignKey, withDesignKey } from "./gate";
import { ModeShell } from "./mode-shell";
import { type Surface, TOUCHPOINTS } from "./touchpoints";

const SURFACES: { key: Surface; label: string; blurb: string }[] = [
  { key: "guest", label: "Guest", blurb: "The scan-to-upload event experience" },
  { key: "host", label: "Host", blurb: "The dashboard and event management app" },
  { key: "shared", label: "Shared", blurb: "Cross-surface system pieces" },
];

// THE DESIGN LAB LANDING (lab refresh, 2026-06-19). The lab is repositioned to
// two standing purposes: a live design-system reference, and a fast UI
// prototyping space (polished explorations before integrating into the
// data-heavy app). The interactive picking hub is retired; the sidebar owns
// navigation, so this page is a calm overview of what the library holds.
export default async function DesignIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <main className="mx-auto w-full max-w-3xl px-6 pt-6 pb-20">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Partyreel V1 · design lab
        </p>
        <h1 data-dir-display className="mt-2 text-4xl tracking-tight text-balance">
          The design lab
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Two things live here. A live design-system reference, and a space to
          prototype UI: polished explorations built before integrating into the
          data-heavy app, to save time and try several directions per piece.
          Browse the whole library from the sidebar.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <LandingCard
            href={withDesignKey("/design/system", key)}
            icon={<Palette className="size-4" />}
            title="System reference"
            blurb="The locked monochrome system: type, color policy, components, and live motion, in both modes."
          />
          <LandingCard
            href={withDesignKey("/design/demo", key)}
            icon={<Sparkles className="size-4" />}
            title="Cohesive demo"
            blurb="Shipped pieces composed on one screen set, the way they read together."
          />
        </div>

        <h2 className="mt-10 text-sm font-semibold">Prototype catalog</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Explorations grouped by surface in the sidebar. Each records the
          variant that shipped and why.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SURFACES.map((s) => {
            const count = TOUCHPOINTS.filter((t) => t.surface === s.key).length;
            return (
              <div
                key={s.key}
                data-dir-card
                className="rounded-xl p-4"
              >
                <p className="flex items-baseline gap-2 text-sm font-medium">
                  {s.label}
                  <span className="font-mono text-xs text-muted-foreground">
                    {count}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {s.blurb}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          Internal lab. Not linked anywhere, not indexed, and absent from
          production without the key.
        </p>
      </main>
    </ModeShell>
  );
}

function LandingCard({
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
      data-dir-card
      className="group flex flex-col gap-3 rounded-xl p-5 transition-colors hover:border-foreground/30"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
        {icon}
      </span>
      <span>
        <span className="flex items-center gap-2 font-medium">
          {title}
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </span>
      </span>
    </Link>
  );
}
