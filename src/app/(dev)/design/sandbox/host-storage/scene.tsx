"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { SCREENS, type ScreenId } from "./screens";

/**
 * THE ONE FRAME EVERY OPTION DRAWS IN, AND WHAT IT SAYS UNDER ITSELF: a real
 * viewport at 1440 or 375 with the real host pieces portalled into it.
 *
 * ★ NOTHING HERE MAY MOUNT A RADIX PORTAL OR REACH A SESSION. A Dialog, Sheet,
 * Popover or toast would portal to the LAB PAGE's own document from inside a
 * frame, and the shipped buttons start Checkout, the change-plan route or the
 * billing portal, so every popup on this board is QUOTED markup on `fixed`
 * positioning (the frame IS the viewport) with local state, wearing the shipped
 * shape classes (`floatingPopupShapes`) and the shipped copy verbatim.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER COMPUTED (docs/PROGRAM.md,
 * "Measure every tile before it ships"): how many of the six prices a host can
 * see without scrolling, how many choices stand between her and one, and how
 * tall the plan is, probed through the `data-hs-*` hooks the pieces carry, and
 * read again after every press inside the frame.
 */
export function Scene({
  id,
  screen,
  title,
  children,
}: {
  id: string;
  screen: ScreenId;
  title: string;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  const [measured, setMeasured] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${screen}`}
        w={w}
        h={h}
        title={`${title}, ${name}`}
        caption={measured}
      >
        <Measured
          probe={readFrame}
          deps={[screen, id]}
          onMeasure={setMeasured}
          className="min-h-full"
        >
          <Remeasure onMeasure={setMeasured}>{children}</Remeasure>
        </Measured>
      </Frame>
    </Fit>
  );
}

/**
 * ★ AND AGAIN AFTER EVERY PRESS. The kit's `Measured` reads on mount, on a
 * resize and on its timers, but a price that flips to its refusal in place
 * resizes nothing the kit watches, so its caption would go on describing the
 * plan as it opened. This watches the frame's own document (with that window's
 * observer, as `Measured` does) and reads once the press has settled.
 */
function Remeasure({
  onMeasure,
  children,
}: {
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    const root = el?.parentElement;
    if (!el || !win || !root) return;
    let timer = 0;
    const read = () => {
      win.clearTimeout(timer);
      timer = win.setTimeout(() => {
        const said = readFrame(root);
        if (said) report.current(said);
      }, 260);
    };
    const observer = new win.MutationObserver(read);
    observer.observe(el, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-hs-state"],
    });
    // A scroll inside the plan changes which prices are on screen.
    el.addEventListener("scroll", read, { capture: true, passive: true });
    return () => {
      win.clearTimeout(timer);
      observer.disconnect();
      el.removeEventListener("scroll", read, { capture: true });
    };
  }, []);
  return (
    <div ref={ref} className="min-h-full">
      {children}
    </div>
  );
}

/**
 * THE TWO FRAMES OF ONE OPTION, read as time runs: the plan as it opens, then
 * the same plan once she taps the size that cannot hold what she stores.
 * Phones in a row (an option's whole story on one screen, so a flip compares
 * the same two frames in the same two places), laptops in a column.
 */
export function Pair({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  return (
    <div
      className={
        SCREENS[screen].desk
          ? "flex flex-col gap-6"
          : "flex flex-wrap items-start gap-6"
      }
    >
      {children}
    </div>
  );
}

/* ── the reading ─────────────────────────────────────────────────────────── */

const words = (el: Element | null | undefined) =>
  (el?.textContent ?? "").replace(/\s+/g, " ").trim();

/** Whether a box sits whole inside a scrolling body, as the frame shows it. */
const inside = (el: Element, view: DOMRect) => {
  const r = el.getBoundingClientRect();
  return r.height > 0 && r.top >= view.top - 1 && r.bottom <= view.bottom + 1;
};

/**
 * What the frame shows, in one sentence. Null until the plan itself has laid
 * out, so the first unstyled pass never overwrites "measuring" with a sentence
 * about nothing.
 *
 * A price is ON SCREEN when its whole box sits inside the plan's scrolling
 * body as the frame shows it: a price below the fold of a phone's plan is one
 * a host has to scroll to, and the caption says so rather than counting it.
 */
function readFrame(root: HTMLElement): string | null {
  const list = root.querySelector("[data-hs-list]");
  if (list) {
    const strip = words(root.querySelector("[data-hs-goal] p"));
    const button = words(root.querySelector("[data-hs-goal] button"));
    const listBody = root.querySelector("[data-hs-list-body]");
    const rows = [...root.querySelectorAll("[data-hs-row]")];
    const seen = listBody
      ? rows.filter((r) => inside(r, listBody.getBoundingClientRect())).length
      : rows.length;
    const checked = root.querySelectorAll("[data-hs-row] input:checked").length;
    return `The list open over the plan, ${seen} of ${rows.length} files on screen, ${checked} selected: "${strip}"${button ? `, and its button reads "${button}"` : ""}.`;
  }

  const sheet = root.querySelector<HTMLElement>("[data-hs-sheet]");
  const body = root.querySelector<HTMLElement>("[data-hs-body]");
  if (!sheet || !body) return null;
  const box = sheet.getBoundingClientRect();
  if (box.height < 40) return null;
  const view = body.getBoundingClientRect();

  // Distinct prices, since an option may say one twice (a suggestion and its
  // row): six is every price, however many times one of them is printed.
  const prices = [...root.querySelectorAll<HTMLElement>("[data-hs-price]")];
  const onScreen = new Set(
    prices.filter((p) => inside(p, view)).map((p) => p.dataset.hsPrice),
  ).size;
  const choices = root.querySelectorAll("[data-hs-choice]").length;
  const hidden = Math.max(0, Math.round(body.scrollHeight - body.clientHeight));
  const desk = sheet.dataset.shape === "wide";

  const said: string[] = [];
  const refusal = root.querySelector("[data-hs-refusal]");
  if (refusal) {
    const name = words(refusal.querySelector("[data-hs-refused]"));
    const gap = words(refusal.querySelector("[data-hs-gap]"));
    said.push(`${name} flipped in place, full width: free ${gap}`);
  }
  const seen =
    onScreen === 6
      ? "all 6 prices on screen"
      : onScreen === 0
        ? "none of the 6 prices on screen"
        : `${onScreen} of the 6 prices on screen`;
  said.push(refusal ? `${seen} beside it` : seen);
  said.push(
    choices === 0
      ? "no toggle to press first"
      : `${choices} choice${choices === 1 ? "" : "s"} to set first`,
  );
  said.push(
    desk
      ? `the dialog ${Math.round(box.height)} px tall${hidden > 0 ? `, ${hidden} px more below` : ""}`
      : hidden > 0
        ? `${hidden} px more below the fold`
        : "nothing below the fold",
  );
  const sentence = said.join("; ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}
