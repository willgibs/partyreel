import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY POINTER TO THE DEMO IS A DEMO DOOR (`system/demo-modal/demo-door.tsx`).
 *
 * A door opens the demo modal at a desk and the demo itself in a new tab on a phone; a plain `<Link>` to
 * the demo opens it in THIS tab, off the page the reader was on, and nothing about the page looks wrong.
 * Three sweeps each left stragglers behind (`demo-doors`' own, the footer's phone link in crumbs-6, and
 * the event objects and /how-it-works' proof here), because a link is a link to every eye and a grep for
 * `Link` finds forty.
 *
 * The mark of a pointer to the demo is its analytics event: `trackAttrs("demo_open", ...)` is written by
 * the door itself and by nothing else, so the scan reads for that event outside the door, and for any
 * anchor or `Link` handed the demo's address. Pinned for non-emptiness: a scan that sees no door is a
 * broken scan, not a clean site.
 */
const ROOT = process.cwd();

function tsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsx(full);
    return /\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)
      ? [full]
      : [];
  });
}

const FILES = [
  ...tsx(join(ROOT, "src/components/marketing")),
  ...tsx(join(ROOT, "src/app/(marketing)")),
];

/**
 * Where the event is allowed to be written by hand: the door, the modal's own button (inside the modal,
 * one press from the demo, never a pointer to it), and the Library's bare specimen, which nothing in the
 * shipped site imports (`DemoTicket`, ROADMAP's hygiene line).
 */
const OWN = new Set([
  "src/components/marketing/system/demo-modal/demo-door.tsx",
  "src/components/marketing/system/demo-modal/demo-modal.tsx",
  "src/components/marketing/system/demo-ticket.tsx",
]);

const code = (file: string) =>
  readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const rel = (file: string) => relative(ROOT, file);

describe("every pointer to the demo", () => {
  it("finds the doors at all", () => {
    const doors = FILES.filter((f) => /<DemoDoor\b/.test(code(f)));
    expect(
      doors.length,
      "no file draws a DemoDoor: the scan is broken",
    ).toBeGreaterThan(5);
  });

  it("★ is a demo door, never a plain link carrying the demo's own event", () => {
    const offenders = FILES.filter(
      (f) => !OWN.has(rel(f)) && /["']demo_open["']/.test(code(f)),
    ).map(rel);
    expect(
      offenders,
      `These write the demo_open event themselves, so they are plain links to the demo: draw a DemoDoor ` +
        `(system/demo-modal/demo-door.tsx) and let it write the event.\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("★ is never an anchor or a Link handed the demo's address", () => {
    // `<DemoDoor href={DEMO_EVENT_URL}>` is the door; `<Link href="/demo">` and `<a href={DEMO_EVENT_URL}>`
    // are the stragglers (the short `/demo` is the code's own value, never a destination written by hand).
    const plain =
      /<(?:Link|a)\b[^>]*\bhref=(?:\{DEMO_EVENT_URL\}|"\/demo"|'\/demo'|\{"\/demo"\})/;
    const offenders = FILES.filter(
      (f) => !OWN.has(rel(f)) && plain.test(code(f)),
    ).map(rel);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
