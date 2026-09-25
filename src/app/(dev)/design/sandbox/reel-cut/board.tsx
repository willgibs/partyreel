"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { clipMeta, Head, LaptopBench, MarkLine } from "./bench";
import {
  HAND_MOMENTS,
  HandFor,
  LaptopFor,
  type Direction,
  type World,
} from "./directions";
import { fillIds } from "./fixtures";
import type { FillId, Maker } from "./fixtures";
import {
  AddConfirm,
  FinishPanel,
  FinishScreen,
  NoEncoderView,
  SaveMenu,
} from "./ground";
import { Scenes, type PhoneScene, type Reader } from "./scene";
import { ClipStill, useStill } from "./stills";
import { REEL_CUT } from "./spec";

/**
 * THE PREVIEWS: one ask, three whole creators, and the ground each is walked
 * through on the `stage` knob.
 *
 * ★ EVERY CAPTION IS READ OFF ITS OWN FRAME, NEVER ASSERTED (the discipline
 * every board over this album holds): the clip's size in px, how many of the
 * fourteen looks and of the pool's moments are actually in view (clipped by
 * every scroll box they sit in), whether anything covers the clip, the doors
 * a finish offers. If the words above a frame and the number under it
 * disagree, the number is the truth.
 *
 * ★ AND EVERY OPTION IS A COMPONENT, NEVER A CALL. The stills are hooks, so a
 * preview invoked as a plain function inside the step's own render would hang
 * its hooks off whatever component happened to be rendering.
 */

type Stage = "picking" | "making" | "finished" | "adding" | "noencode";

const stageOf = (v: string | undefined): Stage =>
  v === "making" || v === "finished" || v === "adding" || v === "noencode"
    ? v
    : "picking";

const lookOf = (v: string | undefined) =>
  v === "mono" || v === "polaroid" ? v : "classic";
const fillOf = (v: string | undefined): FillId =>
  v === "mine" || v === "all" ? v : "reel";
const makerOf = (v: string | undefined): Maker =>
  v === "host" ? "host" : "guest";

const worldOf = (s: BoardState): World => ({
  look: lookOf(s.look),
  fill: fillOf(s.fill),
  plan: s.plan === "free" ? "free" : "paid",
  maker: makerOf(s.maker),
});

/* ── what a reader can see: clipped by the frame and every scroll box ────── */

type Box = { left: number; top: number; right: number; bottom: number };

/** The part of an element's box actually on screen: the window and every
 *  ancestor that clips (a scroll box, the room's own overflow) cut it. A
 *  scrolled column's content reports a box far above its window, so nothing
 *  is compared on its raw rect. */
function shownBox(el: Element, win: Window): Box {
  const r = el.getBoundingClientRect();
  const box: Box = {
    left: Math.max(r.left, 0),
    top: Math.max(r.top, 0),
    right: Math.min(r.right, win.innerWidth),
    bottom: Math.min(r.bottom, win.innerHeight),
  };
  for (let p = el.parentElement; p; p = p.parentElement) {
    const cs = win.getComputedStyle(p);
    const cutX = cs.overflowX !== "visible";
    const cutY = cs.overflowY !== "visible";
    if (!cutX && !cutY) continue;
    const b = p.getBoundingClientRect();
    if (cutX) {
      box.left = Math.max(box.left, b.left);
      box.right = Math.min(box.right, b.right);
    }
    if (cutY) {
      box.top = Math.max(box.top, b.top);
      box.bottom = Math.min(box.bottom, b.bottom);
    }
  }
  return box;
}

const areaOf = (b: Box) =>
  Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);

/** The share of an element's box on screen. */
function visible(el: Element, win: Window): number {
  const r = el.getBoundingClientRect();
  const area = r.width * r.height;
  return area > 0 ? areaOf(shownBox(el, win)) / area : 0;
}

/** The clip itself, never one of the look tiles that also wear a frame. */
const heroOf = (root: HTMLElement) =>
  root.querySelector('[data-rc-clip="hero"]');

/** How many of these are at least mostly in view, and of how many. */
function inView(root: HTMLElement, win: Window, selector: string) {
  const all = [...root.querySelectorAll(selector)];
  return {
    seen: all.filter((el) => visible(el, win) >= 0.6).length,
    of: all.length,
  };
}

/** How much of the clip's own frame something else is standing on, each
 *  compared by the part of it a reader can actually see. */
function covered(root: HTMLElement, win: Window): number {
  const clip = heroOf(root);
  if (!clip) return 0;
  const c = clip.getBoundingClientRect();
  const whole = c.width * c.height;
  if (whole <= 0) return 0;
  let worst = 0;
  for (const el of root.querySelectorAll(
    "[data-rc-column], [data-rc-pool], [data-rc-looks], [data-rc-foot], [data-rc-tray]",
  )) {
    if (clip.contains(el) || el.contains(clip)) continue;
    const b = shownBox(el, win);
    const over = areaOf({
      left: Math.max(c.left, b.left),
      top: Math.max(c.top, b.top),
      right: Math.min(c.right, b.right),
      bottom: Math.min(c.bottom, b.bottom),
    });
    worst = Math.max(worst, over / whole);
  }
  return Math.round(worst * 100);
}

const px = (el: Element | null) => {
  const r = el?.getBoundingClientRect();
  return r ? `${Math.round(r.width)} by ${Math.round(r.height)} px` : "";
};

const words = (text: string | null | undefined): number =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

/** What the looks are, in this direction: tiles in view, or names on a dial. */
function looksSaid(root: HTMLElement, win: Window): string {
  if (root.querySelector('[data-rc-looks="dial"]')) {
    const names = inView(root, win, "[data-rc-dial-name]");
    return `the look is the clip itself, its name on a dial (${names.seen} names in view)`;
  }
  const looks = inView(root, win, "[data-rc-look]");
  return `${looks.seen} of ${looks.of} looks in view`;
}

/** And the moments: how many are in view, or that they wait behind a tap. */
function momentsSaid(root: HTMLElement, win: Window): string {
  const moments = inView(root, win, "[data-rc-moment]");
  return moments.of === 0
    ? "the moments wait behind the filmstrip's +"
    : `${moments.seen} of ${moments.of} moments in view`;
}

const readPicking =
  (at: "laptop" | "hand"): Reader =>
  (root, win) => {
    const clip = heroOf(root);
    if (!clip?.querySelector("img")) return null;
    const over = covered(root, win);
    const where = at === "laptop" ? "Measured at 1440" : "Measured at 375";
    const cover =
      over === 0 ? "nothing covers it" : `${over} percent of it is covered`;
    return `${where}: the clip is ${px(clip)} and ${cover}; ${looksSaid(root, win)}, and ${momentsSaid(root, win)}.`;
  };

const readMaking: Reader = (root) => {
  const stack = root.querySelector('[data-rc-progress="stack"]');
  if (!stack?.querySelector("img")) return null;
  const counted = stack.querySelector("p")?.textContent?.trim();
  const dimmed = root.querySelectorAll("[data-rc-inert]").length;
  return `Measured: the clip's own frame stacks and counts ("${counted}"), and ${dimmed} ${dimmed === 1 ? "part of the bench dims" : "parts of the bench dim"} until it is done.`;
};

const readFinish: Reader = (root) => {
  const doors = root.querySelectorAll("[data-rc-door]");
  const clip = heroOf(root);
  if (doors.length === 0 || !clip?.querySelector("img")) return null;
  const loud = root.querySelector('[data-rc-door="loud"]');
  const done = root.querySelectorAll("[data-rc-done]").length;
  const menu = root.querySelector("[data-rc-save-menu]");
  const confirm = root.querySelector("[data-rc-confirm]");
  const parts = [
    `${doors.length} doors, ${loud?.textContent?.trim()} leading at ${Math.round(
      loud?.getBoundingClientRect().width ?? 0,
    )} px`,
  ];
  if (menu)
    parts.push(
      `Save open on ${menu.querySelectorAll('[role="menuitem"]').length} options, ${menu
        .querySelector('[role="menuitem"]')
        ?.textContent?.trim()} first`,
    );
  if (confirm)
    parts.push(
      `a confirm of ${words(confirm.textContent)} words waits before anything is added`,
    );
  if (done > 0)
    parts.push(`${done} done ${done === 1 ? "state" : "states"} beside Share`);
  return `Measured: ${parts.join("; ")}; the clip stays on screen at ${px(clip)}.`;
};

const readNoEncoder: Reader = (root) => {
  const own = root.querySelector("[data-rc-make-own]");
  const bubble = root.querySelector("[data-rc-noencode-bubble]");
  if (!own) return null;
  return `Measured: Make your own still stands, disabled, and ${
    bubble
      ? `a tap bubbles up ${words(bubble.textContent)} words of why`
      : "nothing says why"
  }; nothing is written over the reel.`;
};

/* ── the ground stages, identical in every direction ─────────────────────── */

function useHero(world: World) {
  return useStill({
    style: world.look,
    fill: world.fill,
    maker: world.maker,
    mark: world.plan === "free",
    size: "hero",
  });
}

/** The finish at a laptop: the clip at full height, the panel its doors. */
function FinishedLaptop({
  world,
  confirm,
}: {
  world: World;
  confirm?: boolean;
}) {
  const hero = useHero(world);
  const ids = fillIds(world.fill, world.maker);
  const paid = world.plan === "paid";
  return (
    <LaptopBench
      head={
        <Head
          meta={clipMeta(world.look, ids.length)}
          right={<span className="w-[86px]" aria-hidden />}
        />
      }
      clip={<ClipStill src={hero} label="Your finished clip, one frame" />}
      underClip={
        world.plan === "free" ? <MarkLine maker={world.maker} /> : null
      }
      column={<FinishPanel paid={paid} />}
      overlay={confirm && paid ? <AddConfirm /> : null}
    />
  );
}

function FinishedHand({
  world,
  moment,
}: {
  world: World;
  moment: "rest" | "save" | "confirm" | "done";
}) {
  const hero = useHero(world);
  const paid = world.plan === "paid";
  return (
    <FinishScreen
      src={hero}
      paid={paid}
      done={moment === "done" ? (paid ? ["save", "add"] : ["save"]) : undefined}
      mark={
        world.plan === "free" ? (
          <MarkLine maker={world.maker} align="center" />
        ) : null
      }
      overlay={moment === "save" ? <SaveMenu /> : null}
    />
  );
}

function ConfirmHand({ world }: { world: World }) {
  const hero = useHero(world);
  const paid = world.plan === "paid";
  return (
    <div className="relative h-dvh">
      <FinishScreen src={hero} paid={paid} />
      {paid ? <AddConfirm /> : null}
    </div>
  );
}

function NoEncoderLaptop({ world }: { world: World }) {
  const hero = useStill({ style: world.look, fill: "all", size: "hero" });
  return <NoEncoderView still={hero} wide />;
}

function NoEncoderHand({ world }: { world: World }) {
  const hero = useStill({ style: world.look, fill: "all", size: "hero" });
  return <NoEncoderView still={hero} />;
}

/* ── one preview per direction ───────────────────────────────────────────── */

const TITLE: Record<Direction, string> = {
  column: "Both in the panel",
  strip: "Moments on the strip, looks beside",
  dial: "Looks on the clip, the album beside",
};

function BenchPreview({ dir, s }: { dir: Direction; s: BoardState }) {
  const world = worldOf(s);
  const stage = stageOf(s.stage);
  const id = `bench-${dir}-${stage}`;

  if (stage === "picking" || stage === "making") {
    const making = stage === "making";
    const [a, b] = HAND_MOMENTS[dir];
    const phones: PhoneScene[] = making
      ? [
          {
            title: "the clip stacks and counts",
            measure: readMaking,
            node: <HandFor dir={dir} world={world} at={a.at} making />,
          },
        ]
      : [
          {
            title: a.title,
            measure: readPicking("hand"),
            node: <HandFor dir={dir} world={world} at={a.at} />,
          },
          {
            title: b.title,
            measure: readPicking("hand"),
            node: <HandFor dir={dir} world={world} at={b.at} />,
          },
        ];
    return (
      <Scenes
        id={id}
        title={making ? `${TITLE[dir]}, making it` : TITLE[dir]}
        laptop={<LaptopFor dir={dir} world={world} making={making} />}
        measure={making ? readMaking : readPicking("laptop")}
        phones={phones}
      />
    );
  }

  if (stage === "noencode") {
    return (
      <Scenes
        id={id}
        title="No encoder here, the reel's own view"
        laptop={<NoEncoderLaptop world={world} />}
        measure={readNoEncoder}
        phones={[
          {
            title: "the greyed door, just tapped",
            measure: readNoEncoder,
            node: <NoEncoderHand world={world} />,
          },
        ]}
      />
    );
  }

  // A free event has no Add to event, so there is no confirm to draw: the
  // stage says so and shows the finish with Save alone under Share.
  const free = world.plan === "free";
  const adding = stage === "adding";
  return (
    <Scenes
      id={id}
      title={
        adding
          ? free
            ? "Add to event, which a free event does not offer"
            : "Add to event, the confirm"
          : "The finish"
      }
      laptop={<FinishedLaptop world={world} confirm={adding} />}
      measure={readFinish}
      phones={
        adding
          ? [
              {
                title: free
                  ? "no Add to event, so nothing to confirm"
                  : "the confirm before anything is added",
                measure: readFinish,
                node: <ConfirmHand world={world} />,
              },
              {
                title: free
                  ? "after Save, still on the finish"
                  : "after Save and Add, still on the finish",
                measure: readFinish,
                node: <FinishedHand world={world} moment="done" />,
              },
            ]
          : [
              {
                title: "the finish, as he amended it",
                measure: readFinish,
                node: <FinishedHand world={world} moment="rest" />,
              },
              {
                title: "Save's options on iOS",
                measure: readFinish,
                node: <FinishedHand world={world} moment="save" />,
              },
            ]
      }
    />
  );
}

const PREVIEWS: PreviewsFor<typeof REEL_CUT> = {
  "bench.column": (s) => <BenchPreview dir="column" s={s} />,
  "bench.strip": (s) => <BenchPreview dir="strip" s={s} />,
  "bench.dial": (s) => <BenchPreview dir="dial" s={s} />,
};

export function ReelCutBoard() {
  return <ExplorationBoard spec={REEL_CUT} previews={PREVIEWS} />;
}
