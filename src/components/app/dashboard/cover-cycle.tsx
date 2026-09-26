"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LivingStills } from "@/components/app/living-stills";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/** One card takes its turn per beat: a calm pulse across the row, never a wall of motion. */
export const COVER_BEAT_MS = 3500;

/**
 * THE CARDS TAKE TURNS (`reel-host`, Will 2026-09-25, his `pulse` note: "running that on every
 * event card on every transition would be really annoying. It'd be cool if they went in order one
 * at a time, where each beat the next event cycled a card, going first to last and starting back
 * with the first again. Would add some calm motion to the host dash").
 *
 * Every beat, exactly one card dissolves to its next still: the next one after the last to move,
 * in the grid's reading order, wrapping to the first. A card with one still sits out; so does a
 * card off screen (its turn passes to the next card the host can see, so the motion is only ever
 * where someone is looking); and the whole cycle rests in a hidden tab and under reduced motion,
 * where every card keeps its cover, the page complete at rest (bible 5).
 *
 * Pure: the cards in reading order, whether each may move now, and the last to move; the next to
 * move, or null when none may.
 */
export function nextTurn(
  cards: readonly { id: string; eligible: boolean }[],
  lastId: string | null,
): string | null {
  const start = lastId ? cards.findIndex((c) => c.id === lastId) + 1 : 0;
  for (let step = 0; step < cards.length; step++) {
    const card = cards[(start + step) % cards.length];
    if (card.eligible) return card.id;
  }
  return null;
}

type Entry = { count: number; el: HTMLElement; visible: boolean };

type CycleValue = {
  register: (id: string, count: number, el: HTMLElement) => () => void;
  /** Which still a card is on: 0 is its cover, and each turn adds one. */
  at: (id: string) => number;
};

const CoverCycleContext = createContext<CycleValue | null>(null);

/** Reading order: the grid's own DOM order, however the cards registered. */
function byDocumentOrder(a: Entry, b: Entry): number {
  if (a.el === b.el) return 0;
  return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}

export function CoverCycleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [turns, setTurns] = useState<Record<string, number>>({});
  const entries = useRef(new Map<string, Entry>());
  const observer = useRef<IntersectionObserver | null>(null);
  const last = useRef<string | null>(null);

  // One observer for every card, made on first use (never during a server render).
  const observe = useCallback(() => {
    if (!observer.current) {
      observer.current = new IntersectionObserver((records) => {
        for (const record of records) {
          for (const entry of entries.current.values()) {
            if (entry.el === record.target)
              entry.visible = record.isIntersecting;
          }
        }
      });
    }
    return observer.current;
  }, []);

  const register = useCallback(
    (id: string, count: number, el: HTMLElement) => {
      const entry: Entry = { count, el, visible: false };
      entries.current.set(id, entry);
      observe().observe(el);
      return () => {
        observe().unobserve(el);
        if (entries.current.get(id) === entry) entries.current.delete(id);
      };
    },
    [observe],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (reduced || hidden) return;
    const clock = window.setInterval(() => {
      const ordered = [...entries.current.entries()].sort(([, a], [, b]) =>
        byDocumentOrder(a, b),
      );
      const id = nextTurn(
        ordered.map(([key, e]) => ({
          id: key,
          eligible: e.count > 1 && e.visible,
        })),
        last.current,
      );
      if (!id) return;
      last.current = id;
      setTurns((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    }, COVER_BEAT_MS);
    return () => window.clearInterval(clock);
  }, [reduced, hidden]);

  const value = useMemo<CycleValue>(
    () => ({ register, at: (id) => turns[id] ?? 0 }),
    [register, turns],
  );

  return (
    <CoverCycleContext.Provider value={value}>
      {children}
    </CoverCycleContext.Provider>
  );
}

/**
 * A card's cover that takes its turn in the row's cycle: the cover it painted first, then its
 * stills, one dissolve per turn. Outside a `CoverCycleProvider` (the profile's cards, a lab board)
 * it simply holds its cover.
 */
export function CycledCover({
  id,
  stills,
}: {
  id: string;
  stills: readonly string[];
}) {
  const cycle = useContext(CoverCycleContext);
  const ref = useRef<HTMLDivElement>(null);
  const register = cycle?.register;
  useEffect(() => {
    const el = ref.current;
    if (!register || !el || stills.length < 2) return;
    return register(id, stills.length, el);
  }, [register, id, stills.length]);
  return (
    <div ref={ref} className="absolute inset-0">
      <LivingStills stills={stills} at={cycle?.at(id) ?? 0} />
    </div>
  );
}
