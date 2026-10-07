import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Stage } from "./stage";
import { lampOf } from "@/lib/dashboard/stage";
import type { StageLive } from "@/lib/dashboard/stage-action";
import { homeContext, homeEvent } from "@/lib/dashboard/testing/home";

/**
 * THE STAGE (host-dashboard r1, `purpose=stage` and `arrivals=live`; r3, `stage=lit`), pinned as function: what
 * it draws in each phase, that before its first photograph it is lit by the event's own lamp with Settings' five
 * steps under its name, and that on its day the doorbell's answers move its photographs, its numbers and its
 * act together, through the same rules the server drew it with. Never a look.
 *
 * ★ ITS THREE SLOTS (host-dashboard r4, `chooser=words`, filled by `stage-lead.tsx`): an eyebrow before the phase word
 * in the first line, the band's own classes, and words under the plate. With none of them it is the stage it was.
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
  it("★ says a range's two days with a 'to' a reader hears, its dash kept for the eye (Q2)", () => {
    const { container } = render(
      <Stage
        event={homeEvent({
          date: "2026-10-09",
          endDate: "2026-10-11",
          ready: { opened: 0, guestsIn: 0 },
        })}
        ctx={homeContext(FRIDAY)}
        guests={null}
        photos={[]}
        share={share}
        qrToken="tok"
      />,
    );
    const range = container.querySelector("[data-range]");
    expect(range?.textContent).toContain("Friday, October 9");
    expect(
      container.querySelector("[data-range] .sr-only")?.textContent,
    ).toMatch(/to/);
  });

  it("is the event's code on its plate, Settings' five steps, and Invite then Print while nobody has opened it", () => {
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
    expect(
      screen.getByText("Not opened yet: scan it once from your phone"),
    ).toBeInTheDocument();
    expect(screen.getByText("In 7 days")).toBeInTheDocument();
    // Settings' five steps in a word each; the door, uploads and welcome stand done, the first photos and the code not.
    const rail = document.querySelector("[data-stage-rail]") as HTMLElement;
    expect(
      [...rail.querySelectorAll("li")].map((li) => [
        li.textContent?.replace(/^\d/, "").replace(/^(Done: |To do: )/, ""),
        li.hasAttribute("data-done"),
      ]),
    ).toEqual([
      ["Door", true],
      ["Uploads", true],
      ["First photos", false],
      ["Welcome", true],
      ["Code", false],
    ]);
    // The checklist's own head: a made event is ready (create-wizard r5's `arrival=done`, reshaped on purpose: it said
    // "Before guests arrive" while the code was unopened), and the rail says it, so no second tick does.
    expect(rail).toHaveTextContent(
      "Ready for guests. 2 things still worth doing.",
    );
    expect(screen.queryByText("Ready for guests")).toBeNull();
    expect(document.querySelector("[data-stage-ticks]")).toBeNull();
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

  it("says how often the code was opened once it has been", () => {
    render(
      <Stage
        event={homeEvent({
          date: "2026-10-09",
          ready: { opened: 12, guestsIn: 0 },
        })}
        ctx={homeContext(FRIDAY)}
        guests={null}
        photos={[]}
        share={share}
        qrToken="tok"
      />,
    );
    expect(screen.getByText("Opened 12 times")).toBeInTheDocument();
  });
});

describe("before its first photograph (host-dashboard r3, `stage=lit`)", () => {
  it("is lit by the event's own lamp, the same one every visit", () => {
    const { unmount } = render(
      <Stage
        event={homeEvent()}
        ctx={homeContext(FRIDAY)}
        guests={null}
        photos={[]}
        share={share}
        qrToken="tok"
      />,
    );
    const lit = document.querySelector("[data-stage-lit]") as HTMLElement;
    expect(lit.dataset.stageLit).toBe(String(lampOf("e1")));
    unmount();
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
    expect(
      (document.querySelector("[data-stage-lit]") as HTMLElement).dataset
        .stageLit,
    ).toBe(String(lampOf("e1")));
  });

  it("is drawn lit by no lamp once a photograph has landed, and keeps the ticks the photographs' stage always had", () => {
    render(
      <Stage
        event={homeEvent({
          date: "2026-10-09",
          approved: 4,
          ready: { opened: 2, guestsIn: 0 },
        })}
        ctx={homeContext(FRIDAY)}
        guests={null}
        photos={photos(3)}
        share={share}
        qrToken="tok"
      />,
    );
    expect(document.querySelector("[data-stage-lit]")).toBeNull();
    expect(document.querySelector("[data-stage-rail]")).toBeNull();
    expect(document.querySelector("[data-stage-ticks]")).not.toBeNull();
  });

  it("keeps a party's own numbers on its day, where readiness was not asked, and the lamp until the first lands", () => {
    render(
      <Stage
        event={homeEvent({ date: FRIDAY, approved: 0, ready: null })}
        ctx={homeContext(FRIDAY)}
        guests={0}
        photos={[]}
        share={share}
        qrToken="tok"
      />,
    );
    expect(document.querySelector("[data-stage-lit]")).not.toBeNull();
    expect(document.querySelector("[data-stage-rail]")).toBeNull();
    expect(document.querySelector("[data-stage-numbers]")).toHaveTextContent(
      "in the album",
    );
    // Nothing was read of the code's opens, so nothing is said of them.
    expect(screen.queryByText(/opened/i)).toBeNull();
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

  it("★ marks what waits on her with the needs-you status beside its label, and leaves every figure the stage's white", () => {
    render(
      <Stage
        event={{ ...tonight, pending: 105, waiting: 2 }}
        ctx={homeContext(FRIDAY, { evening: true })}
        guests={23}
        photos={photos(9)}
        share={share}
        qrToken="tok"
      />,
    );
    const numbers = document.querySelector("[data-stage-numbers]");
    const term = (label: string) =>
      [...(numbers?.querySelectorAll("dt") ?? [])].find(
        (dt) => dt.textContent === label,
      );
    // The one status a count that waits on her wears everywhere (`--needs-you`), never the amber it wore before.
    expect(term("at the door")?.innerHTML).toContain("bg-(--needs-you)");
    expect(term("to review")?.innerHTML).toContain("bg-(--needs-you)");
    expect(term("in the album")?.innerHTML).not.toContain("needs-you");
    expect(numbers?.innerHTML).not.toContain("warning");
    for (const figure of numbers?.querySelectorAll("dd") ?? [])
      expect(figure.className).toContain("text-white");
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

describe("its slots (host-dashboard r4, `chooser=words`)", () => {
  const draw = (extra: Partial<React.ComponentProps<typeof Stage>> = {}) =>
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
        {...extra}
      />,
    );

  it("stands an eyebrow in the first line, before the phase word, which keeps a hook of its own", () => {
    draw({ eyebrow: <button type="button">Your newest</button> });
    const line = document.querySelector("[data-stage-word]") as HTMLElement;
    const children = [...line.children].map((el) => el.textContent);
    expect(children[0]).toBe("Your newest");
    const phase = line.querySelector("[data-stage-phase]") as HTMLElement;
    expect(phase.textContent).toBe("In 7 days");
    expect(line.textContent).toBe("Your newestIn 7 days");
  });

  it("draws the first line exactly as it was without one: the phase word alone, hooked", () => {
    draw();
    const line = document.querySelector("[data-stage-word]") as HTMLElement;
    expect(line.textContent).toBe("In 7 days");
    expect(line.querySelector("[data-stage-phase]")?.textContent).toBe(
      "In 7 days",
    );
  });

  it("adds the band's own classes after its own", () => {
    draw({ className: "sl-turned" });
    const band = document.querySelector("[data-stage]") as HTMLElement;
    expect(band.classList.contains("sl-turned")).toBe(true);
    // Its own look is untouched.
    expect(band.classList.contains("bg-gallery")).toBe(true);
    expect(band.classList.contains("rounded-2xl")).toBe(true);
  });

  it("puts words under the plate in place of how often the code was opened", () => {
    draw({ plateCaption: "Our Engagement Party · photos Sep 26" });
    expect(
      screen.getByText("Our Engagement Party · photos Sep 26"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Not opened yet: scan it once from your phone"),
    ).toBeNull();
  });

  it("says how often the code was opened when no words stand under it", () => {
    draw();
    expect(
      screen.getByText("Not opened yet: scan it once from your phone"),
    ).toBeInTheDocument();
  });
});
