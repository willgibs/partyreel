"use client";

import { useState } from "react";

import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { LOCKED_FEATURES } from "@/components/app/pricing/triggers";
import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { SwitchSetting } from "@/components/app/event-settings/settings-furniture";
import { Dormant } from "@/components/ui/dormant";
import { UploadCapSelect } from "@/components/app/event-settings/upload-cap-select";
import { trackAttrs } from "@/lib/analytics/events";
import { TIER_NAMES } from "@/lib/constants/tiers";

/**
 * VIDEOS, A SWITCH (event-settings r1, Will `lock=switch`: "We want free hosts to *know* they're
 * missing out on videos so they upgrade, not hide that loss. However, this should have a disabled
 * state so it's more clear they can't use it on free").
 *
 * On a plan that takes video (Event Pass, Pro) it is a switch like the rest, so a host can keep an
 * album to photos; it writes `allow_videos`, which the upload's gate and the guest's picker both read.
 * The size cap stands under it, dormant while videos are off (its smallest step is 25 MB, so it caps
 * nothing a photo reaches: the board's carried `size-cap`).
 *
 * ★ ON FREE IT IS THE LOCK ITSELF, AND LOCKCHIP LEAVES THIS ROW. Drawn off, in the switch's disabled
 * look with the Pro mark, and still a control: pressing it opens the plans, led by videos (the one
 * record in `triggers.ts` words it, so the lock says here what the chip says everywhere else). The
 * element is a real button whose name says all of it, the switch inside only its picture. It claims no
 * entitlement: the plans sheet re-resolves the plan on the server (billing-caps.md).
 */
export function VideosSwitch() {
  const s = useSettings();
  const [plansOpen, setPlansOpen] = useState(false);
  const { why } = LOCKED_FEATURES.video;

  if (!s.videosOnPlan) {
    return (
      <div data-videos-switch="locked" className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            <p className="flex items-center gap-2 text-sm font-medium">
              Videos
              <span className="rounded-full border border-border px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                {TIER_NAMES.pro}
              </span>
            </p>
            <p className="text-caption text-pretty text-muted-foreground">
              {why}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlansOpen(true)}
            aria-label={`Videos, on ${TIER_NAMES.pro}. See plans.`}
            className="relative flex shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            {...trackAttrs("cta_click", {
              cta: "lock-switch",
              location: "video",
            })}
          >
            {/* The switch's own picture, off and in its disabled look, drawn rather than mounted: a
                Radix switch is a button, and a button inside this one is no control at all. */}
            <span
              aria-hidden
              data-slot="switch-picture"
              className="pointer-events-none inline-flex h-[18.4px] w-[32px] shrink-0 items-center rounded-full border border-transparent bg-input opacity-50 dark:bg-input/80"
            >
              <span className="block size-4 rounded-full bg-background dark:bg-foreground" />
            </span>
          </button>
        </div>
        {/* What videos would wake, still in view (the dormant setting, never hidden). */}
        <Dormant
          className="mt-3"
          awake={false}
          summary="Max size per upload, once videos are on."
        >
          {null}
        </Dormant>
        <PricingSheet
          open={plansOpen}
          onOpenChange={setPlansOpen}
          trigger={{ kind: "locked", feature: "video" }}
          plan={{ tier: "free", hasBilling: false }}
          returnTo={settingsPageHref(s.eventId, "adds")}
        />
      </div>
    );
  }

  const on = s.values.allowVideos;
  return (
    <SwitchSetting
      label="Videos"
      line="Guests add videos as well as photos."
      checked={on}
      onCheckedChange={(next) => void s.saveEvent({ allowVideos: next })}
      after={
        <Dormant awake={on} summary="Max size per upload, once videos are on.">
          <UploadCapSelect />
        </Dormant>
      }
    />
  );
}
