"use client"

import { useEffect, useRef } from "react"

/**
 * THE PHONE'S OWN BACK CLOSES A POPUP THAT IS A PLACE (`lists=panel`: "in a
 * hand its own screen under a back arrow, the phone's Back closing it"; the
 * carried call `stacked`: "a plan or another place replaces it in a hand, and
 * Back returns").
 *
 * A popup that takes the whole screen looks like a page, so the one gesture a
 * phone has for leaving a page has to leave it: Android's back button, iOS's
 * edge swipe, the browser's own arrow. While one is open it holds one history
 * entry of its own (same URL), a Back pops it and the popup closes; closed any
 * other way (its arrow, Escape) it takes its entry back with it, so nothing
 * dead is left behind to press through.
 *
 * ★ THE MARKER IS A FIELD ON THE STATE NEXT MERGES, NEVER THE STATE ITSELF
 * (`event-share-provider.tsx` found it first): Next copies `__NA` and its tree
 * onto whatever object `pushState` is handed, and its popstate handler reloads
 * the page for an entry without `__NA`. And no URL is passed, so Next's patched
 * `pushState` has no route to apply and the router never re-renders.
 *
 * ★ THE ENTRY IS TAKEN BACK ONE TICK LATE, ON PURPOSE. React's development
 * StrictMode runs every effect's cleanup and body twice on mount; a `back()`
 * in that simulated cleanup followed by a fresh `pushState` would queue a
 * traversal onto the NEW entry and close the popup the moment it opened. So a
 * cleanup schedules its `back()`, and a body that runs again first cancels it
 * and keeps the entry it already has.
 *
 * ★ THE MARKER IS NOT THE ONLY WITNESS (crumbs-18). `router.refresh()` is a soft
 * navigation whose commit writes the entry again with Next's own state alone
 * (measured under `next dev`, at 375: opened at entry 4, refreshed, closed by its
 * arrow, still standing on entry 5), and the claims review and the storage list
 * refresh while they are open. So the popup keeps its own word too (`entryRef`:
 * the entry it pushed, and the address it stands at): where the marker is gone,
 * an entry at that same address is still ours. Never where the marker names
 * another entry, and never at another address: a popup that goes because the page
 * navigated on (a link inside it) has no entry to undo, and taking one back would
 * undo the navigation. The provider's `pushedRef` is the same idea for `?room=`.
 *
 * ★ A POPUP THAT HAS A URL OF ITS OWN NEVER USES THIS: Settings and the share
 * kit ride `?room=` (the provider pushes and pops those), so `PopupContent`
 * takes `routed` and stays out of history.
 */
export const POPUP_HISTORY_MARKER = "prPopup"

let entries = 0

function markerOf(state: unknown): unknown {
  return (state as Record<string, unknown> | null)?.[POPUP_HISTORY_MARKER]
}

/** The entry a popup pushed: its marker, and the address it stands at (a popup has no address of its own). */
type PushedEntry = { id: string; at: string }

/**
 * Whether the entry the window is on is still the one a popup pushed. The marker says so; where it is gone
 * (a refresh) the popup's own word does, as long as the address is the one the entry was pushed at.
 */
function stillOurs(entry: PushedEntry): boolean {
  const marker = markerOf(window.history.state)
  if (marker !== undefined) return marker === entry.id
  return window.location.href === entry.at
}

export function useBackCloses(active: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  const entryRef = useRef<PushedEntry | null>(null)
  const pendingRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    if (pendingRef.current !== null) {
      window.clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    let entry = entryRef.current
    if (!entry) {
      entries += 1
      entry = { id: `popup-${entries}`, at: window.location.href }
      entryRef.current = entry
      window.history.pushState({ [POPUP_HISTORY_MARKER]: entry.id }, "")
    }
    const mine = entry
    let popped = false
    const onPop = () => {
      if (markerOf(window.history.state) === mine.id) return
      popped = true
      entryRef.current = null
      closeRef.current()
    }
    window.addEventListener("popstate", onPop)
    return () => {
      window.removeEventListener("popstate", onPop)
      if (popped) return
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null
        entryRef.current = null
        if (stillOurs(mine)) window.history.back()
      }, 0)
    }
  }, [active])
}
