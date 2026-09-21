/**
 * THE ONE QUIET LINE THE UPLOAD ACT SAYS BEFORE ANYTHING FLIES (Will,
 * `warning=both`, 2026-09-21, with the design note attached: "Terms either need
 * a better design or to be scrapped").
 *
 * It was scrapped as TERMS and kept as FACTS. What a guest at a party actually
 * needs before tapping is what this album takes and how big it may be — the two
 * things the page has always known and never said, so today the only place that
 * number appears is inside a refusal, after the picker has closed and the bytes
 * have started.
 *
 * ★ NOTHING ABOUT RIGHTS, OWNERSHIP OR LICENSES LIVES HERE, AND NOTHING EVER
 * WILL. `lib/constants/legal-terms.tsx` ("Your content") is where the license a
 * guest grants is stated, the guest door already carries `LegalConsentLine`,
 * and the house rule is that we never ask an uploader to assert provenance. A
 * sentence about rights on the Add sheet would be a warning on an invitation.
 *
 * ★ THE NUMBER IS THE PRODUCT'S CEILING UNTIL THE HOST'S REACHES THE GUEST.
 * A host may set a STRICTER per-event cap (`events.max_upload_bytes`), and the
 * option Will chose says "in the host's own number" — but the guest page never
 * receives it: `get_event_by_qr_token` does not return the column, so honouring
 * it needs a migration, a types regeneration and a query change, all of which
 * are the Orchestrator's to land. `capBytes` is that seam, already wired and
 * already tested: the day the RPC returns the number, one call site passes it
 * and this line is right everywhere at once. Until then it states the universal
 * ceiling, which is true for every event and never over-promises a bigger one.
 */
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

export function uploadTermsLine(capBytes?: number | null): string {
  return `Photos and videos, up to ${formatBytes(capBytes ?? MAX_UPLOAD_BYTES)} each.`;
}
