"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";
import type { Control } from "@/components/lab/board-spec";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { PRIYA } from "./fixtures";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN, AND THE TWO GROUNDS UNDER IT.
 *
 * ★ PHONE FIRST, 1440 ON THE KNOB (`guest-capture`'s own framing, carried
 * here): this board answers questions on both sides of the product (the
 * account page's own chrome; the public profile's guest chrome), and every
 * one of them is met on a phone first, a laptop second.
 *
 * ★ NOTHING HERE MAY REACH A SESSION, A SERVER FUNCTION OR THE NETWORK ON
 * MOUNT. `AppShell`, `GuestHeader` and every account-menu, sheet or dropdown
 * they draw resolve a real Supabase session or portal out of this document the
 * instant they mount, which inside a lab frame means "whoever is signed in on
 * THIS machine", not Priya. So every header below is QUOTED (the pattern
 * `guest-capture` and `profile-page` already established) and every floating
 * control this board needs (a sheet, an open menu) is drawn already open, as
 * plain markup, never the real Radix primitive: a Portal escapes to the LAB
 * PAGE's document when it opens inside a portalled frame, not the screen being
 * judged.
 */

export const SCREENS = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/* ── the frame ──────────────────────────────────────────────────────────────
   `Fit` and `Measured` are the kit's (`@/components/lab`); only `Scene` stays
   here, since a board's directory is deleted whole at its ruling. ─────────── */

export function Scene({
  id,
  screen,
  title,
  caption,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  /** A static caption. Omit and pass `measure` for a number read off the frame. */
  caption?: string;
  measure?: (root: HTMLElement, win: Window) => string | null;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  const body = measure ? (
    <Measured probe={measure} deps={[screen, id]} onMeasure={setMeasured}>
      {children}
    </Measured>
  ) : (
    children
  );
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measure ? measured : caption}
      >
        {body}
      </Frame>
    </Fit>
  );
}

/* ── the two grounds: the app's own chrome, and the guest's ─────────────────── */

/**
 * THE APP HEADER, QUOTED. `setup`, `attended` and `prompt`'s `claim`/`account`
 * options all stand on the signed-in side of the product (the dashboard, the
 * account page), where the real chrome is `AppShell`: a full sidebar this
 * board has no question about. What every one of its options actually needs
 * is the thin fact that Priya is signed in, so this is that fact alone, at the
 * weight the desk's other app-side boards (`host-curation`) already draw it.
 */
export function AppHeader({ label }: { label: string }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </span>
      <Avatar size="sm" seed={PRIYA.seed}>
        <AvatarFallback className="text-[10px]">
          {PRIYA.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

/**
 * THE GUEST HEADER, QUOTED. Two states really matter to `page`'s options: a
 * STRANGER meeting Priya's page for the first time (the ask's own premise,
 * "what an empty page says to a visitor") and PRIYA HERSELF, signed in, for
 * the one scene that needs her own view of it. The markup is the shape
 * `guest-header.tsx` really draws; only the session read is gone.
 */
export function GuestHeader({ as }: { as: "visitor" | "priya" }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      {as === "visitor" ? (
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Start for free
        </Button>
      ) : (
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">
            {PRIYA.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </header>
  );
}
