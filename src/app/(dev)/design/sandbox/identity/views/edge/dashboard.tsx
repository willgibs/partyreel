"use client";

import { EventsSection } from "@/components/app/dashboard/events-section";
import { HomeHead } from "@/components/app/dashboard/home-head";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { DISPLAY_DEFAULT } from "@/lib/dashboard/display";
import type { EventListRow } from "@/lib/dashboard/events-view";
import { longDate } from "@/lib/dashboard/when";

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
 * ★ PRODUCTION'S OWN, WHOLE: `dashboard-wiring` landed the host-dashboard
 * board's `menu` pick (`events=menu`), so this mounts production's events
 * section (`EventsSection`, its Display menu, its tiles, its search from
 * nine) over her rows, at her quiet default (`DISPLAY_DEFAULT`: covers, the
 * newest first, nothing grouped), and opens Display the real way, a press on
 * it. A choice pressed here would try to keep itself for an account the lab
 * has none of; nothing here presses one.
 *
 * ★ THE PAGE AROUND IT IS PRODUCTION'S: the app's chrome and the head
 * (`HomeHead` with `StorageMeter`). The stage between the head and her events
 * (her wedding, live) listens for its doorbell, so it is folded away.
 *
 * ★ A4'S TEASERS ARE NOT ON THIS PAGE, AND CANNOT BE: the dashboard draws
 * `EventsEmptyTeaser` only for a host with no events at all (`home.tsx`), so
 * never beside a Display; they are the edge's tenth place, a new host's
 * dashboard (`start.tsx`).
 */

/* ── her events ───────────────────────────────────────────────────────── */

const guest = (
  id: string,
  name: string,
  host: string,
  cover: string,
  dateLabel: string,
  day: string,
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
  sortDate: `${day}T21:00:00Z`,
  items: 0,
  pending: 0,
  waiting: 0,
  statusLabel: null,
  byline: `Hosted by ${host}`,
  marks: null,
  day,
  dated: true,
  openedAt: null,
});

/** The albums Maya added to as a guest, newest first (the Display's quiet default). */
const ROWS: EventListRow[] = [
  guest(
    "engagement",
    "Ines & Theo's engagement",
    "Ines Duarte",
    COVERS.lights,
    "August 15, 2026",
    "2026-08-15",
  ),
  guest(
    "festival",
    "Summer festival",
    "Theo Park",
    COVERS.crowd,
    "July 18, 2026",
    "2026-07-18",
  ),
  guest(
    "thirty",
    "Sam's 30th",
    "Sam Reyes",
    COVERS.balloons,
    "May 9, 2026",
    "2026-05-09",
  ),
  guest(
    "forty",
    "Theo's 40th",
    "Theo Park",
    COVERS.dj,
    "March 21, 2026",
    "2026-03-21",
  ),
  guest(
    "new-year",
    "New Year's Eve",
    "Rosa Lin",
    COVERS.confetti,
    "December 31, 2025",
    "2025-12-31",
  ),
  guest(
    "graduation",
    "Rosa's graduation",
    "Rosa Lin",
    COVERS.hall,
    "June 14, 2025",
    "2025-06-14",
  ),
  guest(
    "book-club",
    "Book club's long table",
    "Ines Duarte",
    COVERS.table,
    "November 8, 2024",
    "2024-11-08",
  ),
];

const OPEN_DISPLAY: readonly (readonly [number, () => void])[] = [
  [800, () => byText<HTMLButtonElement>("button", "Display")?.click()],
];

export function DashboardScreen() {
  useInUse(OPEN_DISPLAY);
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
        <EventsSection
          rows={ROWS}
          today="2026-10-04"
          owner="identity-host"
          initial={DISPLAY_DEFAULT}
          recent={[]}
        />
      </div>
    </HostFrame>
  );
}
