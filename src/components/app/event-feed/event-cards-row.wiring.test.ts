import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * WHAT ONLY THE HUB'S PAGE CAN SAY ABOUT ITS DOORS (event-header r4's cards over the seam, wired). The page is a server
 * component over a session and a dozen reads, so what is pinned here is how it words and feeds the row. Each of these fails
 * silently: a probe asked for every event costs every live album a read it has no use for, a failed read left to throw takes
 * the whole hub with it, and a door worded in the page rather than in `room-card.ts` is a door the row's live count and the
 * page's first paint can word two ways.
 */
const PAGE = readFileSync(
  join(process.cwd(), "src/app/(app)/dashboard/[eventId]/page.tsx"),
  "utf8",
);
const code = PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the Guests card's sealed roll (crumbs-81)", () => {
  it("★ reads the shots a roll holds only while a develop time is ahead, never for a live album", () => {
    const at = code.indexOf("countWaitingGuestShots(event.id)");
    expect(at, "the shots' read").toBeGreaterThan(-1);
    // Guarded by the develop's own rule (`hubCovered`), on the facts the event row already holds.
    const guard = code.slice(Math.max(0, at - 160), at);
    expect(guard).toMatch(/hubCovered\(\{[^}]*develops_at: event\.develops_at/);
    expect(code).toMatch(/: Promise\.resolve\(0\)/);
  });

  it("★ is never read before the host is proved: after getEvent, inside the parallel batch", () => {
    const found = code.indexOf("if (!event) return <AppNotFoundScreen />");
    const read = code.indexOf("countWaitingGuestShots(event.id)");
    expect(found).toBeGreaterThan(-1);
    expect(read, "the read stands after the not-found").toBeGreaterThan(found);
    // One batch with the rest of the page's reads, never a round trip of its own after them.
    const batch = code.slice(
      code.lastIndexOf("await Promise.all([", read),
      read,
    );
    expect(batch).toContain("planHubManifest(supabase, event.id)");
  });

  it("★ is never worth the page: a failed read says its guests as the list counts them, and says so where failures are read", () => {
    const at = code.indexOf("countWaitingGuestShots(event.id)");
    const read = code.slice(at, at + 260);
    expect(read).toContain(".catch(");
    expect(read).toContain('captureError("db", error');
    expect(read).toContain("return 0");
  });
});

describe("the doors' faces", () => {
  it("★ words the Guests and Settings cards in room-card.ts, the one place the row's own counts read too", () => {
    expect(code).toMatch(/\.\.\.guestsCardFace\(\{/);
    expect(code).toMatch(/shots: waitingShots/);
    expect(code).toMatch(/\.\.\.settingsCardFace\(\{/);
    // Settings' steps left come from the one function the checklist reads, over the day the viewer is in.
    expect(code).toMatch(/left: guestNeeds/);
    expect(code).toMatch(/accepting: event\.accepting_uploads/);
    // And nothing words a door by hand beside them.
    expect(code).not.toMatch(/`\$\{formatCount\([^)]*\)\} left`/);
    expect(code).not.toMatch(/ guests"\s*:/);
  });

  it("hands the Reel card no stills: it is a plain card among the doors", () => {
    const at = code.indexOf("const reel = {");
    const body = code.slice(at, code.indexOf("};", at));
    expect(body).not.toMatch(/\.\.\.reelFace/);
    expect(body).not.toMatch(/stills/);
    expect(body).toContain("state: reelFace.state");
    expect(body).toContain("have: reelFace.have");
    // The cover's and Settings' own use of the reel's take is untouched.
    expect(code).toContain("reelCoverStills(reelFace)");
    expect(code).toContain("reelFace.stills[0]");
  });
});
