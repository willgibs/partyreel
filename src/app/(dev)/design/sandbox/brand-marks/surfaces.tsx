"use client";

import type { ReactNode } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { EventCard } from "@/components/app/event-card";
import { UserMenu } from "@/components/app/user-menu";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { AppShell } from "@/components/shared/app-shell";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";

import type { ScreenId } from "./knobs";

/**
 * PRODUCTION'S OWN SURFACES, COMPOSED AS PRODUCTION COMPOSES THEM: the
 * marketing site's head in the room (the cinema wrapper, its header, the
 * hero's first lines), the sign-in page on paper (`login/page.tsx`: the
 * wordmark over the card, the photographs beside it), the site's foot on its
 * slab (`MarketingFooter`) and the host's app in either ground (`AppShell`
 * with her menu, her events). The pages themselves are server pages, so their
 * markup is retyped here from the files, class for class; every component in
 * them is production's own, and each option reaches them only through the
 * frame's paste.
 */

const STILLS = MARKETING_IMAGES.map((m) => m.src);

/** The cinema wrapper every dark marketing page wears (`(cinema)/layout.tsx`). */
export function Cinema({ children }: { children: ReactNode }) {
  return (
    <div
      className="dark flex min-h-screen flex-col overflow-x-clip bg-background text-foreground"
      data-mkt
      data-mkt-skin="cinema"
    >
      {children}
    </div>
  );
}

/** The site's first screen in the room: the header over the hero's words and a row of photographs. */
export function SiteHead({ screen }: { screen: ScreenId }) {
  const desk = screen === "1440";
  return (
    <Cinema>
      <div data-bm-where="the wordmark in the site's bar">
        <MarketingHeader skin="cinema" />
      </div>
      <section className="flex flex-col items-center px-5 pt-14 text-center sm:pt-20">
        <h1 className="max-w-4xl font-heading text-hero text-balance">
          {SITE_THESIS}
        </h1>
        <p className="mt-5 max-w-xl text-copy text-pretty text-muted-foreground">
          {SITE_SUBHEAD}
        </p>
        <div
          className="mt-12 grid w-full gap-[var(--gap-gallery)]"
          style={{
            gridTemplateColumns: `repeat(${desk ? 6 : 3}, minmax(0, 1fr))`,
            maxWidth: desk ? 1180 : undefined,
          }}
        >
          {STILLS.slice(0, desk ? 6 : 3).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- a fixed still in a lab frame
            <img
              key={src}
              src={src}
              alt=""
              className="aspect-[4/5] w-full rounded-[var(--radius-tile)] object-cover"
            />
          ))}
        </div>
      </section>
    </Cinema>
  );
}

/** The sign-in page on paper: the wordmark over the card, the photographs beside it at a desk. */
export function SignIn({ screen }: { screen: ScreenId }) {
  const desk = screen === "1440";
  return (
    <div className="surface-paper flex min-h-screen bg-background text-foreground">
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2">
        {!desk ? (
          <div className="grid grid-cols-3 gap-1 p-1">
            {STILLS.slice(0, 3).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element -- a fixed still in a lab frame
              <img
                key={src}
                src={src}
                alt=""
                className="aspect-[4/3] w-full rounded-[var(--radius-tile)] object-cover"
              />
            ))}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:py-16">
          <div className="w-full max-w-sm">
            <div
              className="mb-8 flex justify-center"
              data-bm-where="the wordmark over the sign-in card"
            >
              <Logo />
            </div>
            <Card>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>
          </div>
        </div>
        {desk ? (
          <div className="grid h-screen grid-cols-3 content-start gap-2 overflow-hidden p-2">
            {[...STILLS, ...STILLS].slice(0, 15).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- a fixed still in a lab frame
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                className="aspect-[3/2] w-full rounded-[var(--radius-tile)] object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The site's foot on its slab, under the end of a paper chapter. */
export function SiteFoot() {
  return (
    <Cinema>
      <section
        data-mkt
        className="surface-paper border-y bg-background px-5 py-16 text-center text-foreground"
      >
        <p className="font-heading text-section">
          Start free, upgrade when it fills.
        </p>
      </section>
      <div data-bm-where="the wordmark on the foot's slab">
        <MarketingFooter />
      </div>
    </Cinema>
  );
}

const EVENTS = [
  { name: "Maya & Jay", date: "Sat, Sep 12", cover: 0, items: "1,284 items" },
  { name: "Lena turns 30", date: "Fri, Oct 2", cover: 2, items: "312 items" },
  { name: "Ines & Tom", date: "Sat, Oct 17", cover: 9, items: "86 items" },
] as const;

/** The host's app in a ground: her bar with its wordmark, her events. */
export function AppHome({
  ground,
  screen,
}: {
  ground: "room" | "paper";
  screen: ScreenId;
}) {
  return (
    <div
      className={`${ground === "room" ? "dark" : "surface-paper"} min-h-screen bg-background text-foreground`}
    >
      <div
        data-bm-where={`the wordmark in the app's bar ${ground === "room" ? "in the room" : "on paper"}`}
      >
        <AppShell
          headerActions={
            <UserMenu
              email="maya@example.com"
              displayName="Maya Lin"
              avatarUrl={null}
              seed="maya-lin"
            />
          }
        >
          <PageHeading>Your events</PageHeading>
          <ul
            className="mt-6 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${screen === "1440" ? 3 : 1}, minmax(0, 1fr))`,
            }}
          >
            {EVENTS.map((e) => (
              <li key={e.name}>
                <EventCard
                  href={null}
                  name={e.name}
                  coverUrl={STILLS[e.cover]}
                  dateLabel={e.date}
                  itemsLabel={e.items}
                />
              </li>
            ))}
          </ul>
        </AppShell>
      </div>
    </div>
  );
}
