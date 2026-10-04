import { Fragment } from "react";

import { RANGE_DASH } from "@/lib/utils";

/**
 * A DATE RANGE, DRAWN WITH ITS DASH FOR THE EYE AND ITS "TO" FOR EVERYONE ELSE (Q2, Will 2026-10-04: "a date range is
 * spoken with 'to'"). `formatEventDate` and the dashboard's clock (`lib/dashboard/when.ts`) write a range with an en
 * dash, closed up between single terms ("October 3–5, 2026", "Fri–Sun") and spaced where a side holds a space
 * ("October 30 – November 2"), and a screen reader says nothing for it (`dashRange` holds the measurement). So a
 * range is never drawn as bare text: each dash is hidden from a reader and a visually hidden "to" stands beside it,
 * which reads "October 3 to 5, 2026" aloud while the screen shows what it always showed.
 *
 * ★ ONE FORM, WHEREVER A RANGE RENDERS. It takes the formatter's own string and cuts it at its dashes, so nothing
 * that builds a range needs a second, spoken twin to keep in step, and a day with no dash is returned as it came
 * (the same text node, not a wrapper). Pass only a date formatter's output: an en dash anywhere else is a dash.
 *
 * ★ A RANGE IS ONE ITEM TO ITS PARENT. Cut into pieces, a bare fragment would become several flex items in a parent
 * that lays out with a gap, so a range comes wrapped in one inline span, which is what the unbroken text was.
 *
 * ★ THE HIDDEN "TO" IS NEVER COPIED: it is `select-none`, so a range selected on the screen pastes as the screen
 * shows it. An attribute or sentence takes `spokenRange` (`lib/utils.ts`) instead, which has no markup to ride.
 */
export function RangeText({ text }: { text: string }) {
  const pieces = text.split(RANGE_DASH);
  if (pieces.length === 1) return <>{text}</>;
  return (
    <span data-range="">
      {pieces.map((piece, i) =>
        // The split keeps each dash between its terms: the odd pieces are the dashes.
        i % 2 === 1 ? (
          <Fragment key={i}>
            <span aria-hidden="true">{piece}</span>
            <span className="sr-only select-none"> to </span>
          </Fragment>
        ) : (
          <Fragment key={i}>{piece}</Fragment>
        ),
      )}
    </span>
  );
}
