import { describe, expect, it } from "vitest";

import { resolveDashboardLayout } from "./layout";

const base = {
  events: 0,
  saved: 0,
  uploads: 0,
  likes: 0,
  deleted: 0,
  standbyBytes: 0,
};

describe("resolveDashboardLayout (the four canonical states + the gates)", () => {
  it("nothing anywhere: no chips, no meter, both feeds empty", () => {
    expect(resolveDashboardLayout(base)).toEqual({
      showMeter: false,
      showChips: false,
      uploadsEmpty: true,
      likesEmpty: true,
    });
  });

  it("one empty created event: chips + meter, feeds still teasing", () => {
    const l = resolveDashboardLayout({ ...base, events: 1 });
    expect(l.showChips).toBe(true);
    expect(l.showMeter).toBe(true);
    expect(l.uploadsEmpty).toBe(true);
    expect(l.likesEmpty).toBe(true);
  });

  it("saved-only (no created): chips on, meter OFF (no hosting telemetry)", () => {
    const l = resolveDashboardLayout({ ...base, saved: 2 });
    expect(l.showChips).toBe(true);
    expect(l.showMeter).toBe(false);
  });

  it("a populated section flips its emptiness; chips appear", () => {
    const l = resolveDashboardLayout({ ...base, uploads: 5 });
    expect(l.uploadsEmpty).toBe(false);
    expect(l.likesEmpty).toBe(true);
    expect(l.showChips).toBe(true);
    expect(l.showMeter).toBe(false); // uploads to OTHER events isn't hosting
  });

  it("deleted-everything host still sees the meter (standby bytes to report)", () => {
    const l = resolveDashboardLayout({
      ...base,
      deleted: 1,
      standbyBytes: 500_000,
    });
    expect(l.showMeter).toBe(true); // the recovery-budget regression fix
    expect(l.showChips).toBe(true); // reachable Trash
  });
});
