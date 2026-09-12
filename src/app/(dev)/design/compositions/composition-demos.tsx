"use client";

import { useState } from "react";

import { ReviewSection } from "@/components/app/event-feed/review-section";
import { useReviewTriage } from "@/components/app/event-feed/use-review-triage";
import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import type { FilterValue } from "@/lib/dashboard/filters";
import type { QrStyleKey } from "@/lib/constants/qr-presets";

import { SAMPLE, SAMPLE_MEDIA } from "../reference/sample-data";
import { Spec } from "../reference/reference-ui";

// A pending set for the review-surface probe (force pending + unique ids to fill the queue).
const SAMPLE_PENDING = [...SAMPLE_MEDIA, ...SAMPLE_MEDIA].map((m, i) => ({
  ...m,
  id: `pending-${i}`,
  status: "pending" as const,
}));

/**
 * The CONTROLLED product components for the Compositions reference: the two that
 * take an onChange handler, so they need client state to be live. Everything else
 * on the page renders from static sample props in the server page.
 */

export function FilterChipsDemo() {
  const [active, setActive] = useState<FilterValue>("all");
  return (
    <Spec label="Filter chips" hint="dashboard · controlled">
      <FilterChips active={active} onChange={setActive} trashCount={3} />
    </Spec>
  );
}

export function QrPresetPickerDemo() {
  const [value, setValue] = useState<QrStyleKey>("classic");
  return (
    <Spec label="QR preset picker" hint="share · live styled QR">
      <QrPresetPicker value={value} onChange={setValue} joinUrl={SAMPLE.joinUrl} />
    </Spec>
  );
}

// The inline review section (the event feed's triage surface that replaced the pop-up takeover):
// a hydration probe for the review island + its select mode. The bulk approve/hide need auth, so
// they no-op (revert + toast) here; the value is the rendered grid + the select-mode choreography.
export function ReviewSectionDemo() {
  const triage = useReviewTriage({
    eventId: "demo",
    items: SAMPLE_PENDING,
    moderationOn: true,
  });
  return (
    <Spec label="Review section" hint="inline triage · Select / Approve all">
      <ReviewSection
        triage={triage}
        onEnableModeration={() => {}}
        enabling={false}
      />
    </Spec>
  );
}
