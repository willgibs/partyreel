import { describe, expect, it } from "vitest";

import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_REEL_SECONDS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_UPLOAD_BYTES, MIN_UPLOAD_CAP_BYTES } from "@/lib/media/limits";
import { UNLOCK_TTL_SECONDS } from "@/lib/events/unlock-token";
import { formatBytes } from "@/lib/utils";

import { getAllArticles } from "./help";

/**
 * Fails when a help article's frontmatter `description` names a marketed
 * number (a size, a price, or a lifecycle window) that has drifted from the
 * constant it describes.
 *
 * WHY: rule 4 of content/help/AUTHORING.md routes every marketed number in an
 * article BODY through a spec component (<UploadSize />, <RecoveryDays />, ...)
 * reading tiers.ts / limits.ts / lifecycle/*, so a constant change fails the
 * build rather than shipping a stale number. The frontmatter `description`
 * cannot hold a component (MDX compiles frontmatter as plain YAML), so ten
 * descriptions type their number by hand — this test is their spec component:
 * it ties each typed number to the live constant, so a changed constant fails
 * HERE instead of quietly lying in search results and the ⌘K palette.
 *
 * This never pins the surrounding prose, only that the constant-derived
 * substring appears somewhere in the description: copy is judged where it
 * reads, so rewording the sentence around a number is free, and drifting the
 * number from its constant is not.
 */
describe("help article descriptions match their lifecycle/tier constants", () => {
  const bySlug = new Map(
    getAllArticles().map((a) => [a.slug, a.frontmatter.description]),
  );
  // Pinned for non-emptiness (the content-policy-test lesson): a catalog that
  // failed to load would otherwise make every case below vacuously "missing".
  expect(bySlug.size).toBeGreaterThan(0);

  const free = planById("free");
  const pass = planById("event_pass");
  const proPlans = plansForTier("pro");
  const proRange = `${formatBytes(proPlans[0].storageBytes)} to ${formatBytes(proPlans[proPlans.length - 1].storageBytes)}`;
  // Mirrors spec-shared.tsx's EventPassTerm exactly (the same source, the same
  // rounding), so a term that stops reading as "about a year" fails both places.
  const passTermDays = pass.termDays ?? 365;
  const passTerm =
    passTermDays >= 360 && passTermDays <= 370
      ? "about a year"
      : `${passTermDays} days`;
  // Mirrors spec-shared.tsx's UnlockHours rounding.
  const unlockHours = Math.round(UNLOCK_TTL_SECONDS / 3600);

  const cases: { slug: string; expect: string[] }[] = [
    {
      slug: "hide-remove-and-restore",
      expect: [`${RECENTLY_DELETED_WINDOW_DAYS} days`],
    },
    {
      slug: "how-long-media-is-kept",
      expect: [passTerm, `${RECENTLY_DELETED_WINDOW_DAYS} days`],
    },
    {
      slug: "moderate-and-curate-your-album",
      expect: [`${RECENTLY_DELETED_WINDOW_DAYS} days`],
    },
    {
      slug: "password-protect-your-event",
      expect: [`${unlockHours} hours`],
    },
    {
      slug: "what-happens-when-storage-fills-up",
      expect: [`${OVER_CAP_GRACE_DAYS} days`],
    },
    {
      slug: "turn-off-uploads-or-cap-file-size",
      expect: [formatBytes(MIN_UPLOAD_CAP_BYTES)],
    },
    {
      slug: "what-the-free-plan-includes",
      expect: [formatBytes(free.storageBytes), `${MAX_REEL_SECONDS.free}-second`],
    },
    {
      slug: "how-long-an-event-pass-lasts",
      expect: [
        formatBytes(pass.storageBytes),
        passTerm,
        EVENT_PASS_RENEWAL_PRICE_LABEL,
      ],
    },
    {
      slug: "pro-vs-event-pass",
      expect: [proRange, formatBytes(pass.storageBytes), passTerm],
    },
    {
      slug: "what-you-can-upload",
      expect: [formatBytes(MAX_UPLOAD_BYTES)],
    },
  ];
  // Pinned so a slug rename silently dropping a case is itself a failure,
  // matching the ten the ROADMAP line named.
  expect(cases.length).toBe(10);

  for (const { slug, expect: needles } of cases) {
    it(`${slug}: description matches its constant(s)`, () => {
      const description = bySlug.get(slug);
      expect(description, `${slug} is not in the help catalog`).toBeDefined();
      for (const needle of needles) {
        expect(
          description,
          `"${slug}" description should contain "${needle}" (from its constant) but reads: "${description}"`,
        ).toContain(needle);
      }
    });
  }
});
