import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE STAND-IN CONTENT, written to be JUDGED FOR SIZE AND WRAPPING and for
 * nothing else (the manifest: "copy is placeholder judged for size and
 * wrapping"). Every string here is the length the real one runs to, because a
 * body step is decided by where a sentence breaks as much as by how tall it is:
 * a one-line description tells you nothing about 15 against 17.
 *
 * ★ THE EVENT DESCRIPTION IS THE LONGEST THING A GUEST READS, so it is three
 * sentences and it wraps five to seven times in a 335px column. A short one
 * would let every option look the same.
 */
export const EVENT = {
  name: "Mia & Theo's Wedding",
  host: "Mia Calder",
  date: "2026-08-15",
  guests: 34,
  photos: 128,
  description:
    "Everything from the day, in one place. Add whatever you took, whenever you get to it, and we'll keep adding ours. There's no app to install and nothing to sign up for.",
} as const;

/** The dashboard's three events, with a cover each. */
export const EVENTS = [
  {
    name: "Mia & Theo's Wedding",
    date: "15 August 2026",
    items: "128 items",
    status: "Open",
    pending: 6,
    cover: MARKETING_IMAGES[0].src,
  },
  {
    name: "Ruby's 30th",
    date: "2 July 2026",
    items: "94 items",
    status: "Open",
    pending: 0,
    cover: MARKETING_IMAGES[2].src,
  },
  {
    name: "Harbour Studio Launch",
    date: "11 May 2026",
    items: "212 items",
    status: "Closed",
    pending: 0,
    cover: MARKETING_IMAGES[1].src,
  },
] as const;

/** The admin jobs table's last runs: the densest reading surface we ship. */
export const RUNS = [
  {
    started: "18 Sep 2026, 04:00",
    job: "Purge deleted events",
    outcome: "Done",
    trigger: "Schedule",
    took: "1.4s",
    note: "3 events purged, 412 objects removed",
  },
  {
    started: "18 Sep 2026, 03:00",
    job: "Expire guest sessions",
    outcome: "Done",
    trigger: "Schedule",
    took: "0.3s",
    note: "88 sessions expired",
  },
  {
    started: "17 Sep 2026, 22:12",
    job: "Reconcile storage",
    outcome: "Failed",
    trigger: "Manual",
    took: "12.8s",
    note: "R2 list timed out on the second page",
  },
  {
    started: "17 Sep 2026, 04:00",
    job: "Purge deleted events",
    outcome: "Done",
    trigger: "Schedule",
    took: "0.9s",
    note: "Nothing to purge",
  },
] as const;

/**
 * A feature section's words: the eyebrow, the heading, the lede under it and a
 * paragraph in the body. The lede is the one marketing sentence that takes the
 * document's own 16 today (SectionShell sets no size on it).
 */
export const MARKETING = {
  eyebrow: "The album",
  heading: "One link, every photograph",
  lede: "Your guests scan the code, add what they took and see the album fill up. Nobody installs anything and nobody makes an account.",
  body: "A guest who arrives late sees the same album as everyone else, because the link is the album. Photographs land in it as they are taken, in the order they were taken, and they stay there as long as you keep the event.",
} as const;
