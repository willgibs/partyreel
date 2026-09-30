/**
 * THE DOOR WAITS FOR THE SERVER TO SAY WHO IS HERE (crumbs-29, build 30's red-team).
 *
 * The page re-reads who is holding the phone (a refresh) whenever its idea of the viewer turns out stale: the
 * upload queue found the ticket it kept was somebody else's, or a join found the viewer is not the confirmed
 * account the page rendered for. The ticket the queue puts down takes its name with it, and a door deriving its
 * steps from the phone alone then asked for a name the server was about to answer otherwise: on a phone the host
 * had blocked, the name step stood for the 2 to 4 s the refresh took to draw "This album is private".
 *
 * So the page HOLDS its door from the moment it is told until the server's next render lands, handing the door the
 * name it had. A hold is keyed to the render it was taken under (a value that is new on every server render: the
 * page's gallery seed), so the answer is simply the next render, whatever it says, and a hold can never outlive
 * it: no release to forget, and a refresh that never lands leaves the door where it was.
 *
 * ★ AN EXTERNAL STORE, NOT REACT STATE. The queue drops the name through the stored-name store, and a store's
 * change renders at once (a sync update); a hold kept in React state could land in a later render than the name's
 * fall and miss it. Set before the queue drops anything, the hold renders with the fall or ahead of it.
 */

export type DoorHold = {
  /** The server render the hold was taken under (compared by identity). */
  readonly under: unknown;
  /** The name the door had when the hold was taken. */
  readonly name: string | null;
};

export type DoorHoldStore = {
  get(): DoorHold | null;
  set(hold: DoorHold): void;
  subscribe(listener: () => void): () => void;
};

/** One page's hold: `useState(createDoorHold)`, read through `useSyncExternalStore`. */
export function createDoorHold(): DoorHoldStore {
  let hold: DoorHold | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => hold,
    set(next) {
      hold = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * The name the door is handed: the one it had when the hold was taken, while the render the hold was taken under
 * still stands; the phone's own once the server has answered.
 */
export function heldDoorName(
  hold: DoorHold | null,
  render: unknown,
  stored: string | null,
): string | null {
  return hold !== null && hold.under === render ? hold.name : stored;
}
