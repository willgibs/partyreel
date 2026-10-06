/**
 * THE ROLL AND THE CAMERA VIDEO, ONE HOME EACH AND THEIR SQL MIRRORS (20261002200000, 20261005190000): the roll's size,
 * its bounds and its ceiling's multiple live in TypeScript (`roll.ts`), the camera video's two bounds in
 * `media/limits.ts`, and each is restated in the winning SQL (the stamp that fills a roll in, the CHECK that bounds one,
 * the constants of the bodies that count);
 * the sentences the shot past the roll, past its ceiling and an over-long video meet are raised by `create_media` and
 * said by the presign. A change on one side alone fails here.
 */
import { describe, expect, it } from "vitest";

import { readMigrations } from "@/lib/db/testing/migrations";
import {
  clampRoll,
  FILM_ROLLS,
  isRollSize,
  parseRollCount,
  ROLL_MAX,
  ROLL_MIN,
  ROLL_RETAKES,
  ROLL_RETAKES_SPENT_MESSAGE,
  ROLL_SHOTS,
  rollHasFrame,
  rollRefusal,
  rollRefusalSentence,
  rollShots,
  rollSizeOf,
  rollSpentMessage,
} from "@/lib/disposable/roll";
import {
  CAMERA_VIDEO_TOO_LARGE_MESSAGE,
  CAMERA_VIDEO_TOO_LONG_MESSAGE,
} from "@/lib/disposable/shot";
import {
  CAMERA_VIDEO_GRACE_SECONDS,
  CAMERA_VIDEO_MAX_BYTES,
  CAMERA_VIDEO_SECONDS,
} from "@/lib/media/limits";

function migrations(): { file: string; sql: string }[] {
  return readMigrations().map(({ file, sql }) => ({
    file,
    sql: sql.replace(/--[^\n]*/g, ""),
  }));
}

/** The winning body of `public.<name>(`, comments stripped, whitespace collapsed. */
function body(name: string): string {
  let found: string | null = null;
  for (const { sql } of migrations()) {
    const re = new RegExp(
      `create (?:or replace )?function public\\.${name}\\(`,
      "g",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql))) {
      const close = sql.indexOf("$$;", sql.indexOf("as $$", m.index) + 5);
      found = sql.slice(m.index, close).replace(/\s+/g, " ");
    }
  }
  expect(found, `${name} defined nowhere`).not.toBeNull();
  return found!;
}

/** Every migration's text, whitespace collapsed (a constraint has no "winning body" to read). */
function allSql(): string {
  return migrations()
    .map((m) => m.sql)
    .join("\n")
    .replace(/\s+/g, " ");
}

/** The bounds of the last `events_roll_size_range` the set adds, in file order: the CHECK the database holds. */
function winningRollRange(): [number, number] {
  let found: [number, number] | null = null;
  const re =
    /add constraint events_roll_size_range check \(roll_size between (\d+) and (\d+)\)/g;
  for (const { sql } of migrations()) {
    for (const m of sql.replace(/\s+/g, " ").matchAll(re)) {
      found = [Number(m[1]), Number(m[2])];
    }
  }
  expect(found, "events_roll_size_range added nowhere").not.toBeNull();
  return found!;
}

describe("the roll's one home and its SQL mirrors", () => {
  // ★ RESHAPED ON PURPOSE (settings-wiring, 20261005190000; scar kept: a camera's roll is filled in at ROLL_SHOTS, and
  // the CHECK holds a host to the bounds this file holds; reason dropped: ROLL_SHOTS was the most she could name, and free
  // uploads cleared her roll). Will's `roll=both` names any count from 1 to 99, and her roll outlives the camera.
  it("a camera's roll is filled in at ROLL_SHOTS, free uploads keep hers, and a host names ROLL_MIN to ROLL_MAX", () => {
    const stamp = body("events_reveal_stamp");
    expect(stamp).toContain(
      `if new.capture = 'camera' then new.roll_size := coalesce(new.roll_size, ${ROLL_SHOTS}); end if;`,
    );
    // Nothing in the stamp clears her roll: a style switch, or the camera off and on, comes back to it.
    expect(stamp).not.toContain("new.roll_size := null");
    expect(winningRollRange()).toEqual([ROLL_MIN, ROLL_MAX]);
    // A camera always carries a roll; free uploads may keep one (the old two-way tie is dropped in the same file).
    expect(allSql()).toContain(
      "add constraint events_camera_has_roll check (capture <> 'camera' or roll_size is not null)",
    );
    expect(allSql()).toContain(
      "drop constraint events_roll_size_follows_capture",
    );
  });

  it("film's three sizes stand inside the bounds, the usual among them", () => {
    for (const n of FILM_ROLLS) expect(isRollSize(n)).toBe(true);
    expect(FILM_ROLLS).toContain(ROLL_SHOTS);
    expect(isRollSize(ROLL_MIN)).toBe(true);
    expect(isRollSize(ROLL_MAX)).toBe(true);
  });

  it.each(["create_media", "get_upload_context", "get_upload_gate"])(
    "%s restates ROLL_RETAKES and counts against the event's own roll",
    (name) => {
      const sql = body(name);
      expect(sql).toContain(
        `c_roll_retakes constant integer := ${ROLL_RETAKES};`,
      );
      expect(sql).toContain("v_event.roll_size * c_roll_retakes");
    },
  );

  it("create_media refuses the shot past the roll, and past its ceiling, in the sentences the presign says", () => {
    const sql = body("create_media");
    // RAISE's own format: the roll's size where the sentence says it.
    const raised =
      /raise exception '([^']*(?:''[^']*)*)', v_event\.roll_size/.exec(sql);
    expect(raised, "the roll's raise").not.toBeNull();
    const sentence = raised![1].replace(/''/g, "'");
    for (const size of [24, 12, 1]) {
      expect(sentence.replace("%", String(size))).toBe(rollSpentMessage(size));
    }
    expect(sql).toContain(
      `raise exception '${ROLL_RETAKES_SPENT_MESSAGE.replace(/'/g, "''")}'`,
    );
    expect(rollSpentMessage(ROLL_SHOTS)).toBe(
      "You've taken all 24 shots on your roll.",
    );
  });

  // ★ RESHAPED ON PURPOSE (camera-clip, 20261004120000; scar kept: create_media holds the clip's bytes, seconds and grace
  // at the TypeScript values, and says each refusal in the sentence the presign says; reason dropped: the grace folded
  // into one literal (10.5) and the number typed again inside each sentence). Each SQL constant is read beside its
  // TypeScript twin, the check is the sum, and each sentence is a format() of the constant itself, so one literal
  // drives the check and its words.
  it("the camera video's bytes, seconds and grace are create_media's, read beside their TypeScript twins", () => {
    const sql = body("create_media");
    const constant = (name: string, type: string): string => {
      const m = new RegExp(`${name} constant ${type} := ([^;]+);`).exec(sql);
      expect(m, `${name} in create_media`).not.toBeNull();
      return m![1];
    };
    expect(CAMERA_VIDEO_MAX_BYTES % 1024 ** 2).toBe(0);
    expect(constant("c_camera_video_bytes", "bigint")).toBe(
      `${CAMERA_VIDEO_MAX_BYTES / 1024 ** 2}::bigint * 1024 * 1024`,
    );
    expect(Number(constant("c_camera_video_seconds", "double precision"))).toBe(
      CAMERA_VIDEO_SECONDS,
    );
    expect(Number(constant("c_camera_video_grace", "double precision"))).toBe(
      CAMERA_VIDEO_GRACE_SECONDS,
    );
    // The checks, as shot.ts writes them: a clip is too long past its seconds plus the grace, too large past its bytes.
    expect(sql).toContain("p_file_size_bytes > c_camera_video_bytes");
    expect(sql).toContain(
      "p_duration_seconds > c_camera_video_seconds + c_camera_video_grace",
    );
  });

  it("create_media says the camera video's two refusals as the presign does, each a format() of its constant", () => {
    const sql = body("create_media");
    const said = [
      ...sql.matchAll(
        /raise exception using message = format\('((?:[^']|'')*)', ([^;]*?)\), errcode = 'check_violation';/g,
      ),
    ];
    // Two, in the order the camera checks them: the bytes, then the length; each argument the constant itself.
    expect(said.map((m) => m[2])).toEqual([
      "c_camera_video_bytes / (1024 * 1024)",
      "c_camera_video_seconds",
    ]);
    expect(
      said[0][1].replace("%s", String(CAMERA_VIDEO_MAX_BYTES / 1024 ** 2)),
    ).toBe(CAMERA_VIDEO_TOO_LARGE_MESSAGE);
    expect(said[1][1].replace("%s", String(CAMERA_VIDEO_SECONDS))).toBe(
      CAMERA_VIDEO_TOO_LONG_MESSAGE,
    );
    // No number is typed in either sentence: the constant is the only place it lives.
    for (const m of said) expect(m[1]).not.toMatch(/\d/);
    // The words mapCheckViolation routes by stay in them.
    expect(said[0][1]).toContain("exceeds");
    expect(said[1][1]).toContain("longer than");
  });
});

describe("parseRollCount", () => {
  it("reads {used, cap, taken, ceiling}", () => {
    expect(parseRollCount({ used: 3, cap: 24, taken: 5, ceiling: 72 })).toEqual(
      { used: 3, cap: 24, taken: 5, ceiling: 72 },
    );
    expect(parseRollCount({ used: 0, cap: 12, taken: 0, ceiling: 36 })).toEqual(
      { used: 0, cap: 12, taken: 0, ceiling: 36 },
    );
  });

  it("answers null for free uploads and for anything it cannot read", () => {
    for (const bad of [
      null,
      undefined,
      [],
      "24",
      { used: -1, cap: 24, taken: 0, ceiling: 72 },
      { used: 1.5, cap: 24, taken: 2, ceiling: 72 },
      { used: 1, cap: 0, taken: 1, ceiling: 72 },
      { used: 1, cap: 24, taken: 1, ceiling: 0 },
      { used: "1", cap: 24, taken: 1, ceiling: 72 },
      { used: 1, cap: 24 },
      { cap: 24, taken: 1, ceiling: 72 },
    ]) {
      expect(parseRollCount(bad)).toBeNull();
    }
  });
});

describe("the refusal the next shot meets", () => {
  const roll = (used: number, taken: number, cap = 24) => ({
    used,
    cap,
    taken,
    ceiling: cap * ROLL_RETAKES,
  });

  it("a frame is left until her live shots reach the roll, whatever she took before", () => {
    expect(rollRefusal(roll(23, 23))).toBeNull();
    expect(rollRefusal(roll(23, 60))).toBeNull();
    expect(rollRefusal(roll(24, 24))).toBe(rollSpentMessage(24));
    expect(rollRefusal(roll(12, 12, 12))).toBe(rollSpentMessage(12));
  });

  it("the ceiling holds once she has taken three rolls' worth, a frame free or not; the roll speaks first", () => {
    expect(rollRefusal(roll(10, 72))).toBe(ROLL_RETAKES_SPENT_MESSAGE);
    expect(rollRefusal(roll(10, 71))).toBeNull();
    expect(rollRefusal(roll(24, 72))).toBe(rollSpentMessage(24));
  });

  it("no roll is no limit", () => {
    expect(rollRefusal(null)).toBeNull();
    expect(rollHasFrame(null)).toBe(true);
    expect(rollHasFrame(roll(23, 23))).toBe(true);
    expect(rollHasFrame(roll(24, 24))).toBe(false);
  });

  it("reads back the server's two sentences, and nothing else", () => {
    expect(rollRefusalSentence(rollSpentMessage(24))).toBe(
      rollSpentMessage(24),
    );
    expect(rollRefusalSentence(rollSpentMessage(7))).toBe(rollSpentMessage(7));
    expect(rollRefusalSentence(ROLL_RETAKES_SPENT_MESSAGE)).toBe(
      ROLL_RETAKES_SPENT_MESSAGE,
    );
    for (const other of [
      "You've taken all your shots on your roll.",
      "Storage capacity exceeded for this plan.",
      "You've taken all 24 shots on your roll. <script>",
      "",
    ]) {
      expect(rollRefusalSentence(other)).toBeNull();
    }
  });
});

describe("a roll a host may name", () => {
  it("is a whole number of shots from ROLL_MIN to ROLL_MAX, and nothing else", () => {
    for (const ok of [1, 8, 12, 24, 36, 50, 99])
      expect(isRollSize(ok)).toBe(true);
    for (const bad of [
      0,
      -1,
      100,
      12.5,
      Number.NaN,
      Infinity,
      "24",
      null,
      undefined,
    ]) {
      expect(isRollSize(bad), String(bad)).toBe(false);
    }
    expect(rollSizeOf(36)).toBe(36);
    expect(rollSizeOf(100)).toBeNull();
    expect(rollSizeOf(null)).toBeNull();
  });

  it("a stepper lands inside the bounds, whole, whatever it is handed", () => {
    expect(clampRoll(0)).toBe(ROLL_MIN);
    expect(clampRoll(-20)).toBe(ROLL_MIN);
    expect(clampRoll(100)).toBe(ROLL_MAX);
    expect(clampRoll(36.4)).toBe(36);
    expect(clampRoll(Number.NaN)).toBe(ROLL_SHOTS);
  });

  it("says one shot as one", () => {
    expect(rollShots(1)).toBe("1 shot");
    expect(rollShots(12)).toBe("12 shots");
  });

  it("the server's roll sentence reads back at any size a host may name", () => {
    for (const n of [ROLL_MIN, 12, ROLL_MAX]) {
      expect(rollRefusalSentence(rollSpentMessage(n))).toBe(
        rollSpentMessage(n),
      );
    }
  });
});
