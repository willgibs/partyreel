"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DOOR_MAIN, DoorColumn } from "@/components/guest/door/door-page";
import { StageBeat } from "@/components/guest/door/stage";
import {
  SendingPicks,
  type WaitPick,
} from "@/components/guest/door/wait-picks";
import { WaitingDoor } from "@/components/guest/door/waiting-step";
import { WelcomeWords } from "@/components/guest/door/welcome";

import { ALBUM, EVENT, HOST, LENA, PICKS } from "./fixtures";
import {
  AlbumPage,
  AlbumRows,
  GuestPage,
  HOUSE,
  useAlbumHues,
} from "./guest-page";
import { type ScreenId, useOffStage } from "./scene";
import { LdWay, type Reveal } from "./way";

/**
 * THE MOMENT THE DOOR OPENS AND SHE WALKS THROUGH, AS A GUEST GETS IT.
 *
 * ★ PRODUCTION'S PAGE, PRODUCTION'S WORDS. The album stands under the door's
 * stage as `EventExperience` stands it (laid out, waiting behind the reveal
 * curtain), the stage is `DoorStage`'s own box and `DOOR_MAIN`, the column is
 * `DoorColumn`, and the words are the welcome's (`WelcomeWords`), the held
 * door's (`WaitingDoor`, its chooser as door-wiring built it) and the beat's
 * (`StageBeat` with `SendingPicks`). Only the doorway's open state (`way.tsx`)
 * and the walk are this round's.
 *
 * ★ A TIMELINE OF PHASES, EACH A RESTING STATE. A phase is written on the
 * scene (`data-ld-phase`) and the sheet's transitions carry the door from one
 * to the next, so a still of any phase is that phase's own resting style, and
 * a live scene is the same states played in order. A live scene loops (the
 * whole stage remounts each time round, so the arrival's swing and the words'
 * reveal play again), holds still when its option is off the stage, and never
 * runs in a reduced motion still.
 *
 * ★ THE WALK READS THE PAGE IT STANDS ON: the opening's rect, the album's
 * first photograph's and the camera's reach are measured off the frame's own
 * layout and handed to the sheet as custom properties, never typed, so the
 * photograph lands on the photograph it is and the camera ends exactly on the
 * album it shows.
 */

export type Moment = "welcome" | "let-in";

export type Phase =
  | "ajar"
  | "letin"
  | "open"
  | "press"
  | "swing"
  | "mid"
  | "walk"
  | "in";

/** How long each walk runs (its longest transition), which the timeline holds for. */
export const WALK_MS: Record<Reveal, number> = {
  light: 820,
  one: 920,
  through: 1150,
};

type Step = { phase: Phase; ms: number };

/** The moment, phase by phase, as a guest meets it. */
function timeline(moment: Moment, reveal: Reveal): readonly Step[] {
  const walk: Step[] = [
    { phase: "swing", ms: 480 },
    { phase: "walk", ms: WALK_MS[reveal] },
    { phase: "in", ms: 2700 },
  ];
  return moment === "welcome"
    ? [{ phase: "open", ms: 3400 }, { phase: "press", ms: 220 }, ...walk]
    : [{ phase: "ajar", ms: 2600 }, { phase: "letin", ms: 2000 }, ...walk];
}

const PHASE_NAMES: Record<Phase, string> = {
  ajar: "waiting",
  letin: "let in",
  open: "the door at rest",
  press: "her Continue",
  swing: "the swing",
  mid: "the walk",
  walk: "the walk",
  in: "the album",
};

/** The timeline in words, for the live frame's caption to read off it. */
function describe(steps: readonly Step[]): string {
  const total = steps.reduce((t, s) => t + s.ms, 0);
  const secs = (ms: number) =>
    `${(Math.round(ms / 100) / 10).toString().replace(/\.0$/, "")} s`;
  return `plays in ${secs(total)} and loops: ${steps
    .map((s) => `${PHASE_NAMES[s.phase]} ${secs(s.ms)}`)
    .join(", ")}`;
}

/** The farthest the camera pushes in (`through`), as a multiple of the door. */
const CAMERA_REACH = 4.6;

/** The measured geometry, as the sheet reads it. */
type Geometry = Record<`--ld-${string}`, string>;

/** A box in the scene's own coordinates. */
type Box = { left: number; top: number; width: number; height: number };

/**
 * WHERE AN ELEMENT IS LAID OUT, never where it is painted: its offsets summed
 * up to the scene, which no transform moves, so a still drawn mid-walk (the
 * camera already pushed in) measures the same page a resting one does.
 */
function layoutBox(el: HTMLElement, scene: HTMLElement): Box | null {
  let left = 0;
  let top = 0;
  let at: HTMLElement | null = el;
  while (at && at !== scene) {
    left += at.offsetLeft;
    top += at.offsetTop;
    const parent = at.offsetParent as HTMLElement | null;
    // An ancestor laid out past the scene: the scene is not this element's
    // positioned ancestor, so the sum means nothing.
    if (parent && !scene.contains(parent) && parent !== scene) return null;
    at = parent;
  }
  if (at !== scene) return null;
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}

/**
 * THE GEOMETRY EACH WALK NEEDS, read off the frame's layout: the opening (the
 * door's room), the album's first photograph and its rows, in the scene's own
 * coordinates.
 */
function measure(scene: HTMLElement): Geometry | null {
  const room = scene.querySelector<HTMLElement>(
    "[data-ld-stage] .door-way-room",
  );
  const first = scene.querySelector<HTMLElement>(
    "[data-ld-album] [data-ld-tile='0']",
  );
  const rows = scene.querySelector<HTMLElement>(
    "[data-ld-album] [data-ld-rows]",
  );
  if (!room || !first || !rows) return null;
  const o = layoutBox(room, scene);
  const f = layoutBox(first, scene);
  const g = layoutBox(rows, scene);
  const s = { width: scene.offsetWidth, height: scene.offsetHeight };
  if (!o || !f || !g) return null;
  if (o.width < 1 || f.width < 1 || s.width < 1 || g.width < 1) return null;
  const win = scene.ownerDocument.defaultView ?? window;
  const radius = Number.parseFloat(
    win.getComputedStyle(room).borderTopLeftRadius,
  );
  const ox = o.left;
  const oy = o.top;
  const fx = f.left;
  const fy = f.top;
  const gx = g.left;
  const gy = g.top;
  const cx = ox + o.width / 2;
  const cy = oy + o.height / 2;
  // The camera's reach (`through`): far enough that the opening spans the
  // page's width at a phone, where the album at 1:1 fills it; at a laptop it
  // stops short (the photographs behind the door would be a tenth of their
  // size at the full reach), and the stage's own ground, fading, hands over
  // to the album already standing under it at its sides, top and foot.
  const k = Math.min(s.width / o.width, CAMERA_REACH);
  // Where the album's photographs stand behind the door at rest: under the
  // lintel, so the opening holds the party's photographs (the album's head
  // rises only as she arrives). The walk carries them to their own place.
  const t0 = oy + o.height * 0.05 - cy - (gy - cy) / k;
  const px = (n: number) => `${Math.round(n * 10) / 10}px`;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  // The stills' middle of each walk: the flood part-way out of the opening,
  // the photograph part-way to its place, the camera part-way in.
  const mid = 0.55;
  const midCamera = 0.32;
  return {
    "--ld-ox": px(ox),
    "--ld-oy": px(oy),
    "--ld-ow": px(o.width),
    "--ld-oh": px(o.height),
    "--ld-ot": px(oy),
    "--ld-or": px(s.width - ox - o.width),
    "--ld-ob": px(s.height - oy - o.height),
    "--ld-ol": px(ox),
    "--ld-r": px(radius),
    "--ld-fx": px(fx),
    "--ld-fy": px(fy),
    "--ld-fw": px(f.width),
    "--ld-fh": px(f.height),
    "--ld-cx": px(cx),
    "--ld-cy": px(cy),
    "--ld-k": String(Math.round(k * 1000) / 1000),
    "--ld-mt": px(oy * 0.4),
    "--ld-mr": px((s.width - ox - o.width) * 0.4),
    "--ld-mb": px((s.height - oy - o.height) * 0.4),
    "--ld-ml": px(ox * 0.4),
    "--ld-mx": px(lerp(ox, fx, mid)),
    "--ld-my": px(lerp(oy, fy, mid)),
    "--ld-mw": px(lerp(o.width, f.width, mid)),
    "--ld-mh": px(lerp(o.height, f.height, mid)),
    "--ld-km": String(Math.round((1 + (k - 1) * midCamera) * 1000) / 1000),
    // `through`'s photographs behind the door: their own box, in the room's
    // coordinates, at the camera's inverse scale about the opening's centre,
    // and lifted to the lintel at rest.
    "--ld-mini-x": px(gx - ox),
    "--ld-mini-y": px(gy - oy),
    "--ld-mini-w": px(g.width),
    "--ld-mini-ox": px(cx - gx),
    "--ld-mini-oy": px(cy - gy),
    "--ld-mini-k": String(Math.round((1 / k) * 10000) / 10000),
    "--ld-mini-t0": px(t0),
    "--ld-mini-tm": px(t0 * (1 - midCamera)),
  };
}

/**
 * LENA'S CHOICE, AS THE QUEUE HOLDS IT: three files, made from the stills
 * standing in for her camera roll, so production's own chooser and sending
 * row draw them (object URLs and all) exactly as they draw hers.
 */
function useLenaPicks(on: boolean): readonly WaitPick[] {
  const [picks, setPicks] = useState<readonly WaitPick[]>([]);
  useEffect(() => {
    if (!on) return;
    let alive = true;
    void Promise.all(
      PICKS.map(async (p, i) => {
        const blob = await (await fetch(p.src)).blob();
        const file = new File([blob], `${p.id}.jpg`, { type: "image/jpeg" });
        return {
          id: `ld-pick-${i}`,
          file,
          kind: "photo" as const,
          status: "queued" as const,
          progress: 0,
        };
      }),
    )
      .then((made) => {
        if (alive) setPicks(made);
      })
      .catch(() => {
        // A still that did not load: the chooser draws its empty face.
      });
    return () => {
      alive = false;
    };
  }, [on]);
  return picks;
}

/** Her choice going in, at the beat: the queue's own progress on each. */
const sendingOf = (picks: readonly WaitPick[]): WaitPick[] =>
  picks.map((p, i) => ({
    ...p,
    status: "uploading",
    progress: [64, 38, 12][i] ?? 0,
  }));

export function RevealScene({
  reveal,
  moment,
  screen,
  at,
}: {
  reveal: Reveal;
  moment: Moment;
  screen: ScreenId;
  /** A still of one phase; a live scene loops through them all. */
  at?: Phase;
}) {
  const scene = useRef<HTMLDivElement>(null);
  const off = useOffStage(scene);
  const album = useAlbumHues();
  const steps = useMemo(() => timeline(moment, reveal), [moment, reveal]);
  const [run, setRun] = useState({ i: 0, loop: 0 });
  const live = at === undefined;

  // The timeline: one phase at a time, round again at its end. A hidden
  // option holds where it is.
  useEffect(() => {
    if (!live || off) return;
    const t = setTimeout(
      () =>
        setRun((r) =>
          r.i + 1 >= steps.length
            ? { i: 0, loop: r.loop + 1 }
            : { i: r.i + 1, loop: r.loop },
        ),
      steps[Math.min(run.i, steps.length - 1)].ms,
    );
    return () => clearTimeout(t);
  }, [live, off, run, steps]);

  const phase: Phase = at ?? steps[Math.min(run.i, steps.length - 1)].phase;

  // The geometry, read at rest (on mount, and whenever the frame's layout
  // settles: its fonts, its images' boxes).
  const [geo, setGeo] = useState<Geometry | null>(null);
  useLayoutEffect(() => {
    const el = scene.current;
    if (!el) return;
    const win = el.ownerDocument.defaultView;
    const read = () => {
      const g = measure(el);
      if (g) setGeo(g);
    };
    read();
    const timers = [300, 900].map((ms) => win?.setTimeout(read, ms));
    void el.ownerDocument.fonts?.ready.then(read).catch(() => {});
    return () => timers.forEach((t) => t && win?.clearTimeout(t));
  }, [screen, moment, reveal]);

  const picks = useLenaPicks(moment === "let-in");
  const waiting = phase === "ajar";
  const opened = !waiting;
  const hues = opened ? album : HOUSE;

  // `through`'s album behind the door: its photographs, as they stand on the
  // page, at the camera's inverse scale about the opening's centre.
  const mini =
    reveal === "through" && geo ? (
      <div
        aria-hidden
        className="ld-mini"
        style={{
          left: "var(--ld-mini-x)",
          top: "var(--ld-mini-y)",
          width: "var(--ld-mini-w)",
          transformOrigin: "var(--ld-mini-ox) var(--ld-mini-oy)",
          scale: "var(--ld-mini-k)",
        }}
      >
        <AlbumRows screen={screen} mini />
      </div>
    ) : null;

  let words: ReactNode;
  if (moment === "welcome") {
    words = (
      <WelcomeWords
        eventName={EVENT.name}
        hostName={HOST.name}
        eventDate={EVENT.date}
        mediaTotal={EVENT.count}
        acceptsVideo
        onContinue={() => {}}
      />
    );
  } else if (waiting) {
    words = <WaitingDoor hostName={HOST.name} picks={picks} />;
  } else {
    words = (
      <StageBeat
        slow={false}
        stalled={false}
        onRetry={() => {}}
        sending={
          picks.length > 0 ? (
            <SendingPicks picks={sendingOf(picks)} />
          ) : undefined
        }
      />
    );
  }

  const style = (geo ?? {}) as CSSProperties;

  return (
    <GuestPage who={moment === "welcome" ? "stranger" : LENA}>
      <div
        ref={scene}
        data-ld-scene={reveal}
        data-ld-phase={phase}
        data-ld-moment={moment}
        data-ld-landed={phase === "in" ? "" : undefined}
        data-ld-measured={geo ? "" : undefined}
        data-ld-timeline={live ? describe(steps) : undefined}
        className="relative min-h-0 flex-1"
        style={style}
      >
        <AlbumPage screen={screen} className="h-full" />
        <div
          key={live ? run.loop : "still"}
          data-ld-stage=""
          className="ld-stage"
        >
          <div className="ld-stage-ground" />
          <div className="ld-camera">
            <div className={DOOR_MAIN}>
              <div className="relative w-full max-w-sm sm:max-w-md">
                <DoorColumn
                  doorway={
                    <LdWay
                      state={waiting ? "ajar" : "open"}
                      from={moment === "let-in" ? "ajar" : "shut"}
                      reveal={reveal}
                      hues={hues}
                      photo={ALBUM[0].src}
                      mini={mini}
                    />
                  }
                >
                  <div
                    key={
                      moment === "welcome"
                        ? "welcome"
                        : waiting
                          ? "wait"
                          : "beat"
                    }
                    className="flex w-full flex-col items-center"
                  >
                    {words}
                  </div>
                </DoorColumn>
              </div>
            </div>
          </div>
        </div>
        {reveal === "light" && (
          <div
            aria-hidden
            className="ld-flood"
            style={
              {
                "--lit-h1": album[0],
                "--lit-h2": album[1],
                "--lit-h3": album[2],
              } as CSSProperties
            }
          >
            <div className="ld-flood-glow">
              <span className="ld-flood-shape" />
            </div>
            <span className="ld-flood-shape" />
          </div>
        )}
        {reveal === "one" && (
          <div aria-hidden className="ld-fly">
            {/* eslint-disable-next-line @next/next/no-img-element -- the same still the opening and the album's first tile show */}
            <img src={ALBUM[0].src} alt="" draggable={false} />
          </div>
        )}
      </div>
    </GuestPage>
  );
}
