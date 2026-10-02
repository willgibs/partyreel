"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  setEventDoorAction,
  type SetEventDoorResult,
} from "@/app/(app)/dashboard/[eventId]/actions";
import {
  updateEventAction,
  updateEventSocialSettingsAction,
} from "@/app/(app)/dashboard/actions";
import { videosAllowedForTier, type Tier } from "@/lib/constants/tiers";
import { developFactsOf, type Capture } from "@/lib/disposable/facts";
import { developState } from "@/lib/disposable/reveal";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import type { Door } from "@/lib/event/door/door";
import type { SettingsFacts } from "@/lib/events/guest-experience-summary";
import { setReelDefaults } from "@/lib/reel/defaults-action";
import { REEL_MOOD_IDS, resolveHoldSec } from "@/lib/reel/defaults";
import {
  DEFAULT_STYLE_ID,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";
import { formatEventDate } from "@/lib/utils";

/**
 * SETTINGS' ONE STATE, SAVED AS IT IS MADE (event-settings r1: "the form's one Save retires; every
 * control saves itself", and the board's carried `saves`: "As it is made, a typed field when you leave
 * it, and a switch that asks first still asks").
 *
 * The server's row is the truth, and what a host has just changed rides OVER it until the server says
 * so: each save lays its value on at once (the rows' sentences and the pages read the same values), is
 * written through the one action that owns that setting, and either stays until the row it revalidated
 * agrees (the overlay then falls away by itself) or is put back with a sentence. ★ ONLY THE NEWEST SAVE
 * OF A SETTING ANSWERS FOR IT: a slow answer to an older change never undoes a newer one (the reel
 * card's own rule, carried to every setting).
 *
 * ★ EACH SAVE SENDS ITS OWN FIELD AND NOTHING ELSE. The retired form sent every field it held on every
 * Save, which is how a QR style or a reel default could ride an unrelated change; here a switch writes
 * its column and a typed field writes itself when it is left.
 */

/** Every setting the four rows and their pages hold, resolved to what a guest meets. */
export type SettingsValues = {
  name: string;
  description: string;
  eventDate: string;
  door: Door;
  hasPassword: boolean;
  requireVerifiedEmail: boolean;
  requireUploadToView: boolean;
  acceptingUploads: boolean;
  review: boolean;
  maxUploadBytes: number | null;
  allowVideos: boolean;
  showReel: boolean;
  reelStyleId: string;
  reelHoldSec: number;
  /** Null where the profile's key is not read (before its migration). */
  displayInProfile: boolean | null;
  /**
   * How guests add, the camera's roll, and the develop time (20261002200000; ISO, null for none). With `review`, the
   * develop time answers "when everyone sees what's added" (`lib/disposable/reveal.ts`). The roll's size is the
   * database's to fill in (24), so it is read and never written here.
   */
  capture: Capture;
  rollSize: number | null;
  developsAt: string | null;
};

/** A stored style that is not a mood (a legacy treatment, a retired id) starts guests on the default. */
export function resolveMood(styleId: string | null): string {
  return styleId && REEL_MOOD_IDS.includes(styleId)
    ? styleId
    : DEFAULT_STYLE_ID;
}

/** A mood's own name. */
export function moodLabel(id: string): string {
  return STYLE_CATALOG.find((entry) => entry.id === id)?.label ?? id;
}

function valuesOf(
  event: HostEvent,
  social: { displayInProfile: boolean } | null,
): SettingsValues {
  return {
    name: event.name,
    description: event.description ?? "",
    eventDate: event.event_date ?? "",
    door: event.door,
    hasPassword: event.has_password,
    requireVerifiedEmail: event.require_verified_email,
    requireUploadToView: event.require_upload_to_view,
    acceptingUploads: event.accepting_uploads,
    review: event.moderation_mode === "hold_for_approval",
    maxUploadBytes: event.max_upload_bytes,
    allowVideos: event.allow_videos,
    showReel: event.show_reel,
    reelStyleId: resolveMood(event.reel_style_id),
    reelHoldSec: resolveHoldSec(event.reel_hold_sec),
    displayInProfile: social ? social.displayInProfile : null,
    // ★ Read through the seam until the types regenerate (the row carries the columns; `Tables<"events">` learns
    // them then). The develop time in one spelling (ISO), so a save the row agrees with lets its overlay go.
    ...developValuesOf(event),
  };
}

/** How guests add and the develop time off the host's row, the time normalized to `toISOString`'s spelling. */
function developValuesOf(
  event: HostEvent,
): Pick<SettingsValues, "capture" | "rollSize" | "developsAt"> {
  const facts = developFactsOf(event);
  const at = facts.developsAt ? new Date(facts.developsAt) : null;
  return {
    capture: facts.capture,
    rollSize: facts.rollSize,
    developsAt:
      at && Number.isFinite(at.getTime()) ? at.toISOString() : facts.developsAt,
  };
}

type Key = keyof SettingsValues;

/** What the rows, the pages and the door's lines read, and the one way each setting is written. */
type SettingsState = {
  eventId: string;
  eventName: string;
  tier: Tier;
  /** The plan takes video (Event Pass, Pro). */
  videosOnPlan: boolean;
  values: SettingsValues;
  facts: SettingsFacts;
  /** The door's own numbers (who is in, who waits, the list), read for the host. */
  counts: DoorCounts;
  pendingCount: number;
  hostHasSlug: boolean;
  reelSample: string | null;
  /** A plain setting of the event row, written through `updateEventAction`. */
  saveEvent: (patch: Partial<SettingsValues>) => Promise<boolean>;
  /** The door, written through `set_event_door`. Resolves the database's answer, or null when refused. */
  saveDoor: (
    door: Door,
  ) => Promise<Extract<SetEventDoorResult, { ok: true }> | null>;
  /** The reel's switch, look or hold, written through `setReelDefaults`. */
  saveReel: (
    patch: Partial<
      Pick<SettingsValues, "showReel" | "reelStyleId" | "reelHoldSec">
    >,
  ) => Promise<boolean>;
  /** Show on my profile, written through the profile's own action. */
  saveProfile: (next: boolean) => Promise<boolean>;
  /**
   * Runs `fn` once no save is on its way: at once (answering true) when none is, else once the last one
   * has landed, what it brought committed (answering false). The panel's page moves wait here
   * (`event-settings-sheet.tsx`).
   */
  afterSaves: (fn: () => void) => boolean;
  /** A setting is being written. */
  saving: (key: Key) => boolean;
};

const Context = createContext<SettingsState | null>(null);

export function useSettings(): SettingsState {
  const ctx = useContext(Context);
  if (!ctx)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}

/** The event row's columns for a plain setting (the update schema's own keys). */
function eventPatch(patch: Partial<SettingsValues>) {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.eventDate !== undefined) out.event_date = patch.eventDate;
  if (patch.requireVerifiedEmail !== undefined)
    out.require_verified_email = patch.requireVerifiedEmail;
  if (patch.requireUploadToView !== undefined)
    out.require_upload_to_view = patch.requireUploadToView;
  if (patch.acceptingUploads !== undefined)
    out.accepting_uploads = patch.acceptingUploads;
  if (patch.review !== undefined)
    out.moderation_mode = patch.review ? "hold_for_approval" : "live";
  if (patch.maxUploadBytes !== undefined)
    out.max_upload_bytes = patch.maxUploadBytes;
  if (patch.allowVideos !== undefined) out.allow_videos = patch.allowVideos;
  if (patch.capture !== undefined) out.capture = patch.capture;
  if (patch.developsAt !== undefined) out.develops_at = patch.developsAt;
  return out;
}

/**
 * THE FOUR WRITES SETTINGS MAKES, each the one action that owns its settings. The Library hands in
 * writes that answer after a round trip and change nothing, so a reviewer there can press every word
 * and switch without reaching anyone's event.
 */
export type SettingsWrites = {
  updateEvent: typeof updateEventAction;
  setDoor: typeof setEventDoorAction;
  setReel: typeof setReelDefaults;
  setProfile: typeof updateEventSocialSettingsAction;
};

const SERVER_WRITES: SettingsWrites = {
  updateEvent: updateEventAction,
  setDoor: setEventDoorAction,
  setReel: setReelDefaults,
  setProfile: updateEventSocialSettingsAction,
};

export function SettingsProvider({
  event,
  tier,
  counts,
  pendingCount,
  social,
  reelSample,
  writes = SERVER_WRITES,
  children,
}: {
  event: HostEvent;
  tier: Tier;
  counts: DoorCounts;
  pendingCount: number;
  social: { displayInProfile: boolean; hostHasSlug: boolean } | null;
  reelSample: string | null;
  writes?: SettingsWrites;
  children: ReactNode;
}) {
  const base = valuesOf(event, social);

  // What a host has changed that the row does not say yet, laid over it.
  const [overlay, setOverlay] = useState<Partial<SettingsValues>>({});
  const [inFlight, setInFlight] = useState<ReadonlySet<Key>>(new Set());
  const latest = useRef<Partial<Record<Key, number>>>({});

  /**
   * ★ THE SAVES ON THEIR WAY, AND WHAT WAITS FOR THEM TO LAND (crumbs-42, from crumbs-24). Every save is a
   * Server Action that revalidates the hub, and an address written while one is in Next's queue discards
   * it and re-fetches the page once it answers: a second write inside that re-fetch reloaded the page or
   * dropped what the save brought (`lib/history-entry.ts` has the matrix). So what writes the address waits
   * until no save is on its way AND what the last one brought has committed.
   *
   * ★ LANDED IS COMMITTED, NEVER ANSWERED. The call is made inside a transition (`useTransition`, a sync
   * callback, so no async action holds other transitions behind it), whose isPending commits with the
   * router's own update: Next sets the router's state to a promise in that same transition and settles it
   * once the action's answer is built into state. The answer alone is early. Measured on a revalidating
   * action under `next dev` (Next 16.2.6, crumbs-42's probe): two writes inside a save's round trip and its
   * re-fetch reloaded the page; one write a task after the answer was safe, but a second 20ms later reloaded
   * it and one 40 to 80ms later dropped the save's data, since Next's history entry still held the tree from
   * before the save (its `HistoryUpdater` writes the new one only at the commit); two writes 0 to 80ms after
   * the commit landed the data and reloaded nothing in all 31 tries (15 with this sync callback, 16 with an
   * async one), and a close written during a save still drew in about 20ms.
   */
  const [settling, startSettling] = useTransition();
  const settlingNow = useRef(false);
  const flying = useRef(0);
  const afterLanding = useRef<(() => void)[]>([]);
  const flushLanded = useCallback(() => {
    if (flying.current > 0 || settlingNow.current) return;
    for (const fn of afterLanding.current.splice(0)) fn();
  }, []);
  useEffect(() => {
    settlingNow.current = settling;
    flushLanded();
  }, [settling, flushLanded]);
  const afterSaves = useCallback((fn: () => void): boolean => {
    if (flying.current === 0 && !settlingNow.current) {
      fn();
      return true;
    }
    afterLanding.current.push(fn);
    return false;
  }, []);

  // ★ THE ROW CATCHING UP LETS THE OVERLAY GO, key by key: adjusted during render when the server's
  // row moves (the sanctioned "state from a changed prop" shape), never in an effect.
  const baseKey = JSON.stringify(base);
  const [seenBase, setSeenBase] = useState(baseKey);
  if (seenBase !== baseKey) {
    setSeenBase(baseKey);
    setOverlay((o) => {
      const next: Partial<SettingsValues> = {};
      for (const [k, v] of Object.entries(o) as [Key, unknown][]) {
        if (base[k] !== v) (next as Record<string, unknown>)[k] = v;
      }
      return next;
    });
  }

  const values: SettingsValues = { ...base, ...overlay };

  /**
   * One save: lay the change over the row, write it, and settle. `write` answers whether the database
   * took it (with the values it kept, where the write says). A refused save puts every key it laid
   * back (unless a newer save of that key is already on its way) and says why.
   */
  const run = useCallback(
    async (
      patch: Partial<SettingsValues>,
      write: () => Promise<
        | { ok: true; kept?: Partial<SettingsValues> }
        | { ok: false; message: string }
      >,
      failure: string,
    ): Promise<boolean> => {
      const keys = Object.keys(patch) as Key[];
      const seq: Partial<Record<Key, number>> = {};
      for (const k of keys) {
        seq[k] = (latest.current[k] ?? 0) + 1;
        latest.current[k] = seq[k];
      }
      setOverlay((o) => ({ ...o, ...patch }));
      setInFlight((s) => new Set([...s, ...keys]));
      // The call inside the transition whose commit says it landed (above); counted until it answers.
      // `settlingNow` is set here because isPending turns true only a render later.
      flying.current += 1;
      settlingNow.current = true;
      let call!: ReturnType<typeof write>;
      startSettling(() => {
        call = write();
      });
      let answer: Awaited<ReturnType<typeof write>>;
      try {
        answer = await call;
      } finally {
        flying.current -= 1;
        flushLanded();
      }
      const newest = keys.filter((k) => latest.current[k] === seq[k]);
      setInFlight((s) => {
        const next = new Set(s);
        for (const k of newest) next.delete(k);
        return next;
      });
      if (!answer.ok) {
        setOverlay((o) => {
          const next = { ...o };
          for (const k of newest) delete next[k];
          return next;
        });
        toast.error(failure, { description: answer.message });
        return false;
      }
      if (answer.kept) {
        // What the database kept: the keys this save laid (unless a newer save of one is on its way),
        // and anything it changed beside them (an address gate holds the email step on).
        const kept = answer.kept;
        setOverlay((o) => {
          const next = { ...o };
          for (const [k, v] of Object.entries(kept) as [Key, unknown][]) {
            if (!keys.includes(k) || newest.includes(k)) {
              (next as Record<string, unknown>)[k] = v;
            }
          }
          return next;
        });
      }
      return true;
    },
    [flushLanded],
  );

  const saveEvent = useCallback(
    (patch: Partial<SettingsValues>) =>
      run(
        patch,
        async () => {
          const result = await writes.updateEvent(event.id, eventPatch(patch));
          return !result || result.ok
            ? { ok: true as const }
            : { ok: false as const, message: result.message };
        },
        "Couldn't save that setting.",
      ),
    [event.id, run, writes],
  );

  const saveDoor = useCallback(
    async (door: Door) => {
      let answer: Extract<SetEventDoorResult, { ok: true }> | null = null;
      const ok = await run(
        { door },
        async () => {
          const result = await writes.setDoor(event.id, door);
          if (!result.ok)
            return { ok: false as const, message: result.message };
          answer = result;
          // An address gate holds the email step on: the row says so after the revalidation, and
          // the overlay says it now.
          return {
            ok: true as const,
            kept: result.emailHeld
              ? { door, requireVerifiedEmail: true }
              : { door },
          };
        },
        "Couldn't change who can get in.",
      );
      return ok ? answer : null;
    },
    [event.id, run, writes],
  );

  const saveReel = useCallback(
    (
      patch: Partial<
        Pick<SettingsValues, "showReel" | "reelStyleId" | "reelHoldSec">
      >,
    ) =>
      run(
        patch,
        async () => {
          const result = await writes.setReel({
            eventId: event.id,
            ...(patch.showReel !== undefined
              ? { showReel: patch.showReel }
              : {}),
            ...(patch.reelStyleId !== undefined
              ? { styleId: patch.reelStyleId }
              : {}),
            ...(patch.reelHoldSec !== undefined
              ? { holdSec: patch.reelHoldSec }
              : {}),
          });
          if (!result.ok)
            return { ok: false as const, message: result.message };
          // The switch is felt on the album, not here: say so. ★ THE HUB'S REEL CARD CATCHES UP IN THE
          // SAVE'S OWN ANSWER (the action revalidates the hub for the switch, as every other Settings
          // save does), NEVER A ROUTER REFRESH AFTER IT: a tap on the page's back arrow or a row inside
          // that refresh's round trip reloaded the page or dropped the refresh (crumbs-24; the matrix is
          // `lib/history-entry.ts`'s header). A look or a hold is seen as it is picked, and the overlay
          // holds what the save answered, so neither needs the page again.
          if (patch.showReel !== undefined) {
            toast.success(
              result.defaults.showReel
                ? "The highlight reel is on."
                : "The highlight reel is off.",
              {
                description: result.defaults.showReel
                  ? "It plays on the album from the second photo."
                  : "Guests no longer see it anywhere.",
              },
            );
          }
          return {
            ok: true as const,
            kept: {
              showReel: result.defaults.showReel,
              reelStyleId: resolveMood(result.defaults.styleId),
              reelHoldSec: resolveHoldSec(result.defaults.holdSec),
            },
          };
        },
        "Couldn't save that setting.",
      ),
    [event.id, run, writes],
  );

  const saveProfile = useCallback(
    (next: boolean) =>
      run(
        { displayInProfile: next },
        async () => {
          const result = await writes.setProfile(event.id, {
            displayInProfile: next,
          });
          return result.ok
            ? { ok: true as const }
            : { ok: false as const, message: result.message };
        },
        "Couldn't save that setting.",
      ),
    [event.id, run, writes],
  );

  const videosOnPlan = videosAllowedForTier(tier);
  const facts: SettingsFacts = {
    door: values.door,
    requireVerifiedEmail: values.requireVerifiedEmail,
    requireUploadToView: values.requireUploadToView,
    acceptingUploads: values.acceptingUploads,
    review: values.review,
    videos: videosOnPlan && values.allowVideos,
    showReel: values.showReel,
    lookLabel: moodLabel(values.reelStyleId),
    holdSec: values.reelHoldSec,
    name: values.name,
    dateLabel: values.eventDate ? formatEventDate(values.eventDate) : null,
    onProfile: values.displayInProfile,
    develop: {
      capture: values.capture,
      rollSize: values.rollSize,
      state: developState(values.developsAt).kind,
    },
  };

  const state: SettingsState = {
    eventId: event.id,
    eventName: values.name,
    tier,
    videosOnPlan,
    values,
    facts,
    counts,
    pendingCount,
    hostHasSlug: social?.hostHasSlug ?? false,
    reelSample,
    saveEvent,
    saveDoor,
    saveReel,
    saveProfile,
    saving: (key) => inFlight.has(key),
    afterSaves,
  };

  return <Context.Provider value={state}>{children}</Context.Provider>;
}
