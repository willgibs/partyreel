"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { markAnnouncementsSeenAction } from "@/app/(app)/actions";
import type { NotificationItem } from "@/lib/notifications/build";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { floatingRow } from "@/components/ui/floating-layer";

type NotificationBellProps = {
  items: NotificationItem[];
  badgeCount: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// In-app alert aggregator (Phase 6 cut #4). Derived alerts (review/over-cap/pass-expiry) are
// STATE — they persist in the badge until resolved. Announcements clear on view: opening the
// panel persists the seen marker (server) AND optimistically drops their badge contribution
// here, so the count updates instantly without a re-render.
export function NotificationBell({ items, badgeCount }: NotificationBellProps) {
  const [seen, setSeen] = useState(false);
  const [, startTransition] = useTransition();

  const unreadAnnouncements = items.filter(
    (i) => i.kind === "announcement" && i.unread,
  ).length;
  const count = seen ? badgeCount - unreadAnnouncements : badgeCount;

  function onOpenChange(open: boolean) {
    if (open && !seen && unreadAnnouncements > 0) {
      setSeen(true);
      startTransition(() => {
        void markAnnouncementsSeenAction();
      });
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        aria-label={count > 0 ? `Notifications, ${count} new` : "Notifications"}
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* The title row rather than a label plus a rule: this panel has one
            subject and a count, which is exactly what a header is for (Card,
            Will 2026-09-17). The count is the state you opened it to read, so
            it rides the trailing column. */}
        <DropdownMenuHeader meta={count > 0 ? `${count} new` : undefined}>
          Notifications
        </DropdownMenuHeader>
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&rsquo;re all caught up.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((item) => {
              const showUnread =
                item.kind === "announcement"
                  ? !seen && item.unread
                  : item.unread;
              const external = item.href?.startsWith("http");
              const row = (
                <div className="flex gap-2 px-2 py-2">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      showUnread ? "bg-brand" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm leading-tight font-medium">
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="text-xs text-muted-foreground">
                        {item.body}
                      </p>
                    )}
                    {item.date && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
                      </p>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={item.key}>
                  {!item.href ? (
                    row
                  ) : external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("block hover:bg-muted", floatingRow)}
                    >
                      {row}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn("block hover:bg-muted", floatingRow)}
                    >
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
