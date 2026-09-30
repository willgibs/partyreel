"use client"

import { useEffect, useRef } from "react"

import { useOwnedEntry } from "@/lib/history-entry"

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
 * ★ WHOSE THE ENTRY IS LIVES IN `lib/history-entry.ts`, which every place that
 * pushes an entry stands on (its header says what Next does to one: the marker
 * is a field on the state Next merges, never the state itself, and a router
 * refresh takes it). A popup is the helper's `many` kind: every popup shares one
 * key, so a marker is its own only by its id, and an entry a refresh stripped
 * is its own only at the address it was pushed at (crumbs-18: opened at entry 4,
 * refreshed, closed by its arrow, still standing on entry 5; the claims review
 * and the storage list refresh while they are open). No URL is passed, so
 * Next's patched `pushState` has no route to apply and the router never
 * re-renders. Never taken back at another address, and never over another
 * entry's marker: a popup that goes because the page navigated on (a link inside
 * it) has no entry to undo, and taking one back would undo the navigation.
 *
 * ★ THE ENTRY IS TAKEN BACK ONE TICK LATE, ON PURPOSE. React's development
 * StrictMode runs every effect's cleanup and body twice on mount; a `back()`
 * in that simulated cleanup followed by a fresh `pushState` would queue a
 * traversal onto the NEW entry and close the popup the moment it opened. So a
 * cleanup schedules its `back()`, and a body that runs again first cancels it
 * and keeps the entry it already has.
 *
 * ★ A POPUP THAT HAS A URL OF ITS OWN NEVER USES THIS: Settings and the share
 * kit ride `?room=` (the provider pushes and pops those), so `PopupContent`
 * takes `routed` and stays out of history.
 */
export const POPUP_HISTORY_MARKER = "prPopup"

export function useBackCloses(active: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  const entry = useOwnedEntry(POPUP_HISTORY_MARKER, { many: true })
  const pendingRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    if (pendingRef.current !== null) {
      window.clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    // The entry it already holds, if any: StrictMode's second run keeps the one the first pushed.
    if (!entry.held()) entry.push()
    let popped = false
    const onPop = () => {
      if (entry.stands()) return
      popped = true
      entry.forget()
      closeRef.current()
    }
    window.addEventListener("popstate", onPop)
    return () => {
      window.removeEventListener("popstate", onPop)
      if (popped) return
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null
        if (entry.isOurs()) entry.back()
        else entry.forget()
      }, 0)
    }
  }, [active, entry])
}
