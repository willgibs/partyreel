// The host event-page tabs (Gallery / Reel / Reviews). Pure + node-safe (server-resolved, client-safe),
// mirroring resolveInitialFilter (lib/dashboard/filters.ts). The event page reads `?eventTab=` (the dashboard
// already claims `?tab=` as a legacy alias) and passes the resolved value as the Tabs defaultValue so SSR
// matches the client (the host page bails its whole subtree on a hydration mismatch, architecture.md).
//
// "reviews" only exists while moderation is ON (moderation_mode === 'hold_for_approval'): the resolver GATES
// it (an explicit ?eventTab=reviews while moderation is off falls back to gallery, so we never resolve to a
// hidden panel) and, with no explicit tab, SURFACES the review queue first - it returns "reviews" when
// moderation is on AND a queue is waiting, else "gallery". Pure so the page gates without a Supabase call.

export const EVENT_TABS = ["gallery", "reel", "reviews"] as const;
export type EventTab = (typeof EVENT_TABS)[number];

export function resolveInitialEventTab(
  eventTab: string | undefined,
  opts?: { moderationOn?: boolean; hasPending?: boolean },
): EventTab {
  const moderationOn = opts?.moderationOn ?? false;
  const hasPending = opts?.hasPending ?? false;

  if (eventTab && (EVENT_TABS as readonly string[]).includes(eventTab)) {
    const tab = eventTab as EventTab;
    // "reviews" is only a real panel while moderation is on; otherwise fall back (no dead tab).
    if (tab === "reviews" && !moderationOn) return "gallery";
    return tab;
  }
  // No explicit tab: surface the review queue first when there's work waiting (Will, 2026-06-21).
  if (moderationOn && hasPending) return "reviews";
  return "gallery";
}
