import type { CSSProperties } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { StatBand } from "@/components/marketing/system/stat-band";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

/**
 * The durability section, framed "boring on purpose": the storage facts as a
 * calm numbered document (mono figures, hairline rules, zero photography), the
 * quietest register on the site's quietest page. Every line is a shipped,
 * verified behavior; the fenced claims (E2EE, PITR, compliance badges,
 * multi-cloud) are deliberately absent. The recovery-window number derives
 * from lib/lifecycle/recently-deleted.ts so this page can never drift from
 * what the purge cron actually enforces.
 */

const WINDOW = RECENTLY_DELETED_WINDOW_DAYS;

const FACTS: string[] = [
  "Every file is copied to a second storage bucket in a different region within seconds of arriving.",
  "The backup copy is write-once. For at least 35 days, nothing can overwrite or delete it.",
  "A daily sweep compares the two buckets and re-copies anything the live copy missed.",
  "The database is backed up daily to separate off-site storage, and restores are verified, not assumed.",
  "Automated cleanup can never wipe the media store. A circuit breaker halts any run that reaches too far.",
  `Deleted media waits ${WINDOW} days in a recovery bin and restores exactly as it was.`,
  "Events have no expiry date. The album stays up until you delete it.",
];

export function MediaLives() {
  return (
    <SectionShell
      width="narrow"
      eyebrow="Storage"
      heading="Boring, on purpose."
      subhead="Where your media lives is the least exciting part of Partyreel. We work hard to keep it that way."
    >
      <Reveal className="mx-auto mt-12 max-w-2xl">
        <ol className="divide-y rounded-xl border bg-card/40">
          {FACTS.map((fact, i) => (
            <li
              key={fact}
              data-mkt-reveal
              className="flex items-baseline gap-5 px-5 py-4"
              style={{ "--i": i } as CSSProperties}
            >
              <span className="font-mono text-xs tracking-wide text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-relaxed">{fact}</p>
            </li>
          ))}
        </ol>
      </Reveal>
      <Reveal className="mt-14">
        <StatBand
          stats={[
            { value: 2, label: "Storage regions" },
            { value: 35, suffix: "-day", label: "Write-once backup" },
            { value: WINDOW, suffix: "-day", label: "Recovery bin" },
          ]}
        />
      </Reveal>
    </SectionShell>
  );
}
