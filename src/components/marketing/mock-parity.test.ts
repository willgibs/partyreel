/**
 * Marketing mocks are hand-authored to QUOTE the shipped app's copy verbatim
 * (never invent UI strings; see CLAUDE.md's copy laws). Nothing at the type
 * level enforces that though: the app is free to rename a button or a chip
 * and the marketing quote just... strands, silently, with nobody the wiser
 * until a human eyeballs both surfaces side by side.
 *
 * Source-text pin (same house pattern as request-auth-policy.test.ts and
 * content-policy.test.ts): read both files as plain text and assert the
 * literal string appears in each. It can't verify the quote renders in the
 * same VISUAL position, only that the string still exists verbatim somewhere
 * in the file that owns it, which is enough to catch a rename or a copy
 * rewrite that would otherwise silently break fidelity.
 *
 * HOW TO UPDATE when a string legitimately changes: change the app copy and
 * the marketing mock's copy TOGETHER, in the same commit, then update the
 * `literal` here to match the new wording. If you rename/move a component,
 * update `marketingFile`/`appFile`. Do not delete an entry just to make the
 * suite pass; either the quote still belongs (fix both sides) or the mock
 * moment no longer exists (remove the mock's quote AND this entry together).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

type ParityEntry = {
  /** What UI moment this quote represents, for failure messages. */
  label: string;
  marketingFile: string;
  appFile: string;
  literal: string;
};

const ENTRIES: ParityEntry[] = [
  // Curation demo (/features/curation) <-> the event feed's review controls.
  {
    label: "curation demo bulk-approve button",
    marketingFile:
      "src/components/marketing/sections/features/curation/review-queue-demo.tsx",
    appFile: "src/components/app/event-feed/review-actions.tsx",
    literal: "Approve all",
  },
  {
    label: "curation demo cleared-queue success state",
    marketingFile:
      "src/components/marketing/sections/features/curation/review-queue-demo.tsx",
    appFile: "src/components/app/event-feed/review-section.tsx",
    literal: "All caught up",
  },
  // Zip export demo (/features/sharing) <-> the real download dialog.
  {
    label: "zip demo dialog title",
    marketingFile:
      "src/components/marketing/sections/features/sharing/zip-modal-demo.tsx",
    appFile: "src/components/app/export/export-dialog.tsx",
    literal: "Download album",
  },
  {
    label: 'zip demo "everything" filter chip',
    marketingFile:
      "src/components/marketing/sections/features/sharing/zip-modal-demo.tsx",
    appFile: "src/components/app/export/export-dialog.tsx",
    literal: "Everything",
  },
  {
    label: 'zip demo "photos" filter chip',
    marketingFile:
      "src/components/marketing/sections/features/sharing/zip-modal-demo.tsx",
    appFile: "src/components/app/export/export-dialog.tsx",
    literal: "Photos",
  },
  {
    label: 'zip demo "videos" filter chip',
    marketingFile:
      "src/components/marketing/sections/features/sharing/zip-modal-demo.tsx",
    appFile: "src/components/app/export/export-dialog.tsx",
    literal: "Videos",
  },
  // QR page (/features/qr) <-> the host's real QR designer + download menu.
  {
    label: "qr page save button",
    marketingFile:
      "src/components/marketing/sections/features/qr/preset-switcher.tsx",
    appFile: "src/components/app/qr-designer-dialog.tsx",
    literal: "Save QR style",
  },
  {
    label: "qr page svg download option",
    marketingFile:
      "src/components/marketing/sections/features/qr/preset-switcher.tsx",
    appFile: "src/components/app/event-qr.tsx",
    literal: "SVG (best for print)",
  },
  {
    label: "qr page png download option",
    marketingFile:
      "src/components/marketing/sections/features/qr/preset-switcher.tsx",
    appFile: "src/components/app/event-qr.tsx",
    literal: "PNG (best for screens)",
  },
  // How-it-works guest-entry frame <-> the real email OTP sign-in form.
  {
    label: "guest entry email-code request button",
    marketingFile:
      "src/components/marketing/sections/how-it-works/step-frames.tsx",
    appFile: "src/components/auth/email-sign-in.tsx",
    literal: "Email me a code",
  },
  // Privacy page (/features/privacy) <-> the host's real upload settings.
  {
    label: "privacy page require-accounts toggle label",
    marketingFile:
      "src/components/marketing/sections/features/privacy/never-rides-along.tsx",
    appFile: "src/components/app/event-settings/uploads-section.tsx",
    literal: "Require accounts to upload",
  },
];

describe("marketing mock <-> app copy parity", () => {
  for (const entry of ENTRIES) {
    it(`${entry.label}: "${entry.literal}" appears in both the mock and the app`, () => {
      const marketingSrc = readFileSync(
        join(ROOT, entry.marketingFile),
        "utf8",
      );
      const appSrc = readFileSync(join(ROOT, entry.appFile), "utf8");
      expect(
        marketingSrc,
        `Marketing mock no longer quotes "${entry.literal}" (${entry.marketingFile}). ` +
          `Either the mock drifted from the app, or this entry is stale, update together.`,
      ).toContain(entry.literal);
      expect(
        appSrc,
        `The app no longer has "${entry.literal}" (${entry.appFile}). ` +
          `The marketing mock (${entry.marketingFile}) is quoting stale copy, a fidelity bug, fix the mock to match the app's real string (or update both together if the app's wording is the one that should change).`,
      ).toContain(entry.literal);
    });
  }
});
