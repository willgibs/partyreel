"use client";

import { Image as ImageIcon, Layers, UserRound, Video } from "lucide-react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";
import { downloadMenuNote } from "@/components/app/export/export-dialog";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

import {
  GuestPage,
  INTO,
  SaveDock,
  ShutterDock,
  TrayCard,
  TrayDock,
} from "./album";
import { PICKED, TRAY, VIEWED } from "./fixtures";
import { HubAlbum, TakeHomePanel } from "./host";
import {
  DownloadMenu,
  type MenuRow,
  type MenuShape,
  QuietLine,
  SizeTabs,
  WalkToast,
} from "./menus";
import {
  ALBUM_TAKE,
  bytesOf,
  countOf,
  firstSheet,
  type GuestWay,
  ORIGINAL_PX,
  PARTY_MBPS,
  PHOTO_ORIGINAL,
  PHOTO_PHONE,
  phonePixels,
  progressAt,
  receivedIn,
  type Size,
  sheetsOf,
  type Take,
  WAIT_SECONDS,
  WAY_TAKE,
  YOURS_TAKE,
} from "./model";
import { FilesLanding, PhotosLanding, ShareSheet } from "./phone-os";
import {
  guestScreenOf,
  Row,
  type RowFrame,
  type ScreenId,
  ScrollTo,
} from "./scene";
import { TAKE_HOME } from "./spec";
import { Viewer } from "./viewer";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the way home as its reader
 * meets it, in real frames.
 *
 *  - `guest`: two frames at the width the Screen knob names (her phone first):
 *    the album as built with the way in, then the act ready to press.
 *  - `save`: three phone frames drawn on the selection the guest's answer
 *    leads to (`WAY_TAKE`): the wait after Save, the hand-off, and where her
 *    photos live after.
 *  - `host`: Maya's desk and her phone side by side, the Download open on the
 *    hub's album.
 *
 * Every photograph is a bootstrap still; every size, count and part comes from
 * `model.ts`; the phone's own sheet, Files and Photos are diagrams
 * (`phone-os.tsx`).
 */

/** An option's own name off the spec, so a row's lede and the stage head agree. */
const LABEL = (ask: string, option: string) => {
  const found = TAKE_HOME.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

const WAYS = ["today", "select", "tray", "viewer"] as const;

/** The way she takes photos home, as the board's state holds it: his pick, else today's. */
const wayOf = (s: BoardState): GuestWay =>
  (WAYS as readonly string[]).includes(s.guest)
    ? (s.guest as GuestWay)
    : "today";

/** "214 · 964.4 MB": a row's worth, as the menu's `hintFor` writes it. */
const hint = (t: Take, size: Size) =>
  `${formatCount(countOf(t))} · ${formatBytes(bytesOf(t, size))}`;

const PHOTOS_ONLY: Take = { photos: ALBUM_TAKE.photos, clips: 0 };
const CLIPS_ONLY: Take = { photos: 0, clips: ALBUM_TAKE.clips };

/* ── the guest's way home ──────────────────────────────────────────────────── */

/** Download all's rows for a guest (`export-dialog.tsx`): Yours first, Everything pressed. */
function guestRows(): MenuRow[] {
  return [
    { icon: <UserRound />, label: "Yours", hint: hint(YOURS_TAKE, "original") },
    {
      icon: <Layers />,
      label: "Everything",
      hint: hint(ALBUM_TAKE, "original"),
      act: true,
    },
    {
      icon: <ImageIcon />,
      label: "Photos",
      hint: hint(PHOTOS_ONLY, "original"),
    },
    { icon: <Video />, label: "Videos", hint: hint(CLIPS_ONLY, "original") },
  ];
}

/** Download all, open at this width: a hand's rows at the foot, a desk's menu under the button. */
function guestMenu(screen: ScreenId) {
  const shape: MenuShape = screen === "375" ? "rows" : "menu";
  return (
    <DownloadMenu
      shape={shape}
      title="Download album"
      rows={guestRows()}
      note={downloadMenuNote({
        loading: false,
        failed: false,
        place: shape === "rows" ? "files" : "desk",
        anyInParts: false,
      })}
    />
  );
}

const SELECTED = countOf(WAY_TAKE.select);

function guestFrames(way: GuestWay, screen: ScreenId): RowFrame[] {
  const key = `th-guest-${way}-${screen}`;
  const into = <ScrollTo y={INTO[screen]} />;
  switch (way) {
    case "today":
      return [
        {
          id: `${key}-in`,
          screen,
          title: "The album as built",
          node: <GuestPage screen={screen} way="download" />,
        },
        {
          id: `${key}-act`,
          screen,
          title: "Download all, open",
          node:
            screen === "375" ? (
              <GuestPage
                screen={screen}
                way="download"
                over={guestMenu(screen)}
              />
            ) : (
              <GuestPage
                screen={screen}
                way="download"
                menu={guestMenu(screen)}
              />
            ),
        },
      ];
    case "select":
      return [
        {
          id: `${key}-in`,
          screen,
          title: "Select, in the album's row",
          node: <GuestPage screen={screen} way="select" />,
        },
        {
          id: `${key}-act`,
          screen,
          title: `${SELECTED} picked, the shutter turned to Save`,
          node: (
            <>
              <GuestPage
                screen={screen}
                way="select"
                selecting={SELECTED}
                marks="select"
                foot={<SaveDock count={SELECTED} />}
              />
              {into}
            </>
          ),
        },
      ];
    case "tray":
      return [
        {
          id: `${key}-in`,
          screen,
          title: "Gathering, in the viewer",
          node: (
            <>
              <GuestPage
                screen={screen}
                way="none"
                marks="gathered"
                foot={<TrayDock count={TRAY.length} act={false} />}
                over={
                  <Viewer
                    screen={screen}
                    index={VIEWED}
                    gather={{ count: TRAY.length, active: true }}
                    act="gather"
                  />
                }
              />
              {into}
            </>
          ),
        },
        {
          id: `${key}-act`,
          screen,
          title: "Her tray, open at the foot",
          node: (
            <>
              <GuestPage
                screen={screen}
                way="none"
                marks="gathered"
                foot={<TrayDock count={TRAY.length} />}
                over={<TrayCard screen={screen} picks={TRAY} />}
              />
              {into}
            </>
          ),
        },
      ];
    case "viewer":
      return [
        {
          id: `${key}-in`,
          screen,
          title: "The album, nothing to take many",
          node: <GuestPage screen={screen} way="none" />,
        },
        {
          id: `${key}-act`,
          screen,
          title: "Save, one photo at a time",
          node: (
            <>
              <GuestPage
                screen={screen}
                way="none"
                foot={<ShutterDock />}
                over={<Viewer screen={screen} index={VIEWED} act="save" />}
              />
              {into}
            </>
          ),
        },
      ];
  }
}

function GuestStrip({ s, way }: { s: BoardState; way: GuestWay }) {
  const screen = guestScreenOf(s);
  return (
    <Row
      lede={`${LABEL("guest", way)}: the way in, on the album as built, then the act, ready to press.`}
      frames={guestFrames(way, screen)}
    />
  );
}

/* ── what her Save gives ───────────────────────────────────────────────────── */

type Lands = "zip" | "photos" | "light";

/** The photographs a way's selection pictures: her picks, her tray, or the one in the viewer. */
const picksOf = (way: GuestWay): readonly number[] =>
  way === "tray" ? TRAY : way === "viewer" ? [VIEWED] : [...PICKED];

/** "24 photos", "your photo", "214 photos & videos": the selection in the walk's own words. */
function nounOf(t: Take): string {
  if (t.clips > 0) return `${formatCount(countOf(t))} photos & videos`;
  return t.photos === 1 ? "your photo" : `${formatCount(t.photos)} photos`;
}

/** The page her way leaves her on as Save is pressed, with the wait drawn where her way draws it. */
function WaitPage({
  way,
  progress,
  toast,
}: {
  way: GuestWay;
  /** Her way's own control filling (the Save shutter, the viewer's Save); absent for a zip. */
  progress?: number;
  toast?: React.ReactNode;
}) {
  const screen: ScreenId = "375";
  const into = <ScrollTo y={INTO[screen]} />;
  if (way === "select")
    return (
      <>
        <GuestPage
          screen={screen}
          way="select"
          selecting={SELECTED}
          marks="select"
          foot={<SaveDock count={SELECTED} progress={progress} />}
          over={toast}
        />
        {into}
      </>
    );
  if (way === "tray")
    return (
      <>
        <GuestPage
          screen={screen}
          way="none"
          marks="gathered"
          foot={<TrayDock count={TRAY.length} />}
          over={toast}
        />
        {into}
      </>
    );
  if (way === "viewer")
    return (
      <>
        <GuestPage
          screen={screen}
          way="none"
          foot={<ShutterDock />}
          over={
            <>
              <Viewer
                screen={screen}
                index={VIEWED}
                saving={progress}
                act="save"
              />
              {toast}
            </>
          }
        />
        {into}
      </>
    );
  // Download all's page, moved into the album: the shutter stands at the foot as built.
  return (
    <>
      <GuestPage
        screen={screen}
        way="download"
        foot={<ShutterDock />}
        over={toast}
      />
      {into}
    </>
  );
}

function saveFrames(way: GuestWay, lands: Lands): RowFrame[] {
  const take = WAY_TAKE[way];
  const size: Size = lands === "light" ? "phone" : "original";
  const key = `th-save-${way}-${lands}`;
  const picks = picksOf(way);
  if (lands === "zip") {
    const bytes = bytesOf(take, "original");
    return [
      {
        id: `${key}-wait`,
        screen: "375",
        title: "Saving, the zip on its way",
        node: (
          <WaitPage
            way={way}
            toast={
              <WalkToast tone="between" title="Saving to your Files app…" />
            }
          />
        ),
      },
      {
        id: `${key}-hand`,
        screen: "375",
        title: "Saved",
        node: (
          <WaitPage
            way={way}
            toast={<WalkToast tone="done" title="Saved to your Files app." />}
          />
        ),
      },
      {
        id: `${key}-lives`,
        screen: "375",
        title: "Where it lives: Files",
        node: <FilesLanding bytes={bytes} />,
      },
    ];
  }
  const parts = sheetsOf(take, size).length;
  const sheet = firstSheet(take, size);
  const partLine = parts > 1 ? `Part 1 of ${parts}` : undefined;
  // Every option is drawn at the same moment (`progressAt`), so two rings differ by their bytes alone.
  const progress = progressAt(sheet.bytes);
  const got = `${formatBytes(Math.min(sheet.bytes, receivedIn(WAIT_SECONDS, PARTY_MBPS)))} of ${formatBytes(sheet.bytes)}`;
  const waitTitle =
    parts > 1
      ? `Part 1 of ${parts}: ${got}`
      : `Getting ${nounOf(take)}: ${got}`;
  return [
    {
      id: `${key}-wait`,
      screen: "375",
      title: `${WAIT_SECONDS} seconds in, at a party's ${PARTY_MBPS} Mbps`,
      node: (
        <WaitPage
          way={way}
          progress={progress}
          toast={<WalkToast tone="wait" title={waitTitle} />}
        />
      ),
    },
    {
      id: `${key}-hand`,
      screen: "375",
      title: "The share sheet, Save pressed",
      node: (
        <>
          <WaitPage way={way} progress={1} />
          <ShareSheet
            count={sheet.count}
            bytes={sheet.bytes}
            part={partLine}
            picks={picks}
          />
        </>
      ),
    },
    {
      id: `${key}-lives`,
      screen: "375",
      title: "Where they live: Photos",
      node: (
        <PhotosLanding
          picks={picks}
          pixels={size === "phone" ? phonePixels() : ORIGINAL_PX}
          bytes={size === "phone" ? PHOTO_PHONE : PHOTO_ORIGINAL}
        />
      ),
    },
  ];
}

function SaveStrip({ s, lands }: { s: BoardState; lands: Lands }) {
  const way = wayOf(s);
  return (
    <Row
      lede={`${LABEL("save", lands)}, after ${LABEL("guest", way).toLowerCase()} (${nounOf(WAY_TAKE[way])}): the wait, the hand-off, and where they live after.`}
      frames={saveFrames(way, lands)}
    />
  );
}

/* ── the host's take-home ──────────────────────────────────────────────────── */

type HostOption = "today" | "sizes" | "two" | "device";

/** The host's Download rows at a size (`export-dialog.tsx`, host scope): Everything pressed. */
function hostRows(size: Size): MenuRow[] {
  return [
    {
      icon: <Layers />,
      label: "Everything",
      hint: hint(ALBUM_TAKE, size),
      act: true,
    },
    { icon: <ImageIcon />, label: "Photos", hint: hint(PHOTOS_ONLY, size) },
    { icon: <Video />, label: "Videos", hint: hint(CLIPS_ONLY, size) },
  ];
}

/** Phone size's note in a hand: where the photos go, and what it leaves alone. */
const PHONE_NOTE =
  "Photos go to your Photos, a share sheet at a time; clips come as they were taken.";

function hostMenu(option: HostOption, screen: ScreenId) {
  const shape: MenuShape = screen === "375" ? "rows" : "menu";
  const note = (place: "files" | "desk") =>
    downloadMenuNote({
      loading: false,
      failed: false,
      place,
      anyInParts: false,
    });
  if (option === "sizes") {
    const size: Size = shape === "rows" ? "phone" : "original";
    return (
      <DownloadMenu
        shape={shape}
        title="Download album"
        head={<SizeTabs value={size} shape={shape} />}
        rows={hostRows(size)}
        toggle="Include hidden items"
        note={size === "phone" ? PHONE_NOTE : note("desk")}
      />
    );
  }
  return (
    <DownloadMenu
      shape={shape}
      title="Download album"
      rows={hostRows("original")}
      toggle="Include hidden items"
      note={note(shape === "rows" ? "files" : "desk")}
      foot={
        option === "device" ? (
          <QuietLine shape={shape}>Phone size instead</QuietLine>
        ) : undefined
      }
    />
  );
}

function hostFrame(option: HostOption, screen: ScreenId): RowFrame {
  const id = `th-host-${option}-${screen}`;
  const title =
    screen === "1440" ? "At her desk, Download open" : "On her phone";
  if (option === "two")
    return {
      id,
      screen,
      title,
      node: (
        <HubAlbum screen={screen} over={<TakeHomePanel screen={screen} />} />
      ),
    };
  if (option === "device" && screen === "375") {
    // A phone's Download goes straight to phone size into Photos: the walk
    // starts at once, and the originals are the toast's one answer.
    const parts = sheetsOf(ALBUM_TAKE, "phone").length;
    return {
      id,
      screen,
      title: "On her phone, Download pressed",
      node: (
        <HubAlbum
          screen={screen}
          over={
            <WalkToast
              tone="wait"
              title={`Phone size, part 1 of ${parts}…`}
              action="Originals"
            />
          }
        />
      ),
    };
  }
  return screen === "1440"
    ? {
        id,
        screen,
        title,
        node: <HubAlbum screen={screen} menu={hostMenu(option, screen)} />,
      }
    : {
        id,
        screen,
        title,
        node: <HubAlbum screen={screen} over={hostMenu(option, screen)} />,
      };
}

function HostStrip({ option }: { option: HostOption }) {
  return (
    <Row
      lede={`${LABEL("host", option)}: Maya at her desk, then on her phone, the Download open on her album.`}
      frames={[hostFrame(option, "1440"), hostFrame(option, "375")]}
    />
  );
}

/* ── the map ───────────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof TAKE_HOME> = {
  "guest.today": (s) => <GuestStrip s={s} way="today" />,
  "guest.select": (s) => <GuestStrip s={s} way="select" />,
  "guest.tray": (s) => <GuestStrip s={s} way="tray" />,
  "guest.viewer": (s) => <GuestStrip s={s} way="viewer" />,
  "save.zip": (s) => <SaveStrip s={s} lands="zip" />,
  "save.photos": (s) => <SaveStrip s={s} lands="photos" />,
  "save.light": (s) => <SaveStrip s={s} lands="light" />,
  "host.today": <HostStrip option="today" />,
  "host.sizes": <HostStrip option="sizes" />,
  "host.two": <HostStrip option="two" />,
  "host.device": <HostStrip option="device" />,
};

export function TakeHomeBoard() {
  return <ExplorationBoard spec={TAKE_HOME} previews={PREVIEWS} />;
}
