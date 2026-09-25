"use client";

/**
 * THE GUEST UPLOAD QUEUE: one-file-at-a-time uploads (robust on flaky mobile
 * connections), per-item progress patching, the just-in-time SILENT join
 * (no prompts - account-required events are gated at the page level), the
 * pending-files stash, demo simulation, and retry. `event-experience.tsx`
 * owns it, so the door's upload step and the album's `GuestUpload` both read
 * one snapshot.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { joinEvent } from "@/lib/guest/join";
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";
import { dropGuestTicket } from "@/lib/guest/use-stored-session";
import { uploadFile, type UploadOutcome } from "@/lib/upload/uploader";

/**
 * The two refusal codes this queue reads by name. Everything else is a file's
 * own problem and belongs to the failure sheet; these two are the SESSION's.
 *
 *   `verification_required`: the host turned Require verified emails on under a
 *   name-only ticket, which invalidates every file still waiting behind it.
 *
 *   `session_other_account` (`SESSION_OTHER_ACCOUNT`): the ticket this device
 *   kept belongs to an account the viewer is not. The ticket goes down and the
 *   viewer joins as themselves, and the file is NOT failed: it waits and goes up
 *   on the new ticket, so no photograph is lost and none is credited to the
 *   ticket's owner.
 */
const VERIFICATION_REQUIRED = "verification_required";

export type QueueItemStatus = "queued" | "uploading" | "done" | "error";

export type QueueItem = {
  id: string;
  file: File;
  /** Derived at enqueue from the MIME type, so a pending tile can wear the
   *  video badge before the server confirms anything. */
  kind: "photo" | "video";
  status: QueueItemStatus;
  progress: number;
  mediaStatus?: string;
  /**
   * The row this file became, once it exists. The album needs it for the ONE
   * case where a finished upload is still drawn on this device and has to stop
   * being drawn: a HELD file (`mediaStatus === "pending"`) keeps its waiting
   * tile at the album's head until the host approves it, and the only way to
   * know that has happened is to see this id arrive in the poll's own list.
   * Without it the tile would sit beside the real photograph it became.
   */
  mediaId?: string;
  error?: string;
  /**
   * THE SERVER'S OWN REFUSAL CODE, kept beside its sentence. The album's failure sheet needs only
   * the words, but the door's upload step has no exit, so what a guest can DO about a refusal has
   * to be derivable: `uploads_closed` and `cap_reached` open the album (the fail-open),
   * `invalid_session` goes back to the name, and only the rest may offer a Retry. Absent for a
   * local validation or a transport failure, which `classifyRefusal` reads as "worth another go".
   */
  errorCode?: string;
  /**
   * A CUT the on-device creator is adding to the album: the row is written `reel_eligible = false`,
   * so the live reel never plays a reel. Absent for every other file. It rides the queue like any
   * upload (one at a time, the silent join, retry, the failure sheet), because a clip added to the
   * album IS an upload like any other (guest-flow.md).
   */
  reelEligible?: false;
  /** The clip's poster, drawn by its creator: the album's preview for it (uploader.ts). */
  poster?: Blob;
};

export type UploadedItem = {
  mediaId: string;
  /** The queue item that produced this upload - lets the gallery re-key its
   *  optimistic blob URL from queue id to media id with zero flicker. */
  queueId: string;
  file: File;
  kind: "photo" | "video";
  /** create_media status: 'approved' (live) or 'pending' (hold_for_approval). */
  status: string;
};

// Demo mode: fake an upload (a brief progress ramp) and return a synthetic
// "approved" outcome. Nothing hits the network - the gallery renders the local
// file via the optimistic-tile path, and the synthetic id never appears in the
// poll, so it survives until refresh. No presign / R2 PUT / create_media.
async function simulateUpload(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<{
  ok: true;
  status: "approved";
  mediaId: string;
  kind: "photo" | "video";
}> {
  for (const fraction of [0.3, 0.6, 0.85, 1]) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    onProgress(fraction);
  }
  return {
    ok: true,
    status: "approved",
    mediaId: crypto.randomUUID(),
    kind: file.type.startsWith("video/") ? "video" : "photo",
  };
}

export function useUploadQueue({
  qrToken,
  sessionToken,
  onSession,
  onUploaded,
  isDemo,
  isVerified = false,
  onVerificationRequired,
  onDoorNeeded,
}: {
  qrToken: string;
  sessionToken: string | null;
  onSession: (token: string | null) => void;
  onUploaded: (item: UploadedItem) => void;
  /** Demo event: simulate uploads client-side, persist nothing. */
  isDemo: boolean;
  /**
   * The viewer holds a CONFIRMED account. It decides what a lost ticket costs:
   * a signed-in guest re-joins silently (their own uid mints their own row and
   * the run carries on), a name-only guest or a signed-out visitor cannot. For a
   * mid-run `verification_required` the run then ends and the page re-gates; for
   * a `session_other_account` the files wait for the door (`onDoorNeeded`).
   */
  isVerified?: boolean;
  /**
   * The host turned Require verified emails ON mid-visit; the session is spent.
   * `hadQueuedFiles` tells the caller whether the failure sheet is about to
   * open for THIS refusal (a mid-run flip: `true`) or whether nothing was ever
   * queued (`joinSilently`'s own refusal: `false`, no sheet incoming) — the one
   * fact a caller cannot infer safely from its own React state at the instant
   * this fires (the refresh waits for the failure sheet: see
   * event-experience.tsx's own note for why that matters).
   */
  onVerificationRequired?: (message: string, hadQueuedFiles: boolean) => void;
  /**
   * Files are waiting and this device holds no ticket the queue can mint on its
   * own: the viewer is signed out, or signed in without a confirmed email, so
   * only the door can name them (a name in names mode, the email step in
   * verified mode). The caller re-resolves who is here (the page refreshes, so a
   * sign-out in another tab is seen too) and the door opens; the files stay
   * `queued` and go up the moment its join hands a ticket down through
   * `sessionToken`. Nothing is failed and nothing opens a failure sheet: from
   * the guest's side the door simply asks their name.
   */
  onDoorNeeded?: () => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  // Ref mirror so the sequential queue runner reads current state synchronously.
  const itemsRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  // The session can flip null→token WHILE mounted (just-in-time join), so the
  // queue reads a ref, not the prop, to avoid a stale closure.
  const sessionRef = useRef(sessionToken);
  useEffect(() => {
    sessionRef.current = sessionToken;
  }, [sessionToken]);
  // Files picked before a session exists — uploaded once the session is created.
  const pendingFilesRef = useRef<File[]>([]);
  // The same stash for a clip (it carries its poster and its reel flag with it).
  const pendingClipsRef = useRef<{ file: File; poster: Blob }[]>([]);
  // One silent re-join per run at most: a signed-in guest whose row predates the
  // host's flip gets a fresh, verified row and carries on. Without the guard a
  // route that keeps refusing would have this loop minting rows forever.
  const rejoinedRef = useRef(false);
  /* The same guard for a ticket that was not the viewer's (see `acquireTicket`):
     one silent join per chain of refusals, spent until a file actually lands or
     the guest presses Retry, so a server that kept refusing the row it had just
     minted could never turn this loop into a row factory. */
  const silentJoinSpentRef = useRef(false);
  const isVerifiedRef = useRef(isVerified);
  useEffect(() => {
    isVerifiedRef.current = isVerified;
  }, [isVerified]);

  const sync = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, p: Partial<QueueItem>) => {
      sync(itemsRef.current.map((it) => (it.id === id ? { ...it, ...p } : it)));
    },
    [sync],
  );

  /**
   * Fail everything still waiting, in place, with one sentence (a join that
   * nobody at the door could fix: offline, a rate limit, a dead link). The
   * failure sheet opens once over the lot, and its Retry comes back through
   * `retry`, which gives the silent join another chance.
   */
  const failWaiting = useCallback(
    (message: string, code?: string) => {
      sync(
        itemsRef.current.map((it) =>
          it.status === "queued"
            ? {
                ...it,
                status: "error" as const,
                progress: 0,
                error: message,
                errorCode: code,
              }
            : it,
        ),
      );
    },
    [sync],
  );

  /* ──────────────────────────────────────────────────────────────────────────
     A RUN WITH FILES WAITING AND NO TICKET.

     The ticket went down under the run (a `session_other_account` below, or a
     Retry after one), so the viewer joins again AS WHOEVER IS HOLDING THE PHONE
     NOW, which the server decides, never the ticket.

     ★ A CONFIRMED ACCOUNT JOINS SILENTLY: `create_guest` mints its own row from
     its own uid, and the run carries on as if nothing happened, because nothing
     about THEM changed. Once per chain (`silentJoinSpentRef`).

     ★ ANYONE ELSE MEETS THE DOOR: a signed-out visitor or an unconfirmed account
     has no identity the queue can mint on its own (a name in names mode, a
     proved email in verified mode), so `onDoorNeeded` hands them to it and the
     files wait, `queued`, for the ticket its join hands down. A 422 from the
     silent join means the page thought this viewer was confirmed and the server
     does not (a sign-out in another tab): the door is the answer there too.

     Returns the new ticket, or null when this run stops here.
     ────────────────────────────────────────────────────────────────────────── */
  const acquireTicket = useCallback(async (): Promise<string | null> => {
    if (isDemo) {
      // The demo mints nothing and never loses its ticket; this is a belt.
      sessionRef.current = "demo";
      onSession("demo");
      return "demo";
    }
    if (isVerifiedRef.current && !silentJoinSpentRef.current) {
      silentJoinSpentRef.current = true;
      const joined = await joinEvent({ qrToken });
      if (joined.ok) {
        sessionRef.current = joined.guest.sessionToken;
        onSession(joined.guest.sessionToken);
        return joined.guest.sessionToken;
      }
      if (
        joined.refusal.kind !== "name_required" &&
        joined.refusal.kind !== "verification_required"
      ) {
        failWaiting(joined.refusal.message, joined.refusal.kind);
        return null;
      }
    }
    onDoorNeeded?.();
    return null;
  }, [isDemo, qrToken, onSession, onDoorNeeded, failWaiting]);

  // One file at a time — robust on flaky mobile connections.
  const runQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === "queued");
        if (!next) break;
        /* ★ THE TICKET IS READ PER FILE, NEVER ONCE PER RUN. Both re-joins
           below swap it mid-run, and the file after a swap must go up on the NEW
           one. (Read once at the top, the verified re-join after a mid-run flip
           would re-send the refused file on the SPENT ticket and fail the run it
           exists to save.) */
        const token = sessionRef.current ?? (await acquireTicket());
        if (!token) break;
        patch(next.id, { status: "uploading", progress: 0, error: undefined });
        const onProgress = (f: number) =>
          patch(next.id, { progress: Math.round(f * 100) });
        // BELT AND BRACES with uploadFile's never-reject contract. If anything
        // ever DOES reject here, the throw would escape this for(;;) loop: the
        // current file would be left at "uploading" with no error and no retry
        // affordance, and every file still queued behind it would be silently
        // abandoned. One file's failure must only ever fail THAT file.
        let outcome: UploadOutcome;
        try {
          outcome = isDemo
            ? await simulateUpload(next.file, onProgress)
            : await uploadFile({
                file: next.file,
                endpoints: {
                  presign: "/api/r2/presign-upload",
                  complete: "/api/r2/complete-upload",
                },
                identity: { session_token: token },
                onProgress,
                reelEligible: next.reelEligible,
                poster: next.poster,
              });
        } catch (e) {
          console.error("upload queue: unexpected failure", e);
          outcome = {
            ok: false,
            message: "Something went wrong with that upload. Please try again.",
          };
        }
        if (outcome.ok) {
          // A file landed on this ticket: any later refusal is a new chain.
          silentJoinSpentRef.current = false;
          patch(next.id, {
            status: "done",
            progress: 100,
            mediaStatus: outcome.status,
            mediaId: outcome.mediaId,
          });
          onUploaded({
            mediaId: outcome.mediaId,
            queueId: next.id,
            file: next.file,
            kind: outcome.kind,
            status: outcome.status,
          });
          continue;
        }
        /* ──────────────────────────────────────────────────────────────────
           SOMEBODY ELSE'S TICKET.

           This device kept a ticket whose row belongs to an account, and the
           viewer is not that account (signed out, or signed in as someone
           else): the routes refuse it (lib/guest/session-owner.ts), at presign
           or, when a sign-out overtook a presign, at completion. The ticket is
           put down (the token, the name and address flag beside it, the
           cookie) and this file goes back in the queue rather than into the
           failure sheet; the next pass finds no ticket and `acquireTicket`
           joins as the viewer the server says this is. So nothing is lost and
           nothing is credited to the ticket's owner, and a guest who is signed
           in never learns it happened.
           ────────────────────────────────────────────────────────────────── */
        if (outcome.code === SESSION_OTHER_ACCOUNT) {
          sessionRef.current = null;
          onSession(null);
          patch(next.id, { status: "queued", progress: 0 });
          await dropGuestTicket(qrToken);
          continue;
        }
        /* ──────────────────────────────────────────────────────────────────
           THE FLIP, MID-RUN.

           A host can turn Require verified emails ON while a guest is halfway
           through twelve files. The route answers 403 `verification_required`,
           and the difference this branch draws is between one refused FILE and
           a spent SESSION: if the session is spent, every file still queued
           behind this one will be refused for the same reason, and letting the
           loop discover that twelve times over means twelve identical lines in
           the failure sheet and twelve pointless round trips.

           ★ A SIGNED-IN GUEST SIMPLY RE-JOINS. Their row predates the flip, but
           their uid is confirmed, so `create_guest` mints a verified one and the
           run continues on the new token — the guest never learns any of this
           happened, which is right, because nothing about THEM changed.

           ★ A NAME-ONLY GUEST CANNOT. The session is dropped here (so the next
           Add meets the gate rather than a token that cannot work) and the rest
           of the run is failed in place with the server's own sentence, so the
           failure sheet opens once, lists everything that did not go, and says
           the same true thing about all of it.
           ────────────────────────────────────────────────────────────────── */
        if (outcome.code === VERIFICATION_REQUIRED) {
          if (isVerifiedRef.current && !rejoinedRef.current) {
            rejoinedRef.current = true;
            const rejoined = await joinEvent({ qrToken });
            if (rejoined.ok) {
              sessionRef.current = rejoined.guest.sessionToken;
              onSession(rejoined.guest.sessionToken);
              // Re-queue the file this refusal cost and go round again.
              patch(next.id, { status: "queued", progress: 0 });
              continue;
            }
          }
          sessionRef.current = null;
          onSession(null);
          const refused = itemsRef.current.map((it) =>
            it.id === next.id || it.status === "queued"
              ? {
                  ...it,
                  status: "error" as const,
                  progress: 0,
                  error: outcome.message,
                  errorCode: outcome.code,
                }
              : it,
          );
          sync(refused);
          onVerificationRequired?.(outcome.message, true);
          break;
        }
        patch(next.id, {
          status: "error",
          error: outcome.message,
          errorCode: outcome.code,
        });
      }
    } finally {
      processingRef.current = false;
    }
  }, [
    patch,
    sync,
    onUploaded,
    onSession,
    onVerificationRequired,
    acquireTicket,
    isDemo,
    qrToken,
  ]);

  /* ★ AND THE RUN RESUMES WHEN A TICKET ARRIVES FROM THE DOOR. Files left
     `queued` for `onDoorNeeded` wait for exactly one thing: the name step's join
     (or the email step's confirmation) handing a fresh ticket down through
     `sessionToken`. That is the moment to carry on. Keyed on the ticket alone,
     through a ref to the live runner, so a re-render never starts a run; the
     runner's own guard makes a second call a no-op. */
  const runQueueRef = useRef(runQueue);
  useEffect(() => {
    runQueueRef.current = runQueue;
  }, [runQueue]);
  useEffect(() => {
    if (!sessionToken) return;
    if (!itemsRef.current.some((it) => it.status === "queued")) return;
    void runQueueRef.current();
  }, [sessionToken]);

  const enqueue = useCallback(
    (files: File[], extra: Pick<QueueItem, "reelEligible" | "poster"> = {}) => {
      const additions: QueueItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        kind: file.type.startsWith("video/") ? "video" : "photo",
        status: "queued",
        progress: 0,
        ...extra,
      }));
      sync([...itemsRef.current, ...additions]);
      void runQueue();
    },
    [runQueue, sync],
  );

  const handleJoined = useCallback(
    (token: string) => {
      onSession(token);
      sessionRef.current = token; // runQueue (called below) sees it immediately
      const stashed = pendingFilesRef.current;
      pendingFilesRef.current = [];
      if (stashed.length) enqueue(stashed);
      const clips = pendingClipsRef.current;
      pendingClipsRef.current = [];
      for (const clip of clips) {
        enqueue([clip.file], { reelEligible: false, poster: clip.poster });
      }
    },
    [onSession, enqueue],
  );

  /**
   * THE SILENT JOIN, AND IT STAYS NAMELESS.
   *
   * This is the path for the two people who never meet the name door: a
   * SIGNED-IN guest (their profile name is the identity, and `create_guest`
   * nulls a typed name on a confirmed session anyway) and a guest whose device
   * already holds a session. A name-only guest reaches `joinEvent` through the
   * DOOR instead (`guest-name-step.tsx`), which is the only place the name is
   * typed. So no name is passed here, deliberately, and `joinEvent` exists so
   * both callers speak to the route through one shape.
   *
   * The JOIN's own failure toasts, and it is the only upload toast: nothing
   * was ever queued, so there is no failure sheet to carry it.
   */
  const joinSilently = useCallback(async () => {
    if (isDemo) {
      handleJoined("demo");
      return;
    }
    const joined = await joinEvent({ qrToken });
    if (!joined.ok) {
      pendingFilesRef.current = [];
      pendingClipsRef.current = [];
      if (joined.refusal.kind === "verification_required") {
        // The host requires a confirmed email and this device cannot satisfy
        // it. The gate says that far better than a toast can. Nothing was ever
        // queued, so there is no failure sheet standing between here and the
        // gate: the refresh this raises is honest right away.
        onVerificationRequired?.(joined.refusal.message, false);
        return;
      }
      toast.error("Couldn't start uploading", {
        description: joined.refusal.message,
      });
      return;
    }
    handleJoined(joined.guest.sessionToken);
  }, [isDemo, qrToken, handleJoined, onVerificationRequired]);

  const addFiles = useCallback(
    (files: File[]) => {
      if (sessionRef.current) {
        enqueue(files);
        return;
      }
      // No session yet → silent join (account-required events are gated at the page).
      pendingFilesRef.current = files;
      void joinSilently();
    },
    [enqueue, joinSilently],
  );

  /**
   * ★ THE CLIP'S SEAM: `addClipToAlbum(file, poster)` for the on-device creator. The clip goes through
   * the ORDINARY queue, one at a time behind whatever else is going, with the same join, retry and
   * failure sheet as a photograph; the only differences are that its row is written
   * `reel_eligible = false` (the live reel never plays a reel) and that its album preview is the
   * poster the creator drew. A clip is a video, so `create_media`'s paid-only video gate decides
   * whether this album takes one; the creator reads the same fact (`ClipFacts`) first.
   */
  const addClip = useCallback(
    (file: File, poster: Blob) => {
      if (sessionRef.current) {
        enqueue([file], { reelEligible: false, poster });
        return;
      }
      pendingClipsRef.current = [...pendingClipsRef.current, { file, poster }];
      void joinSilently();
    },
    [enqueue, joinSilently],
  );

  /**
   * Reset an errored item and re-run the queue. A Retry is the guest's own
   * fresh try, so it also gives the silent join back (a network blip may be
   * what spent it). With no ticket on the device the run joins as the viewer
   * first (`acquireTicket`); "Retry all" lands here once per file, and the
   * runner's own guard keeps that to ONE join.
   */
  const retry = useCallback(
    (id: string) => {
      silentJoinSpentRef.current = false;
      patch(id, {
        status: "queued",
        progress: 0,
        error: undefined,
        errorCode: undefined,
      });
      void runQueue();
    },
    [patch, runQueue],
  );

  /**
   * Drop the named ERRORED items from the queue for good (the failure sheet's
   * "Not now" and its own close): a dismissed failure is gone. Without this it
   * would sit in `items` forever: the sheet's own list is a live filter over
   * `items`, so the NEXT run's end would see the same old error still there
   * and reopen on it (refuse `notes.txt`, Not now, and a clean twelve-file run
   * would still end on "1 file did not go - notes.txt").
   * ★ Status-gated, not id-alone: `retryAll` re-queues each listed id (flips
   * it to "queued" via `patch`, synchronously through the `itemsRef` mirror)
   * and THEN closes the sheet, which is the same `dismiss` call reaching the
   * very ids it just retried. Checking the LIVE status here (not the status
   * implied by the id being on the list) means a retried item already reads
   * "queued" by the time this runs and survives; only an id still sitting at
   * "error" is actually dropped.
   */
  const dismiss = useCallback(
    (ids: readonly string[]) => {
      if (ids.length === 0) return;
      const dismissed = new Set(ids);
      sync(
        itemsRef.current.filter(
          (it) => !(dismissed.has(it.id) && it.status === "error"),
        ),
      );
    },
    [sync],
  );

  return { items, addFiles, addClip, retry, dismiss };
}
