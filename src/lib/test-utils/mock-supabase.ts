/**
 * A reusable mock for the Supabase BROWSER client (program Phase 2 test
 * pins). Covers exactly the surface the pinned components touch:
 *
 *   auth.getSession / auth.signInWithOAuth
 *   auth.onAuthStateChange              -> `emitAuth(event, session)` plays the SDK's word
 *   from("table").select(...).in(...)   -> resolves rows
 *   from("table").delete().eq(...)      -> resolves { error }
 *   rpc(name, params)                   -> resolves { data, error }
 *
 * Usage (the component imports `createClient` from "@/lib/supabase/client"):
 *
 *   vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
 *   const supa = makeMockSupabase({ session: {...} });
 *   vi.mocked(createClient).mockReturnValue(supa.client as never);
 *
 * All knobs are plain fields so individual tests can re-program responses
 * (`supa.rpc.mockResolvedValueOnce(...)`) without rebuilding the factory.
 */
import { vi, type Mock } from "vitest";

type AuthListener = (event: string, session: unknown) => void;

export type MockSupabase = {
  client: {
    auth: {
      getSession: Mock;
      signInWithOAuth: Mock;
      onAuthStateChange: Mock;
    };
    from: Mock;
    rpc: Mock;
  };
  /** The terminal of select().in() - program rows per test. */
  selectIn: Mock;
  /** The terminal of delete().eq() - program { error } per test. */
  deleteEq: Mock;
  rpc: Mock;
  getSession: Mock;
  signInWithOAuth: Mock;
  onAuthStateChange: Mock;
  /** The SDK announcing a sign-in or sign-out to every subscriber, as another tab's or this one's would. */
  emitAuth: (event: string, session: unknown) => void;
};

export function makeMockSupabase(opts?: {
  /** Session object for getSession (null = signed out). */
  session?: unknown;
  /** Rows returned by from().select().in() (e.g. liked media_id rows). */
  selectRows?: unknown[];
}): MockSupabase {
  const selectIn = vi.fn().mockResolvedValue({
    data: opts?.selectRows ?? [],
    error: null,
  });
  const deleteEq = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });
  const getSession = vi.fn().mockResolvedValue({
    data: { session: opts?.session ?? null },
  });
  const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
  const authListeners = new Set<AuthListener>();
  const onAuthStateChange = vi.fn((listener: AuthListener) => {
    authListeners.add(listener);
    return {
      data: {
        subscription: { unsubscribe: () => authListeners.delete(listener) },
      },
    };
  });

  const from = vi.fn(() => ({
    select: vi.fn(() => ({ in: selectIn })),
    delete: vi.fn(() => ({ eq: deleteEq })),
  }));

  return {
    client: {
      auth: { getSession, signInWithOAuth, onAuthStateChange },
      from,
      rpc,
    },
    selectIn,
    deleteEq,
    rpc,
    getSession,
    signInWithOAuth,
    onAuthStateChange,
    emitAuth: (event, session) => {
      for (const listener of [...authListeners]) listener(event, session);
    },
  };
}
