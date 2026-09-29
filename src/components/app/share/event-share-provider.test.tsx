/**
 * THE SHEETS RIDE THE URL, AND EVERY WAY IN CLOSES (milestone 30's production pass: a sheet opened from
 * a link could not be closed).
 *
 * The ways in were the `/settings` route, a sign-in returning to it, Checkout's return with
 * `?room=share|settings` and every bookmark: each lands on the hub with the parameter already in the
 * URL and none of our history behind it. Closing drops the parameter in place, and a fallback to "the
 * sheet this page was first loaded with" that outlived hydration opened it again, so Escape and the X
 * did nothing. Pinned by behaviour over a URL the test owns: Next's own `useSearchParams` follows
 * `pushState`, `replaceState` and `popstate`, and so does the stand-in.
 *
 * And the settings' pages (event-settings r1, `opens=page`): a page rides beside the sheet and REPLACES
 * the entry, so the sheet stays one entry deep and closes whole from any page, a deep link included.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    const search = useSyncExternalStore(
      (cb) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      () => window.location.search,
      () => window.location.search,
    );
    return new URLSearchParams(search);
  },
}));
vi.mock("@/lib/shared/use-prefers-reduced-motion", () => ({
  usePrefersReducedMotion: () => true,
}));

const { EventShareProvider, useEventShare } = await import(
  "@/components/app/share/event-share-provider"
);

const push = window.history.pushState.bind(window.history);
const replace = window.history.replaceState.bind(window.history);

beforeEach(() => {
  // Next patches both to apply the URL to its router; the stand-in tells its listeners the same way.
  window.history.pushState = (...args) => {
    push(...args);
    emit();
  };
  window.history.replaceState = (...args) => {
    replace(...args);
    emit();
  };
  window.addEventListener("popstate", emit);
});

afterEach(() => {
  window.history.pushState = push;
  window.history.replaceState = replace;
  window.removeEventListener("popstate", emit);
  replace(null, "", "/");
});

function Probe() {
  const {
    sheet,
    openSheet,
    closeSheet,
    settingsPage,
    openSettingsPage,
    closeSettingsPage,
  } = useEventShare();
  return (
    <div>
      <p data-testid="sheet">{sheet ?? "none"}</p>
      <p data-testid="page">{settingsPage ?? "rows"}</p>
      <button type="button" onClick={() => openSheet("settings")}>
        open settings
      </button>
      <button type="button" onClick={closeSheet}>
        close
      </button>
      <button type="button" onClick={() => openSettingsPage("door")}>
        open the door page
      </button>
      <button type="button" onClick={closeSettingsPage}>
        up
      </button>
    </div>
  );
}

function hub(initialSheet: "settings" | "share" | null) {
  return render(
    <EventShareProvider initialSheet={initialSheet}>
      <Probe />
    </EventShareProvider>,
  );
}

const shown = () => screen.getByTestId("sheet").textContent;
const pageShown = () => screen.getByTestId("page").textContent;

describe("a sheet opened from a link", () => {
  it("★ closes, and stays closed (the fallback to the first load is the first paint's alone)", () => {
    replace(null, "", "/dashboard/e1?room=settings");
    hub("settings");
    expect(shown()).toBe("settings");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });

  it("closes from a page it opened straight onto, both parameters gone", () => {
    replace(null, "", "/dashboard/e1?room=settings&setting=door");
    hub("settings");
    expect(pageShown()).toBe("door");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
    expect(pageShown()).toBe("rows");
  });

  it("Share from Checkout's return closes the same way", () => {
    replace(null, "", "/dashboard/e1?room=share");
    hub("share");
    expect(shown()).toBe("share");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });
    expect(shown()).toBe("none");
  });
});

describe("a sheet opened from its card", () => {
  it("closes by going Back, leaving no entry behind", async () => {
    replace(null, "", "/dashboard/e1");
    hub(null);
    const before = window.history.length;
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "open settings" }));
    });
    expect(shown()).toBe("settings");
    expect(window.history.length).toBe(before + 1);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
      await new Promise((resolve) =>
        window.addEventListener("popstate", resolve, { once: true }),
      );
    });
    expect(window.location.search).toBe("");
    expect(shown()).toBe("none");
  });
});

describe("the settings' pages", () => {
  it("★ a page replaces the entry: the sheet stays one entry deep, and up returns to the rows", () => {
    replace(null, "", "/dashboard/e1");
    hub(null);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "open settings" }));
    });
    const depth = window.history.length;
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "open the door page" }));
    });
    expect(pageShown()).toBe("door");
    expect(new URLSearchParams(window.location.search).get("setting")).toBe(
      "door",
    );
    expect(window.history.length).toBe(depth);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "up" }));
    });
    expect(pageShown()).toBe("rows");
    expect(shown()).toBe("settings");
  });

  it("a stray page parameter opens nothing while Settings is not the sheet", () => {
    replace(null, "", "/dashboard/e1?setting=door");
    hub(null);
    expect(shown()).toBe("none");
    expect(pageShown()).toBe("rows");
  });

  it("a sheet opens on its first level, whatever an earlier visit left in the URL", () => {
    replace(null, "", "/dashboard/e1?setting=door");
    hub(null);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "open settings" }));
    });
    expect(shown()).toBe("settings");
    expect(pageShown()).toBe("rows");
  });
});
