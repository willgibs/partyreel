"use client";

/**
 * Is this render past hydration? The server and the HYDRATING client both answer false, so the first paint
 * matches the HTML; every render after it answers true. It is the house's one hydrated flag: a control that
 * must not act before React has attached its handlers (a submit, a menu), a value only the browser knows
 * (the resolved theme), an attribute the server must not write (a closed answer's `inert`).
 *
 * ★ A STORE READ, NOT A MOUNT EFFECT. `useSyncExternalStore` with a no-op `subscribe` gives the flag
 * without a `setState` in an effect (a cascading second render, and `react-hooks/set-state-in-effect`), and
 * the hydrating render is guaranteed to match the server's, which an effect-driven flag is not. The
 * snapshot only ever moves from the server's answer to the client's, once, so there is nothing to notify a
 * second time.
 *
 * Eight files each wrote this triple by hand (a store with nothing to subscribe to, `() => true`,
 * `() => false`); `use-hydrated.test.tsx` refuses a ninth, so a lesson about the flag lands once.
 */
import { useSyncExternalStore } from "react";

/** Nothing to subscribe to: the snapshot never changes after hydration. */
const noSubscription = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
