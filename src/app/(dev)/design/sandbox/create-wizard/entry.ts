/**
 * THE ROOM OPENS INTO HER EVENT (the board's carried `entry`): one press from Create's last screen and the room's dark
 * rises, solid, into her cover's box while everything else in the room fades where it stands, and her code flies from
 * the beat's plate to its place on the cover's mat, the first thing she meets there. Then the room is gone and the hub
 * stands under it, already laid out.
 *
 * ★ A STAND-IN FOR A NAVIGATION'S VIEW TRANSITION. Production would run it across the route change to
 * `/dashboard/<id>` (the hub's code already wears a view-transition name for its own card), the room's ground and the
 * plate handed to the cover and the mat; the board draws it inside one frame, the hub mounted under the room, with the
 * Web Animations API, so a reviewer presses it and watches it whole.
 *
 * ★ EVERY READ IS THE FRAME'S OWN (its window, its easing token, its reduced motion), never the lab's: the scene runs in
 * the lab's realm and draws into the frame's document. Under reduced motion there is no flight: the hub simply stands.
 */

/** The flight's clock (the `enter` helper's: the room's words 180, the dark 560, the code 640). */
const WORDS_MS = 180;
const DARK_MS = 560;
const CODE_MS = 640;

/** Whether a frame's own window welcomes motion. */
export function motionIn(doc: Document | null | undefined): boolean {
  const win = doc?.defaultView;
  return Boolean(
    win &&
      typeof win.matchMedia === "function" &&
      !win.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}

/** The house's emphasis curve, read off the frame's own root (WAAPI takes no `var()`). */
function easing(doc: Document): string {
  const v = doc.defaultView
    ?.getComputedStyle(doc.documentElement)
    .getPropertyValue("--ease-emphasis")
    .trim();
  return v || "cubic-bezier(0.23, 1, 0.32, 1)";
}

/**
 * Plays the entry from `room` (the room's ground, still standing over the hub) into the hub under it; resolves when
 * the room may go. The hub must already be laid out under the room.
 */
export async function playEntry(room: HTMLElement): Promise<void> {
  const doc = room.ownerDocument;
  const win = doc.defaultView;
  if (!win || !motionIn(doc)) return;
  const ease = easing(doc);
  const cover = doc.querySelector<HTMLElement>(".hub-seam");
  const mat = doc.querySelector<HTMLElement>("[data-code-door]");
  const plate = room.querySelector<HTMLElement>("[data-beat-plate] > span:last-child");
  const flights: Animation[] = [];

  // The room's words, its rounds, its foot and its light fade where they stand.
  for (const part of room.querySelectorAll<HTMLElement>(
    "[data-room-head], [data-room-body], [data-room-foot], [data-room-light]",
  )) {
    flights.push(
      part.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: WORDS_MS,
        easing: "ease-out",
        fill: "forwards",
      }),
    );
  }

  // The dark rises into her cover's box, then gives way to it.
  if (cover) {
    const c = cover.getBoundingClientRect();
    const w = win.innerWidth;
    const h = win.innerHeight;
    const box = `inset(${Math.max(0, c.top)}px ${Math.max(0, w - c.right)}px ${Math.max(0, h - c.bottom)}px ${Math.max(0, c.left)}px)`;
    flights.push(
      room.animate(
        [
          { clipPath: "inset(0px 0px 0px 0px)", opacity: 1 },
          { clipPath: box, opacity: 1, offset: 0.72 },
          { clipPath: box, opacity: 0 },
        ],
        { duration: DARK_MS + 160, easing: ease, fill: "forwards" },
      ),
    );
  }

  // Her code flies from the beat's plate to the mat on her cover.
  if (plate && mat) {
    const from = plate.getBoundingClientRect();
    const to = mat.getBoundingClientRect();
    const flyer = plate.cloneNode(true) as HTMLElement;
    flyer.setAttribute("aria-hidden", "true");
    flyer.dataset.cwFlyer = "";
    Object.assign(flyer.style, {
      position: "fixed",
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      margin: "0",
      zIndex: "70",
      transformOrigin: "0 0",
      pointerEvents: "none",
    });
    doc.body.appendChild(flyer);
    mat.style.visibility = "hidden";
    const s = to.width / from.width;
    // Its caption (her name under the code) leaves early and the plate closes up over it, so what lands is the
    // code alone, as square as the mat it lands on.
    const caption = flyer.querySelector<HTMLElement>("span.truncate");
    caption?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 280,
      easing: "ease-out",
      fill: "forwards",
    });
    const below = Math.max(0, from.height - from.width);
    const corner = win.getComputedStyle(plate).borderTopLeftRadius || "0px";
    const flight = flyer.animate(
      [
        {
          transform: "translate(0px, 0px) scale(1)",
          clipPath: `inset(0px 0px 0px 0px round ${corner})`,
        },
        {
          transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${s})`,
          clipPath: `inset(0px 0px ${below}px 0px round ${corner})`,
        },
      ],
      { duration: CODE_MS, easing: ease, fill: "forwards" },
    );
    flights.push(flight);
    await flight.finished.catch(() => undefined);
    mat.style.visibility = "";
    flyer.remove();
  }
  await Promise.all(flights.map((f) => f.finished.catch(() => undefined)));
}
