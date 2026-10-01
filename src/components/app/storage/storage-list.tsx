"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import type { Plan } from "@/lib/constants/tiers";
import type { ProPlanId } from "@/lib/validation/checkout";

import { ListSkeleton } from "./list-skeleton";
import { LIST_TITLE } from "./storage-list-rules";

/**
 * WHAT'S USING SPACE (host-storage r1, Will 2026-09-28): every item she stores, largest first
 * across every event (`order=flat`), with a filter for All or one event (his note), the goal strip
 * when a smaller plan is why she is here (`goal=live`), and the product's bulk bar to act on a
 * selection: Download beside Remove (round one's carried `download-first`), Remove to Deleted with
 * the product's one Undo (`showUndoToast`, curation-wiring's). The body is
 * `storage-list-body.tsx`; this is the shell every door mounts.
 *
 * ★ ITS KIND IS `list` (popups r1, `lists=panel`): a side panel at a desk, its own screen in a hand
 * whose back arrow says where Back returns. Three doors open it: the storage meter's popover on the
 * dashboard ("Dashboard"), the over-cap grace banner above it (crumbs-32: the banner said "largest
 * files first" with no way to see them), and the refusal a too-small price flips to inside the plan
 * ("Your plan"), where it stacks over the plan at a desk and closing it returns there.
 *
 * ★ TWO GOALS (`StorageGoal`). A smaller plan she chose counts down to that size and finishes the
 * switch; her own plan, which she is over, counts down to its cap (the meter's number: under it the
 * grace is over by the next sweep, which clears at the upload headroom above it) and finishes
 * nothing, since there is nothing to switch: the bar's Remove is the act.
 *
 * ★ REMOVE RUNS AT ONCE, AND UNDO TAKES IT BACK. Everything it removes waits in Deleted for the
 * window, restorable, and stops counting against the plan at once; the toast names what went and
 * offers it back for its seconds, and Undo is a real restore (`restore_media`, capacity-gated).
 *
 * ★ NOTHING HERE WRITES A PLAN. The strip's switch asks the change-plan route, which reads what
 * she stores again and opens Stripe's confirm page only for a size that holds it; the webhook is
 * the only writer of the tier and the cap (billing-caps.md).
 *
 * ★ THE BODY LOADS WHEN A LIST FIRST OPENS. It alone reaches the Server Functions, so the plan and
 * the meter (both on many pages) carry a door and nothing more; its first paint is the list's own
 * skeleton under its own head, so the wait reads as the list loading, whichever part is loading.
 *
 * ★ WHAT IS BEHIND IT CATCHES UP ONCE, AS THE LIST CLOSES. The meter, the Plan card and the
 * events all show what she stores; a refresh per removal would re-read a whole dashboard under a
 * list she is still working in, so the list refreshes the page behind it when it closes (or at
 * once, when an Undo lands after it closed), and tells its door then (`onChanged`: the plan
 * re-reads its facts, so its Too small marks are true when she returns). ★ Never while it is
 * open: the list opened from a refused price lives INSIDE that price's flipped row, and a plan
 * re-read that found the size now fits would put the row back and unmount the list under her,
 * one press short of its switch.
 */

/** The goal a refused price hands the list: the size she chose, and whether it can open. */
export type SwitchGoal = {
  kind?: "switch";
  target: Plan & { id: ProPlanId };
  /** Her plan's cap now, when known: a switch below it shrinks Deleted too. */
  capBytes: number | null;
  /** False while her subscription cannot change here (the plan's note says why). */
  canSwitch: boolean;
  /** Where a confirmed switch lands: the door's own page, re-checked by the route. */
  returnTo?: string;
};

/** The goal her own plan sets when she stores more than it holds: its cap, nothing to switch. */
export type FitGoal = {
  kind: "fit";
  capBytes: number;
};

export type StorageGoal = SwitchGoal | FitGoal;

const StorageListBody = lazy(() =>
  import("./storage-list-body").then((m) => ({ default: m.StorageListBody })),
);

export function StorageList({
  back,
  goal = null,
  onChanged,
  open,
  onOpenChange,
  children,
}: {
  /** Where a hand's back arrow returns, in words ("Dashboard", "Your plan"). */
  back: string;
  goal?: StorageGoal | null;
  /** Something was removed or put back: the door's own figures are stale. */
  onChanged?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The control that opens it. Omit for a caller-controlled list. */
  children?: ReactNode;
}) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  const [selfOpen, setSelfOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : selfOpen;

  // Read at the moment something changes, never during render (a removal's Undo can land after
  // the list has closed, and must then refresh the page behind at once).
  const openRef = useRef(isOpen);
  const onChangedRef = useRef(onChanged);
  const dirty = useRef(false);
  useEffect(() => {
    openRef.current = isOpen;
    onChangedRef.current = onChanged;
  });

  const catchUp = useCallback(() => {
    dirty.current = false;
    onChangedRef.current?.();
    startRefresh(() => router.refresh());
  }, [router]);

  const changed = useCallback(() => {
    if (openRef.current) dirty.current = true;
    else catchUp();
  }, [catchUp]);

  function changeOpen(next: boolean) {
    openRef.current = next;
    if (!next && dirty.current) catchUp();
    if (controlled) onOpenChange?.(next);
    else setSelfOpen(next);
  }

  return (
    <Popup open={isOpen} onOpenChange={changeOpen}>
      {children ? <PopupTrigger asChild>{children}</PopupTrigger> : null}
      <PopupContent kind="list" data-storage-list={goal ? "goal" : "plain"}>
        <Suspense
          fallback={
            <>
              <PopupHeader
                title={LIST_TITLE}
                back={back}
                description="Largest first, across every event. Select what to remove."
              />
              <PopupBody className="pt-2">
                <ListSkeleton />
              </PopupBody>
            </>
          }
        >
          <StorageListBody back={back} goal={goal} onChanged={changed} />
        </Suspense>
      </PopupContent>
    </Popup>
  );
}
