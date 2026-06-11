import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FONT_OPTIONS } from "./fonts";
import { requireDesignKey, withDesignKey } from "./gate";
import { TOUCHPOINTS } from "./touchpoints";

// The exploration index, round 3: the identity is settled (monochrome, both
// modes); the open questions are the typeface (Instrument Serif is the
// working favorite, now size-calibrated) and the component shapes at the
// major UX touchpoints. A neutral shell, deliberately unstyled by the mono
// sheet. Gated; see gate.ts.
export default async function DesignIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Partyreel V1 · round 3
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
        Components and a sharper type slate
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Monochrome is locked, light and dark as one system. Two open questions:
        which components fit the major touchpoints (set in Instrument Serif,
        the working favorite, now size-calibrated to Inter&rsquo;s apparent
        size), and the typeface itself (a new serif slate around Instrument;
        the round-2 faces that didn&rsquo;t land are gone).
      </p>

      <h2 className="mt-10 text-sm font-semibold">
        Component touchpoints
        <span className="ml-2 font-normal text-muted-foreground">
          2-3 variants each · pick a number per touchpoint
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
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-sm font-semibold">
        Type options
        <span className="ml-2 font-normal text-muted-foreground">
          all size-calibrated · full five-screen pages
        </span>
      </h2>
      <ul className="mt-3 space-y-2">
        {FONT_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <Link
              href={withDesignKey(`/design/${opt.id}`, key)}
              className="group flex items-start gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold">
                {opt.letter}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {opt.name}
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
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
