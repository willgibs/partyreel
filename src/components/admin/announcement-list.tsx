"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAnnouncementAction } from "@/app/admin/announcements/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AnnouncementListItem } from "@/lib/db/queries/announcements";

// `scheduled` (published_at in the future) is computed on the SERVER (in the query) and passed in, so
// this client component never reads the clock during render (the React-Compiler purity rule forbids it).
// The operator's published + scheduled announcements, newest-first, each deletable (behind a confirm
// Dialog). Delete goes through the AAL2-gated action; the action revalidates so the list re-renders.
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
  const [isPending, startTransition] = useTransition();
  const scheduled = announcement.scheduled;

  function onDelete() {
    startTransition(async () => {
      const result = await deleteAnnouncementAction(announcement.id);
      if (result.ok) {
        toast.success("Announcement deleted.");
        return;
      }
      toast.error("Couldn't delete the announcement.", {
        description: result.message,
      });
    });
  }

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
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete announcement"
            disabled={isPending}
          >
            <Trash2 />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this announcement?</DialogTitle>
            <DialogDescription>
              It disappears from every host&rsquo;s notification list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                Delete
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
