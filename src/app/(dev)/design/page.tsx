import Link from "next/link";
import { ArrowRight, Check, Palette } from "lucide-react";

import { requireDesignKey, withDesignKey } from "./gate";
import { TOUCHPOINTS } from "./touchpoints";

// THE DESIGN LAB INDEX - the standing internal system for prototyping,
// comparison, and selection between Will and the agent. The system (mono +
// Instrument Serif) is locked; each touchpoint below is either decided
// (badge) or open for review. Decisions are recorded in touchpoints.ts, so
// this page is always the current truth of what's chosen.
export default async function DesignIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const decided = TOUCHPOINTS.filter((t) => t.decision !== undefined).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Partyreel V1 · design lab
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
        UI selection
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The system is locked: monochrome in both modes, base Instrument Serif.
        What remains is choosing the components. Review each touchpoint below
        (both modes, ideally on a phone), pick a variant number, add remix
        notes; picks get recorded here and become the build spec.
      </p>

      <Link
        href={withDesignKey("/design/system", key)}
        className="group mt-8 flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Palette className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-medium">
            The locked system
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Monochrome + Instrument Serif: the five reference screens and the
            live specimen every decision renders against.
          </span>
        </span>
      </Link>

      <h2 className="mt-10 text-sm font-semibold">
        Touchpoints
        <span className="ml-2 font-normal text-muted-foreground">
          {decided} of {TOUCHPOINTS.length} decided
        </span>
      </h2>
      <ul className="mt-3 space-y-2">
        {TOUCHPOINTS.map((t) => (
          <li key={t.id}>
            <Link
              href={withDesignKey(`/design/c/${t.id}`, key)}
              className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {t.title}
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t.note}
                </span>
              </span>
              {t.decision !== undefined ? (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">
                  <Check className="size-3" />V{t.decision}
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  Open
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-muted-foreground">
        Internal lab. Not linked anywhere, not indexed, and absent from
        production without the key.
      </p>
    </main>
  );
}
