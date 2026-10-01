import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ClaimableEvent } from "@/lib/db/queries/claims";

/**
 * ★ THE PAGE BEHIND FOLLOWS THE LAYOUT'S CLAIM, WHOEVER MOUNTS FIRST (crumbs-40, build 35's red-team: crumbs-35's
 * fix did not hold). A guest typed his address at a names-only door and uploaded; he signed in and opened
 * /dashboard: the toast said the claim moved his photo, but the banner and Review's Claim went on offering the row
 * SQL showed was his, and his Guest card was missing, until a reload. The claims review listened for the claim, and
 * the review lives in the page segment, which streams in behind `dashboard/loading.tsx` after the (app) layout whose
 * claim had already landed: a soft navigation (the claim at +0.8 s, the banner at +2.8 s) and a hard load after
 * sign-in (the claim before the document had even finished) both missed it, and the claim keeps no last result for a
 * late listener. So the refresh is the claim's own: the layout's component, mounted before its claim can land, asks
 * for it once a claim it ran moved uploads, in either order, and once.
 *
 * Pinned on the real claim (`claim-uploads.ts`, its RPC stubbed) and the real review, so the order is the one the
 * product mounts in.
 */

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const rpc = vi.fn();
const getSession = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession }, rpc }),
}));
// The shared phone's question is its own screen's (claim-ask.tsx), and draws nothing here.
vi.mock("@/components/shared/claim-ask", () => ({ ClaimAsk: () => null }));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));

/** A fresh claim module a test (its `done` and `inFlight` are one page load's), and the two halves of the page. */
async function load() {
  vi.resetModules();
  const { ClaimUploadsOnAuth } = await import("./claim-uploads-on-auth");
  const { ClaimsReview } = await import(
    "@/components/app/dashboard/claims-review"
  );
  const { CLAIMED_TOAST } = await import("@/lib/guest/claim-uploads");
  return { ClaimUploadsOnAuth, ClaimsReview, CLAIMED_TOAST };
}

/** The row the server drew before the claim landed: his, as SQL says once the claim is in. */
const P: ClaimableEvent = {
  eventId: "p",
  eventName: "RT35 P her album (disposable)",
  eventDate: null,
  names: ["RT35 Claim"],
  uploadCount: 1,
  lastUploadAt: "2026-10-01T06:45:00Z",
  gate: null,
  previews: [],
};

/** The claim's answer: how many claimed rows carried a live upload. Resolved by the test when it says so. */
function claimAnswers(moved: number) {
  let land!: () => void;
  const landed = new Promise<void>((r) => {
    land = r;
  });
  rpc.mockImplementation(async (fn: string) => {
    if (fn === "claim_anonymous_uploads") {
      await landed;
      return { data: moved, error: null };
    }
    // The ask read after every claim (claim_ticket_asks): nothing asked.
    return { data: [], error: null };
  });
  return land;
}

const claimCalls = () =>
  rpc.mock.calls.filter(([fn]) => fn === "claim_anonymous_uploads");

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ data: { session: { user: { id: "will" } } } });
  // The ticket the names-only door minted on this phone, typed under his address.
  localStorage.setItem("pr_session_qr-p", "tok-claim");
});

describe("the layout's claim and the page behind it", () => {
  it("★ refreshes once the claim lands, before the page segment has streamed in (the red-team's order)", async () => {
    const { ClaimUploadsOnAuth, ClaimsReview, CLAIMED_TOAST } = await load();
    const land = claimAnswers(1);
    const page = (segment: ReactNode) => (
      <>
        <ClaimUploadsOnAuth />
        {segment}
      </>
    );
    // The layout hydrates first; the page segment is still behind its loading boundary.
    const view = render(page(null));
    await waitFor(() => expect(claimCalls()).toHaveLength(1));
    await act(async () => land());
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(CLAIMED_TOAST),
    );
    expect(refresh).toHaveBeenCalledTimes(1);

    // Then the segment streams in, drawn from the list the server read before the claim: it offers the row
    // for a beat, and asks for no second refresh of its own.
    view.rerender(
      page(
        <ClaimsReview
          rows={[P]}
          pageHref="/account/profile"
          invitesOnceSorted={false}
          claim={vi.fn()}
          disown={vi.fn()}
        />,
      ),
    );
    expect(
      screen.getByText("1 photo from 1 event is waiting for you"),
    ).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(refresh).toHaveBeenCalledTimes(1);

    // The refresh's answer: the server's list, drawn after the claim, no longer holds his row.
    view.rerender(
      page(
        <ClaimsReview
          rows={[]}
          pageHref="/account/profile"
          invitesOnceSorted={false}
          claim={vi.fn()}
          disown={vi.fn()}
        />,
      ),
    );
    expect(screen.queryByText(/waiting for you/)).toBeNull();
  });

  it("★ refreshes once when the page segment was already there as the claim landed", async () => {
    const { ClaimUploadsOnAuth, ClaimsReview } = await load();
    const land = claimAnswers(1);
    render(
      <>
        <ClaimUploadsOnAuth />
        <ClaimsReview
          rows={[P]}
          pageHref="/account/profile"
          invitesOnceSorted={false}
          claim={vi.fn()}
          disown={vi.fn()}
        />
      </>,
    );
    await waitFor(() => expect(claimCalls()).toHaveLength(1));
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => land());
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("counts a claim at the album's own page as well as elsewhere", async () => {
    const { ClaimUploadsOnAuth } = await load();
    // On an album (the claim's `here`): its own ticket first, then the rest.
    const { holdAlbum } = await import("@/lib/guest/album-return");
    const release = holdAlbum("qr-p");
    const land = claimAnswers(1);
    render(<ClaimUploadsOnAuth />);
    await act(async () => land());
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    release();
  });

  it("asks for nothing when the claim moved nothing, which is nearly every visit", async () => {
    const { ClaimUploadsOnAuth } = await load();
    const land = claimAnswers(0);
    render(<ClaimUploadsOnAuth />);
    await waitFor(() => expect(claimCalls()).toHaveLength(1));
    await act(async () => land());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("asks for nothing once the layout has left: the route on screen was not drawn under it", async () => {
    const { ClaimUploadsOnAuth } = await load();
    const land = claimAnswers(1);
    const { unmount } = render(<ClaimUploadsOnAuth />);
    await waitFor(() => expect(claimCalls()).toHaveLength(1));
    unmount();
    await act(async () => land());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
