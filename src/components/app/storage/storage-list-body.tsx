"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DriveStorageDoor } from "@/components/app/drive/storage-door";
import {
  BulkBar,
  type BulkBarAction,
} from "@/components/app/event-feed/bulk-bar";
import { useExportDownload } from "@/components/app/export/use-export-download";
import { announceChangePlanError } from "@/components/app/pricing/change-plan-request";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/components/ui/responsive-menu";
import { loginPath } from "@/lib/auth/return-path";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import { showActionError } from "@/lib/errors/toast";
import { formatCount } from "@/lib/format/count";
import { useFlip } from "@/lib/shared/use-flip";
import { formatBytes } from "@/lib/utils";

import { EventFilter } from "./event-filter";
import { GoalStrip, type GoalPhase } from "./goal-strip";
import { ListSkeleton } from "./list-skeleton";
import { SizeRow } from "./size-row";
import type { StorageGoal } from "./storage-list";
import {
  byEvent,
  goalCount,
  itemsWords,
  LIST_TITLE,
  pick,
  shownItems,
  totalBytes,
  type Filter,
  type Picked,
} from "./storage-list-rules";
import {
  countNow,
  deletedNow,
  EMPTY_SLOT,
  eventsNow,
  freedBytes,
  INITIAL_LIST,
  listReducer,
  storedBefore,
  storedNow,
  type ListState,
} from "./storage-list-state";
import { useStorageSource } from "./storage-source";

/**
 * THE SIZE LIST ITSELF, loaded the first time a list opens (`storage-list.tsx` is the shell every
 * door mounts). It is the one module that reaches the Server Functions (through
 * `useStorageSource`), so a door (the storage meter, a refused price inside the plan) costs its
 * page nothing until a host opens it, and a component test of any of those doors never loads the
 * server's modules.
 *
 * ★ WHAT FREES ROOM HERE LEAVES FOR GOOD (trash-in-storage, Will 2026-10-03): her plan holds her
 * albums and her Deleted together, so the bar's act is Delete for good and Deleted heads the list
 * with its own Empty. Both ask first, since neither can be undone.
 */

/** The row's fade (`duration-150` on the row), before the list closes over it. */
const LEAVE_MS = 150;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const FIRST_READ: ListState = {
  ...INITIAL_LIST,
  slots: { all: { ...EMPTY_SLOT, loading: true } },
};

/** What the confirm is asking about: a selection (and whether the switch follows it), or Deleted itself. */
type Ask =
  | { kind: "items"; items: Picked[]; thenSwitch: boolean }
  | { kind: "empty"; bytes: number };

export function StorageListBody({
  back,
  goal,
  onChanged,
}: {
  back: string;
  goal: StorageGoal | null;
  onChanged: () => void;
}) {
  const source = useStorageSource();
  const router = useRouter();
  const { startDownload } = useExportDownload();
  const [state, dispatch] = useReducer(listReducer, FIRST_READ);
  const [phase, setPhase] = useState<GoalPhase>("idle");
  const [downloadAsk, setDownloadAsk] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [attempt, setAttempt] = useState(0);

  // The first read, and every retry of it: a page of the largest, with the overview (what she
  // stores, what of it is in Deleted, and each event's total). State moves only in the read's own
  // callbacks.
  useEffect(() => {
    let current = true;
    source.read({ withOverview: true }).then(
      (answer) => {
        if (!current) return;
        if (answer.ok) {
          dispatch({
            type: "loaded",
            key: "all",
            items: answer.items,
            next: answer.next,
            overview: answer.overview,
            more: false,
          });
        } else {
          dispatch({ type: "load-failed", key: "all" });
        }
      },
      () => {
        if (current) dispatch({ type: "load-failed", key: "all" });
      },
    );
    return () => {
      current = false;
    };
  }, [source, attempt]);

  const filter = state.filter;
  const slot = state.slots[filter] ?? EMPTY_SLOT;
  const shown = shownItems(slot.items, filter, state.deleted);
  const events = eventsNow(state);
  const stored = storedNow(state);
  const deleted = deletedNow(state);
  const names = new Map(events.map((event) => [event.id, event.name]));
  const eventName = (id: string) => names.get(id) ?? null;
  const register = useFlip(shown.map((item) => item.id).join());

  function readInto(key: Filter, more: boolean) {
    const from = state.slots[key] ?? EMPTY_SLOT;
    dispatch({ type: "loading", key });
    source
      .read({
        eventId: key === "all" ? null : key,
        after: more ? from.next : null,
        withOverview: false,
      })
      .then(
        (answer) =>
          dispatch(
            answer.ok
              ? {
                  type: "loaded",
                  key,
                  items: answer.items,
                  next: answer.next,
                  overview: null,
                  more,
                }
              : { type: "load-failed", key },
          ),
        () => dispatch({ type: "load-failed", key }),
      );
  }

  function chooseFilter(next: Filter) {
    dispatch({ type: "filter", filter: next });
    if (!state.slots[next]) readInto(next, false);
  }

  /**
   * Delete a selection for good, leading with the result: the rows fade and leave, the server
   * writes underneath, and a failure puts back whatever did not go. Resolves true once it landed.
   */
  async function deleteForGood(items: Picked[]): Promise<boolean> {
    if (items.length === 0) return true;
    const ids = items.map((item) => item.id);
    dispatch({ type: "busy", busy: true });
    if (!prefersReducedMotion()) {
      dispatch({ type: "leaving", ids });
      await wait(LEAVE_MS);
    }
    dispatch({ type: "deleted", items });
    const answer = await source
      .deleteForGood(items.map(({ id, eventId }) => ({ id, eventId })))
      .catch(() => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't delete those. Please try again.",
        deletedEvents: [] as string[],
      }));
    dispatch({ type: "busy", busy: false });
    if (!answer.ok) {
      const done = new Set(answer.deletedEvents);
      dispatch({
        type: "put-back",
        ids: items.filter((i) => !done.has(i.eventId)).map((i) => i.id),
      });
      // Whatever did go (or reached Deleted on its way) moved the figures behind the list.
      onChanged();
      showActionError(answer);
      return false;
    }
    onChanged();
    toast.success(
      `Deleted ${itemsWords(items)} for good (${formatBytes(totalBytes(items))} freed)`,
    );
    return true;
  }

  /** Empty Deleted: everything it holds leaves for good, and what she stores drops by all of it. */
  async function emptyDeleted(bytes: number): Promise<void> {
    dispatch({ type: "busy", busy: true });
    const answer = await source.emptyDeleted().catch(() => ({
      ok: false as const,
      code: "unknown" as const,
      message: "Couldn't empty Deleted. Please try again.",
    }));
    dispatch({ type: "busy", busy: false });
    if (!answer.ok) {
      showActionError(answer);
      return;
    }
    onChanged();
    if (answer.more) {
      // Some is left (the action's time ran out between batches): what left is freed, and the row keeps the rest,
      // its Empty there to finish.
      dispatch({ type: "emptied", bytes: answer.freedBytes });
      toast.success(
        `${formatBytesUp(answer.freedBytes)} freed. Deleted still holds more: empty it again to finish.`,
      );
      return;
    }
    // The overview's figure is what the strip counted from: it is what left.
    dispatch({ type: "emptied", bytes });
    toast.success(`Deleted is empty: ${formatBytesUp(bytes)} freed`);
  }

  /** The strip's button, once she has confirmed: delete what is only selected, then ask the change-plan route to switch. */
  async function finish(pending: Picked[]) {
    // Her own plan's goal has nothing to switch to, so its strip carries no button.
    if (!goal || goal.kind === "fit") return;
    if (pending.length > 0) {
      setPhase("deleting");
      const done = await deleteForGood(pending);
      if (!done) {
        setPhase("idle");
        return;
      }
    }
    setPhase("opening");
    const outcome = await source.switchPlan(goal.target.id, goal.returnTo);
    switch (outcome.kind) {
      case "redirect":
        window.location.assign(outcome.url);
        return;
      case "signin":
        router.push(loginPath(window.location.pathname));
        return;
      case "refused":
        // Stored grew since the list opened (a guest kept uploading): the count re-bases on the
        // server's figure and the strip says what is left.
        dispatch({ type: "rebase", storedBytes: outcome.refusal.storedBytes });
        toast(outcome.refusal.message);
        setPhase("idle");
        return;
      case "error":
        announceChangePlanError(outcome, toast);
        setPhase("idle");
    }
  }

  function confirmAsk() {
    const asked = ask;
    setAsk(null);
    if (!asked) return;
    if (asked.kind === "empty") {
      void emptyDeleted(asked.bytes);
      return;
    }
    if (asked.thenSwitch) void finish(asked.items);
    else void deleteForGood(asked.items);
  }

  /** The strip's own button: nothing selected switches at once; a selection asks first. */
  function onStripFinish() {
    if (!goal || goal.kind === "fit" || phase !== "idle") return;
    const pending = [...state.selected.values()];
    if (pending.length === 0) void finish([]);
    else setAsk({ kind: "items", items: pending, thenSwitch: true });
  }

  function download() {
    const groups = byEvent(state.selected.values());
    if (groups.size === 1) {
      const [[eventId, items]] = groups;
      void startDownload("host", {
        event_id: eventId,
        ids: items.map((item) => item.id),
        types: "all",
        include_hidden: true,
      });
      return;
    }
    // A download is one event's zip (export-flow's own), so a selection across events asks which.
    setDownloadAsk(true);
  }

  const selected = [...state.selected.values()];
  const selectedBytes = totalBytes(selected);
  const shownPicked = shown.map(pick);
  const allShownSelected =
    shown.length > 0 && shown.every((item) => state.selected.has(item.id));
  // The strip counts from what she stored before this visit's deletions, so what left for good
  // and what is selected are each counted once.
  const count = goal
    ? goalCount({
        storedBytes: storedBefore(state) ?? 0,
        // Her own plan's cap, or the size she chose: the strip counts to whichever she is here for.
        capBytes:
          goal.kind === "fit" ? goal.capBytes : goal.target.storageBytes,
        freedBytes: freedBytes(state),
        selectedBytes,
        selectedCount: selected.length,
      })
    : null;
  const filterName = filter === "all" ? null : eventName(filter);
  const total = countNow(state, filter);
  const firstLoad = state.overview === null && !state.failed;
  const albumsBytes = events.reduce((sum, event) => sum + event.bytes, 0);

  const actions: BulkBarAction[] = [
    {
      id: "download",
      label: "Download",
      icon: Download,
      color: "save",
      disabled: state.busy,
      onRun: download,
    },
    {
      id: "delete",
      label: "Delete for good",
      icon: Trash2,
      color: "destructive",
      disabled: state.busy || phase !== "idle",
      onRun: () =>
        setAsk({ kind: "items", items: selected, thenSwitch: false }),
    },
  ];

  const askedItems = ask?.kind === "items" ? ask.items : [];

  return (
    <>
      <PopupHeader
        title={LIST_TITLE}
        back={back}
        description={
          filterName
            ? `Largest first, in ${filterName}. Select what to delete for good.`
            : "Largest first, across every event. Select what to delete for good."
        }
      />

      {goal && count && stored !== null ? (
        <GoalStrip
          goal={goal}
          count={count}
          phase={phase}
          onFinish={onStripFinish}
        />
      ) : null}

      {state.overview && events.length > 1 ? (
        <div className="shrink-0 px-4 pt-3 pb-1">
          <EventFilter
            events={events}
            allBytes={albumsBytes}
            value={filter}
            onChange={chooseFilter}
          />
        </div>
      ) : null}

      <PopupBody className="pt-2" data-storage-body="">
        {/* Filtered to one album, Google Drive keeps every original of it in her own Drive (drive-wiring,
            Will's `doors = both`); deleting stays this list's own. */}
        {filter !== "all" && filterName ? (
          <DriveStorageDoor eventId={filter} albumName={filterName} />
        ) : null}
        {/* ★ DELETED HEADS THE LIST (trash-in-storage): what she already deleted still counts toward her
            plan, so it is the first room to free, in one press, before anything she kept. */}
        {state.overview && filter === "all" && deleted > 0 ? (
          <div
            data-storage-deleted=""
            className="-mx-2 mb-2 flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Deleted</p>
              <p className="text-xs text-pretty text-muted-foreground tabular-nums">
                {`${formatBytesUp(deleted)}, still counting toward your plan until it's emptied`}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={state.busy || phase !== "idle"}
              onClick={() => setAsk({ kind: "empty", bytes: deleted })}
            >
              Empty
            </Button>
          </div>
        ) : null}

        {state.failed ? (
          <div className="flex flex-col items-start gap-3 py-6">
            <p className="text-sm text-muted-foreground">
              Couldn&rsquo;t load what&rsquo;s using space.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch({ type: "loading", key: "all" });
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </Button>
          </div>
        ) : firstLoad || (slot.loading && slot.items.length === 0) ? (
          <ListSkeleton />
        ) : slot.failed && slot.items.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-6">
            <p className="text-sm text-muted-foreground">
              {`Couldn’t load ${filterName ?? "these"}.`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => readInto(filter, false)}
            >
              Try again
            </Button>
          </div>
        ) : shown.length === 0 ? (
          slot.next ? null : (
            <p className="py-6 text-sm text-muted-foreground">
              {filterName
                ? `Nothing left in ${filterName}.`
                : "Nothing is using space in your events."}
            </p>
          )
        ) : (
          <ul aria-label={LIST_TITLE} className="-mx-2 space-y-0.5">
            {shown.map((item) => (
              <SizeRow
                key={item.id}
                item={item}
                eventName={filter === "all" ? eventName(item.eventId) : null}
                checked={state.selected.has(item.id)}
                leaving={state.leaving.has(item.id)}
                disabled={state.busy}
                onToggle={(it) => dispatch({ type: "toggle", item: pick(it) })}
                flipRef={register(item.id)}
              />
            ))}
          </ul>
        )}

        {!state.failed &&
        !firstLoad &&
        slot.items.length > 0 &&
        (slot.next || slot.failed) ? (
          <div className="flex items-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={slot.loading}
              onClick={() => readInto(filter, true)}
            >
              {slot.loading
                ? "Loading…"
                : slot.failed
                  ? "Try again"
                  : "Show more"}
            </Button>
            {total !== null ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {`${formatCount(shown.length)} of ${formatCount(total)}`}
              </span>
            ) : null}
          </div>
        ) : null}

        {state.overview ? (
          <p
            data-storage-note="deleted"
            className="pt-4 text-xs text-pretty text-muted-foreground"
          >
            Your plan holds your events and Deleted together. Delete for good
            skips Deleted, so it frees room at once.
          </p>
        ) : null}
      </PopupBody>

      {selected.length > 0 ? (
        <PopupFooter className="flex-row items-center justify-between gap-2 px-3 py-2">
          <BulkBar
            count={selected.length}
            allSelected={allShownSelected}
            busy={state.busy}
            onSelectAll={() =>
              dispatch({ type: "select-all", shown: shownPicked })
            }
            onCancel={() => dispatch({ type: "clear" })}
            actions={actions}
          />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatBytes(selectedBytes)}
          </span>
        </PopupFooter>
      ) : null}

      {/* The one confirm both acts pass through (`popups` r1, `confirm=dialog`): neither can be undone. */}
      <Popup
        open={ask !== null}
        onOpenChange={(open) => {
          if (!open) setAsk(null);
        }}
      >
        <PopupContent kind="confirm" data-storage-confirm={ask?.kind ?? ""}>
          {ask?.kind === "empty" ? (
            <PopupHeader
              title="Empty Deleted?"
              description={`Everything in Deleted, ${formatBytesUp(ask.bytes)}, is deleted for good, deleted events included. It can't be undone.`}
            />
          ) : (
            <PopupHeader
              title={
                ask?.kind === "items" && ask.thenSwitch
                  ? `Delete ${itemsWords(askedItems)} for good and switch?`
                  : `Delete ${itemsWords(askedItems)} for good?`
              }
              description={`They skip Deleted and can't be restored. ${formatBytes(totalBytes(askedItems))} frees at once.`}
            />
          )}
          <PopupFooter>
            <PopupClose asChild>
              <Button variant="outline">Cancel</Button>
            </PopupClose>
            <Button variant="destructive" onClick={confirmAsk}>
              {ask?.kind === "empty"
                ? "Empty Deleted"
                : ask?.kind === "items" && ask.thenSwitch
                  ? "Delete and switch"
                  : "Delete for good"}
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>

      <ResponsiveMenu
        open={downloadAsk}
        onOpenChange={setDownloadAsk}
        anchor="pressed"
        title="Download from which event?"
        showTitle
      >
        {[...byEvent(selected)].map(([eventId, items]) => (
          <ResponsiveMenuItem
            key={eventId}
            icon={<Download />}
            hint={`${formatCount(items.length)} · ${formatBytes(totalBytes(items))}`}
            onSelect={() =>
              void startDownload("host", {
                event_id: eventId,
                ids: items.map((item) => item.id),
                types: "all",
                include_hidden: true,
              })
            }
          >
            <span className="block truncate">
              {eventName(eventId) ?? "An event"}
            </span>
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenu>
    </>
  );
}
