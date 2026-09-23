"use client";

import { useCallback, useRef, useState } from "react";

import { TextSwap } from "@/components/marketing/sections/features/shared/text-swap";
import { Switch } from "@/components/ui/switch";

/**
 * THE GUEST LIST CARD (/features/guests, paper). A calm mock of the host's
 * "Guests" section: the shipped GuestList chip shape (avatar + display name in
 * an h-8 pill, one wearing the small unverified mark) over the setting that
 * governs it, quoting the real settings label ("Show the guest list on the
 * album") verbatim.
 *
 * THE AVATAR COMB (R4's one new delight, recipe 11-avatar-group-hover): the chip
 * row is the most row-like people strip on the page, so hovering one guest lifts
 * that chip and carries its neighbours with a distance falloff — the row behaves
 * like a row of people rather than six independent buttons.
 *
 * Two details are load-bearing:
 *  - The phase's timing function is written INLINE BEFORE the variable writes.
 *    The browser samples whatever timing function the after-change style carries
 *    when a transitionable property moves, so this is what makes the lift ride
 *    --ease-emphasis and the settle ride --mkt-ease-pop with one CSS rule.
 *  - The tokens are read off the ROW, never documentElement: --mkt-avatar-* are
 *    declared on [data-mkt] (the cinema layout / this paper chapter), so a
 *    documentElement read would silently fall back to the constants below.
 *
 * Hover-only by construction: marketing.css scopes the transform to
 * `@media (hover: hover)` and zeroes it under prefers-reduced-motion, so on a
 * phone (and for anyone who asked for less motion) these writes do nothing.
 */

const FALLBACK = { lift: -4, falloff: 0.45, scale: 1.05 };

export type GuestListEntry = { name: string; unverified?: boolean };

export function GuestListCard({ names }: { names: GuestListEntry[] }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [onAlbum, setOnAlbum] = useState(false);

  const comb = useCallback((activeIdx: number | null, phase: "in" | "out") => {
    const row = rowRef.current;
    if (!row) return;
    const cs = getComputedStyle(row);
    const num = (name: string, fallback: number) => {
      const parsed = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const lift = num("--mkt-avatar-lift", FALLBACK.lift);
    const falloff = num("--mkt-avatar-falloff", FALLBACK.falloff);
    const scale = num("--mkt-avatar-scale", FALLBACK.scale);
    const timing =
      phase === "out" ? "var(--mkt-ease-pop)" : "var(--ease-emphasis)";

    row.querySelectorAll<HTMLElement>(".mkt-avatar").forEach((el, i) => {
      el.style.transitionTimingFunction = timing;
      if (activeIdx === null) {
        el.style.setProperty("--shift", "0px");
        el.style.setProperty("--scale-active", "1");
        return;
      }
      const distance = Math.abs(i - activeIdx);
      el.style.setProperty(
        "--shift",
        `${(lift * Math.pow(falloff, distance)).toFixed(3)}px`,
      );
      el.style.setProperty(
        "--scale-active",
        i === activeIdx ? String(scale) : "1",
      );
    });
  }, []);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-lift sm:p-6">
      <div className="flex items-baseline justify-between">
        {/* "Guests" is the real event-page section label. */}
        <span className="text-label font-medium text-muted-foreground uppercase">
          Guests
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {names.length} added photos
        </span>
      </div>

      <ul
        ref={rowRef}
        className="mt-4 flex flex-wrap gap-1.5"
        onMouseLeave={() => comb(null, "out")}
      >
        {names.map((guest, i) => (
          <li
            key={guest.name}
            className="mkt-avatar flex h-8 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm"
            onMouseEnter={() => comb(i, "in")}
          >
            <span className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-medium">
              {guest.name[0]}
            </span>
            {guest.name}
            {guest.unverified && (
              <span
                aria-label="A name with no verified email behind it"
                title="A name with no verified email behind it"
                className="size-1.5 shrink-0 rounded-full bg-warning"
              />
            )}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        A name with no verified email behind it wears a small mark.
      </p>

      {/* The switch the copy beside this card is about, with the settings
          screen's own label. Live on purpose: flipping it is the fastest way to
          understand that the list is private until the host says otherwise. */}
      <div className="mt-5 flex items-start justify-between gap-4 border-t pt-4">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            Show the guest list on the album
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            <TextSwap
              value={
                onAlbum
                  ? "Everyone who can open the album sees these names."
                  : "Right now the list is yours alone."
              }
            />
          </span>
        </span>
        <Switch
          checked={onAlbum}
          onCheckedChange={setOnAlbum}
          aria-label="Show the guest list on the album"
        />
      </div>
    </div>
  );
}
