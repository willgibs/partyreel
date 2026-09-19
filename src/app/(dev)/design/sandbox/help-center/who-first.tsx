"use client";

import { PageHero } from "@/components/marketing/system/page-hero";
import { HelpPaletteProvider, HelpSearchTrigger } from "@/components/marketing/help/help-palette";

import { CATEGORY_CHIPS, QUICK_LINKS, SEARCH_INDEX } from "./fixtures";
import { stopLinks } from "./vocab";

/**
 * DECISION 1: WHO FIRST. Who the hub's hero greets, drawn on the hero alone
 * (the emblem strip and index sheet are the `hub` decision, staged after
 * this one, so this preview stops at the search trigger and one nudge line).
 *
 * `context` is the one shape whose picture is not the same at both widths on
 * purpose: it renders the LAPTOP frame host-voiced and the PHONE frame
 * guest-voiced, because the option itself is "the device implies the
 * audience" — the two frames stacked by `Widths` are the option's whole
 * argument, not two views of one answer.
 */
export type WhoFirstShape = "host" | "split" | "context";

function Nudge({ toGuest }: { toGuest: boolean }) {
  return (
    <p className="mt-5 text-center text-sm text-muted-foreground">
      {toGuest ? (
        <>
          Just scanned a QR code?{" "}
          <a href="#" className="font-medium text-foreground underline decoration-border underline-offset-4">
            Start with the guest guides
          </a>
        </>
      ) : (
        <>
          Hosting an event instead?{" "}
          <a href="#" className="font-medium text-foreground underline decoration-border underline-offset-4">
            Start with getting started
          </a>
        </>
      )}
    </p>
  );
}

function Doors() {
  return (
    <div className="mt-2 grid w-full max-w-lg grid-cols-2 gap-3">
      {(
        [
          { label: "I'm hosting", sub: "Set up, share, and curate" },
          { label: "I just scanned a code", sub: "Join, upload, and browse" },
        ] as const
      ).map((door) => (
        <a
          key={door.label}
          href="#"
          className="surface-paper flex flex-col gap-1 rounded-2xl border bg-card p-5 text-left ring-1 ring-foreground/5 transition-colors duration-150 hover:border-foreground/25"
        >
          <span className="font-medium text-foreground">{door.label}</span>
          <span className="text-sm text-muted-foreground">{door.sub}</span>
        </a>
      ))}
    </div>
  );
}

/**
 * The one badge `context` wears, on BOTH frames: which signal picked this
 * copy. Without it the review tooling (and a reviewer glancing at only the
 * larger, laptop frame) sees `host` and `context` as the same picture, since
 * the two share that exact frame on purpose — the badge is what makes the
 * MECHANISM legible from either frame alone, not only from the phone one.
 */
function DeviceTag({ mode }: { mode: "desktop" | "phone" }) {
  return (
    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
      {mode === "desktop" ? "This screen is a laptop, so: host-voiced" : "This screen is a phone, so: guest-voiced"}
    </span>
  );
}

/** Exported so `hub.tsx` (staged after this decision) draws the SAME hero
 *  wearing whichever answer the board carries, per `defineExploration`'s
 *  staging rule: a later decision's picture lives in the earlier one's world. */
export function Hero({ shape, mode }: { shape: WhoFirstShape; mode: "desktop" | "phone" }) {
  const guestVoiced = shape === "context" && mode === "phone";
  const heading = shape === "split" ? "What do you need help with?" : guestVoiced ? "Just scanned a code?" : "How can we help?";
  const subhead =
    shape === "split"
      ? "One door for hosting, one for the party you just joined."
      : guestVoiced
        ? "Find your host's event, or add your own photos. No app, no account needed."
        : "Guides for hosts and guests: setup, sharing, privacy, plans, and the highlight reel.";
  return (
    <PageHero
      entrance="rise"
      scale="lg"
      eyebrow="Help center"
      heading={heading}
      subhead={subhead}
      className="pt-14 pb-16 text-center sm:pt-16"
    >
      <div className="mt-6 flex w-full flex-col items-center gap-2">
        {shape === "context" && <DeviceTag mode={mode} />}
        {shape === "split" ? (
          <Doors />
        ) : (
          <HelpSearchTrigger variant="hero" className="mx-auto" />
        )}
        {shape !== "split" && <Nudge toGuest={!guestVoiced} />}
      </div>
    </PageHero>
  );
}

export function WhoFirstPreview({ shape, mode }: { shape: WhoFirstShape; mode: "desktop" | "phone" }) {
  return (
    <div onClickCapture={stopLinks} className="bg-background text-foreground">
      <HelpPaletteProvider
        index={SEARCH_INDEX}
        quickLinks={QUICK_LINKS}
        categories={CATEGORY_CHIPS}
      >
        <Hero shape={shape} mode={mode} />
      </HelpPaletteProvider>
    </div>
  );
}
