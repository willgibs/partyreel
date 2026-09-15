"use client";

import {
  LabLink,
  useNav,
} from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { Tag } from "@/app/(dev)/design/(shell)/_shell/tag";

/**
 * THE TOOLS, FROM THE NAV (the Library x Lab round, 2026-09-15). The tools and
 * their one-line notes are declared once, in `_data/nav.ts`, and the sidebar
 * reads them from there. This index reads the same list through the shell's
 * context rather than keeping a second copy, so adding a tool to the nav adds
 * it here, in the same order, with the same words.
 *
 * A client component for exactly that reason: the nav is already handed to the
 * chrome as props, and importing the server builder here would be the second
 * source this avoids.
 */
export function ToolsIndex() {
  const nav = useNav();
  const tools =
    nav.find((a) => a.id === "lab")?.sections.find((s) => s.id === "tools")
      ?.items ?? [];

  if (tools.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        No tools are registered in the lab&rsquo;s navigation.
      </p>
    );
  }

  return (
    <ul data-dir-stagger className="grid gap-2 sm:grid-cols-2">
      {tools.map((t, i) => (
        <li key={t.href} style={{ "--i": i } as React.CSSProperties}>
          <LabLink
            href={t.href}
            data-dir-press
            className="flex h-full flex-col rounded-xl border border-border bg-card px-4 py-3 transition-colors duration-150 hover:bg-muted/40"
          >
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium">{t.label}</span>
              {t.badge && <Tag badge={t.badge} />}
            </span>
            {t.note && (
              <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t.note}
              </span>
            )}
          </LabLink>
        </li>
      ))}
    </ul>
  );
}
