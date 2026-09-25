/**
 * THE EMAIL CHANGE'S TWO-CODE MACHINE (lp/identity-email), driven with no browser.
 *
 * What has to keep working: the address moves only once BOTH codes are in, in either order; one
 * side's refusal never touches the other; a resend starts both sides over (GoTrue mints two new codes
 * and zeroes the confirmation count); a change left waiting is one tap away; and a pending change
 * reads as live only while its codes can still verify.
 */
import { describe, expect, it } from "vitest";

import {
  EMAIL_CHANGE_TTL_MS,
  emailSectionReducer,
  focusSide,
  initialEmailSectionState,
  livePendingChange,
  newEmailSchema,
  parseEmailChangeHint,
  pendingPrompt,
  type EmailSectionEvent,
  type EmailSectionState,
  type PendingState,
} from "./email-change";

const NEW = "new@example.com";
const OLD = "old@example.com";
const ADDRESSES = { current: OLD, new: NEW };

function run(
  events: EmailSectionEvent[],
  from: EmailSectionState = { step: "idle", parked: null },
): EmailSectionState {
  return events.reduce(emailSectionReducer, from);
}

function pending(state: EmailSectionState): PendingState {
  expect(state.step).toBe("pending");
  return state as PendingState;
}

const SENT: EmailSectionEvent[] = [
  { type: "edit" },
  { type: "sent", address: NEW },
];

describe("the two codes", () => {
  it("opens both sides waiting once the codes go out", () => {
    const s = pending(run(SENT));
    expect(s).toMatchObject({
      address: NEW,
      current: { status: "waiting" },
      new: { status: "waiting" },
      hint: null,
    });
    expect(pendingPrompt(s, ADDRESSES)).toMatch(
      /each address, in either order/,
    );
  });

  it("current first: the first confirmation asks for the other, the second completes", () => {
    const half = pending(
      run([
        ...SENT,
        { type: "check", side: "current" },
        { type: "half", side: "current" },
      ]),
    );
    expect(half.current.status).toBe("confirmed");
    expect(half.new.status).toBe("waiting");
    expect(pendingPrompt(half, ADDRESSES)).toBe(
      `Confirmed. Now enter the code we sent to ${NEW}.`,
    );
    expect(focusSide(half)).toBe("new");

    const done = run(
      [
        { type: "check", side: "new" },
        { type: "done", email: NEW },
      ],
      half,
    );
    expect(done).toEqual({ step: "done", email: NEW });
  });

  it("new first works the same way round", () => {
    const half = pending(
      run([
        ...SENT,
        { type: "check", side: "new" },
        { type: "half", side: "new" },
      ]),
    );
    expect(half.new.status).toBe("confirmed");
    expect(pendingPrompt(half, ADDRESSES)).toBe(
      `Confirmed. Now enter the code we sent to ${OLD}.`,
    );
    expect(focusSide(half)).toBe("current");
    expect(run([{ type: "done", email: NEW }], half)).toEqual({
      step: "done",
      email: NEW,
    });
  });

  it("a refusal on one side never touches the other", () => {
    const s = pending(
      run([
        ...SENT,
        { type: "check", side: "current" },
        { type: "half", side: "current" },
        { type: "check", side: "new" },
        { type: "refused", side: "new", message: "That code didn't work." },
      ]),
    );
    expect(s.current.status).toBe("confirmed");
    expect(s.new).toEqual({
      status: "failed",
      message: "That code didn't work.",
    });
    // Typing again clears the failure, on that side only.
    const retried = pending(run([{ type: "retry", side: "new" }], s));
    expect(retried.new.status).toBe("waiting");
    expect(retried.current.status).toBe("confirmed");
  });

  it("a confirmed side cannot be checked, refused or reset: its code was spent", () => {
    const half = pending(run([...SENT, { type: "half", side: "current" }]));
    for (const event of [
      { type: "check", side: "current" },
      { type: "refused", side: "current", message: "x" },
      { type: "retry", side: "current" },
    ] as EmailSectionEvent[]) {
      expect(pending(run([event], half)).current.status).toBe("confirmed");
    }
  });

  it("a side already checking waits for its answer rather than sending twice", () => {
    const checking = run([...SENT, { type: "check", side: "new" }]);
    expect(run([{ type: "check", side: "new" }], checking)).toBe(checking);
  });

  it("★ a resend starts BOTH sides over, a confirmed one included", () => {
    const s = pending(
      run([
        ...SENT,
        { type: "half", side: "current" },
        { type: "refused", side: "new", message: "x" },
        { type: "sent", address: NEW },
      ]),
    );
    expect(s.current.status).toBe("waiting");
    expect(s.new.status).toBe("waiting");
  });
});

describe("leaving and coming back", () => {
  it("Not now parks the change one tap away, exactly as it stood", () => {
    const half = run([...SENT, { type: "half", side: "new" }]);
    const parked = run([{ type: "park" }], half);
    expect(parked).toEqual({ step: "idle", parked: half });
    expect(run([{ type: "resume" }], parked)).toEqual(half);
  });

  it("Cancel on the address field goes back to what was there", () => {
    const half = run([...SENT, { type: "half", side: "new" }]);
    const parked = run([{ type: "park" }], half);
    const editing = run([{ type: "edit" }], parked);
    expect(editing).toEqual({ step: "editing", parked: half });
    expect(run([{ type: "cancel" }], editing)).toEqual(parked);
  });

  it("a new request replaces the parked change", () => {
    const parked = run([
      ...SENT,
      { type: "park" },
      { type: "edit" },
      { type: "sent", address: "other@example.com" },
    ]);
    expect(pending(parked).address).toBe("other@example.com");
  });

  it("after a change, Change starts clean", () => {
    const done: EmailSectionState = { step: "done", email: NEW };
    expect(run([{ type: "edit" }], done)).toEqual({
      step: "editing",
      parked: null,
    });
  });

  it("events that do not belong to a step change nothing", () => {
    const idle: EmailSectionState = { step: "idle", parked: null };
    for (const event of [
      { type: "resume" },
      { type: "park" },
      { type: "cancel" },
      { type: "sent", address: NEW },
      { type: "check", side: "new" },
      { type: "half", side: "new" },
      { type: "done", email: NEW },
    ] as EmailSectionEvent[]) {
      expect(run([event], idle)).toBe(idle);
    }
  });
});

describe("where the section starts", () => {
  const LIVE = { address: NEW, sentAt: "2026-09-25T10:00:00.000Z" };

  it("a live pending change opens its panels, carrying a tapped link's news", () => {
    expect(
      pending(
        initialEmailSectionState({ pending: LIVE, hint: "half", email: OLD }),
      ),
    ).toMatchObject({ address: NEW, hint: "half" });
    expect(
      pending(
        initialEmailSectionState({ pending: LIVE, hint: null, email: OLD }),
      ).hint,
    ).toBeNull();
    expect(
      pendingPrompt(
        pending(
          initialEmailSectionState({ pending: LIVE, hint: "half", email: OLD }),
        ),
        ADDRESSES,
      ),
    ).toMatch(/One of the two addresses is confirmed/);
    expect(
      pendingPrompt(
        pending(
          initialEmailSectionState({
            pending: LIVE,
            hint: "failed",
            email: OLD,
          }),
        ),
        ADDRESSES,
      ),
    ).toMatch(/That link didn't work/);
  });

  it("a finished change says so, and nothing pending means the plain row", () => {
    expect(
      initialEmailSectionState({ pending: null, hint: "done", email: NEW }),
    ).toEqual({ step: "done", email: NEW });
    expect(
      initialEmailSectionState({ pending: null, hint: "half", email: OLD }),
    ).toEqual({ step: "idle", parked: null });
    expect(
      initialEmailSectionState({ pending: null, hint: null, email: OLD }),
    ).toEqual({ step: "idle", parked: null });
  });

  it("a hint is one of three words, and anything else is nothing", () => {
    expect(parseEmailChangeHint("half")).toBe("half");
    expect(parseEmailChangeHint("done")).toBe("done");
    expect(parseEmailChangeHint("failed")).toBe("failed");
    for (const raw of [undefined, "", "pro", "HALF", ["half"]]) {
      expect(parseEmailChangeHint(raw)).toBeNull();
    }
  });
});

describe("livePendingChange", () => {
  const SENT_AT = "2026-09-25T10:00:00.000Z";
  const sentMs = Date.parse(SENT_AT);

  it("is live while the codes can verify, and dead from the hour on", () => {
    const user = { new_email: NEW, email_change_sent_at: SENT_AT };
    expect(livePendingChange(user, sentMs + 60_000)).toEqual({
      address: NEW,
      sentAt: SENT_AT,
    });
    expect(
      livePendingChange(user, sentMs + EMAIL_CHANGE_TTL_MS - 1),
    ).not.toBeNull();
    expect(livePendingChange(user, sentMs + EMAIL_CHANGE_TTL_MS)).toBeNull();
  });

  it("reads no change without an address, a stamp, or a user", () => {
    expect(livePendingChange(null, sentMs)).toBeNull();
    expect(
      livePendingChange(
        { new_email: "", email_change_sent_at: SENT_AT },
        sentMs,
      ),
    ).toBeNull();
    expect(
      livePendingChange({ new_email: NEW, email_change_sent_at: null }, sentMs),
    ).toBeNull();
    expect(
      livePendingChange(
        { new_email: NEW, email_change_sent_at: "not a date" },
        sentMs,
      ),
    ).toBeNull();
  });
});

describe("newEmailSchema", () => {
  it("trims and lowercases before it checks", () => {
    expect(newEmailSchema.parse("  Maya@Example.COM ")).toBe(
      "maya@example.com",
    );
  });

  it("refuses what is not an address", () => {
    for (const raw of ["", "nope", "a@b", "@example.com"]) {
      expect(newEmailSchema.safeParse(raw).success).toBe(false);
    }
  });
});
