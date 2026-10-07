/**
 * THE STORAGE SUMS' ALERT MAIL (storage-sums-signal): the tagged subject counting hosts, each listed host by id with
 * only what disagrees, the rest pointed at the card, the remedy, and never an address.
 */
import { describe, expect, it } from "vitest";

import { OPERATOR_TAG } from "@/lib/email/templates";
import {
  MAIL_HOSTS,
  driftWords,
  storageSumsDriftEmail,
} from "@/lib/lifecycle/sweeps/storage-sums-mail";
import type { DriftFinding } from "@/lib/lifecycle/sweeps/storage-sums-state";

const host = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function finding(n: number, over: Partial<DriftFinding> = {}): DriftFinding {
  return {
    host_id: host(n),
    summary_active: 1_000,
    summary_deleted: 40,
    summary_system: 0,
    walk_active: 1_000,
    walk_deleted: 40,
    walk_system: 0,
    events: 0,
    total: false,
    since: "2026-10-07T04:01:00.000Z",
    ...over,
  };
}

describe("driftWords", () => {
  it("says only what disagrees, both figures exact", () => {
    expect(driftWords(finding(1, { summary_active: 1_012 }))).toBe(
      "albums 1,012 bytes, walked 1,000 bytes",
    );
    expect(
      driftWords(finding(1, { summary_system: 5, events: 2, total: true })),
    ).toBe(
      "the system's 5 bytes, walked 0 bytes; 2 event rows off her items; her total off her event rows",
    );
    expect(driftWords(finding(1))).toBe("her rows differ from her items");
  });
});

describe("storageSumsDriftEmail", () => {
  it("tags and counts the subject, lists each host by id, and points at the card", () => {
    const mail = storageSumsDriftEmail({
      listed: [finding(1, { summary_deleted: 41 })],
      drifted: 1,
      jobsUrl: "https://admin.partyreel.com/admin/jobs#job-storage_sums",
    });
    expect(mail.subject).toBe(
      `${OPERATOR_TAG} 1 host's storage sums differ from the walk`,
    );
    expect(mail.text).toContain(
      `${host(1)}: Deleted 41 bytes, walked 40 bytes`,
    );
    expect(mail.text).toContain("Nothing was changed: the check never mends.");
    expect(mail.text).toContain("press Rebuild beside each host");
    expect(mail.text).toContain(
      "Open the storage sums: https://admin.partyreel.com/admin/jobs#job-storage_sums",
    );
    expect(mail.html).toContain(host(1));
    expect(mail.text).not.toMatch(/@(?!partyreel)/);
  });

  it(`spells out at most ${MAIL_HOSTS} hosts and counts the rest onto the card`, () => {
    const listed = Array.from({ length: 25 }, (_, i) =>
      finding(i + 1, { summary_active: 1_001 }),
    );
    const mail = storageSumsDriftEmail({
      listed,
      drifted: 40,
      jobsUrl: "https://x/admin/jobs",
    });
    expect(mail.subject).toContain("40 hosts' storage sums");
    expect(mail.text).toContain(host(MAIL_HOSTS));
    expect(mail.text).not.toContain(host(MAIL_HOSTS + 1));
    expect(mail.text).toContain(`And: ${40 - MAIL_HOSTS} more on the card`);
  });
});
