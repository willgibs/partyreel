import { describe, expect, it } from "vitest";

import { FAQ_ITEMS } from "@/components/marketing/faq-data";
import { INACTIVE_DAYS } from "@/lib/lifecycle/inactivity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * THE HOME'S "HOW LONG DO YOU KEEP MY PHOTOS?" CARRIES THE WHOLE LIFECYCLE SENTENCE (crumbs-34; the help
 * guide's rule 7, `how-long-media-is-kept.mdx`). It reconciled only the Event Pass ("no expiry clock
 * counting down on your memories"), with no word of the Free plan's one rule: an event nobody touches for
 * about six months is warned about by email, then moved to Deleted, where it can be restored for thirty
 * days. A FAQ is quoted back by assistants and search results verbatim (it feeds the FAQPage JSON-LD), so
 * the answer has to be true on its own. The numbers derive from the lifecycle constants.
 */
const keep = FAQ_ITEMS.find(
  (item) => item.q === "How long do you keep my photos?",
);

describe("the home FAQ's keep answer", () => {
  it("exists", () => {
    expect(keep).toBeDefined();
  });

  it("says the Free plan's idle removal, its warning, where it goes and how long it can be restored", () => {
    const answer = keep!.a;
    expect(answer).toContain("Free");
    expect(answer).toContain(`about ${Math.round(INACTIVE_DAYS / 30)} months`);
    expect(answer).toMatch(/warning email/);
    expect(answer).toContain("Deleted");
    expect(answer).toContain(`${RECENTLY_DELETED_WINDOW_DAYS} days`);
    expect(answer).toMatch(/activity resets the clock/);
  });

  it("keeps the Event Pass's year beside it", () => {
    expect(keep!.a).toContain(
      "An Event Pass covers its event for about a year",
    );
  });

  it("no FAQ answer says there is no expiry clock", () => {
    for (const item of FAQ_ITEMS) {
      expect(item.a, item.q).not.toMatch(/expiry clock/i);
    }
  });
});
