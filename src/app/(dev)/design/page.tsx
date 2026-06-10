import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DIRECTIONS } from "./directions";
import { requireDesignKey, withDesignKey } from "./gate";

// The exploration index: a neutral shell (deliberately unstyled by any
// direction) linking the three identity hypotheses. Gated; see gate.ts.
export default async function DesignIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Partyreel V1
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
        Identity exploration
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Three complete visual hypotheses, each rendered as the same five
        screens: guest entry, live gallery, host dashboard, marketing hero, and
        a system specimen with live motion. Judge them on your phone, in the
        light you would really see them in.
      </p>

      <ul className="mt-10 space-y-4">
        {DIRECTIONS.map((dir) => (
          <li key={dir.id}>
            <Link
              href={withDesignKey(`/design/${dir.id}`, key)}
              className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm font-semibold">
                {dir.letter}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {dir.name}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {dir.tagline}
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
