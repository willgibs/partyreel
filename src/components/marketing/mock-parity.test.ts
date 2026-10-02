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
    appFile: "src/components/app/event-settings/adds-page.tsx",
    literal: "Accepting uploads",
  },
  {
    label: "album settings document: the per-upload cap label",
    marketingFile:
      "src/components/marketing/sections/features/album/album-copy.ts",
    appFile: "src/components/app/event-settings/upload-cap-select.tsx",
    literal: "Max size per upload",
  },
  {
    // voice-guest r1 `failed=exact`: the heading is now built from a template
    // (`${failed} of ${sent} didn't upload`), so the pin is the static tail
    // rather than a full sentence — an apostrophe-free literal on purpose: the
    // app's plain string carries a straight `'`, the JSX mock a curly
    // `&rsquo;`, and a literal spanning the apostrophe would never match both.
    label: "album cap refusal sheet heading",
    marketingFile:
      "src/components/marketing/sections/features/album/how-much-fits.tsx",
    appFile: "src/components/guest/upload/failure-sheet.tsx",
    literal: "upload",
  },
  {
    label: "album accounts-required teaser button",
    marketingFile:
      "src/components/marketing/sections/features/album/visibility-frames.tsx",
    appFile: "src/components/guest/live-gallery.tsx",
    literal: "See all",
  },
  // The live album page (/features/album) <-> the guest and host surfaces. ★ The welcome's words live
  // with the welcome at the doorway (`locked-door` r2): `door/welcome.tsx`, no longer the entry sheet.
  {
    label: "album entry phone welcome promise",
    marketingFile:
      "src/components/marketing/sections/features/album/entry-phone.tsx",
    appFile: "src/components/guest/door/welcome.tsx",
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
    appFile: "src/components/guest/door/welcome.tsx",
    literal: "shots land in one album",
  },
  {
    label: "qr entry flow one-album promise",
    marketingFile:
      "src/components/marketing/sections/features/qr/entry-flow.tsx",
    appFile: "src/components/guest/door/welcome.tsx",
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
    appFile: "src/components/guest/door/welcome.tsx",
    literal: "Continue",
  },
  // voice-guest r2 (`held=uploads`, `status=approval`): the album's waiting tile retired, and a held
  // photograph shows only in her uploads, so the phone plate quotes her uploads' row and the
  // switch's hint names it in the same words.
  {
    label: "album review switch guest's uploads row",
    marketingFile:
      "src/components/marketing/sections/features/album/review-switch.tsx",
    appFile: "src/lib/guest/upload-tracker.ts",
    literal: "Waiting for approval",
  },
  {
    label: "album your-call review hint",
    marketingFile:
      "src/components/marketing/sections/features/album/album-copy.ts",
    appFile: "src/lib/guest/upload-tracker.ts",
    literal: "Waiting for approval",
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
    appFile: "src/components/app/event-settings/adds-page.tsx",
    literal: "Turn off to freeze the album. Guests can still view it.",
  },
  {
    // The doors (event-settings r1): the private album's page is the shut door, one screen for every
    // newcomer turned away, and its title lives with it.
    label: "album visibility private page title",
    marketingFile:
      "src/components/marketing/sections/features/album/visibility-frames.tsx",
    appFile: "src/components/guest/door/shut-door.tsx",
    literal: "This album is closed",
  },
  {
    // The doors (event-settings r1): the privacy page's Only me panel draws the same shut door.
    label: "privacy page access switch Only me title",
    marketingFile:
      "src/components/marketing/sections/features/privacy/access-switch.tsx",
    appFile: "src/components/guest/door/shut-door.tsx",
    literal: "This album is closed",
  },
  {
    label: "privacy page access switch Only me line",
    marketingFile:
      "src/components/marketing/sections/features/privacy/access-switch.tsx",
    appFile: "src/components/guest/door/shut-door.tsx",
    literal: "Only the host can let you in.",
  },
  {
    label: "album visibility password gate eyebrow",
    marketingFile:
      "src/components/marketing/sections/features/album/visibility-frames.tsx",
    appFile: "src/components/guest/password-gate.tsx",
    literal: "Almost in",
  },
  {
    // voice-guest r1 `ask=warm`. Apostrophe-free on purpose (see the cap-refusal
    // entry above): the app's reason is a plain string ("you're"), the privacy
    // page's preview card JSX text ("you&rsquo;re").
    label: "privacy page access switch password reason",
    marketingFile:
      "src/components/marketing/sections/features/privacy/access-switch.tsx",
    appFile: "src/components/guest/password-gate.tsx",
    literal: "One password and you",
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
  // The refusing verb at the door (host-curation `verb=reject`) and the review switch's line that
  // names both verdicts, quoted by the curation page (curation-wiring).
  {
    label: "curation demo reject button",
    marketingFile:
      "src/components/marketing/sections/features/curation/review-queue-demo.tsx",
    appFile: "src/components/app/event-feed/review-actions.tsx",
    literal: "Reject",
  },
  {
    label: "curation modes, the review switch's line",
    marketingFile:
      "src/components/marketing/sections/features/curation/review-modes.tsx",
    appFile: "src/components/app/event-settings/adds-page.tsx",
    literal: "Hold new photos until you approve or reject them, instead of",
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
  // (No "Save QR style" pair: the designer is a menu whose row is the act,
  // `popups` r1's `choices=menu`, so the app has no Save to quote and the mock
  // dropped its own; the swatches' words are the shared QR_PRESETS.)
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
    // Settings reads as sentences (event-settings r1): the privacy page quotes the door row's words.
    label: "privacy page, the door row's email words",
    marketingFile:
      "src/components/marketing/sections/features/privacy/never-rides-along.tsx",
    appFile: "src/lib/events/guest-experience-summary.ts",
    literal: "confirming an email",
  },
  // The live reel (`reel-sweep`, 2026-09-25): every surface that draws the reel
  // quotes the reel's own words, so a rename in the view or the hub card
  // strands no marketing picture of it. ★ Reshaped on purpose (`event-header`
  // r1, the album's head is the cover): the album's reel tile went, so the
  // reel's name is read from its one home (`EVENT_ROOMS`, which the hub's card
  // and its room wear), and the tile's own clip line went with the tile (the
  // creator's door is the view's "Make your own", pinned below).
  {
    label: "reel page live tile heading",
    marketingFile: "src/components/marketing/sections/reel/live-tile.tsx",
    appFile: "src/lib/event/sections.ts",
    literal: "Highlight reel",
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
    appFile: "src/components/app/event-settings/reel-page.tsx",
    literal: "Where every guest starts.",
  },
  {
    label: "home live demo payoff card, the reel's own heading",
    marketingFile: "src/components/marketing/sections/home/live-demo.tsx",
    appFile: "src/lib/event/sections.ts",
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
  // The clip creator's own words, wherever a marketing picture draws a clip:
  // its head (clip-room.tsx) and its laptop finish (clip-finish.tsx).
  {
    label: "reel page clip finish, the creator's head",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-room.tsx",
    literal: "Your clip",
  },
  {
    label: "reel page clip finish, the way back",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-finish.tsx",
    literal: "Back to editing, your picks kept",
  },
  {
    label: "reel page clip finish, the finish's words",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-finish.tsx",
    literal: "Your clip is ready",
  },
  {
    label: "reel page clip finish, where the file lives",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-finish.tsx",
    literal: "It&rsquo;s on this device.",
  },
  {
    label: "reel page clip finish, what leaves the device",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-finish.tsx",
    literal: "Nothing leaves it until you share it or add it.",
  },
  {
    label: "reel page clip finish, the album door",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-finish.tsx",
    literal: "Add to event",
  },
  {
    label: "reel page clip finish, starting over",
    marketingFile: "src/components/marketing/sections/reel/clip-section.tsx",
    appFile: "src/components/reel/clip-finish.tsx",
    literal: "Make another",
  },
  {
    label: "how-it-works guest clip step, the creator's head",
    marketingFile:
      "src/components/marketing/sections/how-it-works/guest-pictures.tsx",
    appFile: "src/components/reel/clip-room.tsx",
    literal: "Your clip",
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

describe("the privacy page's settings rows quote the app's own titles", () => {
  it("names each row as Settings does", () => {
    const mock = readFileSync(
      join(
        ROOT,
        "src/components/marketing/sections/features/privacy/never-rides-along.tsx",
      ),
      "utf8",
    );
    const app = readFileSync(
      join(ROOT, "src/lib/events/guest-experience-summary.ts"),
      "utf8",
    );
    for (const title of ["Who can get in", "What guests can add"]) {
      expect(mock).toContain(title);
      expect(app).toContain(title);
    }
    for (const words of [
      "Anyone with the link",
      "held until you approve them",
    ]) {
      expect(mock).toContain(words);
      expect(app).toContain(words);
    }
  });
});
