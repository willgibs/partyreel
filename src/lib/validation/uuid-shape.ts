import { z } from "zod";

/**
 * AN ID FROM A PATH HAS A UUID'S SHAPE BEFORE ANY READ TAKES IT (build 33's red-team).
 *
 * A route's id is a segment anybody can type, truncate or mangle. `/dashboard/not-a-uuid` reached
 * `.eq("id", …)`, Postgres refused the cast (22P02), the read threw, and the page drew "Something went
 * wrong" with no title and filed an error each hit (the portal's album and account pages answered 500),
 * where a well-formed id that names nothing draws the surface's not-found. Asked first, a malformed id is
 * simply an id that names nothing, and nothing is read for it.
 *
 * The shape is zod's `guid` (8-4-4-4-12 hex digits, any version): every id Postgres mints has it, and
 * Postgres parses every string that has it, so no read this lets through can fail on the cast. It is
 * deliberately not `z.uuid()`, which also asks for a version and variant, a question about minting that
 * a path never needs answered.
 */
const UUID_SHAPE = z.guid();

/** Whether `value` is shaped like a uuid, and so safe to hand a uuid column. */
export function isUuidShape(value: string): boolean {
  return UUID_SHAPE.safeParse(value).success;
}
