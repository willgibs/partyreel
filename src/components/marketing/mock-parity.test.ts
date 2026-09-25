/**
 * Marketing mocks are hand-authored to QUOTE the shipped app's copy verbatim,
 * so a mock never shows a string the product does not have. Nothing at the type
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
  {
    label: "album settings document: the accepting-uploads label",
    marketingFile:
      "src/components/marketing/sections/features/album/album-copy.ts",
    appFile: "src/components/app/event-settings/uploads-section.tsx",
    literal: "Accepting uploads",
  },
  {
    label: "album settings document: the per-upload cap label",
    marketingFile:
      "src/components/marketing/sections/features/album/album-copy.ts",
    appFile: "src/components/app/event-settings/uploads-section.tsx",
    literal: "Max size per upload",
  },
  {
    label: "album cap refusal sheet heading",
    marketingFile:
      "src/components/marketing/sections/features/album/how-much-fits.tsx",
    appFile: "src/components/guest/upload/failure-sheet.tsx",
    literal: "1 file did not go",
  },
  {
    label: "album accounts-required teaser button",
    marketingFile:
      "src/components/marketing/sections/features/album/visibility-frames.tsx",
    appFile: "src/components/guest/live-gallery.tsx",
    literal: "See all",
  },
  // The live album page (/features/album) <-> the guest and host surfaces.
  {
    label: "album entry phone welcome promise",
    marketingFile:
      "src/components/marketing/sections/features/album/entry-phone.tsx",
    appFile: "src/components/guest/entry-modal.tsx",
    literal: "No app required.",
  },
  // ★ THE NOUN (Will, 2026-09-17: `noun=album`). These three quote the guest's
  // entry sheet, and all three said "gallery" for as long as the sheet did.
  // They went stale the moment `voice-picks` swept the app and NOTHING went
  // red, because they were not pinned: that is exactly how a mock strands.
  // Pinned here so the next sweep of that sheet takes them with it.
  {
    label: "album entry phone one-album promise",
    marketingFile:
      "src/components/marketing/sections/features/album/entry-phone.tsx",
    appFile: "src/components/guest/entry-modal.tsx",
    literal: "shots land in one album",
  },
  {
    label: "qr entry flow one-album promise",
    marketingFile:
      "src/components/marketing/sections/features/qr/entry-flow.tsx",
    appFile: "src/components/guest/entry-modal.tsx",
    literal: "shots land in one album",
  },
  // ★ "Continue" REPLACED "View the album" HERE (Will, 2026-09-21, "the door as three steps"):
  // the welcome's two exits are one primary now, and the browse-out row this file used to pin
  // ("Just browsing") does not exist on either side any more, so its pair was deleted rather than
  // retargeted. Deleting a pin is the honest move when the string it guarded is gone from BOTH
  // files; retargeting it to a string that never disagreed would guard nothing.
  {
    label: "qr entry flow welcome primary",
    marketingFile:
      "src/components/marketing/sections/features/qr/entry-flow.tsx",
    appFile: "src/components/guest/entry-modal.tsx",
    literal: "Continue",
  },
  {
    label: "album review switch guest waiting tile",
    marketingFile:
      "src/components/marketing/sections/features/album/review-switch.tsx",
    appFile: "src/components/guest/upload/stack-tile.tsx",
    literal: "Waiting for the host",
  },
  {
    label: "album review switch bulk-approve button",
    marketingFile:
      "src/components/marketing/sections/features/album/review-switch.tsx",
    appFile: "src/components/app/event-feed/review-actions.tsx",
    literal: "Approve all",
  },
  {
    label: "album your-call close-uploads helper",
    marketingFile:
      "src/components/marketing/sections/features/album/album-copy.ts",
    appFile: "src/components/app/event-settings/uploads-section.tsx",
    literal: "Turn off to freeze the album. Guests can still view it.",
  },
  {
    label: "album visibility private page title",
    marketingFile:
      "src/components/marketing/sections/features/album/visibility-frames.tsx",
    appFile: "src/app/(guest)/e/[token]/page.tsx",
    literal: "This event is private",
  },
  {
    label: "album visibility password gate eyebrow",
    marketingFile:
      "src/components/marketing/sections/features/album/visibility-frames.tsx",
    appFile: "src/components/guest/password-gate.tsx",
    literal: "Almost in",
  },
  {
    label: "album take-home dialog title",
    marketingFile:
      "src/components/marketing/sections/features/album/take-home-section.tsx",
    appFile: "src/components/app/export/export-dialog.tsx",
    literal: "Download album",
  },
  {
    label: "album cap refusal, the guest's words",
    marketingFile:
      "src/components/marketing/sections/features/album/how-much-fits.tsx",
    appFile: "src/app/api/r2/presign-upload/route.ts",
    literal: "This album is full right now. The host needs to free up space.",
  },
  {
    label: "album photos-only refusal, the guest's words",
    marketingFile:
      "src/components/marketing/sections/features/album/album-copy.ts",
    appFile: "src/app/api/r2/presign-upload/route.ts",
    literal: "This event accepts photos only.",
  },
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
  // How-it-works guest door <-> the real email OTP sign-in form. The drawing
  // moved from step-frames.tsx to the guest's own picture set when the
  // walkthrough split into two perspectives (2026-09-19); the literal is what
  // this entry is for, and it follows wherever the door is drawn.
  {
    label: "guest entry email-code request button",
    marketingFile:
      "src/components/marketing/sections/how-it-works/guest-pictures.tsx",
    appFile: "src/components/auth/email-sign-in.tsx",
    literal: "Email me a code",
  },
  // Privacy page (/features/privacy) <-> the host's real upload settings.
  {
    label: "privacy page require-verified-emails toggle label",
    marketingFile:
      "src/components/marketing/sections/features/privacy/never-rides-along.tsx",
    appFile: "src/components/app/event-settings/uploads-section.tsx",
    literal: "Require verified emails",
  },
  // The live reel (`reel-sweep`, 2026-09-25): every surface that draws the reel
  // quotes the reel's own words, so a rename in the tile, the view or the hub
  // card strands no marketing picture of it.
  {
    label: "reel page live tile heading",
    marketingFile: "src/components/marketing/sections/reel/live-tile.tsx",
    appFile: "src/components/guest/reel/live-reel.tsx",
    literal: "Highlight reel",
  },
  {
    label: "reel page live tile clip line",
    marketingFile: "src/components/marketing/sections/reel/live-tile.tsx",
    appFile: "src/components/guest/reel/live-reel.tsx",
    literal: "Make your own clip to share",
  },
  {
    label: "reel page screen corner code line",
    marketingFile: "src/components/marketing/sections/reel/screen-section.tsx",
    appFile: "src/components/guest/reel/live-reel-view.tsx",
    literal: "Scan to add yours",
  },
  {
    label: "album take-home plate, the reel view's clip button",
    marketingFile:
      "src/components/marketing/sections/features/album/take-home-section.tsx",
    appFile: "src/components/guest/reel/live-reel-view.tsx",
    literal: "Make your own",
  },
  {
    label: "how-it-works guest clip step, the reel view's clip button",
    marketingFile:
      "src/components/marketing/sections/how-it-works/guest-pictures.tsx",
    appFile: "src/components/guest/reel/live-reel-view.tsx",
    literal: "Make your own",
  },
  {
    label: "how-it-works host reel step, the hub card's live line",
    marketingFile:
      "src/components/marketing/sections/how-it-works/host-pictures.tsx",
    appFile: "src/components/app/event-feed/reel-card.tsx",
    literal: "Live for guests",
  },
  {
    label: "how-it-works host reel step, the Settings look row",
    marketingFile:
      "src/components/marketing/sections/how-it-works/host-pictures.tsx",
    appFile: "src/components/app/event-settings/highlight-reel-card.tsx",
    literal: "Where every guest starts.",
  },
  {
    label: "home live demo payoff card, the reel's own heading",
    marketingFile: "src/components/marketing/sections/home/live-demo.tsx",
    appFile: "src/components/guest/reel/live-reel.tsx",
    literal: "Highlight reel",
  },
  // The select mode's bar lost its reel action with the stored reel; the
  // mock's first action is the app's own first action now.
  {
    label: "bulk select mock like action",
    marketingFile:
      "src/components/marketing/sections/shared/bulk-select-mock.tsx",
    appFile: "src/components/app/event-feed/gallery-actions.tsx",
    literal: '"Like"',
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
