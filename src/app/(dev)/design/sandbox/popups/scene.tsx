"use client";

import { type ReactNode, useState } from "react";

import { Fit, Frame, Measured } from "@/components/lab";

import { KEYBOARD_H } from "./keyboard";

/**
 * THE FRAMES EVERY OPTION DRAWS IN (`identity-door/scene.tsx`'s layout): one
 * 1440 frame above three 375 frames, so a rule is judged at a laptop and in a
 * hand together, and across three real screens of its kind rather than one.
 * The laptop's screen is the kind's own knob; the three phones are fixed.
 *
 * ★ STACKED, NEVER ALL IN ONE ROW. A 1440 frame beside three phones is 2,613
 * px, which the board's column clips; stacked, the widest thing on the stage
 * is the one laptop, and the three phones (1,173 px) sit under it whole.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK ON MOUNT,
 * AND NOTHING MOUNTS A RADIX PORTAL: a portal opened inside a portalled lab
 * frame renders on the LAB PAGE's document, not the phone being judged. Every
 * sheet, dialog, menu and toast on this board is quoted markup wearing
 * production's own classes (`surfaces.tsx`), `fixed` to the frame's viewport.
 *
 * ★ EVERY CAPTION IS READ OFF ITS OWN FRAME, NEVER ASSERTED (`readPopup`): the
 * surface's box, the page it leaves showing, where the act sits against the
 * keyboard or the foot, and how many rows of a list show before it scrolls.
 * If the words above a frame and the number under it disagree, the number is
 * the truth.
 */

export const PHONE = { w: 375, h: 812 } as const;
export const DESK = { w: 1440, h: 900 } as const;

/** The band a phone's keyboard leaves, the one number every caption uses. */
export const VISIBLE_H = PHONE.h - KEYBOARD_H;

export type Reader = (root: HTMLElement, win: Window) => string | null;

function Screen({
  id,
  w,
  h,
  title,
  measure,
  children,
}: {
  id: string;
  w: number;
  h: number;
  title: string;
  measure: Reader;
  children: ReactNode;
}) {
  const [said, setSaid] = useState("measuring");
  return (
    <Frame id={id} w={w} h={h} title={title} caption={said} onApproach>
      <Measured probe={measure} deps={[id]} onMeasure={setSaid}>
        {children}
      </Measured>
    </Frame>
  );
}

export type PhoneScene = {
  /** Which real screen of the kind this is: "reporting the wedding". */
  title: string;
  node: ReactNode;
};

/**
 * One option of one kind, whole: the laptop above, three real screens of the
 * kind in a hand beneath. Every caption is read off its own frame.
 */
export function Scenes({
  id,
  title,
  laptop,
  laptopTitle,
  phones,
}: {
  id: string;
  /** The option, in words: "a centred dialog". */
  title: string;
  laptop: ReactNode;
  laptopTitle: string;
  phones: readonly PhoneScene[];
}) {
  return (
    <Fit w={DESK.w}>
      <div className="flex flex-col gap-6">
        <Screen
          id={`${id}-1440`}
          w={DESK.w}
          h={DESK.h}
          title={`${title}: ${laptopTitle}, at a laptop`}
          measure={readPopup}
        >
          {laptop}
        </Screen>
        <div className="flex items-start gap-6">
          {phones.map((p, i) => (
            <Screen
              key={i}
              id={`${id}-375-${i}`}
              w={PHONE.w}
              h={PHONE.h}
              title={`In a hand, ${p.title}`}
              measure={readPopup}
            >
              {p.node}
            </Screen>
          ))}
        </div>
      </div>
    </Fit>
  );
}

/* ── the reader ──────────────────────────────────────────────────────────── */

const px = (n: number) => `${Math.round(n)} px`;

/** Where the act sits against a phone's foot: in reach, or past a scroll. */
const footSaid = (name: string, act: DOMRect, vh: number) =>
  act.bottom <= vh
    ? `${name} ${px(vh - act.bottom)} off the foot`
    : `${name} ${px(act.bottom - vh)} below the fold, past a scroll`;

/** The act's own words, as the frame drew them. */
const wordsOf = (el: Element | null) =>
  el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

/**
 * How many rows of a list show before it scrolls: a row counts when its whole
 * box sits inside the part of the scroll region the viewport (less any
 * keyboard) actually shows. `data-pop-total` names the list's full length,
 * which the drawing may cut short rather than mount 240 nodes it never shows.
 */
function rowsSaid(
  scope: HTMLElement,
  win: Window,
  kbTop: number,
  surface: DOMRect,
  flows: boolean,
): string {
  // Only a list the surface itself holds: a ground's own list (the names a
  // quick look opens over) is the page, not what the popup shows.
  const region = scope.querySelector<HTMLElement>("[data-pop-rows]");
  if (!region) return "";
  const rows = [...region.querySelectorAll("[data-pop-row]")];
  if (rows.length === 0) return "";
  // The rows a reader can see: inside the list, inside the surface that clips
  // it, inside the screen, and above the keyboard.
  const r = region.getBoundingClientRect();
  const top = Math.max(r.top, surface.top, 0);
  const bottom = Math.min(r.bottom, surface.bottom, win.innerHeight, kbTop);
  const shown = rows.filter((row) => {
    const b = row.getBoundingClientRect();
    return b.top >= top - 1 && b.bottom <= bottom + 1;
  }).length;
  const total = Number(region.dataset.popTotal ?? rows.length);
  const noun = region.dataset.popNoun ?? "rows";
  // A surface scrolls inside itself; a page and a list in place scroll the
  // page, so theirs is simply what the first screen holds.
  return flows
    ? `; ${shown} of ${total} ${noun} on the first screen`
    : `; ${shown} of ${total} ${noun} show before it scrolls`;
}

/**
 * THE ONE READER every frame on the board uses. The surface names its shape
 * (`data-pop-surface`); the reader says what that shape did on this screen,
 * in numbers the frame's own layout produced.
 */
export const readPopup: Reader = (root, win) => {
  // The LAST surface in the document is the one on top: a picker opened over
  // the host's kit, a menu inside a panel, a form grown inside a card.
  const surfaces = root.querySelectorAll<HTMLElement>("[data-pop-surface]");
  const surface = surfaces[surfaces.length - 1];
  if (!surface || !root.querySelector("[data-pop-ground]")) return null;
  const box = surface.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const shape = surface.dataset.popSurface;
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  const phone = vw < 640;
  const kbEl = root.querySelector("[data-pop-kb]");
  const kbTop = kbEl ? kbEl.getBoundingClientRect().top : vh;
  // The surface's own act and field first: a ground can hold a primary of its
  // own (the kit under a picker opened from it).
  const act =
    surface.querySelector("[data-pop-primary]") ??
    root.querySelector("[data-pop-primary]");
  const actBox = act?.getBoundingClientRect();
  const field = (
    surface.querySelector("[data-pop-field]") ??
    root.querySelector("[data-pop-field]")
  )?.getBoundingClientRect();
  const rows = rowsSaid(
    surface,
    win,
    kbTop,
    box,
    shape === "page" || shape === "inline",
  );
  const actName = act ? `“${wordsOf(act)}”` : "";

  // With the keyboard up, the only question is whether the act and the field
  // clear it, and how much of the page the surface still leaves.
  const typing = kbEl
    ? [
        actBox
          ? actBox.bottom <= kbTop + 1
            ? `${actName} clears the keyboard by ${px(kbTop - actBox.bottom)}`
            : `${actName} is under the keyboard by ${px(actBox.bottom - kbTop)}`
          : "",
        field
          ? field.bottom <= kbTop + 1
            ? `the field sits ${px(kbTop - field.bottom)} above it`
            : `the field is under it by ${px(field.bottom - kbTop)}`
          : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  switch (shape) {
    case "bottom-sheet":
      return kbEl
        ? `On the keyboard, ${px(box.height)} tall: ${typing}; ${px(box.top)} of the page shows above.${rows}`
        : `A bottom sheet ${px(box.height)} tall, ${px(box.top)} of the page above it${actBox ? `; ${footSaid(actName, actBox, vh)}` : ""}${rows}.`;
    case "side-panel":
      return `A ${px(box.width)} panel at the right edge, ${px(box.left)} of the page beside it${rows}.`;
    case "dialog":
      return kbEl
        ? `A ${px(box.width)} × ${px(box.height)} dialog in the ${px(kbTop)} the keyboard leaves: ${typing}.${rows}`
        : `A ${px(box.width)} × ${px(box.height)} dialog in the middle, ${px(box.top)} of page above it${phone && actBox ? `; ${footSaid(actName, actBox, vh)}` : ""}${rows}.`;
    case "screen":
      return kbEl
        ? `The whole screen under its own bar: ${typing}.${rows}`
        : `The whole screen under its own bar, none of the page behind it${rows}.`;
    case "page":
      return `A page of its own, ${px(box.width)} wide${rows}.`;
    case "menu":
      return `A ${px(box.width)} × ${px(box.height)} menu under its button, the page undimmed${rows}.`;
    case "anchored-card":
      return `A ${px(box.width)} × ${px(box.height)} card at the name, the list undimmed around it.`;
    case "nothing":
      return "Nothing opens: the tap lands on a name with no page behind it, and stops.";
    case "action-sheet":
      return `Rows at the foot: the choices fill the bottom ${px(vh - box.top)}, all in the thumb's reach${rows}.`;
    case "card": {
      const qr = surface.querySelector("svg")?.getBoundingClientRect();
      return phone
        ? `The whole screen in white, a ${px(qr?.width ?? 0)} code in its middle.`
        : `A ${px(box.width)} white card in the middle, a ${px(qr?.width ?? 0)} code on it.`;
    }
    case "os-share":
      return `The phone's own share sheet, ${px(box.height)} tall: the link in its head, the apps under it.`;
    case "toast":
      return `No question: it is done, and a ${px(box.width)} toast at the top offers ${actName || "nothing"}.`;
    case "inline":
      return kbEl
        ? `In place, the page scrolled to it: ${typing}.${rows}`
        : `In place: ${px(box.height)} where the control was, nothing over the page${rows}.`;
    default:
      return null;
  }
};
