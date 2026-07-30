/**
 * Behavior pins for the two reel contracts a UI refactor can silently break.
 *
 * 1. REORDER — the provider must send the RPC exactly the ids it was handed, in
 *    order, and must REVERT when the RPC refuses. Both halves are load-bearing:
 *    reorder_reel's set-equality guard rejects a partial list outright (which is
 *    why the Studio dock and the feed's grid both commit the FULL membership,
 *    hidden items included), and a Set keeps INSERTION order, so building a NEW
 *    Set from the reordered array is the only thing that actually reorders it.
 *    Re-adding into the old Set silently keeps the old order.
 *
 * 2. THE EXPORT FLOW's flush gate — a failed config flush must STOP the export
 *    before any encode. The server derives the artifact hash from the DB row, so
 *    encoding un-flushed client state would cache pixels under a hash describing a
 *    DIFFERENT reel: a wrong video served forever from a cache hit. That gate has
 *    no visual signature, which is exactly why it needs a pin.
 */
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc, from }),
}));

// The encoder must never even be REACHED when the flush fails, so the pin asserts
// on the dynamic import's module rather than on a spy inside it.
const encodeReel = vi.fn();
vi.mock("@/lib/reel/engine/encode", () => ({ encodeReel }));

// probeEngineSupport/shouldClientEncode would otherwise reach for WebCodecs.
vi.mock("@/lib/reel/engine/support", () => ({
  probeEngineSupport: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/reel/engine/encode-gate", () => ({
  shouldClientEncode: () => true,
}));

import { ReelProvider, useReel } from "./reel-provider";
import { useReelConfig } from "./use-reel-config";

/** Exposes the provider's controller to the test. */
function ReelProbe({ onReady }: { onReady: (r: ReturnType<typeof useReel>) => void }) {
  const reel = useReel();
  onReady(reel);
  return <div data-testid="order">{(reel?.orderedIds ?? []).join(",")}</div>;
}

describe("ReelProvider.reorder", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it("sends reorder_reel EXACTLY the ordered ids it was given", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    let api: ReturnType<typeof useReel> = null;
    const { getByTestId } = render(
      <ReelProvider eventId="ev1" initialReelIds={["a", "b", "c"]}>
        <ReelProbe onReady={(r) => (api = r)} />
      </ReelProvider>,
    );
    expect(getByTestId("order")).toHaveTextContent("a,b,c");

    await act(async () => {
      await api!.reorder(["c", "a", "b"]);
    });

    expect(rpc).toHaveBeenCalledWith("reorder_reel", {
      p_event_id: "ev1",
      p_media_ids: ["c", "a", "b"],
    });
    // ★ The Set had to be REBUILT: re-adding into the old one would still read a,b,c.
    expect(getByTestId("order")).toHaveTextContent("c,a,b");
  });

  it("reverts to the previous order when the RPC refuses (a stale list)", async () => {
    rpc.mockResolvedValue({ data: { ok: false, reason: "stale" }, error: null });
    let api: ReturnType<typeof useReel> = null;
    const { getByTestId } = render(
      <ReelProvider eventId="ev1" initialReelIds={["a", "b", "c"]}>
        <ReelProbe onReady={(r) => (api = r)} />
      </ReelProvider>,
    );

    await act(async () => {
      await api!.reorder(["c", "b", "a"]);
    });

    expect(getByTestId("order")).toHaveTextContent("a,b,c");
  });
});

/** Drives just the export handler out of the config controller. */
function ExportProbe({ onReady }: { onReady: (h: () => Promise<void>) => void }) {
  const config = useReelConfig({
    eventId: "ev1",
    items: [],
    reelConfig: null,
    watermark: false,
    tier: "free",
  });
  onReady(config.handleDownload);
  return null;
}

describe("the export flow's flush gate", () => {
  beforeEach(() => {
    rpc.mockReset();
    encodeReel.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does NOT encode when the config flush fails", async () => {
    // upsert_reel_config refuses → the export must stop right there.
    rpc.mockResolvedValue({ data: { ok: false }, error: null });
    let handleDownload: (() => Promise<void>) | null = null;
    render(
      <ReelProvider eventId="ev1" initialReelIds={[]}>
        <ExportProbe onReady={(h) => (handleDownload = h)} />
      </ReelProvider>,
    );

    await act(async () => {
      await handleDownload!();
    });

    expect(rpc).toHaveBeenCalledWith(
      "upsert_reel_config",
      expect.objectContaining({ p_event_id: "ev1" }),
    );
    expect(encodeReel).not.toHaveBeenCalled();
    // And it never even reached /api/reel/upload's begin phase.
    expect(fetch).not.toHaveBeenCalled();
  });
});
