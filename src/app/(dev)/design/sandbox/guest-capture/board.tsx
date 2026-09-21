"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { AFTER_FIRST, AFTER_TENTH, ALBUM, MINE, YOURS_ONLY } from "./fixtures";
import {
  DashboardLanding,
  GuestsSection,
  MomentCard,
  NameStepCard,
  OfferCard,
  OfferInline,
  OfferSheet,
  ProfileLanding,
} from "./parts";
import {
  AlbumStrip,
  Ground,
  Header,
  Scene,
  screenOf,
  type ScreenId,
} from "./scene";
import { GUEST_CAPTURE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE. Every option is Priya's own screen, held at
 * today's shape everywhere but the one thing its decision asks (`media-viewer`'s
 * own rule, carried here): the `moment` options vary only the trigger and the
 * count it counts; the `shape` options vary only how the ask is built; `follow`
 * varies only where the follow control lives; `landing` varies only which page
 * she is on; `name` varies only what stands where the moment card would be.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED (the same discipline
 * `media-viewer` and `host-curation` hold every number to): a tile count, a
 * pixel distance to the nearest real Follow button, a field count. If the
 * words above a frame and the number under it disagree, the number is the
 * truth.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;
const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

/* ── moment: how many tiles are down, and what the offer says ───────────── */

const measureMoment: Reader = (root) => {
  // Scoped to the strip: the offer card carries `data-media-tile` too (it
  // wants the same arrival fade every real tile gets), so counting the whole
  // root would count the card as one of the photographs it is offering to keep.
  const tiles = root.querySelectorAll(
    "[data-gc-strip] [data-media-tile]",
  ).length;
  const said = root.querySelector("[data-gc-offer] p")?.textContent?.trim();
  if (!said) return null;
  return `Measured: ${tiles} tile${tiles === 1 ? "" : "s"} in the album under an offer reading "${said}".`;
};

function momentScreen(id: "first" | "tenth" | "yours", s: BoardState) {
  const sc = screen(s);
  if (id === "yours") {
    return (
      <Scene
        id="moment-yours"
        screen={sc}
        title="The moment"
        measure={measureMoment}
      >
        <Ground
          header="named"
          action={<OfferCard count={YOURS_ONLY.length} />}
          items={YOURS_ONLY}
          stripHeading={
            <p className="pb-3 text-xs font-medium text-muted-foreground">
              Showing yours &middot; {YOURS_ONLY.length}
            </p>
          }
        />
      </Scene>
    );
  }
  const items = id === "first" ? AFTER_FIRST : AFTER_TENTH;
  const mine = id === "first" ? 1 : 10;
  return (
    <Scene
      id={`moment-${id}`}
      screen={sc}
      title="The moment"
      measure={measureMoment}
    >
      <Ground
        header="named"
        action={<OfferCard count={mine} />}
        items={items}
      />
    </Scene>
  );
}

/* ── shape: how tall the ask stands, and how far from the tile it is about ─ */

const measureShape: Reader = (root) => {
  const ask = root.querySelector<HTMLElement>("[data-gc-offer]");
  if (!ask) return null;
  const box = ask.getBoundingClientRect();
  const shape = ask.dataset.gcOffer;
  const words = (ask.innerText || "").trim().replace(/\s+/g, " ");
  const count = words.length;
  return `Measured: ${shape} ask, ${Math.round(box.height)}px tall, ${count} characters of copy before she can act.`;
};

function shapeScreen(id: "card" | "inline" | "sheet-step", s: BoardState) {
  const sc = screen(s);
  if (id === "inline") {
    return (
      <Scene
        id="shape-inline"
        screen={sc}
        title="The offer's shape"
        measure={measureShape}
      >
        <div className="min-h-full bg-background text-foreground">
          <Header state="named" />
          <div className="mx-auto max-w-[640px] px-4 pt-5">
            <OfferInline count={1} tileUrl={MINE.url} />
          </div>
          <div className="mx-auto max-w-[640px]">
            <AlbumStrip items={ALBUM.slice(1)} />
          </div>
        </div>
      </Scene>
    );
  }
  if (id === "sheet-step") {
    return (
      <Scene
        id="shape-sheet"
        screen={sc}
        title="The offer's shape"
        measure={measureShape}
      >
        <div className="min-h-full bg-background text-foreground">
          <Header state="named" />
          <div className="mx-auto max-w-[640px] px-4 pt-5 opacity-40">
            <div
              className={
                sc === "375"
                  ? "grid grid-cols-2 gap-2"
                  : "grid grid-cols-4 gap-2"
              }
            >
              {ALBUM.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="overflow-hidden bg-black/10"
                  style={{
                    aspectRatio: "4 / 5",
                    borderRadius: "var(--radius-tile)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- stand-in still */}
                  <img src={m.url} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <OfferSheet count={1} />
        </div>
      </Scene>
    );
  }
  return (
    <Scene
      id="shape-card"
      screen={sc}
      title="The offer's shape"
      measure={measureShape}
    >
      <Ground
        header="named"
        action={<OfferCard count={1} />}
        items={ALBUM.slice(1)}
      />
    </Scene>
  );
}

/* ── follow: how far the nearest real Follow button sits from the card ──── */

const measureFollow: Reader = (root) => {
  const card = root.querySelector<HTMLElement>("[data-gc-moment]");
  if (!card) return null;
  const top = card.getBoundingClientRect().top;
  const control =
    root.querySelector<HTMLElement>('[data-gc-follow="card"]') ??
    root.querySelector<HTMLElement>('[data-gc-follow="list"]');
  const button = control?.querySelector("button");
  if (!button) {
    const link = root.querySelector<HTMLElement>("[data-gc-moment] a");
    return link
      ? `Measured: no button at all, a link in the card's own text, ${Math.round(link.getBoundingClientRect().top - top)}px down.`
      : "Measured: no follow control drawn.";
  }
  const dist = Math.round(button.getBoundingClientRect().top - top);
  return `Measured: the nearest real Follow button sits ${dist}px below the top of the moment card.`;
};

function followScreen(id: "card" | "list" | "jump", s: BoardState) {
  const sc = screen(s);
  return (
    <Scene
      id={`follow-${id}`}
      screen={sc}
      title="The follow surface"
      measure={measureFollow}
    >
      <div className="min-h-full bg-background text-foreground">
        <Header state="confirmed" />
        <div className="mx-auto max-w-[640px] px-4 pt-5">
          <MomentCard count={4} hostFollow={id} />
        </div>
        <div className="mx-auto max-w-[640px] px-4 pt-6 pb-8">
          <GuestsSection hostFirst={id === "list"} />
        </div>
      </div>
    </Scene>
  );
}

/* ── landing: which page she is on, said plainly ─────────────────────────── */

const LANDING_CAPTION: Record<"album" | "profile" | "dashboard", string> = {
  album:
    "The album, exactly as she left it: the moment card in the offer's old slot, her own photographs still below it.",
  profile: "/u/priya: a fresh page, one event on it already, marked Guest.",
  dashboard:
    "/dashboard, signed in: the app's own chrome, this event among what she has saved.",
};

function landingScreen(id: "album" | "profile" | "dashboard", s: BoardState) {
  const sc = screen(s);
  if (id === "profile") {
    return (
      <Scene
        id="landing-profile"
        screen={sc}
        title="The landing"
        caption={LANDING_CAPTION.profile}
      >
        <div className="flex min-h-full flex-col bg-background text-foreground">
          <Header state="confirmed" />
          <ProfileLanding />
        </div>
      </Scene>
    );
  }
  if (id === "dashboard") {
    return (
      <Scene
        id="landing-dashboard"
        screen={sc}
        title="The landing"
        caption={LANDING_CAPTION.dashboard}
      >
        <DashboardLanding />
      </Scene>
    );
  }
  return (
    <Scene
      id="landing-album"
      screen={sc}
      title="The landing"
      caption={LANDING_CAPTION.album}
    >
      <Ground
        header="confirmed"
        action={<MomentCard count={4} hostFollow="card" />}
        items={ALBUM}
      />
    </Scene>
  );
}

/* ── name: how many fields stand between confirming and the moment ──────── */

const measureName: Reader = (root) => {
  const fields = root.querySelectorAll("input").length;
  return `Measured: ${fields} field${fields === 1 ? "" : "s"} to fill before she reaches the moment card.`;
};

function nameScreen(id: "silent" | "confirm" | "together", s: BoardState) {
  const sc = screen(s);
  const content =
    id === "silent" ? (
      <MomentCard count={4} hostFollow="card" />
    ) : (
      <NameStepCard mode={id} />
    );
  return (
    <Scene
      id={`name-${id}`}
      screen={sc}
      title="What the name becomes"
      measure={measureName}
    >
      <Ground header="confirmed" action={content} items={ALBUM} />
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof GUEST_CAPTURE> = {
  "moment.first": (s) => momentScreen("first", s),
  "moment.tenth": (s) => momentScreen("tenth", s),
  "moment.yours": (s) => momentScreen("yours", s),

  "shape.card": (s) => shapeScreen("card", s),
  "shape.inline": (s) => shapeScreen("inline", s),
  "shape.sheet-step": (s) => shapeScreen("sheet-step", s),

  "follow.card": (s) => followScreen("card", s),
  "follow.list": (s) => followScreen("list", s),
  "follow.jump": (s) => followScreen("jump", s),

  "landing.album": (s) => landingScreen("album", s),
  "landing.profile": (s) => landingScreen("profile", s),
  "landing.dashboard": (s) => landingScreen("dashboard", s),

  "name.silent": (s) => nameScreen("silent", s),
  "name.confirm": (s) => nameScreen("confirm", s),
  "name.together": (s) => nameScreen("together", s),
};

export function GuestCaptureBoard() {
  return <ExplorationBoard spec={GUEST_CAPTURE} previews={PREVIEWS} />;
}
