"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  CalendarPlus,
  Download,
  ImageUp,
  ListChecks,
  Lock,
  QrCode,
  Settings,
} from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { Frame, useLabPrefs } from "@/components/lab";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatEventDate } from "@/lib/utils";

import { EVENT, EVENTS, MARKETING, RUNS } from "./fixtures";

/**
 * THE SURFACES THE BODY LADDER GOVERNS, DRAWN AT A REAL VIEWPORT.
 *
 * Every picture on this board is a real product surface inside a `Frame`, which
 * is the only 1:1 viewport the lab has: a fluid step is a `vw` clamp and `vw`
 * is the BROWSER's width, so a 375 column drawn as a div on a 1440 page would
 * report the desktop end while the caption said phone (traps.ts,
 * `vw-in-a-narrow-div`). Where the real component is importable it IS the
 * component (`EventCard`, `FeedSectionHeader`, `Eyebrow`, `Button`, `Card`);
 * where it reaches for a session, a provider or the network the markup is
 * copied byte for byte with its production classNames intact, because those
 * classNames are what the candidate is written against.
 *
 * ★ THE CANDIDATE IS APPLIED FROM OUTSIDE, AND IT IS THE PASTE A RULING WOULD
 * LAND. `Frame`'s `css` goes into an adopted stylesheet constructed in the
 * frame's own realm, which is ordered after every author sheet, so an unlayered
 * rule aimed at a production class (`[class~="text-sm"]`) beats the Tailwind
 * utility without a specificity war and without editing one production byte.
 * The option named "as today" passes an EMPTY candidate, so it is the site as
 * built and its numbers are what the site actually does.
 *
 * ★ AND EVERY NUMBER UNDER A FRAME IS READ OFF THE ELEMENT. `Measured` runs
 * `getComputedStyle` inside the frame's own document, so the caption cannot
 * drift from the picture. If the words above a frame and the caption under it
 * disagree, the caption is the truth (the rule gallery-width paid for).
 */

/* ── the two widths ──────────────────────────────────────────────────────── */

export const WIDTHS = {
  "1440": { w: 1440, h: 900, name: "a desktop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type WidthId = keyof typeof WIDTHS;
export const widthOf = (v: string | undefined): WidthId =>
  v === "375" ? "375" : "1440";

/* ── the line-height rule, which every other decision is drawn wearing ───── */

export type LeadingRule = "length" | "ratio" | "two";
export const leadingOf = (v: string | undefined): LeadingRule =>
  v === "ratio" ? "ratio" : v === "two" ? "two" : "length";

/** Which half of the ladder a step is on: it is what the two-ratio rule splits. */
export type Kind = "reading" | "working";

/**
 * A step's line height in px under the rule in play.
 *
 * ★ `length` IS NOT A FORMULA WE INVENTED. Tailwind's own body pairs, which
 * this site already wears at 366 + 243 + 25 sites, are 12 on 16, 14 on 20, 16
 * on 24 and 18 on 28, and every one of them is `2 x size - 8`. So the length
 * rule reproduces what we ship byte for byte at every RUNG, lands each of those
 * pairs on the 4px grid, and puts a half-rung (11, 13, 15, 17) on 14, 18, 22
 * and 26, which are even but off it. That difference is itself evidence: the
 * ladder's rungs are the sizes whose leading lands on the grid. Floored at 14,
 * because 2 x 10 - 8 is 12 and a badge on 1.2 is set solid.
 *
 * `ratio`: 1.5 exactly. Measured in the frame, this is ALREADY what an
 * arbitrary size does: Tailwind's preflight sets a unitless 1.5 on <html>, so
 * `text-[15px]` computes to 22.5 and `text-[11px]` to 16.5 with nothing written.
 * `two`: 1.6 on reading copy and 1.4 on working copy and captions.
 */
export function leadingPx(size: number, kind: Kind, rule: LeadingRule): number {
  if (rule === "ratio") return Math.round(size * 15) / 10;
  if (rule === "two")
    return Math.round(size * (kind === "reading" ? 16 : 14)) / 10;
  return Math.max(14, 2 * size - 8);
}

/* ── writing a candidate ─────────────────────────────────────────────────── */

/** A production class as a selector the candidate can aim at. */
export const cls = (name: string) => `[class~="${name}"]`;

/** One rule: a size in px and the leading the picked rule gives it. */
export function step(
  selector: string,
  size: number,
  kind: Kind,
  rule: LeadingRule,
  extra = "",
): string {
  return `${selector}{font-size:${size / 16}rem;line-height:${leadingPx(size, kind, rule) / 16}rem;${extra}}`;
}

/**
 * A fluid step: the clamp through (375, phone) and (1440, desktop) that the
 * heading ladder's own `fluid()` writes, so a marketing body step is built the
 * same way its headings are.
 */
export function fluid(
  selector: string,
  phone: number,
  desktop: number,
  kind: Kind,
  rule: LeadingRule,
): string {
  const span = (a: number, b: number) => {
    const slope = (b - a) / (1440 - 375);
    const intercept = (a - slope * 375) / 16;
    return `clamp(${(a / 16).toFixed(4)}rem, ${intercept.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${(b / 16).toFixed(4)}rem)`;
  };
  return `${selector}{font-size:${span(phone, desktop)};line-height:${span(leadingPx(phone, kind, rule), leadingPx(desktop, kind, rule))}}`;
}

/* ── the measurement ─────────────────────────────────────────────────────── */

export type Probe = {
  label: string;
  sel: string;
  /** Also print the computed letter-spacing: the label step is a PAIR. */
  track?: boolean;
};

/**
 * Reads the computed size and leading off real elements INSIDE the frame.
 *
 * ★ THE STYLE IS READ THROUGH THE FRAME'S OWN WINDOW. The subtree is portalled
 * into the iframe's document, so `getComputedStyle` has to come from that
 * document's view or it answers about a node in another realm.
 *
 * ★ AND IT RE-READS AFTER THE CANDIDATE LANDS. The sheet is adopted on a rAF
 * and again at the frame's settle (500ms), and a font-size change resizes the
 * box, so a `ResizeObserver` catches most of it; the three delayed reads cover
 * the case where a box is fixed and only the glyphs inside it moved.
 */
function Measured({
  probes,
  css,
  onMeasure,
  children,
}: {
  probes: readonly Probe[];
  /** The candidate in play: a change re-reads. */
  css: string;
  onMeasure: (text: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const report = useRef(onMeasure);
  useEffect(() => {
    report.current = onMeasure;
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    const round = (n: number) => (Math.round(n * 10) / 10).toString();
    const read = () => {
      const parts: string[] = [];
      for (const p of probes) {
        const node = el.querySelector(p.sel);
        if (!node) continue;
        const s = win.getComputedStyle(node);
        const size = parseFloat(s.fontSize);
        const lh = parseFloat(s.lineHeight);
        // Tracking comes back in px, and the pair he is answering is in em,
        // so it is divided back by the size it was resolved against.
        const track = parseFloat(s.letterSpacing);
        const em = Number.isNaN(track) ? 0 : track / size;
        parts.push(
          `${p.label} ${round(size)}/${Number.isNaN(lh) ? "normal" : round(lh)}${
            p.track ? ` +${em.toFixed(3)}em` : ""
          }`,
        );
      }
      if (parts.length > 0)
        report.current(`${parts.join(" · ")} px, measured in the frame`);
    };
    read();
    const timers = [160, 700, 1500].map((ms) => win.setTimeout(read, ms));
    const ro = new win.ResizeObserver(read);
    ro.observe(el);
    return () => {
      timers.forEach((t) => win.clearTimeout(t));
      ro.disconnect();
    };
  }, [probes, css]);

  return <div ref={ref}>{children}</div>;
}

/* ── the frame, fitted the way the lab is ────────────────────────────────── */

/**
 * The lab's Fit preference, kept by a frame. A `Stage` answers it by itself; a
 * bare `Frame` does not, so a 1440 window would stay 1:1 under Fit and the
 * stage head's scale button would seem dead. Zooming a frame is honest: `zoom`
 * on an iframe's ancestor scales the picture and leaves the frame's own
 * viewport alone (measured on gallery-width).
 */
function Fit({ w, children }: { w: number; children: ReactNode }) {
  const { fit } = useLabPrefs();
  const zoomed = fit === "zoom";
  const box = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el || !zoomed) return;
    const sync = () => setRoom(el.getBoundingClientRect().width);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zoomed]);

  const k = zoomed && room ? Math.min(1, room / w) : 1;
  return (
    <div
      ref={box}
      data-stage-fit={zoomed ? "zoom" : "true"}
      className={zoomed ? "min-w-0 overflow-hidden" : "min-w-0 overflow-x-auto"}
    >
      <div style={{ width: w, zoom: k }}>{children}</div>
    </div>
  );
}

/** One surface at one width, wearing one candidate, with its numbers read off it. */
export function TypeFrame({
  id,
  width,
  title,
  css,
  probes,
  short,
  tall,
  children,
}: {
  id: string;
  width: WidthId;
  title: string;
  css: string;
  probes: readonly Probe[];
  /**
   * How much of the window the tile shows. The WIDTH is what has to be real (a
   * `vw` clamp reads it, and so does every breakpoint); the height only decides
   * how much of the page is in the tile. `short` is for a composed surface that
   * is not a page and would otherwise leave a third of a 900px window empty;
   * `tall` is for the one decision drawn on TWO stacked surfaces, where 900 put
   * the admin's table under the fold and half the evidence went with it
   * (caught on the first capture, 2026-09-18).
   */
  short?: boolean;
  tall?: boolean;
  children: ReactNode;
}) {
  const { w, h: full } = WIDTHS[width];
  // `tall` is a desktop affordance only: a 1100px phone viewport is not a
  // window anyone has, and at 375 the two surfaces cannot share a screen anyway.
  const h = short
    ? Math.min(full, 620)
    : tall && width === "1440"
      ? 1100
      : full;
  const [caption, setCaption] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`${id}-${width}`}
        w={w}
        h={h}
        css={css}
        title={`${title}, ${WIDTHS[width].name}`}
        caption={caption}
      >
        <Measured probes={probes} css={css} onMeasure={setCaption}>
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

/* ── the guest's event page ──────────────────────────────────────────────── */

/**
 * THE GUEST'S EVENT PAGE, first screen, as `event-experience.tsx` lays it out
 * inside its `max-w-2xl px-5 py-8` column, with `guest-header.tsx` above it as
 * a signed-out visitor meets it (the shipped header reads the session and asks
 * the network who is looking). The description is the one long thing a guest
 * reads and it keeps its production `text-[15px]`; the locked page's line
 * carries the same class, which is why one step answers both.
 */
export function GuestPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <div className="flex h-8 items-center">
          <Button variant="ghost" size="sm">
            Start for free
          </Button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <header>
          <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
          <p className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-faint">Hosted by</span>
              <span className="font-medium text-foreground">{EVENT.host}</span>
            </span>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>{formatEventDate(EVENT.date)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {EVENT.photos} photos &amp; videos from {EVENT.guests} guests
          </p>
          <p
            data-bt="guest-description"
            className="mt-2 max-w-prose text-[15px] text-pretty text-muted-foreground"
          >
            {EVENT.description}
          </p>
        </header>
        {/* The action block as event-experience.tsx ships it: the primary Add
            at size lg, the two seconds at the default size forced to h-9. */}
        <div className="mt-4">
          <Button type="button" size="lg" className="w-full">
            <ImageUp /> Add photos
          </Button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-9 w-full">
              Save
            </Button>
            <Button variant="outline" className="h-9 w-full">
              Invite
            </Button>
          </div>
        </div>
        {/* The locked page's line and the entry sheet's row, both on the same
            step as the description (event-experience.tsx, entry-modal.tsx). */}
        <div className="mt-8 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            You&rsquo;re invited
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="size-4" aria-hidden />
            {/* One string, not an expression beside JSX text: the space
                between the two was being eaten in the compiled output and the
                tile read "128photos" (caught on the first capture). */}
            <p className="text-[15px]">{`${EVENT.photos} photos & videos inside`}</p>
          </div>
          <p className="text-[15px] text-muted-foreground">
            Enter the password the host gave you and the album opens.
            We&rsquo;ll remember this device.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── the host's dashboard ────────────────────────────────────────────────── */

/**
 * THE HOST'S DASHBOARD as `(app)/dashboard/page.tsx` lays it out inside
 * `AppShell`: the header, the page heading and its stat line, the New event
 * action, the over-limit notice, the storage meter's two lines and the events
 * section under its 11px label, with the real `EventCard` in the grid.
 */
export function Dashboard({
  width,
  stacked,
}: {
  width: WidthId;
  stacked?: boolean;
}) {
  const phone = width === "375";
  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        // ★ `min-h-full` RESOLVES AGAINST THE FRAME'S VIEWPORT. Stacked under
        // another surface it claims the whole window and pushes the one below
        // it out of the tile, silently: the admin table was in the DOM and
        // measured correctly while nothing of it was on screen.
        !stacked && "min-h-full",
      )}
    >
      <header className="border-b bg-background/80">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              M
            </span>
          </div>
        </Container>
      </header>
      <main className="flex-1 py-8">
        <Container className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <PageHeading>Dashboard</PageHeading>
              <p data-bt="app-stat" className="text-sm text-muted-foreground">
                3 of 5 events used
              </p>
            </div>
            <Button>
              <CalendarPlus /> New event
            </Button>
          </div>

          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              You&rsquo;re over your storage limit
            </p>
            <p data-bt="app-notice" className="mt-1 text-muted-foreground">
              Upgrade or remove media by 2 October. After that we&rsquo;ll
              automatically reduce your storage, largest files first.
            </p>
          </div>

          <div className="space-y-1.5 rounded-lg border border-border px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                Storage
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-muted">
                <span className="block h-full w-2/3 rounded-full bg-foreground/70" />
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                68 GB of 100 GB
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pro plan, renews 1 October.
            </p>
          </div>

          <section aria-label="Your events">
            <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Your events
            </h2>
            <div
              className={`mt-2.5 grid gap-4 ${phone ? "grid-cols-1" : "grid-cols-3"}`}
            >
              {EVENTS.map((e) => (
                <EventCard
                  key={e.name}
                  href="#"
                  name={e.name}
                  coverUrl={e.cover}
                  dateLabel={e.date}
                  itemsLabel={e.items}
                  statusLabel={e.status}
                  pendingCount={e.pending}
                />
              ))}
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}

/* ── the admin's table ───────────────────────────────────────────────────── */

/**
 * THE ADMIN JOBS TABLE as `admin/jobs/page.tsx` ships it: a `Card` whose body
 * is `text-sm`, a `text-xs` head row, and a meta column of dates and durations.
 * The densest reading surface in the product, and the one that decides whether
 * "host and admin on 14" survives.
 */
export function AdminTable({ stacked }: { stacked?: boolean }) {
  return (
    <div
      className={cn(
        "bg-background px-8 py-8 text-foreground",
        !stacked && "min-h-full",
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription data-bt="admin-lede">
            The last {RUNS.length} runs across every job, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table data-bt="admin-table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Started</th>
                  <th className="py-2 pr-3 font-medium">Job</th>
                  <th className="py-2 pr-3 font-medium">Outcome</th>
                  <th className="py-2 pr-3 font-medium">Trigger</th>
                  <th className="py-2 pr-3 text-right font-medium">Took</th>
                  <th className="py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {RUNS.map((r) => (
                  <tr key={r.started} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                      {r.started}
                    </td>
                    <td className="py-2 pr-3">{r.job}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          r.outcome === "Failed"
                            ? "text-destructive"
                            : "text-foreground"
                        }
                      >
                        {r.outcome}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {r.trigger}
                    </td>
                    <td className="py-2 pr-3 text-right text-muted-foreground tabular-nums">
                      {r.took}
                    </td>
                    <td className="py-2 text-muted-foreground">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** The dashboard over the admin table: one frame holds both surfaces the app's
 *  working step has to serve, so they are judged together. */
export function AppSurfaces({ width }: { width: WidthId }) {
  return (
    <div className="bg-background">
      <Dashboard width={width} stacked />
      <AdminTable stacked />
    </div>
  );
}

/* ── a marketing feature section ─────────────────────────────────────────── */

/**
 * A FEATURE SECTION as `SectionShell` composes it: the eyebrow, the heading on
 * the ladder's `section` step, and the lede under it, which sets NO size of its
 * own and so takes the document's 16. The paragraph below is the body a feature
 * page writes at `text-[15px] leading-7`.
 *
 * The shell's own `Reveal` island is left out (`reveal="none"` is its own
 * answer): a reveal target's resting state is opacity 0, and a board that
 * freezes motion would draw an empty section (traps.ts, `blanket-rest`).
 */
export function MarketingSection({ stacked }: { stacked?: boolean }) {
  return (
    <div
      className={cn(
        "bg-background py-16 text-foreground",
        !stacked && "min-h-full",
      )}
    >
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          <Eyebrow>{MARKETING.eyebrow}</Eyebrow>
          <h2 className="font-heading text-section text-balance">
            {MARKETING.heading}
          </h2>
          <p data-bt="mkt-lede" className="text-pretty text-muted-foreground">
            {MARKETING.lede}
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-2xl">
          <p
            data-bt="mkt-body"
            className="text-[15px] leading-7 text-pretty text-muted-foreground"
          >
            {MARKETING.body}
          </p>
        </div>
      </Container>
    </div>
  );
}

/**
 * READING COPY OVER WORKING COPY, in one frame: the line-height rule is the one
 * decision that treats them differently (the two-ratio option), so it is the
 * one picture that has to hold a marketing paragraph and a dense table at once.
 */
export function LeadingSurfaces() {
  return (
    <div className="bg-background">
      <MarketingSection stacked />
      <AdminTable stacked />
    </div>
  );
}

/* ── the small end: captions, counters, badges, labels ───────────────────── */

/**
 * WHERE THE SMALLEST TYPE IN THE PRODUCT LIVES: the event card's overlay pills
 * (10px on a photograph), a feed header's 11px label and its 10px count, and a
 * table's 12px meta. All three are the shipped components, so the floor is
 * judged where it is actually set.
 */
export function SmallSurfaces({ width }: { width: WidthId }) {
  const phone = width === "375";
  return (
    <div className="min-h-full bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className={`grid gap-4 ${phone ? "grid-cols-1" : "grid-cols-3"}`}>
          {EVENTS.map((e) => (
            <EventCard
              key={e.name}
              href="#"
              name={e.name}
              coverUrl={e.cover}
              dateLabel={e.date}
              itemsLabel={e.items}
              statusLabel={e.status}
              pendingCount={e.pending}
            />
          ))}
        </div>

        <div className="space-y-2.5">
          <FeedSectionHeader
            label="Gallery"
            count={128}
            action={
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm">
                  <Download /> Download
                </Button>
                <Button variant="outline" size="sm">
                  <ListChecks /> Select
                </Button>
              </div>
            }
          />
          <FeedSectionHeader label="Review" count={6} amber />
        </div>

        <div className="rounded-lg border border-border p-4">
          <table className="w-full text-sm">
            <thead>
              {/* The head row is the caption-sized part of a table; the cells
                  under it are the app's working step, and stay there. */}
              <tr
                data-bt="table-head"
                className="border-b border-border text-left text-xs text-muted-foreground"
              >
                <th className="py-2 pr-3 font-medium">Started</th>
                <th className="py-2 pr-3 font-medium">Job</th>
                <th className="py-2 pr-3 text-right font-medium">Took</th>
              </tr>
            </thead>
            <tbody>
              {RUNS.slice(0, 3).map((r) => (
                <tr key={r.started} className="border-b border-border/50">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                    {r.started}
                  </td>
                  <td className="py-2 pr-3">{r.job}</td>
                  <td className="py-2 pr-3 text-right text-muted-foreground tabular-nums">
                    {r.took}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * EVERY UPPERCASE LABEL THE SITE SETS, in the places it sets them: the
 * marketing `Eyebrow` (12 on 0.14em, 31 sites share that pair), a blog and a
 * help chip on the same one, the dashboard's section labels and the shipped
 * `FeedSectionHeader` (11 on `tracking-wide`, 0.025em, 21 sites), the guest
 * entry sheet's row and the pricing teaser's badge (10 on 0.14em).
 *
 * ★ TEN OF THEM, NOT TWO, BECAUSE A PAIR IS JUDGED ACROSS THE SITE. One
 * eyebrow beside one app label looks like a taste question; ten of them at the
 * sizes and trackings they actually wear is the sweep the answer commits to.
 */
export function LabelSurfaces({ width }: { width: WidthId }) {
  const phone = width === "375";
  return (
    <div className="min-h-full bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-3 text-center">
          <Eyebrow data-bt="eyebrow">{MARKETING.eyebrow}</Eyebrow>
          <h2 className="font-heading text-section text-balance">
            {MARKETING.heading}
          </h2>
          <p className="text-pretty text-muted-foreground">{MARKETING.lede}</p>
        </div>

        <div className={`grid gap-4 ${phone ? "grid-cols-1" : "grid-cols-2"}`}>
          {/* The marketing pair, at the three sites that share it. */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              On this page
            </p>
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Getting started
            </p>
            <span className="inline-flex text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Four minute read
            </span>
            <span className="inline-flex rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Most popular
            </span>
          </div>

          {/* The app pair, at the sites that share it. */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h2
              data-bt="app-label"
              className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Your events
            </h2>
            <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Your uploads
            </h2>
            <FeedSectionHeader label="Gallery" count={128} />
            <FeedSectionHeader label="Review" count={6} amber />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            You&rsquo;re invited
          </p>
          <p className="text-[15px] text-muted-foreground">
            Enter the password the host gave you and the album opens.
          </p>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Private album
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── the buttons ─────────────────────────────────────────────────────────── */

/**
 * EVERY BUTTON SIZE IN THE PLACE IT SHIPS: the guest's full-width `cta` over
 * its two `lg` seconds, the host's command strip on the default size, a feed
 * header's `sm` pair, and an `xs` chip. The sizes are the real component's, so
 * a candidate that moves `text-sm` moves the buttons too unless it says not to,
 * which is the whole question.
 */
export function ButtonSurfaces({ width }: { width: WidthId }) {
  const phone = width === "375";
  return (
    <div className="min-h-full bg-background px-6 py-8 text-foreground">
      <div
        className={`mx-auto grid max-w-5xl gap-6 ${phone ? "" : "grid-cols-2"}`}
      >
        {/* The guest's action block, under the words it follows. */}
        <div className="rounded-lg border border-border p-4">
          <h1 className="font-heading text-subsection">{EVENT.name}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {EVENT.photos} photos and videos from {EVENT.guests} guests
          </p>
          <div className="mt-4">
            <Button type="button" size="lg" className="w-full">
              <ImageUp /> Add photos
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-9 w-full">
                Save
              </Button>
              <Button variant="outline" className="h-9 w-full">
                Invite
              </Button>
            </div>
          </div>
        </div>

        {/* The 44px cta: a pricing or contact submit, and the marketing header's. */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Free forever
          </p>
          <p className="mt-2 text-[15px] text-muted-foreground">
            One event, fifty photographs, no card. Upgrade whenever you need the
            room.
          </p>
          <Button type="button" size="cta" className="mt-4 w-full">
            Start for free
          </Button>
        </div>

        {/* The host's command strip, on the default size. */}
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            The host&rsquo;s event page
          </h2>
          <div
            className={`mt-3 flex gap-2 ${phone ? "flex-col" : "flex-row items-center"}`}
          >
            <Button className={phone ? "" : "flex-1"}>
              <QrCode /> Share
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <ImageUp /> Add photos
              </Button>
              <Button variant="outline">
                <Settings /> Settings
              </Button>
            </div>
          </div>
        </div>

        {/* The feed header's sm pair, and the xs pair on a review tile. */}
        <div className="space-y-3 rounded-lg border border-border p-4">
          <FeedSectionHeader
            label="Gallery"
            count={128}
            action={
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm">
                  <Download /> Download
                </Button>
                <Button variant="outline" size="sm">
                  <ListChecks /> Select
                </Button>
              </div>
            }
          />
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local still */}
            <img
              src={EVENTS[1].cover}
              alt=""
              className="block aspect-[16/10] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5">
              <Button variant="secondary" size="xs">
                Approve
              </Button>
              <Button variant="secondary" size="xs">
                Hide
              </Button>
              <span className="text-[10px] font-medium text-white/80">
                Waiting for review
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
