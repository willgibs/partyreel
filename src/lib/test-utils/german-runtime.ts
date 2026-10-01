import { vi } from "vitest";

/**
 * A RUNTIME WHOSE OWN LOCALE IS GERMAN, the only way a test can be another runtime (crumbs-36; the shape
 * `utils.test.ts` gives the dates): every number-formatting call that names no locale is answered in `de-DE`
 * ("1.234,5"), and a call that names one keeps it. A page that prints a count with a bare `toLocaleString()` reads
 * one way on the server and another in a browser that is not en-US (React's #418 on hydration); a pinned formatter
 * (`formatCount`) reads the same through both, which is what a test run under this proves.
 *
 * Call it in the test (never at import, so a module's own load-time formatters are made first, as in a real
 * server) and restore with `vi.restoreAllMocks()` in `afterEach`.
 */
export function runAsGermanNumberRuntime(): void {
  const toLocaleString = Number.prototype.toLocaleString;
  vi.spyOn(Number.prototype, "toLocaleString").mockImplementation(function (
    this: number,
    locales,
    options,
  ) {
    return toLocaleString.call(this, locales ?? "de-DE", options);
  });
  const RealNumberFormat = Intl.NumberFormat;
  // A `function`, not an arrow: the code under test may `new` it.
  vi.spyOn(Intl, "NumberFormat").mockImplementation(function (
    locales?: string | string[],
    options?: Intl.NumberFormatOptions,
  ) {
    return new RealNumberFormat(locales ?? "de-DE", options);
  } as unknown as typeof Intl.NumberFormat);
}
