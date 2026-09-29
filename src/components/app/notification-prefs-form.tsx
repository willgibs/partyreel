"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import {
  setMarketingEmailAction,
  updateNotificationPrefsAction,
} from "@/app/(app)/account/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PASS_REMINDERS_ANCHOR } from "@/lib/email/links";
import type { NotificationPrefs } from "@/lib/social/notification-prefs";

/**
 * Account · Email preferences. The switches over notification_prefs, plus the
 * newsletter removal the privacy policy promises account holders.
 *
 * THE TIER MODEL (notification-prefs.ts, profiles-social.md point 6) is visible in what
 * is NOT here: tier 1 (sign-in codes, billing, storage and deletion warnings)
 * has no switch, because it is not a preference. The tier-2 rows are
 * default-on with an opt-out; marketing is tier 3 and opt-in.
 *
 * ★ EVERY SWITCH HERE GOVERNS A MAIL THAT SENDS (Will, `emails` r1). Event Pass reminders is the
 * renewal nudge's, and the nudge's unsubscribe lands on this very row (`PASS_REMINDERS_ANCHOR`). The
 * three switches for mail nothing sent (an album shared, a digest of uploads, a new follower) left,
 * because a dead switch is ruled absent, never drawn; their columns wait on Will's yes to drop.
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
  /** The row's own address, for a mail that links straight to its switch. */
  anchor?: string;
};

const TIER_2_ROWS: Row[] = [
  {
    key: "notifyPassRenewal",
    label: "Event Pass reminders",
    hint: "A note two weeks before your Event Pass expires, so you can renew it.",
    anchor: PASS_REMINDERS_ANCHOR,
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

  function row(
    key: keyof NotificationPrefs,
    label: string,
    hint: string,
    anchor?: string,
  ) {
    const id = `pref-${key}`;
    return (
      <li
        key={key}
        id={anchor}
        // A mail's link lands the row just under the page's top edge, as the Plan card's own
        // anchor does.
        className="flex scroll-mt-6 items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
      >
        {/* `flex-col items-start`: Label is a flex ROW by default, which set the hint beside the
            name and wrapped the name into a three-line column at a phone's width. Stacked, as the
            event settings' switch rows (profile-social-card.tsx) draw the same pair. */}
        <Label
          htmlFor={id}
          className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
        >
          <span className="text-sm text-foreground">{label}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            {hint}
          </span>
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
        {TIER_2_ROWS.map((r) => row(r.key, r.label, r.hint, r.anchor))}
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
