"use client";

/**
 * THE ALBUM'S OWN CAMERA (disposable-mode r3, Will's picks, 2026-10-02: `camera=timeline`, `video=hold`, `cost=one`,
 * `look=none`): what Add opens on an album whose host chose the camera (`events.capture = 'camera'`), full screen, in
 * the phone's own black. His words on the pick: "I like having the camera preview contained, as that's the native and
 * expected experience on iPhones ... The more modern reel also feels more bespoke to the product, while staying pretty
 * subtle and not overwhelming the screen. Makes you want to keep capturing."
 *
 * ★ EVERY SHOT RIDES THE PAGE'S ONE QUEUE, AS IT IS TAKEN. A shot is a File handed to `addFiles` the moment its JPEG
 * (or its video) is written, a video's first frame as its poster; the queue sends one at a time while she keeps
 * shooting, the join, the retry and the failure sheet exactly as for any upload (`use-upload-queue.ts`), and tells a
 * landing the album keeps sealed as `sealed`, drawn nowhere (`landedAs`). Nothing here talks to R2.
 *
 * ★ THE ROLL IS THE SERVER'S (`roll-view.ts`): read as the camera opens, after she takes a shot back and after a
 * refusal about the roll, and only while nothing of hers is in the air, so the count between two reads is the read plus
 * the shots taken since. A refusal is the server's own sentence: the roll's end (`roll_spent`, the ceiling), the album
 * itself refusing (closed, full, private: the shutter stops), or one shot that did not send (Retry).
 *
 * ★ THIS OUTLIVES ITS SCREEN. Closed, the camera lets the phone's camera go (`camera-screen.tsx` unmounts), but her
 * shots this visit, her roll and her list stay here, so the reel opens again where she left it.
 *
 * ★ A PLACE THE PHONE'S BACK CLOSES (`useBackCloses`), with Escape and its own close: a full-screen layer looks like a
 * page, so the one gesture a phone has for leaving a page leaves it. Her shots, open over it, are a place of their own
 * with an entry of their own (back-layers; from `disposable-camera`: with the camera's the only entry, Back from her
 * shots closed the whole camera), so Back peels them first and the next Back the camera, as Escape already did.
 */
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CameraScreen,
  type NewShot,
} from "@/components/guest/camera/camera-screen";
import { removeOwnShot } from "@/components/guest/camera/remove-shot";
import { useBlobUrls } from "@/components/guest/camera/use-blob-urls";
import { YourShots, type ShotTile } from "@/components/guest/camera/your-shots";
import { useBackCloses } from "@/components/ui/popup-back";
import { usePortalContainer } from "@/components/ui/portal-container";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import {
  ROLL_RETAKES_SPENT_MESSAGE,
  type RollCount,
} from "@/lib/disposable/roll";
import { canvasJpeg } from "@/lib/guest/camera/capture";
import {
  pictureIsVideoFile,
  readOwnRoll,
  waitsOutOfSight,
  type OwnShot,
} from "@/lib/guest/camera/own-shots";
import { HOST_FRESH_FRAMES, rollView } from "@/lib/guest/camera/roll-view";
import {
  inFlight,
  pendingSince,
  refusalOf,
  shotState,
  type CameraShot,
  type ShotState,
} from "@/lib/guest/camera/shots";
import {
  reelCaption,
  reelLabel,
  revealFor,
  rollDoneLine,
  yourShotsLine,
} from "@/lib/guest/camera/words";
import { useStoredSession } from "@/lib/guest/use-stored-session";
import type { FileExtra, QueueItem } from "@/lib/guest/use-upload-queue";

import "./camera.css";

/** How long a just-taken frame holds its frozen picture while it seals into glass (`camera.css`'s `cam-seal`). */
const JUST_MS = 900;

/** The frozen frames kept: the reel only ever shows the newest few sealing. */
const FROZEN_KEPT = 3;

/**
 * ★ AN ALBUM THAT REFUSES FOR A REASON ITS HOST CAN LIFT MAY SAY YES LATER, AND NOTHING TELLS THIS PAGE WHEN: uploads
 * closed (the host reopens them) or the album full (she makes room). The page reads the host's switch at render and
 * the album's sync carries no word of it, so a camera left open over such a refusal would keep its banner and its
 * stopped shutter until she closed it (the ROADMAP's "the camera never hears uploads reopen"). It asks again by itself
 * instead, on a calm and slowing cadence (each ask is a real presign, and the longer it has been shut the likelier it
 * stays so), and at once when the page comes back to the screen. Any other refusal of the album (a lock, a gone
 * event, a ticket that is not hers) is not the host's to lift in a minute, and is never asked again.
 */
const LIFTABLE_REFUSALS: ReadonlySet<string> = new Set([
  "uploads_closed",
  "cap_reached",
]);
const REASK_MS = [10_000, 20_000, 40_000, 60_000] as const;

const isActive = (it: QueueItem) =>
  it.status === "queued" || it.status === "uploading";

/**
 * WHAT THE CAMERA READS OF ITS ALBUM, and no more: its name, the roll's size, the develop time (the page's live
 * reading of it, not the event's stored one), how the album is moderated and whether it takes a video. Narrow so the
 * door, which holds the camera for the album's first photograph before the album's own slot has mounted, can hand it
 * what it knows without a whole event.
 */
export type CameraEvent = Pick<
  GuestEvent,
  "name" | "roll_size" | "develops_at" | "moderation_mode" | "accepts_video"
>;

export function AlbumCamera({
  open,
  openedAt,
  onOpenChange,
  event,
  qrToken,
  queue,
  onAddFiles,
  onRetry,
  removedIds,
  isOwner = false,
  isDemo,
  onOwnRemoved,
}: {
  open: boolean;
  /** When Add opened it (its own press): the clock its words start from. */
  openedAt: number;
  onOpenChange: (open: boolean) => void;
  event: CameraEvent;
  qrToken: string;
  /** The page's one queue: where each shot goes, and where each stands. */
  queue: readonly QueueItem[];
  onAddFiles: (files: File[], extra?: FileExtra) => void;
  onRetry: (queueId: string) => void;
  /** What this visit removed elsewhere (her tracker, the album's Delete): gone from her roll here too. */
  removedIds?: ReadonlySet<string>;
  /** The album's own host: her shots ride the host's pair, which no roll counts. */
  isOwner?: boolean;
  isDemo: boolean;
  /** One of hers was taken back here (the page forgets it, and asks the server whether its door stands). */
  onOwnRemoved?: (mediaId: string, remaining: number) => void;
}) {
  const [sessionToken] = useStoredSession(qrToken);
  const [shots, setShots] = useState<readonly CameraShot[]>([]);
  const [frozen, setFrozen] = useState<ReadonlyMap<string, HTMLCanvasElement>>(
    () => new Map(),
  );
  const [just, setJust] = useState<ReadonlySet<string>>(() => new Set());
  const [roll, setRoll] = useState<{
    server: RollCount | null;
    readFrom: number;
  }>({ server: null, readFrom: 0 });
  const [own, setOwn] = useState<readonly OwnShot[]>([]);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const [removing, setRemoving] = useState<
    ReadonlyMap<string, "working" | "failed">
  >(() => new Map());
  const [view, setView] = useState<"camera" | "shots">("camera");

  /* ── the clock its words read (the develop time, said from now) ─────────────────────────────── */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [open]);
  const now = Math.max(openedAt, tick);
  const reveal = revealFor(event, now);
  const developsAt = event.develops_at ?? null;

  /* ── her shots, where each stands, and her roll ───────────────────────────────────────────── */
  const gone = useCallback(
    (id: string | undefined) =>
      Boolean(id && (removed.has(id) || removedIds?.has(id))),
    [removed, removedIds],
  );
  /* ★ A SHOT THE QUEUE HELD AND HOLDS NO MORE WAS DISMISSED (the failure sheet's Not now, a refusal put down): it
     left the queue for good, so it leaves her roll here too, never "sending" for ever. A shot the queue has not held
     yet (her first shot's silent join still out) is on its way. Which shots the queue has held is remembered the
     render it is first seen (the sanctioned adjust-state-during-render pattern). */
  const [held, setHeld] = useState<ReadonlySet<string>>(() => new Set());
  /* ★ A SHOT BEING ASKED FOR AGAIN AGAINST A REFUSAL THAT MAY HAVE LIFTED (`LIFTABLE_REFUSALS`) STANDS AS THE REFUSAL IT
     WAS until the album answers: the queue says it is sending (waiting its turn, being prepared, asking for its place),
     and shown so the banner would leave, the shutter come back and the reel's caption say "sending 1" for the instant
     each ask takes, and then all go again when the album still says no. The answer is the file going up (the album said
     yes: a refusal comes before a byte moves), the shot landing, or its refusal again, or its leaving the queue; one
     shot's answer is every shot's, since what is asked together goes as one burst. */
  const [asking, setAsking] = useState<ReadonlyMap<string, ShotState>>(
    () => new Map(),
  );
  const lives = useMemo(
    () => shots.map((shot) => ({ shot, live: shotState(shot, queue) })),
    [shots, queue],
  );
  const stillAsking = (key: string) => {
    const live = lives.find((l) => l.shot.key === key)?.live;
    return (
      live !== undefined &&
      live.status === "sending" &&
      live.queueId !== undefined &&
      queue.find((it) => it.id === live.queueId)?.status === "queued"
    );
  };
  // The sanctioned adjust-state-during-render pattern: once any ask is answered they all let go of what they were held as.
  const asksAnswered =
    asking.size > 0 && [...asking.keys()].some((key) => !stillAsking(key));
  if (asksAnswered) setAsking(new Map());
  const raw = useMemo(
    () =>
      lives.map(({ shot, live }) => {
        const was = asking.get(shot.key);
        return {
          shot,
          state:
            was && !asksAnswered && live.status === "sending" && live.queueId
              ? was
              : live,
        };
      }),
    [lives, asking, asksAnswered],
  );
  const newlyHeld = raw.filter(
    ({ shot, state }) => state.queueId && !held.has(shot.key),
  );
  if (newlyHeld.length > 0) {
    setHeld(
      (prev) => new Set([...prev, ...newlyHeld.map(({ shot }) => shot.key)]),
    );
  }
  const states = useMemo(
    () =>
      raw.filter(
        ({ shot, state }) =>
          !gone(state.mediaId) &&
          !(state.status === "sending" && !state.queueId && held.has(shot.key)),
      ),
    [raw, gone, held],
  );
  const counted = states.filter(({ state }) => state.status !== "failed");
  const guest = rollView({
    server: roll.server,
    rollSize: event.roll_size,
    pending: pendingSince(states, roll.readFrom),
  });
  const host = isOwner;
  const used = host ? counted.length : guest.used;
  const cap = host ? counted.length + 1 + HOST_FRESH_FRAMES : guest.cap;
  const done = !host && guest.refusal !== null;
  const sending = states.filter(({ state }) => inFlight(state)).length;
  const busy = queue.some(isActive) || sending > 0;

  /* ── reading her roll: at the opening, after a removal, after a refusal about the roll ──────── */
  const wanted = useRef(false);
  const readId = useRef(0);
  const [readTick, setReadTick] = useState(0);
  useEffect(() => {
    if (open) wanted.current = true;
  }, [open]);
  const rollRefusals = states.filter(
    ({ state }) =>
      state.status === "failed" && refusalOf(state.code) === "roll",
  ).length;
  const seenRefusals = useRef(0);
  useEffect(() => {
    if (rollRefusals > seenRefusals.current) wanted.current = true;
    seenRefusals.current = rollRefusals;
  }, [rollRefusals]);
  useEffect(() => {
    // ★ ONLY WHILE NOTHING OF HERS IS IN THE AIR: an older shot is then either counted or refused (the head note).
    // Never for the host: no roll counts her shots, and none of her rows here is a guest's.
    if (!open || busy || !wanted.current || isDemo || isOwner) return;
    wanted.current = false;
    const id = ++readId.current;
    const from = Date.now();
    void readOwnRoll({ qrToken, sessionToken }).then((answer) => {
      if (id !== readId.current || !answer) return;
      setRoll({ server: answer.roll, readFrom: from });
      setOwn(answer.shots);
    });
  }, [open, busy, readTick, qrToken, sessionToken, isDemo, isOwner]);

  /* ── a shot, as the screen takes it ────────────────────────────────────────────────────────── */
  const justTimers = useRef(new Set<number>());
  const clearJustTimers = useCallback(() => {
    for (const timer of justTimers.current) window.clearTimeout(timer);
    justTimers.current.clear();
  }, []);
  useEffect(() => clearJustTimers, [clearJustTimers]);

  const onShot = useCallback((shot: NewShot) => {
    setShots((prev) => [
      ...prev,
      {
        key: shot.key,
        kind: shot.kind,
        takenAt: shot.takenAt,
        seconds: shot.seconds,
        file: null,
        thumb: shot.thumb,
      },
    ]);
    const canvas = shot.frozen;
    if (!canvas) return;
    setFrozen((prev) => {
      const next = new Map(prev);
      next.set(shot.key, canvas);
      // Only the newest few seal at once; an older frame is glass already.
      for (const key of [...next.keys()].slice(0, -FROZEN_KEPT)) {
        next.delete(key);
      }
      return next;
    });
    setJust((prev) => new Set(prev).add(shot.key));
    const timer = window.setTimeout(() => {
      justTimers.current.delete(timer);
      setJust((prev) => {
        const next = new Set(prev);
        next.delete(shot.key);
        return next;
      });
    }, JUST_MS);
    justTimers.current.add(timer);
    // Her list's picture of it: the frozen frame, small (a video brings its poster instead).
    if (!shot.thumb) {
      void canvasJpeg(canvas, 0.8).then(
        (thumb) =>
          setShots((prev) =>
            prev.map((s) =>
              s.key === shot.key && !s.thumb ? { ...s, thumb } : s,
            ),
          ),
        () => {},
      );
    }
  }, []);

  const onShotFile = useCallback(
    (key: string, file: File, extra: FileExtra) => {
      setShots((prev) => prev.map((s) => (s.key === key ? { ...s, file } : s)));
      // Into the page's one queue, as it is taken (a sealed landing is told `sealed` by the server's own answer).
      onAddFiles([file], extra);
    },
    [onAddFiles],
  );

  const onShotLost = useCallback((key: string) => {
    setShots((prev) => prev.filter((s) => s.key !== key));
  }, []);

  /* ── what did not go ───────────────────────────────────────────────────────────────────────── */
  const failed = states.filter(({ state }) => state.status === "failed");
  const toRetry = failed.filter(
    ({ state }) => refusalOf(state.code) === "retry" && state.queueId,
  );
  // What the album refused for a reason its host can lift: asked again below, by itself (`LIFTABLE_REFUSALS`).
  const reopenable = failed.filter(
    ({ state }) =>
      state.queueId && state.code && LIFTABLE_REFUSALS.has(state.code),
  );
  const blocked =
    [...failed]
      .reverse()
      .find(({ state }) => refusalOf(state.code) === "blocked")?.state.error ??
    null;
  const latestFileRefusal = [...failed]
    .reverse()
    .find(({ state }) => refusalOf(state.code) === "file");
  // ★ A DROPPED CONNECTION IS NEVER HIDDEN (E6): a shot that failed for want of a line says so in the uploader's own
  // sentence (`UPLOAD_WORDS.dropped`, drawn by the screen) where a count ("2 shots didn’t send.") would read as a broken app
  // on a stadium's signal. The queue's `cause` says which it was, never the words, which are free to change.
  const droppedUnsent = toRetry.some(({ state }) => state.cause === "dropped");
  const retryUnsent = useCallback(() => {
    const at = Date.now();
    const again = [...toRetry, ...reopenable];
    const keys = new Set(again.map(({ shot }) => shot.key));
    setShots((prev) =>
      prev.map((s) => (keys.has(s.key) ? { ...s, retriedAt: at } : s)),
    );
    // What the album refused stands as that refusal while it is asked again (`asking`).
    if (reopenable.length > 0) {
      setAsking((prev) => {
        const next = new Map(prev);
        for (const { shot, state } of reopenable) next.set(shot.key, state);
        return next;
      });
    }
    for (const { state } of again) onRetry(state.queueId as string);
  }, [toRetry, reopenable, onRetry]);
  // The connection back: what did not send goes again, by itself, while the camera is open.
  const unsentCount = toRetry.length + reopenable.length;
  useEffect(() => {
    if (!open || unsentCount === 0) return;
    window.addEventListener("online", retryUnsent);
    return () => window.removeEventListener("online", retryUnsent);
  }, [open, unsentCount, retryUnsent]);
  // ★ AND THE ALBUM THAT MAY HAVE REOPENED IS ASKED, by itself and calmly (`LIFTABLE_REFUSALS`): after 10 s, then 20,
  // 40 and every minute, never while the page is hidden, and at once when it comes back. Answered yes, the shot goes,
  // and the banner and the stopped shutter go with the refusal; answered no, the camera never moved.
  const reaskNow = useRef(retryUnsent);
  useEffect(() => {
    reaskNow.current = retryUnsent;
  });
  const reopenableCount = reopenable.length;
  useEffect(() => {
    if (!open || reopenableCount === 0) return;
    let asked = 0;
    let lastAsk = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = () => {
      lastAsk = Date.now();
      reaskNow.current();
    };
    const schedule = () => {
      timer = setTimeout(
        () => {
          asked += 1;
          if (document.visibilityState === "visible") ask();
          schedule();
        },
        REASK_MS[Math.min(asked, REASK_MS.length - 1)],
      );
    };
    const returned = () => {
      if (document.visibilityState !== "visible") return;
      // Never closer to the last ask than the cadence's first step: flicking between apps over a closed album must not
      // turn each return into a presign of its own, nor wind the calm cadence back to its start.
      if (Date.now() - lastAsk < REASK_MS[0]) return;
      clearTimeout(timer);
      asked = 0;
      ask();
      schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", returned);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", returned);
    };
  }, [open, reopenableCount]);

  /* ── her shots: this visit's, then what the server knows of the rest ──────────────────────── */
  const thumbEntries = useMemo(
    () => shots.flatMap((s) => (s.thumb ? [{ id: s.key, blob: s.thumb }] : [])),
    [shots],
  );
  const thumbUrls = useBlobUrls(thumbEntries);
  const tiles = useMemo<ShotTile[]>(() => {
    const out: ShotTile[] = [];
    const seen = new Set<string>();
    for (const { shot, state } of [...states].reverse()) {
      if (state.mediaId) seen.add(state.mediaId);
      // A refusal of the album or of the file is the failure sheet's, never a shot of hers.
      if (state.status === "failed" && refusalOf(state.code) !== "retry") {
        continue;
      }
      out.push({
        key: shot.key,
        mediaId: state.mediaId,
        queueId: state.queueId,
        kind: shot.kind,
        status: state.status,
        src: thumbUrls.get(shot.key),
        seconds: shot.seconds,
        removable:
          Boolean(state.mediaId) &&
          (state.status === "sealed" || state.status === "held"),
        retryable: state.status === "failed",
      });
    }
    for (const o of own) {
      if (seen.has(o.id) || gone(o.id) || o.status === "refused") continue;
      out.push({
        key: o.id,
        mediaId: o.id,
        kind: o.picture?.type ?? "photo",
        status: o.sealed ? "sealed" : o.status === "pending" ? "held" : "in",
        src: o.picture?.tile,
        srcIsVideo: pictureIsVideoFile(o.picture),
        removable: waitsOutOfSight(o),
        retryable: false,
      });
    }
    return out;
  }, [states, own, thumbUrls, gone]);

  const latestTiles = useRef(tiles);
  useEffect(() => {
    latestTiles.current = tiles;
  });
  const remove = useCallback(
    async (mediaId: string) => {
      setRemoving((prev) => new Map(prev).set(mediaId, "working"));
      const ok = await removeOwnShot({ qrToken, sessionToken, mediaId });
      setRemoving((prev) => {
        const next = new Map(prev);
        if (ok) next.delete(mediaId);
        else next.set(mediaId, "failed");
        return next;
      });
      if (!ok) return;
      setRemoved((prev) => new Set(prev).add(mediaId));
      onOwnRemoved?.(
        mediaId,
        latestTiles.current.filter((t) => t.mediaId && t.mediaId !== mediaId)
          .length,
      );
      // ★ A REMOVAL FREES ITS FRAME LIVE: the count steps up at once (it leaves the pending shots) and the server's
      // roll is read again to say so in its own numbers.
      wanted.current = true;
      setReadTick((n) => n + 1);
    },
    [qrToken, sessionToken, onOwnRemoved],
  );

  /* ── the place ─────────────────────────────────────────────────────────────────────────────── */
  const close = useCallback(() => {
    setView("camera");
    onOpenChange(false);
  }, [onOpenChange]);
  useBackCloses(open, close);
  const contentRef = useRef<HTMLDivElement>(null);
  const shutterRef = useRef<HTMLButtonElement>(null);
  const shotsBackRef = useRef<HTMLButtonElement>(null);
  const openShots = useCallback(() => setView("shots"), []);
  const backToCamera = useCallback(() => {
    setView("camera");
    window.requestAnimationFrame(() => shutterRef.current?.focus());
  }, []);
  // Her shots hold their own entry, over the camera's (the head's note): Back peels them, then the camera.
  useBackCloses(open && view === "shots", backToCamera);
  useEffect(() => {
    if (view === "shots") shotsBackRef.current?.focus();
  }, [view]);

  const frame = host ? counted.length + 1 : guest.frame;
  const doneLine = guest.ceilingReached
    ? ROLL_RETAKES_SPENT_MESSAGE
    : rollDoneLine({ cap, reveal, developsAt, nowMs: now });

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogPrimitive.Portal container={usePortalContainer()}>
        {/* The overlay is the page's scroll lock and holds the camera (the reel view's own shape). */}
        <DialogPrimitive.Overlay
          data-album-camera-overlay=""
          className="fixed inset-0 z-50 bg-black"
        >
          <DialogPrimitive.Content
            aria-describedby={undefined}
            data-album-camera=""
            ref={contentRef}
            tabIndex={-1}
            onOpenAutoFocus={(e) => {
              // The shutter takes the focus, so Space shoots at once and Tab walks the controls; while the camera
              // is still opening (the shutter disabled) the camera itself holds it.
              e.preventDefault();
              const shutter = shutterRef.current;
              if (shutter && !shutter.disabled) shutter.focus();
              else contentRef.current?.focus();
            }}
            onEscapeKeyDown={(e) => {
              // Her shots, open over the camera, close first.
              if (view === "shots") {
                e.preventDefault();
                backToCamera();
              }
            }}
            // Nothing is outside a camera that covers the screen but another layer.
            onInteractOutside={(e) => e.preventDefault()}
            className="fixed inset-0 z-50 overflow-hidden bg-black text-white outline-none select-none"
          >
            <DialogPrimitive.Title className="sr-only">
              {`${event.name}: the camera`}
            </DialogPrimitive.Title>
            <CameraScreen
              eventName={event.name}
              reveal={reveal}
              developsAt={developsAt}
              host={host}
              left={host ? counted.length : guest.left}
              frame={frame}
              caption={reelCaption({
                frame,
                cap,
                done,
                host,
                sending,
              })}
              cap={cap}
              used={used}
              recent={counted.map(({ shot, state }) => ({
                key: shot.key,
                takenAt: shot.takenAt,
                kind: shot.kind,
                seconds: shot.seconds,
                sending: inFlight(state),
              }))}
              frozen={frozen}
              just={just}
              albumTakesVideo={event.accepts_video}
              unsent={{
                count: toRetry.length,
                retryable: toRetry.length > 0,
                dropped: droppedUnsent,
              }}
              latestRefusal={
                latestFileRefusal
                  ? {
                      key: latestFileRefusal.shot.key,
                      sentence: latestFileRefusal.state.error ?? "",
                    }
                  : null
              }
              blocked={blocked}
              done={done}
              doneLine={doneLine}
              freeAFrame={!guest.ceilingReached}
              reelLabel={reelLabel(used, host)}
              hidden={view === "shots"}
              shutterRef={shutterRef}
              onShot={onShot}
              onShotFile={onShotFile}
              onShotLost={onShotLost}
              onRetryUnsent={retryUnsent}
              onOpenShots={openShots}
              onClose={close}
            />
            {view === "shots" && (
              <YourShots
                headingRef={shotsBackRef}
                tiles={tiles}
                line={yourShotsLine({ reveal, developsAt, nowMs: now })}
                count={host ? `${counted.length} taken` : `${used} of ${cap}`}
                removing={removing}
                canFreeFrames={!host && !guest.ceilingReached}
                onRemove={(id) => void remove(id)}
                onRetry={(queueId) => {
                  const at = Date.now();
                  setShots((prev) =>
                    prev.map((s) =>
                      states.some(
                        (x) =>
                          x.shot.key === s.key && x.state.queueId === queueId,
                      )
                        ? { ...s, retriedAt: at }
                        : s,
                    ),
                  );
                  onRetry(queueId);
                }}
                onBack={backToCamera}
              />
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
