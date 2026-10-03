/**
 * THE ONE VENDOR READING WE CAN TAKE: Resend's own list of the mail it sent (`GET /emails`, newest first, 100 a page),
 * which counts every sender on the account, Supabase Auth's sign-in codes included (they ride Resend's SMTP), the
 * one mail our own tables never see. The quota headers (`x-resend-daily-quota`) come back only on a send, so a read
 * that sends nothing counts the list instead (admin-observability.md, "The spend watch": what could not be read).
 *
 * ★ A COUNT IT COULD NOT FINISH IS A FLOOR, NEVER THE COUNT: past RESEND_MAX_PAGES the reading is "at least", and a
 * list whose order is not newest first, or a time it cannot read, is no reading at all.
 */
import "server-only";

import { getResend } from "@/lib/email/client";
import { RESEND_MAX_PAGES, type ResendTaken } from "@/lib/jobs/spend-watch";

/**
 * Resend's `created_at` ("2026-10-03 01:12:29.587000+00", a Postgres timestamp) as epoch ms. Null when it is not
 * one: JavaScript's parser does not promise to read the space, the microseconds or the bare "+00".
 */
export function parseResendTime(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const m = raw.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}(?::?\d{2})?)$/,
  );
  if (!m) return null;
  const [, date, time, fraction = "0", zone] = m;
  const ms = fraction.padEnd(3, "0").slice(0, 3);
  const offset =
    zone === "Z"
      ? "Z"
      : zone.length === 3
        ? `${zone}:00`
        : zone.includes(":")
          ? zone
          : `${zone.slice(0, 3)}:${zone.slice(3)}`;
  const at = Date.parse(`${date}T${time}.${ms}${offset}`);
  return Number.isFinite(at) ? at : null;
}

/** One page of the list, as the counter needs it. */
export type ResendPage = {
  hasMore: boolean;
  items: { id: string; createdAt: unknown }[];
};

/**
 * Count the mail sent after `sinceMs`, page by page, stopping at the first one at or before it (the list is newest
 * first). PURE over its page reader, so the paging, the order check and the floor are tested without Resend.
 */
export async function countSentSince(
  sinceMs: number,
  readPage: (after: string | undefined) => Promise<ResendPage>,
  maxPages = RESEND_MAX_PAGES,
): Promise<{ count: number; atLeast: boolean }> {
  let count = 0;
  let after: string | undefined;
  let previous = Number.POSITIVE_INFINITY;
  for (let page = 0; page < maxPages; page++) {
    const { hasMore, items } = await readPage(after);
    for (const item of items) {
      const at = parseResendTime(item.createdAt);
      if (at === null) throw new Error("a sent mail's time could not be read");
      if (at > previous) throw new Error("the list is not newest first");
      previous = at;
      if (at <= sinceMs) return { count, atLeast: false };
      count += 1;
    }
    if (!hasMore || items.length === 0) return { count, atLeast: false };
    after = items[items.length - 1].id;
  }
  return { count, atLeast: true };
}

/** The last day's mail through Resend, every sender. Never throws: a reading it cannot take says why. */
export async function readResendDay(nowMs: number): Promise<ResendTaken> {
  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch {
    return { ok: false, why: "Resend is not configured in this environment" };
  }
  try {
    const sent = await countSentSince(
      nowMs - 24 * 60 * 60 * 1000,
      async (after) => {
        const { data, error } = await resend.emails.list(
          after ? { limit: 100, after } : { limit: 100 },
        );
        if (error) throw new Error(error.message);
        return {
          hasMore: data.has_more,
          items: data.data.map((e) => ({ id: e.id, createdAt: e.created_at })),
        };
      },
    );
    return { ok: true, count: sent.count, atLeast: sent.atLeast };
  } catch (e) {
    return {
      ok: false,
      why: `Resend's list could not be read: ${(e instanceof Error ? e.message : String(e)).slice(0, 160)}`,
    };
  }
}
