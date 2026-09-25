import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Email-safety invariant: uploader EMAIL is host-gallery-only. Every GUEST-facing
// GridMedia is built by toGridItems (the SSR page, the live-poll route, and the password-unlock
// path all funnel through it), which copies ONLY name/isHost/isVerified off the identities map
// and NEVER the email. This standing guard fails if a future edit ever assigns an
// email there, so a guest payload can never carry an uploader's email. (The host dashboard builds
// its own items with email, separately, in lib/event/gallery-items.ts.)
//
// The identities map carries more than a name (`isVerified` reaches the guest tile), which is
// exactly when a guard like this earns its keep: the tempting way to add a field is to spread
// `who` instead of naming the fields, which would carry the email along with it.
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

  /* ★ AND THE UNPROVED ADDRESS TOO. `guests` also carries `pending_email`: an address a guest
     TYPED at the door that nobody has proved, stored as an invisible claim number. It is inert by
     construction — never shown to the host, never shown to another guest — so it has even less
     business on a guest-facing payload than a proved one. The builder must never learn the word in
     any spelling. */
  it("★ never assigns pending_email, in any spelling", () => {
    for (const forbidden of [
      "pending_email",
      "pendingEmail",
      "uploaderPendingEmail",
    ]) {
      expect(src, forbidden).not.toContain(forbidden);
    }
  });

  it("the guest payload names exactly three identity fields, and none of them is an address", () => {
    // The allow-list, read back off the source: if a fourth ever appears it should be a deliberate
    // edit here, not a silent one there.
    const assigned = [...src.matchAll(/(\w+): who\?\.(\w+)/g)].map(
      ([, key]) => key,
    );
    expect(new Set(assigned)).toEqual(
      new Set(["uploaderName", "isHost", "isVerified"]),
    );
  });
});

/* ★ AND THE PAGED ALBUM'S GUEST LINKS (album-pages). A window's links carry attribution too, as a
   tuple rather than named fields (`[name, flags]`), so the allow-list above cannot read it; this one
   reads the tuple builder instead. The guest path never even fetches the address
   (`readAlbumAttribution` with `withEmail: false`); this guard is what keeps the builder from ever
   learning the word. The host's twin (`album-host-links.ts`) carries the proved address by design. */
describe("email-safety: the paged album's guest links never carry an address", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/events/album-guest-links.ts"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");

  it("never names an address in code, in any spelling", () => {
    for (const forbidden of [
      "email",
      "Email",
      "pending_email",
      "pendingEmail",
      "HostWhoTuple",
    ]) {
      expect(src, forbidden).not.toContain(forbidden);
    }
  });

  it("builds the tuple from exactly the name and the two flags, never a spread", () => {
    expect(src).not.toMatch(/\.\.\.who\b/);
    expect(src).toContain("return [who.displayName, flags];");
    const read = [...src.matchAll(/who\.(\w+)/g)].map(([, field]) => field);
    expect(new Set(read)).toEqual(
      new Set(["displayName", "isHost", "isVerified"]),
    );
  });
});
