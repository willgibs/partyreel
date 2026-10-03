/**
 * THE WAIT IN A GUEST'S WORDS (the-wait r1, `model=time`): one word for every wait, Developing, and the small
 * distinction between a reviewed album and a disposable said by the clock alone; the preset named on the cover.
 */
import { describe, expect, it } from "vitest";

import {
  countdownWords,
  coverEyebrow,
  developedWhen,
  keepWaitLine,
  restWaitLine,
  WAIT_TITLE,
  waitClockLine,
  waitRule,
  waitWords,
} from "@/lib/disposable/wait-words";

/** 10:40 pm on the party's night, in the test's own zone (the words are said in the reader's clock). */
const NIGHT = new Date(2026, 9, 10, 22, 40).getTime();
const NINE_AM = new Date(2026, 9, 11, 9, 0).toISOString();

describe("one word for every wait, and the clock that tells them apart", () => {
  it("is Developing, whether the host lets each in or the album develops at a time", () => {
    expect(WAIT_TITLE).toBe("Developing");
  });

  it("★ the small distinction: as the host lets them in, or all at once at the develop time", () => {
    expect(waitClockLine({ kind: "held", hostName: "Maya" }, NIGHT)).toBe(
      "As Maya lets them in",
    );
    expect(waitClockLine({ kind: "held", hostName: null }, NIGHT)).toBe(
      "As the host lets them in",
    );
    expect(waitClockLine({ kind: "develop", developsAt: NINE_AM }, NIGHT)).toBe(
      "All at once at 9 am",
    );
  });

  it("counts down to a develop: hours and minutes inside a day, then days, and nothing once it is reached", () => {
    expect(countdownWords(NINE_AM, NIGHT)).toBe("in 10 h 20 min");
    expect(countdownWords(NINE_AM, Date.parse(NINE_AM) - 3 * 60_000)).toBe(
      "in 3 min",
    );
    expect(countdownWords(NINE_AM, Date.parse(NINE_AM) - 2 * 3_600_000)).toBe(
      "in 2 h",
    );
    expect(countdownWords(NINE_AM, Date.parse(NINE_AM) - 20_000)).toBe(
      "in under a minute",
    );
    expect(
      countdownWords(NINE_AM, Date.parse(NINE_AM) - 3 * 86_400_000 - 60_000),
    ).toBe("in 3 days");
    expect(
      countdownWords(NINE_AM, Date.parse(NINE_AM) - 86_400_000 - 60_000),
    ).toBe("in 1 day");
    expect(countdownWords(NINE_AM, Date.parse(NINE_AM))).toBeNull();
  });
});

describe("the rule, before her first add and atop her uploads (one rule, one wording)", () => {
  it("says how uploads develop here, the time in her own clock once it is known", () => {
    expect(waitRule({ kind: "held", hostName: "Maya" }, NIGHT)).toBe(
      "Uploads develop as Maya lets each one in.",
    );
    expect(waitRule({ kind: "develop", developsAt: NINE_AM }, NIGHT)).toBe(
      "Uploads develop all at once at 9 am.",
    );
    // Before hydration the time is not hers to say yet.
    expect(waitRule({ kind: "develop", developsAt: NINE_AM }, null)).toBe(
      "Uploads develop all at once.",
    );
  });
});

describe("where what she sent went: the keep and the failure sheet", () => {
  it("★ never 'joined the album' for a photo that waits: it develops, as the host lets it in or with everyone's", () => {
    expect(
      keepWaitLine({
        subject: "Your photo",
        one: true,
        clock: { kind: "held", hostName: "Maya" },
        nowMs: NIGHT,
      }),
    ).toBe("Your photo develops as Maya lets it in.");
    expect(
      keepWaitLine({
        subject: "Your 3 photos",
        one: false,
        clock: { kind: "held", hostName: "Maya" },
        nowMs: NIGHT,
      }),
    ).toBe("Your 3 photos develop as Maya lets them in.");
    expect(
      keepWaitLine({
        subject: "Your 5 shots",
        one: false,
        clock: { kind: "develop", developsAt: NINE_AM },
        nowMs: NIGHT,
      }),
    ).toBe("Your 5 shots develop with everyone's at 9 am.");
    expect(
      keepWaitLine({
        subject: "Your shot",
        one: true,
        clock: { kind: "develop", developsAt: NINE_AM },
        nowMs: null,
      }),
    ).toBe("Your shot develops with everyone's.");
  });

  it("the rest of a run that half failed waits the same way", () => {
    expect(restWaitLine({ kind: "held", hostName: "Maya" }, NIGHT)).toBe(
      "Everything else develops as Maya lets it in.",
    );
    expect(restWaitLine({ kind: "develop", developsAt: NINE_AM }, NIGHT)).toBe(
      "Everything else develops with everyone's at 9 am.",
    );
  });
});

describe("the cover names the preset (Will's `name=disposable`): 'Disposable · develops 9 am'", () => {
  it("★ a camera with a develop time ahead is the Disposable, and says when", () => {
    expect(
      coverEyebrow({ capture: "camera", developsAt: NINE_AM }, NIGHT),
    ).toBe("Disposable · develops at 9 am");
    expect(coverEyebrow({ capture: "camera", developsAt: NINE_AM }, null)).toBe(
      "Disposable",
    );
  });

  it("the morning after it says it developed; free uploads with a develop time say only when", () => {
    const morning = Date.parse(NINE_AM) + 2 * 3_600_000;
    expect(
      coverEyebrow({ capture: "camera", developsAt: NINE_AM }, morning),
    ).toBe("Disposable · developed at 9 am");
    expect(
      coverEyebrow({ capture: "upload", developsAt: NINE_AM }, NIGHT),
    ).toBe("Develops at 9 am");
    expect(
      coverEyebrow({ capture: "upload", developsAt: NINE_AM }, morning),
    ).toBeNull();
  });

  it("an album that never develops wears nothing over its name", () => {
    expect(
      coverEyebrow({ capture: "upload", developsAt: null }, NIGHT),
    ).toBeNull();
    expect(
      coverEyebrow({ capture: "camera", developsAt: null }, NIGHT),
    ).toBeNull();
  });

  it("says a develop long past by its day", () => {
    const later = Date.parse(NINE_AM) + 3 * 86_400_000;
    expect(developedWhen(NINE_AM, later)).toBe(
      new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
        new Date(NINE_AM),
      ),
    );
    const weeks = Date.parse(NINE_AM) + 20 * 86_400_000;
    expect(developedWhen(NINE_AM, weeks)).toBe(
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(NINE_AM)),
    );
  });
});

describe("waitWords: the page's one reading of what hers wait for", () => {
  it("the develop time while it is ahead, else the host's approval, else nothing waits", () => {
    expect(waitWords({ waits: true, developsAt: NINE_AM }, "Maya")).toEqual({
      kind: "develop",
      developsAt: NINE_AM,
    });
    expect(waitWords({ waits: true, developsAt: null }, "Maya")).toEqual({
      kind: "held",
      hostName: "Maya",
    });
    expect(waitWords({ waits: false, developsAt: null }, "Maya")).toBeNull();
  });
});
