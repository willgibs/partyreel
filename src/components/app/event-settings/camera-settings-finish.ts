/**
 * A FIELD IS SAVED WHEN SHE HAS FINISHED IT, NEVER ON A KEYSTROKE: the one beat and the one close-save of Settings'
 * two native pickers, the event's date (`event-page.tsx`, crumbs-59) and the develop time (`camera-settings.tsx`,
 * crumbs-60), lifted into one hook so a field cannot be given the date's care and miss the other's (crumbs-72: the
 * develop time saved only on blur or Return, so Escape or Back took a typed time with them, and a phone's picker may
 * never blur at all).
 *
 * A date or time field fires a COMPLETE value on every keystroke that makes one (Chrome types 2027 into a year as 0002,
 * 0020, 0202), so what she types is a DRAFT the field shows and nothing sends. It is finished, and handed to `commit`,
 * when:
 *   - SHE LEAVES THE FIELD (blur) OR PRESSES RETURN;
 *   - A PICKER'S CHOICE (a change no key made) HAS RESTED a beat (`PICK_SETTLE_MS`), so a wheel that reports every
 *     notch it turns commits the one it rests on, and a calendar's pick needs no leaving;
 *   - THE FIELD GOES (the panel closes, which leaves it too): Escape or Back takes the page away with focus still in
 *     it, and a field removed from the page never blurs, so a panel never swallows what was typed.
 * A change a key made (typing, an arrow) always waits to be left, and a CLEARED field is never committed by the beat,
 * only by leaving: it is the change a keyboard makes on its way to the next value. A field left HALF FILLED (a segment
 * cleared and not typed again, `validity.badInput`) is not a value: `unfinished` says so, and nothing is committed.
 *
 * ★ WHAT `commit` DOES WITH A VALUE IS THE OWNER'S, AND THE CLOSE ASKS NOTHING OF IT THAT A BLUR DOES NOT: the close
 * calls the same `commit` with the same value, but nobody is left to answer a question or read a refusal, so an owner
 * whose commit can ask (the develop time) must write only what it would write unasked.
 *
 * ★ A DRAFT BELONGS TO THE SAVED VALUE IT WAS TYPED OVER. Another control that moves that value under it (a style
 * switch that clears the develop time) calls `settle`, or the field's later close would put a typed time back over
 * her choice. The owner calls it from the control's own change, in the component that stays mounted while the field
 * comes and goes.
 *
 * Several fields share one hook (the date and its end): the close commits the first one that is finished, in the order
 * of `keys`, since the first's commit already follows the second.
 */
import { type KeyboardEvent, useEffect, useRef } from "react";

/**
 * A PICKER'S CHOICE SAVES A BEAT AFTER THE LAST ONE, in ms (crumbs-59). A calendar's pick is one whole change, but a
 * phone's wheel may report every notch it turns (iOS Safari is said to; no device was at hand), and a value it passes is
 * not one she chose: each would be a save. The beat lets the wheel rest, so the value it rests on is the one committed.
 */
export const PICK_SETTLE_MS = 350;

/**
 * A change this soon after a key went down is the key's own: Chrome fires `input` inside the key press, measured 1 ms
 * after `keydown` (a year typed digit by digit, an ArrowUp), where a calendar's pick comes with no key down at all.
 */
const KEY_CHANGE_MS = 150;

/** Keys that change nothing by themselves: held while she picks with the mouse, they are not typing. */
const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

/** What a field holds that is not finished: its value as the field reads it, and whether it is half filled. */
type Draft = { value: string; partial: boolean };

export type FinishedFields<K extends string> = {
  /** What she typed or picked becomes the field's draft (the owner shows it): a picker's choice starts its beat. */
  draft: (key: K, input: HTMLInputElement) => void;
  /** She left the field or pressed Return in it: what it holds is finished, unless it is half a value. */
  finish: (key: K, input: HTMLInputElement) => void;
  /** A key went down: Return finishes the field, and a change right behind a key is the key's. */
  keyDown: (key: K, event: KeyboardEvent<HTMLInputElement>) => void;
  /** Whether the field holds a draft nobody has finished yet. */
  holds: (key: K) => boolean;
  /** The draft is moot (settled by the owner, or its saved value moved under it): no beat, no close-save for it. */
  settle: (key: K) => void;
};

export function useFinishedFields<K extends string>(
  keys: readonly K[],
  /** A finished field's value, to judge and write. */
  commit: (key: K, value: string) => void,
  /** A field left half filled. */
  unfinished: (key: K) => void,
): FinishedFields<K> {
  const pending = useRef(new Map<K, Draft>());
  const beats = useRef(new Map<K, ReturnType<typeof setTimeout>>());
  const keyAt = useRef(Number.NEGATIVE_INFINITY);
  // The latest render's own, for the beat and the close below: each sees the saved values as they are now.
  const latest = useRef({ keys, commit, unfinished });
  useEffect(() => {
    latest.current = { keys, commit, unfinished };
  });

  function stopBeat(key: K) {
    clearTimeout(beats.current.get(key));
    beats.current.delete(key);
  }

  /** A finished value: its draft and beat are done with, and the owner judges it. */
  function run(key: K, value: string) {
    pending.current.delete(key);
    stopBeat(key);
    latest.current.commit(key, value);
  }

  useEffect(() => {
    const drafts = pending.current;
    const waiting = beats.current;
    return () => {
      for (const beat of waiting.values()) clearTimeout(beat);
      waiting.clear();
      for (const key of latest.current.keys) {
        const held = drafts.get(key);
        if (held && !held.partial) {
          latest.current.commit(key, held.value);
          return;
        }
      }
    };
  }, []);

  const draft: FinishedFields<K>["draft"] = (key, input) => {
    const value = input.value;
    pending.current.set(key, { value, partial: input.validity.badInput });
    stopBeat(key);
    const byAKey = performance.now() - keyAt.current < KEY_CHANGE_MS;
    if (!byAKey && value) {
      beats.current.set(
        key,
        setTimeout(() => {
          const rested = pending.current.get(key);
          if (rested) run(key, rested.value);
        }, PICK_SETTLE_MS),
      );
    }
  };

  const finish: FinishedFields<K>["finish"] = (key, input) => {
    const held = pending.current.get(key);
    if (!held) return;
    if (input.validity.badInput) {
      pending.current.delete(key);
      stopBeat(key);
      latest.current.unfinished(key);
      return;
    }
    run(key, held.value);
  };

  const keyDown: FinishedFields<K>["keyDown"] = (key, event) => {
    if (!MODIFIER_KEYS.has(event.key)) keyAt.current = performance.now();
    if (event.key === "Enter") finish(key, event.currentTarget);
  };

  return {
    draft,
    finish,
    keyDown,
    holds: (key) => pending.current.has(key),
    settle: (key) => {
      pending.current.delete(key);
      stopBeat(key);
    },
  };
}
