import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { requireDesignKey } from "@/lib/design-gate/server";
import { ModeShell } from "../../mode-shell";
import { GlowDoctrineVariants } from "../../sandbox/glow-doctrine-variants";
import { GlowMomentsVariants } from "../../sandbox/glow-moments-variants";
import { HomeHeroBoard } from "../../sandbox/home-hero/board";
import { MarketingDecompositionVariants } from "../../sandbox/marketing-decomposition-variants";
import { MarketingHeroSubstrateVariants } from "../../sandbox/marketing-hero-substrate-variants";
import { getRuling, type SandboxId, SURFACE_LABEL } from "../../touchpoints";

// The standing boards. A ruling gets a component here only while its board
// stands in sandbox/ (touchpoints.ts sets `board` on the same ids); when the
// ruling lands, both go and docs/decisions/design-record.md keeps the history.
const VARIANTS: Record<SandboxId, React.ComponentType> = {
  "marketing-decomposition": MarketingDecompositionVariants,
  "marketing-hero-substrate": MarketingHeroSubstrateVariants,
  "home-hero": HomeHeroBoard,
  "glow-doctrine": GlowDoctrineVariants,
  "glow-moments": GlowMomentsVariants,
};

// One open question, its explorations side by side on the locked system. The
// header is the catalog record: the ruling so far in one line and the pointer to
// the long record. The sidebar (lab-nav.tsx) owns navigation between boards.
export default async function TouchpointPage({
  params,
  searchParams,
}: {
  params: Promise<{ touchpoint: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { touchpoint: slug } = await params;
  const ruling = getRuling(slug);
  const board = ruling?.board;
  const Variants =
    ruling && board ? VARIANTS[ruling.id as SandboxId] : undefined;
  if (!ruling || !board || !Variants) notFound();

  // Marketing boards render inside the production marketing skin so the
  // [data-mkt-*] grammar (marketing.css, loaded by the lab layout) reaches them
  // with the real tokens; the app-surface boards keep the bare mono shell.
  const skin = ruling.surface === "marketing" ? { "data-mkt": "" } : {};

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <header className="mx-auto w-full max-w-5xl px-4 pt-4 pb-2">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {SURFACE_LABEL[ruling.surface]} · Sandbox
        </p>
        <h1
          data-dir-display
          className="mt-1 text-3xl tracking-tight text-balance"
        >
          {ruling.title}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {board.note}.
        </p>
        <div className="mt-3.5">
          {ruling.shipped ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                <Check className="size-3" />
                Shipped
              </span>
              <span className="text-sm font-medium">{ruling.shipped}</span>
            </div>
          ) : (
            <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Exploring
            </span>
          )}
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ruling.why}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Ruled {ruling.ruled} · the record: docs/decisions/design-record.md#
            {ruling.id}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 pb-20" {...skin}>
        <Variants />
      </div>
    </ModeShell>
  );
}
