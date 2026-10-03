"use client";

import { type ReactNode, useMemo } from "react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";

import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import type { NotificationItem } from "@/lib/notifications/build";
import { formatCount } from "@/lib/format/count";

import { cropRules } from "./crops";
import type { Host } from "./fixtures";

/**
 * THE HOST APP AROUND EVERY DRAWING: production's own `AppShell` with the
 * `(app)` layout's two header actions, the bell and the account menu, drawn and
 * not wired (`inert`: the account menu signs out, and a lab sitting must never).
 * The bell holds what production's would: one row an event with uploads waiting.
 *
 * ★ THE ROUTER IS THE BOARD'S. Production's stage and week reach for
 * `useRouter()` (the code card's Everything pushes to the event's share room);
 * in a frame that router is the lab's own and would carry the reviewer off the
 * board. So the frame's subtree gets a router of its own (the context the app
 * already reads, `popup-back.ts`'s pattern): a push to an event opens its
 * stand-in page, and every other call goes nowhere.
 */

/**
 * THE EMPTY STAGE'S TWO MOTIONS (`empty-stage.tsx`), each rare or slow enough
 * to earn its place (bible 5) and gone under reduced motion, where the stage
 * stands complete at rest: the lamp igniting once as she lands from Create
 * (`lit`), and the album's empty frames drifting like a print in its tray
 * (`album`).
 */
const MOTION = `@keyframes hd-ignite{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:none}}
[data-hd-ignite]{animation:hd-ignite 1.8s cubic-bezier(.2,.7,.2,1) both}
@keyframes hd-develop{from{transform:translate3d(-5%,-4%,0)}to{transform:translate3d(5%,4%,0) scale(1.08)}}
[data-hd-develop]{animation:hd-develop 10s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){[data-hd-ignite],[data-hd-develop]{animation:none}}`;

/**
 * Each crop's position and zoom, and one repair the frame needs: Radix lifts a
 * popover's positioned wrapper to its content's z-index by reading
 * `getComputedStyle` off the LAB's window, which answers `auto` for an element
 * in a frame's document, so a menu drawn open from the start (mounted before
 * the page beside it) painted under the page's rows. Production's own windows
 * never meet it.
 */
const FRAME_SHEET = `${cropRules()}
[data-radix-popper-content-wrapper]{z-index:50!important}
${MOTION}`;

function bellOf(host: Host): { items: NotificationItem[]; badge: number } {
  const items = host.hosted
    .filter((e) => e.pending > 0)
    .map((e) => ({
      key: `review-${e.id}`,
      kind: "review" as const,
      title: `${formatCount(e.pending)} uploads to review`,
      body: e.name,
      href: `/dashboard/${e.id}/review`,
      unread: true,
    }));
  return {
    items,
    badge: host.hosted.reduce((n, e) => n + e.pending + e.waiting, 0),
  };
}

export function HostShell({
  host,
  onNavigate,
  children,
}: {
  host: Host;
  /** Where a production component asked the router to go: an event's page, or back. */
  onNavigate: (href: string | null) => void;
  children: ReactNode;
}) {
  const router = useMemo<AppRouterInstance>(
    () => ({
      back: () => onNavigate(null),
      forward: () => {},
      refresh: () => {},
      push: (href) => onNavigate(href),
      replace: (href) => onNavigate(href),
      prefetch: () => {},
    }),
    [onNavigate],
  );
  const bell = bellOf(host);
  return (
    <AppRouterContext.Provider value={router}>
      <style>{FRAME_SHEET}</style>
      <div className="min-h-screen bg-background text-foreground">
        <AppShell
          headerActions={
            <span inert className="flex items-center gap-2">
              <NotificationBell items={bell.items} badgeCount={bell.badge} />
              <UserMenu
                email={host.email}
                displayName={host.name}
                avatarUrl={null}
                seed={host.seed}
                planName={host.plan.name}
              />
            </span>
          }
        >
          {children}
        </AppShell>
      </div>
    </AppRouterContext.Provider>
  );
}
