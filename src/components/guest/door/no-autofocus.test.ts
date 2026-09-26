import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * NO DOOR STEP CARRIES `autoFocus` (door-flow's first focus rule).
 *
 * The iOS keyboard rising into a sheet that is still sliding up, and resizing it mid-animation,
 * was the concrete cause of the door feeling "super buggy when the mobile keyboard opens to type".
 * The rule since: no field on the door takes focus on mount (the name, identify, the code, the
 * password), Radix's own open autofocus is prevented, and focus moves only inside the guest's own
 * tap or Return. A mount-time `autoFocus` anywhere in these files would quietly bring the bug back,
 * so the source itself is read, comments stripped, for the attribute.
 */
const ROOT = process.cwd();

const DOOR_FILES = [
  "src/components/guest/entry-modal.tsx",
  "src/components/guest/entry-shell.tsx",
  "src/components/guest/entry-step-transition.tsx",
  "src/components/guest/guest-name-step.tsx",
  "src/components/guest/identify-step.tsx",
  "src/components/guest/password-gate.tsx",
  "src/components/guest/upload-step.tsx",
  "src/components/guest/add-email-dialog.tsx",
  "src/components/auth/account-door.tsx",
  "src/components/auth/email-sign-in.tsx",
  "src/components/auth/password-sign-in.tsx",
  "src/components/auth/confirm-email-dialog.tsx",
  // Every step under the door's own folder, including the ones added later.
  ...readdirSync(join(ROOT, "src/components/guest/door"))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => `src/components/guest/door/${f}`),
];

/** The source with its comments removed, so a comment ABOUT the rule never trips it. */
function code(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

describe("the door's fields never focus themselves", () => {
  it("covers the door's steps (the chooser and Log in among them)", () => {
    expect(DOOR_FILES).toEqual(
      expect.arrayContaining([
        "src/components/guest/door/chooser.tsx",
        "src/components/guest/door/signin-step.tsx",
      ]),
    );
  });

  it.each(DOOR_FILES)("%s carries no autoFocus", (rel) => {
    expect(
      /\bautoFocus\b/.test(code(rel)),
      `${rel} autofocuses a field on mount: the iOS keyboard would rise into a sheet still arriving. Move focus inside the guest's own tap instead.`,
    ).toBe(false);
  });
});
