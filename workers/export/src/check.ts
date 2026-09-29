/**
 * THE CHECK: what a token's zip would hold, asked BEFORE the browser takes the file.
 *
 * `export-flow` r1's `hollow=refuse` and the short zip's count both need the Worker to say what it
 * found, and the app goes blind the moment the browser's download manager takes the stream (a
 * top-level form POST: the page can never read its answer). So the app asks here first, with the
 * same token, in a `fetch` it CAN read: every item's object present, how many, and which are gone.
 * An empty answer is refused in one line and no file is sent; a short one is counted; a token this
 * Worker would refuse is said in the app's toast instead of replacing the page with "Forbidden".
 *
 * ★ READ-ONLY AND BOUNDED. It never reads a byte of an object: a small group is asked object by
 * object (`head`), a big one reads its folder's listing (`list`, a thousand keys a call, stopping
 * once it passes the group's last key), because R2 lets an invocation wait on only six calls at a
 * time: two thousand `head`s would queue for many seconds where a wedding's two folders list in two
 * calls. The token already names exactly these keys, so answering which exist tells its holder
 * nothing the zip would not.
 */
import type { ExportItem } from "./export-token";

export type CheckResult = {
  /** How many items the token names. */
  items: number;
  /** How many of them have an object to zip. */
  found: number;
  /** The media ids (a key's fourth segment) with no object, in the token's order. */
  missing: string[];
};

/** The bucket as the check uses it: two read-only calls, so a test can stand in for it. */
export type CheckBucket = {
  head(key: string): Promise<unknown>;
  list(options: { prefix: string; cursor?: string; limit?: number }): Promise<{
    objects: { key: string }[];
    truncated: boolean;
    cursor?: string;
  }>;
};

/** The check's one address on the Worker; every other path is the stream, as it always was. */
export const CHECK_PATH = "/check";

/** A group this small is asked object by object; a bigger one reads its folder's listing. */
export const HEAD_GROUP_MAX = 48;

/** R2 calls one invocation may have waiting for headers at once (Workers' own limit). */
const IN_FLIGHT = 6;

const LIST_PAGE = 1000;

/** `events/<event>/<kind>/`: the folder a key's object lives under (the layout is verified). */
const folderOf = (key: string) => key.split("/").slice(0, 3).join("/") + "/";

/** The media id a key names (`events/<event>/<kind>/<media>/<variant>.<ext>`). */
export const mediaIdOf = (key: string) => key.split("/")[3] ?? key;

function stopIfGone(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("The client left", "AbortError");
}

/** Every key of `keys` that has an object, asked one by one, six at a time. */
async function headEach(
  bucket: CheckBucket,
  keys: string[],
  signal?: AbortSignal,
): Promise<Set<string>> {
  const present = new Set<string>();
  let next = 0;
  const lane = async () => {
    while (next < keys.length) {
      stopIfGone(signal);
      const key = keys[next++];
      if ((await bucket.head(key)) !== null) present.add(key);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(IN_FLIGHT, keys.length) }, lane),
  );
  return present;
}

/**
 * Every key of `keys` (all under `folder`) that has an object, from the folder's listing. R2 lists
 * in lexicographic order, so the listing stops at the first page that reaches the group's last key
 * rather than walking a big event's every object.
 */
async function listFolder(
  bucket: CheckBucket,
  folder: string,
  keys: string[],
  signal?: AbortSignal,
): Promise<Set<string>> {
  const wanted = new Set(keys);
  const last = [...keys].sort().at(-1) ?? "";
  const present = new Set<string>();
  let cursor: string | undefined;
  for (;;) {
    stopIfGone(signal);
    const page = await bucket.list({
      prefix: folder,
      cursor,
      limit: LIST_PAGE,
    });
    for (const { key } of page.objects) if (wanted.has(key)) present.add(key);
    const reached = page.objects.at(-1)?.key ?? "";
    if (!page.truncated || !page.cursor || reached >= last) return present;
    cursor = page.cursor;
  }
}

/**
 * What the zip for `items` would hold. Throws when R2 cannot answer (the caller says so, and the
 * app goes ahead without the check), and stops as soon as `signal` says the client left.
 */
export async function checkItems(
  bucket: CheckBucket,
  items: ExportItem[],
  signal?: AbortSignal,
): Promise<CheckResult> {
  const folders = new Map<string, string[]>();
  for (const { key } of items) {
    const folder = folderOf(key);
    const group = folders.get(folder);
    if (group) group.push(key);
    else folders.set(folder, [key]);
  }

  const present = new Set<string>();
  for (const [folder, keys] of folders) {
    const found =
      keys.length <= HEAD_GROUP_MAX
        ? await headEach(bucket, keys, signal)
        : await listFolder(bucket, folder, keys, signal);
    for (const key of found) present.add(key);
  }

  const missing = items
    .filter(({ key }) => !present.has(key))
    .map(({ key }) => mediaIdOf(key));
  return { items: items.length, found: items.length - missing.length, missing };
}
