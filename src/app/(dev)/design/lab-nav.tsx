"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FlaskConical, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { withDesignKey } from "./links";
import { type Surface, TOUCHPOINTS } from "./touchpoints";
import { useResolvedMode } from "./use-design-mode";

/**
 * THE LAB SIDEBAR (lab refresh, 2026-06-19). One persistent rail replacing the
 * old index-hub + per-page pill nav, sized for the growing library: the design
 * reference, then the prototype catalog grouped by product surface, then the
 * demo + diagnostics. Adding an exploration to a surface is a single entry in
 * touchpoints.ts - it appears here automatically.
 *
 * It reads the key from the URL (useSearchParams - layouts can't see
 * searchParams, so a CLIENT rail is the only place to thread it through every
 * /design link) and themes itself off the SAME design-mode store the canvas
 * uses, so chrome + content flip light/dark together. Desktop: a sticky left
 * rail. Mobile: a top bar + a collapsible panel (the lab is reviewed on phone).
 */

const SURFACES: { key: Surface; label: string }[] = [
  { key: "guest", label: "Guest" },
  { key: "host", label: "Host" },
  { key: "marketing", label: "Marketing" },
  { key: "shared", label: "Shared" },
];

export function LabNav() {
  const pathname = usePathname();
  const key = useSearchParams().get("key");
  const mode = useResolvedMode();
  const [open, setOpen] = useState(false);

  const to = (href: string) => withDesignKey(href, key);
  const active = (href: string) =>
    href === "/design" ? pathname === "/design" : pathname === href;
  const close = () => setOpen(false);

  const item = (href: string, label: string, shipped?: number) => (
    <li key={href}>
      <Link
        href={to(href)}
        onClick={close}
        aria-current={active(href) ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
          active(href)
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {shipped !== undefined && (
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/80">
            V{shipped}
          </span>
        )}
      </Link>
    </li>
  );

  return (
    <div
      data-dir-root
      data-mode={mode}
      className="mono bg-background text-foreground lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-border"
    >
      {/* Mobile bar: title + the collapse toggle. */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <Link
          href={to("/design")}
          onClick={close}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <FlaskConical className="size-4" />
          Design lab
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <nav
        aria-label="Design lab"
        className={cn(
          "px-2 pb-12 lg:block lg:h-full lg:overflow-y-auto",
          open ? "block" : "hidden",
        )}
      >
        {/* Desktop header (the mobile bar already shows the title). */}
        <div className="hidden px-3 pt-5 pb-3 lg:block">
          <Link
            href={to("/design")}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <FlaskConical className="size-4" />
            Design lab
          </Link>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Live design reference + UI prototyping
          </p>
        </div>

        <Group label="Design system">
          {item("/design/system", "System reference")}
        </Group>

        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          Prototypes
        </p>
        {SURFACES.map(({ key: surface, label }) => {
          const touchpoints = TOUCHPOINTS.filter((t) => t.surface === surface);
          if (touchpoints.length === 0) return null;
          return (
            <Group key={surface} label={label} sub>
              {touchpoints.map((t) =>
                item(`/design/c/${t.id}`, t.title, t.decision),
              )}
            </Group>
          );
        })}

        <Group label="Demo">{item("/design/demo", "Cohesive demo")}</Group>

        <Group label="Diagnostics">
          {item("/design/stream-probe", "Stream probe")}
          {item("/design/boom", "Error boundary")}
        </Group>
      </nav>
    </div>
  );
}

/** A labeled nav section. `sub` = a surface group under the Prototypes eyebrow. */
function Group({
  label,
  sub = false,
  children,
}: {
  label: string;
  sub?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("pb-2", sub ? "pt-1" : "pt-3")}>
      <p
        className={cn(
          "px-3 pb-1",
          sub
            ? "text-[11px] font-medium text-muted-foreground"
            : "text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase",
        )}
      >
        {label}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}
