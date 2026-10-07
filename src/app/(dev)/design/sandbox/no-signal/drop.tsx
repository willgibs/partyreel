"use client";

import { Check, ListChecks, RefreshCw } from "lucide-react";
import type { ComponentProps } from "react";

import { DoorHeading } from "@/components/guest/door/heading";
import { keepSentLine } from "@/components/guest/save-account-prompt";
import {
  UploadFailureSheet,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";
import { PickPreview } from "@/components/guest/upload/pick-preview";
import { SEND_TOAST_PRESS } from "@/components/guest/upload/send-toast";
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
import { UPLOAD_WORDS } from "@/lib/upload/uploader";

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
  goesItself,
  keeps,
  NO_SIGNAL_NOW,
  paneNote,
  pressWord,
  promiseLine,
  uploadsLine,
  WAITING_ROW,
  waitingToSend,
} from "./words";

/**
 * THE MOMENT THE LINE DROPS, THREE WAYS (the `drop` ask), each drawn in the
 * carry answer (`carry`): its words promise only what that answer keeps, so
 * the same option says "Safe on this phone" in one world and "Keep this page
 * open" in another, and where nothing goes by itself (today's carry) the
 * press stands where the promise would.
 *
 * Every option is the same three moments: 11:42 pm at the album's head as the
 * line drops on her second photo (38% of it up, the run's share on the
 * shutter's ring); 11:44 pm, scrolled on into the album; then her press on
 * what says it. Today's sheet has nothing left to say at 11:44 once Not now
 * has put it down, so its press is the one the sheet offers: Retry both, with
 * the line still gone.
 *
 * ★ WHAT PRODUCTION SAYS BESIDE IT. Where the run ends (today's sheet, and
 * her uploads, whose stack steps out), production's send toast says what
 * landed (`send-toast.ts`: once, at the run's end, for what landed, and no
 * failure sheet quiets it), so both draw it beside their own words. The send
 * that stands by never ends its run, so nothing of production's speaks until
 * all three land (one toast for the whole send), and its promise is on the
 * send itself, where it stays.
 *
 * ★ STAND-INS, SAID ONCE: the send's own sheet, her uploads' chip and the
 * lists' one press are this board's (the options'); the toast is production's
 * words drawn still where sonner's toaster stands (`ToastStill`); every press
 * is inert.
 */

export type DropWay = "sheet" | "standby" | "uploads";

/** Her run: three sent, one in, two waiting, the second at 38% when the line went. */
const SENT = 3;
const WAITING = UNSENT.length;
/** The run's share up when it stopped: the first whole, the second at 38%, the third not begun. */
const RUN = (1 + DROPPED_AT / 100) / SENT;

/** What landed, in production's own send toast (`keepSentLine`), and its press. */
const JOINED = keepSentLine({
  count: 1,
  held: false,
  hostName: WEDDING.host.name,
  sent: { kinds: ["photo"], camera: false },
  nowMs: null,
});

/* ── what the frames read ──────────────────────────────────────────────── */

/** The shutter as the foot holds it: at rest in the album's light, or standing by with its count. */
function readShutter(root: HTMLElement): string | undefined {
  const shutter = find(root, "[data-slot='shutter']");
  if (!shutter) return undefined;
  const count = textOf(shutter.querySelector("[data-slot='shutter-count']"));
  if (shutter.closest("[data-ns-standby]"))
    return `the shutter standing by, its ring held with no hue${count ? `, ${count} on its shoulder` : ""}`;
  return shutter.dataset.state === "idle"
    ? "the shutter at rest"
    : `the shutter ${shutter.dataset.state}`;
}

const readDrop: Reader = (root, win) => {
  const toast = find(root, "[data-ns-toast]");
  const said = toast ? `a toast: "${textOf(toast)}"` : undefined;
  const sheet = find(root, "[data-slot='sheet-content'], [role='dialog']");
  if (sheet && inView(sheet, win)) {
    const heading = textOf(sheet.querySelector("h2, [data-door-line]"));
    return parts(`a sheet over the album: "${heading.slice(0, 80)}"`, said);
  }
  const stack = find(root, "[data-ns-stack]");
  const pill = find(root, "[data-ns-pill]");
  const chip = find(root, "[data-ns-chip]");
  const head = find(root, "[data-ns-hers]");
  const word = (el: HTMLElement) =>
    textOf(el.querySelector("[data-ns-state-word]"));
  const under = stack?.querySelector<HTMLElement>(
    "[data-ns-pane-note], [data-ns-pane-press]",
  );
  return parts(
    stack && inView(stack, win)
      ? `the stack stands by: "${word(stack)}"${
          under
            ? under.dataset.nsPanePress !== undefined
              ? `, her press "${textOf(under)}"`
              : `, under it "${textOf(under)}"`
            : ""
        }`
      : head && inView(head, win)
        ? "no stack: her landed photo heads the album"
        : "no stack in view",
    pill && inView(pill, win) ? `the stand-in: "${word(pill)}"` : undefined,
    chip && inView(chip, win)
      ? `her uploads' chip: "${textOf(chip)}"`
      : undefined,
    said,
    readShutter(root),
  );
};

/** A list's rows, read: her uploads, or the send's own sheet. */
const readList: Reader = (root, win) => {
  const rows = findAll(root, "[data-ns-row]");
  if (rows.length === 0) return readDrop(root, win);
  const title = textOf(find(root, "[role='dialog'] h2"));
  return `${title ? `"${title}": ` : ""}${rows.length} rows, ${rows.map((r) => `"${textOf(r)}"`).join(", ")}`;
};

/* ── today: the failure sheet, and the toast beside it ─────────────────── */

/**
 * Production's failure sheet, over the album, as the run ends: her two, the uploader's sentence on each. `again` is
 * her Retry both while the line is still gone: a run of its own, which fails whole ("2 of 2": AG1, crumbs-76's count,
 * so no line about the rest).
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

/**
 * PRODUCTION'S SEND TOAST AS A RUN ENDS WITH ONE LANDED (`useSendToast`: "only what landed", never quieted by a
 * failure sheet), above any layer as sonner's toaster stands above every modal.
 */
function JoinedToast() {
  return (
    <div className="relative z-[60]">
      <ToastStill title={JOINED} action={SEND_TOAST_PRESS} />
    </div>
  );
}

/* ── standby: the send's own sheet, on her press ───────────────────────── */

/** Her two waiting, in the order they were sent: the picture, its name, the point and its word. */
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

/**
 * THE ONE PRESS, AT THE WEIGHT ITS WORLD GIVES IT: where nothing goes by itself it is the only way on, the filled
 * press; where they go by themselves it is a "sooner, if you think the line is back", so it never shouts.
 */
function OnePress({ carry, className }: { carry: Carry; className?: string }) {
  const variant: ComponentProps<typeof Button>["variant"] = goesItself(carry)
    ? "outline"
    : "default";
  return (
    <Button
      type="button"
      size="cta"
      variant={variant}
      className={className}
      tabIndex={-1}
    >
      <RefreshCw /> {pressWord(carry)}
    </Button>
  );
}

/** Her press on the stack or its stand-in: the send's own sheet, the door's heading, her press, her two. */
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
          <OnePress carry={carry} className="w-full" />
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
 * HER UPLOADS' BUTTON AS A CHIP (the ROADMAP's "3 waiting to send"):
 * production's round at the foot (`UploadTrackerButton`, `look="round"`: the
 * outline round on the page's own ground, lifted, its `ListChecks`), widened
 * to say what waits in words while something does. It stands where the
 * stand-in stood, since the stack it stood in for has stepped out, and it
 * wears the page's material, never the send's glass: it is her list's door,
 * not the send.
 */
function UploadsChip() {
  return (
    <Button
      type="button"
      variant="outline"
      size="cta"
      tabIndex={-1}
      data-ns-chip=""
      className="pointer-events-auto rounded-full bg-background px-4 tabular-nums shadow-layer"
    >
      <ListChecks />
      {waitingToSend(WAITING)}
    </Button>
  );
}

/**
 * Her press on the chip: production's list popup ("Your uploads", a whole screen in a hand), her own newest sent
 * first as its rows run (`buildTrackerRows`), this device's own pictures for what waits and the album's for what is in.
 */
function UploadsList({ carry }: { carry: Carry }) {
  const waiting = [...UNSENT].reverse();
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
            {waiting.map((u) => (
              <li
                key={u.name}
                data-ns-row=""
                className="flex items-center gap-3 py-2.5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
                  <PickPreview
                    file={new File([], u.name, { type: "image/jpeg" })}
                    url={u.still.src}
                    className="size-full"
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
                {/* eslint-disable-next-line @next/next/no-img-element -- the album's own link for what is in it */}
                <img
                  src={LANDED.still.src}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-success">
                <Check className="size-4 shrink-0" aria-hidden />
                <span className="truncate text-foreground">In the album</span>
              </p>
            </li>
          </ul>
          <OnePress carry={carry} className="mt-2 w-full" />
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

/** Priya's album, marked as this option's (a reader, or a later rule, can find which way the frame draws). */
function DropAlbum({
  way,
  ...album
}: { way: DropWay } & ComponentProps<typeof GuestAlbum>) {
  return (
    <div data-ns-drop={way}>
      <GuestAlbum {...album} />
    </div>
  );
}

const DROP = "11:42 pm · the line drops on her second photo";
const LATER = "11:44 pm · scrolled on, still no signal";

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
  const held = {
    state: "standby" as const,
    progress: RUN,
    count: WAITING,
  };
  const stack = (
    <WaitingStack
      progress={DROPPED_AT}
      remaining={WAITING}
      note={paneNote(carry)}
      // Where nothing goes by itself (today's carry), the pane carries her one press.
      press={goesItself(carry) ? undefined : pressWord(carry)}
    />
  );
  if (way === "sheet")
    return (
      <Story>
        <Scene
          id={id("drop")}
          ground={ground}
          title={`${DROP}: the run ends in the sheet`}
          measure={readDrop}
        >
          <DropAlbum
            way={way}
            scroll="head"
            over={
              <>
                <TodaySheet />
                <JoinedToast />
              </>
            }
          />
        </Scene>
        <Scene
          id={id("later")}
          ground={ground}
          title={notNowTitle(carry)}
          measure={readDrop}
        >
          <DropAlbum way={way} scroll="rows" />
        </Scene>
        <Scene
          id={id("again")}
          ground={ground}
          title="Her press, Retry both with no signal: the sheet again, 2 of 2"
          measure={readDrop}
        >
          <DropAlbum way={way} scroll="head" over={<TodaySheet again />} />
        </Scene>
      </Story>
    );
  if (way === "standby")
    return (
      <Story>
        <Scene
          id={id("drop")}
          ground={ground}
          title={`${DROP}: the send stands by, and nothing opens`}
          measure={readDrop}
        >
          <DropAlbum way={way} scroll="head" head={stack} shutter={held} />
        </Scene>
        <Scene
          id={id("later")}
          ground={ground}
          title={`${LATER}: the stand-in says it`}
          measure={readDrop}
        >
          <DropAlbum
            way={way}
            scroll="rows"
            head={stack}
            shutter={held}
            above={<WaitingPill progress={DROPPED_AT} remaining={WAITING} />}
          />
        </Scene>
        <Scene
          id={id("press")}
          ground={ground}
          title="Her press on it: the send's own sheet"
          measure={readList}
        >
          <DropAlbum
            way={way}
            scroll="rows"
            head={stack}
            shutter={held}
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
        title={`${DROP}: the stack steps out, her uploads hold them`}
        measure={readDrop}
      >
        <DropAlbum
          way={way}
          scroll="head"
          above={<UploadsChip />}
          over={<JoinedToast />}
        />
      </Scene>
      <Scene
        id={id("later")}
        ground={ground}
        title={`${LATER}: her uploads' chip says it`}
        measure={readDrop}
      >
        <DropAlbum way={way} scroll="rows" above={<UploadsChip />} />
      </Scene>
      <Scene
        id={id("press")}
        ground={ground}
        title="Her press on the chip: her uploads, two waiting"
        measure={readList}
      >
        <DropAlbum
          way={way}
          scroll="rows"
          above={<UploadsChip />}
          over={<UploadsList carry={carry} />}
        />
      </Scene>
    </Story>
  );
}
