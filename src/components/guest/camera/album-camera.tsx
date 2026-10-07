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
 * ★ THE ROLL IS THE SERVER'S (`roll-view.ts`): read as the camera opens, after she takes a shot back, after a refusal
 * about the roll and when the album turns to a develop, and only while nothing of hers is in the air, so the count
 * between two reads is the read plus the shots taken since. A refusal is the server's own sentence: the roll's end
 * (`roll_spent`, the ceiling), the album itself refusing (closed, full, private: the shutter stops), or one shot that
 * did not send (Retry).
 *
 * ★ HER 3 RE-SHOOTS, AND TWO DOORS TO TAKE ONE BACK (guest-moments r1's `limit=three` and `where=reel`): the reel's
 * newest frame opens that shot with Take it back and Keep it, and Your shots keeps its X with no question; both take a
 * shot back through one removal, free its frame and spend one of her 3, said where she takes it back (the sheet's line,
 * her list's head, the camera's line after) and at the roll's end once they are spent.
 *
 * ★ A FRESH ROLL, SAID ONCE (host-moments r1's `fresh-roll=panel`): the first time this camera reads a roll on another
 * period than the one she last held shots on (`fresh-roll.ts`), a panel over the finder says why and when it develops,
 * and the shutter waits for Start shooting.
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
  FreshRollPanel,
  TakeBackPanel,
  type TakeBackState,
} from "@/components/guest/camera/camera-panels";
import {
  CameraScreen,
  type NewShot,
} from "@/components/guest/camera/camera-screen";
import { removeOwnShot } from "@/components/guest/camera/remove-shot";
import { useBlobUrls } from "@/components/guest/camera/use-blob-urls";
import { YourShots, type ShotTile } from "@/components/guest/camera/your-shots";
import type { UploadsWord } from "@/components/guest/event-experience-open";
import { usePartyZone } from "@/components/guest/party-zone";
import { useBackCloses } from "@/components/ui/popup-back";
import { usePortalContainer } from "@/components/ui/portal-container";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { RollCount } from "@/lib/disposable/roll";
import { canvasJpeg } from "@/lib/guest/camera/capture";
import {
  isFreshRoll,
  keepPeriod,
  keepsPeriod,
  readKeptPeriod,
} from "@/lib/guest/camera/fresh-roll";
import {
  pictureIsVideoFile,
  readOwnRoll,
  waitsOutOfSight,
  type OwnShot,
} from "@/lib/guest/camera/own-shots";
import { reelMinute } from "@/lib/guest/camera/reel";
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
  freeAFrameLine,
  freshRollLine,
  newestShotLabel,
  reelCaption,
  reelLabel,
  removingSpentLine,
  reshootsSpentLine,
  revealFor,
  type CameraReveal,
  rollDoneLine,
  shotsCountLine,
  takeBackLine,
  takenBackLine,
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
 * ★ AN ALBUM THAT REFUSES FOR A REASON ITS HOST CAN LIFT MAY SAY YES LATER: uploads closed (the host reopens them) or
 * the album full (she makes room). A camera left open over such a refusal would keep its banner and its stopped shutter
 * until she closed it (the ROADMAP's "the camera never hears uploads reopen"), so it hears the album say yes:
 *  - CLOSED, FROM THE ALBUM'S OWN WORD where the page has one (`uploadsWord`, guest-requests): the album's sync carries
 *    the host's switch and its validator hashes it while it is off, so a reopen reaches the page on its next poll and
 *    this camera asks once, on the first word heard after the refusal that says open, and never by itself: no presign
 *    on a clock, at the page's return or when the line comes back, over an album that has said nothing new.
 *  - FULL, and closed where the page has no word (the door's camera), BY ASKING AGAIN on a calm and slowing cadence
 *    (each ask is a real presign, and the longer it has been shut the likelier it stays so), and at once when the page
 *    comes back to the screen: no answer carries whether the host made room.
 * Any other refusal of the album (a lock, a gone event, a ticket that is not hers) is not the host's to lift in a
 * minute, and is never asked again.
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
 * reading of it, not the event's stored one), how the album is moderated and whether it takes a video, and the host's
 * name where the page holds it (a fresh roll says who set the develop time; the album's slot hands its whole event).
 * Narrow so the door, which holds the camera for the album's first photograph before the album's own slot has mounted,
 * can hand it what it knows without a whole event.
 */
export type CameraEvent = Pick<
  GuestEvent,
  "name" | "roll_size" | "develops_at" | "moderation_mode" | "accepts_video"
> &
  Partial<Pick<GuestEvent, "host_display_name">>;

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
  uploadsWord,
  onAskUploadsWord,
  heldAtDoor = false,
}: {
  open: boolean;
  /**
   * The album's own word on whether it takes uploads, as the page hears it from the album's sync (`useLiveUploadsWord`,
   * guest-requests): a closed refusal is asked again once a word heard after it says open (the head's note). Absent
   * where the page has no such word (the door's camera), which asks a closed album again on the calm cadence.
   */
  uploadsWord?: UploadsWord;
  /** Ask the album for its word afresh (its next sync carries no validator): a closed refusal over a word that said open. */
  onAskUploadsWord?: () => void;
  /**
   * ★ THE HELD DOOR HOLDS HER SHOTS (crumbs-85): opened from the held door's wait, what she takes waits in the page's
   * queue until the host lets her in, so the camera says so (`reveal` "door": "They go in once you're let in") and draws
   * none of them sending; "Every shot goes straight in" over shots going nowhere was the door's own red-team NIT.
   */
  heldAtDoor?: boolean;
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
  // The party's zone, for a far party's develop time in both clocks (`party-zone.tsx`).
  const partyZone = usePartyZone();
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
  /** Her newest shot, pressed on the reel: the shot's key while its sheet stands over the picture. */
  const [sheet, setSheet] = useState<string | null>(null);
  /** A fresh roll's panel stands over the finder (said once a period: `fresh-roll.ts`). */
  const [fresh, setFresh] = useState(false);
  /** A line the camera says once under the shutter (a shot taken back). */
  const [notice, setNotice] = useState<{ key: string; text: string } | null>(
    null,
  );

  /* ── the clock its words read (the develop time, said from now) ─────────────────────────────── */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [open]);
  const now = Math.max(openedAt, tick);
  const reveal: CameraReveal = heldAtDoor ? "door" : revealFor(event, now);
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
    // ★ THE LEDGER KEEPS WHAT SHE TOOK BACK: a shot taken since the read and taken back since frees its frame and
    // spends its re-shoot at once, so only the dismissed (which never landed) leave this count.
    taken: pendingSince(
      raw.filter(
        ({ shot, state }) =>
          !(state.status === "sending" && !state.queueId && held.has(shot.key)),
      ),
      roll.readFrom,
    ),
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
      // ★ A FRESH ROLL, SAID ONCE: a roll answered on another period than the one she last held shots on started again
      // since; the panel is spent as it is decided (the device keeps the new period), so it is never said twice.
      const period = answer.roll?.period;
      const kept = readKeptPeriod(qrToken);
      const isFresh = isFreshRoll(kept, period);
      if (isFresh) setFresh(true);
      if (
        typeof period === "number" &&
        keepsPeriod({
          kept,
          period,
          held: answer.roll?.used ?? 0,
          said: isFresh,
        })
      ) {
        keepPeriod(qrToken, period);
      }
      setRoll({ server: answer.roll, readFrom: from });
      setOwn(answer.shots);
    });
  }, [open, busy, readTick, qrToken, sessionToken, isDemo, isOwner]);

  // ★ A DEVELOP TIME ADDED WHILE SHE SHOOTS BEGINS A NEW PERIOD (`events_reveal_stamp`), so the album turning to a
  // develop under an open camera reads her roll again: its count starts over, and its fresh roll is said then.
  const revealWas = useRef(reveal);
  useEffect(() => {
    const was = revealWas.current;
    revealWas.current = reveal;
    if (reveal === "develop" && was !== "develop") {
      wanted.current = true;
      setReadTick((n) => n + 1);
    }
  }, [reveal]);

  // The period she holds shots on is kept as her shots land, so a roll that starts again after them is told her once.
  const period = roll.server?.period;
  const holdsShots = !isOwner && !isDemo && guest.held > 0;
  useEffect(() => {
    if (typeof period !== "number" || !holdsShots) return;
    const kept = readKeptPeriod(qrToken);
    if (keepsPeriod({ kept, period, held: 1, said: false })) {
      keepPeriod(qrToken, period);
    }
  }, [period, holdsShots, qrToken]);

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
  // What the album refused for a reason its host can lift (`LIFTABLE_REFUSALS`), by how it hears her lift it: a closed
  // album by its own word where the page has one (`uploadsWord`), the rest by asking again on the calm cadence.
  const reopenable = failed.filter(
    ({ state }) =>
      state.queueId && state.code && LIFTABLE_REFUSALS.has(state.code),
  );
  const hearsWord = uploadsWord !== undefined;
  const wordLifts = hearsWord
    ? reopenable.filter(({ state }) => state.code === "uploads_closed")
    : [];
  const cadenceAsks = hearsWord
    ? reopenable.filter(({ state }) => state.code !== "uploads_closed")
    : reopenable;
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
  /** Sends these shots again; what the album refused stands as that refusal while it is asked again (`asking`). */
  const sendAgain = useCallback(
    (again: typeof failed) => {
      const at = Date.now();
      const keys = new Set(again.map(({ shot }) => shot.key));
      setShots((prev) =>
        prev.map((s) => (keys.has(s.key) ? { ...s, retriedAt: at } : s)),
      );
      const lifted = again.filter(
        ({ state }) => state.code && LIFTABLE_REFUSALS.has(state.code),
      );
      if (lifted.length > 0) {
        setAsking((prev) => {
          const next = new Map(prev);
          for (const { shot, state } of lifted) next.set(shot.key, state);
          return next;
        });
      }
      for (const { state } of again) onRetry(state.queueId as string);
    },
    [onRetry],
  );
  // Her own Retry, and the album's word turning open: everything that did not go.
  const retryUnsent = useCallback(
    () => sendAgain([...toRetry, ...reopenable]),
    [sendAgain, toRetry, reopenable],
  );
  // What goes again BY ITSELF (the line back, the calm cadence): never a closed album with a word of its own to say.
  const retryByItself = useCallback(
    () => sendAgain([...toRetry, ...cadenceAsks]),
    [sendAgain, toRetry, cadenceAsks],
  );
  // The connection back: what did not send goes again, by itself, while the camera is open.
  const unsentCount = toRetry.length + cadenceAsks.length;
  useEffect(() => {
    if (!open || unsentCount === 0) return;
    window.addEventListener("online", retryByItself);
    return () => window.removeEventListener("online", retryByItself);
  }, [open, unsentCount, retryByItself]);
  // ★ A CLOSED ALBUM IS ASKED ONCE IT SAYS IT IS OPEN (guest-requests): once, on the first word heard AFTER the newest
  // closed refusal that says open, while the camera stands over it. A word heard before the refusal is older than it;
  // and where that word said open, so does the validator the album's polls carry, so a host who reopened before the next
  // poll would be answered 304 and never heard: the album is asked for its word afresh, once a refusal, instead.
  const sendOnWord = useRef(retryUnsent);
  useEffect(() => {
    sendOnWord.current = retryUnsent;
  });
  /** The word heard when the newest closed refusal landed (`heard`), or null before one has. */
  const heardAtRefusal = useRef<number | null>(null);
  /** The page's queue items seen refused as closed (the queue replaces an item on every change: a new refusal is a new item). */
  const seenClosed = useRef(new WeakSet<QueueItem>());
  useEffect(() => {
    if (!uploadsWord) return;
    let fresh = false;
    for (const it of queue) {
      if (it.status !== "error" || it.errorCode !== "uploads_closed") continue;
      if (seenClosed.current.has(it)) continue;
      seenClosed.current.add(it);
      fresh = true;
    }
    if (!fresh) return;
    heardAtRefusal.current = uploadsWord.heard;
    if (uploadsWord.open) onAskUploadsWord?.();
  }, [queue, uploadsWord, onAskUploadsWord]);
  const wordLiftsCount = wordLifts.length;
  useEffect(() => {
    const at = heardAtRefusal.current;
    if (!open || !uploadsWord || wordLiftsCount === 0 || at === null) return;
    if (!uploadsWord.open || uploadsWord.heard <= at) return;
    // One ask a word: the next is a word heard after this one.
    heardAtRefusal.current = uploadsWord.heard;
    sendOnWord.current();
  }, [open, uploadsWord, wordLiftsCount]);
  // ★ AND THE ALBUM THAT MAY HAVE REOPENED OR MADE ROOM IS ASKED, by itself and calmly, where no word will say it: after
  // 10 s, then 20, 40 and every minute, never while the page is hidden, and at once when it comes back. Answered yes, the
  // shot goes, and the banner and the stopped shutter go with the refusal; answered no, the camera never moved.
  const reaskNow = useRef(retryByItself);
  useEffect(() => {
    reaskNow.current = retryByItself;
  });
  const cadenceCount = cadenceAsks.length;
  useEffect(() => {
    if (!open || cadenceCount === 0) return;
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
  }, [open, cadenceCount]);

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
        // At the held door a shot in the page's queue is waiting for the let-in, never sending.
        status:
          heldAtDoor && state.status === "sending" ? "door" : state.status,
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
  }, [states, own, thumbUrls, gone, heldAtDoor]);

  const latestTiles = useRef(tiles);
  useEffect(() => {
    latestTiles.current = tiles;
  });
  const remove = useCallback(
    async (mediaId: string): Promise<boolean> => {
      setRemoving((prev) => new Map(prev).set(mediaId, "working"));
      const ok = await removeOwnShot({ qrToken, sessionToken, mediaId });
      setRemoving((prev) => {
        const next = new Map(prev);
        if (ok) next.delete(mediaId);
        else next.set(mediaId, "failed");
        return next;
      });
      if (!ok) return false;
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
      return true;
    },
    [qrToken, sessionToken, onOwnRemoved],
  );

  /* ── the place ─────────────────────────────────────────────────────────────────────────────── */
  const close = useCallback(() => {
    setView("camera");
    setSheet(null);
    onOpenChange(false);
  }, [onOpenChange]);
  useBackCloses(open, close);
  const contentRef = useRef<HTMLDivElement>(null);
  const shutterRef = useRef<HTMLButtonElement>(null);
  const shotsBackRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  /** Back to the shutter, or the camera itself while the shutter cannot take a shot (the roll's end). */
  const focusCamera = useCallback(() => {
    window.requestAnimationFrame(() => {
      const shutter = shutterRef.current;
      if (shutter && !shutter.disabled) shutter.focus();
      else contentRef.current?.focus();
    });
  }, []);
  const openShots = useCallback(() => {
    setSheet(null);
    setView("shots");
  }, []);
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
  // ★ THE ROLL'S END SAYS WHEN HER RE-SHOOTS ARE SPENT: no take-back frees a frame then (a roll the host made smaller
  // under her shots frees none for another reason, and says only what she holds).
  const reshootsSpent = !host && !guest.removalFrees && guest.held <= cap;
  const doneLine = `${rollDoneLine({
    held: guest.held,
    reveal,
    developsAt,
    nowMs: now,
    zone: partyZone,
  })}${reshootsSpent ? ` ${reshootsSpentLine(guest.allowance)}` : ""}`;

  /* ── her newest shot, a door of its own on the reel ───────────────────────────────────────── */
  // The reel's newest frame holds this visit's newest counted shot (`reel.ts`): a door where the album keeps it out of
  // sight, landed (hers to take back) or still on its way (the sheet waits for its landing). A shot in the album is
  // taken back from the album (the viewer's Delete), so on an album that shows each one, the reel is one door.
  const newestShot = !host && guest.used > 0 ? (counted.at(-1) ?? null) : null;
  const newestTile = newestShot
    ? tiles.find((t) => t.key === newestShot.shot.key)
    : undefined;
  const outOfSight = reveal === "develop" || reveal === "approve";
  const newestDoor =
    newestShot &&
    newestTile &&
    (newestTile.removable || (inFlight(newestShot.state) && outOfSight))
      ? newestShot
      : null;
  const sheetTile = sheet ? tiles.find((t) => t.key === sheet) : undefined;
  const sheetShot = sheet
    ? states.find(({ shot }) => shot.key === sheet)
    : undefined;
  // The sheet stands while its shot is hers to take back or on its way: taken back, refused or in the album, it goes
  // (the sanctioned adjust-state-during-render pattern).
  const sheetHolds = Boolean(
    sheetTile &&
    sheetShot &&
    (sheetTile.removable || inFlight(sheetShot.state)),
  );
  if (sheet !== null && !sheetHolds) setSheet(null);
  const sheetRemoving = sheetTile?.mediaId
    ? removing.get(sheetTile.mediaId)
    : undefined;
  const sheetState: TakeBackState = !sheetTile?.removable
    ? "sending"
    : sheetRemoving === "working"
      ? "working"
      : sheetRemoving === "failed"
        ? "failed"
        : "ready";
  const keep = useCallback(() => {
    setSheet(null);
    focusCamera();
  }, [focusCamera]);
  useBackCloses(open && sheetHolds, keep);
  const takeBack = () => {
    const mediaId = sheetTile?.removable ? sheetTile.mediaId : undefined;
    if (!mediaId || sheetState === "working") return;
    // What is left is said from the count she pressed on: this take-back spends one where it frees a frame.
    const freed = guest.removalFrees;
    const after = Math.max(0, guest.reshoots - (freed ? 1 : 0));
    void remove(mediaId).then((ok) => {
      if (!ok) return;
      setSheet(null);
      setNotice({
        key: crypto.randomUUID(),
        text: takenBackLine({ reshoots: after, freed }),
      });
      focusCamera();
    });
  };
  useEffect(() => {
    if (sheet !== null) keepRef.current?.focus();
  }, [sheet]);

  /* ── a fresh roll, over the finder ──────────────────────────────────────────────────────────── */
  const freshShown = fresh && !host && !isDemo;
  const startShooting = useCallback(() => {
    setFresh(false);
    focusCamera();
  }, [focusCamera]);
  useEffect(() => {
    if (freshShown) startRef.current?.focus();
  }, [freshShown]);

  const over = sheetHolds ? (
    <TakeBackPanel
      src={sheet ? thumbUrls.get(sheet) : undefined}
      video={
        sheetShot?.shot.kind === "video"
          ? Math.max(1, Math.round(sheetShot.shot.seconds ?? 0))
          : undefined
      }
      state={sheetState}
      line={takeBackLine({
        reshoots: guest.reshoots,
        allowance: guest.allowance,
        frees: guest.removalFrees,
      })}
      onTake={takeBack}
      onKeep={keep}
      keepRef={keepRef}
    />
  ) : freshShown ? (
    <FreshRollPanel
      line={freshRollLine({
        host: event.host_display_name ?? null,
        roll: guest.cap,
        reveal,
        developsAt,
        nowMs: now,
        zone: partyZone,
      })}
      onStart={startShooting}
      startRef={startRef}
    />
  ) : null;

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
              // Her newest shot's sheet keeps it and closes first, then her shots, open over the camera.
              if (sheetHolds) {
                e.preventDefault();
                keep();
              } else if (view === "shots") {
                e.preventDefault();
                backToCamera();
              }
            }}
            // Nothing is outside a camera that covers the screen but another layer.
            onInteractOutside={(e) => e.preventDefault()}
            // ★ THE PHONE'S OWN BLACK IS THE ROOM, ON PAPER TOO (`dark`), as a photograph is: every token
            // its controls read is the room's, so the house's focus halo (globals.css, `focus-halo`) is
            // a line of light over a dark band, never paper's ink on black.
            className="dark fixed inset-0 z-50 overflow-hidden bg-black text-white outline-none select-none"
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
                held: guest.held,
                done,
                host,
                sending: heldAtDoor ? 0 : sending,
              })}
              cap={cap}
              used={used}
              recent={counted.map(({ shot, state }) => ({
                key: shot.key,
                takenAt: shot.takenAt,
                kind: shot.kind,
                seconds: shot.seconds,
                sending: inFlight(state) && !heldAtDoor,
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
              freeAFrame={guest.removalFrees}
              freeLine={freeAFrameLine(guest.reshoots)}
              reelLabel={reelLabel(used, host)}
              newest={
                newestDoor
                  ? {
                      shotKey: newestDoor.shot.key,
                      label: newestShotLabel(
                        reelMinute(newestDoor.shot.takenAt),
                      ),
                      onOpen: () => setSheet(newestDoor.shot.key),
                    }
                  : null
              }
              over={over}
              paused={over !== null}
              notice={notice}
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
                line={yourShotsLine({
                  reveal,
                  developsAt,
                  nowMs: now,
                  zone: partyZone,
                })}
                count={
                  host
                    ? `${counted.length} taken`
                    : shotsCountLine(guest.held, cap, guest.reshoots)
                }
                removing={removing}
                canFreeFrames={!host && guest.removalFrees}
                spentLine={
                  reshootsSpent ? removingSpentLine(guest.allowance) : null
                }
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
