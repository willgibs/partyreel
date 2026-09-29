/**
 * A STAND-IN DOOR FOR THE ROUTES' OWN TESTS (`vi.mock("@/lib/events/closed-door.server", ...)`).
 *
 * The door's rule is pinned where it lives (`lib/event/door/decide.test.ts`, the table, and
 * `lib/events/closed-door.server.test.ts`, what it asks and with which tickets); a route's test needs
 * only the route's answer to it. So this double shuts a private album and any request whose tickets its
 * `blocked` spy says a block holds, hands a route whatever decision its `decide` spy returns (the held
 * door, the ask, someone already in), and lets everything else through as a stranger. A route's answer
 * to a shut door can then be read against its answer to a private album, word for word.
 *
 * The caller it builds is the request's body tickets alone (shape-checked as strings), since no unit
 * test has a cookie jar or a session; `callerOptions` records what each route asked for, so a test can
 * pin that a write route never asks for the cookie.
 */
import type { DoorDecision } from "@/lib/event/door/decide";

type EventLike = { id?: string; visibility?: string } & Record<string, unknown>;
type Caller = { userId: string | null; tickets: readonly string[] };
type CallerOptions = {
  bodyTokens?: readonly unknown[];
  cookie?: boolean;
  account?: boolean;
};
type Door = {
  decision: DoorDecision;
  standing: { door: string };
  event: EventLike;
};

export function doorDouble(spies: {
  blocked?: (event: EventLike, tickets: readonly string[]) => unknown;
  decide?: (event: EventLike, caller: Caller) => unknown;
  callerOptions?: (options: CallerOptions) => void;
}) {
  return {
    doorCallerFor: async (
      _eventId: string,
      options: CallerOptions = {},
    ): Promise<Caller> => {
      spies.callerOptions?.(options);
      return {
        userId: null,
        tickets: (options.bodyTokens ?? []).filter(
          (t): t is string => typeof t === "string",
        ),
      };
    },
    resolveGuestDoor: async (event: EventLike, caller: Caller): Promise<Door> => {
      const chosen = (await spies.decide?.(event, caller)) as
        | DoorDecision
        | undefined;
      const shut =
        event.visibility === "private" ||
        (await spies.blocked?.(event, caller.tickets)) === true;
      const decision: DoorDecision =
        chosen ??
        (shut
          ? { kind: "shut", previous: false }
          : { kind: "through", admitted: false });
      return {
        decision,
        standing: { door: String(event.visibility ?? "open") },
        event,
      };
    },
    isShut: (door: Door) => door.decision.kind === "shut",
    isThrough: (door: Door) => door.decision.kind === "through",
  };
}
