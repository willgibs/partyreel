/**
 * A date the way the lifecycle emails print it ("September 23, 2026"), shared by the sweeps that
 * write one (over-capacity, inactivity, renewal nudges) so the three read alike.
 */
export function emailDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
