/**
 * THE STORAGE SUMS' ALERT MAIL (storage-sums-signal): one operator mail to the ops inbox when the night's check finds a
 * host whose sums part from her items walked, at most once a day while a drift stands (`sweepStorageSums`, beside its
 * Sentry error). An operator alert's shape in the shell every Partyreel mail wears (`email/templates.ts`): no button,
 * the tagged subject, the card's link in the foot. Ids and bytes only, never an address.
 *
 * PURE (no env, no DB), so the words are tested without a send.
 */
import { composeMail, OPERATOR_TAG, type Mail } from "@/lib/email/templates";
import type { DriftFinding } from "@/lib/lifecycle/sweeps/storage-sums-state";

/** Hosts the mail spells out, each with her figures; the card lists the rest. */
export const MAIL_HOSTS = 10;

function bytes(n: number): string {
  return `${n.toLocaleString("en-US")} bytes`;
}

/** Where one host's sums part from her walk, in words: only what disagrees. */
export function driftWords(f: DriftFinding): string {
  const parts: string[] = [];
  const pair = (name: string, sums: number, walk: number) => {
    if (sums !== walk)
      parts.push(`${name} ${bytes(sums)}, walked ${bytes(walk)}`);
  };
  pair("albums", f.summary_active, f.walk_active);
  pair("Deleted", f.summary_deleted, f.walk_deleted);
  pair("the system's", f.summary_system, f.walk_system);
  if (f.events > 0) {
    parts.push(
      `${f.events.toLocaleString("en-US")} event ${f.events === 1 ? "row" : "rows"} off her items`,
    );
  }
  if (f.total) parts.push("her total off her event rows");
  return parts.length ? parts.join("; ") : "her rows differ from her items";
}

export function storageSumsDriftEmail(opts: {
  /** The drifted hosts the run names (at most the card's list). */
  listed: DriftFinding[];
  /** Every host known drifted, listed or not. */
  drifted: number;
  jobsUrl: string;
}): Mail {
  const count = opts.drifted.toLocaleString("en-US");
  const hosts = `${count} ${opts.drifted === 1 ? "host's" : "hosts'"}`;
  const shown = opts.listed.slice(0, MAIL_HOSTS);
  const more = opts.drifted - shown.length;
  return composeMail({
    subject: `${OPERATOR_TAG} ${hosts} storage sums differ from the walk`,
    heading: "Storage sums drifted",
    blocks: [
      {
        kind: "p",
        parts: [
          "The night's check found what a host stores, as the database sums it, parting from her items walked one by one: the figures her plan's meter, her uploads' cap and her size list read. ",
          { strong: "Nothing was changed: the check never mends." },
        ],
      },
      {
        kind: "fields",
        rows: [
          ...shown.map((f) => ({ label: f.host_id, value: driftWords(f) })),
          ...(more > 0
            ? [
                {
                  label: "And",
                  value: `${more.toLocaleString("en-US")} more on the card`,
                },
              ]
            : []),
        ],
      },
      {
        kind: "p",
        parts: [
          { strong: "What to do:" },
          " open the storage sums' card and press Rebuild beside each host: her sums are made again from her items, under her lock, and she is checked again at once. A drift on many hosts at once is the sums' own trigger missing a writer, not theirs: find the writer first (",
          { code: "media_storage_sums" },
          ", database-security.md), then rebuild.",
        ],
      },
    ],
    foot: {
      line: "Partyreel operations alert (the storage sums' nightly check, lifecycle-recovery.md). Sent at most once a day while a drift stands.",
      link: { href: opts.jobsUrl, label: "Open the storage sums" },
    },
  });
}
