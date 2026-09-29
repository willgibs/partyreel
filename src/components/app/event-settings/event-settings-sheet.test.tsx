/**
 * THE SETTINGS SHEET KEEPS EVERY CARD WHOLE, AND THE DANGER ZONE LAST (build 17's red-team).
 *
 * The body is the popup's scroller. Laid out as a flex column it shrank its children to fit, and a
 * Card clips (`overflow-hidden`), which zeroes a flex item's automatic minimum height: the Highlight
 * reel, Profile and Danger zone cards were crushed to their 32px of padding at 1440 and 375, and
 * Delete event, whose only home is the last of them, could not be reached. jsdom lays nothing out,
 * so the pin is the one layout fact that decides it: the body is never a flex column that lets its
 * children shrink. The picture itself is the Handoff's, at both widths.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HostEvent } from "@/lib/db/queries/events";

// The four sections, as markers: what is pinned is the frame around them, never their contents.
vi.mock("@/components/app/event-settings-form", () => ({
  EventSettingsForm: () => <form aria-label="Event details" />,
}));
vi.mock("@/components/app/event-settings/highlight-reel-card", () => ({
  HighlightReelCard: () => <section aria-label="Highlight reel" />,
}));
vi.mock("@/components/app/event-settings/profile-social-card", () => ({
  ProfileSocialCard: () => <section aria-label="Profile" />,
}));
vi.mock("@/components/app/event-settings/danger-zone-section", () => ({
  DangerZoneSection: () => <section aria-label="Danger zone" />,
}));

const { EventSettingsSheet } = await import("./event-settings-sheet");

const EVENT = {
  id: "11111111-2222-4333-8444-555555555555",
  name: "Maya's 30th",
  show_reel: true,
  reel_style_id: null,
  reel_hold_sec: null,
} as unknown as HostEvent;

function sheet() {
  render(
    <EventSettingsSheet
      open
      onOpenChange={() => {}}
      event={EVENT}
      tier="pro"
      pendingCount={0}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={null}
    />,
  );
  const body = document.querySelector<HTMLElement>('[data-slot="popup-body"]');
  expect(body, "the sheet's body").not.toBeNull();
  return body!;
}

/** Does this element lay its children out as a flex column that lets them shrink? */
function shrinksItsChildren(el: HTMLElement): boolean {
  const classes = el.className.split(/\s+/);
  const column =
    classes.includes("flex") &&
    (classes.includes("flex-col") || classes.includes("flex-col-reverse"));
  return column && !classes.includes("*:shrink-0");
}

describe("the event settings sheet", () => {
  it("★ never lets its scroller shrink a card to fit", () => {
    expect(shrinksItsChildren(sheet())).toBe(false);
  });

  it("holds the form, then the reel, then the profile, and the Danger zone last", () => {
    const body = sheet();
    const order = [
      screen.getByRole("form", { name: "Event details" }),
      screen.getByRole("region", { name: "Highlight reel" }),
      screen.getByRole("region", { name: "Profile" }),
      screen.getByRole("region", { name: "Danger zone" }),
    ];
    for (const part of order) expect(part.parentElement).toBe(body);
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1].compareDocumentPosition(order[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(body.lastElementChild).toBe(order[3]);
  });
});
