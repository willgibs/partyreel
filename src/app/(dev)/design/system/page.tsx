import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireDesignKey, withDesignKey } from "../gate";
import { ModeShell } from "../mode-shell";
import { DashboardScreen } from "../screens/dashboard-screen";
import { EntryModalScreen } from "../screens/entry-modal-screen";
import { GalleryScreen } from "../screens/gallery-screen";
import { MarketingHeroScreen } from "../screens/marketing-hero-screen";
import { SpecimenScreen } from "../screens/specimen-screen";

// THE LOCKED SYSTEM, as a standing reference: monochrome in both modes +
// base Instrument Serif (0.60 calibration, hairline-stroke display weight).
// This page replaced the type-option slate when the round-4 verdict landed;
// it is the canvas every touchpoint decision renders against.
export default async function SystemReferencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);

  return (
    <div>
      <nav className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href={withDesignKey("/design", key)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Lab index
          </Link>
        </div>
      </nav>

      <ModeShell fontClass="font-opt-instrument">
        <header className="mx-auto w-full max-w-5xl px-4 pt-4 pb-4">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            The locked system
          </p>
          <h1
            data-dir-display
            className="mt-1 text-3xl tracking-tight text-balance"
          >
            Monochrome, set in Instrument Serif
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Both modes, zero accent, media as the only color. Type is base
            Instrument Serif, size-calibrated and stroke-weighted; sizing gets
            a final tune once built into the real UI if needed.
          </p>
        </header>

        <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-20">
          <Section title="Guest entry" note="The make-or-break first moment">
            <EntryModalScreen />
          </Section>
          <Section title="Live gallery" note="The event page plus the lightbox">
            <GalleryScreen />
          </Section>
          <Section title="Host dashboard" note="The daily-driver surface">
            <DashboardScreen />
          </Section>
          <Section title="Marketing hero" note="The identity at full volume">
            <MarketingHeroScreen />
          </Section>
          <Section
            title="System specimen"
            note="Type, color policy, components, live motion"
          >
            <SpecimenScreen typeLabel="Instrument Serif" />
          </Section>
        </div>
      </ModeShell>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-8">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}
