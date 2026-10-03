import type { StatusId } from "../model";

import { MARKS } from "./marks";
import { FOCUS, HOVER, PHOTO } from "./states";

/**
 * STATUS: BADGES AND THE LIVE MARK, METERS, SKELETONS, FACES AND A ROW OF
 * THEM, A COUNT BESIDE ITS GLYPH, AND THE ONE WAY "NOTHING HERE YET" IS DRAWN.
 *
 * ★ ONE EMPTY PLACE, NOT FOUR. Production draws "nothing here yet" four ways
 * (`shared/empty-state.tsx`, `dashboard/empty-section-teaser.tsx`,
 * `dashboard/events-empty-teaser.tsx`, `event-feed/feed-section-empty.tsx`);
 * every build here draws it once, as the `empty` atom (a glyph, a title, a
 * line and an action, never a dashed box), which is what the four become.
 *
 * ★ A ROW OF FACES OVERLAPS BY A SHARE OF THE FACE, NEVER 8PX: `AvatarGroup`'s
 * fixed `-space-x-2` hid a third of a 24px face and its initial. Each build
 * says its share, and the margin follows the face's own size.
 *
 * The meter's build (tape, frames, a bar) is the voice's; a build here sets
 * only its colours, on the meter itself (a colour set on the root would
 * resolve there and carry paper's ink into the room).
 */
const overlap = (share: number) =>
  (
    [
      ["sm", 24],
      ["default", 32],
      ["lg", 40],
      ["xl", 80],
    ] as const
  )
    .map(
      ([size, px]) =>
        `[data-slot="avatar-group"] > [data-slot="avatar"][data-size="${size}"]:not(:last-child) { margin-inline-end: -${Math.round(px * share)}px; }`,
    )
    .join("\n");

/** Laid out once: the empty place and the count are stand-ins. */
const BASE = `
[data-slot="avatar-group"] { gap: 0; }
[data-slot="glyph-count"] {
  position: relative; display: inline-flex; align-items: center; gap: 5px; padding: 2px 4px; margin: -2px -4px;
  border: 0; background: transparent; color: var(--muted-foreground); cursor: default; outline: none; border-radius: 4px;
}
[data-slot="glyph-count"] svg { width: 14px; height: 14px; flex: none; }
[data-slot="glyph-count"]${HOVER} { color: var(--foreground); }
${PHOTO} [data-slot="glyph-count"] { color: oklch(1 0 0 / 86%); }
${PHOTO} [data-slot="glyph-count"]${HOVER} { color: oklch(1 0 0); }
[data-slot="empty"] { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 32px 20px; }
[data-slot="empty-glyph"] { position: relative; display: flex; align-items: center; justify-content: center; color: var(--muted-foreground); }
[data-slot="empty-glyph"] svg { width: 22px; height: 22px; }
[data-slot="empty-title"] { font-family: var(--font-display, var(--font-sans)); font-weight: 700; font-size: 17px; letter-spacing: -0.02em; line-height: 1.25; color: var(--foreground); }
[data-slot="empty-line"] { max-width: 32ch; font-size: 13.5px; line-height: 1.45; color: var(--muted-foreground); text-wrap: pretty; }
[data-slot="empty-copy"] { display: flex; flex-direction: column; gap: 4px; align-items: center; }
@keyframes vf-breathe { from { opacity: 0.55; } to { opacity: 1; } }
@keyframes vf-glow { from { box-shadow: 0 0 0 0 color-mix(in oklab, var(--signal) 55%, transparent); } to { box-shadow: 0 0 0 5px color-mix(in oklab, var(--signal) 0%, transparent); } }
`;

/* ── READOUTS: r1's readouts, refined ─────────────────────────────────── */

/**
 * READOUTS: status printed on a small plate, the way a camera prints its
 * settings: a badge is a plate with the word, a state carries its colour in an
 * LED beside the word rather than as a wash, and the live mark is the
 * recording red. A face wears a hairline; a row of faces overlaps by a third;
 * the empty place is a small recessed well holding its glyph.
 */
const READOUTS = `
[data-slot="badge"] {
  --dot: transparent; height: 20px; padding-inline: 7px; gap: 5px; border: 0; border-radius: 4px;
  background: var(--secondary); color: var(--foreground); box-shadow: inset 0 0 0 1px var(--border);
}
[data-slot="badge"]:is([data-variant="success"],[data-variant="warning"],[data-variant="destructive"],[data-variant="info"],[data-variant="live"])::before {
  content: ""; width: 6px; height: 6px; flex: none; border-radius: 999px; background: var(--dot);
}
[data-slot="badge"][data-variant="success"] { --dot: var(--success); }
[data-slot="badge"][data-variant="warning"] { --dot: var(--warning); }
[data-slot="badge"][data-variant="destructive"] { --dot: var(--destructive); color: var(--destructive); }
[data-slot="badge"][data-variant="info"] { --dot: var(--info); }
[data-slot="badge"][data-variant="default"] { background: var(--primary); color: var(--primary-foreground); box-shadow: none; }
[data-slot="badge"][data-variant="outline"] { background: transparent; box-shadow: inset 0 0 0 1px var(--input); }
[data-slot="badge"][data-variant="live"] { --dot: var(--signal); background: var(--primary); color: var(--primary-foreground); box-shadow: none; }
[data-slot="badge"][data-variant="live"]::before { box-shadow: 0 0 0 2px color-mix(in oklab, var(--signal) 30%, transparent); }
${PHOTO} [data-slot="badge"][data-variant="live"] {
  background: oklch(0.08 0 0 / 55%); color: oklch(1 0 0);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: inset 0 0 0 1px oklch(1 0 0 / 14%);
}

[data-slot="progress"] { --vf-meter-track-c: var(--input); --vf-meter-fill-c: var(--foreground); }
[data-slot="progress"][aria-invalid="true"] { --vf-meter-fill-c: var(--destructive); }

[data-slot="skeleton"] {
  border-radius: 4px; background-color: var(--muted);
  background-image: linear-gradient(100deg, transparent 40%, var(--vf-wash-strong) 50%, transparent 60%);
  box-shadow: inset 0 0 0 1px var(--border);
}

[data-slot="avatar"]::after { border-color: var(--input) !important; mix-blend-mode: normal !important; }
${overlap(0.2)}
[data-slot="avatar-group-count"] { background: var(--secondary); color: var(--foreground); box-shadow: 0 0 0 2px var(--background), inset 0 0 0 1px var(--border); }

[data-slot="glyph-count"]${FOCUS} { outline: 1.5px solid var(--foreground); outline-offset: 2px; }

[data-slot="empty-glyph"] {
  width: 52px; height: 52px; border-radius: 12px; background: var(--muted);
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 3px var(--vf-well-shade);
}
`;

/* ── LIGHTS: status as light ──────────────────────────────────────────── */

/**
 * LIGHTS: status speaks as light, the way a camera does: a badge is an LED and
 * its word, no plate; the live mark breathes (still under reduced motion); a
 * meter fills in the state's own light; a skeleton breathes rather than
 * sweeps; a face carries no line, and a row of faces overlaps by a quarter,
 * parted by the ground; the empty place is a lens.
 */
const LIGHTS = `
[data-slot="badge"] {
  --dot: var(--foreground); height: 20px; padding-inline: 0; gap: 6px; border: 0; border-radius: 0;
  background: transparent; color: var(--foreground); box-shadow: none; overflow: visible;
}
[data-slot="badge"]::before {
  content: ""; width: 7px; height: 7px; flex: none; border-radius: 999px; background: var(--dot);
}
[data-slot="badge"]:is([data-variant="secondary"],[data-variant="outline"],[data-variant="ghost"])::before { background: transparent; box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }
[data-slot="badge"][data-variant="success"] { --dot: var(--success); }
[data-slot="badge"][data-variant="warning"] { --dot: var(--warning); }
[data-slot="badge"][data-variant="destructive"] { --dot: var(--destructive); }
[data-slot="badge"][data-variant="info"] { --dot: var(--info); }
[data-slot="badge"]:is([data-variant="success"],[data-variant="warning"],[data-variant="destructive"],[data-variant="info"])::before {
  box-shadow: 0 0 6px color-mix(in oklab, var(--dot) 70%, transparent);
}
[data-slot="badge"][data-variant="live"] { --dot: var(--signal); }
[data-slot="badge"][data-variant="live"]::before { animation: vf-glow 1.6s ease-out infinite; }
${PHOTO} [data-slot="badge"][data-variant="live"] { color: oklch(1 0 0); text-shadow: 0 1px 6px oklch(0 0 0 / 60%); }

[data-slot="progress"] { --vf-meter-track-c: var(--vf-wash-strong); --vf-meter-fill-c: var(--success); }
[data-slot="progress"][aria-invalid="true"] { --vf-meter-fill-c: var(--destructive); }

[data-slot="skeleton"] { border-radius: 6px; background-color: var(--muted); background-image: none; animation: vf-breathe 1.4s ease-in-out infinite alternate; }

[data-slot="avatar"]::after { border-color: transparent !important; }
${overlap(0.25)}
[data-slot="avatar-group"] > [data-slot="avatar"] { box-shadow: 0 0 0 2px var(--background); }
[data-slot="avatar-badge"] { background: var(--success); }
[data-slot="avatar-group-count"] { background: transparent; color: var(--foreground); box-shadow: 0 0 0 2px var(--background), inset 0 0 0 1.5px var(--vf-ring-strong); }

[data-slot="glyph-count"] svg { color: var(--muted-foreground); }
[data-slot="glyph-count"] [data-n] { color: var(--foreground); }
${PHOTO} [data-slot="glyph-count"] svg, ${PHOTO} [data-slot="glyph-count"] [data-n] { color: oklch(1 0 0); }
[data-slot="glyph-count"]${FOCUS} { outline: 1.5px solid var(--foreground); outline-offset: 2px; border-radius: 999px; }

[data-slot="empty-glyph"] {
  width: 64px; height: 64px; border-radius: 999px;
  background: radial-gradient(closest-side, var(--muted) 0 62%, var(--secondary) 63% 100%);
  box-shadow: inset 0 0 0 1px var(--border), 0 0 0 6px color-mix(in oklab, var(--muted) 60%, transparent);
}
`;

/* ── CORNERS: the viewfinder's own frame ──────────────────────────────── */

/**
 * CORNERS: status framed. A badge is its word inside four small marks in the
 * state's colour; the live mark is the red frame; a skeleton is an empty
 * frame; a face is a soft square, as a camera frames a face it finds, and a
 * row of them barely overlaps; the empty place is an empty viewfinder, its
 * glyph at the centre of a frame.
 */
const CORNERS = `
[data-slot="badge"] {
  --mark: var(--vf-ring-strong); height: 20px; padding-inline: 7px; gap: 5px; border: 0; border-radius: 0;
  background-color: transparent; color: var(--foreground); box-shadow: none;
  --m-c: var(--mark); --m-a: 4px; --m-w: 1.5px; ${MARKS}
}
[data-slot="badge"][data-variant="default"] { background-color: var(--primary); color: var(--primary-foreground); --m-c: transparent; }
[data-slot="badge"][data-variant="success"] { --mark: var(--success); }
[data-slot="badge"][data-variant="warning"] { --mark: var(--warning); }
[data-slot="badge"][data-variant="destructive"] { --mark: var(--destructive); color: var(--destructive); }
[data-slot="badge"][data-variant="info"] { --mark: var(--info); }
[data-slot="badge"][data-variant="live"] { --mark: var(--signal); }
[data-slot="badge"][data-variant="live"]::before {
  content: ""; width: 6px; height: 6px; flex: none; border-radius: 999px; background: var(--signal);
}
${PHOTO} [data-slot="badge"][data-variant="live"] { color: oklch(1 0 0); background-color: oklch(0.08 0 0 / 40%); }

[data-slot="progress"] { --vf-meter-track-c: var(--vf-ring); --vf-meter-fill-c: var(--foreground); }
[data-slot="progress"][aria-invalid="true"] { --vf-meter-fill-c: var(--destructive); }

[data-slot="skeleton"] {
  border-radius: 0; background-color: var(--vf-wash);
  --m-c: var(--vf-ring-strong); --m-a: 7px; --m-w: 1.5px; ${MARKS}
  animation: vf-breathe 1.4s ease-in-out infinite alternate;
}

/* a face in a frame, as a camera's face detection draws one: a square with soft corners */
[data-slot="avatar"], [data-slot="avatar"]::after, [data-slot="avatar-group-count"] { border-radius: 28%; }
[data-slot="avatar"]::after { border-color: var(--input) !important; mix-blend-mode: normal !important; }
${overlap(0.12)}
[data-slot="avatar-group-count"] {
  border-radius: 2px; background-color: transparent; color: var(--foreground); box-shadow: none;
  --m-c: var(--vf-ring-strong); --m-a: 5px; --m-w: 1.5px; ${MARKS}
}

[data-slot="glyph-count"] { border-radius: 0; }
[data-slot="glyph-count"]::after {
  content: ""; position: absolute; inset: -2px; pointer-events: none; opacity: 0;
  --m-c: var(--foreground); --m-a: 5px; --m-w: 1.5px; ${MARKS}
  transition: opacity 100ms linear, inset 140ms var(--ease-emphasis);
}
${PHOTO} [data-slot="glyph-count"]::after { --m-c: oklch(1 0 0); }
[data-slot="glyph-count"]${HOVER}::after, [data-slot="glyph-count"]${FOCUS}::after { opacity: 1; inset: 0; }

[data-slot="empty-glyph"] {
  width: 84px; height: 60px; border-radius: 0;
  --m-c: var(--vf-ring-strong); --m-a: 13px; --m-w: 1.5px; ${MARKS}
}
`;

export const STATUS_CSS: Record<StatusId, string> = {
  readouts: BASE + READOUTS,
  lights: BASE + LIGHTS,
  corners: BASE + CORNERS,
};
