"use client";

import { Bell, Check, PartyPopper } from "lucide-react";

import {
  AlbumFrame,
  GalleryFrame,
  PhoneFrame,
  PhoneShell,
  QrFrame,
} from "@/components/marketing/frames";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import type { Mode } from "@/components/dev/board";

import { STATE_HUES } from "./ramps";

/**
 * THE BRAND CALL SITES, grouped by the JOB the accent would be doing.
 *
 * The finding this grouping carries: `--brand` is asked to do three unrelated
 * jobs today, and one hue may not be right for all three. IDENTITY is the mark
 * and the 404 eyebrow (is this Partyreel). ATTENTION is the badge, the wizard
 * pip, the carousel dot, the chosen QR preset (look here, you are here). MEDIA
 * STAND-IN is the frames family, where the accent is standing in for a
 * photograph that has not been taken yet.
 *
 * Every specimen reads `--brand` / `--brand-foreground` and nothing else, which
 * is what makes the accent a two-line change rather than a sweep (theme.css:35).
 * The frames are the real production components; the small marks are copied
 * verbatim from their call sites so the sizes are honest.
 */

function Cell({
  label,
  where,
  children,
  className,
}: {
  label: string;
  where: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex min-h-16 items-center">{children}</div>
      <div>
        <p className="text-[11px] font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{where}</p>
      </div>
    </div>
  );
}

function Job({
  n,
  name,
  question,
  children,
}: {
  n: string;
  name: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {n}
        </span>
        <h3 className="text-sm font-semibold">{name}</h3>
        <p className="text-[11px] text-muted-foreground">{question}</p>
      </div>
      {children}
    </section>
  );
}

export function AccentWall({ mode }: { mode: Mode }) {
  const desktop = mode === "desktop";
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        desktop ? "gap-8 px-16 py-12" : "gap-6 px-5 py-8",
      )}
    >
      <Job
        n="01"
        name="Identity"
        question="Is a coloured mark more us than an ink one?"
      >
        <div
          className={cn(
            "flex items-end",
            desktop ? "gap-12" : "flex-wrap gap-6",
          )}
        >
          <Cell label="The logo mark" where="shared/logo.tsx:35">
            <Logo />
          </Cell>
          <Cell label="Mark alone" where="markOnly">
            <Logo markOnly />
          </Cell>
          <Cell label="The 404 eyebrow" where="shared/not-found-screen.tsx:53">
            <div className="space-y-1">
              <span className="text-sm font-medium text-brand">
                That page has left the party
              </span>
              <p className="text-xs text-muted-foreground">
                Try the album, or start your own.
              </p>
            </div>
          </Cell>
        </div>
      </Job>

      <Job
        n="02"
        name="Attention"
        question="Look here, you are here. The job rule 1 now gives the accent."
      >
        <div
          className={cn(
            "flex items-end",
            desktop ? "gap-12" : "flex-wrap gap-6",
          )}
        >
          <Cell label="The unread badge" where="app/notification-bell.tsx:60">
            <span className="relative inline-flex">
              <Bell className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
                3
              </span>
            </span>
          </Cell>
          <Cell label="The unread dot" where="notification-bell.tsx:85">
            <div className="space-y-2">
              {[true, false].map((unread, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      unread ? "bg-brand" : "bg-transparent",
                    )}
                  />
                  <span className="text-xs">
                    {unread ? "Nine photos arrived" : "You approved four"}
                  </span>
                </div>
              ))}
            </div>
          </Cell>
          <Cell label="The wizard step" where="app/create-event-wizard.tsx:141">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
                    i === 1
                      ? "bg-brand text-brand-foreground"
                      : i < 1
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </Cell>
          <Cell label="The carousel dot" where="app/welcome-flow.tsx:98">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    i === 1 ? "bg-brand" : i < 1 ? "bg-foreground" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </Cell>
          <Cell label="The chosen preset" where="app/qr-preset-picker.tsx:53">
            <div className="flex gap-2">
              {[true, false].map((selected, i) => (
                <span
                  key={i}
                  className={cn(
                    "relative flex size-14 flex-col items-center justify-center rounded-lg border-2 p-3",
                    selected ? "border-brand" : "border-border",
                  )}
                >
                  <span className="size-6 rounded-sm bg-foreground/80" />
                  {selected ? (
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-brand p-0.5 text-brand-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </Cell>
          <Cell label="The success row" where="create-event-wizard.tsx:282">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <PartyPopper className="size-4 text-brand" />
              Your code is live
            </div>
          </Cell>
        </div>
      </Job>

      <Job
        n="03"
        name="A stand-in for media"
        question="Roughly half the brand call sites are drawings of photographs that do not exist yet."
      >
        <div
          className={cn(
            "flex items-start",
            desktop ? "gap-10" : "flex-wrap gap-6",
          )}
        >
          <div className="w-[190px] shrink-0">
            <PhoneShell>
              <PhoneFrame />
            </PhoneShell>
            <p className="mt-2 text-[11px] text-muted-foreground">
              frames/phone-frame.tsx:56 to 79
            </p>
          </div>
          {desktop ? (
            <>
              <div className="w-[300px] shrink-0">
                <GalleryFrame />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  frames/gallery-frame.tsx:29 to 39
                </p>
              </div>
              <div className="w-[260px] shrink-0">
                <AlbumFrame />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  frames/album-frame.tsx:36
                </p>
              </div>
              <div className="w-[180px] shrink-0">
                <QrFrame />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  frames/qr-frame.tsx:34
                </p>
              </div>
            </>
          ) : (
            <div className="w-[180px] shrink-0">
              <QrFrame />
              <p className="mt-2 text-[11px] text-muted-foreground">
                frames/qr-frame.tsx:34
              </p>
            </div>
          )}
        </div>
      </Job>

      <section className="space-y-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold">Beside the state hues</h3>
          <p className="text-[11px] text-muted-foreground">
            The accent must never be mistaken for one of these at a 6px dot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5">
            <span className="size-3 rounded-full bg-brand" />
            <span className="text-[11px] font-medium">accent</span>
          </div>
          {STATE_HUES.map((s) => (
            <div key={s.token} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-full"
                style={{ background: `var(${s.token})` }}
              />
              <span className="text-[11px] text-muted-foreground">
                {s.name} <span className="tabular-nums">{s.hue}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
