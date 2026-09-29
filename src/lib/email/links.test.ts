/**
 * A MAIL'S LINK AND ITS LANDING ARE ONE FACT (links.ts): the renewal nudge's button names a route
 * that exists, and its unsubscribe names the row the Email preferences form draws with that id.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PASS_REMINDERS_ANCHOR,
  PASS_REMINDERS_PATH,
  RENEW_PASS_PATH,
} from "@/lib/email/links";

const ROOT = process.cwd();

describe("where a mail points", () => {
  it("the renew button's path is a real page under the (app) gate", () => {
    expect(RENEW_PASS_PATH).toBe("/account/renew");
    expect(existsSync(join(ROOT, "src/app/(app)/account/renew/page.tsx"))).toBe(
      true,
    );
  });

  it("the unsubscribe lands on the row that carries the anchor", () => {
    expect(PASS_REMINDERS_PATH).toBe(`/account#${PASS_REMINDERS_ANCHOR}`);
    const form = readFileSync(
      join(ROOT, "src/components/app/notification-prefs-form.tsx"),
      "utf8",
    );
    expect(form).toContain("anchor: PASS_REMINDERS_ANCHOR");
    expect(form).toContain("id={anchor}");
  });
});
