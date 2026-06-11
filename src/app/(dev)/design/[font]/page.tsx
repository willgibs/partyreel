import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FONT_OPTIONS, getFontOption } from "../fonts";
import { requireDesignKey, withDesignKey } from "../gate";
import { ModeShell } from "../mode-shell";
import { DashboardScreen } from "../screens/dashboard-screen";
import { EntryModalScreen } from "../screens/entry-modal-screen";
import { GalleryScreen } from "../screens/gallery-screen";
import { MarketingHeroScreen } from "../screens/marketing-hero-screen";
import { SpecimenScreen } from "../screens/specimen-screen";

// One type option, all five screens, on the locked mono system. The switcher
// bar stays OUTSIDE the mono scope so navigation chrome never tints the
// judgment; the light/dark toggle lives INSIDE (it is part of the system now).
export default async function FontOptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ font: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { font: slug } = await params;
  const option = getFontOption(slug);
  if (!option) notFound();

  return (
    <div>
      <nav className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href={withDesignKey("/design", key)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Type options
          </Link>
          <span className="ml-auto flex items-center gap-1">
            {FONT_OPTIONS.map((f) => (
              <Link
                key={f.id}
                href={withDesignKey(`/design/${f.id}`, key)}
                aria-current={f.id === option.id ? "page" : undefined}
                className={`flex size-7 items-center justify-center rounded-md font-mono text-xs font-semibold transition-colors ${
                  f.id === option.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.letter}
              </Link>
            ))}
          </span>
        </div>
      </nav>

      <ModeShell fontClass={option.wrapperClass}>
        <header className="mx-auto w-full max-w-5xl px-4 pt-4 pb-4">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Monochrome · type option {option.letter}
          </p>
          <h1
            data-dir-display
            className="mt-1 text-3xl tracking-tight text-balance"
          >
            {option.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {option.blurb}
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
            <SpecimenScreen typeLabel={option.name} />
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
