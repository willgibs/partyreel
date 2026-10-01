"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  BulkBar,
  type BulkBarAction,
} from "@/components/app/event-feed/bulk-bar";
import { useExportDownload } from "@/components/app/export/use-export-download";
import { announceChangePlanError } from "@/components/app/pricing/change-plan-request";
import { showUndoToast } from "@/components/shared/undo-toast";
import { Button } from "@/components/ui/button";
import { PopupBody, PopupFooter, PopupHeader } from "@/components/ui/popup";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/components/ui/responsive-menu";
import { loginPath } from "@/lib/auth/return-path";
import { showActionError } from "@/lib/errors/toast";
import { formatCount } from "@/lib/format/count";
import {
  RECENTLY_DELETED_BUDGET_MULTIPLIER,
  RECENTLY_DELETED_WINDOW_DAYS,
} from "@/lib/lifecycle/recently-deleted";
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
  EMPTY_SLOT,
  eventsNow,
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
 */

const TOAST_ID = "storage-list";
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
  const [attempt, setAttempt] = useState(0);

  // The first read, and every retry of it: a page of the largest, with the overview (what she
  // stores and each event's total). State moves only in the read's own callbacks.
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
  const shown = shownItems(slot.items, filter, state.removed);
  const events = eventsNow(state);
  const stored = storedNow(state);
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
   * Remove a selection to Deleted, leading with the result: the rows fade and leave, the server
   * writes underneath, and a failure puts back whatever did not go. Resolves true once it landed.
   */
  async function remove(items: Picked[]): Promise<boolean> {
    if (items.length === 0) return true;
    const ids = items.map((item) => item.id);
    dispatch({ type: "busy", busy: true });
    if (!prefersReducedMotion()) {
      dispatch({ type: "leaving", ids });
      await wait(LEAVE_MS);
    }
    dispatch({ type: "removed", items });
    const answer = await source
      .remove(items.map(({ id, eventId }) => ({ id, eventId })))
      .catch(() => ({
        ok: false as const,
        code: "unknown" as const,
        message: "Couldn't remove those. Please try again.",
        removedEvents: [] as string[],
      }));
    dispatch({ type: "busy", busy: false });
    if (!answer.ok) {
      const done = new Set(answer.removedEvents);
      dispatch({
        type: "put-back",
        ids: items.filter((i) => !done.has(i.eventId)).map((i) => i.id),
      });
      if (done.size > 0) onChanged();
      showActionError(answer);
      return false;
    }
    onChanged();
    offerUndo(items);
    return true;
  }

  /** The act's toast, and its Undo: every item back out of Deleted, or the ones the plan has room for. */
  function offerUndo(items: Picked[]) {
    const ids = items.map((item) => item.id);
    let refused: string[] = [];
    let restoredAny = false;
    showUndoToast({
      id: TOAST_ID,
      message: `Removed ${itemsWords(items)} (${formatBytes(totalBytes(items))}) to Deleted`,
      tone: "success",
      onUndo: () => dispatch({ type: "put-back", ids }),
      undo: async () => {
        const answer = await source.restore(ids);
        if (!answer.ok) {
          refused = ids;
          return answer;
        }
        restoredAny = answer.restored.length > 0;
        if (answer.refused.length === 0) return { ok: true };
        refused = answer.refused;
        const some = answer.restored.length;
        return {
          ok: false,
          code: "unknown",
          message:
            (some > 0 ? `Put back ${some} of ${ids.length}. ` : "") +
            (answer.message ?? "Some of those couldn’t be restored."),
        };
      },
      onUndoFailed: () => {
        const back = new Set(refused);
        dispatch({
          type: "removed",
          items: items.filter((item) => back.has(item.id)),
        });
        if (restoredAny) onChanged();
      },
      onUndone: onChanged,
    });
  }

  /** The strip's button: remove what is only selected, then ask the change-plan route to switch. */
  async function finish() {
    // Her own plan's goal has nothing to switch to, so its strip carries no button.
    if (!goal || goal.kind === "fit" || phase !== "idle") return;
    const pending = [...state.selected.values()];
    if (pending.length > 0) {
      setPhase("removing");
      const removed = await remove(pending);
      if (!removed) {
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
  // The strip counts from what she stored before this visit's removals, so what went to Deleted
  // and what is selected are each counted once.
  const count = goal
    ? goalCount({
        storedBytes: storedBefore(state) ?? 0,
        // Her own plan's cap, or the size she chose: the strip counts to whichever she is here for.
        capBytes:
          goal.kind === "fit" ? goal.capBytes : goal.target.storageBytes,
        removedBytes: totalBytes(state.removed.values()),
        selectedBytes,
        selectedCount: selected.length,
      })
    : null;
  // Only a switch to a smaller size shrinks Deleted's budget with it.
  const shrinkTo =
    goal !== null &&
    goal.kind !== "fit" &&
    goal.capBytes !== null &&
    goal.target.storageBytes < goal.capBytes
      ? goal.target.storageBytes
      : null;
  const filterName = filter === "all" ? null : eventName(filter);
  const total = countNow(state, filter);
  const firstLoad = state.overview === null && !state.failed;

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
      id: "remove",
      label: "Remove to Deleted",
      icon: Trash2,
      color: "destructive",
      disabled: state.busy || phase !== "idle",
      onRun: () => void remove(selected),
    },
  ];

  return (
    <>
      <PopupHeader
        title={LIST_TITLE}
        back={back}
        description={
          filterName
            ? `Largest first, in ${filterName}. Select what to remove.`
            : "Largest first, across every event. Select what to remove."
        }
      />

      {goal && count && stored !== null ? (
        <GoalStrip
          goal={goal}
          count={count}
          phase={phase}
          onFinish={() => void finish()}
        />
      ) : null}

      {state.overview && events.length > 1 ? (
        <div className="shrink-0 px-4 pt-3 pb-1">
          <EventFilter
            events={events}
            allBytes={stored ?? 0}
            value={filter}
            onChange={chooseFilter}
          />
        </div>
      ) : null}

      <PopupBody className="pt-2" data-storage-body="">
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
                : "Nothing is using space."}
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
            data-storage-note={
              shrinkTo !== null ? "deleted-shrinks" : "deleted"
            }
            className="pt-4 text-xs text-pretty text-muted-foreground"
          >
            {shrinkTo !== null
              ? `Once you switch, Deleted keeps only up to ${formatBytes(RECENTLY_DELETED_BUDGET_MULTIPLIER * shrinkTo)}, so its oldest items clear sooner.`
              : `Removed items stop counting at once, and wait in Deleted for ${RECENTLY_DELETED_WINDOW_DAYS} days.`}
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
