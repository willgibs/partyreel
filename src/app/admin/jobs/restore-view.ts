/**
 * WHAT THE BACKUP RESTORE'S CARD SAYS OF ITS LAST PASS (durability-backups.md, "The restore"), decided from the pass's
 * report as the Worker sent it (`counts`, workers/backup/src/restore-run.ts and restore-pass.ts): its mode, what it
 * copied back, what it could not and why, what it left alone. PURE, under test.
 *
 * ★ THE KEYS ARE A CROSS-PACKAGE CONTRACT: the Worker writes `restore_mode`, `restored`, `restored_bytes`,
 * `would_restore`, `failed`, `too_large`, `backup_missing`, `present`, `unnamed`, `remaining` and `checked`, and
 * cannot import this module (a separate package), so each side's suite asserts the same strings.
 */
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";

export type RestoreMode = "on" | "dryrun" | "off";

/** A line of the card: work done, something that waits on a person, or a quiet fact. */
export type RestoreLine = {
  tone: "done" | "attention" | "quiet";
  text: string;
};

export type RestoreView = {
  mode: RestoreMode;
  modeWords: string;
  lines: RestoreLine[];
} | null;

/** What each RESTORE_MODE does, in the operator's words. */
export const RESTORE_MODE_WORDS: Record<RestoreMode, string> = {
  on: "On: it copies the backup's lone copies back",
  dryrun:
    "Dry run: it copies nothing and says what it would (RESTORE_MODE on copies)",
  off: "Off: it does nothing (RESTORE_MODE)",
};

export function restoreView(counts: unknown): RestoreView {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const c = counts as Record<string, unknown>;
  const mode = c.restore_mode;
  if (mode !== "on" && mode !== "dryrun" && mode !== "off") return null;
  const n = (key: string) => countOf(c[key]) ?? 0;

  const lines: RestoreLine[] = [];
  const restored = n("restored");
  if (restored > 0) {
    const bytes = n("restored_bytes");
    lines.push({
      tone: "done",
      text: `Restored ${keys(restored)}${bytes > 0 ? ` (${formatBytes(bytes)})` : ""}`,
    });
  }
  const would = n("would_restore");
  if (would > 0) {
    lines.push({
      tone: "attention",
      text: `Would restore ${keys(would)}: RESTORE_MODE on copies them back`,
    });
  }
  const failed = n("failed");
  if (failed > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(failed)} failed to copy: the next pass tries again (its note says why)`,
    });
  }
  const tooLarge = n("too_large");
  if (tooLarge > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(tooLarge)} over the 4.99 GB one conditional write takes: copy by hand`,
    });
  }
  const lost = n("backup_missing");
  if (lost > 0) {
    lines.push({
      tone: "attention",
      text: `${keys(lost)} gone from the backup too: a row names an object neither bucket holds`,
    });
  }
  const remaining = n("remaining");
  if (remaining > 0) {
    lines.push({
      tone: "attention",
      text: `Stopped with ${keys(remaining)} to go: the next pass carries on`,
    });
  }
  const present = n("present");
  if (present > 0) {
    lines.push({
      tone: "quiet",
      text: `${keys(present)} in the primary already, left as they are`,
    });
  }
  const unnamed = n("unnamed");
  if (unnamed > 0) {
    lines.push({
      tone: "quiet",
      text: `${keys(unnamed)} named by no live row, left alone`,
    });
  }
  if (mode !== "off" && lines.length === 0 && n("checked") === 0) {
    lines.push({ tone: "quiet", text: "Nothing was held by the backup alone" });
  }
  return { mode, modeWords: RESTORE_MODE_WORDS[mode], lines };
}

function keys(count: number): string {
  return `${formatCount(count)} ${count === 1 ? "key" : "keys"}`;
}

/** A count it can read, or null: a missing number is unknown, never a zero. */
function countOf(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}
