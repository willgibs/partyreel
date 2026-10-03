"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * THE CARRY (create-wizard r2 `flow=carry`, Will 2026-10-03): "Her answer rises into the head: the name
 * stays there as the room's title, a pick drops into its stepper, and the head is the way back."
 *
 * One step change is three moving parts, all on the Web Animations API so each can be finished the
 * instant another change starts:
 *  - the leaving screen's PICTURE (a clone of its page, inert and hidden from every reader) fades where
 *    it stood, so the question changes in its one place rather than jumping;
 *  - the arriving screen, already live (its field focusable, its buttons pressable from the first frame:
 *    a change never makes her wait to act), rises the last few pixels into place;
 *  - her words in flight: off the name, the name she typed flies from the field to the head's line, and
 *    back down into the field on the way back.
 *
 * ★ THE FLIGHT IS MEASURED, NEVER GUESSED: it starts on the field's own words (`[data-room-name-text]`,
 * the field's mirror) and ends on the head's line (`[data-room-name]`), each read off the screen it
 * stands on, so a long name, a short one or one typed with a space flies from where it really is. It is
 * always the big words, scaled down on the way up and up on the way down, so it is crisp where it rests.
 *
 * ★ REDUCED MOTION CUTS (bible 5): nothing is cloned or flown, the next screen simply stands and the head
 * reads at once. The global guard clamps CSS, never a script's animation, so this asks first; where the
 * browser has no `animate` (an old engine, a test's jsdom) it cuts the same way.
 *
 * The add step (create-wizard r3) joins with its own carry, the pick dropping into its hairline.
 */

/** How long her words fly, ms; the screens' fade and rise sit inside it. */
export const CARRY_MS = 520;
const LEAVE_MS = 160;
const ARRIVE_MS = 340;
const ARRIVE_DELAY_MS = 110;

type Pending = {
  dir: 1 | -1;
  ghost: HTMLElement | null;
  /** The box her words left: the field's (forward) or the head's line (back). */
  from: DOMRect | null;
  /** Forward, the words themselves, photographed before their field leaves. */
  words: HTMLElement | null;
};

/** A house curve read off its token, so a retuned curve moves this too; a literal stands in for none. */
function curve(el: Element, token: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(token).trim();
  return v || fallback;
}

function motionWelcome(el: Element): boolean {
  if (typeof (el as HTMLElement).animate !== "function") return false;
  const win = el.ownerDocument.defaultView;
  return !win?.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const centreOf = (r: DOMRect) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

const hasWords = (el: Element | null): el is HTMLElement =>
  Boolean(el?.textContent?.trim());

/**
 * `take` before the screen changes (it photographs what is leaving), `land` once the new screen has
 * committed (it reads where things stand now and plays the change). Both are no-ops where motion is not
 * welcome.
 */
export function useCarry() {
  const ghosts = useRef<HTMLDivElement | null>(null);
  const flyers = useRef<HTMLDivElement | null>(null);
  const pending = useRef<Pending | null>(null);
  const running = useRef<Animation[]>([]);
  const cleanups = useRef<(() => void)[]>([]);

  /** Every part of a change still moving jumps to its end, and what it put in the room goes. */
  const settle = useCallback(() => {
    for (const a of running.current.splice(0)) {
      try {
        a.finish();
      } catch {
        // An animation already gone has nothing to finish.
      }
    }
    for (const done of cleanups.current.splice(0)) done();
  }, []);

  useEffect(() => settle, [settle]);

  const take = useCallback(
    (room: HTMLElement | null, dir: 1 | -1) => {
      settle();
      pending.current = null;
      if (!room || !motionWelcome(room)) return;
      const page = room.querySelector<HTMLElement>("[data-room-page]");
      let ghost: HTMLElement | null = null;
      if (page) {
        ghost = page.cloneNode(true) as HTMLElement;
        // A picture of the screen, never a second copy of it: no ids to collide, nothing to reach.
        for (const el of [
          ghost,
          ...ghost.querySelectorAll<HTMLElement>("[id]"),
        ])
          el.removeAttribute("id");
        ghost.removeAttribute("aria-labelledby");
        ghost.removeAttribute("data-room-page");
        ghost.setAttribute("data-room-ghost", "");
        ghost.setAttribute("inert", "");
        ghost.setAttribute("aria-hidden", "true");
        // Her words leave by air, never with their screen.
        for (const el of ghost.querySelectorAll<HTMLElement>(
          "input, [data-room-name-text]",
        ))
          el.style.color = "transparent";
      }
      const source = room.querySelector(
        dir === 1 ? "[data-room-name-text]" : "[data-room-name]",
      );
      const from = hasWords(source) ? source.getBoundingClientRect() : null;
      const words =
        dir === 1 && hasWords(source)
          ? (source.cloneNode(true) as HTMLElement)
          : null;
      pending.current = { dir, ghost, from, words };
    },
    [settle],
  );

  const land = useCallback((room: HTMLElement | null) => {
    const p = pending.current;
    pending.current = null;
    if (!room || !p) return;
    const strong = curve(
      room,
      "--ease-in-out-strong",
      "cubic-bezier(0.77, 0, 0.175, 1)",
    );
    const emphasis = curve(
      room,
      "--ease-emphasis",
      "cubic-bezier(0.23, 1, 0.32, 1)",
    );

    // The leaving screen fades where it stood.
    if (p.ghost && ghosts.current) {
      const ghost = p.ghost;
      ghosts.current.append(ghost);
      const gone = () => ghost.remove();
      cleanups.current.push(gone);
      const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: LEAVE_MS,
        easing: "ease-in",
        fill: "forwards",
      });
      running.current.push(fade);
      void fade.finished.then(gone, gone);
    }

    // The arriving screen rises the last few pixels, live the whole way.
    const page = room.querySelector<HTMLElement>("[data-room-page]");
    if (page) {
      running.current.push(
        page.animate(
          [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: ARRIVE_MS,
            delay: ARRIVE_DELAY_MS,
            easing: emphasis,
            fill: "backwards",
          },
        ),
      );
    }

    // Her words in flight, between the field and the head's line.
    if (!p.from || !flyers.current) return;
    let flight: HTMLElement;
    let rest: DOMRect;
    let head: DOMRect;
    let hide: HTMLElement;
    if (p.dir === 1) {
      const line = room.querySelector<HTMLElement>("[data-room-name]");
      if (!p.words || !hasWords(line)) return;
      flight = p.words;
      rest = p.from;
      head = line.getBoundingClientRect();
      hide = line;
    } else {
      const field = room.querySelector<HTMLElement>("[data-room-name-text]");
      const input = room.querySelector<HTMLElement>("[data-room-name-input]");
      if (!hasWords(field) || !input) return;
      flight = field.cloneNode(true) as HTMLElement;
      rest = field.getBoundingClientRect();
      head = p.from;
      hide = input;
    }
    if (rest.height < 1 || head.height < 1) return;

    flight.removeAttribute("id");
    flight.removeAttribute("data-room-name-text");
    flight.setAttribute("data-room-flight", "");
    flight.setAttribute("aria-hidden", "true");
    Object.assign(flight.style, {
      position: "fixed",
      inset: "auto",
      left: `${rest.left}px`,
      top: `${rest.top}px`,
      width: `${rest.width}px`,
      height: `${rest.height}px`,
      margin: "0",
      color: "",
      visibility: "visible",
      whiteSpace: "nowrap",
      // Its own placement classes must not add to the flight's.
      translate: "none",
      transformOrigin: "center",
      pointerEvents: "none",
      zIndex: "60",
    });
    const a = centreOf(rest);
    const b = centreOf(head);
    const atHead = `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(${head.height / rest.height})`;
    const atRest = "translate(0px, 0px) scale(1)";
    flyers.current.append(flight);

    // Where the words land waits, unseen, for them to arrive: the head's line, or the field's text.
    const prop = p.dir === 1 ? "visibility" : "color";
    hide.style[prop] = p.dir === 1 ? "hidden" : "transparent";
    const landed = () => {
      flight.remove();
      hide.style[prop] = "";
    };
    cleanups.current.push(landed);
    const fly = flight.animate(
      [
        { transform: p.dir === 1 ? atRest : atHead },
        { transform: p.dir === 1 ? atHead : atRest },
      ],
      { duration: CARRY_MS, easing: strong, fill: "forwards" },
    );
    running.current.push(fly);
    void fly.finished.then(landed, landed);
  }, []);

  return { ghosts, flyers, take, land, settle };
}
