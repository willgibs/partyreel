"use client";

import "./export-flow.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ListChecks } from "lucide-react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

import { ALBUMS, albumOf, PICKED, totalFor } from "./fixtures";
import {
  type CapMode,
  DownloadMenu,
  type MenuShape,
  type MenuVariant,
  shapeForWidth,
} from "./menu";
import { EXPORT_FLOW } from "./spec";
import {
  DownloadState,
  GuestGround,
  HostGround,
  NoMint,
  SCREENS,
  type ScreenId,
  screenOf,
  SelectBar,
  ShareSheet,
  Toast,
  TriggerWithMenu,
  WaitLine,
  type Who,
  whoOf,
} from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: the Download menu and the two album pages
 * it opens over, at a real 375 by 812 and a real 1440 by 900, over one
 * wedding.
 *
 * ★ THE MENU IS THE SHIPPED ONE, QUOTED (`menu.tsx`): rows at the thumb with
 * Cancel beneath in a hand, a menu under the Download that asked at a desk,
 * the product's one breakpoint deciding which, exactly as
 * `ui/responsive-menu.tsx` does. The old centred sheet this board was drawn on
 * retired with `object` (desk-trim, 2026-09-27) and is gone from every frame.
 *
 * ★ THE GROUND IS TODAY'S PRODUCT EXCEPT WHERE A DECISION IS STAGED. Every
 * picture is the shipped surface with ONE thing changed, so a decision never
 * arrives quietly wearing an answer he has not given. The two staged decisions
 * (`stuck`, `hollow`) ARE drawn wearing the wait they follow, because that is
 * what the staging is for: what a hollow zip says has no place until the wait
 * has one.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards, and the tile
 * Will judged showed the opposite of its words). Each caption is read off the
 * laid-out DOM inside the frame's own document once it settles. If the words
 * above a frame and the caption under it disagree, the caption is the truth.
 *
 * ★ NOTHING HERE MINTS. `NoMint` (surfaces.tsx) refuses any `/api/export`
 * request for as long as a preview is mounted, and the real triggers are drawn
 * inert.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

function Probe({
  read,
  onRead,
  children,
}: {
  read: Reader;
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  // The observer is the FRAME'S: the subtree lives in the iframe's document, so
  // it is watched with that window's ResizeObserver (it fires when the copied
  // stylesheets land, because the first layout is unstyled). The late passes
  // cover what an observer cannot see: photographs decoding at their natural
  // heights in rows that never changed width.
  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      try {
        const said = latest.current.read(el, win);
        if (said) latest.current.onRead(said);
      } catch {
        // Not laid out yet; the next timer or resize catches it.
      }
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    const late = [700, 1600, 2800].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (n: number, of: number) =>
  of <= 0 ? 0 : Math.round((n / of) * 100);

/** innerText, not textContent: a stack of blocks runs its words together otherwise. */
const words = (el: Element | null) =>
  ((el as HTMLElement | null)?.innerText ?? "").trim().replace(/\s+/g, " ");

/** The open menu's box, what it costs the screen, and what its rows say. */
function menuFacts(root: HTMLElement, win: Window) {
  const el = root.querySelector<HTMLElement>("[data-xf-menu]");
  if (!el) return null;
  const b = el.getBoundingClientRect();
  if (b.height < 8) return null;
  const rows = [...el.querySelectorAll<HTMLButtonElement>("[data-xf-row]")].map(
    (r) => ({
      label: words(r.querySelector("[data-xf-row-label]")),
      hint: words(r.querySelector("[data-xf-row-hint]")),
      dead: r.disabled,
    }),
  );
  return {
    shape: el.dataset.xfMenu as MenuShape,
    w: Math.round(b.width),
    h: Math.round(b.height),
    share: pct(b.width * b.height, win.innerWidth * win.innerHeight),
    rows,
    note: words(el.querySelector("[data-xf-note]")),
  };
}

/** Every control on the screen a finger could really use. */
const liveControls = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>("button")]
    .filter((el) => {
      if ((el as HTMLButtonElement).disabled) return false;
      if (el.hasAttribute("data-xf-busy")) return false;
      const b = el.getBoundingClientRect();
      if (b.width < 8 || b.height < 8) return false;
      return el.closest(".pointer-events-none") === null;
    })
    .map((el) => words(el))
    .filter(Boolean);

/** Where the wait is said on this screen, and in what words. */
function waitSurface(root: HTMLElement, win: Window) {
  const toast = root.querySelector<HTMLElement>("[data-xf-toast]");
  const line = root.querySelector<HTMLElement>("[data-xf-line]");
  const button = root.querySelector<HTMLElement>("[data-xf-button]");
  const at = toast ?? line ?? button;
  if (!at) return null;
  const b = at.getBoundingClientRect();
  const where = toast
    ? `a toast ${Math.round(b.top)} px from the top, ${pct(b.width * b.height, win.innerWidth * win.innerHeight)} percent of the screen`
    : line
      ? `a line of ${Math.round(b.height)} px under the album's row`
      : `the Download button itself, ${Math.round(b.width)} px wide`;
  return { where, said: words(at.querySelector("[data-xf-said]")), at };
}

/* the readers, one per decision */

const meansRead: Reader = (root, win) => {
  const m = menuFacts(root, win);
  if (!m) {
    const picked = root.querySelectorAll("[data-xf-picked]").length;
    const bar = root.querySelector<HTMLElement>("[data-xf-bar]");
    if (!bar) return null;
    return `Measured: no menu at all, ${picked} photographs ticked, and the bar is ${Math.round(bar.getBoundingClientRect().width)} px wide.`;
  }
  const first = m.rows[0];
  return `Measured: the menu is ${m.w} by ${m.h} px, ${m.share} percent of the screen, with ${m.rows.length} rows, the first "${first?.label}" at ${first?.hint}.`;
};

const waitRead: Reader = (root, win) => {
  const w = waitSurface(root, win);
  if (!w) return null;
  return `Measured: it is said on ${w.where}: "${w.said}".`;
};

const stuckRead: Reader = (root, win) => {
  const w = waitSurface(root, win);
  if (!w) return null;
  const live = liveControls(root);
  return `Measured: ${w.where} says "${w.said}", and the controls that still work are ${live.length === 0 ? "none at all" : live.map((l) => `"${l}"`).join(", ")}.`;
};

/**
 * ★ READS THE WHOLE SURFACE, NOT ITS HEADING. A first pass read the title
 * alone, and every option then measured "says nothing about what is in the
 * file", including the one whose words claim the opposite: the sign-backwards
 * failure PROGRAM.md warns about, caught by reading a capture against its own
 * caption.
 */
const hollowRead: Reader = (root, win) => {
  const w = waitSurface(root, win);
  if (!w) return null;
  const all = words(w.at);
  const counted = /\d+ of \d+|None of/.test(all);
  const retry = /Try again/.test(all);
  return `Measured: "${all}", which ${counted ? "counts what reached the file" : "counts nothing"} and ${retry ? "offers Try again" : "offers no way to fix it"}.`;
};

const capRead: Reader = (root, win) => {
  const m = menuFacts(root, win);
  if (!m) return null;
  const everything = m.rows.find((r) => /^Everything/.test(r.label));
  if (!everything) return null;
  return `Measured: the row reads "${everything.label}" and is ${everything.dead ? "dead" : "live"}; the note says "${m.note}", which ${/2,000/.test(m.note) ? "names the number" : "names no number"}.`;
};

const phoneRead: Reader = (root, win) => {
  const sheet = root.querySelector<HTMLElement>("[data-xf-sheet]");
  if (sheet) {
    const lead = words(root.querySelector("[data-xf-lead]"));
    return `Measured: the phone's own share sheet takes over, its top row already reading "${lead}" before anything is saved.`;
  }
  const m = menuFacts(root, win);
  if (!m) return null;
  return `Measured: the rows are ${m.rows.map((r) => `"${r.label}"`).join(", ")}; the note says "${m.note}".`;
};

/* ── the frame ───────────────────────────────────────────────────────────── */

function Screen({
  id,
  screen,
  caption,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  return (
    <Frame
      id={`xf-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <NoMint />
      <Probe read={read} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);
const whoFor = (s: BoardState): Who => whoOf(s.who);

type WaitShape = "toast" | "line" | "button";
const waitOf = (v: string | undefined): WaitShape =>
  v === "line" || v === "button" ? v : "toast";

/**
 * ONE ALBUM PAGE, EITHER SIDE, with the wait's three places as slots: the
 * Download trigger (the button's own state, or it with its desk menu), the
 * line under the album's row, and whatever floats over the page (a toast, a
 * hand's menu, the phone's sheet).
 */
function Ground({
  who,
  screen,
  count,
  download,
  under,
  children,
}: {
  who: Who;
  screen: ScreenId;
  count: number;
  download?: ReactNode;
  under?: ReactNode;
  children?: ReactNode;
}) {
  return who === "guest" ? (
    <GuestGround
      screen={screen}
      count={count}
      download={download}
      under={under}
    >
      {children}
    </GuestGround>
  ) : (
    <HostGround screen={screen} count={count} download={download} under={under}>
      {children}
    </HostGround>
  );
}

/**
 * THE MENU, OPEN, WHERE ITS SHAPE PUTS IT: under the trigger at a desk (the
 * trigger's own slot), rising over the page in a hand (the page's float).
 */
function MenuOn({
  who,
  screen,
  count,
  summary,
  variant,
}: {
  who: Who;
  screen: ScreenId;
  count: number;
  summary: Parameters<typeof DownloadMenu>[0]["summary"];
  variant?: MenuVariant;
}) {
  const shape = shapeForWidth(SCREENS[screen].w);
  const menu = (
    <DownloadMenu
      shape={shape}
      summary={summary}
      isHost={who === "host"}
      variant={variant}
    />
  );
  return (
    <Ground
      who={who}
      screen={screen}
      count={count}
      download={
        shape === "menu" ? <TriggerWithMenu who={who} menu={menu} /> : undefined
      }
    >
      {shape === "rows" ? menu : null}
    </Ground>
  );
}

/* ── 1. what a guest takes ───────────────────────────────────────────────── */

type MeansShape = "album" | "mine" | "picked";

const MEANS_CAPTION: Record<MeansShape, string> = {
  album:
    "Today. Download all's menu: Everything, Photos and Videos of all she can see, a row the act.",
  mine: "Yours leads the same menu as a fourth row, its own count and size; the album's three sit under it.",
  picked:
    "No menu: the album goes into a select mode of its own and the bar takes exactly what was ticked.",
};

function MeansScreen({ shape, s }: { shape: MeansShape; s: BoardState }) {
  const screen = screenFor(s);
  const album = albumOf(s.album);
  const count = totalFor(album.summary, "all", false).count;
  if (shape === "picked") {
    return (
      <Screen
        id={`means-${shape}`}
        screen={screen}
        read={meansRead}
        caption={MEANS_CAPTION[shape]}
      >
        <GuestGround
          screen={screen}
          count={count}
          picked={PICKED}
          row={
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="px-0.5 text-working text-muted-foreground tabular-nums">
                {PICKED.size} selected
              </span>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <ListChecks /> Done
              </Button>
            </div>
          }
        >
          <SelectBar n={PICKED.size} />
        </GuestGround>
      </Screen>
    );
  }
  return (
    <Screen
      id={`means-${shape}`}
      screen={screen}
      read={meansRead}
      caption={MEANS_CAPTION[shape]}
    >
      <MenuOn
        who="guest"
        screen={screen}
        count={count}
        summary={album.summary}
        variant={shape === "mine" ? { yours: album.mine } : undefined}
      />
    </Screen>
  );
}

/* ── 2. the wait ─────────────────────────────────────────────────────────── */

const WAIT_CAPTION: Record<WaitShape, string> = {
  toast:
    "Today, in the second the zip is prepared: the menu is gone and a toast at the top says so. Once the browser has it, the toast turns green: Your download is starting.",
  line: "The same second, and no toast: a line under the album's row, gone once the browser's own bar has it.",
  button:
    "The same second, and nothing new on the screen: the Download she tapped spins and says Preparing, then Downloading with a tick.",
};

function WaitScreen({ shape, s }: { shape: WaitShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const album = albumOf(s.album);
  const total = totalFor(album.summary, "all", false);
  const size = `${formatCount(total.count)} items, ${formatBytes(total.bytes)}`;
  return (
    <Screen
      id={`wait-${shape}`}
      screen={screen}
      read={waitRead}
      caption={WAIT_CAPTION[shape]}
    >
      <Ground
        who={who}
        screen={screen}
        count={total.count}
        download={
          shape === "button" ? (
            <DownloadState who={who} icon="spin" label="Preparing…" />
          ) : undefined
        }
        under={
          shape === "line" ? (
            <WaitLine icon="spin">Preparing your zip, {size}</WaitLine>
          ) : undefined
        }
      >
        {shape === "toast" ? (
          // The shipped words (`use-export-download.ts`'s `toast.loading`).
          <Toast screen={screen} tone="loading">
            Preparing your download…
          </Toast>
        ) : null}
      </Ground>
    </Screen>
  );
}

/* ── 3. a tap with no answer ─────────────────────────────────────────────── */

/**
 * `forever` is dropped: a failure's way out belongs on a real control.
 * `retry` is the middle door (boards refresh, 2026-09-24): quiet and automatic
 * where `timeout` and `cancel` are both something a person has to read or
 * press. Each is drawn in the place the wait's answer puts it.
 */
type StuckShape = "timeout" | "cancel" | "retry";

const STUCK_CAPTION: Record<StuckShape, string> = {
  timeout:
    "Ten seconds, given up on. The way forward is named where the wait was said.",
  cancel:
    "The first second, with the way out already there. It costs a control on every download that works.",
  retry:
    "Two silent re-attempts in, still inside the same ten seconds. Nothing to press; a third miss becomes the timeout.",
};

function StuckScreen({ shape, s }: { shape: StuckShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const total = totalFor(ALBUMS.wedding.summary, "all", false);
  const wait = waitOf(s.wait);
  const failed = shape === "timeout";
  const act = failed ? "Try again" : shape === "cancel" ? "Cancel" : undefined;
  const size = `${formatCount(total.count)} items, ${formatBytes(total.bytes)}`;

  const download =
    wait === "button" ? (
      failed ? (
        // The button handed back, as the act it now is.
        <DownloadState who={who} icon="warn" label="Try again" />
      ) : (
        <DownloadState
          who={who}
          icon="spin"
          label={shape === "retry" ? "Still trying…" : "Preparing…"}
          act={act}
        />
      )
    ) : undefined;

  const under =
    wait === "line" ? (
      <WaitLine icon={failed ? "warn" : "spin"} action={act}>
        {failed
          ? "Couldn't start that download"
          : shape === "retry"
            ? "Still trying to start your zip"
            : `Preparing your zip, ${size}`}
      </WaitLine>
    ) : undefined;

  return (
    <Screen
      id={`stuck-${shape}`}
      screen={screen}
      read={stuckRead}
      caption={STUCK_CAPTION[shape]}
    >
      <Ground
        who={who}
        screen={screen}
        count={total.count}
        download={download}
        under={under}
      >
        {wait === "toast" ? (
          <Toast
            screen={screen}
            tone={failed ? "error" : "loading"}
            action={act}
          >
            {failed
              ? "Couldn't start that download."
              : shape === "retry"
                ? "Still trying to start your download…"
                : "Preparing your download…"}
          </Toast>
        ) : null}
      </Ground>
    </Screen>
  );
}

/* ── 4. a zip with nothing in it ─────────────────────────────────────────── */

/**
 * `silence` left with the overtaken audit (nobody should have to check a
 * download for themselves) and `after` with the flow refresh (a count with no
 * way to fix it loses to `offer`). What is left is one question: whether a zip
 * that would hold NOTHING is sent at all. The short zip is the same under both
 * options by design: his `failed=exact` already says how it is said.
 */
type HollowShape = "refuse" | "offer";

const HOLLOW_CAPTION: Record<HollowShape, string> = {
  refuse:
    "No file is sent. The album says it changed, with Try again, where the wait was said; a short zip still lands, counted.",
  offer:
    "The empty zip lands in her Files and is said as a short one is, counted, with Try again, where the wait was said.",
};

function HollowScreen({ shape, s }: { shape: HollowShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const total = totalFor(ALBUMS.wedding.summary, "all", false);
  const wait = waitOf(s.wait);
  const empty = s.came !== "short";
  const n = formatCount(total.count);
  const missing = 6;
  const kept = formatCount(total.count - missing);

  // NEW COPY, in his `failed=exact` register: the count first, then the act.
  const said = !empty
    ? `${kept} of ${n} are in your zip.`
    : shape === "offer"
      ? `None of the ${n} are in your zip.`
      : "Nothing downloaded: the album changed.";
  const act = !empty ? `Try again for the ${missing}` : "Try again";
  // What the button itself has room for.
  const short = !empty
    ? `${kept} of ${n}`
    : shape === "offer"
      ? `0 of ${n}`
      : "Album changed";

  return (
    <Screen
      id={`hollow-${shape}`}
      screen={screen}
      read={hollowRead}
      caption={HOLLOW_CAPTION[shape]}
    >
      <Ground
        who={who}
        screen={screen}
        count={total.count}
        download={
          wait === "button" ? (
            <DownloadState who={who} icon="warn" label={short} act={act} />
          ) : undefined
        }
        under={
          wait === "line" ? (
            <WaitLine icon="warn" action={act}>
              {said}
            </WaitLine>
          ) : undefined
        }
      >
        {wait === "toast" ? (
          <Toast
            screen={screen}
            tone={empty ? "error" : "warning"}
            action={act}
          >
            {said}
          </Toast>
        ) : null}
      </Ground>
    </Screen>
  );
}

/* ── 5. the limit ────────────────────────────────────────────────────────── */

/**
 * ★ `bite` IS DROPPED (a refusal that names no number helps nobody), and it is
 * what ships, so every option here changes the menu: the note names the
 * number (`near`), the row takes the lot in parts (`split`), or the row keeps
 * the newest it can and says what it left (`auto`). Forced to the album where
 * the limit exists at all: on a wedding the three are one picture.
 */
type CapShape = Exclude<CapMode, "today">;

const CAP_CAPTION: Record<CapShape, string> = {
  near: "The same menu, with the number said: the rows over it stay dead, but the host knows why.",
  split:
    "The same album, taken home: Everything and Photos are live, and each says how many zips it will be.",
  auto: "The same album, taken home at once: each row keeps the newest it can in one zip and says what it left.",
};

function CapScreen({ shape, s }: { shape: CapShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const album = ALBUMS.over;
  return (
    <Screen
      id={`cap-${shape}`}
      screen={screen}
      read={capRead}
      caption={CAP_CAPTION[shape]}
    >
      <MenuOn
        who={who}
        screen={screen}
        count={totalFor(album.summary, "all", false).count}
        summary={album.summary}
        variant={{ cap: shape }}
      />
    </Screen>
  );
}

/* ── 6. where the file lands ─────────────────────────────────────────────── */

type PhoneShape = "zip" | "batch" | "both";

const PHONE_CAPTION: Record<PhoneShape, string> = {
  zip: "Today. The rows at the thumb, each one zip, which lands in Files: never the native library a phone expects.",
  batch:
    "A row's tap hands every file to the share sheet at once: its own Save leads into Photos, no zip involved.",
  both: "Save to Photos leads the rows, one tap to the share sheet; the zip rows stay under it, to Files.",
};

function PhoneScreen({ shape, s }: { shape: PhoneShape; s: BoardState }) {
  // ★ ALWAYS 375. This decision is about what a phone does, so the board's
  // screen knob is not on its strip and is not read here. The tile is
  // declared "phone" so the previews are that column.
  const screen: ScreenId = "375";
  const album = albumOf(s.album);
  const total = totalFor(album.summary, "all", false);
  return (
    <Screen
      id={`phone-${shape}`}
      screen={screen}
      read={phoneRead}
      caption={PHONE_CAPTION[shape]}
    >
      {shape === "batch" ? (
        <GuestGround screen={screen} count={total.count}>
          <ShareSheet size={formatBytes(total.bytes)} items={total.count} />
        </GuestGround>
      ) : (
        <MenuOn
          who="guest"
          screen={screen}
          count={total.count}
          summary={album.summary}
          variant={shape === "both" ? { photos: true } : undefined}
        />
      )}
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof EXPORT_FLOW> = {
  "means.album": (s) => <MeansScreen shape="album" s={s} />,
  "means.mine": (s) => <MeansScreen shape="mine" s={s} />,
  "means.picked": (s) => <MeansScreen shape="picked" s={s} />,

  "wait.toast": (s) => <WaitScreen shape="toast" s={s} />,
  "wait.line": (s) => <WaitScreen shape="line" s={s} />,
  "wait.button": (s) => <WaitScreen shape="button" s={s} />,

  "stuck.timeout": (s) => <StuckScreen shape="timeout" s={s} />,
  "stuck.cancel": (s) => <StuckScreen shape="cancel" s={s} />,
  "stuck.retry": (s) => <StuckScreen shape="retry" s={s} />,

  "hollow.refuse": (s) => <HollowScreen shape="refuse" s={s} />,
  "hollow.offer": (s) => <HollowScreen shape="offer" s={s} />,

  "cap.near": (s) => <CapScreen shape="near" s={s} />,
  "cap.split": (s) => <CapScreen shape="split" s={s} />,
  "cap.auto": (s) => <CapScreen shape="auto" s={s} />,

  "phone.zip": (s) => <PhoneScreen shape="zip" s={s} />,
  "phone.batch": (s) => <PhoneScreen shape="batch" s={s} />,
  "phone.both": (s) => <PhoneScreen shape="both" s={s} />,
};

export function ExportFlowBoard() {
  return <ExplorationBoard spec={EXPORT_FLOW} previews={PREVIEWS} />;
}
