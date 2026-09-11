import Link from "next/link";
import { CircleAlert, Compass, ImageUp } from "lucide-react";

import { AnonymousInfo } from "@/components/shared/anonymous-info";
import { Container } from "@/components/shared/container";
import { Kbd } from "@/components/shared/kbd";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Logo } from "@/components/shared/logo";
import { CornerPlayBadge } from "@/components/shared/masonry";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { PlayBadge } from "@/components/shared/play-badge";
import { Button } from "@/components/ui/button";

import { marketingImage } from "@/lib/constants/marketing-media";
import { requireDesignKey } from "@/lib/design-gate/server";
import {
  ActionTooltipDemo,
  FloatingAddDemo,
  SetNameStepDemo,
} from "../reference/interactive-demos";
import { RefHeader, RefSection, Row, Spec } from "../reference/reference-ui";

// THE LIVE PATTERNS REFERENCE. The composed shared/* pieces, rendered from the
// real components. Two render as STATIC where a live mount has a side effect:
// RouteError fires Sentry on mount (mocked here), and SetNameStep's submit hits
// a server action (rendered `inert`, preview only).
export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · live"
        title="Patterns"
        blurb="The composed shared pieces, rendered from the real components. The dead-end and form patterns that mount side effects are shown as a static or inert preview, noted on each."
      />

      <RefSection title="Brand">
        <Spec label="Logo" hint="shared/logo · the one brand splash">
          <div className="flex flex-col gap-3">
            <Logo />
            <Logo markOnly />
          </div>
        </Spec>
      </RefSection>

      <RefSection
        title="Media affordances"
        blurb="The video markers, overlaid on a poster (the nearest positioned ancestor)."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Play badge" hint="shared/play-badge · md / lg">
            <Row>
              <Poster>
                <PlayBadge />
              </Poster>
              <Poster>
                <PlayBadge size="lg" />
              </Poster>
            </Row>
          </Spec>
          <Spec label="Corner play badge" hint="masonry · tile marker">
            <Poster>
              <CornerPlayBadge />
            </Poster>
          </Spec>
        </div>
      </RefSection>

      <RefSection title="Empty states">
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Icon" hint="variant=icon">
            <EmptyState
              icon={ImageUp}
              title="No photos yet"
              description="Guests add photos and videos in seconds."
            />
          </Spec>
          <Spec label="Quiet" hint="variant=quiet">
            <EmptyState
              variant="quiet"
              title="Nothing here yet"
              description="The typographic treatment, no icon chip."
            />
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="Dead ends"
        blurb="The not-found hero (server, CSS-only stagger) and the error boundary (shown static; the real one reports to Sentry on mount)."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Not found" hint="shared/not-found-screen">
            <div className="flex justify-center">
              <NotFoundScreen
                icon={Compass}
                eyebrow="404"
                title="Event not found"
                description="This link may have expired or the event was removed."
                actions={
                  <Button asChild size="sm">
                    <Link href="#">Back home</Link>
                  </Button>
                }
              />
            </div>
          </Spec>
          <Spec label="Route error" hint="static preview">
            <RouteErrorMock />
          </Spec>
        </div>
      </RefSection>

      <RefSection title="Forms and info">
        <div className="grid gap-3 sm:grid-cols-2">
          <SetNameStepDemo />
          <Spec
            label="Anonymous info"
            hint="shared/anonymous-info · tap to open"
          >
            <Row>
              <span className="flex items-center gap-1.5 text-sm">
                Anonymous
                <AnonymousInfo />
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                Host view
                <AnonymousInfo viewerIsHost />
              </span>
            </Row>
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="App chrome atoms"
        blurb="The small shared pieces every app surface is built from."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec
            label="PageHeading"
            hint="shared/page-heading · the app's one h1 source"
          >
            <PageHeading>Dashboard</PageHeading>
          </Spec>
          <Spec label="Kbd" hint="shared/kbd">
            <Row className="text-sm text-muted-foreground">
              <Kbd>&#8593;</Kbd>
              <Kbd>&#8595;</Kbd>
              Navigate
              <Kbd>Esc</Kbd>
              Close
            </Row>
          </Spec>
          <Spec
            label="Container"
            hint="shared/container · max-w-7xl gutter"
            contentClassName="p-0"
          >
            <Container className="border-x border-dashed border-border py-4 text-center text-xs text-muted-foreground">
              max-w-7xl, px-4 / sm:px-6 / lg:px-8
            </Container>
          </Spec>
          <Spec
            label="LegalConsentLine"
            hint="shared/legal-consent-line · newTab"
          >
            <LegalConsentLine newTab />
          </Spec>
          <ActionTooltipDemo />
          <FloatingAddDemo />
        </div>
      </RefSection>
    </main>
  );
}

/** A small media poster so the play affordances have a positioned ancestor. */
function Poster({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative size-24 overflow-hidden rounded-lg bg-gallery">
      {/* eslint-disable-next-line @next/next/no-img-element -- a local manifest asset */}
      <img
        src={marketingImage("concert-confetti").src}
        alt=""
        className="size-full object-cover opacity-90"
      />
      {children}
    </div>
  );
}

// A STATIC mirror of shared/route-error.tsx. The real component fires
// captureError(Sentry) in a mount effect, so we never render it live; this shows
// the same chrome (no reset, no reporting).
function RouteErrorMock() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CircleAlert className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="font-heading text-2xl text-balance">
          Something went wrong
        </h3>
        <p className="text-sm text-pretty text-muted-foreground">
          That&apos;s on us, not you. Try again, and if it keeps happening, let
          us know.
        </p>
      </div>
      <div className="flex gap-3">
        <Button size="sm">Try again</Button>
        <Button size="sm" variant="outline">
          Back home
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/70">
        Error code: <span className="font-mono">a1b2c3</span>
      </p>
    </div>
  );
}
