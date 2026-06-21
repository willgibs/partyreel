// The host event-page tabs (Uploads / Reel). Pure + node-safe (server-resolved, client-safe), mirroring
// resolveInitialFilter (lib/dashboard/filters.ts). The event page reads `?eventTab=` (the dashboard
// already claims `?tab=` as a legacy alias) and passes the resolved value as the Tabs defaultValue so SSR
// matches the client (the host page bails its whole subtree on a hydration mismatch, architecture.md).
// An unknown / absent value falls back to "uploads".
//
// (A future round adds "reviews" here, conditional on moderation being on - keep the resolver pure so it
// can gate that without a Supabase call.)

export const EVENT_TABS = ["gallery", "reel"] as const;
export type EventTab = (typeof EVENT_TABS)[number];

export function resolveInitialEventTab(
  eventTab: string | undefined,
): EventTab {
  if (eventTab && (EVENT_TABS as readonly string[]).includes(eventTab)) {
    return eventTab as EventTab;
  }
  return "gallery";
}
