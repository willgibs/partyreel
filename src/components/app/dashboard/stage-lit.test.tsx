import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isJustMade,
  rememberJustMade,
} from "@/components/app/create-event-wizard/just-made";
import { LampLight } from "@/components/app/dashboard/stage-lit";
import { Stage } from "@/components/app/dashboard/stage";
import { homeContext, homeEvent } from "@/lib/dashboard/testing/home";

/**
 * THE LIT STAGE'S LAMP IGNITES ONCE, AS SHE MEETS THE EVENT SHE JUST MADE (crumbs-70; host-dashboard r3 drew it igniting as
 * she lands from Create, and production's `LampLight` had no ignition). Pinned as function, never as a look: which draw
 * ignites (the one that finds Create's flag for its own event), that it ignites once and the next visit finds the lamp
 * lit, that another event's lamp never takes it, that the server never draws it (so hydration matches), and that every
 * animation utility is gated on motion being welcome, so reduced motion lands lit at once.
 */

vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: true }),
}));
vi.mock("@/lib/dashboard/stage-action", () => ({
  readStageLiveAction: vi.fn(async () => null),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
// The code draws through a canvas library and the card through a dialog: neither is this file's subject.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <span data-testid="qr" />,
}));
vi.mock("@/components/app/share/code-card", () => ({
  CodeCard: ({ trigger }: { trigger: React.ReactNode }) => trigger,
  readableLink: (url: string) => url,
}));

const share = { joinUrl: "https://partyreel.com/e/tok", qrStyle: "classic" };
const ignition = () =>
  document.querySelector<HTMLElement>("[data-lamp-ignite]");

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("the lamp's ignition", () => {
  it("ignites once for the event she just made, and spends the flag", () => {
    rememberJustMade("e1");
    const { rerender } = render(
      <LampLight lamp={2} near={false} eventId="e1" />,
    );
    expect(ignition()).not.toBeNull();
    // Spent where it played: the next draw of this stage finds nothing to ignite for.
    expect(isJustMade("e1")).toBe(false);
    // A later render (the week turning, the stage's own state) never takes the ignition back mid-play.
    rerender(<LampLight lamp={2} near eventId="e1" />);
    expect(ignition()).not.toBeNull();
  });

  it("★ is lit at once on every visit after: the flag was spent", () => {
    rememberJustMade("e1");
    const first = render(<LampLight lamp={2} near={false} eventId="e1" />);
    expect(ignition()).not.toBeNull();
    first.unmount();
    render(<LampLight lamp={2} near={false} eventId="e1" />);
    expect(ignition()).toBeNull();
  });

  it("is lit at once, with nothing to play, when Create left no flag", () => {
    render(<LampLight lamp={2} near={false} eventId="e1" />);
    expect(ignition()).toBeNull();
  });

  it("never takes another event's ignition, and leaves its flag for the stage that draws it", () => {
    rememberJustMade("e2");
    render(<LampLight lamp={2} near={false} eventId="e1" />);
    expect(ignition()).toBeNull();
    expect(isJustMade("e2")).toBe(true);
  });

  it("is lit at once for a caller that names no event (a specimen, an older draw)", () => {
    rememberJustMade("e1");
    render(<LampLight lamp={2} near={false} />);
    expect(ignition()).toBeNull();
    expect(isJustMade("e1")).toBe(true);
  });

  it("★ is never drawn by the server, which cannot see the tab, so hydration always matches", () => {
    rememberJustMade("e1");
    const html = renderToString(
      <LampLight lamp={2} near={false} eventId="e1" />,
    );
    expect(html).not.toContain("data-lamp-ignite");
    // Nothing was spent by a draw nobody saw.
    expect(isJustMade("e1")).toBe(true);
  });

  it("★ gates every animation utility on motion being welcome, so reduced motion lands lit at once", () => {
    rememberJustMade("e1");
    render(<LampLight lamp={2} near={false} eventId="e1" />);
    const moving = ignition()!
      .className.split(/\s+/)
      .filter((c) => /animate|fade-in|zoom-in|duration|ease/.test(c));
    // An ungated `animate-in` would play for a reader who asked for none, and a held-at-zero state is no landing.
    expect(moving.length).toBeGreaterThan(0);
    expect(moving.filter((c) => !c.startsWith("motion-safe:"))).toEqual([]);
  });
});

describe("through the stage", () => {
  const draw = (photos: { id: string; url: string }[]) =>
    render(
      <Stage
        event={homeEvent()}
        ctx={homeContext("2026-10-02")}
        guests={null}
        photos={photos}
        share={share}
        qrToken="tok"
      />,
    );

  it("lights the event she just made when its stage has no photograph yet", () => {
    rememberJustMade("e1");
    draw([]);
    expect(screen.getByTestId("qr")).toBeInTheDocument();
    expect(ignition()).not.toBeNull();
    expect(isJustMade("e1")).toBe(false);
  });

  it("leaves the flag for the day the event is lit, when a photograph already leads", () => {
    rememberJustMade("e1");
    draw([{ id: "m1", url: "https://r2.test/m1.webp" }]);
    expect(ignition()).toBeNull();
    expect(document.querySelector("[data-stage-lit]")).toBeNull();
    expect(isJustMade("e1")).toBe(true);
  });
});
