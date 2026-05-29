"use client";

import { useCallback, useSyncExternalStore } from "react";

import { JoinForm } from "@/components/guest/join-form";
import { UploadClient } from "@/components/guest/upload-client";
import type { GuestEvent } from "@/lib/db/queries/guest-events";

// The session_token is the guest's capability. Persist it per-event so a returning
// guest (or a refresh) skips the join form instead of creating a duplicate guest.
function sessionKey(qrToken: string) {
  return `pr_session_${qrToken}`;
}

// Same-tab subscribers — the `storage` event only fires in OTHER tabs.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

// localStorage-backed session via useSyncExternalStore: the server snapshot is
// null, so SSR/hydration render the JoinForm and then swap in any stored session
// on the client WITHOUT a hydration mismatch (the React-blessed pattern for
// reading client-only state, and avoids setState-in-effect).
function useStoredSession(
  key: string,
): [string | null, (token: string | null) => void] {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const token = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );

  const setToken = useCallback(
    (value: string | null) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      emit();
    },
    [key],
  );

  return [token, setToken];
}

export function JoinThenUpload({
  event,
  qrToken,
}: {
  event: GuestEvent;
  qrToken: string;
}) {
  const [sessionToken, setSessionToken] = useStoredSession(sessionKey(qrToken));

  if (!sessionToken) {
    return (
      <JoinForm
        event={event}
        qrToken={qrToken}
        onJoined={(token) => setSessionToken(token)}
      />
    );
  }

  return (
    <UploadClient
      event={event}
      sessionToken={sessionToken}
      onReset={() => setSessionToken(null)}
    />
  );
}
