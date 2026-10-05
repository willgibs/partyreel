/**
 * ONE PAGE OF A SEND'S CLOSING CHECK (drive-export.md, "The closing check, for the page"): every sent file asked for by
 * its id (wherever she moved it), at most eight at once. Confirmed when it is there, out of the bin, its size ours and
 * its MD5 ours where both are known; missing, binned or not what we sent otherwise; unknown when Google would not say
 * (it stays sent, unconfirmed: a page never resends on a doubt). The album's folder in her bin pauses the send
 * (`folder_gone`) rather than resending the album. The first page also counts duplicates in the album's folder (two
 * files of one original after a lost lease), counted and signalled, never binned: a copy she made on purpose carries
 * our marks too.
 *
 * It decides her page and nothing else: nothing anywhere deletes on its word.
 */
import { DriveError, type DriveAdapter } from "./google-drive";
import type { CheckItem, CheckResult } from "./protocol";

/** How many Drive asks run at once (a page of 100 in about two seconds, well inside Google's per-user pace). */
export const CHECK_CONCURRENCY = 8;

/** At most this many folder pages are listed for duplicates (a million files). */
export const LIST_PAGE_CAP = 1000;

export type CheckOutcome = { results: CheckResult[]; duplicates?: number; finding?: "folder_gone" };

async function confirm(drive: DriveAdapter, token: string, item: CheckItem): Promise<CheckResult> {
  try {
    const file = await drive.getFile(token, item.fileId);
    if (!file) return { mediaId: item.mediaId, state: "missing" };
    if (file.trashed) return { mediaId: item.mediaId, state: "trashed" };
    if (file.size !== null && file.size !== item.bytes) return { mediaId: item.mediaId, state: "mismatch" };
    if (item.md5 && file.md5 && item.md5 !== file.md5) return { mediaId: item.mediaId, state: "mismatch" };
    return { mediaId: item.mediaId, state: "ok" };
  } catch (e) {
    return { mediaId: item.mediaId, state: e instanceof DriveError && e.kind === "not_found" ? "missing" : "unknown" };
  }
}

/** Count the originals that have more than one file in the folder (one list, every page, our marks only). */
async function countDuplicates(drive: DriveAdapter, token: string, folderId: string): Promise<number | undefined> {
  const seen = new Map<string, number>();
  let pageToken: string | null = null;
  try {
    for (let page = 0; page < LIST_PAGE_CAP; page++) {
      const { media, next } = await drive.listFolderMedia(token, folderId, pageToken);
      for (const m of media) seen.set(m, (seen.get(m) ?? 0) + 1);
      if (!next) break;
      pageToken = next;
    }
  } catch {
    return undefined;
  }
  let duplicates = 0;
  for (const count of seen.values()) if (count > 1) duplicates += count - 1;
  return duplicates;
}

export async function checkPage(input: {
  drive: DriveAdapter;
  token: string;
  folderId: string;
  first: boolean;
  items: CheckItem[];
}): Promise<CheckOutcome> {
  const { drive, token, folderId } = input;
  const folder = await drive.folderState(token, folderId).catch(() => "ok" as const);
  if (folder !== "ok") return { results: [], finding: "folder_gone" };

  const results: CheckResult[] = new Array(input.items.length);
  let next = 0;
  const worker = async () => {
    while (next < input.items.length) {
      const index = next++;
      results[index] = await confirm(drive, token, input.items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CHECK_CONCURRENCY, input.items.length) }, worker));

  const duplicates = input.first ? await countDuplicates(drive, token, folderId) : undefined;
  return { results, ...(duplicates !== undefined ? { duplicates } : {}) };
}
