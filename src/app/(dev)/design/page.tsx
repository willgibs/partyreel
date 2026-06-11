import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FONT_OPTIONS } from "./fonts";
import { requireDesignKey, withDesignKey } from "./gate";

// The exploration index, round 2: the identity is settled (monochrome, both
// modes); TYPE is the variable. A neutral shell (deliberately unstyled by the
// mono sheet) linking the candidate display faces. Gated; see gate.ts.
export default async function DesignIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Partyreel V1 · round 2
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
        Monochrome, set in six voices
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The identity is settled: pure monochrome, light and dark as one system
        (following the device, light when unknown). Each option below swaps
        ONLY the display face on that locked system, across the same five
        screens. Use the light/dark toggle on any page; your choice carries
        across options.
      </p>

      <ul className="mt-10 space-y-3">
        {FONT_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <Link
              href={withDesignKey(`/design/${opt.id}`, key)}
              className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm font-semibold">
                {opt.letter}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {opt.name}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {opt.blurb}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-muted-foreground">
        Internal exploration. Not linked anywhere, not indexed, and absent from
        production without the key.
      </p>
    </main>
  );
}
