import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Email-safety invariant (Phase 2): uploader EMAIL is host-gallery-only. Every GUEST-facing
// GridMedia is built by toGridItems (the SSR page, the live-poll route, and the password-unlock
// path all funnel through it), which copies ONLY name/isHost/isVerified/isAnonymous off the
// identities map and NEVER the email. This standing guard fails if a future edit ever assigns an
// email there, so a guest payload can never carry an uploader's email. (The host dashboard builds
// its own items with email, separately, in lib/event/gallery-items.ts.)
//
// The identity reshape (2026-09-21) made the map WIDER, which is exactly when a guard like this
// earns its keep: `isVerified` had to reach the guest tile, and the tempting way to add it is to
// spread `who` instead of naming the fields, which would carry the email along with it.
describe("email-safety: the guest-facing GridMedia builder never carries email", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/r2/grid-items.ts"),
    "utf8",
  );

  it("toGridItems (grid-items.ts) never assigns uploaderEmail", () => {
    expect(src).not.toContain("uploaderEmail");
  });

  it("names each identity field rather than spreading the whole identity", () => {
    // A spread would carry `email` onto a guest payload the day someone adds a field to
    // UploaderIdentity, silently and everywhere at once.
    expect(src).not.toMatch(/\.\.\.who\b/);
    expect(src).toContain("isVerified: who?.isVerified ?? false");
  });
});
