"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE FRAME EVERY OPTION DRAWS IN, AND WHAT IT SAYS UNDER ITSELF.
 *
 * ★ NOTHING HERE MAY MOUNT A RADIX PORTAL OR REACH A SESSION (the landmine
 * `guest-capture/scene.tsx` and `host-curation` both name). A Sheet, Dialog or
 * DropdownMenu would portal to the LAB PAGE's own document from inside a frame,
 * and the shipped `ClaimsCard` fires a real server action, so every panel,
 * dialog, menu and toast on this board is QUOTED markup on `fixed` positioning
 * (the frame IS the viewport) with local state, the shipped classes and copy
 * verbatim where production already says them.
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

/**
 * THE THREE FRAMES OF ONE OPTION, read left to right as time runs: the moment
 * at the album, where she sorts the four, a week on.
 *
 * ★ PHONES IN A ROW, LAPTOPS IN A COLUMN. Five options never fit side by side
 * on a desk's stage, so the step flips through them one at a time, and three
 * phones in a row (1,173 px) put an option's whole story on one screen: a flip
 * compares the same three frames in the same three places. The row wraps where
 * the stage is narrower (a wide monitor's side-by-side stage gives each option
 * one phone's width, and there they stack), and three 1440 frames stack, each
 * the stage's width.
 */
export function Trio({ row, children }: { row: boolean; children: ReactNode }) {
  return (
    <div
      className={
        row ? "flex flex-wrap items-start gap-6" : "flex flex-col gap-6"
      }
    >
      {children}
    </div>
  );
}

/* ── the measuring: one reader, told which facts a frame is about ─────────── */

export type Fact =
  | "moment"
  | "avatar"
  | "menu"
  | "review"
  | "bell"
  | "banner"
  | "events"
  | "dialog"
  | "toast";

const text = (el: Element | null | undefined) =>
  (el?.textContent ?? "").replace(/\s+/g, " ").trim();

/** Quoted inside a caption that ends in its own full stop. */
const quote = (el: Element | null | undefined) =>
  `"${text(el).replace(/[.:]$/, "")}"`;

/** "a, b and c", for the names a caption lists. */
const listed = (names: string[]) =>
  names.length <= 1
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const PLACE: Record<string, string> = {
  album: "the album",
  dashboard: "her dashboard",
};

/** The facts about the page itself, rather than the review over it. */
const PAGE_FACTS: readonly Fact[] = [
  "moment",
  "avatar",
  "menu",
  "bell",
  "banner",
  "events",
];

/**
 * A caption built from what the frame shows, one clause per fact asked for.
 * Null (not settled) until the ground itself has rendered, so the first
 * unstyled layout never overwrites "measuring" with a sentence about nothing.
 */
export function measureOf(...facts: Fact[]) {
  return (root: HTMLElement): string | null => {
    const ground = root.querySelector("[data-ic-ground]");
    if (!ground) return null;
    const page = ground.getAttribute("data-ic-ground");
    const where = PLACE[page ?? ""] ?? "";
    const said: string[] = [];
    // A fact about a page the frame is not showing says nothing: a press can
    // turn an album frame into the dashboard (`pointer=line`), and a caption
    // about a bell the album does not have would be about nothing. And while
    // the review is open it is the subject: in a hand it is the whole screen,
    // and at a desk the page sits blurred under its scrim.
    const onAlbum = page === "album";
    const covered = Boolean(root.querySelector("[data-ic-review]"));
    for (const fact of facts) {
      if (covered && PAGE_FACTS.includes(fact)) continue;
      if ((fact === "avatar" || fact === "menu") && !onAlbum) continue;
      if (
        (fact === "bell" || fact === "banner" || fact === "events") &&
        onAlbum
      )
        continue;
      if (fact === "moment") {
        if (!root.querySelector("[data-ic-moment]")) continue;
        const line = root.querySelector("[data-ic-pointer]");
        if (!line) {
          said.push("the moment card names only this event");
          continue;
        }
        const act = root.querySelector("[data-ic-pointer-act]");
        const names = [...root.querySelectorAll("[data-ic-named]")].map(
          (n) => n.getAttribute("data-ic-named") ?? "",
        );
        said.push(
          `the moment card says ${quote(line)}${names.length ? `, names ${listed(names)}` : ""}${act ? ` and offers ${quote(act)}` : ""}`,
        );
      }
      if (fact === "avatar") {
        const count = root.querySelector("[data-ic-avatar-count]");
        said.push(
          count
            ? `her avatar counts ${text(count)}`
            : "her avatar carries no count",
        );
      }
      if (fact === "menu") {
        const row = root.querySelector("[data-ic-menu-row]");
        if (row) said.push(`her menu's first row reads ${quote(row)}`);
      }
      if (fact === "review") {
        const panel = root.querySelector("[data-ic-review]");
        if (!panel) {
          said.push("the review is closed");
          continue;
        }
        const top = root.querySelector("[data-ic-top]");
        const end = root.querySelector("[data-ic-end]");
        const at = top
          ? ` at ${text(top)}, ${top.getAttribute("data-ic-top")}`
          : end
            ? ` reading ${quote(end)}`
            : "";
        const back = root.querySelector("[data-ic-back]");
        said.push(
          `the review is open over ${where}${at}${back ? `, its Back reading ${quote(back)}` : ""}`,
        );
      }
      if (fact === "bell") {
        const count = root.querySelector("[data-ic-bell-count]");
        const row = root.querySelector("[data-ic-bell-row]");
        said.push(
          `${count ? `the bell counts ${text(count)}` : "the bell counts nothing"}${row ? ` and its row reads ${quote(row)}` : ""}`,
        );
      }
      if (fact === "banner") {
        const words = root.querySelector("[data-ic-banner-words]");
        said.push(
          words ? `the banner reads ${quote(words)}` : "no banner on the page",
        );
      }
      if (fact === "events") {
        const n = root.querySelectorAll("[data-ic-card]").length;
        said.push(`Your events holds ${n} card${n === 1 ? "" : "s"}`);
      }
      if (fact === "dialog") {
        const d = root.querySelector("[data-ic-dialog]");
        if (d) said.push(`a dialog asks ${quote(d)}`);
      }
      if (fact === "toast") {
        const t = root.querySelector("[data-ic-toast]");
        if (t) said.push(`the toast reads ${quote(t)}`);
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
 * dialog's own scrim over the panel it opens above.
 */
export function Scrim({ layer = "panel" }: { layer?: "panel" | "dialog" }) {
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
