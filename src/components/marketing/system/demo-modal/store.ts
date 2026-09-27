/**
 * THE ONE DEMO MODAL'S STATE, OUTSIDE ANY DOOR. A door that holds the modal
 * inside itself takes it down when it leaves the page, and one of them always
 * does: the nav's pane lives in a panel that closes the moment focus moves
 * into the modal (radix dismisses menu content on focus outside), so a modal
 * the pane owned vanished under the reader's cursor (found driving the real
 * nav, 2026-09-27). So a door only asks, the page's one host
 * (`host.tsx`) draws, and the question of who opened it is answered here.
 *
 * A plain external store for `useSyncExternalStore`: no React in this module,
 * nothing to mount, one state for the page.
 */

export type DemoModalState = {
  open: boolean;
  /** Where the modal's "Open the demo" goes: the opening door's own link. */
  href: string;
  /** The door that opened it, handed focus back on close. */
  opener: HTMLElement | null;
  /** Where focus goes when the opener has left the page by then. */
  fallback: HTMLElement | null;
};

let state: DemoModalState = {
  open: false,
  href: "",
  opener: null,
  fallback: null,
};
const listeners = new Set<() => void>();

function set(next: DemoModalState) {
  state = next;
  for (const l of listeners) l();
}

export function readDemoModal(): DemoModalState {
  return state;
}

export function subscribeDemoModal(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function openDemoModal(
  from: Pick<DemoModalState, "href" | "opener" | "fallback">,
) {
  set({ ...from, open: true });
}

export function closeDemoModal() {
  if (state.open) set({ ...state, open: false });
}

/**
 * How many hosts are mounted in the React tree. The page needs exactly one:
 * `ensureDemoModalHost` mounts its own only while this is zero, so a layout
 * (or a test) that renders `DemoModalHost` itself is the host and nothing is
 * doubled.
 */
let hosts = 0;

export function hostMounted(): () => void {
  hosts += 1;
  return () => {
    hosts -= 1;
  };
}

export function hasHost(): boolean {
  return hosts > 0;
}
