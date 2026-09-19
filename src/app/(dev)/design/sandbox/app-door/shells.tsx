"use client";

import type { ReactNode } from "react";

import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Logo } from "@/components/shared/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { WALL } from "./fixtures";

/**
 * THE GROUND EVERY DOOR ON THIS BOARD STANDS ON.
 *
 * ★ WHAT IS SHIPPED AND WHAT IS QUOTED. The wordmark (`Logo`), the card
 * (`Card`), the consent line (`LegalConsentLine`), every field, every button
 * and both gate bodies are imported and wrapped, never edited. Two things are
 * quoted from their shipped source with their classNames copied, and each one
 * is a landmine rather than a preference:
 *
 *  1. `(auth)/login/page.tsx` is a SERVER component that calls
 *     `supabase.auth.getUser()` before it renders a pixel. Rendering it inside
 *     a frame would be a network call from a preview, and it would answer as
 *     whoever the author is signed in as. Its column, its wordmark, its card
 *     and its two strings are reproduced below; nothing it carries a rule for
 *     is re-decided here.
 *  2. `entry-shell.tsx` is a real Vaul drawer and `DialogContent` a real Radix
 *     dialog, and both portal to `document.body` — inside a frame, the BOARD's
 *     body. The surface would leave the picture entirely. Material and position
 *     live in app-door.css; everything inside one is the shipped component.
 *
 * ★ AND EVERY PREVIEW IS A STILL (see `Still`). This board draws the real
 * auth components, which means a real `signInWithOtp` is one press away from a
 * reviewer's finger. Nothing on this board is allowed to reach the network.
 */

/* ── the screens ─────────────────────────────────────────────────────────── */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;

/** Board state arrives as strings; anything unknown is the laptop. */
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

/* ── the still ───────────────────────────────────────────────────────────── */

/**
 * ★ A PREVIEW IS A STILL, AND THAT IS A SAFETY RULE, NOT A STYLE ONE.
 *
 * The doors below are the SHIPPED components: `LoginForm`, `EmailSignIn` and
 * `EnterEventPrompt` all hold live handlers, so a reviewer pressing "Email me
 * a code" on a review board would send a real Supabase email to whatever is in
 * the field, and pressing Google would navigate the frame to accounts.google.com.
 * Capturing the click before it reaches React's handler is the one way to keep
 * the real components and still promise that no preview touches the network.
 *
 * Submits and Enter are caught too: a form inside a frame would otherwise
 * navigate the frame's document.
 */
export function Still({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      onSubmitCapture={(e) => e.preventDefault()}
      onKeyDownCapture={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      onClickCapture={(e) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest("button, a, [role='button']")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}

/* ── the photographic ground ─────────────────────────────────────────────── */

/**
 * The product's own photographs, as an album would lay them: CSS columns on
 * the gallery's gap and tile corner (app-door.css), so the wall beside a door
 * is a picture of the thing the door leads to rather than a mood board.
 *
 * Plain `<img>` on purpose: `GuestMasonry` drags `LikeButton` and the lightbox
 * with it and both resolve a session on mount (fixtures.ts).
 */
export function PhotoWall({
  columns,
  className,
}: {
  columns: number;
  className?: string;
}) {
  // Round-robin down independent columns, three times the roll, so every
  // column runs past the bottom of the box whatever height it is given and
  // the wall's own overflow does the cropping.
  const deck = [...WALL, ...WALL, ...WALL];
  return (
    <div data-ad-wall className={cn("ad-wall", className)}>
      {Array.from({ length: columns }, (_, c) => (
        <div key={c} className="ad-wall-col">
          {deck
            .filter((_, i) => i % columns === c)
            .map((p, i) => (
              <div key={`${p.src}-${i}`} style={{ aspectRatio: p.ratio }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" className="size-full" loading="eager" />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

/* ── the overlay shells ──────────────────────────────────────────────────── */

/** The dimmed page behind an open surface: entry-shell.tsx's own overlay. */
export function Scrim() {
  return <div className="ad-scrim" aria-hidden />;
}

/**
 * The guest entry shell, quoted: a drawer at the foot of a phone, a centred
 * dialog from 640 up. `useMediaQuery` reads the LAB PAGE's width rather than
 * the frame's, so which shell a width gets is set by the frame's own screen.
 */
export function Sheet({
  screen,
  handle,
  children,
}: {
  screen: ScreenId;
  /** The drag handle draws only where dragging actually dismisses. */
  handle?: boolean;
  children: ReactNode;
}) {
  if (screen === "1440") return <div className="ad-dialog">{children}</div>;
  return (
    <div className="ad-sheet">
      {handle && <div className="ad-handle" aria-hidden />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/* ── the login page, in three shapes ─────────────────────────────────────── */

export type PageShape = "card" | "beside" | "sheet";

export const pageOf = (v: string | undefined): PageShape =>
  v === "beside" ? "beside" : v === "sheet" ? "sheet" : "card";

/** The two strings the shipped page puts above the form. */
export const DOOR_TITLE = "Welcome to Partyreel";
export const DOOR_LINE =
  "Sign in to create events and collect photos from your guests. No app, no fuss.";

/**
 * THE DOOR'S OWN CARD, quoted from `(auth)/login/page.tsx`: a 384px column at
 * py-16 with the wordmark above it, the card's centred header on the
 * `subsection` step, and the consent line under the card.
 *
 * `title` and `line` are props because the returning-host door changes both
 * and nothing else, which is the cleanest way to show that it changes nothing
 * else.
 */
export function DoorCard({
  title = DOOR_TITLE,
  line = DOOR_LINE,
  banner,
  children,
  consent = true,
}: {
  title?: ReactNode;
  line?: ReactNode;
  /** A failure or an explanation, above the form, inside the card. */
  banner?: ReactNode;
  children: ReactNode;
  consent?: boolean;
}) {
  return (
    <div data-ad-door className="w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-subsection">{title}</CardTitle>
          <CardDescription>{line}</CardDescription>
        </CardHeader>
        <CardContent>
          {banner}
          {children}
        </CardContent>
      </Card>
      {consent && <LegalConsentLine className="mt-6 text-center" />}
    </div>
  );
}

/**
 * THE SAME DOOR WITHOUT ITS CARD, for the sheet shape.
 *
 * ★ THE DOOR'S CONTENT DOES NOT MOVE WITH THE PAGE. The first capture of the
 * sheet option was a form floating with no title on it at all, which made the
 * page question secretly a question about what the door says. The title, the
 * line and the consent line are the card's, on a surface that is already the
 * sheet, so the only thing the option changes is the screen around them.
 */
export function DoorSheetBody({
  title = DOOR_TITLE,
  line = DOOR_LINE,
  children,
}: {
  title?: ReactNode;
  line?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-ad-door className="flex flex-col gap-4 pt-1">
      <div className="flex flex-col gap-1.5 text-center">
        <p className="font-heading text-subsection text-balance">{title}</p>
        <p className="text-sm text-muted-foreground">{line}</p>
      </div>
      {children}
      <LegalConsentLine newTab className="text-center" />
    </div>
  );
}

/**
 * THE PAGE, IN ONE OF THREE SHAPES. The body it is handed is the same door in
 * all three, so the only thing this decides is what the screen around it is.
 *
 * `card`   — the shipped page: a centred 384px column on empty paper.
 * `beside` — the product on one side. At a laptop the wall takes the right
 *            half and the door keeps the left; in a hand the wall becomes a
 *            band above the door, because a phone has no second half.
 * `sheet`  — the guest gate's own language: the wall IS the page, and the door
 *            rises over it as the sheet a guest already learned.
 */
export function DoorPage({
  shape,
  screen,
  children,
}: {
  shape: PageShape;
  screen: ScreenId;
  children: ReactNode;
}) {
  const phone = screen === "375";

  if (shape === "card")
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
        {children}
      </div>
    );

  if (shape === "beside")
    return (
      <div
        className={cn(
          "min-h-screen bg-background",
          phone ? "flex flex-col" : "grid grid-cols-2",
        )}
      >
        {phone ? (
          <>
            {/* A band, not a half: a phone's screen is the door's, and the
                photographs are there to say what is behind it. */}
            <div className="relative h-40 shrink-0">
              <PhotoWall columns={3} />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
              {children}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center px-4 py-16">
              {children}
            </div>
            <div className="relative">
              <PhotoWall columns={3} className="p-2" />
            </div>
          </>
        )}
      </div>
    );

  // `sheet`: the album is the page and the door stands over it.
  return (
    <div className="relative h-screen bg-background">
      <PhotoWall columns={phone ? 2 : 5} className="p-2" />
      <Scrim />
      <Sheet screen={screen}>{children}</Sheet>
    </div>
  );
}
