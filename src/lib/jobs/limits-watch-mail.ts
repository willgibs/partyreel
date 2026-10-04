/**
 * THE PLAN LIMITS' ALERT MAIL (admin-observability.md, "Plan limits"): one operator mail to the ops inbox when a meter
 * crosses a threshold, in the shell every Partyreel mail wears (`email/templates.ts`, "one shell for all"), sent once a
 * crossing through `sendOnce` (the run decides what is new, `limits-watch.ts`'s `planCrossings`). It is an operator
 * alert's shape: no button, the tagged subject, the jobs console in the foot.
 *
 * PURE (no env, no DB), so the words are tested without a send.
 */
import { composeMail, OPERATOR_TAG, type Mail } from "@/lib/email/templates";
import {
  CRITICAL_DAYS,
  CRITICAL_SHARE,
  LEVEL_WORD,
  WARN_DAYS,
  WARN_SHARE,
  daysLeftWords,
  meterName,
  rateWords,
  usedWords,
  type Crossing,
} from "@/lib/jobs/limits-watch";
import { meterById } from "@/lib/jobs/limits-watch-limits";

type Parts = Parameters<typeof composeMail>[0];

const pct = (share: number) => `${Math.round(share * 100)}%`;

/** The subject's names: the first three, then a count, so a first run that finds many still reads in one line. */
function namesOf(crossings: readonly Crossing[]): string {
  const names = crossings.map((c) => {
    const def = meterById(c.id);
    return `${def ? meterName(def) : c.id} ${c.level === "critical" ? "critical" : "warning"}`;
  });
  return names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
}

export function limitsWatchEmail(opts: {
  crossings: readonly Crossing[];
  jobsUrl: string;
}): Mail {
  const critical = opts.crossings.some((c) => c.level === "critical");
  const rows = opts.crossings.map((c) => {
    const def = meterById(c.id);
    if (!def) return { label: c.id, value: LEVEL_WORD[c.level] };
    // The climb and what is left at it (a daily meter says it resets; one still warming says so).
    const climb = [rateWords(def, c.assessed), daysLeftWords(def, c.assessed)]
      .filter((w): w is string => !!w)
      .join(". ");
    return {
      label: `${meterName(def)} (${LEVEL_WORD[c.level]})`,
      value: `${usedWords(def, c.assessed)}. ${climb}.${def.estimated ? " Estimated: it is computed, not reported." : ""}`,
    };
  });
  // What breaking each limit does, once for each wording (a vendor's meters share one).
  const past = [
    ...new Set(
      opts.crossings
        .map((c) => meterById(c.id)?.past)
        .filter((p): p is string => !!p),
    ),
  ];
  const blocks: Parts["blocks"] = [
    {
      kind: "p",
      parts: [
        "A vendor's plan meter crossed a threshold since the last reading: a warning at ",
        pct(WARN_SHARE),
        ` of its limit (or ${WARN_DAYS} days left at this week's rate), `,
        {
          strong: `critical at ${pct(CRITICAL_SHARE)} (or ${CRITICAL_DAYS} days left).`,
        },
      ],
    },
    { kind: "fields", rows },
    ...past.map((line): Parts["blocks"][number] => ({
      kind: "p",
      parts: [{ strong: "If it is passed: " }, line],
    })),
    {
      kind: "p",
      parts: [
        { strong: "What to check:" },
        " each meter's line on the jobs page says where its number comes from and how fast it is climbing.",
      ],
    },
  ];
  return composeMail({
    subject: `${OPERATOR_TAG} Plan limits: ${namesOf(opts.crossings)}`,
    heading: critical
      ? "A plan limit is nearly reached"
      : "A plan limit is closing in",
    blocks,
    foot: {
      line: "Partyreel operations alert (the plan limits, admin-observability.md). Sent when a meter crosses a threshold, never daily.",
      link: { href: opts.jobsUrl, label: "Open the plan limits" },
    },
  });
}
