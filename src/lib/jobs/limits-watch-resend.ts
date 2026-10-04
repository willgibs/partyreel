/**
 * THE RESEND READINGS FOR THE PLAN LIMITS (admin-observability.md, "Plan limits"): Resend's own list of the mail it
 * sent (`GET /emails`, newest first, 100 a page; every sender on the account, Supabase Auth's sign-in codes included,
 * which our own `sent_emails` log never sees), counted by UTC day over the last 31 days in ONE pass: the month's mail
 * to date, the trailing week's rate, and the busiest day of the week all come from the same list. It is the spend
 * watch's seam (`spend-watch-resend.ts`) with a per-day tally, sharing its time parser and its page cap's rule.
 *
 * ★ A COUNT IT COULD NOT FINISH IS A FLOOR, NEVER THE COUNT (the seam's rule): past MAX_PAGES the reading is "at
 * least", and a list out of order or with a time it cannot read is no reading at all.
 *
 * Resend's API limit is 10 requests a second a team (resend.com/docs/knowledge-base/account-quotas-and-limits), well
 * over this sequential read.
 */
import "server-only";

import { getResend } from "@/lib/email/client";
import {
  dayKey,
  type DayValue,
  type MeterTaken,
} from "@/lib/jobs/limits-watch";
import {
  parseResendTime,
  type ResendPage,
} from "@/lib/jobs/spend-watch-resend";

const MS_DAY = 24 * 60 * 60 * 1000;
/** The window: today and the 30 days before it (a month is at most 31 days). */
const WINDOW_DAYS = 31;
/** Pages of 100 read at most: a month at the free tier's 3,000 is 30, and a 31st says "at least". */
export const LIMITS_RESEND_MAX_PAGES = 40;

/**
 * Tally the mail sent from `sinceMs` on, per UTC day, page by page, stopping at the first mail before it (the list is
 * newest first). PURE over its page reader, so the paging, the order check and the floor are tested without Resend.
 */
export async function countByDay(
  sinceMs: number,
  readPage: (after: string | undefined) => Promise<ResendPage>,
  maxPages = LIMITS_RESEND_MAX_PAGES,
): Promise<{ perDay: Map<string, number>; atLeast: boolean }> {
  const perDay = new Map<string, number>();
  let after: string | undefined;
  let previous = Number.POSITIVE_INFINITY;
  for (let page = 0; page < maxPages; page++) {
    const { hasMore, items } = await readPage(after);
    for (const item of items) {
      const at = parseResendTime(item.createdAt);
      if (at === null) throw new Error("a sent mail's time could not be read");
      if (at > previous) throw new Error("the list is not newest first");
      previous = at;
      if (at < sinceMs) return { perDay, atLeast: false };
      const day = dayKey(at);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    if (!hasMore || items.length === 0) return { perDay, atLeast: false };
    after = items[items.length - 1].id;
  }
  return { perDay, atLeast: true };
}

/** A tally as a gap-free ascending series of the window's days, today last (a day with no mail is 0: the list ran back past it). */
export function dailySeries(
  perDay: ReadonlyMap<string, number>,
  nowMs: number,
): DayValue[] {
  const days: DayValue[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const day = dayKey(nowMs - i * MS_DAY);
    days.push({ day, value: perDay.get(day) ?? 0 });
  }
  return days;
}

/** The two Resend meters, from one pass over the list. Never throws: a list it cannot read is a failed read of both. */
export async function readResendMeters(
  nowMs: number,
): Promise<{ resend_month: MeterTaken; resend_day: MeterTaken }> {
  const failed = (
    why: string,
  ): { resend_month: MeterTaken; resend_day: MeterTaken } => {
    const taken: MeterTaken = { kind: "none", cause: "failed", why };
    return { resend_month: taken, resend_day: taken };
  };
  let resend: ReturnType<typeof getResend>;
  try {
    resend = getResend();
  } catch {
    // The spend watch's own wording for the same gap: a deploy without the key.
    return failed("Resend is not configured in this environment");
  }
  try {
    const since = Date.parse(
      `${dayKey(nowMs - (WINDOW_DAYS - 1) * MS_DAY)}T00:00:00Z`,
    );
    const { perDay, atLeast } = await countByDay(since, async (after) => {
      const { data, error } = await resend.emails.list(
        after ? { limit: 100, after } : { limit: 100 },
      );
      if (error) throw new Error(error.message);
      return {
        hasMore: data.has_more,
        items: data.data.map((e) => ({ id: e.id, createdAt: e.created_at })),
      };
    });
    const days = dailySeries(perDay, nowMs);
    // Past the page cap the oldest days are short: every figure is a floor.
    const taken: MeterTaken = {
      kind: "days",
      days,
      ...(atLeast ? { atLeast: true } : {}),
    };
    return { resend_month: taken, resend_day: taken };
  } catch (e) {
    return failed(
      `Resend's list could not be read: ${(e instanceof Error ? e.message : String(e)).slice(0, 160)}`,
    );
  }
}
