"use client"

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useContext, useEffect, useRef } from "react"

import { steppingOut } from "@/components/ui/popup-back-way-out"
import { useOwnedEntry, type OwnedEntry } from "@/lib/history-entry"

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
 * ★ AND A QUESTION OVER ANOTHER LAYER HOLDS ONE (back-layers; crumbs-47 found the
 * viewer's Delete and Remove confirms closing with the viewer in one press). A
 * question is no place, but over a place it is the top layer, and with no entry
 * of its own the Back took the place's. So a popup asks as it opens whether it
 * holds an entry at all (`holdsIf`): `PopupContent` holds one for a place, and for
 * a question only over another layer (`layerIsUp`). A question over the bare page
 * holds none, as before: Back there leaves the page, as a page's Back does.
 *
 * ★ THE ENTRIES ARE A STACK, TAKEN BACK IN ITS ORDER (back-layers). A question
 * over a place is two entries of ours that can go at once: its act closing the
 * place too, or a look closing as the Block screen it opened takes its place (a
 * swap, in one commit). Each popup taking its own entry back by its own marker
 * left the lower one standing under the upper's marker, one dead Back. So the
 * entries are kept in push order (`stack`): a popup that goes marks its entry
 * `closing`, and the closing run at the top goes Back one entry a landing, each
 * only while the window still stands on it; a closing entry under an open one
 * waits for it (the swap: when the question goes, both go, and a Back over the
 * question steps over the look's entry too); and a push waits for a Back of ours
 * still on its way, which would otherwise take the new entry instead.
 *
 * ★ ONE PRESS POPS ONE ENTRY, THE STACK'S TOP. A person's Back is read once, here
 * (`onPopState`), never by each popup against its own marker: a refresh takes the
 * marker of the entry the window stands on (the claims review and the storage
 * list refresh while open), so a question over one going Back landed on the
 * place's stripped entry, which read to the place as its own entry gone.
 *
 * ★ A RELOAD STRANDS NO ENTRY (back-layers; crumbs-47). A reload keeps the open
 * popup's entry and its marker and forgets the popup, so one Back landed on the
 * same page and closed nothing, and a viewer reopened from its address read the
 * dead marker as a popup over it and wrote no address (`shared/masonry.tsx`). An
 * entry cannot be deleted, only stepped over: whenever a popup's hook mounts, and
 * the album as it mounts (`stepOverDeadEntries`), an entry whose marker this page
 * life never wrote is gone Back over, a landing at a time, until the window
 * stands on a live one (the same address, so nothing moves; the reopened viewer
 * then stands on its own entry and takes it up).
 *
 * ★ AN ENTRY WHOSE POPUP HAS GONE IS STEPPED OVER WHEN A PRESS LANDS ON IT, THE
 * WAY THE PRESS WAS GOING (crumbs-83). Two kinds stay behind with this page
 * life's own marker on them (`spent`):
 *   - OVER the window: the entry a person's Back popped, or a Back of ours took
 *     back. Only a Forward lands there again, and it read as a Back off the top
 *     entry, so Forward onto a closed popup's entry closed the popup open beneath
 *     it, and stood on a dead entry besides. The popup is gone and cannot come
 *     back, so that Forward is undone: one step Back, the popup beneath untouched.
 *   - UNDER a page the window went on to: a popup whose act navigates (a server
 *     action's redirect, `router.push`) goes with its page and its entry stays
 *     under the next one, so Back from there landed on a same-address entry with
 *     nothing open, one dead Back. Landed on from the page above, the step goes on
 *     Back to the page beneath; landed on from that page (a Forward after it), on
 *     Forward to the page above.
 * Our own step that lands on another such entry goes on the same way. The
 * reload's dead entries above are the earlier page life's; these are this one's.
 *
 * ★ THE WAY OUT FOR STRIPE'S PAGE GOES BACK OVER THESE ENTRIES WITHOUT CLOSING
 * ANYTHING (`popup-back-way-out.ts`, for `app/pricing/leave.ts`): a landing it
 * brings forgets every entry the window left, and every popup stays drawn as the
 * page leaves.
 *
 * ★ WHOSE THE ENTRY IS LIVES IN `lib/history-entry.ts`, which every place that
 * pushes an entry stands on (its header says what Next does to one: the marker
 * is a field on the state Next merges, never the state itself, and a router
 * refresh takes it). A popup is the helper's `many` kind: every popup shares one
 * key, so a marker is its own only by its id, and an entry a refresh stripped
 * is its own only at the address it was pushed at (crumbs-18: opened at entry 4,
 * refreshed, closed by its arrow, still standing on entry 5). No URL is passed,
 * so Next's patched `pushState` has no route to apply and the router never
 * re-renders. Never taken back at another address, and never over another
 * entry's marker: a popup that goes because the page navigated on (a link inside
 * it) has no entry to undo, and taking one back would undo the navigation.
 *
 * ★ THE ENTRY IS TAKEN BACK ONE TICK LATE, ON PURPOSE. React's development
 * StrictMode runs every effect's cleanup and body twice on mount; a `back()`
 * in that simulated cleanup followed by a fresh `pushState` would queue a
 * traversal onto the NEW entry and close the popup the moment it opened. So a
 * cleanup schedules its `closing`, and a body that runs again first cancels it
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

/* ── THE STACK (the head's notes) ───────────────────────────────────────────── */

/** How long a Back of ours is taken to be on its way when no `popstate` says it landed (the helper's own floor). */
const TRAVEL_FLOOR_MS = 1000

type Held = {
  entry: OwnedEntry
  /** Its marker, which its entry keeps once the popup has gone (`spent`). */
  id: string
  /** Its popup went another way than Back: the entry is to be taken back, in the stack's order. */
  closing: boolean
  /** A person's Back popped it: nothing is left to take back. */
  gone: boolean
  /** The popup's own close, for the Back that pops its entry. */
  popped: () => void
}

/**
 * Where an entry stands whose popup has gone and whose marker this page life wrote (the head's note): OVER the
 * window (popped by a person's Back, or taken back by ours), or UNDER a page the window went on to, with the side
 * the window was last on.
 */
type Spent = { at: "over" } | { at: "under"; windowAbove: boolean }

/** How many spent entries are remembered: an older one is far past any press a person makes in one visit. */
const SPENT_KEPT = 100

/** The spent entries by their markers, oldest first. */
const spent = new Map<string, Spent>()

function spend(id: string, fate: Spent) {
  if (!id) return
  spent.delete(id)
  spent.set(id, fate)
  if (spent.size > SPENT_KEPT) spent.delete(spent.keys().next().value!)
}

/** The entries this page's popups pushed that still stand in its history, oldest first. */
const stack: Held[] = []
/** Every marker this page life wrote: one it never wrote is a popup a reload forgot. */
const written = new Set<string>()
/** A Back this module asked for (or a Forward over a spent entry), until a `popstate` says it landed. */
let travelling = false
/** Which way that step goes: a step that lands on another spent entry goes on the same way. */
let travelForward = false
let travelFloor = 0
/** Pushes waiting for that Back to land. */
const waiting: (() => void)[] = []
let listening = false

const markerHere = (): unknown =>
  (window.history.state as Record<string, unknown> | null)?.[
    POPUP_HISTORY_MARKER
  ]

/** The window stands on an entry whose marker this page life never wrote. */
function onDeadEntry(): boolean {
  const seen = markerHere()
  return typeof seen === "string" && !written.has(seen)
}

/** The window stands on an entry whose popup has gone (the head's note), or on none such. */
function spentHere(): Spent | undefined {
  const seen = markerHere()
  return typeof seen === "string" ? spent.get(seen) : undefined
}

function listen() {
  if (listening) return
  listening = true
  window.addEventListener("popstate", onPopState)
}

function onPopState() {
  // ★ THE WAY OUT'S OWN TRAVERSAL (the head's note): every entry the window left is forgotten, and nothing closes.
  if (steppingOut()) {
    while (stack.length > 0) {
      const top = stack[stack.length - 1]
      if (top.entry.stands()) break
      stack.pop()
      top.gone = true
      top.entry.forget()
    }
    return
  }
  const fate = spentHere()
  if (travelling) {
    endTravel()
    // A step of ours goes on, the way it was going, while the window stands on an entry no open popup holds: one
    // whose popup has gone, or a reload's dead one.
    if (fate) {
      stepOver(fate, fate.at === "under" && travelForward)
      return
    }
    if (onDeadEntry()) {
      travel(() => window.history.back())
      return
    }
  } else if (fate) {
    // ★ A person's press landed on an entry whose popup has gone (the head's note): it is stepped over, and no
    // popup open beneath it is touched. Over the window, it was a Forward: undone. Under a page, the way it came.
    stepOver(fate, fate.at === "under" && !fate.windowAbove)
    return
  } else {
    // A person's press: it popped the top entry, if the window has left it, and nothing under it.
    const top = stack[stack.length - 1]
    if (top && !top.entry.stands()) {
      stack.pop()
      top.gone = true
      top.entry.forget()
      spend(top.id, { at: "over" })
      if (!top.closing) top.popped()
    }
  }
  settle()
}

/** One step over a spent entry: Forward toward the page over it, or Back. */
function stepOver(fate: Spent, forward: boolean) {
  if (fate.at === "under") fate.windowAbove = forward
  travel(
    forward ? () => window.history.forward() : () => window.history.back(),
    forward,
  )
}

function travel(step: () => void, forward = false) {
  travelling = true
  travelForward = forward
  window.clearTimeout(travelFloor)
  travelFloor = window.setTimeout(() => {
    endTravel()
    settle()
  }, TRAVEL_FLOOR_MS)
  step()
}

function endTravel() {
  travelling = false
  window.clearTimeout(travelFloor)
}

/**
 * The closing run at the top of the stack goes Back one entry a landing, each only while the window stands on
 * it (else the page moved on, or something else pushed over it: nothing of ours to undo); then the pushes that
 * waited go, a tick late, so a landing's other listeners (Next's own restore) have read it first.
 */
function settle() {
  if (travelling) return
  while (stack.length > 0) {
    const top = stack[stack.length - 1]
    if (!top.closing) break
    stack.pop()
    if (top.entry.isOurs()) {
      // Its Back leaves the entry over the window, where only a Forward lands on it again.
      spend(top.id, { at: "over" })
      travel(() => top.entry.back())
      return
    }
    // ★ The page it was open over went on (a link, `router.push`, a server action's redirect) or something else
    // pushed over it: its entry stays under that one, and a Back from there lands on it (the head's note).
    spend(top.id, { at: "under", windowAbove: true })
    top.entry.forget()
  }
  if (waiting.length > 0) window.setTimeout(pushWaiting, 0)
}

function pushWaiting() {
  while (!travelling && waiting.length > 0) waiting.shift()?.()
}

/** `push` now, or once a Back of ours still on its way has landed; returns its cancel. */
function whenSettled(push: () => void): () => void {
  if (!travelling) {
    push()
    return () => {}
  }
  waiting.push(push)
  return () => {
    const at = waiting.indexOf(push)
    if (at >= 0) waiting.splice(at, 1)
  }
}

/**
 * ★ A RELOAD STRANDS NO ENTRY (the head's note): step Back over every entry whose popup marker this page life
 * never wrote. Cheap and idempotent, for every popup hook's mount and for a place that reads the marker (the
 * album's address, `shared/masonry.tsx`), so the album steps over it before any popup of its own has mounted.
 */
export function stepOverDeadEntries() {
  if (typeof window === "undefined") return
  listen()
  if (travelling || !onDeadEntry()) return
  travel(() => window.history.back())
}

export type BackClosesOptions = {
  /**
   * Whether this open holds an entry at all, asked once as it opens: a question holds one only over another
   * layer (`PopupContent`). Left off, every open holds one.
   */
  holdsIf?: () => boolean
}

export function useBackCloses(
  active: boolean,
  close: () => void,
  options: BackClosesOptions = {},
) {
  const closeRef = useRef(close)
  const holdsIfRef = useRef(options.holdsIf)
  useEffect(() => {
    closeRef.current = close
    holdsIfRef.current = options.holdsIf
  })
  const entry = useOwnedEntry(POPUP_HISTORY_MARKER, { many: true })
  // Read off Next's context, not `useRouter()`, which throws where there is none (the history helper's own note).
  const router = useContext(AppRouterContext)
  /** This popup's place in the stack while its entry stands. */
  const heldRef = useRef<Held | null>(null)
  const pendingRef = useRef<number | null>(null)

  // A reload's dead entries go first: declared before the push below, so a popup open on mount pushes after it.
  useEffect(() => {
    stepOverDeadEntries()
  }, [])

  useEffect(() => {
    if (!active) return
    if (pendingRef.current !== null) {
      window.clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    // The entry it already holds, if any: StrictMode's second run keeps the one the first pushed.
    let cancelPush = () => {}
    if (heldRef.current === null) {
      if (holdsIfRef.current && !holdsIfRef.current()) return
      cancelPush = whenSettled(() => {
        entry.push()
        const seen = markerHere()
        const id = typeof seen === "string" ? seen : ""
        if (id) written.add(id)
        const held: Held = {
          entry,
          id,
          closing: false,
          gone: false,
          popped: () => closeRef.current(),
        }
        heldRef.current = held
        stack.push(held)
      })
    }
    // A link inside takes the place's entry with it (the head's note). Only while the window stands on
    // it: a place stacked over this one owns the entry on top, and the click is its to take.
    const onClick = (event: MouseEvent) => {
      if (!router || heldRef.current === null || !entry.isOurs()) return
      const href = pageLinkHref(event)
      if (href === null) return
      event.preventDefault()
      router.replace(href)
    }
    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      cancelPush()
      const held = heldRef.current
      if (held === null) return
      if (held.gone) {
        heldRef.current = null
        return
      }
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null
        heldRef.current = null
        if (held.gone) return
        held.closing = true
        settle()
      }, 0)
    }
  }, [active, entry, router])
}
