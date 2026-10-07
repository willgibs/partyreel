"use client";

import { Check, ListChecks, RefreshCw } from "lucide-react";

import { DoorHeading } from "@/components/guest/door/heading";
import {
  UploadFailureSheet,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";
import { PickPreview } from "@/components/guest/upload/pick-preview";
import { READING_PANE } from "@/components/guest/upload/stack-tile";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
} from "@/components/ui/sheet";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { UPLOAD_WORDS } from "@/lib/upload/uploader";
import { cn } from "@/lib/utils";

import { GuestAlbum, ToastStill } from "./album";
import { DROPPED_AT, LANDED, UNSENT, WEDDING } from "./fixtures";
import type { Ground } from "./knobs";
import {
  find,
  findAll,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
  useStillFile,
} from "./scene";
import { WaitingPill, WaitingStack, WaitPoint } from "./stack";
import {
  type Carry,
  keeps,
  NO_SIGNAL_NOW,
  pressWord,
  promiseLine,
  uploadsLine,
  WAITING_ROW,
  waitingToSend,
} from "./words";

/**
 * THE MOMENT THE LINE DROPS, THREE WAYS (the `drop` ask), each drawn in the
 * carry answer (`carry`): its words promise only what that answer keeps, so
 * the same option says "safe on this phone" in one world and "keep this page
 * open" in another.
 *
 * Every option is the same three moments: 11:42 pm at the album's head as the
 * line drops on her second photo (38% of it up, the run's progress on the
 * shutter's ring); 11:44 pm, scrolled on into the album; then her press on
 * what says it (today's sheet has nothing left to press once Not now has put
 * it down, so its third frame is the sheet's own words, closer).
 */

export type DropWay = "sheet" | "standby" | "uploads";

/** Her run: three sent, one in, two waiting, the second at 38% when the line went. */
const SENT = 3;
const WAITING = UNSENT.length;
/** The run's share up when it stopped: the first whole, the second at 38%, the third not begun. */
const RUN = (1 + DROPPED_AT / 100) / SENT;

/* ── what the frames read ──────────────────────────────────────────────── */

const readDrop: Reader = (root, win) => {
  const sheet = find(root, "[data-slot='sheet-content'], [role='dialog']");
  if (sheet && inView(sheet, win)) {
    const heading = textOf(sheet.querySelector("h2, [data-door-line]"));
    return `a sheet over the album: "${heading.slice(0, 80)}"`;
  }
  const stack = find(root, "[data-ns-stack]");
  const pill = find(root, "[data-ns-pill]");
  const chip = find(root, "[data-ns-chip]");
  const toast = find(root, "[data-ns-toast]");
  const standIn = find(root, "[data-sending-stand-in]");
  const shutter = find(root, "[data-slot='shutter']");
  const standby = shutter?.closest("[data-ns-standby]") !== null;
  return parts(
    stack && inView(stack, win)
      ? `the stack ${stack.dataset.nsStack}: "${textOf(stack.querySelector("[data-ns-pane]") ?? stack)}"`
      : "no stack in view",
    pill && inView(pill, win) ? `the pill: "${textOf(pill)}"` : undefined,
    standIn && inView(standIn, win)
      ? `production's stand-in: "${textOf(standIn)}"`
      : undefined,
    chip && inView(chip, win)
      ? `her uploads' chip: "${textOf(chip)}"`
      : undefined,
    toast ? `a toast: "${textOf(toast)}"` : undefined,
    shutter
      ? `the shutter ${shutter.dataset.state}${standby ? ", standing by" : ""}`
      : undefined,
  );
};

/** A list's rows, read: her uploads, or the send's own sheet. */
const readList: Reader = (root) => {
  const rows = findAll(root, "[data-ns-row]");
  if (rows.length === 0) return readDrop(root, root.ownerDocument.defaultView!);
  return `${rows.length} rows: ${rows.map((r) => `"${textOf(r)}"`).join(", ")}`;
};

/* ── today: the failure sheet ──────────────────────────────────────────── */

/**
 * Production's failure sheet, over the album, as the run ends: her two, the uploader's sentence on each. `again` is
 * her Retry both while the line is still gone: a run of its own, which fails whole ("2 of 2", crumbs-76's count).
 */
function TodaySheet({ again = false }: { again?: boolean }) {
  const a = useStillFile(UNSENT[0]!.still, UNSENT[0]!.name);
  const b = useStillFile(UNSENT[1]!.still, UNSENT[1]!.name);
  const failures: UploadFailure[] =
    a && b
      ? [a, b].map((file, i) => ({
          id: `q-${i}`,
          file,
          error: UPLOAD_WORDS.dropped,
          cause: "dropped",
        }))
      : [];
  return (
    <UploadFailureSheet
      open={failures.length > 0}
      onOpenChange={() => {}}
      failures={failures}
      sent={again ? WAITING : SENT}
      landed={again ? 0 : 1}
      hostName={WEDDING.host.name}
      onRetry={() => {}}
    />
  );
}

/* ── standby: the send's own sheet, on her press ───────────────────────── */

/** Her two waiting, as a list's rows: the picture, its name, the point and its word. */
function WaitingRows() {
  return (
    <ul className="flex flex-col gap-3">
      {UNSENT.map((u) => (
        <li key={u.name} data-ns-row="" className="flex items-center gap-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-tile bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- her photo, as the queue holds it */}
            <img
              src={u.still.src}
              alt=""
              className="size-full object-cover"
              style={{ objectPosition: u.still.focus }}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-reading font-medium">
              {u.name}
            </span>
            <span className="flex items-center gap-1.5 text-reading text-muted-foreground">
              <WaitPoint />
              {WAITING_ROW}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Her press on the stack or its pill: the send's own sheet, the door's heading, her two, one press. */
function SendSheet({ carry }: { carry: Carry }) {
  return (
    <Sheet open onOpenChange={() => {}}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <DoorHeading
            announce
            titleAs="h2"
            title={NO_SIGNAL_NOW}
            reason={promiseLine(carry, WAITING)}
            className="pr-8"
          />
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <Button type="button" size="cta" className="w-full" tabIndex={-1}>
            <RefreshCw /> {pressWord(carry)}
          </Button>
          <WaitingRows />
        </div>
        <SheetFooter>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            tabIndex={-1}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ── uploads: her uploads' chip and list ───────────────────────────────── */

/**
 * HER UPLOADS' BUTTON AS A CHIP (the ROADMAP's "3 waiting to send"): the
 * round production stands beside Add on albums that wait (`UploadTrackerButton`,
 * its `ListChecks`), widened to say what waits in words while something does,
 * in the glass of the stand-in's band.
 */
function UploadsChip() {
  return (
    <div
      data-ns-chip=""
      style={READING_PANE}
      className={cn(
        GLASS,
        "pointer-events-auto flex h-11 items-center gap-2 rounded-full pr-4 pl-3.5 text-white",
      )}
    >
      <ListChecks
        aria-hidden
        className={cn(GLASS_MARK_LIT, "size-4.5 shrink-0")}
      />
      <span
        className={cn(
          GLASS_MARK_LIT,
          "flex items-center gap-1.5 text-reading font-medium tabular-nums",
        )}
      >
        <WaitPoint />
        {waitingToSend(WAITING)}
      </span>
    </div>
  );
}

/** Her press on the chip: production's list popup ("Your uploads", a whole screen in a hand), her two waiting. */
function UploadsList({ carry }: { carry: Carry }) {
  return (
    <Popup open onOpenChange={() => {}}>
      <PopupContent kind="list" data-upload-tracker-sheet>
        <PopupHeader
          title="Your uploads"
          description={uploadsLine(carry)}
          back="Album"
        />
        <PopupBody>
          <ul className="divide-y divide-border/60 pb-2">
            {UNSENT.map((u) => (
              <li
                key={u.name}
                data-ns-row=""
                className="flex items-center gap-3 py-2.5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- her photo, as the queue holds it */}
                  <img
                    src={u.still.src}
                    alt=""
                    className="size-full object-cover"
                    style={{ objectPosition: u.still.focus }}
                  />
                </div>
                <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-foreground">
                  <WaitPoint />
                  <span className="truncate">{WAITING_ROW}</span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  tabIndex={-1}
                  className="shrink-0 text-muted-foreground"
                >
                  Remove
                </Button>
              </li>
            ))}
            <li data-ns-row="" className="flex items-center gap-3 py-2.5">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
                <PickPreview
                  file={new File([], LANDED.name, { type: "image/jpeg" })}
                  url={LANDED.still.src}
                  className="size-full"
                />
              </div>
              <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-success">
                <Check className="size-4 shrink-0" aria-hidden />
                <span className="truncate text-foreground">In the album</span>
              </p>
            </li>
          </ul>
          <Button
            type="button"
            variant="outline"
            size="cta"
            className="mt-2 w-full"
            tabIndex={-1}
          >
            <RefreshCw /> {pressWord(carry)}
          </Button>
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

const TITLES = {
  drop: "11:42 pm · the line drops on her second photo",
  later: "11:44 pm · scrolled on, still no signal",
} as const;

/** What `sheet`'s Not now does in this carry: puts them down (the page's keep), or closes over a keep that says nothing. */
const notNowTitle = (carry: Carry) =>
  keeps(carry)
    ? "11:44 pm · Not now: kept on her phone, and nothing says so"
    : "11:44 pm · Not now: her 2 photos are let go";

export function DropStory({
  way,
  carry,
  ground,
}: {
  way: DropWay;
  carry: Carry;
  ground: Ground;
}) {
  const id = (k: string) => `ns-drop-${k}-${way}-${carry}`;
  const shutterHeld = {
    state: "standby" as const,
    progress: RUN,
    count: WAITING,
  };
  // Where nothing goes by itself (today's carry), the send's pane carries her one press.
  const stackPress = carry === "retry" ? pressWord(carry) : undefined;
  if (way === "sheet")
    return (
      <Story>
        <Scene
          id={id("drop")}
          ground={ground}
          title={`${TITLES.drop}: the run ends in the sheet`}
          measure={readDrop}
        >
          <GuestAlbum scroll="head" over={<TodaySheet />} />
        </Scene>
        <Scene
          id={id("later")}
          ground={ground}
          title={notNowTitle(carry)}
          measure={readDrop}
        >
          <GuestAlbum scroll="rows" />
        </Scene>
        <Scene
          id={id("again")}
          ground={ground}
          title="Her press, Retry both with no signal: the sheet again, 2 of 2"
          measure={readDrop}
        >
          <GuestAlbum scroll="head" over={<TodaySheet again />} />
        </Scene>
      </Story>
    );
  if (way === "standby")
    return (
      <Story>
        <Scene
          id={id("drop")}
          ground={ground}
          title={`${TITLES.drop}: the send stands by`}
          measure={readDrop}
        >
          <GuestAlbum
            scroll="head"
            head={
              <WaitingStack
                progress={DROPPED_AT}
                remaining={WAITING}
                press={stackPress}
              />
            }
            shutter={shutterHeld}
            over={<ToastStill title={promiseLine(carry, WAITING)} />}
          />
        </Scene>
        <Scene
          id={id("later")}
          ground={ground}
          title={`${TITLES.later}: the stand-in says it`}
          measure={readDrop}
        >
          <GuestAlbum
            scroll="rows"
            head={<WaitingStack progress={DROPPED_AT} remaining={WAITING} />}
            shutter={shutterHeld}
            above={<WaitingPill progress={DROPPED_AT} remaining={WAITING} />}
          />
        </Scene>
        <Scene
          id={id("press")}
          ground={ground}
          title="Her press on it: what waits, and her one press"
          measure={readList}
        >
          <GuestAlbum
            scroll="rows"
            head={<WaitingStack progress={DROPPED_AT} remaining={WAITING} />}
            shutter={shutterHeld}
            over={<SendSheet carry={carry} />}
          />
        </Scene>
      </Story>
    );
  return (
    <Story>
      <Scene
        id={id("drop")}
        ground={ground}
        title={`${TITLES.drop}: her uploads hold them`}
        measure={readDrop}
      >
        <GuestAlbum
          scroll="head"
          above={<UploadsChip />}
          over={
            <ToastStill title={promiseLine(carry, WAITING)} action="Show" />
          }
        />
      </Scene>
      <Scene
        id={id("later")}
        ground={ground}
        title={`${TITLES.later}: her uploads' chip says it`}
        measure={readDrop}
      >
        <GuestAlbum scroll="rows" above={<UploadsChip />} />
      </Scene>
      <Scene
        id={id("press")}
        ground={ground}
        title="Her press on it: her uploads, the two waiting"
        measure={readList}
      >
        <GuestAlbum
          scroll="rows"
          above={<UploadsChip />}
          over={<UploadsList carry={carry} />}
        />
      </Scene>
    </Story>
  );
}
