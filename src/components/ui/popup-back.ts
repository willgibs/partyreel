"use client"

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useContext, useEffect, useRef } from "react"

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
 * ★ THE SHEET IS A PLACE TOO (crumbs-47, `isPlaceShape`): the credit's look is a
 * sheet in a hand, and over the photograph viewer, which holds an entry of its
 * own, a look with none made one Back close the viewer with the look standing on
 * it. Back peels one layer a press: the look, then the viewer.
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
 * ★ AND A LINK INSIDE IT TAKES ITS ENTRY WITH IT (crumbs-32, from
 * `claims-wiring`). A link in the place (the claims review's Open album, a
 * look's Open full profile over the guest list) used to push the next page on
 * top of the place's same-URL entry: one dead Back, the page with nothing open
 * on it. So while the window stands on the place's own entry, a plain click on
 * a link to another page of this site navigates by REPLACING that entry, the
 * click taken before the link's own handler sees it (Next's `Link` skips a
 * click whose default is prevented), and Back from the new page lands on the
 * page the place was opened over. Only the clicks a `Link` would navigate in
 * this tab: a modified click, a new tab's target, a download, another origin
 * and a hash on this page are the browser's, as they were. With no router (a
 * test, the Library) the link is left alone.
 *
 * ★ A POPUP THAT HAS A URL OF ITS OWN NEVER USES THIS: Settings and the share
 * kit ride `?room=` (the provider pushes and pops those), so `PopupContent`
 * takes `routed` and stays out of history.
 */
export const POPUP_HISTORY_MARKER = "prPopup"

/**
 * The address a click on a link would take this tab to, as Next's own `Link`
 * decides it navigates (a plain primary click, no target but this tab, no
 * download), when that is another page of this site; null for every click the
 * browser keeps (the rest, and a hash on this very page).
 */
export function pageLinkHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return null
  const target = event.target
  if (!(target instanceof Element)) return null
  const anchor = target.closest("a[href]")
  if (!(anchor instanceof HTMLAnchorElement)) return null
  if (anchor.hasAttribute("download")) return null
  const opens = anchor.getAttribute("target")
  if (opens && opens !== "_self") return null
  const here = new URL(window.location.href)
  const to = new URL(anchor.href, here)
  if (to.origin !== here.origin) return null
  if (to.pathname === here.pathname && to.search === here.search) return null
  return `${to.pathname}${to.search}${to.hash}`
}

export function useBackCloses(active: boolean, close: () => void) {
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  const entry = useOwnedEntry(POPUP_HISTORY_MARKER, { many: true })
  // Read off Next's context, not `useRouter()`, which throws where there is none (the history helper's own note).
  const router = useContext(AppRouterContext)
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
    // A link inside takes the place's entry with it (the head's note). Only while the window stands on
    // it: a place stacked over this one owns the entry on top, and the click is its to take.
    const onClick = (event: MouseEvent) => {
      if (!router || !entry.isOurs()) return
      const href = pageLinkHref(event)
      if (href === null) return
      event.preventDefault()
      router.replace(href)
    }
    window.addEventListener("popstate", onPop)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("popstate", onPop)
      document.removeEventListener("click", onClick, true)
      if (popped) return
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null
        if (entry.isOurs()) entry.back()
        else entry.forget()
      }, 0)
    }
  }, [active, entry, router])
}
