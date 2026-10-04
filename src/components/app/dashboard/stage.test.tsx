import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Stage } from "./stage";
import type { StageLive } from "@/lib/dashboard/stage-action";
import { homeContext, homeEvent } from "@/lib/dashboard/testing/home";

/**
 * THE STAGE (host-dashboard r1, `purpose=stage` and `arrivals=live`), pinned as function: what it draws
 * in each phase, and that on its day the doorbell's answers move its photographs, its numbers and its
 * act together, through the same rules the server drew it with. Never a look.
 */

const doorbell = vi.hoisted(() => ({
  enabled: false,
  ring: null as null | (() => void),
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: (o: { enabled: boolean; onRefresh: () => void }) => {
    doorbell.enabled = o.enabled;
    doorbell.ring = o.onRefresh;
    return { live: true };
  },
}));
const answer = vi.hoisted(() => ({ next: null as StageLive | null }));
vi.mock("@/lib/dashboard/stage-action", () => ({
  readStageLiveAction: vi.fn(async () => answer.next),
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

const FRIDAY = "2026-10-02";
const share = { joinUrl: "https://partyreel.com/e/tok", qrStyle: "classic" };
const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `m${i}`,
    url: `https://r2.test/m${i}.webp`,
  }));

beforeEach(() => {
  doorbell.enabled = false;
  doorbell.ring = null;
  answer.next = null;
});

describe("before the day", () => {
  it("is the event's code on its plate, its ticks, and Invite then Print while nobody has opened it", () => {
    render(
      <Stage
        event={homeEvent({
          date: "2026-10-09",
          ready: { opened: 0, guestsIn: 0 },
        })}
        ctx={homeContext(FRIDAY)}
        guests={null}
        photos={[]}
        share={share}
        qrToken="tok"
      />,
    );
    expect(screen.getByTestId("qr")).toBeInTheDocument();
    expect(screen.getByText("Never opened")).toBeInTheDocument();
    expect(screen.getByText("In 7 days")).toBeInTheDocument();
    expect(document.querySelector("[data-stage-ticks]")?.textContent).toContain(
      "Code",
    );
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Print" })).toHaveAttribute(
      "href",
      "/dashboard/e1/print",
    );
    // Not its day: the doorbell is not heard.
    expect(doorbell.enabled).toBe(false);
  });

  it("asks an undated event for its date, under its name", () => {
    render(
      <Stage
        event={homeEvent()}
        ctx={homeContext(FRIDAY)}
        guests={null}
        photos={[]}
        share={share}
        qrToken="tok"
      />,
    );
    expect(screen.getByText("No date yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add the date" })).toHaveAttribute(
      "href",
      "/dashboard/e1?room=settings&setting=event",
    );
  });
});

describe("on its day", () => {
  const tonight = homeEvent({
    date: FRIDAY,
    approved: 142,
    playable: 2,
    arrivals: { today: 142, lastHour: 31 },
  });

  it("is the live wall once nine have landed, the newest marked, and its numbers", () => {
    render(
      <Stage
        event={tonight}
        ctx={homeContext(FRIDAY, { evening: true })}
        guests={23}
        photos={photos(9)}
        share={share}
        qrToken="tok"
      />,
    );
    expect(document.querySelector("[data-stage-wall]")).toHaveAttribute(
      "data-stage-wall",
      "9",
    );
    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("Live tonight")).toBeInTheDocument();
    expect(screen.getByText("· 31 in the last hour")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(doorbell.enabled).toBe(true);
  });

  it("stands calm until a wall's worth has landed", () => {
    render(
      <Stage
        event={tonight}
        ctx={homeContext(FRIDAY)}
        guests={23}
        photos={photos(3)}
        share={share}
        qrToken="tok"
      />,
    );
    expect(document.querySelector("[data-stage-wall]")).toBeNull();
    expect(document.querySelector("[data-stage-calm]")).not.toBeNull();
  });

  it("★ moves its photographs, its numbers and its act together on the doorbell's answer", async () => {
    render(
      <Stage
        event={tonight}
        ctx={homeContext(FRIDAY, { evening: true })}
        guests={23}
        photos={photos(9)}
        share={share}
        qrToken="tok"
      />,
    );
    expect(screen.getByRole("link", { name: "Open" })).toBeInTheDocument();

    answer.next = {
      photos: [{ id: "new", url: "https://r2.test/new.webp" }, ...photos(8)],
      approved: 143,
      pending: 0,
      waiting: 2,
      lastHour: 32,
    };
    await act(async () => {
      doorbell.ring?.();
    });

    expect(screen.getByText("143")).toBeInTheDocument();
    expect(screen.getByText("· 32 in the last hour")).toBeInTheDocument();
    // Two at the door: the stage's act is now letting them in.
    // Its Guests room stands over the hub (event-header r2, `rooms=over`), At the door its first section.
    expect(screen.getByRole("link", { name: "Let 2 in" })).toHaveAttribute(
      "href",
      "/dashboard/e1?room=guests",
    );
    const first = document.querySelector("[data-stage-wall] li img");
    expect(first?.getAttribute("src")).toBe("https://r2.test/new.webp");
  });

  it("starts from the server's own facts again when the server draws it anew", async () => {
    const { rerender } = render(
      <Stage
        event={tonight}
        ctx={homeContext(FRIDAY)}
        guests={23}
        photos={photos(9)}
        share={share}
        qrToken="tok"
      />,
    );
    answer.next = {
      photos: photos(9),
      approved: 150,
      pending: 0,
      waiting: 0,
      lastHour: 40,
    };
    await act(async () => {
      doorbell.ring?.();
    });
    expect(screen.getByText("150")).toBeInTheDocument();
    rerender(
      <Stage
        event={{ ...tonight, approved: 160 }}
        ctx={homeContext(FRIDAY)}
        guests={23}
        photos={photos(9)}
        share={share}
        qrToken="tok"
      />,
    );
    expect(screen.getByText("160")).toBeInTheDocument();
  });
});
