/**
 * THE WORKER'S ONE LOG LINE: an event and a flat record of plain facts (ids, counts, states, an error's words), as JSON
 * for Workers Logs. ★ NEVER A TOKEN, NEVER A LEASE ANSWER: a value here is a string, a number, a boolean or null, so a
 * lease object or an access token cannot be passed whole, and `log-safety.test.ts` refuses any `console.` call outside
 * this file and any log field named for a secret.
 */
export type LogFields = Record<string, string | number | boolean | null>;

export function log(
  event: "drive-lane" | "drive-kick" | "drive-sweep" | "drive-error",
  fields: LogFields,
): void {
  // eslint-disable-next-line no-console -- the Worker's one logging seam
  console.log(JSON.stringify({ at: event, ...fields }));
}
