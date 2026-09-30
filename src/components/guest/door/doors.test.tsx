/**
 * THE DOORS' OWN SCREENS (event-settings r1), against the real components: the shut door's one message
 * (event-safety `newcomer=same`, locked-door `previous=private`), the unlisted reader's own foot under
 * it (`unlisted=ask`, placed there by locked-door r2), the held door that checks in and opens by itself
 * (`waiting=held`), and the one-tap ask where the host lets each guest in. The routes are stand-ins.
 *
 * FUNCTION, NOT COPY: the words stay open. What is held is what each screen must never do: name the
 * album or its host on the shut message, move that message for any one reader, play "You're in" for a
 * door that has not opened, or poll a tab nobody is looking at.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

const askToJoinEvent = vi.fn();
const checkInAtDoor = vi.fn();
vi.mock("@/lib/guest/join", () => ({
  askToJoinEvent: (...args: unknown[]) => askToJoinEvent(...args),
  checkInAtDoor: (...args: unknown[]) => checkInAtDoor(...args),
}));

const switchEmail = vi.fn();
vi.mock("@/components/guest/door/switch-email", () => ({
  switchEmail: () => switchEmail(),
}));

const setStoredSession = vi.fn();
vi.mock("@/lib/guest/use-stored-session", () => ({
  setStoredSession: (...args: unknown[]) => setStoredSession(...args),
}));

const { ShutDoor, shutDoorCopy } =
  await import("@/components/guest/door/shut-door");
const { UnlistedAsk, unlistedAskCopy } =
  await import("@/components/guest/door/unlisted-ask");
const { WaitingStep, waitingCopy, WAITING_CHECK_IN_MS } =
  await import("@/components/guest/door/waiting-step");
const { AskStep, askCopy } = await import("@/components/guest/door/ask-step");

const QR = "tok-door";
const TICKET = "e".repeat(64);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

/** The message a shut door shows: its heading and its line, nothing else. */
function message(): string {
  const heading = screen.getByRole("heading", { level: 1 });
  return `${heading.textContent} | ${heading.parentElement?.querySelector("p")?.textContent}`;
}

describe("the shut door", () => {
  it("★ says only what every cause shares: no album, no host", () => {
    for (const previous of [false, true]) {
      const copy = shutDoorCopy(previous);
      expect(`${copy.title} ${copy.description}`).not.toMatch(/Maya|30th/);
      expect(copy.description).toMatch(/host/);
    }
  });

  it("someone who was in reads one line more than a newcomer", () => {
    expect(shutDoorCopy(true)).not.toEqual(shutDoorCopy(false));
  });

  it("a visitor signed out gets the quiet way back in; someone signed in does not", () => {
    render(
      <ShutDoor previous={false} signedIn={false} returnTo={`/e/${QR}`} />,
    );
    const back = screen.getByRole("link", { name: "Log in" });
    expect(back.getAttribute("href")).toContain("/login");
    expect(back.getAttribute("href")).toContain(encodeURIComponent(`/e/${QR}`));
    cleanup();
    render(<ShutDoor previous={false} signedIn returnTo={`/e/${QR}`} />);
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "What is Partyreel?" }),
    ).toBeTruthy();
  });

  it("★ the unlisted reader's foot replaces the way home, and the message never moves", () => {
    render(<ShutDoor previous={false} signedIn returnTo={`/e/${QR}`} />);
    const everyone = message();
    cleanup();
    render(
      <ShutDoor
        previous={false}
        signedIn
        returnTo={`/e/${QR}`}
        ask={{ qrToken: QR, hostName: "Maya" }}
      />,
    );
    expect(message()).toBe(everyone);
    expect(
      screen.getByRole("button", { name: unlistedAskCopy("Maya").primary }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Use a different email" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "What is Partyreel?" }),
    ).toBeNull();
  });
});

describe("the unlisted reader's ask", () => {
  it("names the host she asks, or the host when there is no name", () => {
    expect(unlistedAskCopy("Maya").primary).toContain("Maya");
    expect(unlistedAskCopy("  ").primary).toContain("the host");
    expect(unlistedAskCopy(null).primary).toContain("the host");
  });

  it("★ asking keeps the ticket on this device and refreshes onto the held door", async () => {
    askToJoinEvent.mockResolvedValue({
      ok: true,
      guest: { sessionToken: TICKET, admission: "waiting" },
    });
    render(<UnlistedAsk qrToken={QR} hostName="Maya" />);
    fireEvent.click(
      screen.getByRole("button", { name: unlistedAskCopy("Maya").primary }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(askToJoinEvent).toHaveBeenCalledWith({ qrToken: QR });
    expect(setStoredSession).toHaveBeenCalledWith(QR, TICKET);
  });

  it("★ asking marks the welcome seen, so the held door comes with no welcome in front of it (build 23's NIT-1)", async () => {
    askToJoinEvent.mockResolvedValue({
      ok: true,
      guest: { sessionToken: TICKET, admission: "waiting" },
    });
    render(<UnlistedAsk qrToken={QR} hostName="Maya" />);
    fireEvent.click(
      screen.getByRole("button", { name: unlistedAskCopy("Maya").primary }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
  });

  it("a refused ask says why, stores nothing and stays put", async () => {
    askToJoinEvent.mockResolvedValue({
      ok: false,
      refusal: { message: "This event is private." },
    });
    render(<UnlistedAsk qrToken={QR} hostName="Maya" />);
    fireEvent.click(
      screen.getByRole("button", { name: unlistedAskCopy("Maya").primary }),
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "This event is private.",
    );
    expect(setStoredSession).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    // Nothing was asked, so nothing is marked: the welcome still greets her on the album's own door.
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBeNull();
  });

  it('"Use a different email" switches the address', () => {
    render(<UnlistedAsk qrToken={QR} hostName="Maya" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Use a different email" }),
    );
    expect(switchEmail).toHaveBeenCalledOnce();
  });
});

describe("the held door", () => {
  const mount = () => {
    const onLetIn = vi.fn();
    const onMoved = vi.fn();
    render(
      <WaitingStep
        qrToken={QR}
        sessionToken={TICKET}
        hostName="Maya"
        onLetIn={onLetIn}
        onMoved={onMoved}
      />,
    );
    return { onLetIn, onMoved };
  };

  it("names who lets her in", () => {
    expect(waitingCopy("Maya").title).toContain("Maya");
    expect(waitingCopy(null).title).toContain("host");
  });

  it("★ checks in at once, then about every 30 s, carrying her ticket", async () => {
    vi.useFakeTimers();
    checkInAtDoor.mockResolvedValue("waiting");
    mount();
    await act(async () => {});
    expect(checkInAtDoor).toHaveBeenCalledTimes(1);
    expect(checkInAtDoor).toHaveBeenCalledWith({
      qrToken: QR,
      sessionToken: TICKET,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WAITING_CHECK_IN_MS);
    });
    expect(checkInAtDoor).toHaveBeenCalledTimes(2);
  });

  it("★ let in: the door opens by itself, and stops asking", async () => {
    vi.useFakeTimers();
    checkInAtDoor.mockResolvedValue("in");
    const { onLetIn, onMoved } = mount();
    await act(async () => {});
    expect(onLetIn).toHaveBeenCalledOnce();
    expect(onMoved).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WAITING_CHECK_IN_MS * 3);
    });
    expect(checkInAtDoor).toHaveBeenCalledTimes(1);
  });

  it("★ a door that moved refreshes with no beat", async () => {
    checkInAtDoor.mockResolvedValue("moved");
    const { onLetIn, onMoved } = mount();
    await waitFor(() => expect(onMoved).toHaveBeenCalledOnce());
    expect(onLetIn).not.toHaveBeenCalled();
  });

  it("a hidden tab waits for its return rather than polling", async () => {
    vi.useFakeTimers();
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    checkInAtDoor.mockResolvedValue("waiting");
    mount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WAITING_CHECK_IN_MS * 2);
    });
    expect(checkInAtDoor).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(checkInAtDoor).toHaveBeenCalledTimes(1);
    visibility.mockRestore();
  });
});

describe("the ask where the host lets each guest in", () => {
  it("one tap asks, and hands the waiting ticket on", async () => {
    const guest = { sessionToken: TICKET, admission: "waiting" };
    askToJoinEvent.mockResolvedValue({ ok: true, guest });
    const onAsked = vi.fn();
    render(<AskStep qrToken={QR} hostName="Maya" onAsked={onAsked} />);
    expect(askCopy("Maya").title).toContain("Maya");
    fireEvent.click(
      screen.getByRole("button", { name: askCopy("Maya").primary }),
    );
    await waitFor(() => expect(onAsked).toHaveBeenCalledWith(guest));
  });
});
