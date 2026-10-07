/**
 * ONE FILE, AS THE WIRE CARRIES IT: A BURST OF ONE (crumbs-90). The engine takes a burst's body alone (`burst.ts`), so
 * a test that pins one file's gates builds that file's body as it always did, and these put it on the wire the way
 * `uploadBurst` does (what a burst shares once on top, the file's own fields in `files`) and read the answer back as
 * that one file's: a refusal of the whole request as it comes, with its status; the file's own refusal at the status
 * its entry names, the entry's other fields as they are; and a landed file's entry as its body.
 */

/** What a burst says once, at the top, for every file (`uploadBurst`'s `identity`, and the forensic device). */
const SHARED_FIELDS = new Set(["session_token", "event_id", "device_uuid"]);

/** The request body of one file, as a burst of one. */
export function burstOfOne(body: Record<string, unknown>): string {
  const shared: Record<string, unknown> = {};
  const entry: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(body)) {
    (SHARED_FIELDS.has(field) ? shared : entry)[field] = value;
  }
  return JSON.stringify({ ...shared, files: [entry] });
}

/** A burst of one's answer, read as the one file's: its status and its body. */
export async function answerOfOne<T = Record<string, unknown>>(
  res: Response,
): Promise<{ status: number; body: T }> {
  const json = (await res.json()) as Record<string, unknown>;
  const files = json.files;
  if (!Array.isArray(files) || files.length !== 1) {
    return { status: res.status, body: json as T };
  }
  const file = files[0] as Record<string, unknown>;
  if (file.ok === false) {
    const { status, ...refusal } = file;
    return {
      status: typeof status === "number" ? status : res.status,
      body: refusal as T,
    };
  }
  return { status: res.status, body: file as T };
}
