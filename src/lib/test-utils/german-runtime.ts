import { vi } from "vitest";

/**
 * A RUNTIME WHOSE OWN LOCALE IS GERMAN, the only way a test can be another runtime (crumbs-36): every formatting call
 * that names no locale is answered in `de-DE` ("1.234,5", "1. Juni 2026"), and a call that names one keeps it. A page
 * that prints a count or a date with a bare `toLocaleString()` reads one way on the server and another in a browser
 * that is not en-US (React's #418 on hydration); a pinned formatter (`formatCount`, `formatEventDate`) reads the same
 * through both, which is what a test run under this proves.
 *
 * `runAsGermanRuntime` is the whole runtime, numbers and dates; `runAsGermanNumberRuntime` is its numbers alone, for
 * the test of a count. Call one, once, in the test (never at import, so a module's own load-time formatters are made
 * first, as in a real server), and restore with `vi.restoreAllMocks()` in `afterEach`.
 */
const GERMAN = "de-DE";

type LocaleMethod = (
  this: unknown,
  locales?: Intl.LocalesArgument,
  options?: object,
) => string;

type Formatter = new (
  locales?: Intl.LocalesArgument,
  options?: object,
) => object;

/** A method that names no locale answers in German; one that names a locale keeps it. */
function methodInGerman(owner: object, name: string): void {
  const methods = owner as Record<string, LocaleMethod>;
  const real = methods[name];
  vi.spyOn(methods, name).mockImplementation(function (
    this: unknown,
    locales,
    options,
  ) {
    return real.call(this, locales ?? GERMAN, options);
  });
}

/**
 * A formatter built with no locale is a German one. A `function`, not an arrow (vitest refuses `new` on an arrow's
 * mock), since the code under test may `new` it or call it bare.
 */
function formatterInGerman(name: "NumberFormat" | "DateTimeFormat"): void {
  const intl = Intl as unknown as Record<string, Formatter>;
  const Real = intl[name];
  vi.spyOn(intl, name).mockImplementation(function (
    locales?: Intl.LocalesArgument,
    options?: object,
  ) {
    return new Real(locales ?? GERMAN, options);
  } as unknown as Formatter);
}

/** Numbers alone: `toLocaleString()` and `Intl.NumberFormat`. */
export function runAsGermanNumberRuntime(): void {
  methodInGerman(Number.prototype, "toLocaleString");
  formatterInGerman("NumberFormat");
}

/** The whole runtime: the numbers, and every date call (`toLocaleDateString`, `toLocaleTimeString`, `toLocaleString`, `Intl.DateTimeFormat`). */
export function runAsGermanRuntime(): void {
  runAsGermanNumberRuntime();
  methodInGerman(Date.prototype, "toLocaleDateString");
  methodInGerman(Date.prototype, "toLocaleTimeString");
  methodInGerman(Date.prototype, "toLocaleString");
  formatterInGerman("DateTimeFormat");
}
