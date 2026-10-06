"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Check, Search } from "lucide-react";

import { useSettings } from "@/components/app/event-settings/settings-state";
import { Input } from "@/components/ui/input";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { deviceZone, farZone, sameZone, zonePlace } from "@/lib/event/zone";
import {
  answeredAs,
  findPlaces,
  zonePlaces,
  type ZonePlace,
} from "@/lib/event/zone-places";
import { clockThere } from "@/lib/event/zone-words";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { cn } from "@/lib/utils";

/** The quiet text button of Settings' event page ("Add an end date"'s own look). */
const QUIET =
  "text-caption text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/** The zones this browser knows, the list the search runs over (none in an engine too old to say). */
function browserZones(): readonly string[] {
  return typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [];
}

/**
 * THE PARTY'S TIME ZONE, ONE QUIET CHOICE (event-zone, a party far from home): the party keeps its own zone, captured
 * from its host's browser, so every guest's album turns at 9 am the morning after in it and a develop defaults to that
 * same 9 am. A host planning a destination party from home names its city here, under its dates, and nowhere else
 * (never in Create).
 *
 * ★ A HOST WHO NEVER TRAVELS NEVER SEES A ZONE: where the party's zone is her own, the row offers one quiet question and
 * names no zone; only a party on another clock says whose ("On Mexico City time"), with the clock there now.
 *
 * ★ NEVER A RAW LIST OF ZONES FIRST: the choice opens on her own zone and a search that finds a city, a country or a
 * destination (`zone-places.ts`), each said as its city with its clock there.
 *
 * Her browser's answers (her zone, the clock), so drawn once hydrated: a server render cannot know them.
 */
export function PartyZoneLine() {
  const s = useSettings();
  const hydrated = useHydrated();
  const nowMs = useWaitClock(hydrated);
  const [open, setOpen] = useState(false);
  const lineId = useId();
  if (!hydrated) return <p aria-hidden className="min-h-5" />;
  const stored = s.values.timeZone;
  const far = farZone(stored);

  const pick = (zone: string) => {
    setOpen(false);
    if (zone !== stored) void s.saveEvent({ timeZone: zone });
  };

  return (
    <Popup open={open} onOpenChange={setOpen}>
      <p
        id={lineId}
        data-party-zone={far ? "far" : "home"}
        className="flex min-h-5 flex-wrap items-baseline gap-x-2 text-caption text-pretty text-muted-foreground"
      >
        {far ? (
          <>
            <span>
              {`On ${zonePlace(far)} time`}
              {nowMs !== null ? ` · ${clockThere(nowMs, far)} there now` : ""}
            </span>
            <PopupTrigger asChild>
              <button
                type="button"
                className={QUIET}
                aria-label="Change the party's time zone"
              >
                Change
              </button>
            </PopupTrigger>
          </>
        ) : (
          <PopupTrigger asChild>
            <button type="button" className={QUIET}>
              Party in another time zone?
            </button>
          </PopupTrigger>
        )}
      </p>
      <PopupContent kind="form">
        <PopupHeader
          title="Where's the party?"
          description="Its times follow the clock there, for you and every guest."
        />
        <PopupBody>
          {open ? (
            <ZoneSearch current={stored} nowMs={nowMs} onPick={pick} />
          ) : null}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/**
 * THE SEARCH: her own zone first ("Your time zone"), and the party's where it is another; as she types, the places that
 * answer (best first, at most eight), each its city, where it is and its clock now. A combobox: the arrows move, Return
 * picks, and a press picks.
 */
function ZoneSearch({
  current,
  nowMs,
  onPick,
}: {
  current: string | null;
  nowMs: number | null;
  onPick: (zone: string) => void;
}) {
  const places = useMemo(() => zonePlaces(browserZones()), []);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const own = deviceZone();

  /** A zone said as a place, from the list where it stands there (else built from its name). */
  const placeOf = (zone: string): ZonePlace =>
    places.find((p) => sameZone(p.zone, zone)) ?? {
      zone,
      city: zonePlace(zone),
      region: "",
      also: [],
    };
  const typed = query.trim().length > 0;
  const options: ZonePlace[] = typed
    ? findPlaces(places, query)
    : [own, current]
        .filter((z): z is string => z !== null)
        .filter((z, i, all) => all.findIndex((y) => sameZone(y, z)) === i)
        .map(placeOf);
  const at = Math.min(active, Math.max(options.length - 1, 0));
  const optionId = (i: number) => `${listId}-${i}`;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((at + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = options[at];
      if (chosen) onPick(chosen.zone);
    }
  };

  return (
    <div className="space-y-2" data-zone-search="">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          role="combobox"
          aria-label="Search a city or a country"
          aria-autocomplete="list"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-activedescendant={options.length > 0 ? optionId(at) : undefined}
          placeholder="Search a city or a country"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-10 pl-8"
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Places"
        className="space-y-0.5"
      >
        {options.map((place, i) => {
          const isOwn = own !== null && sameZone(place.zone, own);
          const isCurrent = current !== null && sameZone(place.zone, current);
          // What she typed, where the city answered by another name ("Bali" under Makassar), then where it is.
          const where = [
            typed ? answeredAs(place, query) : null,
            place.region,
            isOwn ? "Your time zone" : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={place.zone}
              id={optionId(i)}
              role="option"
              aria-selected={i === at}
              data-zone={place.zone}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 transition-colors duration-150 motion-reduce:transition-none",
                i === at ? "bg-muted" : "hover:bg-muted/60",
              )}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(place.zone)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {place.city}
                </span>
                {where ? (
                  <span className="block truncate text-caption text-muted-foreground">
                    {where}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-caption text-muted-foreground tabular-nums">
                {nowMs !== null ? clockThere(nowMs, place.zone) : null}
                {isCurrent ? (
                  <Check
                    aria-label="The party's now"
                    className="size-4 text-foreground"
                  />
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {options.length === 0 ? (
        <p className="px-1 text-caption text-pretty text-muted-foreground">
          {typed
            ? "No place by that name. Try its country, or a city near it."
            : "Type where the party is: a city, a country or a destination."}
        </p>
      ) : null}
    </div>
  );
}
