"use client";

import {
  ArrowUpRight,
  Heart,
  ImageUp,
  Link2,
  Trash2,
  UserRound,
} from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

import { Face, StorageChip } from "./chrome";
import { HOST, MY_LIKES, MY_UPLOADS, STORAGE } from "./fixtures";

/**
 * WHERE THE MONEY, THE ACCOUNT AND HER OWN PHOTOGRAPHS LIVE.
 *
 * Billing has no home in the app today: the only way to a plan is a popover on
 * the storage strip on the dashboard, and the only way to the Billing Portal is
 * a button inside it. The social settings are spread over four places with an
 * unlinked "go to Account settings" among them, and her own uploads and likes
 * are two chips on the home beside her events. Three answers are drawn here,
 * and the first one is what ships.
 */

export type You = "today" | "you" | "account";

export const youOf = (v: string | undefined): You =>
  v === "today" || v === "account" ? v : "you";

const used = formatBytes(STORAGE.used);
const cap = formatBytes(STORAGE.cap);

function Tiles({ items, n }: { items: typeof MY_LIKES; n: number }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-9">
      {items.slice(0, n).map((m) => (
        <span
          key={m.id}
          data-media-tile
          data-static
          data-lit=""
          className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
        >
          <MediaTile item={m} playBadge="none" />
        </span>
      ))}
    </div>
  );
}

/**
 * TODAY: the dashboard with the storage popover open, which is the only place
 * a plan is named. Drawn rather than opened, because the shipped popover
 * portals to the lab page's document rather than the frame's; every word and
 * every control in it is the shipped `StorageMeter`'s, in its own order.
 */
function TodayShape() {
  return (
    <div className="space-y-6">
      <PageHeading>Dashboard</PageHeading>
      <div className="relative">
        <span className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Storage
          </span>
          <StorageChip full />
        </span>
        <div className="mt-2 w-72 space-y-2.5 rounded-xl border border-border bg-popover p-4 shadow-layer">
          <p className="text-sm font-medium">
            {used} of {cap}
          </p>
          <p className="text-xs text-muted-foreground">
            Your Pro plan holds about 40,000 photos or 600 min of video.{" "}
            <span className="font-medium text-foreground underline underline-offset-4">
              Need more?
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            + {formatBytes(STORAGE.standby)} in Deleted (frees automatically).
          </p>
          <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">
            <Button variant="outline" size="sm">
              Manage billing
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          And the rest is somewhere else
        </p>
        <p>
          The profile and its slug are on /account. Whether an event shows on
          your profile is on that event&rsquo;s settings. The guest list is
          there too. A fourth place mentions &ldquo;Account settings&rdquo; and
          does not link to it. Your uploads and your likes are chips on this
          page.
        </p>
      </div>
    </div>
  );
}

const YOU_ROWS = [
  {
    id: "plan",
    Icon: ArrowUpRight,
    title: "Plan and storage",
    desc: `Pro · ${used} of ${cap} · billing, invoices and the Event Pass`,
  },
  {
    id: "profile",
    Icon: UserRound,
    title: "Your public profile",
    desc: `partyreel.com/${HOST.slug} · ${HOST.followers} followers · which events appear on it`,
  },
  {
    id: "connections",
    Icon: Link2,
    title: "Connections",
    desc: `${HOST.following} hosts you follow, and the events you saved`,
  },
  { id: "bin", Icon: Trash2, title: "Deleted", desc: "1 event, 22 days left" },
] as const;

/** ONE PLACE: the plan, the profile, the connections, her own media, the bin. */
function YouShape() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Face size="size-14" />
        <div className="min-w-0">
          <PageHeading>{HOST.name}</PageHeading>
          <p className="text-sm text-muted-foreground">
            partyreel.com/{HOST.slug} · {HOST.email}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {YOU_ROWS.map(({ id, Icon, title, desc }) => (
          <div
            key={id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4",
              id === "plan" ? "border-warning/40 bg-warning/5" : "border-border",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                id === "plan" ? "text-warning" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-card-title">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-2.5">
        <h2 className="flex items-center gap-2 font-heading text-subsection">
          <ImageUp className="size-4 text-muted-foreground" aria-hidden />
          Your uploads
        </h2>
        <Tiles items={MY_UPLOADS} n={9} />
      </section>
      <section className="space-y-2.5">
        <h2 className="flex items-center gap-2 font-heading text-subsection">
          <Heart className="size-4 text-muted-foreground" aria-hidden />
          Your likes
        </h2>
        <Tiles items={MY_LIKES} n={9} />
      </section>
    </div>
  );
}

const ACCOUNT_CARDS: { title: string; desc: string; cta?: string }[] = [
  {
    title: "Plan",
    desc: `Pro · ${used} of ${cap} used · your next invoice is 14 July`,
    cta: "Manage billing",
  },
  { title: "Profile", desc: "Your display name and photo." },
  { title: "Public profile", desc: "Your readable link and who can find you." },
  { title: "Connections", desc: `${HOST.following} hosts you follow.` },
  { title: "Password", desc: "Change the password you sign in with." },
  { title: "Delete account", desc: "Remove everything, permanently." },
];

/** THE SMALLEST FIX: /account grows a Plan card and nothing else moves. */
function AccountShape() {
  return (
    <div className="space-y-6">
      <PageHeading>Account</PageHeading>
      <div className="space-y-4">
        {ACCOUNT_CARDS.map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <CardTitle>{c.title}</CardTitle>
              <CardDescription>{c.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {c.cta ? (
                <Button variant="outline" size="sm">
                  {c.cta}
                </Button>
              ) : (
                <div className="h-9 rounded-lg border border-dashed border-border" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Your uploads and your likes stay on the dashboard; the guest list and
        the profile switch stay on each event&rsquo;s settings.
      </p>
    </div>
  );
}

export function AccountScreen({ you }: { you: You }) {
  if (you === "today") return <TodayShape />;
  if (you === "account") return <AccountShape />;
  return <YouShape />;
}
