"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  readStorageListAction,
  removeStorageItemsAction,
  restoreStorageItemsAction,
} from "@/app/(app)/dashboard/storage-actions";
import { requestChangePlan } from "@/components/app/pricing/change-plan-request";

/**
 * WHERE THE SIZE LIST READS AND WRITES: the three Server Functions (`storage-actions.ts`) and the
 * change-plan route's one client (`change-plan-request.ts`), as one value a surface can hand in.
 *
 * WHY A CONTEXT: the list opens from two doors that know nothing about each other (the storage
 * meter's popover, and a refused price three components down inside the plan), and the Library
 * mounts both over data it owns. So the production answer is the default, every door reads it
 * without threading a prop through the plan, and the Library's specimen wraps its own inert source
 * around them (`StorageSourceProvider`), so a reviewer there can never remove anyone's photograph
 * or open Stripe.
 */
export type StorageSource = {
  read: typeof readStorageListAction;
  remove: typeof removeStorageItemsAction;
  restore: typeof restoreStorageItemsAction;
  /** The goal strip's switch: the change-plan route, which checks the storage again. */
  switchPlan: typeof requestChangePlan;
};

const SERVER: StorageSource = {
  read: readStorageListAction,
  remove: removeStorageItemsAction,
  restore: restoreStorageItemsAction,
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
