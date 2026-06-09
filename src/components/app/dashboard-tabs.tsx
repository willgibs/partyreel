"use client";

import { Tabs } from "@/components/ui/tabs";

// Makes the dashboard's active tab deep-linkable + refresh-safe WITHOUT a server round-trip per switch
// (which would make tabbing feel slow). The switch stays instant (radix's uncontrolled state); on change we
// sync `?tab=` via history.replaceState (URL only, no re-render). The initial tab is the server-resolved
// searchParams value (defaultValue), so a deep link (e.g. /dashboard?tab=uploads) or a refresh opens it.
export function DashboardTabs({
  defaultValue,
  children,
}: {
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <Tabs
      defaultValue={defaultValue}
      onValueChange={(value) => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", value);
        window.history.replaceState(null, "", url);
      }}
    >
      {children}
    </Tabs>
  );
}
