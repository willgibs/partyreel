"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { CUT, EVENT, FILL_LABEL, GUEST_POOL, POOL, fillIds } from "./fixtures";
import type { FillId } from "./fixtures";
import {
  AlbumPage,
  BlockedLine,
  CUTS_IN_ALBUM,
  FIRST_HIDDEN,
  HIDDEN_COUNT,
  Fills,
  Finish,
  FrameProgress,
  Looks,
  MarkChip,
  MarkLine,
  PoolGrid,
  QuotedExportModal,
  ReelView,
  SettingsRow,
  StackingFrame,
  TileDescriptionEcho,
  WAIT_NOTE,
  WaitNote,
  hostPool,
} from "./parts";
import type {
  BlockedShape,
  FinishShape,
  LooksShape,
  MakeSlot,
  MarkShape,
} from "./parts";
import {
  Dock,
  MakeControl,
  Room,
  TODAY_ROOM,
  Tray,
  cutMeta,
  lookOf,
  roomOf,
  screenOf,
  type RoomShape,
  type ScreenId,
} from "./room";
import { Scene, TwoScreens, type Reader } from "./scene";
import { CutStill, useStills } from "./stills";
import { REEL_CUT } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE.
 *
 * ★ EVERY OPTION IS PRIYA'S OWN SCREEN, held at today's shape everywhere but
 * the one thing its decision asks. `entry`'s three vary only the transition
 * out of the reel; `room`'s only the creator's layout, drawn at both sizes at
 * once because that is its question; `looks`, `moments`, `blocked` and `wait`
 * are drawn INSIDE the room shape `room` landed on, because a question about
 * where a panel goes is meaningless in a room nobody has chosen; `finish`,
 * `mark` and `noencode` are roots and wear today's room.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (the discipline every
 * board over this album holds): a covered percentage, a count of looks
 * actually on screen, a door count, a word count. If the words above a frame
 * and the number under it disagree, the number is the truth.
 *
 * ★ AND EVERY OPTION IS A COMPONENT, NEVER A CALL. `useStills` subscribes to
 * the one engine pass, so a preview that is a plain function invoked inside
 * the step's own render would hang its hook off whatever component happened to
 * be rendering. Each option below is JSX with a scope of its own.
 */

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);
const roomIn = (s: BoardState): RoomShape => roomOf(s.room as string);
const lookIn = (s: BoardState): string => lookOf(s.look as string);
const fillOf = (v: string | undefined): FillId =>
  v === "mine" || v === "all" ? v : "reel";

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part * 100) / whole) : 0;

/** How much of the cut's own frame a panel is standing on. */
function covered(frame: DOMRect, panel: DOMRect | null): number {
  if (!panel) return 0;
  const w = Math.max(
    0,
    Math.min(frame.right, panel.right) - Math.max(frame.left, panel.left),
  );
  const h = Math.max(
    0,
    Math.min(frame.bottom, panel.bottom) - Math.max(frame.top, panel.top),
  );
  return pct(w * h, frame.width * frame.height);
}

const panelOf = (root: HTMLElement): DOMRect | null => {
  const el =
    root.querySelector<HTMLElement>("[data-rc-sheet]") ??
    root.querySelector<HTMLElement>("[data-rc-side]");
  return el ? el.getBoundingClientRect() : null;
};

const words = (text: string | null | undefined): number =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

/* ── 1. entry: is the reel still the ground, or has the cut taken over? ──── */

const measureEntry: Reader = (root, win) => {
  const cut = root.querySelector<HTMLElement>("[data-rc-cut]");
  if (!cut) return null;
  const c = cut.getBoundingClientRect();
  if (c.height < 8) return null;
  const area = win.innerWidth * win.innerHeight;
  const view = root.querySelector("[data-rc-view]");
  const work = root.querySelector<HTMLElement>("[data-rc-entry-work]");
  if (view && work) {
    const w = work.getBoundingClientRect();
    return `Measured: the reel's own view is still the ground, and the work over it takes ${pct(
      w.width * w.height,
      area,
    )} percent of the screen.`;
  }
  return `Measured: the view is gone. The cut's frame is ${Math.round(
    c.width,
  )} by ${Math.round(c.height)} px, ${pct(
    c.width * c.height,
    area,
  )} percent of the screen.`;
};

/** The creator's first panel, whichever surface it has risen into. */
function StartingPicks({ ids }: { ids: readonly string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Fills fill={CUT.fill} />
      <Dock ids={ids} note={null} />
      <Tray open="Moments" />
      <SettingsRow moments={ids.length} />
    </div>
  );
}

function EntryScene({
  shape,
  s,
}: {
  shape: "sheet" | "room" | "beneath";
  s: BoardState;
}) {
  const sc = screen(s);
  const { byFill } = useStills();
  const still = byFill.get(CUT.fill) ?? null;
  const ids = fillIds(CUT.fill, GUEST_POOL);
  return (
    <Scene
      id={`entry-${shape}`}
      screen={sc}
      title="The way in"
      measure={measureEntry}
    >
      {shape === "sheet" ? (
        <ReelView
          still={still}
          make="none"
          screen={sc}
          over={
            <div
              data-rc-entry-work
              className="absolute inset-x-0 bottom-0 z-20 rounded-t-float border-t border-white/10 bg-[oklch(0.13_0_0)] px-3 pt-3 pb-5"
            >
              <StartingPicks ids={ids} />
            </div>
          }
        />
      ) : shape === "room" ? (
        <Room
          screen={sc}
          shape={TODAY_ROOM}
          cut={<CutStill src={still} label="Your clip, one frame" />}
          meta={cutMeta(CUT.styleId, ids.length)}
          dock={ids}
          tray="Moments"
        />
      ) : (
        <AlbumPage still={still}>
          <div className="px-4 pt-4 pb-8">
            <div
              data-rc-entry-work
              className="rounded-float bg-[oklch(0.13_0_0)] px-3 pt-3 pb-4"
            >
              <p className="pb-2 text-micro font-medium tracking-[0.24em] text-white/50 uppercase">
                Your cut
              </p>
              <div className="mx-auto max-w-[190px]">
                <CutStill src={still} label="Your clip, one frame" />
              </div>
              <div className="pt-3">
                <StartingPicks ids={ids} />
              </div>
            </div>
          </div>
        </AlbumPage>
      )}
    </Scene>
  );
}

/* ── 2. room: what the open panel costs the cut, at a laptop ─────────────── */

const measureRoom: Reader = (root) => {
  const frame = root.querySelector<HTMLElement>("[data-rc-frame]");
  if (!frame) return null;
  const f = frame.getBoundingClientRect();
  if (f.height < 8) return null;
  const over = covered(f, panelOf(root));
  return `Measured at 1440: the cut is ${Math.round(f.width)} by ${Math.round(
    f.height,
  )} px, and the open panel covers ${over} percent of it.`;
};

function RoomBody({
  shape,
  sc,
  s,
}: {
  shape: RoomShape;
  sc: ScreenId;
  s: BoardState;
}) {
  const { byFill, byStyle } = useStills();
  const ids = fillIds(CUT.fill, GUEST_POOL);
  const styleId = lookIn(s);
  const panel = {
    label: "Style",
    body: <Looks shape="wall" byStyle={byStyle} picked={styleId} />,
  };
  return (
    <Room
      screen={sc}
      shape={shape}
      cut={
        <CutStill
          src={byStyle.get(styleId) ?? byFill.get(CUT.fill) ?? null}
          label="Your clip, one frame"
        />
      }
      meta={cutMeta(styleId, ids.length)}
      dock={ids}
      tray="Style"
      sheet={panel}
      side={panel}
    />
  );
}

function RoomScene({ shape, s }: { shape: RoomShape; s: BoardState }) {
  return (
    <TwoScreens
      id={`room-${shape}`}
      title="The room"
      measure={measureRoom}
      phone={<RoomBody shape={shape} sc="375" s={s} />}
      laptop={<RoomBody shape={shape} sc="1440" s={s} />}
    />
  );
}

/* ── 3. looks: how many of the fourteen are actually on screen ───────────── */

const measureLooks: Reader = (root, win) => {
  const tiles = root.querySelectorAll<HTMLElement>("[data-rc-look]");
  if (tiles.length === 0) return null;
  let seen = 0;
  tiles.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (
      r.width > 2 &&
      r.left < win.innerWidth &&
      r.right > 0 &&
      r.top < win.innerHeight &&
      r.bottom > 0
    )
      seen++;
  });
  const frame = root.querySelector<HTMLElement>("[data-rc-frame]");
  const over = frame
    ? covered(frame.getBoundingClientRect(), panelOf(root))
    : 0;
  return `Measured: ${seen} of the ${tiles.length} looks drawn are on screen, and the panel covers ${over} percent of the cut.`;
};

function LooksScene({ shape, s }: { shape: LooksShape; s: BoardState }) {
  const sc = screen(s);
  const { byStyle, byFill } = useStills();
  const styleId = lookIn(s);
  const ids = fillIds(CUT.fill, GUEST_POOL);
  const panel = {
    label: "Style",
    body: <Looks shape={shape} byStyle={byStyle} picked={styleId} />,
  };
  return (
    <Scene
      id={`looks-${shape}`}
      screen={sc}
      title="The looks"
      measure={measureLooks}
    >
      <Room
        screen={sc}
        shape={roomIn(s)}
        cut={
          <CutStill
            src={byStyle.get(styleId) ?? byFill.get(CUT.fill) ?? null}
            label="Your clip, one frame"
          />
        }
        meta={cutMeta(styleId, ids.length)}
        dock={ids}
        tray="Style"
        sheet={panel}
        side={panel}
      />
    </Scene>
  );
}

/* ── 4. moments: what the pool offers, and what it costs the cut ─────────── */

const measureMoments: Reader = (root) => {
  const tiles = root.querySelectorAll("[data-rc-pool] [data-rc-tile]");
  if (tiles.length === 0) return null;
  const chosen = root.querySelectorAll('[data-rc-tile="in"]').length;
  const frame = root.querySelector<HTMLElement>("[data-rc-cut]");
  const over = frame
    ? covered(frame.getBoundingClientRect(), panelOf(root))
    : 0;
  return `Measured: ${tiles.length} of the album's ${EVENT.items} items are offered. ${CUTS_IN_ALBUM} is a cut, which no cut may take, and ${HIDDEN_COUNT} are hidden, which a guest never sees at all. ${chosen} are in, and the pool covers ${over} percent of the cut.`;
};

type MomentsShape = "sheet" | "pool" | "tray";

function MomentsScene({ shape, s }: { shape: MomentsShape; s: BoardState }) {
  const sc = screen(s);
  const { byFill } = useStills();
  const fill = fillOf(s.fill as string);
  const ids = fillIds(fill, GUEST_POOL);
  const still = byFill.get(fill) ?? null;
  const grid = (
    <div className="flex flex-col">
      <Fills fill={fill} />
      <PoolGrid
        items={GUEST_POOL}
        selected={ids}
        blocked="tooltip"
        columns={4}
      />
    </div>
  );
  return (
    <Scene
      id={`moments-${shape}`}
      screen={sc}
      title="The moments"
      measure={measureMoments}
    >
      {shape === "tray" ? (
        <AlbumPage still={still}>
          <div className="px-4 pt-4 pb-28">
            <Fills fill={fill} />
            <div className="rounded-float bg-[oklch(0.13_0_0)] p-2">
              <PoolGrid
                items={GUEST_POOL}
                selected={ids}
                blocked="tooltip"
                columns={sc === "375" ? 3 : 5}
              />
            </div>
          </div>
          <div className="fixed inset-x-0 bottom-0 flex items-center gap-3 border-t border-white/10 bg-[oklch(0.13_0_0)] px-3 py-2.5">
            <div className="w-14 shrink-0">
              <CutStill src={still} label="Your clip, one frame" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-caption text-white/80">
                {cutMeta(CUT.styleId, ids.length)}
              </p>
              <p className="truncate text-micro text-white/45">
                {FILL_LABEL[fill]}
              </p>
            </div>
            <MakeControl label="Open" />
          </div>
        </AlbumPage>
      ) : (
        <Room
          screen={sc}
          shape={roomIn(s)}
          cut={<CutStill src={still} label="Your clip, one frame" />}
          meta={cutMeta(CUT.styleId, ids.length)}
          dock={shape === "pool" ? null : ids}
          tray="Moments"
          sheet={
            shape === "sheet"
              ? { label: "Moments", tall: true, body: grid }
              : null
          }
          side={shape === "sheet" ? { label: "Moments", body: grid } : null}
          foot={shape === "pool" ? grid : null}
        />
      )}
    </Scene>
  );
}

/* ── 5. blocked: does the reason reach a thumb at all? ───────────────────── */

const measureBlocked: Reader = (root) => {
  const blocked = root.querySelectorAll('[data-rc-tile="blocked"]').length;
  if (blocked === 0) return null;
  const said = root.querySelector<HTMLElement>("[data-rc-blocked]");
  if (!said) {
    return `Measured: ${blocked} blocked tiles, and nothing on the screen says why. A pointer gets the tooltip; a thumb gets nothing at all.`;
  }
  const kind = said.getAttribute("data-rc-blocked");
  return `Measured: ${blocked} blocked tiles, and the reason is ${
    kind === "caption"
      ? `on the photograph itself, ${words(said.textContent)} words, before anyone taps`
      : `${words(said.textContent)} words that arrive only after a tap or a pointer`
  }.`;
};

function BlockedScene({ shape, s }: { shape: BlockedShape; s: BoardState }) {
  const sc = screen(s);
  const { byFill } = useStills();
  const ids = fillIds(CUT.fill, POOL);
  const grid = (
    <div className="flex flex-col">
      <Fills fill={CUT.fill} />
      <PoolGrid
        items={hostPool()}
        selected={ids}
        blocked={shape}
        columns={4}
        hovered={shape === "tooltip" ? FIRST_HIDDEN : undefined}
      />
    </div>
  );
  const asPool = (s.moments as string) !== "sheet";
  return (
    <Scene
      id={`blocked-${shape}`}
      screen={sc}
      title="A tile no cut can take"
      measure={measureBlocked}
    >
      <Room
        screen={sc}
        shape={roomIn(s)}
        cut={
          <CutStill
            src={byFill.get(CUT.fill) ?? null}
            label="Your clip, one frame"
          />
        }
        meta={cutMeta(CUT.styleId, ids.length)}
        dock={asPool ? null : ids}
        tray="Moments"
        sheet={asPool ? null : { label: "Moments", tall: true, body: grid }}
        side={asPool ? null : { label: "Moments", body: grid }}
        foot={asPool ? grid : null}
        overlay={shape === "toast" ? <BlockedLine /> : null}
      />
    </Scene>
  );
}

/* ── 6. wait: what the export's minute takes, and what it covers ─────────── */

const measureWait: Reader = (root, win) => {
  const cut = root.querySelector<HTMLElement>("[data-rc-cut]");
  const run = root.querySelector<HTMLElement>("[data-rc-progress]");
  if (!cut || !run) return null;
  const c = cut.getBoundingClientRect();
  if (c.height < 8) return null;
  const r = run.getBoundingClientRect();
  const kind = run.getAttribute("data-rc-progress");
  const area = win.innerWidth * win.innerHeight;
  return `Measured: the wait takes ${pct(
    r.width * r.height,
    area,
  )} percent of the screen and covers ${
    kind === "stack" ? 100 : covered(c, r)
  } percent of the cut.`;
};

type WaitShape = "stack" | "bar" | "modal";

function WaitScene({ shape, s }: { shape: WaitShape; s: BoardState }) {
  const sc = screen(s);
  const { byFill } = useStills();
  const still = byFill.get(CUT.fill) ?? null;
  const ids = fillIds(CUT.fill, GUEST_POOL);
  return (
    <Scene
      id={`wait-${shape}`}
      screen={sc}
      title="The wait"
      measure={measureWait}
    >
      <Room
        screen={sc}
        shape={roomIn(s)}
        cut={
          shape === "stack" ? (
            <StackingFrame src={still} left={3} total={ids.length} />
          ) : (
            <CutStill src={still} label="Your clip, one frame" />
          )
        }
        meta={cutMeta(CUT.styleId, ids.length)}
        dock={null}
        tray={null}
        right={<MakeControl label="Making" />}
        frameFoot={shape === "bar" ? <FrameProgress progress={62} /> : null}
        overlay={shape === "modal" ? <QuotedExportModal progress={62} /> : null}
        underTray={<WaitNote>{WAIT_NOTE}</WaitNote>}
      />
    </Scene>
  );
}

/* ── 7. finish: how many doors, and which one leads ──────────────────────── */

const measureFinish: Reader = (root) => {
  const doors = root.querySelectorAll("[data-rc-door]");
  if (doors.length === 0) return null;
  const loud = root.querySelector<HTMLElement>('[data-rc-door="loud"]');
  const equal = root.querySelectorAll('[data-rc-door="equal"]').length;
  return loud
    ? `Measured: ${doors.length} doors, and one leads: ${loud.textContent?.trim()}, ${Math.round(
        loud.getBoundingClientRect().width,
      )} px wide.`
    : `Measured: ${doors.length} doors, ${equal} of them equal, and none of them leads.`;
};

function FinishScene({ shape, s }: { shape: FinishShape; s: BoardState }) {
  const sc = screen(s);
  const { byFill } = useStills();
  const paid = (s.plan as string) !== "free";
  return (
    <Scene
      id={`finish-${shape}`}
      screen={sc}
      title="The finish"
      measure={measureFinish}
    >
      <Finish shape={shape} paid={paid}>
        <CutStill
          src={byFill.get(CUT.fill) ?? null}
          label="Your finished clip, one frame"
        />
      </Finish>
    </Scene>
  );
}

/* ── 8. mark: the engine's own stamp, and what the room says about it ────── */

const measureMark: Reader = (root) => {
  const drawn = root.querySelector("[data-rc-cut] img");
  if (!drawn) return null;
  const said = root.querySelector<HTMLElement>("[data-rc-mark]");
  return `Measured: the mark is in the frame the engine drew, where the file will carry it. The room adds ${
    said ? `${words(said.textContent)} words about it` : "nothing about it"
  }.`;
};

function MarkScene({ shape, s }: { shape: MarkShape; s: BoardState }) {
  const sc = screen(s);
  const { marked } = useStills();
  const ids = fillIds(CUT.fill, GUEST_POOL);
  return (
    <Scene
      id={`mark-${shape}`}
      screen={sc}
      title="The free mark"
      measure={measureMark}
    >
      <Room
        screen={sc}
        shape={TODAY_ROOM}
        cut={
          <>
            <CutStill src={marked} label="Your clip, with the free mark" />
            {shape === "chip" ? <MarkChip /> : null}
          </>
        }
        meta={cutMeta(CUT.styleId, ids.length)}
        dock={ids}
        tray={null}
        underTray={shape === "line" ? <MarkLine /> : null}
      />
    </Scene>
  );
}

/* ── 9. noencode: what stands where the verb was ─────────────────────────── */

const measureNoencode: Reader = (root) => {
  const own = root.querySelector<HTMLElement>("[data-rc-make-own]");
  const line = root.querySelector<HTMLElement>("[data-rc-noencode-line]");
  const controls = root.querySelectorAll("[data-rc-view-control]").length;
  if (controls === 0) return null;
  return `Measured: ${
    own
      ? "a disabled control still stands in the chrome"
      : "no control stands here"
  }, and ${line ? `${words(line.textContent)} words say why` : "nothing says why"}.`;
};

const measureTileEcho: Reader = (root) => {
  const line = root.querySelector<HTMLElement>("[data-rc-tile-echo-line]");
  return `Measured: the tile's own description ${
    line ? `now reads "${line.textContent}"` : "is blank"
  }.`;
};

function NoencodeScene({
  shape,
  s,
}: {
  shape: "line" | "greyed" | "nothing";
  s: BoardState;
}) {
  const sc = screen(s);
  const { byFill } = useStills();
  const make: MakeSlot =
    shape === "nothing" ? "none" : shape === "line" ? "line" : "greyed";
  return (
    <div className="flex flex-wrap items-start gap-6">
      <Scene
        id={`noencode-${shape}`}
        screen={sc}
        title="No encoder here, the view"
        measure={measureNoencode}
      >
        <ReelView
          still={byFill.get("all") ?? byFill.get(CUT.fill) ?? null}
          make={make}
          screen={sc}
        />
      </Scene>
      <Scene
        id={`noencode-tile-${shape}`}
        screen={sc}
        title="No encoder here, the album's tile"
        measure={measureTileEcho}
      >
        <div className="flex min-h-full items-center justify-center bg-muted/30 p-6">
          <TileDescriptionEcho make={make} />
        </div>
      </Scene>
    </div>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_CUT> = {
  "entry.sheet": (s) => <EntryScene shape="sheet" s={s} />,
  "entry.room": (s) => <EntryScene shape="room" s={s} />,
  "entry.beneath": (s) => <EntryScene shape="beneath" s={s} />,

  "room.capped": (s) => <RoomScene shape="capped" s={s} />,
  "room.float": (s) => <RoomScene shape="float" s={s} />,
  "room.bench": (s) => <RoomScene shape="bench" s={s} />,

  "looks.wall": (s) => <LooksScene shape="wall" s={s} />,
  "looks.rail": (s) => <LooksScene shape="rail" s={s} />,
  "looks.three": (s) => <LooksScene shape="three" s={s} />,

  "moments.sheet": (s) => <MomentsScene shape="sheet" s={s} />,
  "moments.pool": (s) => <MomentsScene shape="pool" s={s} />,
  "moments.tray": (s) => <MomentsScene shape="tray" s={s} />,

  "blocked.caption": (s) => <BlockedScene shape="caption" s={s} />,
  "blocked.toast": (s) => <BlockedScene shape="toast" s={s} />,
  "blocked.tooltip": (s) => <BlockedScene shape="tooltip" s={s} />,

  "wait.stack": (s) => <WaitScene shape="stack" s={s} />,
  "wait.bar": (s) => <WaitScene shape="bar" s={s} />,
  "wait.modal": (s) => <WaitScene shape="modal" s={s} />,

  "finish.four": (s) => <FinishScene shape="four" s={s} />,
  "finish.share": (s) => <FinishScene shape="share" s={s} />,
  "finish.save": (s) => <FinishScene shape="save" s={s} />,

  "mark.line": (s) => <MarkScene shape="line" s={s} />,
  "mark.bare": (s) => <MarkScene shape="bare" s={s} />,
  "mark.chip": (s) => <MarkScene shape="chip" s={s} />,

  "noencode.line": (s) => <NoencodeScene shape="line" s={s} />,
  "noencode.greyed": (s) => <NoencodeScene shape="greyed" s={s} />,
  "noencode.nothing": (s) => <NoencodeScene shape="nothing" s={s} />,
};

export function ReelCutBoard() {
  return <ExplorationBoard spec={REEL_CUT} previews={PREVIEWS} />;
}
