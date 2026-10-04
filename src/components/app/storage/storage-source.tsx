"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  deleteStorageItemsAction,
  emptyDeletedAction,
  readStorageListAction,
  setMakeRoomFromDeletedAction,
} from "@/app/(app)/dashboard/storage-actions";
import { requestChangePlan } from "@/components/app/pricing/change-plan-request";

/**
 * WHERE THE SIZE LIST AND THE STORAGE CHART READ AND WRITE: the Server Functions (`storage-actions.ts`) and the
 * change-plan route's one client (`change-plan-request.ts`), as one value a surface can hand in.
 *
 * WHY A CONTEXT: the list and the chart open from doors that know nothing about each other (the storage meter's
 * popover, the over-cap banner, a refused price three components down inside the plan), and the Library mounts them
 * over data it owns. So the production answer is the default, every door reads it without threading a prop through the
 * plan, and the Library's specimen wraps its own inert source around them (`StorageSourceProvider`), so a reviewer there
 * can never delete anyone's photograph, empty anyone's Deleted, change anyone's setting or open Stripe.
 */
export type StorageSource = {
  read: typeof readStorageListAction;
  /** The list's one write: a selection deleted for good. */
  deleteForGood: typeof deleteStorageItemsAction;
  /** The chart's Empty Deleted. */
  emptyDeleted: typeof emptyDeletedAction;
  /** The chart's switch: Make room from Deleted. */
  setMakeRoom: typeof setMakeRoomFromDeletedAction;
  /** The goal strip's switch: the change-plan route, which checks the storage again. */
  switchPlan: typeof requestChangePlan;
};

const SERVER: StorageSource = {
  read: readStorageListAction,
  deleteForGood: deleteStorageItemsAction,
  emptyDeleted: emptyDeletedAction,
  setMakeRoom: setMakeRoomFromDeletedAction,
  switchPlan: requestChangePlan,
};

const StorageSourceContext = createContext<StorageSource>(SERVER);

export function StorageSourceProvider({
  source,
  children,
}: {
  source: StorageSource;
  children: ReactNode;
}) {
  return (
    <StorageSourceContext.Provider value={source}>
      {children}
    </StorageSourceContext.Provider>
  );
}

export function useStorageSource(): StorageSource {
  return useContext(StorageSourceContext);
}
