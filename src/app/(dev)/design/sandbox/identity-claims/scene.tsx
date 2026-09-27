"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE FRAME EVERY DECISION DRAWS IN, AND WHAT IT SAYS UNDER ITSELF.
 *
 * ★ NOTHING HERE MAY MOUNT A RADIX PORTAL OR REACH A SESSION (the landmine
 * `guest-capture/scene.tsx` and `host-curation` both name). A Sheet, Dialog or
 * DropdownMenu would portal to the LAB PAGE's own document from inside a frame,
 * and the shipped `ClaimsCard` fires a real server action on Finish, so every
 * sheet, dialog and toast on this board is QUOTED markup on `fixed`
 * positioning (the frame IS the viewport) with local state, the shipped
 * classes and copy verbatim where production already says them.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED (docs/PROGRAM.md,
 * "Measure every tile before it ships"): `measure` probes the frame's own
 * document through the `data-ic-*` hooks the pieces carry, so what the words
 * under a phone claim is what the phone shows, even after a press inside it.
 */
export function Scene({
  id,
  screen,
  title,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  measure: (root: HTMLElement) => string | null;
  children: ReactNode;
}) {
  const { w, h } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${SCREENS[screen].name}`}
        caption={measured}
      >
        <Measured
          probe={measure}
          deps={[screen, id]}
          onMeasure={setMeasured}
          className="min-h-full"
        >
          <Remeasure probe={measure} onMeasure={setMeasured}>
            {children}
          </Remeasure>
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * ★ AND AGAIN AFTER EVERY PRESS. The kit's `Measured` reads on mount, on a
 * resize and on its timers, but a Claim that swaps the card on top resizes
 * nothing, so its caption would go on describing the frame as it opened. This
 * watches the frame's own document for changes (the observer is the FRAME's
 * window's, as `Measured`'s is) and reads once the press has settled.
 */
function Remeasure({
  probe,
  onMeasure,
  children,
}: {
  probe: (root: HTMLElement) => string | null;
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const read = useRef({ probe, onMeasure });
  useEffect(() => {
    read.current = { probe, onMeasure };
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    const root = el?.parentElement;
    if (!el || !win || !root) return;
    let timer = 0;
    const observer = new win.MutationObserver(() => {
      win.clearTimeout(timer);
      timer = win.setTimeout(() => {
        const said = read.current.probe(root);
        if (said) read.current.onMeasure(said);
      }, 120);
    });
    observer.observe(el, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      win.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className="min-h-full">
      {children}
    </div>
  );
}

/** Two frames of one option, one above the other, so the option stays one
 *  phone wide on the step beside the others. */
export function Pair({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

/* ── the measuring: one reader, told which facts a frame is about ─────────── */

export type Fact =
  | "sheet"
  | "top"
  | "rows"
  | "follow"
  | "dialog"
  | "end"
  | "banner"
  | "toast"
  | "events"
  | "invite"
  | "pointer";

const text = (el: Element | null | undefined) =>
  (el?.textContent ?? "").replace(/\s+/g, " ").trim();

/** Quoted inside a caption that ends in its own full stop. */
const quote = (el: Element | null | undefined) =>
  `"${text(el).replace(/\.$/, "")}"`;

/**
 * A caption built from what the frame shows, one clause per fact asked for.
 * Null (not settled) until the ground itself has rendered, so the first
 * unstyled layout never overwrites "measuring" with a sentence about nothing.
 */
export function measureOf(...facts: Fact[]) {
  return (root: HTMLElement): string | null => {
    if (!root.querySelector("[data-ic-ground]")) return null;
    const said: string[] = [];
    // The progress label says "3 of 4" and carries the card's own name.
    const topEl = root.querySelector("[data-ic-top]");
    const top = topEl
      ? `${text(topEl)}, ${topEl.getAttribute("data-ic-top")}`
      : null;
    for (const fact of facts) {
      if (fact === "sheet") {
        said.push(
          root.querySelector("[data-ic-sheet]")
            ? `the review is open${top ? ` at ${top}` : ""}`
            : "the review is closed",
        );
      }
      if (fact === "top" && top) said.push(`${top} on top`);
      if (fact === "rows") {
        const rows = [...root.querySelectorAll("[data-ic-row]")].map(
          (row) =>
            `${row.getAttribute("data-name")} reads ${quote(row.querySelector("[data-ic-status]"))}`,
        );
        if (rows.length) said.push(rows.join(", "));
      }
      if (fact === "follow") {
        const rows = [
          ...root.querySelectorAll("[data-ic-row][data-state='claimed']"),
        ].map((row) => {
          const offers = [...row.querySelectorAll("[data-ic-offer]")].map((o) =>
            o.getAttribute("data-ic-offer"),
          );
          return `${row.getAttribute("data-name")} offers ${offers.length ? offers.join(" and ") : "nothing"}`;
        });
        said.push(rows.length ? rows.join("; ") : "no claimed event yet");
      }
      if (fact === "dialog") {
        const d = root.querySelector("[data-ic-dialog]");
        said.push(d ? `a dialog asks ${quote(d)}` : "no dialog");
      }
      if (fact === "end") {
        const e = root.querySelector("[data-ic-end]");
        if (e) said.push(`the review reads ${quote(e)}`);
      }
      if (fact === "banner") {
        const words = root.querySelector("[data-ic-banner-words]");
        said.push(
          words ? `the banner reads ${quote(words)}` : "no banner on the page",
        );
      }
      if (fact === "toast") {
        const t = root.querySelector("[data-ic-toast]");
        said.push(t ? `the toast reads ${quote(t)}` : "no toast");
      }
      if (fact === "events") {
        const n = root.querySelectorAll("[data-ic-card]").length;
        said.push(`Your events holds ${n} card${n === 1 ? "" : "s"}`);
      }
      if (fact === "invite") {
        const i = root.querySelector("[data-ic-invite]");
        if (i)
          said.push(
            `${quote(i.querySelector("[data-ic-invite-title]"))} stands where the banner was`,
          );
      }
      if (fact === "pointer") {
        const p = root.querySelector("[data-ic-pointer]");
        said.push(
          p
            ? `the moment card's last line reads ${quote(p)}`
            : "the moment card names only this event",
        );
      }
    }
    if (!said.length) return null;
    return `Measured: ${said.join("; ")}.`;
  };
}

/* ── the small pieces every surface shares ────────────────────────────────── */

/** A small rounded still, never a presigned URL: a stand-in photograph at the
 *  size its row or card can afford. */
export function Thumb({
  url,
  size,
}: {
  url: string;
  /** A fixed square in px; left out, the still fills its grid cell, square. */
  size?: number;
}) {
  return (
    <div
      className="shrink-0 overflow-hidden bg-black/10"
      style={{
        width: size ?? "100%",
        height: size,
        aspectRatio: size ? undefined : "1 / 1",
        borderRadius: "var(--radius-tile)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in still, not a presigned URL */}
      <img src={url} alt="" className="size-full object-cover" />
    </div>
  );
}

/**
 * THE SCRIM, QUOTED from `SheetOverlay` and `DialogOverlay`: a tenth of black
 * with the extra-small blur where the browser supports it. `layer` lifts the
 * dialog's own scrim over the sheet it opens above.
 */
export function Scrim({ layer = "sheet" }: { layer?: "sheet" | "dialog" }) {
  return (
    <div
      aria-hidden
      className={
        layer === "dialog"
          ? "fixed inset-0 z-[60] bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
          : "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
      }
    />
  );
}
