import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DIRECTIONS, getDirection } from "../directions";
import { requireDesignKey, withDesignKey } from "../gate";
import { DashboardScreen } from "../screens/dashboard-screen";
import { EntryModalScreen } from "../screens/entry-modal-screen";
import { GalleryScreen } from "../screens/gallery-screen";
import { MarketingHeroScreen } from "../screens/marketing-hero-screen";
import { SpecimenScreen } from "../screens/specimen-screen";

// One direction, all five screens, inside its `.dir-*` token scope. The switcher
// bar stays OUTSIDE the scope so navigation chrome never tints the judgment.
export default async function DirectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ direction: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { direction: slug } = await params;
  const direction = getDirection(slug);
  if (!direction) notFound();

  return (
    <div>
      <nav className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href={withDesignKey("/design", key)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Directions
          </Link>
          <span className="ml-auto flex items-center gap-1">
            {DIRECTIONS.map((d) => (
              <Link
                key={d.id}
                href={withDesignKey(`/design/${d.id}`, key)}
                aria-current={d.id === direction.id ? "page" : undefined}
                className={`flex size-7 items-center justify-center rounded-md font-mono text-xs font-semibold transition-colors ${
                  d.id === direction.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.letter}
              </Link>
            ))}
          </span>
        </div>
      </nav>

      <div
        data-dir-root
        className={`${direction.wrapperClass} bg-background text-foreground`}
      >
        <header className="mx-auto w-full max-w-5xl px-4 pt-10 pb-4">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Direction {direction.letter}
          </p>
          <h1
            data-dir-display
            className="mt-1 text-3xl tracking-tight text-balance"
          >
            {direction.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {direction.tagline}
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
            <SpecimenScreen direction={direction} />
          </Section>
        </div>
      </div>
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
