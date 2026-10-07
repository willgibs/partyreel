"use client";

import "./recap.css";

import { Download, QrCode, Share2, Wand2, X } from "lucide-react";
import type { ReactNode } from "react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import { Stage } from "@/components/app/dashboard/stage";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { CodeCard, readableLink } from "@/components/app/share/code-card";
import type { BoardState } from "@/components/lab";
import { Button } from "@/components/ui/button";
import { defaultCapForTier, GIGABYTE, TIER_NAMES } from "@/lib/constants/tiers";
import type { HomeContext, HomeEvent } from "@/lib/dashboard/home-event";
import { WALL_PHOTOS } from "@/lib/dashboard/stage";
import { longDate, whenOf } from "@/lib/dashboard/when";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { cn, formatEventDate } from "@/lib/utils";

import { groundIn, hostScreen, type RecapWay } from "./answers";
import { COVER_SIX, MORNING, type Still, still, WEDDING } from "./fixtures";
import { AppBar, HubHead, HubScreen } from "./hub";
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
 * WHERE MAYA MEETS HER MORNING AFTER (the `recap` question): Sunday at 9, the
 * party last night, 186 in the album from 39 guests. Two frames for every
 * answer, so they compare like for like: her home (production's head and the
 * dashboard's stage) and her event's hub (production's cover, doors, light and
 * album), each as the answer draws it. Each answer draws only what it changes:
 *  - `stage` (today): nothing. Production's `Stage` on the party's facts
 *    already turns to it ("Yesterday", the name, 186 in the album, 39 guests,
 *    Share the album and Open), and production's hub reads as it did at the
 *    party: its checklist is not drawn from the day after the date
 *    (`checklistOver`), so its place under the light is empty.
 *  - `hub`: in the checklist's place, the room under her cover holds the
 *    recap (`RecapPlate`): the party in words and its three acts, lit by the
 *    hub's one light, with a quiet close.
 *  - `cover`: her cover itself turns (`CoverRecap`): its line says the party
 *    in words, and the acts stand where the code stood (on its foot in a
 *    hand); a third frame shows where the code went, into Share the album.
 *  - `home`: her home's stage made the recap (`RecapStage`): production's
 *    stage, its light and its live wall's grammar, saying what the party
 *    made, with the three acts in place of Share the album and Open.
 *
 * ★ THE THREE ACTS ARE ONE COMPONENT (`RecapActs`), arranged by where they
 * stand: Share the album leads (every shared album invites the next party),
 * Make a clip is the reel's own Make your own (`Wand2`, a clip made on her
 * device), and Download all, the host's Take it home, is the quietest: export
 * starts the offramp (Will's drive-export note), so it is offered, never the
 * hero. Share the album is production's Invite door after the party
 * (`stageActsOf`: "Share the album", `to: "invite"`, which opens the code
 * card), so it carries the code wherever the code is not.
 *
 * ★ NO EMAIL OR PUSH (X11), NO ANNIVERSARY: the recap is in the app alone,
 * and nothing here draws a year on.
 *
 * ★ STAND-INS, SAID ONCE: the stills are the bootstrap twelve, the counts the
 * board's (`MORNING`), the storage ring's figures the board's, and every press
 * is inert (the code card is drawn open, never opened).
 */

/* ── the party's facts, the morning after ──────────────────────────────── */

/** Sunday morning, on her own clock (`HomeContext`). */
const SUNDAY: HomeContext = {
  today: "2026-09-13",
  evening: false,
  liveReelEnabled: true,
  storagePct: 12,
};

/** The party's day as production words it from her today (`whenOf`): "Yesterday" the morning after. */
const WHEN = whenOf(WEDDING.date, SUNDAY.today);

/** What the party made, in words: its kinds and its guests. */
const MADE = `${formatCount(MORNING.photos)} photos and ${formatCount(MORNING.videos)} videos from ${formatCount(MORNING.guests)} guests`;

/** The recap's headline, the same words wherever it stands, so the answers differ only in where. */
const HEADLINE = `Your party made ${formatCount(MORNING.album)}`;

/** The party as her home reads it the morning after (`HomeEvent`): its facts, never a guess. */
const PARTY_EVENT: HomeEvent = {
  id: "after-party-maya-and-jay",
  name: WEDDING.name,
  createdAt: "2026-08-20T18:00:00.000Z",
  door: "open",
  hasPassword: false,
  acceptingUploads: true,
  showReel: true,
  description: WEDDING.note,
  approved: MORNING.album,
  pending: 0,
  waiting: 0,
  playable: 2,
  ready: null,
  arrivals: { today: 12, lastHour: 0 },
  date: WEDDING.date,
  endDate: null,
  lastArrival: { at: "2026-09-13T08:41:00.000Z", day: "2026-09-13" },
};

/** The stage's stills after its day: its card's, the cover's six (the reel's opening). */
const STAGE_PHOTOS = COVER_SIX.map((s) => ({ id: s.id, url: s.src }));

/**
 * THE RECAP'S WALL (the `home` answer): nine of the night's photographs in the
 * live wall's grammar, the reel's opening six and three more of the night,
 * its toast leading (a host's picks are never asked here, so nothing claims
 * to be her best; wired, this is the reel's take, its first pass).
 */
const WALL: readonly Still[] = [
  still("wedding-toast"),
  still("wedding-golden", "45% 45%"),
  still("wedding-arch", "50% 40%"),
  still("reception-table", "50% 62%"),
  still("wedding-rings"),
  still("wedding-petals", "50% 30%"),
  still("reception-hall"),
  still("party-dj"),
  still("concert-confetti"),
];

/* ── what the frames read ──────────────────────────────────────────────── */

/** A block's words, part by part: each child's own words (a glyph's count by its name, "39 guests"), joined. */
function wordsOf(el: Element | null): string {
  if (!el) return "";
  return [...el.children]
    .map((c) =>
      c.matches("[data-slot='glyph-count']")
        ? (c.getAttribute("aria-label") ?? "")
        : textOf(c),
    )
    .filter(Boolean)
    .join(" · ");
}

/** A stage's numbers as a list reads them: "186 in the album, 39 guests". */
function numbersOf(stage: HTMLElement): string | null {
  const dl = stage.querySelector("[data-stage-numbers]");
  if (!dl) return null;
  return [...dl.children]
    .map(
      (n) =>
        `${textOf(n.querySelector("dd"))} ${textOf(n.querySelector("dt"))}`,
    )
    .join(", ");
}

/** Her home: whether its stage is the recap, what it says, how many photographs it shows, and its acts. */
const readHome: Reader = (root, win) => {
  const stage = find(root, "[data-stage]");
  if (!stage) return null;
  const acts = actsIn(root, win, "[data-stage-acts]");
  if (acts.length === 0) return null;
  const recap = stage.hasAttribute("data-ap-recap");
  const tiles = [
    ...stage.querySelectorAll<HTMLElement>(
      "[data-stage-wall] li, [data-stage-calm] > div",
    ),
  ].filter((t) => inView(t, win)).length;
  const made = stage.querySelector("[data-ap-made]");
  return parts(
    recap ? "her home's stage is the recap" : "her home's stage, no recap",
    `it says "${textOf(stage.querySelector("[data-stage-word]"))}", "${textOf(stage.querySelector("h2"))}", ${
      made ? `"${textOf(made)}"` : numbersOf(stage)
    }`,
    `${tiles} ${tiles === 1 ? "photograph" : "photographs"}`,
    `acts: ${acts.join(", ")}`,
  );
};

/** Her hub: where the recap stands (on the cover, under its light, or nowhere), what it says, its acts, and the code. */
const readHub: Reader = (root, win) => {
  const head = find(root, "[data-ap-hub-head]");
  const album = find(root, "section[aria-label='Album']");
  if (!head || !album) return null;
  const code = find(root, "[data-code-door]");
  const theCode =
    code && inView(code, win)
      ? "her code on the cover"
      : "no code on the cover";
  const recap = find(root, "[data-ap-recap]");
  if (!recap || !inView(recap, win))
    return parts(
      "her hub, no recap",
      `the cover says "${wordsOf(find(root, "[data-ap-hub-facts]"))}"`,
      theCode,
      find(root, "[data-checklist]")
        ? "the checklist under the light"
        : "nothing under the light",
    );
  const light = find(root, ".hub-light");
  const r = recap.getBoundingClientRect();
  const a = album.getBoundingClientRect();
  const lit = light?.getBoundingClientRect();
  const where = head.contains(recap)
    ? "on her cover"
    : lit && r.top >= lit.bottom - 1 && r.bottom <= a.top + 1
      ? `under her cover's light (${Math.round(lit.height)}px), over the album`
      : "between her cover and the album";
  const away = find(root, "[data-ap-put-away]");
  const acts = find(root, "[data-ap-acts]");
  const actsAt = !acts
    ? ""
    : acts.closest("[data-ap-foot]")
      ? " on the cover's foot"
      : head.contains(acts)
        ? " where the code stood"
        : "";
  return parts(
    `her hub: the recap ${where}`,
    `it says "${wordsOf(find(root, "[data-ap-say]"))}"`,
    `acts${actsAt}: ${actsIn(root, win, "[data-ap-acts]").join(", ")}`,
    away ? `a quiet "${away.getAttribute("aria-label")}"` : undefined,
    theCode,
  );
};

/** Where the code went (the `cover` answer): the card Share the album opens, what it holds and offers. */
const readCode: Reader = (root, win) => {
  const card = find(root, "[data-slot='code-card']");
  if (!card) return null;
  const acts = actsIn(root, win, "[data-slot='code-card']").filter(
    (a) => a !== "Close",
  );
  const drawn = findAll(root, "[data-slot='code-card'] svg").some(
    (svg) => svg.getBoundingClientRect().width > 100,
  );
  return parts(
    `Share the album opens the code card over her hub: "${textOf(card.querySelector(".font-heading"))}"`,
    drawn ? "the code, scannable" : "the code's place",
    `acts: ${acts.join(", ")}`,
  );
};

/* ── the three acts ────────────────────────────────────────────────────── */

/**
 * THE MORNING AFTER'S THREE ACTS, one press each, arranged by where they
 * stand: `stack` in the room (the hub's plate, her home's stage), `corner` on
 * the cover where the code stood, `foot` on the cover's foot in a hand, where
 * the two after Share become the cover's own rounds.
 */
function RecapActs({ layout }: { layout: "stack" | "corner" | "foot" }) {
  const photo = layout !== "stack";
  const size = photo ? "cta" : "lg";
  const rounds = layout === "foot";
  return (
    <div data-ap-acts="" className={`ap-acts-${layout}`}>
      <Button
        type="button"
        tabIndex={-1}
        size={size}
        variant={photo ? "on-photo" : "default"}
        data-ap-act="share"
      >
        {/* On the cover the white key wears the code's own glyph: the code went into it (production's Invite). */}
        {photo ? <QrCode /> : <Share2 />} Share the album
      </Button>
      {rounds ? (
        <>
          <Button
            type="button"
            tabIndex={-1}
            size="icon-cta"
            variant="glass"
            aria-label="Make a clip"
            data-ap-act="clip"
          >
            <Wand2 />
          </Button>
          <Button
            type="button"
            tabIndex={-1}
            size="icon-cta"
            variant="glass"
            aria-label="Download all"
            data-ap-act="download"
          >
            <Download />
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            tabIndex={-1}
            size={size}
            variant={photo ? "glass" : "secondary"}
            data-ap-act="clip"
          >
            <Wand2 /> Make a clip
          </Button>
          <Button
            type="button"
            tabIndex={-1}
            size={size}
            variant={photo ? "glass" : "ghost"}
            data-ap-act="download"
          >
            <Download /> Download all
          </Button>
        </>
      )}
    </div>
  );
}

/* ── her home ──────────────────────────────────────────────────────────── */

/** The storage ring, production's (`StorageMeter`), on her Event Pass: an eighth of it used. */
function Ring() {
  return (
    <StorageMeter
      activeBytes={3 * GIGABYTE}
      deletedBytes={0}
      storageCap={defaultCapForTier("event_pass")}
      makeRoom={false}
      passExpiry="2027-08-20"
      planName={TIER_NAMES.event_pass}
      hasBilling
      isEventPass
      tier="event_pass"
    />
  );
}

/**
 * HER HOME THE MORNING AFTER, AS PRODUCTION COMPOSES IT (`home.tsx`): her
 * bar with no trail, the wide page's gutter, the day's head ("1 event · Event
 * Pass": a pass holds one event, so the stage says its phase, never the
 * chooser's words), then the stage, as the answer draws it.
 */
function Home({ way }: { way: RecapWay }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppBar trail={false} />
      <main className="py-8">
        <div className="space-y-7 px-3 sm:px-5 lg:space-y-9">
          <HomeHead
            day={longDate(SUNDAY.today)}
            line={`1 event · ${TIER_NAMES.event_pass}`}
            storage={<Ring />}
          />
          {way === "home" ? (
            <RecapStage />
          ) : (
            <Stage
              event={PARTY_EVENT}
              ctx={SUNDAY}
              guests={MORNING.guests}
              photos={STAGE_PHOTOS}
              share={{ joinUrl: WEDDING.permanent, qrStyle: "classic" }}
              qrToken="3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
            />
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * HER HOME'S STAGE, MADE THE RECAP (the `home` answer): production's `Stage`
 * markup recomposed, because it has no slot for its headline or its acts. Its
 * band, its light (the lead photograph blurred into the dark behind the
 * words), its phase word with the party's name after it as the pulse stands
 * there, then "Your party made 186" where the name stood, the party's line
 * where the date stood, the three acts where its two stood, and on its picture
 * side the live wall's grammar (`Wall`: nine at a desk, the lead four cells
 * large; three in a hand), a press on which opens her hub as today.
 */
function RecapStage() {
  const lead = WALL[0]!;
  return (
    <section
      data-stage="after"
      data-ap-recap="home"
      aria-label={WEDDING.name}
      className="dark relative isolate flex flex-col overflow-hidden rounded-2xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border lg:grid lg:h-[clamp(420px,30vw,560px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 lg:right-[45%]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in still, the stage's own light */}
          <img
            src={lead.src}
            alt=""
            className="absolute inset-0 size-full scale-150 object-cover opacity-70 blur-3xl saturate-150"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-gallery/55 via-gallery/35 to-gallery/60" />
      </div>

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:justify-between lg:p-10">
        <div data-ap-say="">
          <p
            data-stage-word="after"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-gallery-muted uppercase"
          >
            <span data-stage-phase="">{WHEN}</span>
            <span className="tracking-normal normal-case">{`· ${WEDDING.name}`}</span>
          </p>
          <h2 className="mt-2 line-clamp-3 font-heading text-page text-balance text-white lg:mt-4 lg:text-section">
            {HEADLINE}
          </h2>
          <p data-ap-made="" className="mt-1.5 text-sm text-gallery-muted">
            {MADE}
          </p>
        </div>
        <div data-stage-acts="recap">
          <RecapActs layout="stack" />
        </div>
      </div>

      <div className="relative order-first aspect-[4/3] min-h-0 lg:order-none lg:aspect-auto">
        <a
          href="#"
          tabIndex={-1}
          aria-label={`Open ${WEDDING.name}`}
          className="absolute inset-0 outline-none"
        >
          <Wall stills={WALL} />
        </a>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-gallery/90 to-transparent lg:block"
        />
      </div>
    </section>
  );
}

/** The live wall's grammar (`stage.tsx`'s `Wall`, retyped: it is not exported): nine at a desk, three in a hand. */
function Wall({ stills }: { stills: readonly Still[] }) {
  const shown = stills.slice(0, WALL_PHOTOS);
  return (
    <ul
      data-stage-wall={shown.length}
      className="grid size-full grid-cols-3 grid-rows-2 gap-1 lg:grid-cols-4 lg:grid-rows-3"
    >
      {shown.map((s, i) => (
        <li
          key={`${s.id}-${i}`}
          data-media-tile
          className={cn(
            "relative overflow-hidden",
            i === 0 && "col-span-2 row-span-2",
            i >= 3 && "max-lg:hidden",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in still */}
          <img
            src={s.src}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: s.focus }}
          />
        </li>
      ))}
    </ul>
  );
}

/* ── her hub ───────────────────────────────────────────────────────────── */

/**
 * THE RECAP ON HER HUB (the `hub` answer), in the checklist's place: the room
 * under her cover holding what the party made and its three acts, lit by the
 * hub's own Seam (`recap.css` says how: one light, the cover's, reaching the
 * room's length into the plate on paper as in the room). The words stand where
 * the light is spent; the close is quiet, at its corner.
 *
 * ★ IT LEAVES ONCE SHE HAS SHARED OR PUT IT AWAY, NEVER UNDER HER EYES (the
 * checklist's own rule): it stays through the visit she pressed it in, and the
 * next visit draws the strip again, the hub as it is today.
 */
function RecapPlate() {
  return (
    <section
      data-ap-recap="hub"
      aria-label="What your party made"
      className="ap-recap-band"
    >
      <div className="dark ap-recap-room text-foreground">
        {/* A lower third, never a second title: the cover's name stays the page's one (`text-chapter`), so the
            party's words are a step down the ladder from it (`text-page`) and the light above them does the rest. */}
        <div data-ap-say="" className="ap-recap-say">
          <p className="text-label text-muted-foreground uppercase">{WHEN}</p>
          <h2 className="mt-1.5 font-heading text-page text-balance">
            {HEADLINE}
          </h2>
          <p className="mt-1 text-reading text-muted-foreground">{MADE}</p>
        </div>
        <RecapActs layout="stack" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          aria-label="Put away"
          title="Put away"
          data-ap-put-away=""
          className="ap-recap-close text-muted-foreground"
        >
          <X />
        </Button>
      </div>
    </section>
  );
}

/**
 * HER COVER, TURNED TO THE RECAP (the `cover` answer): `HubHead` with its
 * slots, nothing new on the page. The line under the name says the party in
 * words: the headline on its own row, then its date and what it made, where
 * the date, her guests and her views stood (the status after it is
 * production's, as today). A cover is the album's for good, so it says the
 * day, never "yesterday", which would go stale on it. The corner holds the
 * three acts where the code stood; in a hand they stand on the cover's foot
 * and the corner is left to the name.
 *
 * ★ WHERE THE CODE WENT: into Share the album, which after the party is
 * production's own Invite door (it opens the code card: the code scannable on
 * its white, Copy link, and the whole kit one press behind, Everything); the
 * key wears the code's glyph to say so. (Wired, the doors' stuck band would
 * need telling: its code chip waits on the cover's code leaving the screen,
 * `headerCodeHidden`, which a cover with none never reports.)
 */
function CoverRecap({ screen }: { screen: Screen }) {
  const desk = screen === "1440";
  return (
    <HubHead
      moment={MORNING}
      line={
        // `contents`: its parts stand in the facts' own wrapping row, the headline on a row of its own.
        <span data-ap-say="" className="contents">
          <span
            data-ap-recap="cover"
            className="ap-recap-cover-made font-heading text-subsection text-white sm:text-page"
          >
            {HEADLINE}
          </span>
          <span>
            <RangeText text={formatEventDate(WEDDING.date, null)} />
          </span>
          <span>{MADE}</span>
        </span>
      }
      corner={desk ? <RecapActs layout="corner" /> : <></>}
      foot={desk ? undefined : <RecapActs layout="foot" />}
    />
  );
}

function hubFor(way: RecapWay, screen: Screen): ReactNode {
  if (way === "hub")
    return <HubScreen screen={screen} moment={MORNING} slot={<RecapPlate />} />;
  if (way === "cover")
    return (
      <HubScreen
        screen={screen}
        moment={MORNING}
        head={<CoverRecap screen={screen} />}
      />
    );
  return <HubScreen screen={screen} moment={MORNING} />;
}

/** The `cover` answer's third frame: Share the album pressed, the code card over her hub (production's, drawn open). */
function CodeOpen({ screen }: { screen: Screen }) {
  return (
    <>
      {hubFor("cover", screen)}
      <CodeCard
        open
        onOpenChange={() => {}}
        who="host"
        eventName={WEDDING.short}
        joinUrl={WEDDING.permanent}
        prettyUrl={readableLink(WEDDING.pretty)}
        qrStyle="classic"
        location="after-party-recap"
      />
    </>
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

export function RecapStory({ way, s }: { way: RecapWay; s: BoardState }) {
  const screen = hostScreen(s);
  const ground = groundIn(s);
  const { w } = SCREENS[screen];
  const desk = screen === "1440";
  return (
    <Story>
      <Scene
        id={`ap-recap-home-${way}-${screen}`}
        w={w}
        h={desk ? 620 : 812}
        ground={ground}
        title="Sunday at 9: her home"
        measure={readHome}
      >
        <Home way={way} />
      </Scene>
      <Scene
        id={`ap-recap-hub-${way}-${screen}`}
        w={w}
        h={desk ? 860 : 812}
        ground={ground}
        title="Sunday at 9: her hub"
        measure={readHub}
      >
        {hubFor(way, screen)}
      </Scene>
      {way === "cover" ? (
        <Scene
          id={`ap-recap-code-${way}-${screen}`}
          w={w}
          h={desk ? 760 : 812}
          ground={ground}
          title="Share the album, pressed: where the code went"
          measure={readCode}
        >
          <CodeOpen screen={screen} />
        </Scene>
      ) : null}
    </Story>
  );
}
