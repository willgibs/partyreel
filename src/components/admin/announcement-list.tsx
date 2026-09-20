"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncementAction } from "@/app/admin/announcements/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnnouncementListItem } from "@/lib/db/queries/announcements";

// `scheduled` (published_at in the future) is computed on the SERVER (in the query) and passed in, so
// this client component never reads the clock during render (the React-Compiler purity rule forbids it).
// The operator's published + scheduled announcements, newest-first, each deletable behind the portal's
// one destructive sheet (`destructive=sheet`, 2026-09-20; it was a plain dialog that asked nothing and
// closed on the same click that fired the action, so `disabled={isPending}` never engaged). Delete goes
// through the AAL2-gated action; the action revalidates so the list re-renders.
export function AnnouncementList({ items }: { items: AnnouncementListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No announcements yet.</p>
    );
  }
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((a) => (
        <AnnouncementRow key={a.id} announcement={a} />
      ))}
    </ul>
  );
}

function AnnouncementRow({
  announcement,
}: {
  announcement: AnnouncementListItem;
}) {
  const [asking, setAsking] = useState(false);
  const scheduled = announcement.scheduled;

  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{announcement.title}</p>
          {scheduled ? <Badge variant="secondary">Scheduled</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{announcement.body}</p>
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {new Date(announcement.published_at).toLocaleString()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete announcement"
        onClick={() => setAsking(true)}
      >
        <Trash2 />
      </Button>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title="Delete this announcement?"
        lede="It disappears from every host's notification list, and there is no bin for it."
        verb="Delete announcement"
        touches={[
          `"${announcement.title}"`,
          scheduled
            ? "It has not been published yet, so nobody has seen it"
            : "Every host who has already seen it loses it from their list",
          "There is no undo: the row is deleted outright",
        ]}
        severity="permanent"
        successMessage="Announcement deleted."
        onConfirm={() => deleteAnnouncementAction(announcement.id)}
      />
    </li>
  );
}
