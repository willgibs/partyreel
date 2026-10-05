"use client";

/**
 * A LOST ANSWER HEALS ITSELF (red-team 55's LOW). A complete whose answer never came is kept (`hasKeptComplete`): the
 * row it asked for may stand, and the file's next try asks that very complete again, so the server's own row answers it
 * and nothing is recorded twice. Until that try, the queue said the file "didn't upload" and offered Retry, while the
 * album (its own sync) drew the very photograph: a guest read her photos as failed with them in front of her, for as
 * long as it took her to press Retry (68 s, walked).
 *
 * The ask is cheap (no presign, no byte) and safe to repeat, so the queue makes it for her, quietly: for a file that
 * failed as a dropped connection AND whose complete is kept, after a few seconds, when the page is looked at again, and
 * when the browser says the line is back. A row the server had written is told as landed (and the sheet that listed
 * it lets it go, the album draws it as her own upload lands); one it had not is written now. An ask that still gets
 * no answer changes nothing she sees, and the sheet stands as it did.
 *
 * ★ A FEW ASKS A FILE, NEVER A LOOP. Each file is healed at most `HEAL_AFTER_MS.length` times in the page's life (a
 * WeakMap by the File, as the kept complete is): her own Retry does not give them back, and a line that stays down ends
 * in the sheet and her Retry, as before.
 *
 * Generic over the item it reads, so the host's panel (the same lost answer in its own rows) reads the same rule.
 */
import { useCallback, useEffect, useRef } from "react";

import { hasKeptComplete, type UploadCause } from "@/lib/upload/uploader";

/** How long after a lost answer each ask waits: a few seconds (a blip), then longer (a venue's signal coming back). */
export const HEAL_AFTER_MS = [5_000, 20_000, 60_000] as const;

/** Never two sets of asks closer than this (a line that flaps would fire the browser's `online` over and over). */
const HEAL_MIN_GAP_MS = 3_000;

/** The asks made for a file, however they were triggered. */
const asked = new WeakMap<File, number>();

type Healable = {
  id: string;
  file: File;
  status: string;
  cause?: UploadCause;
};

/** A file that failed as a dropped connection and whose complete is kept: its fate is unknown, not failed. */
export function isLostAnswer(item: Healable): boolean {
  return (
    item.status === "error" &&
    item.cause === "dropped" &&
    hasKeptComplete(item.file)
  );
}

/** The asks a file has left. */
const asksLeft = (item: Healable) =>
  HEAL_AFTER_MS.length - (asked.get(item.file) ?? 0);

/**
 * Ask again, for the items that lost an answer, when it is time: `heal` gets their ids and sends them again as her own
 * Retry would (the queue's runner: one at a time, so a Retry she presses meanwhile never races an ask). Called with
 * the items as the owner holds them; a render's worth of change restarts the wait, so nothing heals mid-burst.
 */
export function useHealLostAnswers(
  items: readonly Healable[],
  heal: (ids: string[]) => void,
): void {
  const latest = useRef({ items, heal });
  useEffect(() => {
    latest.current = { items, heal };
  });
  const lastAt = useRef(0);

  /** One set of asks for what has lost its answer and has asks left, now. */
  const askNow = useCallback(() => {
    const due = latest.current.items.filter(
      (it) => isLostAnswer(it) && asksLeft(it) > 0,
    );
    if (due.length === 0) return;
    if (Date.now() - lastAt.current < HEAL_MIN_GAP_MS) return;
    lastAt.current = Date.now();
    for (const it of due) asked.set(it.file, (asked.get(it.file) ?? 0) + 1);
    latest.current.heal(due.map((it) => it.id));
  }, []);

  // The timed ask: the sooner of the files' next ones, restarted by any change to what the owner holds.
  useEffect(() => {
    const due = items.filter((it) => isLostAnswer(it) && asksLeft(it) > 0);
    if (due.length === 0) return;
    const next = Math.min(...due.map((it) => asked.get(it.file) ?? 0));
    const timer = setTimeout(askNow, HEAL_AFTER_MS[next]);
    return () => clearTimeout(timer);
  }, [items, askNow]);

  // The line is back, or the page is looked at again: ask at once for what is still waiting on an answer.
  useEffect(() => {
    const shown = () => {
      if (document.visibilityState === "visible") askNow();
    };
    window.addEventListener("online", askNow);
    document.addEventListener("visibilitychange", shown);
    return () => {
      window.removeEventListener("online", askNow);
      document.removeEventListener("visibilitychange", shown);
    };
  }, [askNow]);
}
