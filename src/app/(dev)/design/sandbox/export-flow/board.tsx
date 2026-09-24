"use client";

import "./export-flow.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Check, Download, Image as ImageIcon, ListChecks } from "lucide-react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

import {
  BundleRows,
  type CapMode,
  ChipRow,
  Foot,
  Head,
  HiddenRow,
  Shell,
  WorkBody,
} from "./dialog";
import { ALBUMS, albumOf, MINE, TILES, totalFor } from "./fixtures";
import { EXPORT_FLOW } from "./spec";
import {
  GuestAlbum,
  HostGallery,
  IosBar,
  NoMint,
  SCREENS,
  type ScreenId,
  screenOf,
  SelectBar,
  ShareSheet,
  Toast,
  UnderLine,
  type Who,
  whoOf,
} from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: the download sheet and the two surfaces it
 * opens over, at a real 375 by 812 and a real 1440 by 900, over one wedding.
 *
 * ★ THE SURFACE IS THE ONE RESPONSIVE SHEET (guest-shape r1, folded in by the
 * overtaken audit 2026-09-21): a bottom sheet in a hand, a side panel at a
 * desk. The shipped export dialog is still a centred `Dialog`, and drawing it
 * that way would have every option of this board answered on a surface
 * production has already moved past. The reshaped questions are asked on the
 * sheet; the swap itself is the wiring lane's, not a question here.
 *
 * ★ THE GROUND IS TODAY'S PRODUCT EXCEPT WHERE A DECISION IS STAGED. Every
 * picture is the shipped surface with ONE thing changed, so a decision never
 * arrives quietly wearing an answer he has not given. The three staged
 * decisions (`stuck`, `hollow`, `phone`) ARE drawn wearing the answer they
 * wait on, because that is what the staging is for: what a hollow zip should
 * say has no shape until the wait has one.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED (docs/PROGRAM.md:
 * a board once drew an option with its formula's sign backwards, and the tile
 * Will judged showed the opposite of its words). Each caption is read off the
 * laid-out DOM inside the frame's own document once it settles: how big the
 * sheet really is, how many controls on the screen can really be pressed, and
 * what the foot really says. If the words above a frame and the caption under
 * it disagree, the caption is the truth.
 *
 * ★ NOTHING HERE MINTS. `NoMint` (surfaces.tsx) refuses any `/api/export`
 * request for as long as a preview is mounted; the real triggers are drawn
 * inert; the dialog's own body is reproduced rather than opened, because the
 * shipped one is a radix Dialog that portals out of the frame AND fetches a
 * summary the moment it opens.
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
  // heights in columns that never changed width.
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
        // Not portalled in yet; the next timer or resize catches it.
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

const text = (el: Element | null) => (el?.textContent ?? "").trim();

/** The sheet's own box, and what it costs the screen. */
function dialogFacts(root: HTMLElement, win: Window) {
  const el = root.querySelector<HTMLElement>("[data-xf-dialog]");
  if (!el) return null;
  const b = el.getBoundingClientRect();
  if (b.height < 8) return null;
  return {
    w: Math.round(b.width),
    h: Math.round(b.height),
    share: pct(b.width * b.height, win.innerWidth * win.innerHeight),
  };
}

/** Every control on the screen a finger could really use. */
const liveControls = (root: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>("button")]
    .filter((el) => {
      if ((el as HTMLButtonElement).disabled) return false;
      const b = el.getBoundingClientRect();
      if (b.width < 8 || b.height < 8) return false;
      return el.closest(".pointer-events-none") === null;
    })
    .map((el) => text(el).replace(/\s+/g, " "))
    .filter(Boolean);

/* the readers, one per decision */

const meansRead: Reader = (root, win) => {
  const d = dialogFacts(root, win);
  const bundles = root.querySelectorAll("[data-xf-bundles] button").length;
  if (!d) {
    const picked = root.querySelectorAll("[data-xf-picked]").length;
    const bar = root.querySelector<HTMLElement>("[data-xf-bar]");
    if (!bar) return null;
    return `Measured: no sheet at all, ${picked} tiles already picked, and the bar is ${Math.round(bar.getBoundingClientRect().width)} px wide.`;
  }
  return `Measured: the sheet is ${d.w} by ${d.h} px, ${d.share} percent of the screen, and offers ${bundles === 0 ? "one bundle and no choice of set" : `${bundles} bundles above the chips`}.`;
};

const waitRead: Reader = (root, win) => {
  const d = dialogFacts(root, win);
  const toast = root.querySelector<HTMLElement>("[data-xf-toast]");
  const line = root.querySelector<HTMLElement>("[data-xf-line]");
  const surface = d
    ? `a sheet at ${d.share} percent of the screen`
    : toast
      ? `a toast of ${pct(toast.getBoundingClientRect().width * toast.getBoundingClientRect().height, win.innerWidth * win.innerHeight)} percent`
      : line
        ? `a line of ${Math.round(line.getBoundingClientRect().height)} px under the header`
        : "nothing";
  const said = text(root.querySelector("[data-xf-said]"));
  return `Measured: what the album shows is ${surface}, saying "${said || "nothing"}".`;
};

const stuckRead: Reader = (root) => {
  const live = liveControls(root);
  const said = text(root.querySelector("[data-xf-said]"));
  return `Measured: it says "${said || "nothing"}", and the controls on the screen that still work are ${live.length === 0 ? "none at all" : live.map((l) => `"${l}"`).join(", ")}.`;
};

/**
 * ★ READS THE WHOLE SURFACE, NOT ITS HEADING. The first pass read
 * `[data-xf-said]`, which in the dialog is the title line; every option then
 * measured "says nothing about what is in the file", including the one whose
 * words claim the opposite. That is the sign-backwards failure PROGRAM.md
 * warns about, caught by reading a capture against its own caption.
 */
const hollowRead: Reader = (root) => {
  const surface =
    root.querySelector("[data-xf-work]") ??
    root.querySelector("[data-xf-line]") ??
    root.querySelector("[data-xf-toast]");
  // innerText, not textContent: the surface is a stack of block elements and
  // textContent runs their words together ("...downloads148 items...").
  const said = ((surface as HTMLElement | null)?.innerText ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const counted = /\d+ of \d+|All \d+/.test(said);
  return `Measured: the screen says "${said || "nothing"}", which ${counted ? "counts what really reached the file" : "says nothing about what is in the file"}.`;
};

const capRead: Reader = (root) => {
  const go = root.querySelector<HTMLButtonElement>("[data-xf-go]");
  const warn = text(root.querySelector("[data-xf-warn]"));
  const count = text(root.querySelector("[data-xf-count]"));
  if (!go) return null;
  const said = warn || count;
  return `Measured: the button reads "${text(go)}" and is ${go.disabled ? "dead" : "live"}; the foot says "${said}", which ${/2,000|2,440/.test(said) ? "names the number" : "names no number"}.`;
};

const objectRead: Reader = (root, win) => {
  const d = dialogFacts(root, win);
  if (d) {
    const chips = root.querySelectorAll("[data-xf-chip]").length;
    return `Measured: the sheet is ${d.w} by ${d.h} px, ${d.share} percent of the screen, and holds ${chips} chips, the size and the button.`;
  }
  const menu = root.querySelector<HTMLElement>("[data-xf-menu]");
  if (menu) {
    const b = menu.getBoundingClientRect();
    const chips = root.querySelectorAll("[data-xf-chip]").length;
    return `Measured: the menu is ${Math.round(b.width)} by ${Math.round(b.height)} px, ${pct(b.width * b.height, win.innerWidth * win.innerHeight)} percent of the screen, and holds ${chips} chips, the size and the button.`;
  }
  const bar = root.querySelector("[data-xf-bar]");
  return `Measured: no sheet, ${bar ? "the select bar is the only chrome" : "nothing between the tap and the file"}, and the chips are nowhere on the screen.`;
};

const phoneRead: Reader = (root) => {
  const sheet = root.querySelector<HTMLElement>("[data-xf-sheet]");
  if (sheet) {
    const lead = root.querySelector("[data-xf-lead]");
    return lead
      ? `Measured: the phone's own share sheet takes over, its own top row already reading "${lead.textContent?.trim()}" before anything is saved.`
      : `Measured: the phone's own sheet takes ${Math.round(sheet.getBoundingClientRect().height)} px, and the zip is named on it before anything is saved.`;
  }
  const body = text(root);
  const photos = /Save to Photos/.test(body);
  const files = /to Files/.test(body);
  if (photos && files)
    return "Measured: the foot offers both, Save to Photos first and the zip to Files second.";
  if (photos) return "Measured: the foot's own button already says Save to Photos.";
  return `Measured: ${files ? "the words on the screen name where the file lands" : "nothing on the screen names where the file lands"}, and the only sign of it is the browser's own arrow.`;
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

/** The album the ground draws and the sheet counts, from the knob. */
const albumFor = (s: BoardState) => albumOf(s.album);

/* ── 1. what a guest takes ───────────────────────────────────────────────── */

type MeansShape = "album" | "mine" | "picked";

const MEANS_CAPTION: Record<MeansShape, string> = {
  album:
    "Today. One link, the host's own sheet, and a zip of everything the guest can see.",
  mine: "Their own set leads and the whole album is the row under it. The chips then filter whichever is chosen.",
  picked:
    "No sheet: the album goes into select mode and the bar takes exactly what was tapped.",
};

function PickedGrid() {
  return (
    <MasonryColumns
      items={TILES}
      renderOverlay={(item) =>
        MINE.has(item.id) ? (
          <span
            data-xf-picked
            className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
          >
            <Check className="size-3" />
          </span>
        ) : null
      }
    />
  );
}

function MeansScreen({ shape, s }: { shape: MeansShape; s: BoardState }) {
  const screen = screenFor(s);
  const album = albumFor(s);
  const mineTotal = totalFor(album.mine, "all", false);
  if (shape === "picked") {
    return (
      <Screen
        id={`means-${shape}`}
        screen={screen}
        read={meansRead}
        caption={MEANS_CAPTION[shape]}
      >
        <GuestAlbum
          screen={screen}
          count={totalFor(album.summary, "all", false).count}
          grid={<PickedGrid />}
          row={
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {MINE.size} selected
              </span>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                <ListChecks /> Done
              </Button>
            </div>
          }
        >
          <SelectBar n={MINE.size} />
        </GuestAlbum>
      </Screen>
    );
  }
  const summary = shape === "mine" ? album.mine : album.summary;
  return (
    <Screen
      id={`means-${shape}`}
      screen={screen}
      read={meansRead}
      caption={MEANS_CAPTION[shape]}
    >
      <GuestAlbum
        screen={screen}
        count={totalFor(album.summary, "all", false).count}
      >
        <Shell>
          <Head
            description={
              shape === "mine"
                ? "Take yours, or take the lot."
                : "Pick what to bundle into your copy."
            }
          />
          {shape === "mine" && mineTotal.count > 0 ? (
            <BundleRows album={album} chosen="mine" />
          ) : null}
          <ChipRow summary={summary} types="all" />
          <Foot summary={summary} types="all" />
        </Shell>
      </GuestAlbum>
    </Screen>
  );
}

/* ── 3. the wait ─────────────────────────────────────────────────────────── */

type WaitShape = "toast" | "panel" | "line";
const waitOf = (v: string | undefined): WaitShape =>
  v === "panel" || v === "line" ? v : "toast";

const WAIT_CAPTION: Record<WaitShape, string> = {
  toast:
    "Today, one second after the tap. The sheet is gone, the toast is leaving, and the app knows nothing more.",
  panel:
    "The same second, in the sheet that was already open. It holds the count, the size and a bar, and Cancel is on it.",
  line: "The sheet closed and the album is usable. One line under its own header carries the wait.",
};

/** Whichever album surface the asker is standing on. */
function Ground({
  who,
  screen,
  count,
  under,
  /** `object=menu`'s own door, anchored where the real one sits. */
  door,
  children,
}: {
  who: Who;
  screen: ScreenId;
  count: number;
  under?: ReactNode;
  door?: ReactNode;
  children?: ReactNode;
}) {
  return who === "guest" ? (
    <GuestAlbum screen={screen} count={count} row={door}>
      {/* The guest album has no section header to hang a line under, so the
          wait's line rides the same slot the sheet and the toast do. */}
      {under}
      {children}
    </GuestAlbum>
  ) : (
    <HostGallery screen={screen} count={count} under={under} action={door}>
      {children}
    </HostGallery>
  );
}

function WaitScreen({ shape, s }: { shape: WaitShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const album = albumFor(s);
  const total = totalFor(album.summary, "all", false);
  const line = `Building your zip, ${total.count.toLocaleString("en-US")} items, ${formatBytes(total.bytes)}`;
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
        under={shape === "line" ? <UnderLine>{line}</UnderLine> : undefined}
      >
        {shape === "toast" ? (
          <Toast screen={screen} tone="success">
            Your download is starting.
          </Toast>
        ) : null}
        {shape === "panel" ? (
          <Shell>
            <Head description="" />
            <WorkBody
              summary={album.summary}
              types="all"
              percent={62}
              state="working"
            />
          </Shell>
        ) : null}
      </Ground>
    </Screen>
  );
}

/* ── 4. a tap with no answer ─────────────────────────────────────────────── */

/**
 * `forever` is dropped: a failure's way out belongs on a real button. `retry`
 * is the new middle door (boards refresh, 2026-09-24): quiet and automatic
 * where `timeout` and `cancel` are both something a person has to read or
 * press.
 */
type StuckShape = "timeout" | "cancel" | "retry";

const STUCK_CAPTION: Record<StuckShape, string> = {
  timeout:
    "The same ten seconds, given up on. The button is back and the way forward is named.",
  cancel:
    "The first second, with the way out already there. It costs a control on every download that works.",
  retry:
    "Two silent re-attempts in, still inside the same ten seconds. Nothing to read, nothing to press; a third miss becomes the timeout.",
};

function StuckScreen({ shape, s }: { shape: StuckShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const album = albumFor(s);
  const total = totalFor(album.summary, "all", false);
  const wait = waitOf(s.wait);
  const failed = shape === "timeout";

  const said = failed
    ? "Couldn't start that download."
    : shape === "retry"
      ? "Still trying to start your download…"
      : "Preparing your download…";

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
        under={
          wait === "line" ? (
            <UnderLine
              icon={failed ? "warn" : "spin"}
              action={failed ? "Try again" : shape === "cancel" ? "Cancel" : undefined}
            >
              {said}
            </UnderLine>
          ) : undefined
        }
      >
        {wait === "toast" ? (
          <Toast screen={screen} tone={failed ? "error" : "loading"}>
            {said}
            {failed ? (
              <span className="ml-2 font-medium underline underline-offset-2">
                Try again
              </span>
            ) : shape === "cancel" ? (
              <span className="ml-2 font-medium underline underline-offset-2">
                Cancel
              </span>
            ) : null}
          </Toast>
        ) : null}
        {wait === "panel" ? (
          <Shell>
            <Head description="" />
            <div className="flex flex-col gap-3" data-xf-work>
              <p className="text-sm font-medium" data-xf-said>
                {failed
                  ? "That download did not start"
                  : shape === "retry"
                    ? "Still building your zip"
                    : "Building your zip"}
              </p>
              <p className="text-xs text-muted-foreground">
                {failed
                  ? "Nothing came back. Your album has not changed."
                  : shape === "retry"
                    ? "One attempt didn't answer. Trying again on its own."
                    : `${total.count.toLocaleString("en-US")} items, ${formatBytes(total.bytes)}`}
              </p>
              <div className="flex justify-end gap-2">
                {failed ? (
                  <Button type="button" size="sm">
                    Try again
                  </Button>
                ) : shape === "cancel" ? (
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </Shell>
        ) : null}
      </Ground>
    </Screen>
  );
}

/* ── 5. a zip with nothing in it ─────────────────────────────────────────── */

/**
 * `silence` is dropped: nobody should have to check for themselves whether a
 * download really has everything in it. `offer` is the new third (boards
 * refresh, 2026-09-24): the same count as `after`, with the one-tap way out
 * `refuse` already offers, on every wait surface rather than only the panel.
 */
type HollowShape = "after" | "refuse" | "offer";

const HOLLOW_CAPTION: Record<HollowShape, string> = {
  after:
    "The same moment, counted. What really reached the file is on the screen, whether that is six missing or all of them.",
  refuse:
    "Nothing is saved at all. The album says it changed, and the only thing offered is another go.",
  offer:
    "The same count as 'It says what did not make it', with Try again beside it wherever the wait is shown.",
};

function HollowScreen({ shape, s }: { shape: HollowShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const album = albumFor(s);
  const total = totalFor(album.summary, "all", false);
  const wait = waitOf(s.wait);
  const kept = Math.max(0, total.count - 6);
  // `after` and `offer` share the same counted line; `offer` and `refuse`
  // share the one-tap way out, drawn on every wait surface for `offer` rather
  // than only where `WorkBody`'s own fallback happens to add one.
  const counted = shape !== "refuse";
  const offersRetry = shape !== "after";

  const said = counted
    ? `${kept.toLocaleString("en-US")} of ${total.count.toLocaleString("en-US")} items are in your zip. Six could not be found.`
    : "The album changed while your zip was being made.";

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
        under={
          wait === "line" ? (
            <UnderLine icon="warn" action={offersRetry ? "Try again" : undefined}>
              {said}
            </UnderLine>
          ) : undefined
        }
      >
        {wait === "toast" ? (
          <Toast screen={screen} tone="error">
            {said}
            {offersRetry ? (
              <span className="ml-2 font-medium underline underline-offset-2">
                Try again
              </span>
            ) : null}
          </Toast>
        ) : null}
        {wait === "panel" ? (
          <Shell>
            <Head description="" />
            <WorkBody
              summary={album.summary}
              types="all"
              percent={100}
              state={counted ? "partial" : "failed"}
              retry={offersRetry}
            />
          </Shell>
        ) : null}
      </Ground>
    </Screen>
  );
}

/* ── 6. the limit ────────────────────────────────────────────────────────── */

/**
 * ★ `bite` IS DROPPED (a refusal that names no number helps nobody). `CapMode`
 * keeps the word because it is `Foot`'s DEFAULT, which is what every other
 * decision's foot draws; only this ask lost it as an answer. `auto` is the new
 * third (boards refresh, 2026-09-24): `Foot` trims to the ceiling itself
 * rather than either warning about it (`near`) or working around it in several
 * files (`split`).
 */
type CapShape = Exclude<CapMode, "bite">;

const CAP_CAPTION: Record<CapShape, string> = {
  near: "The same album, with the number said. It is still a refusal, but the host knows what they are up against.",
  split:
    "The same album, taken home. The foot says how many files it will be and the button says it too.",
  auto: "The same album, taken home at once: the newest 2,000 zip immediately, and the foot names what it left behind.",
};

function CapScreen({ shape, s }: { shape: CapShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  // Forced to the album where the limit exists at all: on a wedding the three
  // options are one picture, which is a dead step.
  const album = ALBUMS.over;
  const total = totalFor(album.summary, "all", false);
  return (
    <Screen
      id={`cap-${shape}`}
      screen={screen}
      read={capRead}
      caption={CAP_CAPTION[shape]}
    >
      <Ground who={who} screen={screen} count={total.count}>
        <Shell>
          <Head />
          <ChipRow summary={album.summary} types="all" />
          {who === "host" ? (
            <HiddenRow summary={album.summary} checked={false} />
          ) : null}
          <Foot summary={album.summary} types="all" cap={shape} />
        </Shell>
      </Ground>
    </Screen>
  );
}

/* ── 7. what keeping it means ────────────────────────────────────────────── */

/**
 * `link` is dropped: the album's address and its copy sit twice on the page
 * already. `menu` is the new third (boards refresh, 2026-09-24): the same
 * chips, size and button as `zip`, anchored under Download as a popover
 * rather than taking the responsive sheet's own posture.
 */
type ObjectShape = "zip" | "straight" | "menu";
const objectOf = (v: string | undefined): ObjectShape =>
  v === "straight" ? "straight" : v === "menu" ? "menu" : "zip";

const OBJECT_CAPTION: Record<ObjectShape, string> = {
  zip: "Today. Three chips, a size and a button, on the sheet every other decision here happens on.",
  straight:
    "The sheet is gone entirely: the tap starts the download, and anyone who wants less picks tiles instead.",
  menu: "The same chips, size and button, in a popover under Download rather than a sheet over the album.",
};

/**
 * `object=menu`'s own door: Download stays where it is and the couple of
 * bundle choices open right under it. `position: absolute`, not fixed like
 * `.xf-dialog`: every capture here starts scrolled to the top and the anchor
 * is a few pixels down in the header, so nothing here has a scroll position
 * to fall out of view at (`export-flow.css`'s own note on why the sheet is
 * fixed does not apply to a popover that never has to survive a scroll).
 */
function MenuDoor({ children }: { children: ReactNode }) {
  return (
    <div className="relative mb-3 flex justify-end" data-xf-door>
      <Button type="button" variant="outline" size="sm" tabIndex={-1}>
        <Download /> Download
      </Button>
      <div
        className="xf-menu absolute top-full right-0 z-20 mt-1.5"
        data-xf-menu
        role="menu"
        aria-label="Download album"
      >
        {children}
      </div>
    </div>
  );
}

function ObjectScreen({ shape, s }: { shape: ObjectShape; s: BoardState }) {
  const screen = screenFor(s);
  const who = whoFor(s);
  const album = albumFor(s);
  const total = totalFor(album.summary, "all", false);
  if (shape === "straight") {
    return (
      <Screen
        id={`object-${shape}`}
        screen={screen}
        read={objectRead}
        caption={OBJECT_CAPTION[shape]}
      >
        <Ground who={who} screen={screen} count={total.count}>
          <SelectBar n={MINE.size} />
          <Toast screen={screen} tone="success">
            Your download is starting.
          </Toast>
        </Ground>
      </Screen>
    );
  }
  if (shape === "menu") {
    return (
      <Screen
        id={`object-${shape}`}
        screen={screen}
        read={objectRead}
        caption={OBJECT_CAPTION[shape]}
      >
        <Ground
          who={who}
          screen={screen}
          count={total.count}
          door={
            <MenuDoor>
              <ChipRow summary={album.summary} types="all" />
              {who === "host" ? (
                <HiddenRow summary={album.summary} checked={false} />
              ) : null}
              <Foot summary={album.summary} types="all" />
            </MenuDoor>
          }
        />
      </Screen>
    );
  }
  return (
    <Screen
      id={`object-${shape}`}
      screen={screen}
      read={objectRead}
      caption={OBJECT_CAPTION[shape]}
    >
      <Ground who={who} screen={screen} count={total.count}>
        <Shell>
          <Head />
          <ChipRow summary={album.summary} types="all" />
          {who === "host" ? (
            <HiddenRow summary={album.summary} checked={false} />
          ) : null}
          <Foot summary={album.summary} types="all" />
        </Shell>
      </Ground>
    </Screen>
  );
}

/* ── 8. where the file lands ─────────────────────────────────────────────── */

type PhoneShape = "zip" | "batch" | "both";

const PHONE_CAPTION: Record<PhoneShape, string> = {
  zip: "The zip lands in Files, exactly as it always has: the fastest single file, never the native library a phone expects.",
  batch:
    "Every file goes to the share sheet at once: its own Save leads straight into Photos, no zip involved, no button of ours at all.",
  both: "The sheet's own button saves straight to Photos; a quieter line under it still offers the one zip, to Files.",
};

/**
 * `both`'S OWN FOOT: Photos leads, Files stays one quiet tap away (his note:
 * "not looking to reduce ways to download, just include the expected native
 * way as the default"). A sibling of `Foot`, not a mode on it: the shared one
 * answers every OTHER decision's own cap and wait states too, and none of
 * them needs a second button.
 */
function PhoneBothFoot({
  total,
}: {
  total: { count: number; bytes: number };
}) {
  return (
    <div className="mt-1 flex flex-col items-end gap-1.5" data-xf-foot>
      <div className="flex w-full items-center justify-between gap-3">
        <div>
          <span className="text-2xl font-medium tabular-nums" data-xf-size>
            {formatBytes(total.bytes)}
          </span>
          <div
            className="text-xs tabular-nums text-muted-foreground"
            data-xf-count
          >
            {total.count.toLocaleString("en-US")}{" "}
            {total.count === 1 ? "item" : "items"}
          </div>
        </div>
        <Button type="button" data-xf-go tabIndex={-1}>
          <ImageIcon /> Save to Photos
        </Button>
      </div>
      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-4"
        tabIndex={-1}
      >
        or the zip, to Files
      </button>
    </div>
  );
}

function PhoneScreen({ shape, s }: { shape: PhoneShape; s: BoardState }) {
  // ★ ALWAYS 375. This decision is about what a phone does, so the board's
  // screen knob is not on its strip and is not read here: the first pass drew
  // Safari's own download bar across a 1440 laptop, which is a picture of
  // nothing. The tile is declared "phone" so the previews are that column.
  const screen: ScreenId = "375";
  const album = albumFor(s);
  const total = totalFor(album.summary, "all", false);
  const object = objectOf(s.object);
  // `batch` always jumps straight to the OS sheet, as the old `share` did;
  // `both` does too once `object` leaves no dialog to hold its second button.
  const toShareSheet =
    shape === "batch" || (shape === "both" && object === "straight");
  return (
    <Screen
      id={`phone-${shape}`}
      screen={screen}
      read={phoneRead}
      caption={PHONE_CAPTION[shape]}
    >
      <GuestAlbum screen={screen} count={total.count}>
        {toShareSheet ? (
          <ShareSheet size={formatBytes(total.bytes)} photos={total.count} />
        ) : object === "straight" ? (
          <Toast screen={screen} tone="success">
            {shape === "zip"
              ? "Saved to Files, in Downloads."
              : "Your download is starting."}
          </Toast>
        ) : (
          <Shell>
            <Head />
            <ChipRow summary={album.summary} types="all" />
            {shape === "both" ? (
              <PhoneBothFoot total={total} />
            ) : (
              <Foot summary={album.summary} types="all" saysWhere />
            )}
          </Shell>
        )}
        <IosBar lit={shape === "zip"} />
      </GuestAlbum>
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof EXPORT_FLOW> = {
  "means.album": (s) => <MeansScreen shape="album" s={s} />,
  "means.mine": (s) => <MeansScreen shape="mine" s={s} />,
  "means.picked": (s) => <MeansScreen shape="picked" s={s} />,

  "wait.toast": (s) => <WaitScreen shape="toast" s={s} />,
  "wait.panel": (s) => <WaitScreen shape="panel" s={s} />,
  "wait.line": (s) => <WaitScreen shape="line" s={s} />,

  "stuck.timeout": (s) => <StuckScreen shape="timeout" s={s} />,
  "stuck.cancel": (s) => <StuckScreen shape="cancel" s={s} />,
  "stuck.retry": (s) => <StuckScreen shape="retry" s={s} />,

  "hollow.after": (s) => <HollowScreen shape="after" s={s} />,
  "hollow.refuse": (s) => <HollowScreen shape="refuse" s={s} />,
  "hollow.offer": (s) => <HollowScreen shape="offer" s={s} />,

  "cap.near": (s) => <CapScreen shape="near" s={s} />,
  "cap.split": (s) => <CapScreen shape="split" s={s} />,
  "cap.auto": (s) => <CapScreen shape="auto" s={s} />,

  "object.zip": (s) => <ObjectScreen shape="zip" s={s} />,
  "object.straight": (s) => <ObjectScreen shape="straight" s={s} />,
  "object.menu": (s) => <ObjectScreen shape="menu" s={s} />,

  "phone.zip": (s) => <PhoneScreen shape="zip" s={s} />,
  "phone.batch": (s) => <PhoneScreen shape="batch" s={s} />,
  "phone.both": (s) => <PhoneScreen shape="both" s={s} />,
};

export function ExportFlowBoard() {
  return <ExplorationBoard spec={EXPORT_FLOW} previews={PREVIEWS} />;
}
