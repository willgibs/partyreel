"use client";

import "./keepsake.css";

import { Check, ChevronRight, Download, Play } from "lucide-react";

import {
  EventHead,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { LENS_WORDS } from "@/components/guest/gallery-view";
import type { BoardState } from "@/components/lab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Shutter } from "@/components/ui/shutter";
import { albumCountWords, setNoun } from "@/lib/export/take-home";
import { formatCount } from "@/lib/format/count";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  ALBUM_HUES,
  ClosedLine,
  Cover,
  GuestAlbum,
  HerName,
  InviteRound,
  QuietAdd,
  ReelRound,
  StartForFree,
} from "./album";
import { groundIn, guestScreen, type KeepsakeWay, overIn } from "./answers";
import { ALBUM, COVER, HERS, PRIYA, WEDDING, WEEK } from "./fixtures";
import { type Screen, SCREENS } from "./knobs";
import {
  actsIn,
  find,
  findAll,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";

/**
 * WHAT LEADS WHEN A GUEST COMES BACK (the `keepsake` question), each answer
 * drawn at its best on production's album: Priya's first screen a week on,
 * scrolled into the album, and a friend who wasn't there by the forwarded
 * link (signed out, nothing of hers). Every answer decides only what LEADS;
 * the header, the bar, the rows, the Guests and the dock are production's.
 *
 * ★ DRAWN IN THE `over` ANSWER. Where the party is over by her closing adding
 * (`switch`, `offer`), Add is gone. Where she wrapped it (`wrap`), Add stays
 * open and recedes to ONE quiet line under the cover (`QuietAdd`): the slot
 * production gives the album's word on adding (the upload panel while it
 * takes photos, the closed line once it doesn't), so a wrapped album is that
 * slot's third state, never a second home. It is not in the cover's row, so
 * the dock carries no shutter either (`guest-action-dock.tsx`: the dock
 * carries what the row carries); the Ring, the light round Add, stays dark
 * once Add has receded. `closed` is today's closed album exactly, whatever
 * the first answer: the cover's acts without Add, and the closed line.
 *
 * ★ EACH ANSWER, AS ITS OWN ADVOCATE:
 *  - `reel`: Watch the party is the cover's one white act (the reel's round,
 *    said in words), and taking photos home is a glass round beside it that
 *    opens production's own Select, then Save (the dock's shutter turns to
 *    Save in select mode): two acts, one hero. Its scrolled frame is that
 *    press's landing.
 *  - `hers`: her nine stand as a strip under the byline, "Yours · 9", the door
 *    to the album's own Yours lens (its scrolled frame); the white act is
 *    Take yours home. A newcomer has nothing of hers, so the party's reel
 *    leads in its place: her cover is never a cover with its lead cut out.
 *  - `still`: a title page. The cover held on its one photograph (slot 0,
 *    the one production already stands for a reduced-motion reader), its
 *    words centred: the name, who and the day said in full, the party in
 *    words, the album's two rounds (`keepsake.css`).
 *
 * ★ STAND-INS: the photographs, counts and faces are the board's
 * (`fixtures.ts`); select mode's three picks are the frame's own; every press
 * is inert. A premiere (the reel opening by itself, with Skip) is motion, so
 * no frame shows it: the covers stand at rest.
 */

/* ── the words, read off the party ─────────────────────────────────────── */

/** The party's day said in full, in production's own locale and zone (`formatEventDate`'s en-US, UTC). */
const DAY_IN_FULL = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date(`${WEDDING.date}T00:00:00Z`));

/** The party in words: what the album holds in production's count words (`albumCountWords`), and from how many. */
const PARTY_WORDS = `${albumCountWords({
  count: WEEK.album,
  kinds: { photos: WEEK.photos, videos: WEEK.videos },
}).replace(" & ", " and ")} from ${formatCount(WEEK.guests)} guests`;

/**
 * Select mode's picks: three of the album's first photographs, by their tiles'
 * keys (`Rows`: the still, then its place in the album).
 */
const PICKED = [0, 2, 4].map((i) => ({
  key: `${ALBUM[i]!.id}-${i}`,
  still: ALBUM[i]!,
}));
const PICKED_KEYS = new Set(PICKED.map((p) => p.key));

/* ── the cover's acts ──────────────────────────────────────────────────── */

/** Watch the party: the reel from its first photograph, the cover's one white act (the reel's round, in words). */
function WatchTheParty() {
  return (
    <Button
      type="button"
      variant="on-photo"
      size="cta"
      tabIndex={-1}
      className="min-w-0 flex-1 md:flex-none"
    >
      <Play className="fill-current" /> Watch the party
    </Button>
  );
}

/** Take them home, a glass round beside the reel: it opens the album's own Select, then Save. */
function TakeThemHome() {
  return (
    <Button
      type="button"
      variant="glass"
      size="icon-cta"
      tabIndex={-1}
      aria-label="Take them home"
      title="Take them home"
    >
      <Download />
    </Button>
  );
}

/** Take yours home: her own nine, picked for her, then Save. */
function TakeYoursHome() {
  return (
    <Button
      type="button"
      variant="on-photo"
      size="cta"
      tabIndex={-1}
      className="min-w-0 flex-1 md:flex-none"
    >
      <Download /> Take yours home
    </Button>
  );
}

/** Her nine as a strip under the byline, "Yours · 9": the door to the album's Yours lens. */
function HerStrip() {
  return (
    <button type="button" tabIndex={-1} data-ap-hers="" className="ap-hers">
      <span aria-hidden className="ap-hers-strip">
        {HERS.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the album draws one
          <img
            key={s.id}
            src={s.src}
            alt=""
            draggable={false}
            className="ap-hers-shot"
            style={{ objectPosition: s.focus }}
          />
        ))}
      </span>
      <span data-ap-hers-word="" className="text-sm font-medium">
        Yours · {formatCount(PRIYA.added)}
      </span>
      <ChevronRight aria-hidden className="ap-hers-go" />
    </button>
  );
}

/* ── the covers ────────────────────────────────────────────────────────── */

/**
 * THE STILL TITLE PAGE: production's head (`EventHead`, its house light and
 * scrim) held on one photograph, the words centred as a title page
 * (`keepsake.css`): the name, who and the day in full, the party in words.
 */
function TitlePage() {
  return (
    <EventHead
      side="album"
      className="-mt-14"
      data-ap-cover="still"
      ground={
        <div className="absolute inset-0">
          <HeadStills stills={[{ id: COVER.id, tile: COVER.src }]} />
        </div>
      }
    >
      <div data-ap-title="" className="ap-title">
        <h1 className="font-heading text-title text-balance">{WEDDING.name}</h1>
        <p className="ap-title-by text-sm text-white/85">
          <span className="flex items-center gap-2">
            <Avatar seed={WEDDING.host.seed} size="sm">
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <span className="font-medium text-white">{WEDDING.host.name}</span>
          </span>
          <span aria-hidden className="text-white/45">
            ·
          </span>
          <span data-ap-day="">{DAY_IN_FULL}</span>
        </p>
        <p
          data-ap-party=""
          className="ap-title-party text-working text-white/80"
        >
          {PARTY_WORDS}
        </p>
        <div data-ap-acts="" className="ap-title-acts">
          <ReelRound />
          <InviteRound />
        </div>
      </div>
    </EventHead>
  );
}

/** The cover each answer draws, for Priya or for a newcomer with nothing of hers. */
function coverFor(way: KeepsakeWay, screen: Screen, newcomer: boolean) {
  if (way === "still") return <TitlePage />;
  if (way === "reel")
    return (
      <Cover
        screen={screen}
        moment={WEEK}
        actions={
          <>
            <WatchTheParty />
            <TakeThemHome />
            <InviteRound />
          </>
        }
      />
    );
  if (way === "hers")
    return newcomer ? (
      // Nothing of hers to lead with: the party's reel leads in its place, never a cover with its lead cut out.
      <Cover
        screen={screen}
        moment={WEEK}
        actions={
          <>
            <WatchTheParty />
            <InviteRound />
          </>
        }
      />
    ) : (
      <Cover
        screen={screen}
        moment={WEEK}
        beneath={<HerStrip />}
        actions={
          <>
            <TakeYoursHome />
            <ReelRound />
            <InviteRound />
          </>
        }
      />
    );
  // Today's closed cover: the live acts without Add.
  return (
    <Cover
      screen={screen}
      moment={WEEK}
      actions={
        <>
          <ReelRound />
          <InviteRound />
        </>
      }
    />
  );
}

/* ── under the cover ───────────────────────────────────────────────────── */

/* ── in the album ──────────────────────────────────────────────────────── */

/** The View menu's Yours lens, as production's album says it (`live-gallery.tsx`'s lens line). */
function YoursLens() {
  return (
    <div data-ap-lens="" className="mb-3 flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        <span data-ap-lens-words="">{LENS_WORDS.yours}</span>
        <span data-ap-lens-count="" className="ml-1.5 text-faint tabular-nums">
          {formatCount(HERS.length)}
        </span>
      </span>
      <span aria-hidden className="text-faint">
        ·
      </span>
      <button
        type="button"
        tabIndex={-1}
        className="rounded-md font-medium underline-offset-4 hover:underline"
      >
        Show all
      </button>
    </div>
  );
}

/**
 * SELECT MODE'S BAR, AS PRODUCTION DRAWS IT (`live-gallery.tsx`'s
 * `SelectBar`): the album's row turned over to her selection, stuck to the
 * screen's top: Cancel, her picks as pictures then their number, Yours and All.
 */
function SelectBar() {
  return (
    <div
      data-ap-bar=""
      data-ap-select=""
      className="sticky top-0 z-30 -mx-3 mb-3 flex h-12 items-center justify-between gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur-md sm:-mx-5 sm:px-5"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        tabIndex={-1}
        className="-ml-1.5 text-sm"
      >
        Cancel
      </Button>
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden className="flex">
          {PICKED.map((p, k) => (
            // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, drawn as the bar draws one
            <img
              key={p.key}
              src={p.still.src}
              alt=""
              draggable={false}
              className="size-6 rounded-[5px] object-cover ring-2 ring-background"
              style={{
                marginLeft: k === 0 ? 0 : -8,
                objectPosition: p.still.focus,
              }}
            />
          ))}
        </span>
        <span
          data-ap-picked=""
          className="truncate text-sm font-semibold tabular-nums"
        >
          {`${formatCount(PICKED.length)} selected`}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          tabIndex={-1}
          className="rounded-full px-3 text-sm"
        >
          Yours
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          tabIndex={-1}
          className="rounded-full px-3 text-sm"
        >
          All
        </Button>
      </span>
    </div>
  );
}

/** A tile's marks in select mode, as production's tile wears them (`album-tile.tsx`'s `SelectMark`). */
function SelectMark({ picked }: { picked: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          picked ? "bg-black/40" : "bg-black/0",
        )}
      />
      <span
        aria-hidden
        data-ap-mark={picked ? "picked" : ""}
        className={cn(
          "pointer-events-none absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full",
          picked
            ? "bg-success text-success-foreground ring-2 ring-white"
            : GLASS_MARK,
        )}
      >
        {picked ? <Check className="size-3.5" /> : null}
      </span>
    </>
  );
}

/**
 * THE FOOT IN SELECT MODE, AS PRODUCTION DRAWS IT (`guest-action-dock.tsx`'s
 * `SaveDock`): the shutter turned to Save, alone at the centre in the album's
 * light, the count she has picked on its shoulder.
 */
function SaveFoot() {
  return (
    <div
      data-ap-dock="save"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent"
      />
      <div className="relative flex items-center justify-center pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <span className="relative">
          <Shutter
            state="idle"
            hues={ALBUM_HUES}
            tabIndex={-1}
            aria-label={`Save ${setNoun(PICKED.length, 0)}`}
          >
            <Download className="size-6" />
          </Shutter>
          <span
            aria-hidden
            className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-micro font-semibold text-background tabular-nums ring-2 ring-background"
          >
            {formatCount(PICKED.length)}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ── what a frame reads ────────────────────────────────────────────────── */

/** What leads the screen: the cover's lead where it stands, else what the album shows and its foot. */
function leadOf(root: HTMLElement, win: Window): string | null {
  const acts = find(root, "[data-ap-acts]");
  if (acts && inView(acts, win)) {
    const held = find(root, "[data-head-stills]")?.getAttribute(
      "data-head-stills",
    );
    if (!held) return null;
    const ground =
      held === "1" ? "one photograph held" : `${held} photographs dissolving`;
    const page = find(root, "[data-ap-title]");
    const others = actsIn(root, win, "[data-ap-acts]");
    if (page)
      return `leads: a title page on ${ground}, "${textOf(find(root, "[data-ap-day]"))}" and "${textOf(find(root, "[data-ap-party]"))}", then ${others.join(" and ")}`;
    const white = find(root, "[data-ap-acts] [data-variant='on-photo']");
    if (white) {
      const rest = others.filter((a) => a !== textOf(white));
      return `leads: "${textOf(white)}" in white on ${ground}, ${rest.join(" and ")} beside it`;
    }
    return `leads: no white act on ${ground}, only ${others.join(" and ")}`;
  }
  const dock = actsIn(root, win, "[data-ap-dock]");
  const foot = dock.length ? `the dock: ${dock.join(", ")}` : "no dock";
  const select = find(root, "[data-ap-select]");
  if (select && inView(select, win))
    return `in view: select mode, "${textOf(find(root, "[data-ap-picked]"))}" (${findAll(root, "[data-ap-mark='picked']").length} marked); ${foot}`;
  const lens = find(root, "[data-ap-lens]");
  if (lens && inView(lens, win))
    return `in view: the lens line, "${textOf(find(root, "[data-ap-lens-words]"))}" ${textOf(find(root, "[data-ap-lens-count]"))}, Show all; ${foot}`;
  const bar = find(root, "[data-ap-bar]");
  if (bar && inView(bar, win))
    return `in view: the album's bar, "${textOf(bar.querySelector("p"))}"; ${foot}`;
  return null;
}

/** Where Add stands: a quiet line, today's closed line, the dock's shutter, or nowhere. */
function addOf(root: HTMLElement, win: Window): string {
  const quiet = find(root, "[data-ap-quiet-add]");
  if (quiet)
    return inView(quiet, win)
      ? `Add: a quiet line under the cover, "${textOf(quiet)}"`
      : "Add: a quiet line under the cover, scrolled past";
  const closed = find(root, "[data-ap-closed]");
  if (closed)
    return inView(closed, win)
      ? `Add: gone, "${textOf(closed)}" under the cover`
      : "Add: gone, the closed line scrolled past";
  if (find(root, "[data-ap-dock='add']")) return "Add: the dock's shutter";
  return "Add: gone, no notice in its place";
}

/** What of hers shows: her strip, the Yours lens, select mode's Yours, or nothing. */
function hersOf(root: HTMLElement, win: Window): string {
  const strip = find(root, "[data-ap-hers]");
  if (strip && inView(strip, win))
    return `hers: a strip of ${strip.querySelectorAll("img").length} under the byline, "${textOf(find(root, "[data-ap-hers-word]"))}"`;
  const lens = find(root, "[data-ap-lens]");
  if (lens && inView(lens, win))
    return `hers: the Yours lens, her ${findAll(root, "[data-ap-rows] > div").length} alone`;
  const select = find(root, "[data-ap-select]");
  if (select && inView(select, win)) return "hers: Yours, a press in the bar";
  return "hers: nothing of hers shown";
}

/** What leads, where Add stands and what of hers shows, read off the frame. */
const readKeepsake: Reader = (root, win) => {
  if (!find(root, "[data-event-head]")) return null;
  return parts(leadOf(root, win), addOf(root, win), hersOf(root, win));
};

/* ── the story ─────────────────────────────────────────────────────────── */

/** Scrolled in, each answer's own landing: her picks for Save, her nine from the strip, or the album. */
const SCROLLED: Record<KeepsakeWay, string> = {
  closed: "Scrolled into the album",
  reel: "Take them home: Select, then Save",
  hers: "Her strip opens Yours: her nine",
  still: "Scrolled into the album",
};

export function KeepsakeStory({ way, s }: { way: KeepsakeWay; s: BoardState }) {
  const over = overIn(s);
  const screen = guestScreen(s);
  const ground = groundIn(s);
  const { w, h } = SCREENS[screen];
  // Today's closed album is today's whatever the first answer; every other answer wears Add as that answer leaves it.
  const under =
    way === "closed" ? <ClosedLine /> : over === "wrap" ? <QuietAdd /> : null;
  const frames = [
    {
      key: "top",
      title: "Priya's first screen, a week on",
      newcomer: false,
      scroll: "top" as const,
    },
    {
      key: "album",
      title: SCROLLED[way],
      newcomer: false,
      scroll: "album" as const,
    },
    {
      key: "newcomer",
      title: "A friend who wasn't there, by the forwarded link",
      newcomer: true,
      scroll: "top" as const,
    },
  ];
  return (
    <Story>
      {frames.map((f) => {
        const album = f.scroll === "album";
        const selecting = album && way === "reel";
        const lens = album && way === "hers";
        return (
          <Scene
            key={f.key}
            id={`ap-keepsake-${f.key}-${way}-${over}-${screen}`}
            w={w}
            h={screen === "1440" ? 720 : h}
            ground={ground}
            title={f.title}
            measure={readKeepsake}
          >
            <GuestAlbum
              screen={screen}
              moment={WEEK}
              corner={f.newcomer ? <StartForFree /> : <HerName />}
              cover={coverFor(way, screen, f.newcomer)}
              under={under}
              bar={selecting ? <SelectBar /> : undefined}
              lens={lens ? <YoursLens /> : undefined}
              stills={lens ? HERS : undefined}
              repeat={lens ? 0 : undefined}
              mark={
                selecting
                  ? (key) => <SelectMark picked={PICKED_KEYS.has(key)} />
                  : undefined
              }
              scroll={f.scroll}
              // Scrolled until the cover's row has left the screen: production's dock stands only then.
              offset={selecting ? 0 : 12}
              dock="look"
              foot={selecting ? <SaveFoot /> : undefined}
            />
          </Scene>
        );
      })}
    </Story>
  );
}
