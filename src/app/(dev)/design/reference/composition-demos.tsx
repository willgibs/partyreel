"use client";

import { useState } from "react";

import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import type { FilterValue } from "@/lib/dashboard/filters";
import type { QrStyleKey } from "@/lib/constants/qr-presets";

import { SAMPLE } from "./sample-data";
import { Spec } from "./reference-ui";

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
