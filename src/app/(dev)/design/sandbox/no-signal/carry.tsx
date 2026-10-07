"use client";

import { keepSentLine } from "@/components/guest/save-account-prompt";
import {
  UploadFailureSheet,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";
import { UPLOAD_WORDS } from "@/lib/upload/uploader";
import { cn } from "@/lib/utils";

import { GuestAlbum, SendStack, ToastStill } from "./album";
import { LANDED, UNSENT, WEDDING } from "./fixtures";
import type { Ground } from "./knobs";
import {
  find,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
  useStillFile,
} from "./scene";
import { WaitPoint } from "./stack";
import { type Carry, wentInLastNight } from "./words";

/**
 * HOW FAR HER UNSENT PHOTOS ARE CARRIED (the `carry` ask), as a ladder: each
 * rung keeps every promise the one before it does, and costs more to build.
 *
 * ★ TWO MOMENTS, THE TWO A PAGE'S LIFE DECIDES: at 12:40 am the line comes
 * back while the album is still open in her pocket (where today's Retry and a
 * page that sends by itself part), and at 9:10 am she opens the album after
 * the page was closed in the night (where a page's keep and her phone's
 * part). The background rung adds a third, an iPhone's next morning, since
 * Background Sync is Android's alone. Under them, the night's four beats with
 * where her two photos are at each: a lab drawing, never the product's.
 *
 * ★ WHAT TELLS HER IS PRODUCTION'S OWN TOAST where a send ends on her screen
 * (`send-toast.ts`'s words, `keepSentLine`); where a send ended with the page
 * closed (the background), nothing could tell her then (no push: X11), so her
 * next open says it, in words this board coins.
 */

/** Her two, landed: newest first at the album's head, over the toast she sent first. */
const ALL_IN = [UNSENT[1]!.still, UNSENT[0]!.still, LANDED.still];

/** The send toast's own words for her two landing (production's `keepSentLine`). */
const LANDED_WORDS = keepSentLine({
  count: UNSENT.length,
  held: false,
  hostName: WEDDING.host.name,
  sent: { kinds: ["photo", "photo"], camera: false },
  nowMs: null,
});

/* ── what the frames read ──────────────────────────────────────────────── */

const readCarry: Reader = (root, win) => {
  const sheet = find(root, "[role='dialog']");
  if (sheet && inView(sheet, win))
    return `today's sheet still over the album: "${textOf(sheet.querySelector("h2")).slice(0, 60)}"`;
  const hers = root.ownerDocument.querySelectorAll("[data-ns-hers]").length;
  const stack = find(root, "[data-ns-stack]");
  const toast = find(root, "[data-ns-toast]");
  return parts(
    `${hers} of hers in the album`,
    stack ? `the stack ${stack.dataset.nsStack}` : "nothing of hers waits",
    toast ? `the toast: "${textOf(toast)}"` : undefined,
  );
};

/** Today's sheet, still standing at 12:40 am over a line that came back: nothing went. */
function StillStanding() {
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
      sent={3}
      landed={1}
      hostName={WEDDING.host.name}
      onRetry={() => {}}
    />
  );
}

/* ── the night strip ───────────────────────────────────────────────────── */

type Where = "page" | "phone" | "gone" | "sending" | "in";

const WHERE_WORDS: Record<Where, string> = {
  page: "In the open page",
  phone: "Kept on her phone",
  gone: "Gone",
  sending: "Sending",
  in: "In the album",
};

const BEATS: readonly { at: string; what: string }[] = [
  { at: "11:42 pm", what: "The line drops" },
  { at: "11:58 pm", what: "The page closes (swiped away, or iOS clears it)" },
  { at: "12:40 am", what: "The line is back" },
  { at: "9:10 am", what: "She opens the album" },
];

/** Where her two are at each beat, if the page closes in the night (the hard case every rung must meet). */
const NIGHT: Record<Carry, readonly Where[]> = {
  retry: ["page", "gone", "gone", "gone"],
  return: ["page", "gone", "gone", "gone"],
  phone: ["page", "phone", "phone", "in"],
  background: ["page", "phone", "in", "in"],
};

/** The background rung's 12:40, on an iPhone: as her phone's keep. */
const IPHONE_NOTE: Partial<Record<Carry, string>> = {
  background: "On an iPhone, 12:40 stays kept on her phone; 9:10 sends it.",
};

/**
 * THE NIGHT'S FOUR BEATS, if the page closes before the line comes back:
 * where her two photographs are at each, their pictures lit where they are in
 * the album, dimmed where they wait, gone where nothing holds them.
 */
function NightStrip({ carry }: { carry: Carry }) {
  const night = NIGHT[carry];
  return (
    <figure
      data-ns-night={carry}
      className="m-0 flex max-w-[1173px] flex-col gap-2"
    >
      <figcaption className="text-[11px] text-muted-foreground">
        Where her two photos are, beat by beat, if the page closes in the night
        {IPHONE_NOTE[carry] ? `. ${IPHONE_NOTE[carry]}` : ""}
      </figcaption>
      <ol className="grid grid-cols-4 gap-3">
        {BEATS.map((beat, i) => {
          const where = night[i]!;
          return (
            <li
              key={beat.at}
              data-ns-beat={where}
              className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/70 p-3"
            >
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {beat.at}
              </p>
              <p className="text-xs leading-snug font-medium text-pretty">
                {beat.what}
              </p>
              <div className="flex gap-1.5">
                {UNSENT.map((u) => (
                  <span
                    key={u.name}
                    className={cn(
                      "relative size-9 overflow-hidden rounded-tile bg-muted",
                      where === "gone" &&
                        "outline outline-1 -outline-offset-1 outline-border",
                    )}
                  >
                    {where === "gone" ? null : (
                      // eslint-disable-next-line @next/next/no-img-element -- her photo, as each beat holds it
                      <img
                        src={u.still.src}
                        alt=""
                        className={cn(
                          "size-full object-cover",
                          where !== "in" && "opacity-55 grayscale",
                        )}
                        style={{ objectPosition: u.still.focus }}
                      />
                    )}
                  </span>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-xs">
                <WaitPoint lit={where === "in"} unlit={where === "gone"} />
                {WHERE_WORDS[where]}
              </p>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

export function CarryStory({
  carry,
  ground,
}: {
  carry: Carry;
  ground: Ground;
}) {
  const id = (k: string) => `ns-carry-${k}-${carry}`;
  const back =
    carry === "retry" ? (
      <Scene
        id={id("back")}
        ground={ground}
        title="12:40 am · the line is back, the page still open: nothing goes until her Retry"
        measure={readCarry}
      >
        <GuestAlbum scroll="head" over={<StillStanding />} />
      </Scene>
    ) : (
      <Scene
        id={id("back")}
        ground={ground}
        title="12:40 am · the line is back, the page still open: they go by themselves"
        measure={readCarry}
      >
        <GuestAlbum
          scroll="head"
          landed={ALL_IN}
          over={<ToastStill title={LANDED_WORDS} action="Show yours" />}
        />
      </Scene>
    );
  const morning =
    carry === "retry" || carry === "return" ? (
      <Scene
        id={id("morning")}
        ground={ground}
        title="9:10 am · the page was closed in the night: nothing of her two is anywhere"
        measure={readCarry}
      >
        <GuestAlbum scroll="head" />
      </Scene>
    ) : carry === "phone" ? (
      <Scene
        id={id("morning")}
        ground={ground}
        title="9:10 am · she opens the album: her phone sends what it kept"
        measure={readCarry}
      >
        <GuestAlbum
          scroll="head"
          head={<SendStack progress={64} remaining={2} />}
          shutter={{ state: "sending", progress: 0.32, count: 2 }}
        />
      </Scene>
    ) : (
      <Scene
        id={id("morning")}
        ground={ground}
        title="9:10 am · on Android: they went in at 12:40, the album closed"
        measure={readCarry}
      >
        <GuestAlbum
          scroll="head"
          landed={ALL_IN}
          over={
            <ToastStill
              title={wentInLastNight(UNSENT.length)}
              action="Show yours"
            />
          }
        />
      </Scene>
    );
  const after =
    carry === "phone" ? (
      <Scene
        id={id("after")}
        ground={ground}
        title="9:11 am · in, and the send's toast says so"
        measure={readCarry}
      >
        <GuestAlbum
          scroll="head"
          landed={ALL_IN}
          over={<ToastStill title={LANDED_WORDS} action="Show yours" />}
        />
      </Scene>
    ) : carry === "background" ? (
      <Scene
        id={id("after")}
        ground={ground}
        title="9:10 am · on an iPhone: no background, so her phone sends it now"
        measure={readCarry}
      >
        <GuestAlbum
          scroll="head"
          head={<SendStack progress={64} remaining={2} />}
          shutter={{ state: "sending", progress: 0.32, count: 2 }}
        />
      </Scene>
    ) : null;
  return (
    <Story under={<NightStrip carry={carry} />}>
      {back}
      {morning}
      {after}
    </Story>
  );
}
