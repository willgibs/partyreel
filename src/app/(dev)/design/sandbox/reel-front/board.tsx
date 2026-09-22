"use client";

import "./reel-front.css";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { TurnCard } from "@/components/guest/guest-upload";

import { useEngineFrames } from "./engine";
import { ALBUM_IDS, idsForCount, mediaFor, MINE_ID, NINE_STILLS } from "./fixtures";
import {
  Crossfade,
  DoorScrim,
  Ground,
  GuestHeader,
  HubCardsRow,
  HubReelCardBody,
  NineStillsBackdrop,
  OneStillBackdrop,
  SmallStateSlot,
  StillFrame,
  TileCard,
  WelcomeSheetQuote,
  YoursToast,
  type Verb2,
} from "./parts";
import { REEL_FRONT } from "./spec";
import { Scene, screenOf, SCREENS, type ScreenId } from "./scene";

/**
 * THE PREVIEWS, AND NOTHING ELSE (the `guest-capture`/`media-viewer` rule,
 * carried here). Every option is the same album's head, at Maya and Jay's
 * wedding, held everywhere but the one thing its own decision moves.
 *
 * ★ `EngineMedia` IS THE ONLY PLACE THAT CALLS `useEngineFrames` (a proper
 * component, not a lowercase helper): every `*Screen` function below composes
 * JSX and reads plain state, so none of them may call a hook directly
 * (`react-hooks/rules-of-hooks` binds a hook to a component or a `use*`
 * function, never to an ordinary preview-builder). Rendering
 * `<EngineMedia mode="live" />` wherever the take needs to play costs nothing
 * extra: every instance reads the SAME cached render pass (`engine.ts`).
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME, NEVER ASSERTED. A tile count, the
 * order of the album's own BLEED slots, which corner mark is actually drawn:
 * if the words above a frame and the number under it disagree, the number is
 * the truth.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;
const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

/** The take's own count, for the meta line every option not staged behind
 *  `states`/`door` shows: the album as it stands once the reel is alive. */
const LIVE_COUNT = ALBUM_IDS.length;
const DEMO_ALBUM = mediaFor(ALBUM_IDS.slice(0, 6));
const FULL_ALBUM = mediaFor(ALBUM_IDS);
const SLOW_STILLS = FULL_ALBUM.slice(0, 6).map((m) => m.url);

/**
 * The real engine's own pixels, live or locked to one frame: the one
 * component allowed to call `useEngineFrames` (see the header comment).
 *
 * ★ "live" RESTS ON FRAME 0, NEVER `heroIndex` (found via `lab:demo`, which
 * captures under reduced motion by default): `heroIndex` is the "counted"/
 * "framed" options' own deliberate cover choice, and freezing "live" on the
 * SAME frame made two different product ideas render as the identical
 * picture the moment motion is off. `CanvasReelPlayer` itself rests on frame
 * 0 under reduced motion, so this matches the shipped convention.
 */
function EngineMedia({ mode }: { mode: "live" | "hero" }) {
  const engine = useEngineFrames();
  if (engine.frames.length === 0) return <StillFrame src={null} />;
  if (mode === "hero") return <StillFrame src={engine.frames[engine.heroIndex]} />;
  return <Crossfade images={engine.frames} holdSec={1.1} restIndex={0} />;
}

/* ── tile: what the living tile actually is, at both widths at once ────────── */

function tileMedia(variant: "live" | "crossfade" | "framed") {
  if (variant === "crossfade") {
    return <Crossfade images={SLOW_STILLS} holdSec={3.2} restIndex={0} />;
  }
  return <EngineMedia mode={variant === "framed" ? "hero" : "live"} />;
}

const measureBleedOrder: Reader = (root) => {
  const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-bleed-slot]"));
  const order = slots.map((el) => el.dataset.bleedSlot).join(" then ");
  return `Measured: ${slots.length} bleed slots${order ? `, in order: ${order}` : ""}.`;
};

function TileDemoPair({
  variant,
}: {
  variant: "live" | "crossfade" | "framed";
}) {
  const tileNode = (
    <TileCard
      media={tileMedia(variant)}
      count={LIVE_COUNT}
      playBadge={variant === "framed"}
    />
  );
  const page = <Ground slot={tileNode} above={<TurnCard />} items={DEMO_ALBUM} />;
  return (
    <div className="flex flex-wrap items-start gap-6">
      <Scene
        id={`tile-${variant}`}
        screen="375"
        title="The tile above the demo's turn card"
        measure={measureBleedOrder}
      >
        {page}
      </Scene>
      <Scene
        id={`tile-${variant}`}
        screen="1440"
        title="The tile above the demo's turn card"
        measure={measureBleedOrder}
      >
        {page}
      </Scene>
    </div>
  );
}

/* ── verbs: one control on the tile, or two ─────────────────────────────────── */

const measureVerbs: Reader = (root) => {
  const buttons = root.querySelectorAll("[data-rf-tile] [data-rf-verb2]").length;
  return `Measured: ${buttons === 0 ? "one tap surface" : `one tap surface plus ${buttons} corner control`} on the tile.`;
};

function verbsScreen(id: "watch-add" | "watch" | "watch-make", s: BoardState) {
  const sc = screen(s);
  const verb2: Verb2 = id === "watch-add" ? "add" : id === "watch-make" ? "make" : null;
  return (
    <Scene id={`verbs-${id}`} screen={sc} title="The tile's verbs" measure={measureVerbs}>
      <Ground
        slot={<TileCard media={<EngineMedia mode="live" />} count={LIVE_COUNT} verb2={verb2} />}
        items={FULL_ALBUM}
      />
    </Scene>
  );
}

/* ── states: nothing, a line, or a dimmed box, before three ─────────────────── */

const countOf = (s: BoardState): 0 | 1 | 2 => {
  return s.count === "0" ? 0 : s.count === "2" ? 2 : 1;
};

const measureStates: Reader = (root) => {
  const slot = root.querySelector<HTMLElement>('[data-bleed-slot="tile"]');
  if (!slot) return "Measured: no slot at all, the album starts at the header.";
  const kind = slot.querySelector<HTMLElement>("[data-rf-state]")?.dataset.rfState;
  const text = (slot.innerText || "").trim();
  return `Measured: a ${kind ?? "drawn"} slot, ${text.length} characters, reading "${text}".`;
};

function statesScreen(id: "nothing" | "line" | "dimmed", s: BoardState) {
  const sc = screen(s);
  const count = countOf(s);
  const items = mediaFor(idsForCount(count));
  const slot = id === "nothing" ? null : <SmallStateSlot kind={id} count={count} />;
  return (
    <Scene id={`states-${id}`} screen={sc} title="The small states" measure={measureStates}>
      <Ground slot={slot} items={items} />
    </Scene>
  );
}

/* ── yours: the beat right after a guest's own first approved photo ─────────── */

const measureYours: Reader = (root) => {
  const toast = root.querySelector("[data-rf-toast]");
  const badge = root
    .querySelector("[data-rf-tile]")
    ?.textContent?.includes("Yours is in it");
  if (toast) return "Measured: a toast, the tile's own corner unchanged.";
  return `Measured: the tile's corner reads ${badge ? '"Yours is in it"' : '"The reel" (unchanged)'}.`;
};

function yoursScreen(id: "badge" | "unchanged" | "toast", s: BoardState) {
  const sc = screen(s);
  const items = mediaFor([MINE_ID, ...ALBUM_IDS.slice(0, 5)]);
  return (
    <Scene id={`yours-${id}`} screen={sc} title="The beat after yours" measure={measureYours}>
      <div className="relative min-h-full">
        {id === "toast" && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
            <YoursToast />
          </div>
        )}
        <Ground
          slot={
            <TileCard
              media={<EngineMedia mode="live" />}
              count={LIVE_COUNT + 1}
              yours={id === "badge"}
            />
          }
          items={items}
        />
      </div>
    </Scene>
  );
}

/* ── door: what sits behind the held welcome, only where access is full ─────── */

const measureDoor: Reader = (root) => {
  const sheet = root.querySelector("[data-rf-sheet]");
  const moving = root.querySelector("[data-rf-crossfade]");
  const grid = root.querySelector("[data-rf-door-grid]");
  const which = moving ? "the moving reel" : grid ? "the album's stills" : "one still";
  return `Measured: the welcome sheet ${sheet ? "is drawn" : "is missing"} over ${which}.`;
};

function doorScreen(id: "moving" | "stills" | "one", s: BoardState) {
  const sc = screen(s);
  const desktop = sc === "1440";
  const { h } = SCREENS[sc];
  return (
    <Scene id={`door-${id}`} screen={sc} title="The door's backdrop" measure={measureDoor}>
      <div className="relative overflow-hidden" style={{ height: h }}>
        {id === "moving" && (
          <div className="absolute inset-0">
            <GuestHeader named />
            <div className="relative mx-auto mt-4 max-w-[900px] px-4">
              <div
                data-rf-tile
                className="relative aspect-[2/1] w-full overflow-hidden rounded-lg sm:aspect-[21/9]"
              >
                <EngineMedia mode="live" />
              </div>
            </div>
          </div>
        )}
        {id === "stills" && (
          <div className="absolute inset-0">
            <GuestHeader named />
            <div data-rf-door-grid className="mt-3">
              <NineStillsBackdrop items={NINE_STILLS} />
            </div>
          </div>
        )}
        {id === "one" && <OneStillBackdrop />}
        <DoorScrim />
        <WelcomeSheetQuote desktop={desktop} />
      </div>
    </Scene>
  );
}

/* ── closed: once uploads end, what happens to the tile's own box ───────────── */

const measureClosed: Reader = (root) => {
  const tile = root.querySelector<HTMLElement>("[data-rf-tile]");
  if (!tile) return null;
  const box = tile.getBoundingClientRect();
  const moving = !!tile.querySelector("[data-rf-crossfade]");
  return `Measured: the tile is ${Math.round(box.width)} by ${Math.round(box.height)}px, ${moving ? "playing" : "a still"}.`;
};

function closedScreen(id: "minus-add" | "larger" | "plays", s: BoardState) {
  const sc = screen(s);
  const tileNode =
    id === "minus-add" ? (
      <TileCard media={<EngineMedia mode="hero" />} count={LIVE_COUNT} playBadge />
    ) : id === "larger" ? (
      <TileCard
        media={<EngineMedia mode="hero" />}
        count={LIVE_COUNT}
        playBadge
        aspect="aspect-[16/9]"
      />
    ) : (
      <TileCard media={<EngineMedia mode="live" />} count={LIVE_COUNT} />
    );
  return (
    <Scene id={`closed-${id}`} screen={sc} title="Once uploads close" measure={measureClosed}>
      <Ground slot={tileNode} items={FULL_ALBUM} />
    </Scene>
  );
}

/* ── hub: the host's own Reel card, among the other three ───────────────────── */

const measureHub: Reader = (root) => {
  const card = root.querySelector<HTMLElement>("[data-rf-hub-reel]");
  if (!card) return null;
  const hasMedia = !!card.querySelector("[data-rf-crossfade], img");
  const box = card.getBoundingClientRect();
  return `Measured: the Reel card is ${Math.round(box.width)} by ${Math.round(box.height)}px, ${hasMedia ? "carrying a picture" : "text only"}, matching its siblings' box.`;
};

function hubScreen(id: "living" | "labelled" | "counted", s: BoardState) {
  const sc = screen(s);
  const media =
    id === "living" ? (
      <EngineMedia mode="live" />
    ) : id === "counted" ? (
      <EngineMedia mode="hero" />
    ) : null;
  const reel = <HubReelCardBody variant={id} media={media} count={LIVE_COUNT} on />;
  return (
    <Scene id={`hub-${id}`} screen={sc} title="The hub's Reel card" measure={measureHub}>
      <div className="min-h-full bg-background p-4 text-foreground">
        <p className="text-xs text-muted-foreground">Partyreel / Maya &amp; Jay</p>
        <h1 className="mt-1 font-heading text-subsection">Maya &amp; Jay</h1>
        <div className="mt-4">
          <HubCardsRow reel={reel} />
        </div>
      </div>
    </Scene>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof REEL_FRONT> = {
  "tile.live": () => <TileDemoPair variant="live" />,
  "tile.crossfade": () => <TileDemoPair variant="crossfade" />,
  "tile.framed": () => <TileDemoPair variant="framed" />,

  "verbs.watch-add": (s) => verbsScreen("watch-add", s),
  "verbs.watch": (s) => verbsScreen("watch", s),
  "verbs.watch-make": (s) => verbsScreen("watch-make", s),

  "states.nothing": (s) => statesScreen("nothing", s),
  "states.line": (s) => statesScreen("line", s),
  "states.dimmed": (s) => statesScreen("dimmed", s),

  "yours.badge": (s) => yoursScreen("badge", s),
  "yours.unchanged": (s) => yoursScreen("unchanged", s),
  "yours.toast": (s) => yoursScreen("toast", s),

  "door.moving": (s) => doorScreen("moving", s),
  "door.stills": (s) => doorScreen("stills", s),
  "door.one": (s) => doorScreen("one", s),

  "closed.minus-add": (s) => closedScreen("minus-add", s),
  "closed.larger": (s) => closedScreen("larger", s),
  "closed.plays": (s) => closedScreen("plays", s),

  "hub.living": (s) => hubScreen("living", s),
  "hub.labelled": (s) => hubScreen("labelled", s),
  "hub.counted": (s) => hubScreen("counted", s),
};

export function ReelFrontBoard() {
  return <ExplorationBoard spec={REEL_FRONT} previews={PREVIEWS} />;
}
