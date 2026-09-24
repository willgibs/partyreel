"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  AFTER_FIRST,
  AFTER_TENTH,
  ALBUM,
  MINE,
  TRACKER_ITEMS,
  YOURS_ALBUM_COUNT,
  YOURS_ONLY,
} from "./fixtures";
import {
  AddPhotosRow,
  GuestsSection,
  MomentCard,
  NameStepCard,
  NameToldNotice,
  OfferCaption,
  OfferCard,
  OfferSheet,
  TrackerAccountHeader,
  TrackerButton,
  TrackerInlineStrip,
  TrackerRow,
  TrackerSheet,
} from "./parts";
import { Ground, Header, Scene, screenOf, type ScreenId } from "./scene";
import { GUEST_CAPTURE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE. Every option is Priya's own screen, held at
 * today's shape everywhere but the one thing its decision asks (`media-viewer`'s
 * own rule, carried here): the `moment` options vary only the trigger and the
 * count it counts; the `shape` options vary only how the ask is built; `follow`
 * varies only where the follow of Maya lives; `name` varies what stands where
 * the moment card would be, or adds a toast beside it.
 *
 * ★ EVERY SCENE IS THE WHOLE PAGE IN ITS REAL ORDER: the post-upload slot in
 * the words column, the reel's tile at the album's head, the album, and, where
 * a decision needs it, the Guests list under the album. The follow scenes used
 * to draw the list straight under the moment card, which made "folded into the
 * list" look one scroll away when the real list sits under every photograph.
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
          reelCount={YOURS_ALBUM_COUNT}
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

/* ── shape: how tall the ask stands, and how far down the page it starts ── */

const measureShape: Reader = (root) => {
  const ask = root.querySelector<HTMLElement>("[data-gc-offer]");
  if (!ask) return null;
  // The sheet's own wrapper is the whole viewport; its panel is the ask.
  const panel =
    ask.dataset.gcOffer === "sheet"
      ? (ask.lastElementChild as HTMLElement | null)
      : ask;
  if (!panel) return null;
  const box = panel.getBoundingClientRect();
  const shape = ask.dataset.gcOffer;
  const words = (panel.innerText || "").trim().replace(/\s+/g, " ");
  return `Measured: ${shape} ask, ${Math.round(box.height)}px tall, starting ${Math.round(box.top)}px down, ${words.length} characters of copy before she can act.`;
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
        <Ground
          header="named"
          action={null}
          items={ALBUM}
          caption={{ id: MINE.id, node: <OfferCaption count={1} /> }}
        />
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
          {/* Behind the held door the album's stills sit dimmed, as shipped:
              whether the moving reel should sit there instead is
              `reel-front.door`'s question, and its recommendation is this. */}
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
      <Ground header="named" action={<OfferCard count={1} />} items={ALBUM} />
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
  return `Measured: the nearest real Follow of Maya sits ${dist}px below the top of the moment card.`;
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
      <Ground
        header="confirmed"
        action={<MomentCard count={4} hostFollow={id} />}
        items={ALBUM}
        after={<GuestsSection hostFirst={id === "list"} />}
      />
    </Scene>
  );
}

/* ── name: how many fields stand between confirming and the moment ──────── */

const measureName: Reader = (root) => {
  const fields = root.querySelectorAll("input").length;
  const base = `Measured: ${fields} field${fields === 1 ? "" : "s"} to fill before she reaches the moment card`;
  const notice = root.querySelector<HTMLElement>("[data-gc-name-notice]");
  if (!notice) return `${base}.`;
  const words = (notice.textContent ?? "").trim();
  const card = root.querySelector<HTMLElement>("[data-gc-moment]");
  const overlap = card
    ? Math.round(
        notice.getBoundingClientRect().bottom - card.getBoundingClientRect().top,
      )
    : 0;
  if (overlap > 0)
    return `${base}; a toast reads "${words}", covering the card's own top ${overlap}px while it is up.`;
  return `${base}; a toast reads "${words}".`;
};

function nameScreen(id: "silent" | "confirm" | "told", s: BoardState) {
  const sc = screen(s);
  const content =
    id === "confirm" ? (
      <NameStepCard />
    ) : (
      <MomentCard count={4} hostFollow="card" />
    );
  return (
    <Scene
      id={`name-${id}`}
      screen={sc}
      title="What the name becomes"
      measure={measureName}
    >
      <Ground header="confirmed" action={content} items={ALBUM} />
      {id === "told" && <NameToldNotice />}
    </Scene>
  );
}

/* ── tracker: his own idea, on a MODERATED event (`tracker`) ─────────────── */

/** Whether a sheet opened, and from what: honest either way, never asserted. */
const measureTracker: Reader = (root) => {
  const rows = root.querySelectorAll("[data-gc-tracker-row]").length;
  if (!rows) return null;
  const sheet = root.querySelector('[data-gc-tracker="sheet"]');
  const button = root.querySelector('[data-gc-tracker="button"]');
  if (sheet) {
    return `Measured: ${rows} of her own uploads listed in the open sheet${
      button ? ", opened from a new button beside Add photos" : ""
    }.`;
  }
  return `Measured: ${rows} of her own tiles, each carrying its own status inline, no new surface opened.`;
};

function trackerScreen(id: "button" | "menu" | "inline") {
  if (id === "inline") {
    return (
      <Scene
        id="tracker-inline"
        screen="375"
        title="Her tracker"
        measure={measureTracker}
      >
        <div className="min-h-full bg-background text-foreground">
          <Header state="named" />
          <div className="mx-auto max-w-[640px] pt-5">
            <TrackerInlineStrip />
          </div>
        </div>
      </Scene>
    );
  }
  return (
    <Scene
      id={`tracker-${id}`}
      screen="375"
      title="Her tracker"
      measure={measureTracker}
    >
      <Ground
        header="named"
        action={
          <AddPhotosRow
            tracker={id === "button" ? <TrackerButton /> : undefined}
          />
        }
        items={ALBUM}
      />
      <TrackerSheet
        title={id === "menu" ? "Your photos" : "Your uploads"}
        above={id === "menu" ? <TrackerAccountHeader /> : undefined}
      >
        {TRACKER_ITEMS.map((item) => (
          <TrackerRow key={item.id} item={item} />
        ))}
      </TrackerSheet>
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

  "name.silent": (s) => nameScreen("silent", s),
  "name.confirm": (s) => nameScreen("confirm", s),
  "name.told": (s) => nameScreen("told", s),

  "tracker.button": () => trackerScreen("button"),
  "tracker.menu": () => trackerScreen("menu"),
  "tracker.inline": () => trackerScreen("inline"),
};

export function GuestCaptureBoard() {
  return <ExplorationBoard spec={GUEST_CAPTURE} previews={PREVIEWS} />;
}
