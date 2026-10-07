"use client";

import { Clapperboard, Download, Share } from "lucide-react";
import type { ReactNode } from "react";

import { HomeHead } from "@/components/app/dashboard/home-head";
import { Stage } from "@/components/app/dashboard/stage";
import { Button } from "@/components/ui/button";
import type { HomeContext, HomeEvent } from "@/lib/dashboard/home-event";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { ALBUM, COVER_SIX, MORNING, WEDDING } from "./fixtures";
import { AppBar, HubHead, HubScreen } from "./hub";
import { type Ground, type Screen, SCREENS } from "./knobs";
import {
  actsIn,
  find,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";

/**
 * WHERE MAYA MEETS HER MORNING AFTER (the `recap` question): Sunday at 9, her
 * home (the dashboard's stage, production's `Stage` on the party's facts) and
 * her hub, each as the answer draws it. Today the stage already turns to the
 * party just past ("Yesterday", its numbers, Share the album and Open), and
 * the hub reads as it did at the party; an answer adds the recap where it
 * says, and draws nothing else.
 */

export type RecapWay = "stage" | "hub" | "cover" | "home";

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

/** Sunday morning, on her own clock. */
const SUNDAY: HomeContext = {
  today: "2026-09-13",
  evening: false,
  liveReelEnabled: true,
  storagePct: 12,
};

const STAGE_PHOTOS = COVER_SIX.map((s) => ({ id: s.id, url: s.src }));

/** What her home's stage and her hub offer her: the acts in view, and any recap. */
const readMorning: Reader = (root, win) => {
  const stage = find(root, "[data-stage]");
  const hub = find(root, "[data-ap-hub]");
  if (!stage && !hub) return null;
  const recap = find(root, "[data-ap-recap]");
  const where = stage ? "her home" : "her hub";
  return parts(
    where,
    recap && inView(recap, win)
      ? `the recap: "${textOf(recap).slice(0, 80)}"`
      : "no recap",
    `acts: ${
      actsIn(root, win, stage ? "[data-stage]" : "[data-ap-hub-head]")
        .slice(0, 4)
        .join(", ") || "none"
    }`,
  );
};

/** The three acts of the morning after, one press each. */
function RecapActs({ size = "lg" }: { size?: "lg" | "default" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size={size} tabIndex={-1}>
        <Share /> Share the album
      </Button>
      <Button type="button" variant="secondary" size={size} tabIndex={-1}>
        <Clapperboard /> Make a clip
      </Button>
      <Button type="button" variant="secondary" size={size} tabIndex={-1}>
        <Download /> Download all
      </Button>
    </div>
  );
}

/**
 * THE RECAP PLATE (the `hub` answer): a piece of the room on her page, where
 * the checklist stood, lit by the party's own photographs (one light, the
 * plate's), the party in words and its three acts.
 */
function RecapPlate() {
  return (
    <section
      data-ap-recap="plate"
      aria-label="Your party"
      className="dark relative isolate overflow-hidden rounded-2xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, its light alone */}
        <img
          src={COVER_SIX[0]!.src}
          alt=""
          className="absolute inset-0 size-full scale-150 object-cover opacity-60 blur-3xl saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gallery/60 via-gallery/40 to-gallery/70" />
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-label text-gallery-muted uppercase">Last night</p>
          <h2 className="mt-2 font-heading text-page text-balance text-white">
            Your party made {formatCount(MORNING.album)}
          </h2>
          <p className="mt-1 text-sm text-gallery-muted">
            {`${formatCount(MORNING.photos)} photos and ${formatCount(MORNING.videos)} videos from ${formatCount(MORNING.guests)} guests`}
          </p>
        </div>
        <RecapActs />
      </div>
    </section>
  );
}

/** Her home the morning after: the day's head, then the stage, as the answer draws it. */
function Home({ way, screen }: { way: RecapWay; screen: Screen }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppBar />
      <div className="mx-auto max-w-[1280px] space-y-6 px-3 py-8 sm:px-5">
        <HomeHead
          day="Sunday, September 13"
          line="2 events · Event Pass"
          storage={null}
        />
        {way === "home" ? (
          <HomeRecap screen={screen} />
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
    </div>
  );
}

/** The stage made the recap (the `home` answer): the party's best photographs, its words and its three acts. */
function HomeRecap({ screen }: { screen: Screen }) {
  const desk = screen === "1440";
  const wall = ALBUM.slice(0, desk ? 7 : 3);
  return (
    <section
      data-stage="after"
      data-ap-recap="stage"
      aria-label={WEDDING.name}
      className="dark relative isolate flex flex-col overflow-hidden rounded-2xl bg-gallery text-gallery-foreground ring-1 ring-gallery-border lg:grid lg:h-[clamp(420px,30vw,560px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:justify-between lg:p-10">
        <div>
          <p className="text-label text-gallery-muted uppercase">Yesterday</p>
          <h2 className="mt-2 font-heading text-page text-balance text-white lg:mt-4 lg:text-section">
            Your party made {formatCount(MORNING.album)}
          </h2>
          <p className="mt-1.5 text-sm text-gallery-muted">
            {`${WEDDING.name}, from ${formatCount(MORNING.guests)} guests`}
          </p>
        </div>
        <RecapActs />
      </div>
      <ul
        className={cn(
          "relative order-first grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 lg:order-none lg:aspect-auto",
          desk && "lg:grid-cols-4 lg:grid-rows-2",
        )}
      >
        {wall.map((s, i) => (
          <li
            key={`${s.id}-${i}`}
            className={cn(
              "relative overflow-hidden",
              i === 0 && "col-span-2 row-span-2",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
            <img
              src={s.src}
              alt=""
              className="absolute inset-0 size-full object-cover"
              style={{ objectPosition: s.focus }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The cover turned to the recap (the `cover` answer): the party in words, its corner the three acts. */
function CoverRecap() {
  return (
    <HubHead
      moment={MORNING}
      status={null}
      line={
        <span data-ap-recap="cover">
          {`${formatCount(MORNING.album)} photos and videos from ${formatCount(MORNING.guests)} guests, last night`}
        </span>
      }
      corner={
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <Button type="button" variant="on-photo" size="cta" tabIndex={-1}>
            <Share /> Share the album
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="glass" size="sm" tabIndex={-1}>
              <Clapperboard /> Make a clip
            </Button>
            <Button type="button" variant="glass" size="sm" tabIndex={-1}>
              <Download /> Download all
            </Button>
          </div>
        </div>
      }
    />
  );
}

function hubFor(way: RecapWay, screen: Screen): ReactNode {
  if (way === "hub")
    return <HubScreen screen={screen} moment={MORNING} slot={<RecapPlate />} />;
  if (way === "cover")
    return <HubScreen screen={screen} moment={MORNING} head={<CoverRecap />} />;
  return <HubScreen screen={screen} moment={MORNING} />;
}

export function RecapStory({
  way,
  screen,
  ground,
}: {
  way: RecapWay;
  screen: Screen;
  ground: Ground;
}) {
  const { w } = SCREENS[screen];
  const desk = screen === "1440";
  return (
    <Story>
      <Scene
        id={`ap-recap-home-${way}-${screen}`}
        w={w}
        h={desk ? 760 : 812}
        ground={ground}
        title="Sunday at 9: her home"
        measure={readMorning}
      >
        <Home way={way} screen={screen} />
      </Scene>
      <Scene
        id={`ap-recap-hub-${way}-${screen}`}
        w={w}
        h={desk ? 900 : 812}
        ground={ground}
        title="Sunday at 9: her hub"
        measure={readMorning}
      >
        {hubFor(way, screen)}
      </Scene>
    </Story>
  );
}
