import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ClaimEventResult,
  DisownEventResult,
} from "@/app/(app)/dashboard/claims-actions";
import type { ClaimableEvent } from "@/lib/db/queries/claims";

import { SETTLE_MS } from "./claims-card";
import { ClaimsReview } from "./claims-review";

/**
 * THE CLAIMS REVIEW AS WILL ANSWERED IT (`identity-claims` r1 and r2, 2026-09-27), pinned on the
 * real component with its two writes stubbed: the banner that opens it (it never opens by itself),
 * one event at a time, a Claim written at once for that one event, the double tap that claims one,
 * Not mine's dialog at its card, closing early keeping what she did, the toast's one pointer, and
 * Open album with the quieter Follow on a claimed row.
 */

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const event = (
  id: string,
  name: string,
  uploadCount: number,
  over: Partial<ClaimableEvent> = {},
): ClaimableEvent => ({
  eventId: id,
  eventName: name,
  eventDate: "2026-08-29",
  names: ["Priya"],
  uploadCount,
  lastUploadAt: "2026-08-29T22:40:00Z",
  gate: null,
  previews: [`https://r2.test/${id}`],
  ...over,
});

const TOMS = event("toms", "Tom's Leaving Do", 4);
const BONFIRE = event("bonfire", "Beach Bonfire", 2);
const ANAS = event("anas", "Ana's 30th", 3, {
  eventDate: null,
  gate: "password",
  previews: [],
});
const QUIZ = event("quiz", "Quiz Night", 2);
const FOUR = [TOMS, BONFIRE, ANAS, QUIZ];

/** A write the test lands by hand, so what shows while it is in flight can be read. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const CLAIMED: ClaimEventResult = { ok: true, next: null };
const DISOWNED: DisownEventResult = { ok: true };

function mount({
  rows = FOUR,
  claim = vi.fn(async (): Promise<ClaimEventResult> => CLAIMED),
  disown = vi.fn(async (): Promise<DisownEventResult> => DISOWNED),
  invitesOnceSorted = false,
}: {
  rows?: ClaimableEvent[];
  claim?: (id: string) => Promise<ClaimEventResult>;
  disown?: (id: string) => Promise<DisownEventResult>;
  invitesOnceSorted?: boolean;
} = {}) {
  const view = render(
    <ClaimsReview
      rows={rows}
      pageHref="/account/profile"
      invitesOnceSorted={invitesOnceSorted}
      claim={claim}
      disown={disown}
    />,
  );
  const rerender = (next: ClaimableEvent[]) =>
    view.rerender(
      <ClaimsReview
        rows={next}
        pageHref="/account/profile"
        invitesOnceSorted={invitesOnceSorted}
        claim={claim}
        disown={disown}
      />,
    );
  return { ...view, claim, disown, rerender };
}

const panel = () =>
  screen.getByRole("dialog", { name: "Photos waiting for you" });
const topCard = () =>
  document.querySelector<HTMLElement>("[data-claim-card]")?.dataset.claimCard ??
  null;
const progress = () =>
  document.querySelector("[data-claims-progress]")?.textContent ?? null;

function openReview() {
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  return panel();
}

async function pressClaim() {
  fireEvent.click(within(panel()).getByRole("button", { name: "Claim" }));
}

/** Waits out an arriving card's hold on its answers. */
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, SETTLE_MS + 20));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the banner", () => {
  it("renders nothing when nothing waits", () => {
    const { container } = mount({ rows: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it("says what waits in one line, and the review opens only when she asks", () => {
    mount();
    expect(
      screen.getByText("11 photos from 4 events are waiting for you"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    openReview();
    expect(progress()).toBe("1 of 4");
    expect(topCard()).toBe("toms");
  });
});

describe("one event at a time, each saved as she decides", () => {
  it("★ writes a Claim at once for that one event, and brings the next card up once it lands", async () => {
    const write = deferred<ClaimEventResult>();
    const { claim } = mount({ claim: vi.fn(() => write.promise) });
    openReview();
    await pressClaim();
    expect(claim).toHaveBeenCalledWith("toms");
    // The card waits for its write.
    expect(topCard()).toBe("toms");
    await act(async () => write.resolve(CLAIMED));
    expect(topCard()).toBe("bonfire");
    expect(progress()).toBe("2 of 4");
    expect(refresh).toHaveBeenCalled();
    const decided = document.querySelector("[data-claims-decided='claim']");
    expect(decided?.textContent).toContain("Tom's Leaving Do");
    expect(decided?.textContent).toContain("4\u00a0photos added");
    expect(screen.getByText("Decided, saved as you go")).toBeInTheDocument();
  });

  it("★ a double tap claims one event, and the card that comes up holds its answers for a beat", async () => {
    const write = deferred<ClaimEventResult>();
    const claim = vi.fn((id: string) =>
      id === "toms" ? write.promise : Promise.resolve(CLAIMED),
    );
    mount({ claim });
    openReview();
    await pressClaim();
    await pressClaim();
    expect(claim).toHaveBeenCalledTimes(1);
    await act(async () => write.resolve(CLAIMED));
    expect(topCard()).toBe("bonfire");
    // A tap that lands on the arriving card is dropped...
    await pressClaim();
    expect(claim).toHaveBeenCalledTimes(1);
    // ...and once it has settled, it answers for itself.
    await settle();
    await pressClaim();
    expect(claim).toHaveBeenLastCalledWith("bonfire");
  });

  it("keeps her decisions and the card on top when the page refreshes behind the review", async () => {
    const { rerender } = mount();
    openReview();
    await pressClaim();
    await waitFor(() => expect(topCard()).toBe("bonfire"));
    // The refresh after the write: Tom's no longer waits on the server.
    rerender([BONFIRE, ANAS, QUIZ]);
    expect(topCard()).toBe("bonfire");
    expect(progress()).toBe("2 of 4");
    expect(
      document.querySelector("[data-claims-decided='claim']")?.textContent,
    ).toContain("Tom's Leaving Do");
  });

  it("a failed write keeps the card and says why", async () => {
    const claim = vi.fn(
      async (): Promise<ClaimEventResult> => ({
        ok: false,
        gone: false,
        message: "Couldn't claim those photos. Please try again.",
      }),
    );
    mount({ claim });
    openReview();
    await pressClaim();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't claim those photos. Please try again.",
      ),
    );
    expect(topCard()).toBe("toms");
    await pressClaim();
    expect(claim).toHaveBeenCalledTimes(2);
  });

  it("an event that stopped waiting leaves the stack with a word, decided by nobody here", async () => {
    const claim = vi.fn(
      async (): Promise<ClaimEventResult> => ({
        ok: false,
        gone: true,
        message: "That event isn't waiting for you anymore.",
      }),
    );
    mount({ claim });
    openReview();
    await pressClaim();
    await waitFor(() => expect(topCard()).toBe("bonfire"));
    expect(toast).toHaveBeenCalledWith(
      "Tom's Leaving Do isn't waiting for you anymore.",
    );
    expect(document.querySelector("[data-claims-decided]")).toBeNull();
    expect(progress()).toBe("1 of 3");
  });
});

describe("★ Not mine asks at its own card", () => {
  it("opens the dialog for that event, and Delete deletes that one event", async () => {
    const { disown } = mount();
    openReview();
    fireEvent.click(within(panel()).getByRole("button", { name: "Not mine" }));
    const dialog = screen.getByRole("dialog", {
      name: "Permanently delete the 4 photos and videos added under your email at this event?",
    });
    expect(within(dialog).getByText("Tom's Leaving Do")).toBeInTheDocument();
    expect(disown).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(disown).toHaveBeenCalledWith("toms");
    await waitFor(() => expect(topCard()).toBe("bonfire"));
    expect(
      screen.queryByRole("dialog", { name: /Permanently delete/ }),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector("[data-claims-decided='disown']")?.textContent,
    ).toContain("4\u00a0photos deleted");
  });

  it("Go back writes nothing and leaves the card where it was", () => {
    const { disown } = mount();
    openReview();
    fireEvent.click(within(panel()).getByRole("button", { name: "Not mine" }));
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(disown).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: /Permanently delete/ }),
    ).not.toBeInTheDocument();
    expect(topCard()).toBe("toms");
  });
});

describe("closing early keeps what she did", () => {
  it("toasts what this opening added once, and the banner counts the rest as still waiting", async () => {
    mount();
    openReview();
    await pressClaim();
    await waitFor(() => expect(topCard()).toBe("bonfire"));
    fireEvent.keyDown(panel(), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      "Added 4\u00a0photos to your account.",
      expect.objectContaining({ description: expect.anything() }),
    );
    expect(
      screen.getByText("7 photos from 3 events are still waiting for you"),
    ).toBeInTheDocument();
  });

  it("says nothing on closing when nothing was added", async () => {
    mount();
    openReview();
    fireEvent.keyDown(panel(), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});

/**
 * ONE POINTER TO HER PAGE A BEAT: the page's invitation takes the banner's place once nothing
 * waits, so the toast leaves its page line to it then, and carries it everywhere else.
 */
describe("the toast's page line", () => {
  function lastDescription() {
    const calls = vi.mocked(toast.success).mock.calls;
    return (calls.at(-1)?.[1] as { description?: unknown } | undefined)
      ?.description;
  }

  async function claimTheOneAndFinish(invitesOnceSorted: boolean) {
    mount({ rows: [TOMS], invitesOnceSorted });
    openReview();
    await pressClaim();
    await waitFor(() =>
      expect(screen.getByText("All sorted")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("4 photos from 1 event are in your account now."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  }

  it("yields to the invitation that is about to stand in the banner's place", async () => {
    await claimTheOneAndFinish(true);
    expect(lastDescription()).toBeUndefined();
  });

  it("points at her page where no invitation will stand", async () => {
    await claimTheOneAndFinish(false);
    render(<>{lastDescription() as React.ReactNode}</>);
    expect(
      screen.getByRole("link", { name: "Choose what shows on your page" }),
    ).toHaveAttribute("href", "/account/profile");
  });
});

describe("what a claimed event offers next (`next=both`)", () => {
  it("offers Open album, and the quieter Follow where the host has a page", async () => {
    const claim = vi.fn(
      async (): Promise<ClaimEventResult> => ({
        ok: true,
        next: {
          href: "/e/tok-toms",
          host: { id: "host-tom", slug: "tom", name: "Tom", following: false },
        },
      }),
    );
    mount({ claim });
    openReview();
    await pressClaim();
    await waitFor(() => expect(topCard()).toBe("bonfire"));
    const row = document.querySelector<HTMLElement>(
      "[data-claims-decided='claim']",
    )!;
    expect(
      within(row).getByRole("link", { name: "Open album" }),
    ).toHaveAttribute("href", "/e/tok-toms");
    const follow = within(row).getByRole("button", { name: "Follow Tom" });
    expect(follow).toHaveAttribute("data-variant", "ghost");
  });

  it("offers neither for an album the host made private", async () => {
    const claim = vi.fn(
      async (): Promise<ClaimEventResult> => ({
        ok: true,
        next: { href: null, host: null },
      }),
    );
    mount({ claim });
    openReview();
    await pressClaim();
    await waitFor(() => expect(topCard()).toBe("bonfire"));
    const row = document.querySelector<HTMLElement>(
      "[data-claims-decided='claim']",
    )!;
    expect(within(row).queryByRole("link")).toBeNull();
    expect(within(row).queryByRole("button")).toBeNull();
  });
});
