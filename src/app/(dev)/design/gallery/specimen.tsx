"use client";

import { useState } from "react";
import { Check, Columns2, Copy } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { SpecimenSkin } from "./entry";

/**
 * THE SPECIMEN FRAME: what every library specimen sits in, and the gallery's
 * one delight.
 *
 * Named `Specimen` since the Library x Lab round (2026-09-15); it was `Stage`,
 * which is the LAB KIT's word for a board's 1:1 canvas
 * (components/dev/board/stage.tsx). Two frames called Stage in one app was one
 * too many, and the library's word for the thing it frames is specimen.
 *
 * Three things live in its header, in the order a reader needs them: what the
 * specimen is (the label and its hint), how to read it (Preview or Code, when
 * the source collector could lift its JSX), and the split.
 *
 * THE SPLIT: a design system is judged in two themes, and the lab has always
 * made you toggle the whole page to see the second one, which loses the first.
 * The split button renders the SAME specimen twice, side by side, in both: the
 * left pane forces the light palette with `.surface-paper` (globals.css's
 * sanctioned subtree-scoped light block, which also switches `dark:` variants
 * off through the `:not(.surface-paper *)` guard) and the right pane turns
 * `.dark` on for its subtree. They are SIBLINGS: never nest one inside the
 * other, which is the standing rule in globals.css.
 *
 * The one honest limit: a component that reads the theme in JavaScript rather
 * than in CSS (next-themes' useTheme, so the Toaster and anything that picks an
 * asset by theme) renders the PAGE's theme in both panes. Everything token-
 * driven, which is nearly all of it, is true in both.
 */
export function Specimen({
  label,
  hint,
  bleed,
  skin = "lab",
  contentClassName,
  sticks,
  code,
  children,
}: {
  label?: string;
  hint?: string;
  bleed?: boolean;
  skin?: SpecimenSkin;
  contentClassName?: string;
  /** What sticks inside sticks to the page, not to this frame (`SpecimenDef.sticks`). */
  sticks?: boolean;
  /** The specimen's JSX, from specimen-code.ts; omit it and there are no tabs. */
  code?: string;
  children: React.ReactNode;
}) {
  const [split, setSplit] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const showing = code ? tab : "preview";

  const well = cn(
    bleed ? "p-0" : "p-5",
    skin === "gallery" && "bg-gallery text-gallery-foreground",
    contentClassName,
  );
  const inner =
    skin === "marketing" ? <div data-mkt="">{children}</div> : children;

  const preview = split ? (
    <div className="grid sm:grid-cols-2">
      <ThemePane tone="light" className={well}>
        {inner}
      </ThemePane>
      <ThemePane tone="dark" className={well}>
        {inner}
      </ThemePane>
    </div>
  ) : (
    <div className={well}>{inner}</div>
  );

  const head = (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border py-1.5 pr-3 pl-4">
      <p className="min-w-0 text-[13px] font-medium">
        {label}
        {!label && hint && <span className="sr-only">Specimen</span>}
      </p>
      {/* ★ THE CAPTION SHRINKS TO THE HEAD, NEVER PAST IT. A hint can run to a paragraph (the album
          stream's are 1,089 and 1,607px on one line), and this span used to be `shrink-0`, so it
          stood at its whole width and pushed the split button (and its screen-reader label) out past
          the specimen's clip: the page scrolled sideways at 1440. `min-w-0` lets it shrink and the
          caption's `truncate` finish it with an ellipsis, its whole text on the title. */}
      <span className="flex max-w-full min-w-0 items-center gap-2">
        {hint && showing === "preview" && (
          <span
            title={hint}
            className="max-w-[24ch] min-w-0 truncate text-[11px] text-muted-foreground sm:max-w-none"
          >
            {hint}
          </span>
        )}
        {/* The real Tabs primitive, not a look-alike: the library is the one
            place a component should be USED rather than only shown, and it
            carries the roving focus and the aria wiring for free. */}
        {code && (
          <TabsList variant="line">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        )}
        {showing === "code" && code ? (
          <CopyIconButton text={code} />
        ) : (
          <button
            type="button"
            onClick={() => setSplit((s) => !s)}
            aria-pressed={split}
            title={split ? "One theme" : "Light and dark, side by side"}
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-[color,opacity,transform] duration-150 ease-emphasis active:scale-90",
              split
                ? "text-foreground"
                : "text-muted-foreground/60 group-hover/specimen:text-muted-foreground hover:text-foreground",
            )}
          >
            <Columns2 className="size-3.5" />
            <span className="sr-only">
              {split ? "Show one theme" : "Show light and dark side by side"}
            </span>
          </button>
        )}
      </span>
    </div>
  );

  return (
    // `relative`: the specimen is the containing block of its own `sr-only` labels (absolutely
    // positioned), so its `overflow-hidden` clips them; without it they sit wherever the header's
    // line ended and widen the whole document.
    //
    // ★ A SPECIMEN THAT STICKS CLIPS WITH `clip`, NEVER `hidden` (`sticks`): `hidden` makes this frame a scroll
    // container that never scrolls, so a `position: sticky` inside it sticks to nothing and rides away with the page,
    // where `clip` clips the same box and the same corners and is no scroll container, so the band sticks to the
    // window as it does in the app. An inline style, because no utility can say it here: the lab's own utilities sit in
    // a sub-layer that production's root `overflow-hidden` outranks (measured: the class stayed `hidden`), and design.css
    // notes the build's CSS pipeline drops a bare `clip`. A browser that does not know `clip` ignores it and keeps the
    // class's `hidden`. `min-w-0` goes with it: a scroll container's automatic minimum width is 0 and a clip's is its
    // content's, so without it a wide specimen would stretch this frame (a grid item) past its column and the page with
    // it.
    <div
      className={cn(
        "group/specimen relative overflow-hidden rounded-xl border border-border bg-card",
        sticks && "min-w-0",
      )}
      style={sticks ? { overflow: "clip" } : undefined}
    >
      {code ? (
        <Tabs
          value={showing}
          onValueChange={(v) => setTab(v === "code" ? "code" : "preview")}
          className="gap-0"
        >
          {head}
          <TabsContent value="preview">{preview}</TabsContent>
          <TabsContent value="code">
            <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed">
              <code className="font-sans">{code}</code>
            </pre>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {head}
          {preview}
        </>
      )}
    </div>
  );
}

/** One half of the split: its own palette, its own ground, its own label. */
function ThemePane({
  tone,
  className,
  children,
}: {
  tone: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative bg-background text-foreground",
        tone === "light" ? "surface-paper" : "dark",
        tone === "dark" && "border-t border-border sm:border-t-0 sm:border-l",
      )}
    >
      <span className="pointer-events-none absolute top-1 right-2 text-[10px] tracking-wider text-muted-foreground/70 uppercase">
        {tone}
      </span>
      <div className={className}>{children}</div>
    </div>
  );
}

/** The Code tab's copy: the same icon swap the props line uses. */
function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="relative flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    >
      <Copy
        className={cn(
          "absolute size-3.5 transition-[opacity,transform] duration-150 ease-emphasis",
          copied ? "scale-75 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <Check
        className={cn(
          "absolute size-3.5 text-foreground transition-[opacity,transform] duration-150 ease-emphasis",
          copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      />
      <span className="sr-only">{copied ? "Copied" : "Copy the source"}</span>
    </button>
  );
}

/** The props line under a config panel: one tap to take it into a file. */
export function CopyLine({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="group/copy flex w-full items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-left transition-colors hover:border-foreground/25"
    >
      <code className="min-w-0 flex-1 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-muted-foreground group-hover/copy:text-foreground">
        {code}
      </code>
      <span className="relative mt-0.5 size-3.5 shrink-0 text-muted-foreground">
        <Copy
          className={cn(
            "absolute inset-0 size-3.5 transition-[opacity,transform] duration-150 ease-emphasis",
            copied ? "scale-75 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Check
          className={cn(
            "absolute inset-0 size-3.5 text-foreground transition-[opacity,transform] duration-150 ease-emphasis",
            copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        />
      </span>
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
