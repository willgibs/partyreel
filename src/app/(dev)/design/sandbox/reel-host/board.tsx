"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { EVENT, LIVE_ALBUM_COUNT, MINIMUM, WAITING } from "./fixtures";
import { AS_WIRED, BellPanelAgree, PhoneDashboard } from "./parts-counts";
import {
  AddToAlbumConfirm,
  AlbumWithCut,
  PhoneReviewRoom,
} from "./parts-curation";
import { Dashboard, type PulseOption } from "./parts-dashboard";
import { ReelRoom, ReelSheetBody } from "./parts-home";
import {
  Hub,
  ProgressBand,
  ReelCard,
  ReelHomeCard,
  ScreenDoor,
  ScreenLinkRow,
  StepRow,
  WaitingTile,
} from "./parts-hub";
import { Tv } from "./parts-screen";
import {
  ProfileGuestsCard,
  ReelDefaultsCard,
  ReelHeadCard,
  UnrelatedSettingsCards,
} from "./parts-settings";
import { ShareSheetWithScreen } from "./parts-share";
import { type Device, HostView, measureView } from "./parts-view";
import {
  Composite,
  Scene,
  SCREENS,
  type ScreenId,
  screenOf,
  SheetGround,
} from "./scene";
import { REEL_HOST } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE. Every option holds the rest of the picture
 * steady and moves only the one thing its ask is about: the progression's five
 * vary only how the page speaks below the minimum, never the event; the screen
 * door's five vary only where the door sits, never the view it opens.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED: which words the page
 * says, how many icons the dock carries, what the screen says beside the code.
 * When the words above a frame and the caption under it disagree, the caption
 * is the truth.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;
const viewportOf = (s: BoardState): ScreenId => screenOf(s.viewport as string);
const deviceOf = (sc: ScreenId): Device => (sc === "375" ? "phone" : "laptop");
const itemsOf = (s: BoardState): number => {
  const n = Number(s.items ?? "1");
  return Number.isFinite(n) ? Math.max(0, Math.min(MINIMUM, n)) : 1;
};

/** The visible words of an element, whitespace folded, cut for a caption. */
const said = (el: Element | null | undefined, max = 90): string => {
  const t = ((el as HTMLElement | null)?.innerText ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 3)}...` : t;
};

/** The host's event page, which every sheet on this board really opens over. */
const hubBehind = (device: Device) => (
  <Hub device={device} items={LIVE_ALBUM_COUNT} />
);

/* ── progress: the way to the reel ───────────────────────────────────────── */

type ProgressId = "card" | "band" | "tile" | "step" | "preview";

const measureProgress: Reader = (root) => {
  const face = root.querySelector<HTMLElement>("[data-rh-reel-card]")?.dataset
    .rhReelCard;
  const lines = [...root.querySelectorAll("[data-rh-said]")]
    .map((el) => said(el, 70))
    .filter(Boolean);
  const card =
    face === "living"
      ? "the Reel card wears the living crossfade"
      : face === "counting"
        ? "the Reel card counts"
        : face === "preview"
          ? "the Reel card is the host's alone until the minimum"
          : 'the Reel card says "Not yet"';
  return lines.length
    ? `Measured: the page says "${lines.join(" / ")}"; ${card}.`
    : `Measured: nothing on the page speaks of the reel; ${card}.`;
};

function progressScene(id: ProgressId, s: BoardState) {
  const sc = viewportOf(s);
  const device = deviceOf(sc);
  const items = itemsOf(s);
  const below = items < MINIMUM;
  return (
    <Scene
      id={`progress-${id}-${items}`}
      screen={sc}
      title="The way to the reel"
      measure={measureProgress}
    >
      <Hub
        device={device}
        items={items}
        reel={
          (id === "card" || id === "preview") && below ? (
            <ReelCard
              device={device}
              face={id === "card" ? "counting" : "preview"}
              items={items}
            />
          ) : undefined
        }
        above={
          id === "band" ? (
            <ProgressBand device={device} items={items} />
          ) : id === "step" && items === 1 ? (
            <StepRow />
          ) : undefined
        }
        head={id === "tile" && items === 1 ? <WaitingTile /> : undefined}
        launchWithReel={id === "step" && items === 0}
      />
    </Scene>
  );
}

/* ── home: what the Reel card opens ──────────────────────────────────────── */

type HomeId = "view" | "room" | "sheet";

const measureHome: Reader = (root) => {
  if (root.querySelector("[data-rh-view]")) {
    const view = measureView(root)?.replace(/^Measured: /, "") ?? "";
    return `Measured: the card opens the full-screen view; ${view}`;
  }
  const rows = [...root.querySelectorAll("[data-rh-home-row]")].map((el) =>
    said(el, 24),
  );
  const where = root.querySelector("[data-rh-room]")
    ? "a room with a crumb"
    : root.querySelector("[data-rh-reel-sheet]")
      ? "a sheet over the album"
      : null;
  return where
    ? `Measured: the card opens ${where}: the reel playing, Watch and Play on a screen, then ${rows.join(", ")}.`
    : null;
};

function homeScene(id: HomeId, s: BoardState) {
  const sc = viewportOf(s);
  const device = deviceOf(sc);
  const body =
    id === "view" ? (
      <div data-rh-open-view="">
        <HostView device={device} dock="up" extra="screen" />
      </div>
    ) : id === "room" ? (
      <ReelRoom device={device} />
    ) : (
      <SheetGround
        screen={sc}
        title="Reel"
        description={EVENT.name}
        behind={hubBehind(device)}
      >
        <ReelSheetBody />
      </SheetGround>
    );
  return (
    <Scene
      id={`home-${id}`}
      screen={sc}
      title="What the Reel card opens"
      measure={measureHome}
    >
      {body}
    </Scene>
  );
}

/* ── open: where the door to a big screen sits ───────────────────────────── */

type OpenId = "view" | "hub" | "share" | "settings" | "send";

const measureOpen: Reader = (root) => {
  if (root.querySelector("[data-rh-view]")) return measureView(root);
  const door = root.querySelector("[data-rh-screen-door]");
  const link = root.querySelector("[data-rh-send-link] .tabular-nums");
  if (door) {
    // In a hand the row scrolls sideways, and a fifth card starts past its edge.
    const edge = root.ownerDocument.documentElement.clientWidth;
    const past = door.getBoundingClientRect().left >= edge - 8;
    return `Measured: a fifth door in the cards row, "${said(door, 40)}"${past ? ", past the row's edge on a phone" : ""}${link ? `, and a link to send under the row, "${said(link, 48)}"` : ""}.`;
  }
  const block = root.querySelector("[data-rh-screen-block] h3");
  if (block)
    return `Measured: a block in the share sheet, "${said(block)}", between the code's verbs and the readable link.`;
  const row = root.querySelector("[data-rh-screen-row]");
  if (row)
    return `Measured: a row in the reel's own Settings card, "${said(row.querySelector("p"))}", under Show the reel.`;
  return null;
};

function openScene(id: OpenId, s: BoardState) {
  const sc = viewportOf(s);
  const device = deviceOf(sc);
  const title = "Onto a big screen";
  const body =
    id === "view" ? (
      <div data-rh-open-view="">
        <HostView device={device} dock="up" extra="screen" />
      </div>
    ) : id === "share" ? (
      <SheetGround
        screen={sc}
        title={`Share ${EVENT.name}`}
        behind={hubBehind(device)}
      >
        <ShareSheetWithScreen />
      </SheetGround>
    ) : id === "settings" ? (
      <SheetGround
        screen={sc}
        title="Settings"
        description={EVENT.name}
        behind={hubBehind(device)}
      >
        <ReelHeadCard withScreenRow />
        <UnrelatedSettingsCards />
      </SheetGround>
    ) : (
      <Hub
        device={device}
        items={LIVE_ALBUM_COUNT}
        door={<ScreenDoor device={device} />}
        below={id === "send" ? <ScreenLinkRow /> : undefined}
      />
    );
  return (
    <Scene id={`open-${id}`} screen={sc} title={title} measure={measureOpen}>
      {body}
    </Scene>
  );
}

/* ── review: what tells the host about a waiting queue ───────────────────── */

type ReviewId =
  | "wired"
  | "agree"
  | "card"
  | "header"
  | "feed"
  | "chip"
  | "room";

const PHONE_LABEL: Record<ReviewId, string> = {
  wired: "Mia's phone: the hub, its counts as wired",
  agree: "Mia's phone: the bell, open",
  card: "Mia's phone: the dashboard",
  header: "Mia's phone: Review",
  feed: "Mia's phone: her own view of the reel",
  chip: "Mia's phone: the hub, as wired",
  room: "Mia's phone: the hub, as wired",
};

const measureReview: Reader = (root) => {
  const tv = root.querySelector("[data-rh-tv-said]");
  const phone = root.querySelector("[data-rh-phone]");
  if (!phone) return null;
  const screen = tv
    ? `the screen says "${said(tv, 50)}" beside the code`
    : "the screen says nothing but the code";
  const line = phone.querySelector("[data-rh-said]");
  const host = phone.querySelector("[data-rh-dashboard]")
    ? `the phone's one count is the event card's chip, "${WAITING} to review", and the bell has no badge`
    : line
      ? `the phone says "${said(line, 60)}"`
      : `the phone carries the bell's ${WAITING} and Review's "${WAITING} waiting"; as wired the bell says "${AS_WIRED?.body ?? ""}" and lands on the dashboard`;
  return `Measured: ${screen}; ${host}.`;
};

function reviewScene(id: ReviewId) {
  const hubAsWired = (
    <Hub
      device="phone"
      items={LIVE_ALBUM_COUNT}
      waiting={WAITING}
      bell={WAITING}
    />
  );
  const phone =
    id === "agree" ? (
      <Hub
        device="phone"
        items={LIVE_ALBUM_COUNT}
        waiting={WAITING}
        bell={WAITING}
        bellPanel={<BellPanelAgree />}
      />
    ) : id === "card" ? (
      <PhoneDashboard />
    ) : id === "header" ? (
      <PhoneReviewRoom />
    ) : id === "feed" ? (
      <HostView device="phone" dock="rest" feed="waiting" mode="contain" />
    ) : (
      hubAsWired
    );
  return (
    <Composite
      id={`review-${id}`}
      title="Waiting uploads"
      measure={measureReview}
      screenLabel="The big screen, drawn at half a 1920 wall"
      phoneLabel={PHONE_LABEL[id]}
      screen={
        <Tv
          says={id === "chip" ? "chip" : id === "room" ? "room" : "nothing"}
        />
      }
      phone={phone}
    />
  );
}

/* ── style: where the reel's defaults live ───────────────────────────────── */

type StyleId = "view" | "sheet" | "both";

const measureStyle: Reader = (root) => {
  const view = root.querySelector("[data-rh-style-popover]");
  const card = root.querySelector("[data-rh-defaults]");
  const line = said(root.querySelector("[data-rh-default-line]"), 80);
  const moods = root.querySelectorAll(
    "[data-rh-defaults] [data-rh-mood]",
  ).length;
  const steps = root.querySelector<HTMLElement>("[data-rh-hold-steps]")?.dataset
    .rhHoldSteps;
  const parts = [
    view ? `the view's Style popover says "${line}"` : null,
    card
      ? `a Settings card carries ${moods} moods and ${steps} hold steps`
      : null,
  ].filter(Boolean);
  return parts.length ? `Measured: ${parts.join("; ")}.` : null;
};

/**
 * `style=both`: the view with the host's popover and the Settings card in one
 * frame, so "both" is a picture rather than a claim. At a laptop the sheet is
 * where it really opens, a panel on the right; in a hand the two stack.
 *
 * ★ PIXELS, NEVER PERCENTAGES: this frame's own document hands nothing a
 * percentage height down from, so every split is arithmetic on the frame's
 * known size.
 */
function StyleBoth({ screen }: { screen: ScreenId }) {
  const { w, h } = SCREENS[screen];
  if (screen === "1440") {
    const panel = 384;
    return (
      <div className="relative bg-background" style={{ width: w, height: h }}>
        <div className="absolute inset-y-0 left-0" style={{ width: w - panel }}>
          <HostView
            device="laptop"
            dock="up"
            popover="style-both"
            mode="contain"
          />
        </div>
        <div
          className="absolute inset-y-0 right-0 flex flex-col gap-3 overflow-hidden border-l border-border bg-popover p-4 text-popover-foreground"
          style={{ width: panel }}
        >
          <p className="font-heading text-card-title font-medium">Settings</p>
          <ReelDefaultsCard />
        </div>
      </div>
    );
  }
  const top = Math.round(h * 0.56);
  return (
    <div className="relative bg-background" style={{ width: w, height: h }}>
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: top }}
      >
        <HostView
          device="phone"
          dock="up"
          popover="style-both"
          mode="contain"
        />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden bg-background p-3 text-foreground"
        style={{ top }}
      >
        <ReelDefaultsCard />
      </div>
    </div>
  );
}

function styleScene(id: StyleId, s: BoardState) {
  const sc = viewportOf(s);
  const device = deviceOf(sc);
  const title = "The reel's defaults";
  const body =
    id === "view" ? (
      <HostView device={device} dock="up" popover="style-view" />
    ) : id === "sheet" ? (
      <SheetGround
        screen={sc}
        title="Settings"
        description={EVENT.name}
        behind={hubBehind(device)}
      >
        <ReelDefaultsCard />
        <UnrelatedSettingsCards />
      </SheetGround>
    ) : (
      <StyleBoth screen={sc} />
    );
  return (
    <Scene id={`style-${id}`} screen={sc} title={title} measure={measureStyle}>
      {body}
    </Scene>
  );
}

/* ── switch: where "Show the reel" sits ──────────────────────────────────── */

type SwitchId = "guestlist" | "first" | "inview" | "card";

const measureSwitch: Reader = (root) => {
  if (root.querySelector("[data-rh-host-switch]"))
    return "Measured: a host-only Show the reel switch closes the dock's top row; Settings carries no row.";
  if (root.querySelector("[data-rh-reel-home]"))
    return "Measured: the reel's own card above the album holds the switch beside its living thumbnail.";
  if (root.querySelector("[data-rh-reel-row]"))
    return "Measured: a third row, Show the reel, joins the guest list switch in one card.";
  const first = root.querySelector('[data-rh-sheet] [data-slot="card-title"]');
  return first
    ? `Measured: the sheet's first card reads "${said(first)}", ahead of Details.`
    : null;
};

function switchScene(id: SwitchId, s: BoardState) {
  const sc = viewportOf(s);
  const device = deviceOf(sc);
  const title = "Show the reel";
  const body =
    id === "inview" ? (
      <HostView device={device} dock="up" extra="switch" />
    ) : id === "card" ? (
      <Hub
        device={device}
        items={LIVE_ALBUM_COUNT}
        above={<ReelHomeCard device={device} />}
      />
    ) : (
      <SheetGround
        screen={sc}
        title="Settings"
        description={EVENT.name}
        behind={hubBehind(device)}
      >
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
    );
  return (
    <Scene
      id={`switch-${id}`}
      screen={sc}
      title={title}
      measure={measureSwitch}
    >
      {body}
    </Scene>
  );
}

/* ── pulse: the dashboard's word on the reel ─────────────────────────────── */

const measurePulse: Reader = (root) => {
  const chips = [...root.querySelectorAll("[data-rh-band] li")].map((l) =>
    said(l, 70),
  );
  const reelChip = chips.find((c) => /reel/i.test(c));
  const lines = [...root.querySelectorAll("[data-rh-reel-line]")].map((l) =>
    said(l),
  );
  const moving = root.querySelector("[data-rh-playing-cover]");
  const parts = [
    reelChip ? `the band says "${reelChip}"` : "the band carries no reel step",
    lines.length
      ? `the cards say "${lines.join(" / ")}"`
      : "no card carries a line",
    moving ? "the live event's cover crossfades" : "every cover holds still",
  ];
  return `Measured: ${parts.join("; ")}.`;
};

function pulseScene(id: PulseOption, s: BoardState) {
  const sc = viewportOf(s);
  return (
    <Scene
      id={`pulse-${id}`}
      screen={sc}
      title="The dashboard's word"
      measure={measurePulse}
    >
      <Dashboard option={id} device={deviceOf(sc)} />
    </Scene>
  );
}

/* ── cut: a host's own cut, added to the album ───────────────────────────── */

const measureCutMark: Reader = (root) => {
  const chip = root.querySelector("[data-rh-cut-chip]");
  return chip
    ? `Measured: the cut's tile wears a "${said(chip)}" mark.`
    : "Measured: the cut's tile carries no mark of its own.";
};

const measureCutConfirm: Reader = (root) => {
  const box = root.querySelector("[data-rh-relevant]");
  const words = said(box?.querySelector("p"), 120);
  return words ? `Measured: the sheet reads "${words}"` : null;
};

function cutScene(id: "marked" | "plain" | "confirm", s: BoardState) {
  const sc = viewportOf(s);
  const title = "A host's own cut, added";
  if (id === "confirm") {
    return (
      <Scene
        id="cut-confirm"
        screen={sc}
        title={title}
        measure={measureCutConfirm}
      >
        <AddToAlbumConfirm />
      </Scene>
    );
  }
  return (
    <Scene id={`cut-${id}`} screen={sc} title={title} measure={measureCutMark}>
      <div className="min-h-full bg-background py-2 text-foreground">
        <AlbumWithCut mark={id === "marked"} />
      </div>
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_HOST> = {
  "progress.card": (s) => progressScene("card", s),
  "progress.band": (s) => progressScene("band", s),
  "progress.tile": (s) => progressScene("tile", s),
  "progress.step": (s) => progressScene("step", s),
  "progress.preview": (s) => progressScene("preview", s),

  "home.view": (s) => homeScene("view", s),
  "home.room": (s) => homeScene("room", s),
  "home.sheet": (s) => homeScene("sheet", s),

  "open.view": (s) => openScene("view", s),
  "open.hub": (s) => openScene("hub", s),
  "open.share": (s) => openScene("share", s),
  "open.settings": (s) => openScene("settings", s),
  "open.send": (s) => openScene("send", s),

  "review.wired": () => reviewScene("wired"),
  "review.agree": () => reviewScene("agree"),
  "review.card": () => reviewScene("card"),
  "review.header": () => reviewScene("header"),
  "review.feed": () => reviewScene("feed"),
  "review.chip": () => reviewScene("chip"),
  "review.room": () => reviewScene("room"),

  "style.view": (s) => styleScene("view", s),
  "style.sheet": (s) => styleScene("sheet", s),
  "style.both": (s) => styleScene("both", s),

  "switch.guestlist": (s) => switchScene("guestlist", s),
  "switch.first": (s) => switchScene("first", s),
  "switch.inview": (s) => switchScene("inview", s),
  "switch.card": (s) => switchScene("card", s),

  "pulse.counts": (s) => pulseScene("counts", s),
  "pulse.threshold": (s) => pulseScene("threshold", s),
  "pulse.cover": (s) => pulseScene("cover", s),
  "pulse.band": (s) => pulseScene("band", s),
  "pulse.quiet": (s) => pulseScene("quiet", s),

  "cut.marked": (s) => cutScene("marked", s),
  "cut.plain": (s) => cutScene("plain", s),
  "cut.confirm": (s) => cutScene("confirm", s),
};

export function ReelHostBoard() {
  return <ExplorationBoard spec={REEL_HOST} previews={PREVIEWS} />;
}
