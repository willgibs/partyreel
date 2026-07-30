/**
 * The GUEST download LADDER, as a pure decision (R3, ADR-0022 ruling 4).
 *
 * The overlay's Download tap has four possible outcomes and they are chosen from exactly two facts:
 * what the route answered, and whether THIS device can encode. Keeping that choice pure (rather than
 * inline in the overlay's async handler) is what makes the ruled ladder testable at all: the live
 * red-team can only force one rung at a time, whereas the pins below cover all four plus the
 * refusals, and any future rung has to declare itself here.
 *
 * The ladder, in the ruled order (artifact-preferred, then $0 self-encode, then the honest ask):
 *
 *   fresh artifact                → serve it (instant, universal, matches the current cut exactly)
 *   stale artifact + can encode   → encode the cut the guest is WATCHING (the shown props), $0
 *   stale artifact + cannot       → serve the stale file (a real video of an older cut beats nothing)
 *   no artifact   + can encode    → encode
 *   no artifact   + cannot        → ask the host to make one (the only dead end, named honestly)
 *
 * Note the asymmetry: freshness LOSES to a local encode where one is possible (the guest gets the cut
 * they are looking at, not the host's older render) but WINS over nothing. There is deliberately no
 * server render / mint / upload rung: a guest has no write path (ruling 4).
 */
import type { ReelDownloadResponse } from "@/lib/reel/guest-download-contract";

export type ReelDownloadPlan =
  /** Save the host's stored mp4 from the presigned url. `fresh` is for the caller's copy only. */
  | { kind: "artifact"; url: string; fresh: boolean }
  /** Encode the reel on this device, then save the blob under this filename. */
  | { kind: "encode"; filename: string }
  /** Nothing to serve and nothing this device can make: the ask-the-host message. */
  | { kind: "ask_host" }
  /** The limiter refused; tell them when to try again. */
  | { kind: "rate_limited"; retryAfterSec?: number }
  /** no_reel / forbidden / bad_request / a network failure: one quiet, non-specific answer. */
  | { kind: "unavailable" };

/**
 * @param response the route's parsed body, or null when the request itself failed
 * @param canEncode `shouldClientEncode(probeEngineSupport(...), styleId)` for this device + style
 */
export function planReelDownload(
  response: ReelDownloadResponse | null,
  canEncode: boolean,
): ReelDownloadPlan {
  if (!response) return { kind: "unavailable" };

  if (response.ok) {
    // A fresh artifact is the best answer for everyone: no encode wait, no device requirement.
    if (response.fresh) {
      return { kind: "artifact", url: response.url, fresh: true };
    }
    // Stale: prefer the cut on screen where the device can make it, else hand over the real (older)
    // file rather than refusing a download that is sitting right there.
    return canEncode
      ? { kind: "encode", filename: response.filename }
      : { kind: "artifact", url: response.url, fresh: false };
  }

  if (response.code === "no_artifact") {
    return canEncode
      ? { kind: "encode", filename: response.filename }
      : { kind: "ask_host" };
  }
  if (response.code === "rate_limited") {
    return { kind: "rate_limited", retryAfterSec: response.retryAfterSec };
  }
  // no_reel is deliberately indistinguishable from forbidden here too: the client must not turn the
  // route's one non-oracle answer back into a publish-state signal in its copy.
  return { kind: "unavailable" };
}

/**
 * Whether an answer could possibly need a local encode. The WebCodecs probe is not free (it asks the
 * platform to configure an encoder), so the overlay skips it entirely on the fresh-artifact and
 * refusal paths — the plan is the same either way.
 */
export function needsEncodeProbe(
  response: ReelDownloadResponse | null,
): boolean {
  if (!response) return false;
  if (response.ok) return !response.fresh;
  return response.code === "no_artifact";
}
