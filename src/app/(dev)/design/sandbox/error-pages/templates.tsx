"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { CircleAlert, Lock, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { stopLinks } from "./chrome";

/**
 * THE VOCABULARY EVERY DECISION DRAWS FROM.
 *
 * ★ WHAT IS REUSED AND WHAT IS RECREATED, AND WHY. `NotFoundScreen` (imported
 * directly in board.tsx, never here) carries no Sentry call and is already the
 * shared shape three surfaces draw today, so it is reused verbatim wherever a
 * preview needs it. `RouteError`, `MarketingRouteError` and `GlobalError` each
 * call `captureError` UNCONDITIONALLY on mount, so none of the three is
 * imported anywhere on this board: `CrashToday` and `GlobalCrashToday` below
 * are their JSX, reproduced with the reporting effect removed. Nothing in
 * this file imports `@sentry/nextjs` or `captureError` — grep confirms it, and
 * the Handoff repeats the grep.
 */

const noop = () => {};

/* ── the code, decision 4's own vocabulary (reused by `ways-out` too) ────── */

export type CodeShape = "today" | "always" | "silent";

/** The digest line every render-crash boundary carries today, or its `always`
 *  (Copy, and a line saying what it is for) or `silent` (nothing) shape. */
export function DigestLine({
  digest,
  shape,
}: {
  digest: string;
  shape: CodeShape;
}) {
  if (shape === "silent") return null;
  if (shape === "today")
    return (
      <p className="text-xs text-faint">
        Error code:{" "}
        <span className="rounded bg-muted px-1.5 py-0.5 text-foreground/80 tabular-nums select-all">
          {digest}
        </span>
      </p>
    );
  return (
    <div className="flex flex-col items-center gap-1.5 text-xs text-faint">
      <p>This helps us find what happened if you tell us about it.</p>
      <button
        type="button"
        // A real clipboard write of the fabricated digest, guarded: an
        // iframe with no `allow="clipboard-write"` may refuse it, and a
        // refusal must never surface as a thrown preview.
        onClick={() => {
          navigator.clipboard?.writeText(digest).catch(() => {});
        }}
        className="flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-foreground/80 transition-colors duration-150 hover:bg-muted/70"
      >
        <span className="tabular-nums select-all">{digest}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase">
          Copy
        </span>
      </button>
    </div>
  );
}

/* ── the ways out, decision 2's own vocabulary ───────────────────────────── */

/** The quiet line to help or contact, worded for the surface it sits on. */
export function HelpLine({
  href = "/help",
  children = "Visit the help center",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      Still stuck?{" "}
      <Link
        href={href}
        className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
      >
        {children}
      </Link>
      .
    </p>
  );
}

/** A small corner label naming which component built a tile (the grammar
 *  decision's own legibility device: two pixel-identical tiles otherwise look
 *  like the same option twice, per help-center's `DeviceTag` precedent). */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="absolute top-3 right-4 z-10 rounded-full border bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
      {children}
    </span>
  );
}

/* ── the crash, RouteError's JSX minus the reporting effect ──────────────── */

export function CrashToday({
  error,
  icon: Icon = CircleAlert,
  title = "Something went wrong",
  description = "That's on us, not you. Try again, and if it keeps happening, let us know.",
  secondary = { href: "/", label: "Back home" },
  footnote,
  tag,
}: {
  error: Error & { digest?: string };
  icon?: LucideIcon;
  title?: string;
  description?: string;
  secondary?: { href: string; label: string };
  footnote?: ReactNode;
  tag?: string;
}) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
      {tag && <Tag>{tag}</Tag>}
      <div
        data-not-found
        className="flex w-full max-w-md flex-col items-center gap-5 text-center"
      >
        <div
          style={{ "--nf-i": 0 } as CSSProperties}
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <div
          style={{ "--nf-i": 1 } as CSSProperties}
          className="flex flex-col gap-3"
        >
          <h1 className="font-heading text-page text-balance">{title}</h1>
          <p className="text-pretty text-muted-foreground">{description}</p>
        </div>
        <div
          style={{ "--nf-i": 2 } as CSSProperties}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Button size="cta" onClick={noop}>
            Try again
          </Button>
          <Button asChild size="cta" variant="outline">
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        </div>
        {(error.digest || footnote) && (
          <div
            style={{ "--nf-i": 3 } as CSSProperties}
            className="flex flex-col items-center gap-3"
          >
            {footnote}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── the global crash, GlobalError's JSX minus the reporting effect ──────── */

export type GlobalCrashShape = "today" | "home" | "plain";

/**
 * ★ NO TAILWIND, NO TOKENS, ON PURPOSE. GlobalError replaces the ROOT layout,
 * so globals.css may not have loaded; its shipped JSX is inline styles and the
 * system font stack, and this reproduces exactly that rather than reaching
 * for a class that would not exist on the real screen.
 */
export function GlobalCrashToday({
  shape,
  digest,
}: {
  shape: GlobalCrashShape;
  digest: string;
}) {
  return (
    <div
      onClickCapture={stopLinks}
      style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fcfcfc",
        color: "#1a1a1a",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "28rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 12px" }}>
          Something went wrong
        </h1>
        <p style={{ margin: "0 0 24px", color: "#555", lineHeight: 1.5 }}>
          {shape === "plain"
            ? "That's on us, not you. If reloading does not help, the code below tells us exactly what happened."
            : "That's on us, not you. Reloading usually fixes it."}
        </p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={noop}
            style={{
              font: "inherit",
              fontWeight: 500,
              background: "#1a1a1a",
              color: "#fcfcfc",
              border: 0,
              borderRadius: "16px",
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {shape === "home" && (
            <Link
              href="/"
              style={{
                font: "inherit",
                fontWeight: 500,
                background: "transparent",
                color: "#1a1a1a",
                border: "1px solid #d4d4d4",
                borderRadius: "16px",
                padding: "10px 24px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Back home
            </Link>
          )}
        </div>
        {shape === "plain" && (
          <p style={{ marginTop: "24px", fontSize: "0.8rem", color: "#555" }}>
            Still stuck? Email{" "}
            <a href="mailto:hello@partyreel.com" style={{ color: "#1a1a1a" }}>
              hello@partyreel.com
            </a>{" "}
            with the code below.
          </p>
        )}
        <p style={{ marginTop: "24px", fontSize: "0.75rem", color: "#999" }}>
          Error code: {digest}
        </p>
      </div>
    </div>
  );
}

/* ── the private lock, the guest page's own inline stack, quoted ─────────── */

export function PrivateLockToday() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-20 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" />
      </div>
      <h1 className="font-heading text-page">This event is private</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The host has this event set to private. Check back later, or ask them
        to make it public.
      </p>
    </div>
  );
}
