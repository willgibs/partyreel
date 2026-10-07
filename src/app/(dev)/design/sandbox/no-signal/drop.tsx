"use client";

import { Check, ListChecks } from "lucide-react";
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

import { GuestAlbum, type ShutterLook, ToastStill } from "./album";
import { LANDED, ONE_MORE, type Sent, UNSENT, WEDDING } from "./fixtures";
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
  paneNote,
  promiseLine,
  uploadsLine,
  WAITING,
  waitingCount,
  waitingToSend,
} from "./words";

/**
 * THE MOMENT THE LINE DROPS, THREE CONTAINERS (the `drop` ask): over the
 * party (a sheet), in the send's own place (the stack standing by), or in her
 * list (her uploads). Each is drawn in the carry answer (`carry`), and so is
 * every word it says: the question is the container, never its words, so a
 * sheet in a world that keeps her photos says what waits, as the others do,
 * and today's sheet is drawn verbatim only where it is today, in today's
 * carry (the creative director's pass).
 *
 * Every option is the same three moments: 11:42 pm at the album's head as the
 * line drops on her second photo; 11:44 pm, as she sends one more with the
 * line still gone (whether a container lets a party keep adding is what the
 * question's `matters` is about); then her press on what says it.
 *
 * ★ NO PRESS WHILE THE PHONE IS OFFLINE (crumbs-71, `export-toast.tsx`): a Try
 * again in a dead zone can only fail, so no frame here draws one but today's
 * own sheet, which does (its third frame is that very press, failing). The
 * press comes back with the line.
 *
 * ★ WHAT PRODUCTION SAYS BESIDE IT. Where the send ends at the drop (a sheet,
 * and her uploads, whose stack steps out), production's send toast says what
 * landed (`send-toast.ts`: once, at the run's end, for what landed, and no
 * failure sheet quiets it), so both draw it beside their own words. The send
 * that stands by never ends, so nothing of production's speaks until all of
 * it lands (one toast for the whole send).
 *
 * ★ THE ADD'S RING IS PRODUCTION'S SENDING RING, HELD STILL at what landed
 * (one of three), its count on its shoulder: how it looks while it waits is
 * signature r1's to finish (where the light lives, the Add's ring), so a pick
 * here never answers that board's question.
 *
 * ★ STAND-INS, SAID ONCE: the sheets' words in a keeping world, the send's
 * own sheet and her uploads' chip are this board's (the options'); the toast
 * is production's words drawn still where sonner's toaster stands
 * (`ToastStill`); every press is inert.
 */

export type DropWay = "sheet" | "standby" | "uploads";

/** Her first send: three, the toast in, two waiting. At 11:44 she sends one more. */
const SENT = 3;
const AT_DROP: readonly Sent[] = UNSENT;
const AFTER_ONE_MORE: readonly Sent[] = [...UNSENT, ONE_MORE];

/** What landed, in production's own send toast (`keepSentLine`). */
const JOINED = keepSentLine({
  count: 1,
  held: false,
  hostName: WEDDING.host.name,
  sent: { kinds: ["photo"], camera: false },
  nowMs: null,
});

/** The Add as the send holds it: production's sending ring at what landed, its count still to go. */
const ringFor = (landed: number, waiting: number): ShutterLook => ({
  state: "sending",
  progress: landed / (landed + waiting),
  count: waiting,
});

/* ── what the frames read ──────────────────────────────────────────────── */

/** The Add as the foot holds it: at rest, or holding its ring with a count on its shoulder. */
function readAdd(root: HTMLElement): string | undefined {
  const shutter = find(root, "[data-slot='shutter']");
  if (!shutter) return undefined;
  const count = textOf(shutter.querySelector("[data-slot='shutter-count']"));
  return shutter.dataset.state === "idle"
    ? "the Add at rest"
    : `the Add's ring held${count ? `, ${count} on its shoulder` : ""}`;
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
  const hers = find(root, "[data-ns-hers]");
  const word = (el: HTMLElement) =>
    textOf(el.querySelector("[data-ns-state-word]"));
  const note = stack?.querySelector<HTMLElement>("[data-ns-pane-note]");
  return parts(
    stack && inView(stack, win)
      ? `the stack stands by: "${word(stack)}"${note ? `, under it "${textOf(note)}"` : ""}`
      : hers && inView(hers, win)
        ? "no stack: her landed photo heads the album"
        : "no stack in view",
    pill && inView(pill, win) ? `the stand-in: "${word(pill)}"` : undefined,
    chip && inView(chip, win)
      ? `her uploads' chip: "${textOf(chip)}"`
      : undefined,
    said,
    readAdd(root),
  );
};

/** A list's rows, read: her uploads, or a sheet's. */
const readList: Reader = (root, win) => {
  const rows = findAll(root, "[data-ns-row]");
  if (rows.length === 0) return readDrop(root, win);
  const title = textOf(find(root, "[role='dialog'] h2"));
  return `${title ? `"${title}": ` : ""}${rows.length} rows, ${rows.map((r) => `"${textOf(r)}"`).join(", ")}`;
};

/* ── a sheet: today's, verbatim, where today's carry is ────────────────── */

/**
 * Production's failure sheet, over the album, as the send ends: the photos that did not go, the uploader's one
 * sentence on each. `sent` is the run's own count ("2 of 3", "1 of 1", "2 of 2": crumbs-76's rule, `useRunSent`).
 */
function TodaySheet({
  photos,
  sent,
  landed,
}: {
  photos: readonly Sent[];
  sent: number;
  landed: number;
}) {
  const a = useStillFile(photos[0]!.still, photos[0]!.name);
  const b = useStillFile(
    (photos[1] ?? photos[0])!.still,
    (photos[1] ?? photos[0])!.name,
  );
  const files = photos.length > 1 ? [a, b] : [a];
  const failures: UploadFailure[] = files.every(Boolean)
    ? files.map((file, i) => ({
        id: `q-${i}`,
        file: file as File,
        error: UPLOAD_WORDS.dropped,
        cause: "dropped",
      }))
    : [];
  return (
    <UploadFailureSheet
      open={failures.length > 0}
      onOpenChange={() => {}}
      failures={failures}
      sent={sent}
      landed={landed}
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

/* ── the waiting rows, a sheet's and the send's ─────────────────────────── */

/** What waits, in the order it was sent: the picture, its name, the point and its word. */
function WaitingRows({ photos }: { photos: readonly Sent[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {photos.map((u) => (
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
              {WAITING}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A SHEET IN A WORLD THAT KEEPS THEM: production's sheet and the door's heading, opening by itself as the send ends,
 * in the carry's words: how many wait, the promise, what waits, and its close (nothing to press while offline).
 */
function KeptSheet({
  carry,
  photos,
}: {
  carry: Carry;
  photos: readonly Sent[];
}) {
  return (
    <Sheet open onOpenChange={() => {}}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <DoorHeading
            announce
            titleAs="h2"
            title={`${waitingCount(photos.length)} for your connection`}
            reason={promiseLine(carry, photos.length)}
            className="pr-8"
          />
        </SheetHeader>
        <div className="px-4">
          <WaitingRows photos={photos} />
        </div>
        <SheetFooter>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            tabIndex={-1}
          >
            OK
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Her press on the stack or its stand-in: the send's own sheet, the door's heading and what waits; its x closes it. */
function SendSheet({
  carry,
  photos,
}: {
  carry: Carry;
  photos: readonly Sent[];
}) {
  return (
    <Sheet open onOpenChange={() => {}}>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <DoorHeading
            announce
            titleAs="h2"
            title={WAITING}
            reason={promiseLine(carry, photos.length)}
            className="pr-8"
          />
        </SheetHeader>
        <div className="px-4 pb-6">
          <WaitingRows photos={photos} />
        </div>
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
function UploadsChip({ waiting }: { waiting: number }) {
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
      {waitingToSend(waiting)}
    </Button>
  );
}

/**
 * Her press on the chip: production's list popup ("Your uploads", a whole screen in a hand), her own newest sent
 * first as its rows run (`buildTrackerRows`), this device's own pictures for what waits and the album's for what is in.
 * Each waiting row keeps a Remove (it never reached the server, so it is the page's own to put down: a wiring note).
 */
function UploadsList({
  carry,
  photos,
}: {
  carry: Carry;
  photos: readonly Sent[];
}) {
  const waiting = [...photos].reverse();
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
                  <span className="truncate">{WAITING}</span>
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

/**
 * THE CAPTIONS, POINT FIRST AND 40 CHARACTERS AT MOST: three phones at a desk
 * leave a frame's title about 40 before the stage cuts it, so what differs
 * between options leads.
 */
const TITLE = {
  sheet: {
    drop: "11:42 pm · the send ends in a sheet",
    more: (carry: Carry) =>
      goesItself(carry)
        ? "11:44 pm · one more: the sheet again"
        : "11:44 pm · one more: 1 of 1, 2 let go",
    third: (carry: Carry) =>
      goesItself(carry)
        ? "Closed: 3 wait, and nothing says so"
        : "11:42, Retry both instead: 2 of 2 again",
  },
  standby: {
    drop: "11:42 pm · the send stands by",
    more: "11:44 pm · one more, scrolled: 3 wait",
    third: "Her press on it: the send's own sheet",
  },
  uploads: {
    drop: "11:42 pm · her uploads hold 2",
    more: "11:44 pm · one more: the chip says 3",
    third: "Her press on the chip: her uploads",
  },
} as const;

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
  if (way === "sheet") {
    const kept = goesItself(carry);
    return (
      <Story>
        <Scene
          id={id("drop")}
          ground={ground}
          title={TITLE.sheet.drop}
          measure={readDrop}
        >
          <DropAlbum
            way={way}
            scroll="head"
            over={
              <>
                {kept ? (
                  <KeptSheet carry={carry} photos={AT_DROP} />
                ) : (
                  <TodaySheet photos={AT_DROP} sent={SENT} landed={1} />
                )}
                <JoinedToast />
              </>
            }
          />
        </Scene>
        <Scene
          id={id("more")}
          ground={ground}
          title={TITLE.sheet.more(carry)}
          measure={readDrop}
        >
          {/* Today the close let the two go, so the one she adds fails alone; in a world that keeps them, the sheet
              opens again over all three. */}
          <DropAlbum
            way={way}
            scroll="rows"
            over={
              kept ? (
                <KeptSheet carry={carry} photos={AFTER_ONE_MORE} />
              ) : (
                <TodaySheet photos={[ONE_MORE]} sent={1} landed={0} />
              )
            }
          />
        </Scene>
        <Scene
          id={id("third")}
          ground={ground}
          title={TITLE.sheet.third(carry)}
          measure={readDrop}
        >
          {kept ? (
            <DropAlbum way={way} scroll="rows" />
          ) : (
            <DropAlbum
              way={way}
              scroll="head"
              over={<TodaySheet photos={AT_DROP} sent={2} landed={0} />}
            />
          )}
        </Scene>
      </Story>
    );
  }
  if (way === "standby")
    return (
      <Story>
        <Scene
          id={id("drop")}
          ground={ground}
          title={TITLE.standby.drop}
          measure={readDrop}
        >
          <DropAlbum
            way={way}
            scroll="head"
            head={
              <WaitingStack remaining={AT_DROP.length} note={paneNote(carry)} />
            }
            shutter={ringFor(1, AT_DROP.length)}
          />
        </Scene>
        <Scene
          id={id("more")}
          ground={ground}
          title={TITLE.standby.more}
          measure={readDrop}
        >
          <DropAlbum
            way={way}
            scroll="rows"
            head={
              <WaitingStack
                remaining={AFTER_ONE_MORE.length}
                note={paneNote(carry)}
              />
            }
            shutter={ringFor(1, AFTER_ONE_MORE.length)}
            above={<WaitingPill remaining={AFTER_ONE_MORE.length} />}
          />
        </Scene>
        <Scene
          id={id("press")}
          ground={ground}
          title={TITLE.standby.third}
          measure={readList}
        >
          <DropAlbum
            way={way}
            scroll="rows"
            shutter={ringFor(1, AFTER_ONE_MORE.length)}
            over={<SendSheet carry={carry} photos={AFTER_ONE_MORE} />}
          />
        </Scene>
      </Story>
    );
  return (
    <Story>
      <Scene
        id={id("drop")}
        ground={ground}
        title={TITLE.uploads.drop}
        measure={readDrop}
      >
        <DropAlbum
          way={way}
          scroll="head"
          above={<UploadsChip waiting={AT_DROP.length} />}
          over={<JoinedToast />}
        />
      </Scene>
      <Scene
        id={id("more")}
        ground={ground}
        title={TITLE.uploads.more}
        measure={readDrop}
      >
        <DropAlbum
          way={way}
          scroll="rows"
          above={<UploadsChip waiting={AFTER_ONE_MORE.length} />}
        />
      </Scene>
      <Scene
        id={id("press")}
        ground={ground}
        title={TITLE.uploads.third}
        measure={readList}
      >
        <DropAlbum
          way={way}
          scroll="rows"
          above={<UploadsChip waiting={AFTER_ONE_MORE.length} />}
          over={<UploadsList carry={carry} photos={AFTER_ONE_MORE} />}
        />
      </Scene>
    </Story>
  );
}
