"use client";

import { useState } from "react";

import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { ReviewSection } from "@/components/app/event-feed/review-section";
import { useReviewTriage } from "@/components/app/event-feed/use-review-triage";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import type { FilterValue } from "@/lib/dashboard/filters";

import { SAMPLE, SAMPLE_MEDIA } from "../reference/sample-data";

// A pending set for the review-surface probe (force pending + unique ids to fill the queue).
const SAMPLE_PENDING = [...SAMPLE_MEDIA, ...SAMPLE_MEDIA].map((m, i) => ({
  ...m,
  id: `pending-${i}`,
  status: "pending" as const,
}));

/**
 * The CONTROLLED product components for the Compositions gallery: the ones that
 * take an onChange handler or a hook, so they need client state to be live.
 * Everything else in the family renders from static sample props in
 * gallery-demos.tsx.
 *
 * Each demo returns bare content now (the gallery round, 2026-09-12): the Stage
 * supplies the frame, the label and the light-and-dark split, and the specimen
 * that mounts the demo carries its label and hint.
 */

export function FilterChipsDemo() {
  const [active, setActive] = useState<FilterValue>("all");
  return <FilterChips active={active} onChange={setActive} trashCount={3} />;
}

export function QrPresetPickerDemo() {
  const [value, setValue] = useState<QrStyleKey>("classic");
  return (
    <QrPresetPicker
      value={value}
      onChange={setValue}
      joinUrl={SAMPLE.joinUrl}
    />
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
    <ReviewSection
      triage={triage}
      onEnableModeration={() => {}}
      enabling={false}
    />
  );
}
