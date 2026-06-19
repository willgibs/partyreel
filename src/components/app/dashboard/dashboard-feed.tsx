"use client";

import { useState } from "react";

import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { type FilterValue } from "@/lib/dashboard/filters";

/**
 * The single-feed client boundary (Phase 5 S2b). Owns the chip filter state +
 * URL sync, and renders the SERVER-rendered section slots per filter. The page
 * fetches + renders each section server-side (presigned URLs never cross as
 * client data) and hands them down as element slots; this component only decides
 * which show. "all" stacks Events -> Uploads -> Likes; a specific chip narrows;
 * Trash is reachable only via its chip. State survives router.refresh (a host
 * action revalidates the segment), so the active filter persists after an action.
 */
export function DashboardFeed({
  initialFilter,
  trashCount,
  showChips,
  eventsSection,
  uploadsSection,
  likesSection,
  trashSection,
}: {
  initialFilter: FilterValue;
  trashCount: number;
  /** Hidden when there is nothing to navigate (the pure onboarding page). */
  showChips: boolean;
  eventsSection: React.ReactNode;
  uploadsSection: React.ReactNode;
  likesSection: React.ReactNode;
  trashSection: React.ReactNode;
}) {
  const [filter, setFilter] = useState<FilterValue>(initialFilter);

  function select(next: FilterValue) {
    setFilter(next);
    // URL sync WITHOUT navigation: refresh-safe + deep-linkable, no server
    // roundtrip. replaceState (not push) so Back leaves /dashboard rather than
    // walking back through every chip the user tapped.
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", next);
    url.searchParams.delete("tab"); // the client owns the param now; drop the legacy alias
    window.history.replaceState(null, "", url);
  }

  const showEvents = filter === "all" || filter === "events";
  const showUploads = filter === "all" || filter === "uploads";
  const showLikes = filter === "all" || filter === "likes";
  const showTrash = filter === "trash";

  return (
    <div className="space-y-6">
      {showChips && (
        <FilterChips active={filter} onChange={select} trashCount={trashCount} />
      )}
      <div className="space-y-8">
        {showEvents && eventsSection}
        {showUploads && uploadsSection}
        {showLikes && likesSection}
        {showTrash && trashSection}
      </div>
    </div>
  );
}
