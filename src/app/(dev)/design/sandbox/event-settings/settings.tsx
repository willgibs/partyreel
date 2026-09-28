"use client";

import { EVENT } from "./fixtures";
import { Hub } from "./hub";
import { PopupQuote } from "./kinds";
import type { Model } from "./model";
import type { ScreenId } from "./screens";
import {
  GroupsPanel,
  PresetsPanel,
  SentencesPanel,
  summaryHead,
  SummaryPanel,
} from "./structures";
import { TodayPanel } from "./today";

/**
 * SETTINGS IN ITS KIND, OVER THE HUB (`event-settings-sheet.tsx`: `PopupContent
 * kind="settings" routed`): his unfocused panel beside the album at a desk, the
 * album it governs under the scrim, and in a hand the whole screen under a back
 * arrow that names the event, the hub gone behind it. The head is
 * production's (Settings, the event's name under it); one level into the
 * summary it becomes the group's, its back naming Settings (`kinds.tsx`'s
 * `up`). The body is whichever structure the model names.
 */
export function SettingsView({ m, screen }: { m: Model; screen: ScreenId }) {
  const head = summaryHead(m);
  const body =
    m.structure === "today" ? (
      <TodayPanel m={m} />
    ) : m.structure === "groups" ? (
      <GroupsPanel m={m} />
    ) : m.structure === "sentences" ? (
      <SentencesPanel m={m} screen={screen} />
    ) : m.structure === "presets" ? (
      <PresetsPanel m={m} />
    ) : (
      <SummaryPanel m={m} />
    );
  const panel = (
    <PopupQuote
      kind="settings"
      screen={screen}
      title={head.title}
      description={head.up ? undefined : EVENT.name}
      back={EVENT.name}
      up={head.up}
      bodyClassName="flex flex-col gap-6 pb-6"
    >
      {body}
    </PopupQuote>
  );
  if (screen === "1440")
    return <Hub screen={screen} paused={!m.uploads} overlay={panel} />;
  return <div className="min-h-full bg-background">{panel}</div>;
}
