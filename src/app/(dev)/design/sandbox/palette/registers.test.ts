import { describe, expect, it } from "vitest";

import {
  optionId,
  optionLabel,
  optionMeans,
} from "@/components/lab/board-spec";

import {
  PALETTES,
  PALETTE_OPTIONS,
  RECOMMENDED_PALETTE,
  resolvePalette,
} from "./palettes";
import { PALETTE } from "./spec";

import {
  ACCENT_BY_ID,
  DARKS,
  DARK_BY_ID,
  FAINT_USES,
  LIGHTS,
  LIGHT_BY_ID,
  MAT_USES,
  RECOMMENDATION,
  REGISTERS,
  accentBlock,
  jobTakesAccent,
  keepsCinemaOverride,
  keepsSlabRegister,
  lOf,
  matRegisterCss,
  pairStyle,
  resolvePair,
  tint,
  tokenBlock,
  warmthAt,
  type DarkId,
  type LightId,
  type Pair,
} from "./registers";

const pair = (d: DarkId, l: LightId): Pair => ({
  dark: DARK_BY_ID[d],
  light: LIGHT_BY_ID[l],
});

const ACCENT_FLARE = ACCENT_BY_ID.flare;
const ACCENT_INK = ACCENT_BY_ID.ink;

/**
 * THE RECEIPT FOR EVERY CANDIDATE THIS BOARD HAS EVER SHOWN.
 *
 * Round two shipped a third candidate, "C. Film stock", and round three cut it
 * on the grounds that it moved no step: it was candidate A's ladder at a
 * temperature, so it was a switch wearing a letter. Round four splits the
 * ruling into a dark half and a light half, which turns the temperature back
 * into a property a SET can carry (Ember warm, Slate cool, Warm and Cool on the
 * paper side), each of them moving its own lightnesses as well.
 *
 * What must not be lost through all of that is the ability to land exactly what
 * Will was shown. C's five published blocks are pinned here verbatim, copied
 * out of the manifest's paste section (docs/tracks/palette.md, "C. Film
 * stock"), and the test asserts that the cast transform at gain 1 still
 * produces every one of them from the Ladder set.
 *
 * ONE deliberate difference, asserted separately below: C left `.dark --ring`
 * at chroma 0 while writing `.surface-ink --ring` warm, at the same job on the
 * same ground. A transform cannot hold both answers; it takes the ink one.
 */
const C_ROUND_TWO = {
  light: {
    "--background": "oklch(0.977 0.004 85)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(0.998 0.003 85)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(0.998 0.003 85)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.145 0 0)",
    "--primary-foreground": "oklch(0.998 0.003 85)",
    "--secondary": "oklch(0.925 0.006 85)",
    "--secondary-foreground": "oklch(0.145 0 0)",
    "--muted": "oklch(0.948 0.005 85)",
    "--muted-foreground": "oklch(0.46 0 0)",
    "--faint": "oklch(0.62 0 0)",
    "--accent": "oklch(0.925 0.006 85)",
    "--accent-foreground": "oklch(0.145 0 0)",
    "--border": "oklch(0.89 0.007 85)",
    "--input": "oklch(0.89 0.007 85)",
    "--ring": "oklch(0.3 0 0)",
  },
  dark: {
    "--background": "oklch(0.145 0.005 60)",
    "--foreground": "oklch(0.955 0.002 85)",
    "--card": "oklch(0.235 0.006 60)",
    "--card-foreground": "oklch(0.955 0.002 85)",
    "--popover": "oklch(0.285 0.007 60)",
    "--popover-foreground": "oklch(0.955 0.002 85)",
    "--primary": "oklch(0.955 0.002 85)",
    "--primary-foreground": "oklch(0.145 0.005 60)",
    "--secondary": "oklch(0.325 0.008 60)",
    "--secondary-foreground": "oklch(0.955 0.002 85)",
    "--muted": "oklch(0.195 0.006 60)",
    "--muted-foreground": "oklch(0.7 0.004 70)",
    "--faint": "oklch(0.55 0.004 70)",
    "--accent": "oklch(0.325 0.008 60)",
    "--accent-foreground": "oklch(0.955 0.002 85)",
    "--border": "oklch(1 0 0 / 12%)",
    "--input": "oklch(1 0 0 / 16%)",
    "--ring": "oklch(0.85 0 0)",
  },
  ink: {
    "--background": "oklch(0.185 0.006 60)",
    "--foreground": "oklch(0.965 0.002 85)",
    "--card": "oklch(0.235 0.006 60)",
    "--card-foreground": "oklch(0.965 0.002 85)",
    "--popover": "oklch(0.285 0.007 60)",
    "--popover-foreground": "oklch(0.965 0.002 85)",
    "--secondary": "oklch(0.325 0.008 60)",
    "--secondary-foreground": "oklch(0.965 0.002 85)",
    "--accent": "oklch(0.325 0.008 60)",
    "--accent-foreground": "oklch(0.965 0.002 85)",
    "--muted": "oklch(0.235 0.006 60)",
    "--muted-foreground": "oklch(0.7 0.004 70)",
    "--faint": "oklch(0.55 0.004 70)",
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 14%)",
    "--ring": "oklch(0.965 0.002 85)",
    "--primary": "oklch(0.965 0.002 85)",
    "--primary-foreground": "oklch(0.185 0.006 60)",
    "--brand": "var(--primary)",
    "--brand-foreground": "var(--primary-foreground)",
    "--shadow-float": "0 0 0 0 oklch(0 0 0 / 0)",
  },
  gallery: {
    "--gallery": "oklch(0.09 0.004 60)",
    "--gallery-foreground": "oklch(0.965 0.002 85)",
    "--gallery-muted": "oklch(0.62 0.004 70)",
    "--gallery-border": "oklch(1 0 0 / 8%)",
  },
  cinemaBackground: "oklch(0.105 0.004 60)",
};

describe("the cast transform still reproduces round two's candidate C", () => {
  const ladder = DARK_BY_ID.ladder;
  const paper = LIGHT_BY_ID.paper;

  it("reproduces C's light block token for token", () => {
    expect(tint(paper.paper, false, "warm")).toEqual(C_ROUND_TWO.light);
  });

  it("reproduces C's ink leaf, well and cinema ground", () => {
    expect(tint(ladder.slab, true, "warm")).toEqual(C_ROUND_TWO.ink);
    expect(tint(ladder.well, true, "warm")).toEqual(C_ROUND_TWO.gallery);
    expect(tint({ x: ladder.cinemaBackground }, true, "warm").x).toEqual(
      C_ROUND_TWO.cinemaBackground,
    );
  });

  it("reproduces C's dark block apart from the one value C wrote twice", () => {
    const { "--ring": ring, ...rest } = tint(ladder.room, true, "warm");
    const { "--ring": cRing, ...cRest } = C_ROUND_TWO.dark;
    expect(rest).toEqual(cRest);
    // The correction, recorded rather than hidden: C left the dark ring cold
    // and the ink ring warm, at the same job on the same ground.
    expect(cRing).toBe("oklch(0.85 0 0)");
    expect(ring).toBe("oklch(0.85 0.004 70)");
  });
});

describe("the rule the cast holds", () => {
  it("leaves ink on paper neutral and casts only the surfaces", () => {
    for (const id of ["warm", "cool"] as const) {
      const light = LIGHT_BY_ID[id].paper;
      // Every text step on paper keeps chroma 0, which is what lets black stay
      // crisp on a cast white.
      for (const token of [
        "--foreground",
        "--muted-foreground",
        "--faint",
        "--primary",
        "--ring",
      ]) {
        expect(light[token]).toMatch(/ 0 0\)$/);
      }
      expect(light["--background"]).not.toMatch(/ 0 0\)$/);
    }
  });

  it("leaves a veil alone, because it borrows the surface under it", () => {
    for (const id of ["ember", "slate"] as const) {
      expect(DARK_BY_ID[id].room["--border"]).toMatch(/oklch\(1 0 0 \/ \d+%\)/);
      expect(DARK_BY_ID[id].room["--input"]).toMatch(/oklch\(1 0 0 \/ \d+%\)/);
    }
  });

  it("sends the well less cast than any room it sits under", () => {
    // The well is the deepest ground in a set; a photograph should sit on
    // something close to black rather than on a tinted one.
    for (const cast of [true] as const) {
      expect(warmthAt(0.09, cast).chroma).toBeLessThan(
        warmthAt(0.145, cast).chroma,
      );
      expect(warmthAt(0.145, cast).chroma).toBeLessThan(
        warmthAt(0.325, cast).chroma,
      );
    }
    // And in the sets themselves, read off the published strings.
    for (const id of ["ember", "slate"] as const) {
      const set = DARK_BY_ID[id];
      const chroma = (v: string) =>
        Number(/oklch\([\d.]+ ([\d.]+)/.exec(v)![1]);
      expect(chroma(set.well["--gallery"])).toBeLessThan(
        chroma(set.room["--secondary"]),
      );
    }
  });

  it("is a no-op on a block that already carries the cast", () => {
    const once = DARK_BY_ID.ember.room;
    expect(tint(once, true, "warm", 1.6)).toEqual(once);
  });

  it("keeps Cool's mat a true grey rather than a tint of its own page", () => {
    // The set's whole argument: a gallery mat is dead neutral so the media is
    // the only colour on the wall. If a transform ever swallows it, the answer
    // to Will's "a grey that is not a tint of the text" is gone.
    expect(LIGHT_BY_ID.cool.mat["--background"]).toBe("oklch(0.95 0 0)");
    expect(LIGHT_BY_ID.cool.paper["--background"]).not.toMatch(/ 0 0\)$/);
  });
});

describe("the register model", () => {
  it("names five registers and puts the well outside both modes", () => {
    expect(REGISTERS.map((r) => r.id)).toEqual([
      "room",
      "slab",
      "paper",
      "mat",
      "well",
    ]);
    expect(REGISTERS.filter((r) => r.mode === "dark")).toHaveLength(2);
    expect(REGISTERS.filter((r) => r.mode === "light")).toHaveLength(2);
    expect(REGISTERS.find((r) => r.id === "well")!.mode).toBe("neither");
  });

  it("gives every dark set a complete slab, which today does not have", () => {
    // The gap the model exists to close: a Card inside the footer renders in
    // the PAPER card colour because .surface-ink declares no --card.
    expect(DARK_BY_ID.today.slab["--card"]).toBeUndefined();
    for (const set of DARKS.filter((d) => d.id !== "today")) {
      for (const token of ["--card", "--popover", "--secondary", "--input"]) {
        expect(set.slab[token], `${set.id} slab ${token}`).toBeDefined();
      }
    }
  });

  it("keeps the float zero on every slab", () => {
    // Without it a dark leaf inside a paper page wears the PAPER float.
    for (const set of DARKS) {
      expect(set.slab["--shadow-float"]).toBe("0 0 0 0 oklch(0 0 0 / 0)");
    }
  });

  it("lifts the slab above the room wherever the slab is a register", () => {
    const l = (v: string) => Number(/oklch\(([\d.]+)/.exec(v)?.[1] ?? "NaN");
    for (const set of DARKS) {
      if (!keepsSlabRegister(set)) continue;
      if (set.id === "today") continue; // today's slab is a var(), read at row 03
      expect(
        l(set.slab["--background"]),
        `${set.id}: a slab on paper must sit lighter than the room`,
      ).toBeGreaterThan(l(set.room["--background"]));
    }
  });

  it("agrees with itself about the cinema override and the slab", () => {
    // These two booleans drive what the paste prints, so a set that says "one
    // room" in prose and keeps an override in its values would paste a lie.
    expect(keepsCinemaOverride(DARK_BY_ID.today)).toBe(true);
    expect(keepsCinemaOverride(DARK_BY_ID.ladder)).toBe(true);
    for (const id of ["room", "ember", "slate", "lift"] as const) {
      expect(keepsCinemaOverride(DARK_BY_ID[id]), id).toBe(false);
    }
    // Lift's claim is that a lifted room needs no second register at all.
    expect(keepsSlabRegister(DARK_BY_ID.lift)).toBe(false);
    expect(keepsSlabRegister(DARK_BY_ID.ember)).toBe(true);
  });

  it("gives every light set a mat block", () => {
    for (const set of LIGHTS) {
      expect(set.mat["--background"], `${set.id} mat`).toBeDefined();
    }
  });
});

describe("no token block can reference itself", () => {
  /**
   * ★ THE 500 THIS TEST EXISTS FOR. A derived mat was written as
   * `--background: color-mix(in oklab, var(--foreground) 5%, var(--background))`.
   * In real CSS a custom property that reads var() on ITSELF is a cycle and the
   * declaration becomes invalid at computed-value time; in this board's own
   * reader it recursed until the stack gave out, and the page 500'd on the
   * server. Neither failure named the token, so the rule is pinned rather than
   * remembered: a value may reference any other property, never its own name,
   * and never a chain that returns to it.
   */
  const blocks: [string, Record<string, string>][] = [
    ...DARKS.flatMap((d): [string, Record<string, string>][] => [
      [`${d.id}.room`, d.room],
      [`${d.id}.slab`, d.slab],
      [`${d.id}.well`, d.well],
    ]),
    ...LIGHTS.flatMap((l): [string, Record<string, string>][] => [
      [`${l.id}.paper`, l.paper],
      [`${l.id}.mat`, l.mat],
      // The mat as it actually cascades: layered on its own paper, which is
      // how pairStyle renders it and where a cycle would really bite.
      [`${l.id}.mat-on-paper`, { ...l.paper, ...l.mat }],
    ]),
  ];

  const refs = (v: string) =>
    [...v.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);

  it("has no direct or transitive self-reference in any block", () => {
    for (const [name, block] of blocks) {
      for (const key of Object.keys(block)) {
        const seen = new Set<string>();
        const walk = (token: string): boolean => {
          if (seen.has(token)) return false;
          seen.add(token);
          const value = block[token];
          if (!value) return false;
          for (const r of refs(value)) {
            if (r === key) return true;
            if (walk(r)) return true;
          }
          return false;
        };
        expect(walk(key), `${name} ${key} references itself`).toBe(false);
      }
    }
  });

  it("reads a lightness back out of every block it renders", () => {
    // The ladders, the rulers and the register strips all print lOf(); a null
    // where a number belongs is the visible half of the same bug.
    for (const [name, block] of blocks) {
      if (name.endsWith(".well")) continue;
      // A bare mat block is never rendered alone: pairStyle always layers it on
      // its own paper, and `mat-on-paper` below is that cascade.
      if (name.endsWith(".mat")) continue;
      if (name.startsWith("today.slab")) continue; // var(--gallery), read at row 03
      const bg = block["--background"];
      if (!bg) continue;
      expect(lOf(bg, block), `${name} --background`).not.toBeNull();
    }
  });
});

describe("a pair is any dark beside any light", () => {
  it("offers thirty combinations, and the paste reads the pair", () => {
    expect(DARKS.length * LIGHTS.length).toBe(30);
    const css = tokenBlock(pair("ember", "cool"));
    expect(css).toContain(DARK_BY_ID.ember.room["--background"]);
    expect(css).toContain(LIGHT_BY_ID.cool.paper["--background"]);
    // And the two halves genuinely come from different sets.
    const other = tokenBlock(pair("ember", "warm"));
    expect(other).toContain(DARK_BY_ID.ember.room["--background"]);
    expect(other).not.toContain(LIGHT_BY_ID.cool.mat["--background"]);
  });

  it("prints the mat register and the slab in every paste", () => {
    const css = tokenBlock(pair("ladder", "paper"));
    expect(css).toContain(".surface-mat {");
    expect(css).toContain(".surface-ink {");
    expect(css).toContain("/* the media well: one value, both modes");
  });

  it("tells the Orchestrator to delete the cinema override when there is one room", () => {
    expect(tokenBlock(pair("ember", "paper"))).toContain(
      "DELETE the cinema override",
    );
    expect(tokenBlock(pair("ladder", "paper"))).toContain(
      '.dark[data-mkt-skin="cinema"] {',
    );
  });

  it("lays the well under both modes and the slab over the paper", () => {
    const p = pair("ladder", "paper");
    const onPaper = pairStyle(p, "paper") as Record<string, string>;
    const onSlab = pairStyle(p, "ink") as Record<string, string>;
    const onMat = pairStyle(p, "mat") as Record<string, string>;
    expect(onPaper["--gallery"]).toBe(p.dark.well["--gallery"]);
    expect(onSlab["--gallery"]).toBe(p.dark.well["--gallery"]);
    // The slab is layered on paper, so it inherits the paper values it does
    // not override: that is the real footer case, a leaf inside a light page.
    expect(onSlab["--background"]).toBe(p.dark.slab["--background"]);
    expect(onSlab["--ring"]).toBe(p.dark.slab["--ring"]);
    // The mat is the same trick on the light side.
    expect(onMat["--background"]).toBe(p.light.mat["--background"]);
    expect(onMat["--foreground"]).toBe(p.light.paper["--foreground"]);
  });

  it("uses the cinema override only on the cinema ground", () => {
    const p = pair("ladder", "paper");
    expect(
      (pairStyle(p, "cinema") as Record<string, string>)["--background"],
    ).toBe(p.dark.cinemaBackground);
    expect(
      (pairStyle(p, "app-dark") as Record<string, string>)["--background"],
    ).toBe(p.dark.room["--background"]);
  });
});

describe("the dark card ruling", () => {
  const card = (id: DarkId, mode: "declared" | "opaque" | "veil") =>
    resolvePair(pair(id, "paper"), mode).dark.room["--card"];

  it("strips today's veil for opaque and leaves it for the veil", () => {
    // Today is the one set that declares the translucent card, so it is the
    // one answer where "opaque" moves a value.
    expect(card("today", "declared")).toBe("oklch(0.21 0 0 / 0.62)");
    expect(card("today", "opaque")).toBe("oklch(0.21 0 0)");
    expect(card("today", "veil")).toBe("oklch(0.21 0 0 / 0.62)");
    // And the shipped slab declares no card at all: the ruling lands nothing.
    expect(DARK_BY_ID.today.slab["--card"]).toBeUndefined();
  });

  it("makes the veil the moving answer on every candidate", () => {
    for (const id of ["ladder", "ember", "slate", "lift"] as const) {
      const declared = DARK_BY_ID[id].room["--card"];
      expect(card(id, "opaque")).toBe(declared);
      expect(card(id, "veil")).toBe(declared.replace(/\)$/, " / 0.62)"));
    }
    const derived = DARK_BY_ID.room.room["--card"];
    expect(card("room", "veil")).toBe(
      `color-mix(in oklab, ${derived} 62%, transparent)`,
    );
  });

  it("reaches the slab as well as the room", () => {
    for (const id of ["ladder", "ember", "room"] as const) {
      const resolved = resolvePair(pair(id, "paper"), "veil").dark;
      // A literal takes the slash form, a color-mix takes a second mix at
      // 62 percent; both are the same 62 and both must reach the leaf.
      expect(resolved.slab["--card"]).toMatch(/0\.62|62%/);
    }
  });
});

describe("the missing step ruling", () => {
  it("declares --faint on every candidate when it is in", () => {
    for (const d of DARKS.filter((x) => x.id !== "today")) {
      const r = resolvePair(pair(d.id, "paper"), "declared", true);
      expect(r.dark.room["--faint"], d.id).toBeDefined();
      expect(r.dark.slab["--faint"], d.id).toBeDefined();
    }
    for (const l of LIGHTS.filter((x) => x.id !== "today")) {
      const r = resolvePair(pair("ladder", l.id), "declared", true);
      expect(r.light.paper["--faint"], l.id).toBeDefined();
      expect(r.light.mat["--faint"], l.id).toBeDefined();
    }
  });

  it("deletes it from every block when it is out", () => {
    // A ruling of "out" is a ruling that the custom property is never
    // declared, so it has to leave the SET rather than one renderer: the
    // ladder, every specimen's var() fallback and the printed paste all read
    // these objects.
    const r = resolvePair(pair("ladder", "paper"), "declared", false);
    expect("--faint" in r.dark.room).toBe(false);
    expect("--faint" in r.dark.slab).toBe(false);
    expect("--faint" in r.light.paper).toBe(false);
    expect("--faint" in r.light.mat).toBe(false);
    expect(tokenBlock(r)).not.toContain("--faint");
    // and nothing else moves with it
    expect(r.light.paper["--muted-foreground"]).toBe(
      LIGHT_BY_ID.paper.paper["--muted-foreground"],
    );
  });

  it("is in by default, so an old call site cannot silently drop the step", () => {
    expect(
      resolvePair(pair("ladder", "paper"), "declared").light.paper["--faint"],
    ).toBe(LIGHT_BY_ID.paper.paper["--faint"]);
  });
});

describe("the accent and its reach", () => {
  it("prints nothing for ink, because ink is the alias that ships", () => {
    expect(accentBlock(ACCENT_INK, "all")).toBe("");
  });

  it("writes the hue into the slab or it never reaches the footer", () => {
    const flare = ACCENT_FLARE;
    const css = accentBlock(flare, "all");
    expect(css).toContain(".surface-ink {");
    expect(css.match(/--brand:/g)).toHaveLength(3);
  });

  it("says in the paste which call sites a narrowed reach leaves on ink", () => {
    expect(accentBlock(ACCENT_FLARE, "attention")).toContain("attention only");
    expect(accentBlock(ACCENT_FLARE, "identity")).toContain("identity only");
  });

  it("hands each job to the hue or back to ink", () => {
    expect(jobTakesAccent("identity", "all")).toBe(true);
    expect(jobTakesAccent("attention", "identity")).toBe(false);
    expect(jobTakesAccent("identity", "attention")).toBe(false);
    expect(jobTakesAccent("stand-in", "identity")).toBe(true);
  });
});

describe("the walk's two emulated rulings", () => {
  it("paints the alpha-dimmed panels with the ruled mat's own ground", () => {
    const css = matRegisterCss(LIGHT_BY_ID.paper);
    expect(css).toContain(LIGHT_BY_ID.paper.mat["--background"]!);
    // A hover fill wears the same utility and is NOT a mat: the selector is
    // anchored so `hover:bg-muted/40` is left alone.
    expect(css).toContain('[class^="bg-muted/"]');
    expect(css).toContain('[class*=" bg-muted/"]');
  });

  it("keeps the measured counts in one place", () => {
    expect(MAT_USES).toBe(35);
    expect(FAINT_USES).toBe(37);
  });
});

/* ── The catalog (round six, the clarity round) ─────────────────────────── */

describe("the catalog", () => {
  const ask = PALETTE.asks.find((a) => a.id === "palette")!;

  it("is a catalog: between eight and sixteen finished palettes", () => {
    // Will's size, not an arbitrary one: "a dozen polished variants". Fewer
    // than eight is not a catalog and more than sixteen is a wall.
    expect(PALETTES.length).toBeGreaterThanOrEqual(8);
    expect(PALETTES.length).toBeLessThanOrEqual(16);
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(PALETTES.length);
  });

  it("builds every palette out of sets and an accent that exist", () => {
    for (const p of PALETTES) {
      expect(DARK_BY_ID[p.dark], `${p.id}: dark`).toBeTruthy();
      expect(LIGHT_BY_ID[p.light], `${p.id}: light`).toBeTruthy();
      expect(ACCENT_BY_ID[p.accent], `${p.id}: accent`).toBeTruthy();
      expect(resolvePalette(p.id).def.id).toBe(p.id);
    }
  });

  it("lands on exactly one, and it is the one registers.ts recommends", () => {
    const picked = PALETTES.filter((p) => p.recommended);
    expect(picked.map((p) => p.id)).toEqual(["ember"]);
    expect(RECOMMENDED_PALETTE.dark).toBe(RECOMMENDATION.dark);
    expect(RECOMMENDED_PALETTE.light).toBe(RECOMMENDATION.light);
    expect(ask.recommended).toBe(RECOMMENDED_PALETTE.id);
  });

  /**
   * ★ THE ONE PIN THAT EARNS ITS KEEP. The ask's twelve options are written out
   * as literals in spec.ts because the desk's review scanner reads a spec as
   * TEXT (a computed `options` read as an ask with no answers at all, which is
   * how this split came about). So the words live in the spec and the structure
   * lives in palettes.ts, and this is what stops the two drifting: same ids, in
   * the same order, with the same labels.
   */
  it("says the same twelve in the spec, the dock and palettes.ts", () => {
    expect(ask.options.map(optionId)).toEqual(PALETTES.map((p) => p.id));
    expect(ask.options.map(optionLabel)).toEqual(PALETTES.map((p) => p.name));
    expect(PALETTE_OPTIONS.map((o) => o.id)).toEqual(PALETTES.map((p) => p.id));
    for (const o of ask.options) {
      expect(optionMeans(o), `${optionId(o)} has no line`).toBeTruthy();
    }
  });

  it("keeps Today as the one that changes no line", () => {
    const today = resolvePalette("today");
    expect(today.def.dark).toBe("today");
    expect(today.def.light).toBe("today");
    expect(today.def.accent).toBe("ink");
    // The mat is a property of a palette now rather than a switch, and Today is
    // the only one that answers "no register": the set-apart ground ships as
    // alphas of a token that also does hover.
    expect(today.def.mat).toBe(false);
    expect(PALETTES.filter((p) => !p.mat).map((p) => p.id)).toEqual(["today"]);
  });

  /**
   * ★ AND THE CANDIDATES ARE PINNED THE SAME WAY (the revamp, 2026-09-16). The
   * twelve are now written out a THIRD time, as `const ITEMS` in spec.ts, for
   * the same reason the options are: `pnpm lab:review` reads a spec as text and
   * resolves `candidates: ITEMS` one hop, so a `.map` over palettes.ts would
   * read as no items at all and every ruling on a card would be refused. Three
   * copies is three chances to drift, so every field is held here.
   */
  it("rules on the same twelve it offers, card for card", () => {
    expect(PALETTE.candidates.map((c) => c.id)).toEqual(
      PALETTES.map((p) => p.id),
    );
    expect(PALETTE.candidates.map((c) => c.name)).toEqual(
      PALETTES.map((p) => p.name),
    );
    expect(PALETTE.candidates.map((c) => c.rationale)).toEqual(
      PALETTES.map((p) => p.why),
    );
    expect(
      PALETTE.candidates.filter((c) => c.recommended).map((c) => c.id),
    ).toEqual(["ember"]);
  });

  it("says one line on the card and the same line in the ask", () => {
    // The card on the board and the question on the desk have to say the same
    // words, or the catalog and the question are two different catalogs.
    const means = new Map(
      ask.options.map((o) => [optionId(o), optionMeans(o)]),
    );
    for (const c of PALETTE.candidates) {
      expect(c.one, `${c.id} has no line`).toBeTruthy();
      expect(c.one, `${c.id}: the card and the ask say different things`).toBe(
        means.get(c.id),
      );
    }
  });

  it("carries the board's own verdict on every card, and only one ship", () => {
    const verdicts = PALETTE.candidates.map((c) => c.verdict);
    for (const v of verdicts) expect(["ship", "refine", "kill"]).toContain(v);
    // A board with an opinion ships exactly one, and it is the recommendation.
    const ships = PALETTE.candidates.filter((c) => c.verdict === "ship");
    expect(ships.map((c) => c.id)).toEqual([RECOMMENDED_PALETTE.id]);
  });

  /**
   * THE FACTS ARE THE SWATCHES, MEASURED. Three numbers a reviewer compares
   * across twelve cards, written as literals in the spec (the scanner again)
   * and read here off the resolved palette, so a card cannot print a lightness
   * the strip beside it does not paint.
   */
  it("prints the room, the page and the accent each card actually has", () => {
    for (const c of PALETTE.candidates) {
      const r = resolvePalette(c.id);
      const facts = new Map(c.facts ?? []);
      const at = (block: Record<string, string>) => {
        const l = lOf(block["--background"] ?? "", block);
        return l === null ? "none" : l.toFixed(3);
      };
      expect(facts.get("Room"), `${c.id}: Room`).toBe(at(r.pair.dark.room));
      expect(facts.get("Page"), `${c.id}: Page`).toBe(at(r.pair.light.paper));
      expect(facts.get("Accent"), `${c.id}: Accent`).toBe(r.accent.short);
    }
  });

  it("declares the catalog the review reads", () => {
    // Declaring this is the opt-in that puts the twelve on the desk as items to
    // rule; the section, the pick and the two compare controls are held by
    // registry.test.ts.
    expect(PALETTE.catalog).toEqual({
      section: "catalog",
      control: "palette",
      compare: ["compare-a", "compare-b"],
    });
  });

  it("spans the sets rather than re-listing one", () => {
    // A catalog of twelve that used three sets would be four rows of the same
    // argument. Every dark and every light the board carries is worn by at
    // least one palette, and no palette repeats another's whole recipe.
    expect(new Set(PALETTES.map((p) => p.dark)).size).toBe(DARKS.length);
    expect(new Set(PALETTES.map((p) => p.light)).size).toBe(LIGHTS.length);
    const recipes = PALETTES.map((p) => `${p.dark}/${p.light}/${p.accent}`);
    expect(new Set(recipes).size).toBe(PALETTES.length);
  });
});
