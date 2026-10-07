/**
 * THE STORAGE SUMS' NIGHTLY CHECK (storage-sums-signal; the Advisor's condition on upload_sums for milestone 39): the
 * purge cron's last budgeted sweep, a job of its own (`storage_sums`: its run row, its switch, its card). Each night it
 * holds every host's storage sums (what her plan's meter, every upload's cap check and her size list read) to her items
 * walked one by one, through `storage_sums_drift`, and says so when they part. It never mends: the card's Rebuild is
 * the fix, the operator's to press (`rebuild_storage_sums`), and the check is the proof the trigger keeps them exact.
 *
 * HOW A RUN GOES:
 *   1. The hosts the last run named are checked again first, one call each, so a drift stays named until a check reads
 *      her at parity (or her account is gone), however far the pass has to go before it reaches her again.
 *   2. The pass: hosts in id order from where the last run stopped (from the first when the last pass ended), a page
 *      of `DRIFT_PAGE` a call, the deadline asked before each call and never inside one. Reaching the last host ends
 *      the pass (`pass_complete`, `last_pass_at`); a deadline stops it with its cursor (`resume_after`) and what it
 *      left (`remaining`), and the next night carries on from there. It writes nothing, so a stop costs nothing.
 *   3. The verdict: any host known drifted fails the run (`rows_failed`, the runner's rule: a broken figure never
 *      closes green), the hosts and both figures on its row (`findings`), one Sentry error, and the ops mail at most once
 *      a day while a drift stands; a mail that fails never costs the run its row.
 *
 * LAST OF THE BUDGETED SWEEPS: it reads the sums every sweep before it moved (the purge's deletes, the reduce, an
 * account's deletion), so a night's own writes are checked the same night, and it takes what the window leaves.
 */
import "server-only";

import { ADMIN_HOST } from "@/lib/auth/admin-host";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";
import {
  countHostsAfter,
  readDriftPage,
  recheckHost,
} from "@/lib/db/queries/storage-sums";
import { sendOnce } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { RESUME_KEY } from "@/lib/jobs/sweep-tally";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";
import { storageSumsDriftEmail } from "@/lib/lifecycle/sweeps/storage-sums-mail";
import {
  DRIFT_PAGE,
  EMPTY_STATE,
  FINDINGS_KEY,
  STORAGE_SUMS_KEYS,
  driftNote,
  findingOf,
  listFindings,
  type DriftFinding,
  type StorageSumsState,
} from "@/lib/lifecycle/sweeps/storage-sums-state";
import { captureError } from "@/lib/observability/sentry";

/** What one run hands its row (the runner keeps it through `storageSumsCounts`). */
export type StorageSumsTally = {
  /** Hosts this run checked: the pass's pages and the re-checks of the last run's list. */
  checked: number;
  /** Hosts known drifted after this run, listed or not. */
  drifted: number;
  /** The same count, under the key the runner closes a run ERROR on. */
  rows_failed: number;
  /** The run's note when something drifted (never stored in `counts`). */
  rows_note?: string;
  /** The drifted hosts, at most `FINDINGS_MAX`, each with both figures. */
  [FINDINGS_KEY]?: DriftFinding[];
  /** Drifted hosts past the list, counted. */
  unlisted?: number;
  pass_started_at: string;
  pass_checked: number;
  pass_complete: boolean;
  last_pass_at?: string;
  last_pass_checked?: number;
  [RESUME_KEY]?: string;
} & Partial<StoppedEarly>;

/** The card's own link, on the admin host where there is one (the ops mail's foot). */
function jobsUrl(): string {
  return ADMIN_HOST
    ? `https://${ADMIN_HOST}/admin/jobs#job-storage_sums`
    : `${SITE_URL}/admin/jobs#job-storage_sums`;
}

export async function sweepStorageSums(
  admin: AdminClient,
  now: Date,
  opts: {
    deadline?: Deadline;
    /** What the last run left (`readStorageSumsState`): its cursor, its pass and the hosts it named. */
    previous?: StorageSumsState | null;
    /** Hosts a call; a test shrinks it. */
    page?: number;
  } = {},
): Promise<StorageSumsTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const page = opts.page ?? DRIFT_PAGE;
  const previous = opts.previous ?? EMPTY_STATE;
  const nowIso = now.toISOString();
  let checked = 0;

  // 1. The last run's list, checked again first. One the deadline leaves unchecked stays as it was named.
  const carried: DriftFinding[] = [];
  for (const finding of previous.findings) {
    if (deadline.passed()) {
      carried.push(finding);
      continue;
    }
    const recheck = await recheckHost(admin, finding.host_id);
    checked += 1;
    if (recheck.kind === "drifted") {
      carried.push(findingOf(recheck.host, finding.since));
    }
  }

  // 2. The pass, from where the last one stopped. A new pass begins when the last one ended (no cursor).
  const resuming = previous.resumeAfter !== null;
  const passStartedAt = resuming ? (previous.passStartedAt ?? nowIso) : nowIso;
  let passChecked = resuming ? previous.passChecked : 0;
  const found: DriftFinding[] = [];
  let after = previous.resumeAfter;
  let complete = false;
  let stop: StoppedEarly | null = null;
  for (;;) {
    if (deadline.passed()) {
      stop = stoppedEarly(await countHostsAfter(admin, after));
      break;
    }
    const answer = await readDriftPage(admin, after, page);
    checked += answer.checked;
    passChecked += answer.checked;
    for (const host of answer.drifted) found.push(findingOf(host, nowIso));
    if (answer.nextAfter === null) {
      complete = true;
      break;
    }
    after = answer.nextAfter;
  }

  // 3. Who is known drifted: the list checked again, and what the pass found (deduplicated, first-found kept). The hosts
  // the last run counted past its list have no id to check again, so they stay counted until a whole pass of this run
  // (from the first host to the last) has met every host: a count past the list errs high, never low.
  const { listed, unlisted } = listFindings([...carried, ...found]);
  const unnamedBefore = !resuming && complete ? 0 : previous.unlisted;
  const drifted = listed.length + unlisted + unnamedBefore;

  const tally: StorageSumsTally = {
    checked,
    drifted,
    rows_failed: drifted,
    pass_started_at: passStartedAt,
    pass_checked: passChecked,
    pass_complete: complete,
    ...(listed.length ? { [FINDINGS_KEY]: listed } : {}),
    ...(unlisted + unnamedBefore > 0
      ? { [STORAGE_SUMS_KEYS.unlisted]: unlisted + unnamedBefore }
      : {}),
    ...(complete
      ? { last_pass_at: nowIso, last_pass_checked: passChecked }
      : {
          ...(previous.lastPassAt ? { last_pass_at: previous.lastPassAt } : {}),
          ...(previous.lastPassChecked !== null
            ? { last_pass_checked: previous.lastPassChecked }
            : {}),
        }),
    ...(stop ?? {}),
    ...(!complete && after !== null ? { [RESUME_KEY]: after } : {}),
  };
  if (drifted === 0) return tally;

  tally.rows_note = driftNote(drifted);
  await raise(listed, drifted, now);
  return tally;
}

/**
 * LOUD AT ITS SOURCE: one Sentry error a run naming the hosts by id and both figures (Sentry scrubs, and an id is no
 * address), and the ops mail at most once a day while a drift stands, deduplicated on the run's day. A mail that cannot
 * go is its own Sentry event and never costs the run its row.
 */
async function raise(
  listed: DriftFinding[],
  drifted: number,
  now: Date,
): Promise<void> {
  captureError("cron", new Error("storage sums drift from the walk"), {
    sweep: "storage_sums",
    drifted,
    listed: listed.length,
    hosts: listed.map((f) => ({
      host_id: f.host_id,
      summary: [f.summary_active, f.summary_deleted, f.summary_system],
      walk: [f.walk_active, f.walk_deleted, f.walk_system],
      events: f.events,
      total: f.total,
    })),
  });
  try {
    const mail = storageSumsDriftEmail({
      listed,
      drifted,
      jobsUrl: jobsUrl(),
    });
    await sendOnce({
      kind: "storage_sums",
      dedupeKey: `storage-sums:${now.toISOString().slice(0, 10)}`,
      to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (e) {
    captureError("cron", e, { sweep: "storage_sums", phase: "drift_alert" });
  }
}
