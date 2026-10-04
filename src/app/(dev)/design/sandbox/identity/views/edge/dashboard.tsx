"use client";

import { type ReactNode, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  Table2,
} from "lucide-react";

import { EventTile } from "@/components/app/dashboard/event-tile";
import { HomeHead } from "@/components/app/dashboard/home-head";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  EVENTS_FILTER_OPTIONS,
  type EventListRow,
  lensCounts,
} from "@/lib/dashboard/events-view";
import { longDate } from "@/lib/dashboard/when";
import { formatCount } from "@/lib/format/count";

import { ACCOUNT } from "../../fixtures";
import { useInUse } from "../in-use";
import { byText } from "../pins";
import { HostFrame } from "../settings";

import { COVERS } from "./covers";

/**
 * THE HOST'S DASHBOARD WITH ITS DISPLAY OPEN: Maya, the morning after her
 * wedding's second day, opens Display over her events (the albums she has
 * added to as a guest over three years: birthdays, an engagement, a festival).
 *
 * ★ THE DISPLAY IS THE HOST-DASHBOARD BOARD'S `menu` PICK, being wired now
 * (`events=menu`): one Display button opening a popover that holds the
 * layout (three segments), the order and its direction, what shows (whose,
 * when, a year), the groups and the covers' size, and the line that says her
 * choices are kept. Drawn here from that board's `DisplayMenu` and `Choices`
 * (`host-dashboard/collection.tsx`) on production's own `Popover`,
 * `ToggleGroup` and `Button`, in its words and its quiet default (covers, the
 * newest first, nothing grouped), and opened the real way, a press on Display.
 *
 * ★ THE PAGE IS PRODUCTION'S AROUND IT: the app's chrome, the head
 * (`HomeHead` with `StorageMeter`), and her events as production's tiles
 * (`EventTile`, each cover lit as the album's photographs are). The stage
 * between the head and her events (her wedding, live) reads its doorbell, so
 * it is not drawn: the frame is the page with the stage folded away, the
 * section titled as the wiring titles it.
 *
 * ★ A4'S TWO TEASERS ARE NOT ON THIS PAGE, AND CANNOT BE: the dashboard draws
 * `EventsEmptyTeaser` only for a host with no events at all
 * (`home.tsx`: `view.hasAny ? <EventsSection/> : <EventsEmptyTeaser/>`), so
 * never beside a Display, and `EmptySectionTeaser` lives on her own page's
 * private sections now (`u/[slug]/owner-sections.tsx`), not the dashboard.
 */

/* ── her events ───────────────────────────────────────────────────────── */

const guest = (
  id: string,
  name: string,
  host: string,
  cover: string,
  dateLabel: string,
  sortDate: string,
): EventListRow => ({
  id,
  kind: "guest",
  name,
  href: `/e/identity-${id}`,
  coverUrl: cover,
  stills: [],
  dateLabel,
  when: dateLabel,
  face: null,
  sortDate,
  items: 0,
  pending: 0,
  waiting: 0,
  statusLabel: null,
  byline: `Hosted by ${host}`,
  marks: null,
  seasonId: "guest",
});

/** The albums Maya added to as a guest, newest first (the Display's quiet default). */
const ROWS: EventListRow[] = [
  guest(
    "engagement",
    "Ines & Theo's engagement",
    "Ines Duarte",
    COVERS.lights,
    "August 15, 2026",
    "2026-08-16T01:12:00Z",
  ),
  guest(
    "festival",
    "Summer festival",
    "Theo Park",
    COVERS.crowd,
    "July 18, 2026",
    "2026-07-19T22:40:00Z",
  ),
  guest(
    "thirty",
    "Sam's 30th",
    "Sam Reyes",
    COVERS.balloons,
    "May 9, 2026",
    "2026-05-10T00:05:00Z",
  ),
  guest(
    "forty",
    "Theo's 40th",
    "Theo Park",
    COVERS.dj,
    "March 21, 2026",
    "2026-03-22T01:30:00Z",
  ),
  guest(
    "new-year",
    "New Year's Eve",
    "Rosa Lin",
    COVERS.confetti,
    "December 31, 2025",
    "2026-01-01T00:20:00Z",
  ),
  guest(
    "graduation",
    "Rosa's graduation",
    "Rosa Lin",
    COVERS.hall,
    "June 14, 2025",
    "2025-06-15T18:02:00Z",
  ),
  guest(
    "book-club",
    "Book club's long table",
    "Ines Duarte",
    COVERS.table,
    "November 8, 2024",
    "2024-11-09T21:45:00Z",
  ),
];

const YEARS = ["2026", "2025", "2024"] as const;

/* ── the Display, as the board's `menu` pick draws it ─────────────────── */

type Layout = "gallery" | "table" | "list";

const LAYOUTS: { id: Layout; label: string; icon: ReactNode }[] = [
  { id: "gallery", label: "Gallery", icon: <LayoutGrid /> },
  { id: "table", label: "Table", icon: <Table2 /> },
  { id: "list", label: "List", icon: <Rows3 /> },
];

const SORTS = [
  { id: "made", label: "Newest" },
  { id: "date", label: "Event date" },
  { id: "opened", label: "Last opened" },
  { id: "name", label: "Name" },
  { id: "photos", label: "Most photos" },
  { id: "waiting", label: "Waiting" },
] as const;

const WHENS = [
  { id: "any", label: "Any time" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "undated", label: "No date" },
] as const;

const PILL =
  "h-7 rounded-full px-3 text-xs text-muted-foreground hover:bg-transparent data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-lift";

/** One choice among a few, as a row of pills: the pressed one stays pressed. */
function Pills({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
}) {
  const [on, setOn] = useState(value);
  return (
    <ToggleGroup
      type="single"
      value={on}
      onValueChange={(v) => v && setOn(v)}
      aria-label={label}
      className="flex-wrap justify-start rounded-2xl bg-muted p-0.5"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id} className={PILL}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** A group's name, in the camera voice: sentence case (spaced capitals are a count's, a time's, live's). */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/** Every choice in one place: the layout, the order, what shows, the groups, the covers' size. */
function Choices() {
  const counts = lensCounts(ROWS);
  const [layout, setLayout] = useState<Layout>("gallery");
  const [desc, setDesc] = useState(true);
  const lenses = EVENTS_FILTER_OPTIONS.filter(
    (o) => o.value === "all" || counts[o.value] > 0,
  ).map((o) => ({
    id: o.value,
    label: `${o.label} ${formatCount(counts[o.value])}`,
  }));
  return (
    <div className="space-y-4">
      <Section label="Layout">
        <ToggleGroup
          type="single"
          value={layout}
          onValueChange={(v) => v && setLayout(v as Layout)}
          aria-label="Layout"
          className="grid w-full grid-cols-3 gap-1.5"
        >
          {LAYOUTS.map((l) => (
            <ToggleGroupItem
              key={l.id}
              value={l.id}
              className="flex h-14 flex-col gap-1 rounded-xl border border-border text-xs data-[state=on]:border-foreground data-[state=on]:bg-muted"
            >
              {l.icon}
              {l.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Section>
      <Section label="Order">
        <div className="space-y-1.5">
          <Pills label="Sort by" value="made" options={SORTS} />
          <button
            type="button"
            onClick={() => setDesc((d) => !d)}
            className="flex h-7 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {desc ? (
              <ArrowDown className="size-3.5" aria-hidden />
            ) : (
              <ArrowUp className="size-3.5" aria-hidden />
            )}
            {desc ? "Newest first" : "Oldest first"}
          </button>
        </div>
      </Section>
      <Section label="Show">
        <div className="space-y-1.5">
          <Pills label="Whose" value="all" options={lenses} />
          <Pills label="When" value="any" options={WHENS} />
          <Pills
            label="Year"
            value="all"
            options={[
              { id: "all", label: "Every year" },
              ...YEARS.map((y) => ({ id: y, label: y })),
            ]}
          />
        </div>
      </Section>
      <div className="grid grid-cols-2 gap-3">
        <Section label="Group">
          <Pills
            label="Group"
            value="none"
            options={[
              { id: "none", label: "None" },
              { id: "year", label: "By year" },
            ]}
          />
        </Section>
        {layout === "gallery" && (
          <Section label="Covers">
            <Pills
              label="Cover size"
              value="m"
              options={[
                { id: "s", label: "S" },
                { id: "m", label: "M" },
                { id: "l", label: "L" },
              ]}
            />
          </Section>
        )}
      </div>
    </div>
  );
}

/** One Display menu, quiet until she opens it. */
function DisplayMenu() {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal /> Display
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22rem] space-y-4 p-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Choices />
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>Kept for your account, on every device</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── the page ─────────────────────────────────────────────────────────── */

/** Her events' gallery at the Display's medium covers (production's grid and tile). */
function Gallery() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(calc(50%_-_6px),240px),1fr))] gap-3">
      {ROWS.map((row) => (
        <li key={`${row.kind}-${row.id}`}>
          <EventTile row={row} size="md" />
        </li>
      ))}
    </ul>
  );
}

const OPEN_DISPLAY: readonly (readonly [number, () => void])[] = [
  [600, () => byText<HTMLButtonElement>("button", "Display")?.click()],
];

export function DashboardScreen() {
  useInUse(OPEN_DISPLAY);
  const counts = lensCounts(ROWS);
  return (
    <HostFrame>
      <div data-app-wide="" data-home="" className="space-y-7 lg:space-y-9">
        <HomeHead
          day={longDate("2026-10-04")}
          line={`1 event · ${ACCOUNT.plan}`}
          storage={
            <StorageMeter
              activeBytes={ACCOUNT.usedBytes}
              deletedBytes={0}
              storageCap={ACCOUNT.capBytes}
              makeRoom={false}
              passExpiry="October 2, 2027"
              planName={ACCOUNT.plan}
              hasBilling
              isEventPass
              tier="event_pass"
            />
          }
        />
        <section
          aria-label="Your events"
          data-events="gallery"
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <h2 className="flex items-baseline gap-2">
              <span className="font-heading text-subsection">Your events</span>{" "}
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatCount(counts.all)}
              </span>
            </h2>
            <div className="ml-auto flex items-center gap-1.5">
              <DisplayMenu />
            </div>
          </div>
          <Gallery />
        </section>
      </div>
    </HostFrame>
  );
}
