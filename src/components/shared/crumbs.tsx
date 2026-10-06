"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

/**
 * THE TRAIL IN THE BAR — `nav=crumbs` (Will, 2026-09-20): "Partyreel / the
 * event / the room", each step walkable. It replaced four different ways back
 * (a text link, a dirty-checked text link, the Studio's X, and nothing at all
 * on /account), and it spends no horizontal room, which was the whole argument
 * against the rail: the photographs keep the window.
 *
 * ★ WHY A CONTEXT AND NOT A PROP. The trail belongs in the app BAR, and the bar
 * is rendered by `AppShell` from the `(app)` LAYOUT. A page is that layout's
 * grandchild, so it cannot hand a prop back up — the same shape problem
 * `data-app-wide` solved with `:has()`. CSS cannot carry an event's NAME, so
 * this one is a client context: `AppShell` provides, the bar consumes, and each
 * route renders `<SetCrumbs>` with its own trail.
 *
 * ★ THE COST, STATED: the trail arrives at HYDRATION, not in the server's HTML.
 * The bar's height is fixed (h-14), so nothing moves when it lands — the text
 * simply appears — and the page's own h1 carries the event's name the whole
 * time, so nothing is unreadable in between. The alternative that IS
 * server-perfect (a sticky band below the bar, owned by an event layout) puts
 * the trail somewhere Will did not draw it. Taken deliberately; his to overrule.
 *
 * ★ AND IT IS A LAYOUT EFFECT, not an effect. `useLayoutEffect` writes the
 * trail before the browser paints the hydrated frame, so a reader never sees
 * one painted frame of an empty bar followed by a filled one.
 *
 * ★ A TRAIL IS DRAWN WHILE THE ROUTE THAT SET IT IS ON SCREEN, AND NOT AFTER
 * (crumbs-19; build 25's red-team: an event's delete redirected to /dashboard
 * and the bar still read `Partyreel > <the deleted event>`, and the account
 * menu's Account kept the last event's trail, because the bar kept whatever
 * was claimed last and /dashboard and /account claim nothing). Two facts of the
 * real router shaped the rule (measured under `next dev`, a hub's step into one
 * of its rooms):
 *
 *   - A route with a `loading.tsx` commits its NEW address with the SKELETON on
 *     screen and the page lands a wait later, so a bar tied to the address, or
 *     one that cleared when the old page went, was empty for that whole wait on
 *     every step between two routes that both set a trail. What kept it filled
 *     was never clearing, which is also what let a route that sets none wear
 *     the last route's.
 *   - Between two routes with no wait the old page leaves and the new one
 *     arrives in ONE commit, so a claim released by the old `SetCrumbs` and one
 *     made by the new (both layout effects, batched before paint) leave the
 *     bar full, never empty for a frame.
 *
 * So the trail belongs to its `SetCrumbs`: it is released when that component
 * unmounts, and while a route's skeleton is on screen (`CrumbsHold`, worn once
 * by `RouteSkeleton`) the bar keeps the last trail through the wait. When the
 * page lands it sets its own or sets none, and a route that sets none draws
 * none, whatever came before it, an error or a not-found page included.
 * ★ THE FAILURE IS SAFE BOTH WAYS: a new `loading.tsx` that forgets its hold
 * blinks the bar for the wait (ugly, and only that), and no route can inherit a
 * trail it did not set.
 */

export type CrumbStep = {
  label: string;
  /** Walkable when set; the last step is the page itself and carries none. */
  href?: string;
};

/**
 * What the bar holds. `owner` is the mounted `SetCrumbs` the trail is for; a
 * trail whose `owner` is null is a route's LAST one, kept only while a skeleton
 * holds it (below) and dropped the moment nothing does.
 */
type Slot = { trail: CrumbStep[]; owner: string | null };

const NOTHING: Slot = { trail: [], owner: null };

type CrumbsValue = {
  /** What the bar draws now: the mounted route's trail, or the last one while a skeleton holds it. */
  trail: CrumbStep[];
  claim: (owner: string, trail: CrumbStep[]) => void;
  release: (owner: string) => void;
  /** A route's skeleton is on screen; the returned function says it is gone. */
  hold: () => () => void;
};

const CrumbsContext = createContext<CrumbsValue | null>(null);

/** Wraps the shell's subtree. Rendered by `AppShell`, so no route opts in. */
export function CrumbsProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<Slot>(NOTHING);
  const [holds, setHolds] = useState(0);

  const claim = useCallback(
    (owner: string, trail: CrumbStep[]) => setSlot({ owner, trail }),
    [],
  );
  // Only the claim that is still the mounted route's lets go: a page that
  // unmounts after its successor has claimed (either order in one commit) must
  // not take the successor's trail with it.
  const release = useCallback(
    (owner: string) =>
      setSlot((s) => (s.owner === owner ? { trail: s.trail, owner: null } : s)),
    [],
  );
  const hold = useCallback(() => {
    setHolds((n) => n + 1);
    return () => setHolds((n) => n - 1);
  }, []);

  // A route's last trail nobody holds is spent. It is dropped, not merely hidden,
  // so the NEXT skeleton (a click on another event from /dashboard) holds
  // nothing rather than the trail of an event the reader left two routes ago.
  // This is React's own "adjust state while rendering" (react.dev, You Might Not
  // Need an Effect), and it is judged on the render that sees a whole batch: a
  // route's page going and its skeleton coming are two updates of ONE commit, so
  // the trail is spent only when the batch leaves nobody holding it.
  if (slot.owner === null && holds === 0 && slot.trail.length > 0) {
    setSlot(NOTHING);
  }

  const trail = slot.owner !== null || holds > 0 ? slot.trail : NOTHING.trail;
  const value = useMemo(
    () => ({ trail, claim, release, hold }),
    [trail, claim, release, hold],
  );
  return (
    <CrumbsContext.Provider value={value}>{children}</CrumbsContext.Provider>
  );
}

/**
 * Declares this route's trail. Renders nothing; a route drops it anywhere in
 * its tree. Identity-stable by the trail's VALUE rather than the array, so a
 * parent re-render with a fresh literal does not re-set the same trail.
 */
export function SetCrumbs({ trail }: { trail: CrumbStep[] }) {
  const ctx = useContext(CrumbsContext);
  const claim = ctx?.claim;
  const release = ctx?.release;
  const owner = useId();
  const key = JSON.stringify(trail);

  useLayoutEffect(() => {
    claim?.(owner, JSON.parse(key) as CrumbStep[]);
  }, [claim, owner, key]);

  // Its own effect, so a trail that changes (an event renamed) re-claims
  // without ever letting go, and only the component going away releases.
  useLayoutEffect(() => () => release?.(owner), [release, owner]);

  return null;
}

/**
 * A route's skeleton is on screen: keep the last trail through the wait, as
 * the header says. Renders nothing; `RouteSkeleton` wears it, so every
 * `loading.tsx` that delegates there holds the bar without knowing.
 */
export function CrumbsHold() {
  const hold = useContext(CrumbsContext)?.hold;
  useLayoutEffect(() => hold?.(), [hold]);
  return null;
}

/**
 * The bar's trail. Two renderings of ONE list, swapped by CSS at `sm` so there
 * is no measuring and no second source of truth:
 *
 *   - at a desk, every step, chevron-separated, the last one the page;
 *   - at 375, the PARENT step alone behind a back chevron ("‹ Sarah and
 *     Tom's…"), because the h1 under it already says where you are and a
 *     three-step trail on a phone truncates all three into nothing.
 */
export function CrumbsBar() {
  const trail = useContext(CrumbsContext)?.trail ?? [];
  if (trail.length === 0) return null;

  const last = trail[trail.length - 1];
  // The step a reader goes UP to: the nearest walkable one behind the current.
  const parent = [...trail.slice(0, -1)].reverse().find((s) => s.href);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-1 items-center text-sm"
    >
      {/* The phone's one step. `aria-hidden` on the desk copy is not needed:
          only one of the two is in the accessibility tree at a time, because
          `hidden` is what `sm:hidden` compiles to for display. */}
      {parent ? (
        <Link
          href={parent.href!}
          className="flex min-w-0 items-center gap-0.5 rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-halo sm:hidden"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{parent.label}</span>
        </Link>
      ) : (
        <span className="truncate font-medium text-foreground sm:hidden">
          {last.label}
        </span>
      )}

      <ol className="hidden min-w-0 items-center gap-1 sm:flex">
        {trail.map((step, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li
              key={`${step.label}-${i}`}
              className="flex min-w-0 items-center gap-1"
            >
              {i > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                  aria-hidden
                />
              )}
              {step.href && !isLast ? (
                <Link
                  href={step.href}
                  className="truncate rounded-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-halo"
                >
                  {step.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "truncate font-medium text-foreground"
                      : "truncate text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
