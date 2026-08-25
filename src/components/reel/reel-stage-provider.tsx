"use client";

/**
 * The reel's LIFECYCLE STAGE, shared between the feed's Reel section and the
 * feed's floating action bar (R3).
 *
 * Two things need one answer to "does this reel exist yet?":
 *   * the Reel section, which is either the BUILDER or the Marquee, and
 *   * the action bar's Reel slot, which is either "Create reel" or "Open studio".
 * Server state alone can't carry it — the birth happens client-side (the builder
 * upserts the config while the reveal plays), and the section must swap without a
 * navigation. So `created` lives here, seeded from the server row.
 *
 * `registerCreate` is the other half: the action bar's "Create reel" must fire
 * the BUILDER's create (the FLIP measure needs the builder's own tiles), so the
 * builder registers its handler and the bar calls `requestCreate()`. The handler
 * lives in a ref, so registering never re-renders a consumer.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ReelStageValue = {
  /** Does a reel config row exist (server) or was one just created (client)? */
  created: boolean;
  /** The builder calls this the moment the lazy-create upsert succeeds. */
  markCreated: () => void;
  /** The builder registers its Create handler (null on unmount). */
  registerCreate: (fn: (() => void) | null) => void;
  /** The action bar's "Create reel": fires the builder's own create + reveal. */
  requestCreate: () => void;
  /** Is a create handler currently available? (the bar's slot needs a target) */
  canCreate: boolean;
};

const ReelStageContext = createContext<ReelStageValue | null>(null);

/** Null when no provider wraps the surface (so a gallery outside the host event
 *  page stays untouched), mirroring useReel()/useLikes(). */
export function useReelStage(): ReelStageValue | null {
  return useContext(ReelStageContext);
}

export function ReelStageProvider({
  initialCreated,
  children,
}: {
  /** getReelConfig(eventId) != null — the reel row already exists. */
  initialCreated: boolean;
  children: React.ReactNode;
}) {
  const [created, setCreated] = useState(initialCreated);
  const createRef = useRef<(() => void) | null>(null);
  // A boolean MIRROR of the ref, because the action bar has to RENDER differently
  // once a target exists and a ref write alone would not re-render it.
  const [canCreate, setCanCreate] = useState(false);

  const markCreated = useCallback(() => setCreated(true), []);

  const registerCreate = useCallback((fn: (() => void) | null) => {
    createRef.current = fn;
    setCanCreate(fn !== null);
  }, []);

  const requestCreate = useCallback(() => {
    createRef.current?.();
  }, []);

  const value = useMemo(
    () => ({ created, markCreated, registerCreate, requestCreate, canCreate }),
    [created, markCreated, registerCreate, requestCreate, canCreate],
  );

  return (
    <ReelStageContext.Provider value={value}>
      {children}
    </ReelStageContext.Provider>
  );
}
