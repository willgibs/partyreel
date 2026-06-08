import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Email-safety invariant (Phase 2): uploader EMAIL is host-gallery-only. Every GUEST-facing
// GridMedia is built by toGridItems (the SSR page, the live-poll route, and the password-unlock
// path all funnel through it), which copies ONLY name/isHost/isAnonymous off the identities map and
// NEVER the email. This standing guard fails if a future edit ever assigns an email there, so a
// guest payload can never carry an uploader's email. (The host dashboard builds its own items with
// email, separately, in dashboard/[eventId]/page.tsx.)
describe("email-safety: the guest-facing GridMedia builder never carries email", () => {
  it("toGridItems (grid-items.ts) never assigns uploaderEmail", () => {
    const src = readFileSync(
      join(process.cwd(), "src/lib/r2/grid-items.ts"),
      "utf8",
    );
    expect(src).not.toContain("uploaderEmail");
  });
});
