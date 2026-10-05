/**
 * THE RETURN WORD LEAVES THE ADDRESS, AND NEXT'S COPY OF IT TOO (history-state-policy.test.ts). Back from Google,
 * `?drive=` is read on the page's first commit by every place that may take it (the app-wide flag, Take it home, the
 * picker), so the write that cleans the address runs from a MOUNT effect, before Next's history patch is installed:
 * it goes a microtask late and hands `null`, the first place takes the word and the rest read nothing.
 */
import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

import { takeReturnWord } from "./drive-client";

function Probe({ onWord }: { onWord: (word: string | null) => void }) {
  useEffect(() => {
    onWord(takeReturnWord());
  }, [onWord]);
  return null;
}

describe("the return word", () => {
  let next: NextHistory;
  beforeEach(() => {
    next = installNextHistory();
  });
  afterEach(() => {
    next.uninstall();
    window.history.replaceState(null, "", "/");
  });

  it("★ is taken once on the first commit, and leaves the bar and Next's copy alike, keeping the rest", async () => {
    next.land("/dashboard/e1?drive=connected&keep=1#google-drive");
    const words: (string | null)[] = [];
    const onWord = (word: string | null) => words.push(word);
    render(
      <NextRouterStandIn>
        <Probe onWord={onWord} />
        <Probe onWord={onWord} />
      </NextRouterStandIn>,
    );
    await act(async () => {});
    expect(words).toEqual(["connected", null]);
    expect(window.location.search).toBe("?keep=1");
    expect(window.location.hash).toBe("#google-drive");
    expect(next.href).toBe("/dashboard/e1?keep=1#google-drive");
    // The first commit's write did not empty the entry Next needs to go Back through.
    expect(window.history.state).toMatchObject({ __NA: true });
  });

  it("reads an unknown word as none, and still cleans it away", async () => {
    next.land("/account?drive=evil");
    const words: (string | null)[] = [];
    render(
      <NextRouterStandIn>
        <Probe onWord={(word) => words.push(word)} />
      </NextRouterStandIn>,
    );
    await act(async () => {});
    expect(words).toEqual([null]);
    expect(window.location.search).toBe("");
  });

  it("writes nothing when Google sent no word", async () => {
    next.land("/account?keep=1");
    const replace = vi.spyOn(window.history, "replaceState");
    render(
      <NextRouterStandIn>
        <Probe onWord={() => undefined} />
      </NextRouterStandIn>,
    );
    await act(async () => {});
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?keep=1");
  });
});
