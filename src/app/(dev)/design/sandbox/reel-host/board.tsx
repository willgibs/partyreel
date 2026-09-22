"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { EVENT, LIVE_ALBUM_COUNT } from "./fixtures";
import { AddToAlbumConfirm, AlbumWithCut, ReviewRoom } from "./parts-curation";
import {
  EventCardWithLine,
  PlayingEventCard,
  ThresholdPair,
} from "./parts-dashboard";
import { HubCardsRow, HubHeader } from "./parts-hub";
import { measureReelView, ReelView } from "./parts-reel-view";
import {
  ProfileGuestsCard,
  ReelHeadCard,
  ReelMoodsCard,
  UnrelatedSettingsCards,
} from "./parts-settings";
import { ShareSheetWithScreen } from "./parts-share";
import {
  AppHeader,
  HostGround,
  Scene,
  screenOf,
  SCREENS,
  type ScreenId,
  SheetGround,
} from "./scene";
import { REEL_HOST } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE (`identity-profile` and `guest-capture`'s
 * own discipline, carried here). Every option holds the rest of the picture
 * steady and moves only the one thing its ask is about: `style`'s three vary
 * only where the Style control lives, never the album under it; `pulse`'s
 * three vary only how the dashboard's own card speaks, never which event or
 * how many items it holds unless the ask IS the count.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: a swatch count, a
 * chip's own words, whether a line exists at all. When the words above a
 * frame and the number under it disagree, the number is the truth.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;
const viewportOf = (s: BoardState): ScreenId => screenOf(s.viewport as string);

/* ── style: where the host's Style control lives ─────────────────────────── */

/**
 * `style=both`: the view's own shortcut ABOVE, the sheet still the default's
 * real home BELOW, in one frame, so "both" is a picture rather than a claim.
 *
 * ★ PIXELS, NEVER PERCENTAGES (found live, 2026-09-22, on the same pass as
 * `SheetGround`'s own fix): this frame's own document hands nothing a
 * percentage height down from, so `h-[46%]` of an ancestor that resolves to
 * 0 is 0. `SCREENS[screen].h` is the one number this board actually knows
 * (the Scene it sits in was built at exactly that pixel height), so the
 * split is arithmetic on it rather than CSS asking an ancestor for a cut of
 * a height that was never really there.
 */
function StyleShortcutAndSheet({ screen }: { screen: ScreenId }) {
  const total = SCREENS[screen].h;
  const bar = 32;
  const top = Math.round(total * 0.46);
  return (
    <div className="relative bg-background" style={{ height: total }}>
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: top }}
      >
        <ReelView extra="style" mode="contain" />
      </div>
      <div
        className="absolute inset-x-0 flex items-center border-y border-border bg-muted/50 px-4 text-[11px] font-medium text-muted-foreground"
        style={{ top, height: bar }}
      >
        Also here, still the default&apos;s home
      </div>
      <div
        className="absolute inset-x-0 bottom-0 overflow-y-auto bg-background p-4 text-foreground"
        style={{ top: top + bar }}
      >
        <ReelMoodsCard />
      </div>
    </div>
  );
}

const measureStyleSheet: Reader = (root) => {
  const moods = root.querySelectorAll("[data-rh-mood]").length;
  return moods
    ? `Measured: the settings sheet carries ${moods} mood swatches, no reel view in sight.`
    : "Measured: no mood swatches found in the sheet.";
};

const measureStyleBoth: Reader = (root) => {
  const shortcut = root.querySelector("[data-rh-style-control]");
  const moods = root.querySelectorAll("[data-rh-mood]").length;
  return `Measured: the view carries ${shortcut ? "its own Style shortcut" : "no shortcut"}; the sheet beneath still carries ${moods} mood swatches.`;
};

function styleScene(id: "view" | "sheet" | "both", s: BoardState) {
  const sc = viewportOf(s);
  const title = "Where Style lives";
  if (id === "view") {
    return (
      <Scene id="style-view" screen={sc} title={title} measure={measureReelView}>
        <ReelView extra="style" />
      </Scene>
    );
  }
  if (id === "both") {
    return (
      <Scene id="style-both" screen={sc} title={title} measure={measureStyleBoth}>
        <StyleShortcutAndSheet screen={sc} />
      </Scene>
    );
  }
  return (
    <Scene id="style-sheet" screen={sc} title={title} measure={measureStyleSheet}>
      <SheetGround screen={sc} title="Settings" description={EVENT.name}>
        <UnrelatedSettingsCards />
        <ReelMoodsCard />
      </SheetGround>
    </Scene>
  );
}

/* ── switch: where the "Show the reel" row sits ──────────────────────────── */

const measureSwitchRow: Reader = (root) => {
  const row = root.querySelector<HTMLElement>("[data-rh-reel-row]");
  if (row) {
    const label = row.querySelector("span")?.textContent?.trim();
    return `Measured: a third row, "${label}", joins the guest list switch in one card.`;
  }
  const firstCard = root.querySelector<HTMLElement>(
    '[data-rh-sheet] [data-slot="card"]',
  );
  const heading = firstCard
    ?.querySelector('[data-slot="card-title"]')
    ?.textContent?.trim();
  return heading
    ? `Measured: the sheet's first card reads "${heading}", ahead of Details.`
    : null;
};

function switchScene(id: "guestlist" | "first" | "inview", s: BoardState) {
  const sc = viewportOf(s);
  const title = "The 'Show the reel' row";
  if (id === "inview") {
    return (
      <Scene id="switch-inview" screen={sc} title={title} measure={measureReelView}>
        <ReelView extra="switch" />
      </Scene>
    );
  }
  return (
    <Scene id={`switch-${id}`} screen={sc} title={title} measure={measureSwitchRow}>
      <SheetGround screen={sc} title="Settings" description={EVENT.name}>
        {id === "first" ? (
          <>
            <ReelHeadCard />
            <UnrelatedSettingsCards />
          </>
        ) : (
          <>
            <UnrelatedSettingsCards />
            <ProfileGuestsCard withReelRow />
          </>
        )}
      </SheetGround>
    </Scene>
  );
}

/* ── screen: where "Play on a screen" lives ──────────────────────────────── */

const measureScreenHub: Reader = (root) => {
  const door = root.querySelector<HTMLElement>("[data-rh-screen-door]");
  const label = door?.querySelectorAll("span")[0]?.textContent?.trim();
  return label
    ? `Measured: a fifth door, "${label}", sits beside the four rooms.`
    : "Measured: no screen door found in the cards row.";
};

const measureScreenShare: Reader = (root) => {
  const block = root.querySelector<HTMLElement>("[data-rh-screen-block]");
  const heading = block?.querySelector("h3")?.textContent?.trim();
  return heading
    ? `Measured: a third block, "${heading}", sits under the code and above the readable link.`
    : "Measured: no screen block found in the share sheet.";
};

function screenScene(id: "hub" | "view" | "share", s: BoardState) {
  const sc = viewportOf(s);
  const title = "Where 'Play on a screen' lives";
  if (id === "view") {
    return (
      <Scene id="screen-view" screen={sc} title={title} measure={measureReelView}>
        <ReelView extra="screen" />
      </Scene>
    );
  }
  if (id === "share") {
    return (
      <Scene id="screen-share" screen={sc} title={title} measure={measureScreenShare}>
        <SheetGround screen={sc} title={`Share ${EVENT.name}`}>
          <ShareSheetWithScreen />
        </SheetGround>
      </Scene>
    );
  }
  return (
    <Scene id="screen-hub" screen={sc} title={title} measure={measureScreenHub}>
      <HostGround screen={sc} wide>
        <HubHeader />
        <HubCardsRow withScreenButton />
      </HostGround>
    </Scene>
  );
}

/* ── pulse: the dashboard's line for the reel ────────────────────────────── */

const measurePulseLive: Reader = (root) => {
  const line = root.querySelector<HTMLElement>("[data-rh-reel-line]");
  const words = line?.textContent?.trim().replace(/\s+/g, " ");
  return words
    ? `Measured: the card's own line reads "${words}"`
    : "Measured: no reel line found under the card.";
};

const measurePulseThreshold: Reader = (root) => {
  const lines = root.querySelectorAll("[data-rh-reel-line]").length;
  const cards = root.querySelectorAll("[data-rh-relevant]").length;
  return `Measured: ${lines} of ${cards} cards carry the reel line, the one past three items.`;
};

const measurePulseCover: Reader = (root) => {
  const cover = root.querySelector<HTMLElement>("[data-rh-playing-cover]");
  const frames = cover?.querySelectorAll("img").length ?? 0;
  const line = root.querySelector("[data-rh-reel-line]");
  return cover
    ? `Measured: the cover cycles through ${frames} stills; ${line ? "a line still shows" : "no line, no words"}.`
    : "Measured: no playing cover found.";
};

function pulseScene(id: "live" | "threshold" | "cover", s: BoardState) {
  const sc = viewportOf(s);
  const body =
    id === "live" ? (
      <EventCardWithLine items={LIVE_ALBUM_COUNT} showLine />
    ) : id === "threshold" ? (
      <ThresholdPair />
    ) : (
      <PlayingEventCard />
    );
  const measure =
    id === "live"
      ? measurePulseLive
      : id === "threshold"
        ? measurePulseThreshold
        : measurePulseCover;
  return (
    <Scene id={`pulse-${id}`} screen={sc} title="The dashboard's line" measure={measure}>
      <HostGround screen={sc}>
        <AppHeader label="Dashboard" />
        <div className="space-y-2 px-2 pt-2">
          <p className="text-label font-semibold text-muted-foreground uppercase">
            Your events
          </p>
          {body}
        </div>
      </HostGround>
    </Scene>
  );
}

/* ── cut: a host's own cut, added to the album ───────────────────────────── */

const measureCutMark: Reader = (root) => {
  const chip = root.querySelector<HTMLElement>("[data-rh-cut-chip]");
  return chip
    ? `Measured: the cut's tile wears a "${chip.textContent?.trim()}" mark.`
    : "Measured: the cut's tile carries no mark of its own.";
};

const measureCutConfirm: Reader = (root) => {
  const box = root.querySelector<HTMLElement>("[data-rh-relevant]");
  const words = box?.querySelector("p")?.textContent?.trim();
  return words ? `Measured: the sheet reads "${words}"` : null;
};

function cutScene(id: "marked" | "plain" | "confirm", s: BoardState) {
  const sc = viewportOf(s);
  const title = "A host's own cut, added";
  if (id === "confirm") {
    return (
      <Scene id="cut-confirm" screen={sc} title={title} measure={measureCutConfirm}>
        <AddToAlbumConfirm />
      </Scene>
    );
  }
  return (
    <Scene id={`cut-${id}`} screen={sc} title={title} measure={measureCutMark}>
      <HostGround screen={sc} wide>
        <AlbumWithCut mark={id === "marked"} />
      </HostGround>
    </Scene>
  );
}

/* ── review: the live reel's interplay with a waiting queue ──────────────── */

const measureReviewRoom: Reader = (root) => {
  const note = root.querySelector<HTMLElement>("[data-rh-reel-note]");
  return note
    ? `Measured: the header carries one added line, "${note.textContent?.trim()}"`
    : "Measured: the review room says nothing about the reel.";
};

function reviewScene(id: "viewsays" | "roomsays" | "nothing", s: BoardState) {
  const sc = viewportOf(s);
  const title = "Review's interplay with the reel";
  if (id === "viewsays") {
    return (
      <Scene id="review-viewsays" screen={sc} title={title} measure={measureReelView}>
        <ReelView extra="review" />
      </Scene>
    );
  }
  return (
    <Scene id={`review-${id}`} screen={sc} title={title} measure={measureReviewRoom}>
      <HostGround screen={sc} wide>
        <ReviewRoom withReelNote={id === "roomsays"} />
      </HostGround>
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_HOST> = {
  "style.view": (s) => styleScene("view", s),
  "style.sheet": (s) => styleScene("sheet", s),
  "style.both": (s) => styleScene("both", s),

  "switch.guestlist": (s) => switchScene("guestlist", s),
  "switch.first": (s) => switchScene("first", s),
  "switch.inview": (s) => switchScene("inview", s),

  "screen.hub": (s) => screenScene("hub", s),
  "screen.view": (s) => screenScene("view", s),
  "screen.share": (s) => screenScene("share", s),

  "pulse.live": (s) => pulseScene("live", s),
  "pulse.threshold": (s) => pulseScene("threshold", s),
  "pulse.cover": (s) => pulseScene("cover", s),

  "cut.marked": (s) => cutScene("marked", s),
  "cut.plain": (s) => cutScene("plain", s),
  "cut.confirm": (s) => cutScene("confirm", s),

  "review.viewsays": (s) => reviewScene("viewsays", s),
  "review.roomsays": (s) => reviewScene("roomsays", s),
  "review.nothing": (s) => reviewScene("nothing", s),
};

export function ReelHostBoard() {
  return <ExplorationBoard spec={REEL_HOST} previews={PREVIEWS} />;
}
