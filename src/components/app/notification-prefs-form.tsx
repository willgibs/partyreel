"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import {
  setMarketingEmailAction,
  updateNotificationPrefsAction,
} from "@/app/(app)/account/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotificationPrefs } from "@/lib/social/notification-prefs";

/**
 * Account · Email preferences. The switches over notification_prefs, plus the
 * newsletter removal the privacy policy promises account holders.
 *
 * THE TIER MODEL (notification-prefs.ts, ADR-0019 point 6) is visible in what
 * is NOT here: tier 1 (sign-in codes, billing, storage and deletion warnings)
 * has no switch, because it is not a preference. The four tier-2 rows are
 * default-on with an opt-out; marketing is tier 3 and opt-in.
 *
 * ★ MARKETING OFF DOES TWO THINGS. It clears the account's own consent flag AND
 * takes the address off the newsletter list, which is the whole point: the
 * policy promises removal, so a switch that only set a flag would be a promise
 * half kept. Turning it back on never re-adds a list row.
 *
 * Optimistic, like every other switch in the app: a toggle is high-frequency
 * and instant, reverted with a toast if the save fails.
 */

type Row = {
  key: keyof NotificationPrefs;
  label: string;
  hint: string;
};

const TIER_2_ROWS: Row[] = [
  {
    key: "notifyReelReady",
    label: "Your highlight reel is ready",
    hint: "When a reel you asked for has finished rendering.",
  },
  {
    key: "notifyAlbumShared",
    label: "An album you joined was shared",
    hint: "When a host publishes an album you added photos to.",
  },
  {
    key: "notifyNewUploadsDigest",
    label: "New uploads to your events",
    hint: "A single summary, never one email per photo.",
  },
  {
    key: "notifyNewFollower",
    label: "Someone followed you",
    hint: "Only for accounts with a public profile.",
  },
];

export function NotificationPrefsForm({
  prefs,
  onNewsletterList,
}: {
  prefs: NotificationPrefs;
  /** The address is on the newsletter list, so the marketing switch reads on. */
  onNewsletterList: boolean;
}) {
  const [, startTransition] = useTransition();
  const [state, setState] = useOptimistic(
    { ...prefs, marketingOptIn: prefs.marketingOptIn || onNewsletterList },
    (current, next: Partial<NotificationPrefs>) => ({ ...current, ...next }),
  );

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    startTransition(async () => {
      setState({ [key]: value });
      const result =
        key === "marketingOptIn"
          ? await setMarketingEmailAction(value)
          : await updateNotificationPrefsAction({ [key]: value });
      if (!result.ok) {
        setState({ [key]: !value }); // revert
        toast.error(result.message);
      }
    });
  }

  function row(key: keyof NotificationPrefs, label: string, hint: string) {
    const id = `pref-${key}`;
    return (
      <li
        key={key}
        className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
      >
        <Label
          htmlFor={id}
          className="min-w-0 flex-1 cursor-pointer font-normal"
        >
          <span className="block text-sm text-foreground">{label}</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </Label>
        <Switch
          id={id}
          checked={state[key]}
          onCheckedChange={(next) => toggle(key, next)}
        />
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border/60">
        {TIER_2_ROWS.map((r) => row(r.key, r.label, r.hint))}
      </ul>

      <div className="space-y-2 border-t border-border/60 pt-5">
        <p className="text-xs font-medium text-muted-foreground">
          Product news
        </p>
        <ul className="divide-y divide-border/60">
          {row(
            "marketingOptIn",
            "Product news and occasional tips",
            "Off means we send you none, and your address comes off the list.",
          )}
        </ul>
      </div>

      {/* Truthful about tier 1: these are the emails that have no switch, and
          saying so is better than letting someone hunt for one. */}
      <p className="border-t border-border/60 pt-5 text-xs text-muted-foreground">
        Sign-in codes and account notices (billing, storage limits, and warnings
        before anything is removed) always send while you have an account. The
        Service cannot run safely without them.
      </p>
    </div>
  );
}
