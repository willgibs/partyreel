"use client";

import { Info, Lightbulb } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * THE HELP VOCABULARY, HAND-COPIED. `Callout`, `Steps`/`Step`, `Path` and
 * `UiLabel` live in `spec-shared.tsx`, which this board may not import: that
 * file's `H2`/`H3` read `slugify` from `help.ts`, which reaches `node:fs`
 * through `collection.ts`, and a client board dragging that in is the exact
 * boundary rule the manifest names. These are faithful copies of the same
 * JSX (never edited from here — a real fix belongs in `spec-shared.tsx` at
 * integration), so a fixture body reads exactly like a shipped article.
 * `Checklist`/`Check` need no copy: `help/checklist.tsx` is already fs-free
 * and is imported directly from there.
 */

/** A press inside a preview is looking, not leaving (the contact-page and
 *  loose-ends precedent: `onClickCapture` on the option's own root). */
export function stopLinks(e: MouseEvent) {
  if ((e.target as HTMLElement).closest?.("a[href]")) e.preventDefault();
}

type CalloutType = "info" | "tip" | "warning";

const CALLOUT: Record<CalloutType, { Icon: typeof Info; box: string; icon: string }> = {
  info: { Icon: Info, box: "border-border bg-muted/40", icon: "text-muted-foreground" },
  tip: { Icon: Lightbulb, box: "border-brand/30 bg-brand/5", icon: "text-brand" },
  warning: { Icon: Info, box: "border-destructive/30 bg-destructive/5", icon: "text-destructive" },
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const { Icon, box, icon } = CALLOUT[type];
  return (
    <div className={cn("my-6 flex gap-3.5 rounded-xl border p-4", box)}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card">
        <Icon className={cn("size-4", icon)} aria-hidden />
      </span>
      <div className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children}
      </div>
    </div>
  );
}

function toText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return toText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function Path({ children }: { children: ReactNode }) {
  const segments = toText(children)
    .split("›")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <ol
      aria-label="Where to find it"
      className="not-prose my-4 flex flex-wrap items-center gap-1.5 text-sm"
    >
      {segments.map((segment, i) => (
        <li key={`${segment}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden className="text-muted-foreground">›</span>}
          <span className="rounded-md border bg-card px-2 py-1 font-medium text-foreground">
            {segment}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function UiLabel({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border bg-muted px-1.5 py-0.5 text-[0.85em] font-medium whitespace-nowrap text-foreground">
      {children}
    </span>
  );
}

type StepProps = { index?: number; title: string; children?: ReactNode; screen?: ReactNode };

export function Step({ index = 1, title, children, screen }: StepProps) {
  return (
    <li className="group relative flex gap-4 pb-7 last:pb-0">
      <span
        aria-hidden
        className="absolute top-8 bottom-0 left-[13px] w-px bg-border group-last:hidden"
      />
      <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card text-[11px] text-muted-foreground tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5 sm:flex-row sm:items-start sm:gap-5">
        <div className="min-w-0 flex-1 text-sm leading-6">
          <p className="font-medium text-foreground">{title}</p>
          {children && (
            <div className="mt-1 text-muted-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0">
              {children}
            </div>
          )}
        </div>
        {screen && <div className="shrink-0 sm:w-32">{screen}</div>}
      </div>
    </li>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <ol className="not-prose my-6 flex flex-col">
      {items.map((child, i) =>
        isValidElement<StepProps>(child)
          ? cloneElement(child as ReactElement<StepProps>, { index: i + 1 })
          : child,
      )}
    </ol>
  );
}
