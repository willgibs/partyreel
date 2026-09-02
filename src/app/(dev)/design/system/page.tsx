import { requireDesignKey } from "@/lib/design-gate/server";
import { ModeShell } from "../mode-shell";
import { DashboardScreen } from "../screens/dashboard-screen";
import { EntryModalScreen } from "../screens/entry-modal-screen";
import { GalleryScreen } from "../screens/gallery-screen";
import { MarketingHeroScreen } from "../screens/marketing-hero-screen";
import { SpecimenScreen } from "../screens/specimen-screen";

// THE LOCKED SYSTEM, as a standing reference: monochrome in both modes, the
// identity face set in Urbanist (bold at -3% tracking, matching the shipped
// app since 2026-06-19). The canvas every touchpoint exploration renders
// against; kept in sync so the live reference never lies.
export default async function SystemReferencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
        <header className="mx-auto w-full max-w-5xl px-4 pt-4 pb-4">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            The locked system
          </p>
          <h1
            data-dir-display
            className="mt-1 text-3xl tracking-tight text-balance"
          >
            Monochrome, set in Urbanist
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Both modes, zero accent, media as the only color. The identity face
            is Urbanist, bold at minus three percent tracking, matching the
            shipped app; functional headings stay Inter.
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
            <SpecimenScreen typeLabel="Urbanist" />
          </Section>
        </div>
      </ModeShell>
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
