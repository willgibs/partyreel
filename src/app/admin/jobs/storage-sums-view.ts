/**
 * WHAT THE STORAGE SUMS' CARD SAYS (storage-sums-signal; lifecycle-recovery.md, the purge cron's last sweep), decided
 * from the check's record (`readLatestStorageSumsCounts`: the newest run that wrote one, a Rebuild's included): where
 * its pass through every host stands, when one last ended, and each host whose sums part from her items walked, in
 * words, beside her Rebuild. PURE, under test.
 *
 * WHY A PASS, NOT A RUN (the reconcile's reason, reconcile-view.ts): the check carries a cursor, so a pass can span
 * nights; a run that closes every day can belong to a pass that never ends, so the card says how far it has come and
 * when one last ended, and a pass that stalls reads as one (each night it stops early reads Needs a look).
 */
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import {
  readStorageSumsState,
  STORAGE_SUMS_KEYS,
  type DriftFinding,
} from "@/lib/lifecycle/sweeps/storage-sums-state";
import { formatBytes } from "@/lib/utils";

/** A line of the card: work done, something that waits on a person, or a quiet fact. */
export type StorageSumsLine = {
  tone: "done" | "attention" | "quiet";
  text: string;
};

/** One drifted host, as the card lists her. */
export type DriftedHostView = {
  hostId: string;
  /** Where her sums part from her walk, one clause each: only what disagrees. */
  differs: string[];
  /** When a check first found her drifted. */
  since: string;
};

export type StorageSumsView = {
  pass: StorageSumsLine;
  lastPass: StorageSumsLine;
  hosts: DriftedHostView[];
  /** Drifted hosts past the list, counted (named again as the pass reaches them). */
  more: number;
} | null;

function hosts(n: number): string {
  return `${formatCount(n)} ${n === 1 ? "host" : "hosts"}`;
}

/** A figure as the card reads it: its size, and the exact bytes beside it where the size rounds (a drift can be a byte). */
function exact(n: number): string {
  const bytes = `${n.toLocaleString("en-US")} B`;
  return n < 1024 ? bytes : `${formatBytes(n)} (${bytes})`;
}

/** Her two figures, the sums' and the walk's, when they differ. */
function pair(name: string, sums: number, walk: number): string | null {
  if (sums === walk) return null;
  return `${name} ${exact(sums)} by the sums, ${exact(walk)} walked`;
}

export function differsOf(f: DriftFinding): string[] {
  const out = [
    pair("Albums", f.summary_active, f.walk_active),
    pair("Deleted", f.summary_deleted, f.walk_deleted),
    pair("The system's share", f.summary_system, f.walk_system),
  ].filter((line): line is string => line !== null);
  if (f.events > 0) {
    out.push(
      `${formatCount(f.events)} of her event rows ${f.events === 1 ? "differs" : "differ"} from her items by event`,
    );
  }
  if (f.total) out.push("Her total differs from her event rows");
  // Every figure agreeing yet named drifted means the rows under them do: say so rather than show nothing.
  return out.length ? out : ["Her sum rows differ from her items"];
}

export function storageSumsView(counts: unknown): StorageSumsView {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const c = counts as Record<string, unknown>;
  // A row from before the check's record (or not this check's) has nothing to say: the raw counts stand.
  if (typeof c[STORAGE_SUMS_KEYS.passChecked] !== "number") return null;
  const state = readStorageSumsState(counts);
  const listed = state.findings.map(
    (f): DriftedHostView => ({
      hostId: f.host_id,
      differs: differsOf(f),
      since: f.since,
    }),
  );

  const complete = state.passComplete;
  const drifted = listed.length + state.unlisted;
  const pass: StorageSumsLine = complete
    ? drifted === 0
      ? {
          tone: "done",
          text: `Complete: ${hosts(state.passChecked)} checked, every one's sums the walk`,
        }
      : {
          tone: "attention",
          text: `Complete: ${hosts(state.passChecked)} checked, ${hosts(drifted)} drifted (below)`,
        }
    : {
        tone: "attention",
        text:
          `In progress: ${hosts(state.passChecked)} checked` +
          (state.passStartedAt
            ? ` since ${formatAdminTimestamp(state.passStartedAt)}`
            : "") +
          (state.remaining !== null
            ? `, ${formatCount(state.remaining)} left`
            : "") +
          "; the next run carries on",
      };
  const lastPass: StorageSumsLine = state.lastPassAt
    ? {
        tone: "quiet",
        text:
          formatAdminTimestamp(state.lastPassAt) +
          (state.lastPassChecked !== null
            ? `, ${hosts(state.lastPassChecked)}`
            : ""),
      }
    : { tone: "attention", text: "None has reached the last host yet" };

  return { pass, lastPass, hosts: listed, more: state.unlisted };
}
