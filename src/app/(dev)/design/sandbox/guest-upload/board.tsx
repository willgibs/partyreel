"use client";

import "./guest-upload.css";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  ALBUM,
  CLIP,
  DOZEN,
  LANDED,
  landedFrom,
  PICKED,
  REFUSALS,
  refusalOf,
} from "./fixtures";
import {
  type BatchShape,
  CountLine,
  type LandingShape,
  OneInFlight,
  ProgressStrip,
  type SendingShape,
  sendingOf,
  StackTile,
} from "./flight";
import {
  failedOf,
  type FailedShape,
  FailureSheet,
  HeldLine,
  type HeldShape,
  mineOf,
  ReasonTile,
  RetryTile,
  StandInTile,
  TermsLine,
  Toast,
  type WarningShape,
  WaitingTile,
  wordSizeOf,
  type WordsShape,
} from "./outcomes";
import {
  FlightTile,
  GuestPage,
  LabMasonry,
  ModerationBanner,
  SCREENS,
  type ScreenId,
  screenOf,
} from "./page-parts";
import { GUEST_UPLOAD } from "./spec";
import {
  IntentSheet,
  OneAdd,
  SplitAdd,
  SystemChooser,
  type TapShape,
  tapOf,
} from "./tap";

/**
 * ★ THE GROUND IS TODAY'S PRODUCT, EXCEPT WHERE A DECISION IS STAGED. Every
 * picture is the shipped page with ONE thing changed, so a decision never
 * arrives quietly wearing the answer to a question he has not been asked: the
 * album's chrome is the shipped column, and the two smallest sentences stay at
 * today's 12px everywhere but on `words` itself, which is the question about
 * them.
 *
 * ★ A STAGED DECISION WEARS ITS PARENT'S ANSWER, AND ITS PARENT'S DEFAULT IS
 * THE RECOMMENDATION. `defineExploration` mirrors each ask as a control whose
 * `default` is the recommended option, and `useBoardState` fills every declared
 * control, so there is no "unanswered" value to read: before he answers
 * `sending`, `batch` is drawn on the sending this board recommends. That is
 * what the staging is for, and it is why `batch`'s own words describe the
 * SHAPE ("every file its own tile") and never the chrome on it, which is the
 * earlier question's to decide.
 */
const TODAY = { words: "xs" } as const;

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the guest page at a real
 * screen, phone first, with this guest's own upload somewhere in it.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. The screen is a knob all
 * eight decisions share and every picture reads it; a decision staged behind
 * another is drawn WEARING that answer. The earlier decisions read the later
 * answers too, so going back redraws them in the world he chose rather than the
 * one the board assumed.
 *
 * ★ THE NUMBERS UNDER EVERY FRAME ARE MEASURED, NEVER COMPUTED. A board once
 * drew an option with its formula's sign backwards and the tile Will judged
 * showed the opposite of its words (docs/PROGRAM.md). So each caption reads the
 * laid-out DOM inside the frame's own document once it settles: how tall a
 * surface really stands, how much of the screen an upload really covers, how
 * big a sentence really is in CSS pixels. If the words above a frame and the
 * caption under it disagree, the caption is the truth.
 */

/* ── the measurement ─────────────────────────────────────────────────────── */

type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document.
 *
 * ★ THE OBSERVER IS THE FRAME'S, NOT THE LAB PAGE'S. The subtree lives in the
 * iframe's document, so it is observed with THAT window's `ResizeObserver`: it
 * fires when the copied stylesheets land (the first layout is unstyled) and
 * again whenever a new option re-flows the page. A hidden option on the stage
 * is `visibility: hidden`, which keeps its layout, so it measures true as well.
 * The late pass covers the two things an observer cannot see: photographs
 * decoding at their natural heights inside columns that never changed width,
 * and the scroll this board takes once the album has a height.
 */
function Probe({
  read,
  onRead,
  children,
}: {
  read: Reader;
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // The latest reader and reporter, refreshed AFTER each commit: writing a ref
  // in the render body is the thing the compiler's rule refuses, and the
  // observer below must not be torn down and rebuilt on every render.
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      const said = latest.current.read(el, win);
      if (said) latest.current.onRead(said);
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    // Two late passes: one after the photographs decode, one after this
    // board's own scroll has settled on the album.
    const late = [900, 1700].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

const pct = (n: number, of: number) => Math.round((n / of) * 100);

/** The type size a sentence really renders at, in CSS pixels. */
const sizeOf = (el: Element | null, win: Window): number | null =>
  el ? Math.round(parseFloat(win.getComputedStyle(el).fontSize)) : null;

/** How much of the screen a set of boxes actually covers. */
function screenShare(els: NodeListOf<HTMLElement>, win: Window): number {
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  let area = 0;
  els.forEach((el) => {
    const b = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(b.right, vw) - Math.max(b.left, 0));
    const h = Math.max(0, Math.min(b.bottom, vh) - Math.max(b.top, 0));
    area += w * h;
  });
  return pct(area, vw * vh);
}

/** How tall the surface standing over the page really is. */
const surfaceRead: Reader = (root, win) => {
  const el = root.querySelector<HTMLElement>("[data-gu-surface]");
  if (!el) {
    const actions = root.querySelector<HTMLElement>("[data-gu-actions]");
    const h = actions ? Math.round(actions.getBoundingClientRect().height) : 0;
    return h > 8
      ? `Measured: nothing over the page, and the action block is ${h} px tall.`
      : null;
  }
  const h = Math.round(el.getBoundingClientRect().height);
  if (h < 8) return null;
  const actions = root.querySelector<HTMLElement>("[data-gu-actions]");
  const a = actions ? Math.round(actions.getBoundingClientRect().height) : 0;
  return `Measured: the surface is ${h} px tall, ${pct(h, win.innerHeight)} percent of the screen, over a ${a} px action block.`;
};

/** One file in the air: what the chrome takes off the photograph. */
const flightRead: Reader = (root, win) => {
  const tile = root.querySelector<HTMLElement>("[data-gu-flight]");
  if (!tile) return null;
  const box = tile.getBoundingClientRect();
  if (box.height < 8) return null;
  const strip = tile.querySelector<HTMLElement>("[data-pending-progress]");
  const foot = strip?.closest<HTMLElement>("div.flex");
  const h = foot ? Math.round(foot.getBoundingClientRect().height) : 0;
  const share = screenShare(
    root.querySelectorAll<HTMLElement>("[data-gu-flight]"),
    win,
  );
  return h > 0
    ? `Measured: the tile is ${Math.round(box.width)} by ${Math.round(box.height)} px and the strip covers its bottom ${h} px, ${pct(h, box.height)} percent of it; ${share} percent of the screen is still uploading.`
    : `Measured: the tile is ${Math.round(box.width)} by ${Math.round(box.height)} px with no chrome on it; ${share} percent of the screen is still uploading.`;
};

/** A dozen at once: what is still going, what is in, and the screen it holds. */
const batchRead: Reader = (root, win) => {
  const going = [...root.querySelectorAll<HTMLElement>("[data-gu-flight]")];
  const inAlbum = [...root.querySelectorAll<HTMLElement>("[data-gu-mine]")];
  if (going.length + inAlbum.length === 0) return null;
  const any = (going[0] ?? inAlbum[0]).getBoundingClientRect();
  if (any.height < 8) return null;
  // The share that matters is the part of the screen given to photographs that
  // are NOT in the album yet, which is the cost the shimmer ruling named.
  const share = screenShare(
    root.querySelectorAll<HTMLElement>("[data-gu-flight]"),
    win,
  );
  const line = root.querySelector<HTMLElement>("[data-gu-countline]");
  const extra = line
    ? `, under a ${Math.round(line.getBoundingClientRect().height)} px line`
    : "";
  const still =
    going.length === 0
      ? "nothing still going"
      : `${going.length} still going, holding ${share} percent of the screen,`;
  return `Measured: ${still} and ${inAlbum.length} of theirs already in the album${extra}.`;
};

/** The mark on the landed photograph, and the album it landed in. */
const landedRead: Reader = (root) => {
  const badge = root.querySelector<HTMLElement>("[data-gu-landed]");
  const tiles = root.querySelectorAll<HTMLElement>("[data-media-tile]");
  if (tiles.length === 0) return null;
  const lefts = new Set<number>();
  tiles.forEach((t) => lefts.add(Math.round(t.getBoundingClientRect().left)));
  const w = Math.round(tiles[0].getBoundingClientRect().width);
  const album = `${lefts.size} columns of ${w} px`;
  if (!badge) return `Measured: no mark at all, in an album of ${album}.`;
  const b = badge.getBoundingClientRect();
  const mark = badge.classList.contains("gu-sweep")
    ? `light across the whole ${Math.round(b.width)} px tile, leaving nothing behind`
    : `a badge of ${Math.round(b.width)} px in the corner, ${pct(b.width * b.height, w * w)} percent of a square tile`;
  return `Measured: ${mark}, in an album of ${album}.`;
};

/** What a guest with something waiting can actually see, and at what size. */
const heldRead: Reader = (root, win) => {
  const banner = root.querySelector<HTMLElement>("[data-gu-banner]");
  const waiting = root.querySelectorAll<HTMLElement>("[data-gu-flight]").length;
  const toast = root.querySelector<HTMLElement>("[data-gu-toast]");
  const size = sizeOf(banner, win);
  if (!banner && !toast && waiting === 0) return null;
  const said = banner
    ? `a ${Math.round(banner.getBoundingClientRect().height)} px banner at ${size} px`
    : "no banner";
  return `Measured: ${waiting === 0 ? "nothing of theirs on the page" : `${waiting} of theirs on the page`}, ${said}${toast ? ", plus a toast that leaves" : ""}.`;
};

/** The failed file: what it says, and how big. */
const failedRead: Reader = (root, win) => {
  const surface = root.querySelector<HTMLElement>("[data-gu-surface]");
  if (surface) {
    const h = Math.round(surface.getBoundingClientRect().height);
    const rows = surface.querySelectorAll("li").length;
    return `Measured: a ${h} px sheet, ${pct(h, win.innerHeight)} percent of the screen, listing ${rows} file${rows === 1 ? "" : "s"}.`;
  }
  const tile = root.querySelector<HTMLElement>("[data-gu-flight]");
  if (!tile) return null;
  const box = tile.getBoundingClientRect();
  if (box.height < 8) return null;
  const said = root.querySelector("[data-gu-said]");
  const size = sizeOf(said, win);
  const dim = Math.round(
    Number(win.getComputedStyle(tile.querySelector("img") ?? tile).opacity) *
      100,
  );
  return `Measured: the photograph at ${dim} percent, its sentence at ${size ?? "no"} px.`;
};

/** The terms, and where the album starts under them. */
const termsRead: Reader = (root, win) => {
  const terms = root.querySelector<HTMLElement>("[data-gu-terms]");
  const tile = root.querySelector<HTMLElement>("[data-media-tile]");
  if (!tile) return null;
  const top = Math.round(tile.getBoundingClientRect().top);
  if (!terms)
    return `Measured: nothing said before the tap; the first tile starts ${top} px down.`;
  const size = sizeOf(terms, win);
  const lines = Math.round(
    terms.getBoundingClientRect().height /
      parseFloat(win.getComputedStyle(terms).lineHeight),
  );
  return `Measured: the terms at ${size} px over ${lines} line${lines === 1 ? "" : "s"}; the first tile starts ${top} px down.`;
};

/** The smallest sentence the upload act puts on the screen. */
const wordsRead: Reader = (root, win) => {
  const said = [...root.querySelectorAll<HTMLElement>("[data-gu-said]")];
  if (said.length === 0) return null;
  const sizes = said
    .map((el) => sizeOf(el, win))
    .filter((n): n is number => n !== null);
  if (sizes.length === 0) return null;
  const banner = root.querySelector<HTMLElement>("[data-gu-banner]");
  return `Measured: ${sizes.length} sentence${sizes.length === 1 ? "" : "s"} on screen, the smallest at ${Math.min(...sizes)} px${banner ? "" : ", and no standing banner"}.`;
};

/* ── the frame ───────────────────────────────────────────────────────────── */

function Screen({
  id,
  screen,
  caption,
  read,
  children,
}: {
  id: string;
  screen: ScreenId;
  caption: string;
  read: Reader;
  children: ReactNode;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const { w, h, name } = SCREENS[screen];
  return (
    <Frame
      id={`gu-${id}-${screen}`}
      w={w}
      h={h}
      title={`${w} x ${h}, ${name}`}
      caption={said ? `${caption} ${said}` : caption}
    >
      <Probe read={read} onRead={setSaid}>
        {children}
      </Probe>
    </Frame>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

/* ── 1. the tap ──────────────────────────────────────────────────────────── */

const TAP_CAPTION: Record<TapShape, string> = {
  os: "Today. Our page hands over and the phone answers, in its own words. Two taps to the camera, two to the library.",
  sheet:
    "Our sheet names both acts in the host's language. Two taps to the camera, three to the library, since the phone's own chooser still opens behind it.",
  split:
    "Two inputs on the page: one carries capture, one does not. One tap to the camera, two to the library, and no sheet of ours at all.",
};

function tapScreen(shape: TapShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`tap-${shape}`}
      screen={screen}
      read={surfaceRead}
      caption={TAP_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length}
        add={shape === "split" ? <SplitAdd /> : <OneAdd />}
        album={<LabMasonry items={ALBUM} />}
        dim={shape !== "split"}
        overlay={
          shape === "os" ? (
            <SystemChooser />
          ) : shape === "sheet" ? (
            <IntentSheet />
          ) : undefined
        }
      />
    </Screen>
  );
}

/* ── 2. one file, flying ─────────────────────────────────────────────────── */

const SENDING_CAPTION: Record<SendingShape, string> = {
  strip:
    "Today. A bar from the first byte, on a file that is usually gone in two seconds.",
  word: "The same bar, saying what it is: one word, at the pill's own 11 px, on the photograph.",
  late: "The tile simply lands. Only a file that is still going after two seconds draws anything.",
};

function sendingScreen(shape: SendingShape, s: BoardState) {
  const screen = screenFor(s);
  const slow = s.file === "video";
  const file = slow ? CLIP : PICKED[0];
  return (
    <Screen
      id={`sending-${shape}`}
      screen={screen}
      read={flightRead}
      caption={SENDING_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length + 1}
        focus="album"
        uploading={1}
        album={
          <LabMasonry
            items={ALBUM}
            lead={
              <OneInFlight
                file={file}
                shape={shape}
                progress={slow ? 18 : 62}
                slow={slow}
              />
            }
          />
        }
      />
    </Screen>
  );
}

/* ── 3. a dozen at once ──────────────────────────────────────────────────── */

const BATCH_CAPTION: Record<BatchShape, string> = {
  each: "Today's shape. Three landed, nine still at the head, each drawn the way you answered one file.",
  one: "One object for one pick, counting down; each photograph leaves it for the album as it lands.",
  line: "Nothing is in flight on the page at all: all twelve are already photographs, under one line.",
};

/** The batch mid-run: three landed, one in the air, eight still queued. */
const DONE = 3;

function batchScreen(shape: BatchShape, s: BoardState) {
  const screen = screenFor(s);
  const sending = sendingOf(s.sending);
  const left = DOZEN.length - DONE;
  // ★ EACH OPTION PUTS A DIFFERENT NUMBER OF PHOTOGRAPHS IN THE ALBUM, and
  // that IS the decision. Today three have landed and nine are still objects at
  // its head; the stack makes those nine one object; the count line claims all
  // twelve at once, which means drawing all twelve as ordinary photographs and
  // nothing in flight at all. Drawing `line` as today's nine plus a line would
  // have made two of the three options the same picture.
  const landed = (shape === "line" ? DOZEN : DOZEN.slice(0, DONE)).map(
    landedFrom,
  );
  const lead =
    shape === "line" ? undefined : shape === "one" ? (
      <StackTile files={DOZEN} done={DONE} sending={sending} />
    ) : (
      DOZEN.slice(DONE).map((file, i) => (
        <FlightTile
          key={file.id}
          file={file}
          foot={
            sending === "late" && i > 0 ? undefined : (
              <ProgressStrip
                progress={i === 0 ? 62 : 0}
                word={sending === "word" ? "Sending" : undefined}
              />
            )
          }
        />
      ))
    );
  return (
    <Screen
      id={`batch-${shape}`}
      screen={screen}
      read={batchRead}
      caption={BATCH_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length + DONE}
        focus="album"
        uploading={left}
        aboveAlbum={
          shape === "line" ? (
            <CountLine total={DOZEN.length} done={DONE} size={TODAY.words} />
          ) : undefined
        }
        album={
          <LabMasonry
            items={[...landed, ...ALBUM]}
            lead={lead}
            mine={new Set(landed.map((m) => m.id))}
          />
        }
      />
    </Screen>
  );
}

/* ── 4. the moment it lands ──────────────────────────────────────────────── */

const LANDING_CAPTION: Record<LandingShape, string> = {
  check:
    "Today. A state colour at the corner, 2.5 s, and then it is simply not there any more.",
  sweep:
    "Drawn mid-pass: live, the light crosses their own tile once in 900 ms and is gone.",
  none: "No private mark: the photograph is in the album, the way everyone else's is.",
};

function landingScreen(shape: LandingShape, s: BoardState) {
  const screen = screenFor(s);
  return (
    <Screen
      id={`landing-${shape}`}
      screen={screen}
      read={landedRead}
      caption={LANDING_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length + 1}
        focus="album"
        album={
          <LabMasonry
            items={[LANDED, ...ALBUM]}
            landedId={LANDED.id}
            landed={shape === "none" ? undefined : shape}
          />
        }
      />
    </Screen>
  );
}

/* ── 5. waiting for the host ─────────────────────────────────────────────── */

const HELD_CAPTION: Record<HeldShape, string> = {
  toast:
    "Today. The photograph is gone and a toast is the only acknowledgement it existed.",
  tile: "Their own photograph waits in place, dimmed under a clock. Nobody else's page shows it.",
  line: "No tile, but the banner finally knows who it is talking to, and clears itself when it is settled.",
};

function heldScreen(shape: HeldShape, s: BoardState) {
  const screen = screenFor(s);
  const mine = mineOf(s.mine);
  const waiting = mine ? 3 : 0;
  return (
    <Screen
      id={`held-${shape}`}
      screen={screen}
      read={heldRead}
      caption={HELD_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length}
        focus="banner"
        banner={
          shape === "line" ? (
            <HeldLine waiting={waiting} words={TODAY.words} />
          ) : (
            <ModerationBanner size={TODAY.words} />
          )
        }
        album={
          <LabMasonry
            items={ALBUM}
            lead={
              shape === "tile" && mine ? (
                <WaitingTile file={PICKED[0]} words={TODAY.words} />
              ) : undefined
            }
          />
        }
        overlay={
          shape === "toast" && mine ? (
            <Toast>Sent, waiting for host approval</Toast>
          ) : undefined
        }
      />
    </Screen>
  );
}

/* ── 6. a file that will not go ──────────────────────────────────────────── */

const FAILED_CAPTION: Record<FailedShape, string> = {
  retry:
    "Today. A good photograph dimmed to 40 percent, the whole tile a button, the reason in a toast.",
  reason:
    "The photograph stays bright; what happened and the one tap that fixes it sit under it.",
  sheet:
    "Nothing interrupted the run. One surface at the end says what did not make it, and why.",
};

/** The two files of the batch that DID go, so the picture shows it carried on. */
const WENT = [PICKED[1], PICKED[3]];

function failedScreen(shape: FailedShape, s: BoardState) {
  const screen = screenFor(s);
  const why = refusalOf(s.why);
  const failed = why === "type" ? PICKED[2] : PICKED[0];
  const went = (
    <>
      {WENT.map((f) => (
        <FlightTile key={f.id} file={f} />
      ))}
    </>
  );
  return (
    <Screen
      id={`failed-${shape}`}
      screen={screen}
      read={failedRead}
      caption={FAILED_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length + WENT.length}
        focus="album"
        dim={shape === "sheet"}
        album={
          <LabMasonry
            items={ALBUM}
            lead={
              <>
                {shape === "retry" && (
                  <RetryTile file={failed} words={TODAY.words} />
                )}
                {shape === "reason" && (
                  <ReasonTile file={failed} why={why} words={TODAY.words} />
                )}
                {went}
              </>
            }
          />
        }
        overlay={
          shape === "sheet" ? (
            <FailureSheet files={[failed]} why={why} />
          ) : shape === "retry" ? (
            <Toast type="error">{REFUSALS[why].said}</Toast>
          ) : undefined
        }
      />
    </Screen>
  );
}

/* ── 7. before they fly ──────────────────────────────────────────────────── */

const WARNING_CAPTION: Record<WarningShape, string> = {
  after:
    "Today. The page says nothing, and the clip uploads as an empty black box.",
  before:
    "The host's own cap, said once at the act. The clip is still a black box.",
  both: "The terms, and the one file nobody can see is named on its own tile.",
};

function warningScreen(shape: WarningShape, s: BoardState) {
  const screen = screenFor(s);
  const tap = tapOf(s.tap);
  // The undrawable clip leads, so the file this decision is about is the first
  // thing in the album at either width.
  const rest = [PICKED[0], PICKED[1], PICKED[3]];
  return (
    <Screen
      id={`warning-${shape}`}
      screen={screen}
      read={termsRead}
      caption={WARNING_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length}
        add={tap === "split" ? <SplitAdd /> : <OneAdd />}
        under={shape === "after" ? undefined : <TermsLine />}
        uploading={4}
        album={
          <LabMasonry
            items={ALBUM}
            lead={
              <>
                {shape === "both" ? (
                  <StandInTile
                    file={PICKED[2]}
                    foot={<ProgressStrip progress={41} />}
                  />
                ) : (
                  <FlightTile
                    file={PICKED[2]}
                    foot={<ProgressStrip progress={41} />}
                  />
                )}
                {rest.map((f) => (
                  <FlightTile
                    key={f.id}
                    file={f}
                    foot={<ProgressStrip progress={0} />}
                  />
                ))}
              </>
            }
          />
        }
      />
    </Screen>
  );
}

/* ── 8. the smallest sentences ───────────────────────────────────────────── */

const WORDS_CAPTION: Record<WordsShape, string> = {
  xs: "Today. The two sentences that decide whether a guest uploads again, at the page's smallest size.",
  read: "The same two sentences at the size the rest of the page is read at, in the same places.",
  tiles:
    "No standing rule above the album: each photograph says its own state, and nothing else speaks.",
};

function wordsScreen(shape: WordsShape, s: BoardState) {
  const screen = screenFor(s);
  const size = wordSizeOf(shape);
  const failed = failedOf(s.failed);
  const why = refusalOf(s.why);
  return (
    <Screen
      id={`words-${shape}`}
      screen={screen}
      read={wordsRead}
      caption={WORDS_CAPTION[shape]}
    >
      <GuestPage
        screen={screen}
        count={ALBUM.length}
        // The banner is the anchor while there IS one; without it the album's
        // head is, so all three options frame the same two tiles rather than
        // one of them showing the top of the page instead.
        focus={shape === "tiles" ? "album" : "banner"}
        banner={
          shape === "tiles" ? undefined : <ModerationBanner size={size} />
        }
        album={
          <LabMasonry
            items={ALBUM}
            lead={
              <>
                <WaitingTile file={PICKED[0]} words={size} />
                {failed === "reason" ? (
                  <ReasonTile file={PICKED[1]} why={why} words={size} />
                ) : (
                  <RetryTile file={PICKED[1]} words={size} />
                )}
              </>
            }
          />
        }
      />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof GUEST_UPLOAD> = {
  "tap.os": (s) => tapScreen("os", s),
  "tap.sheet": (s) => tapScreen("sheet", s),
  "tap.split": (s) => tapScreen("split", s),

  "sending.strip": (s) => sendingScreen("strip", s),
  "sending.word": (s) => sendingScreen("word", s),
  "sending.late": (s) => sendingScreen("late", s),

  "batch.each": (s) => batchScreen("each", s),
  "batch.one": (s) => batchScreen("one", s),
  "batch.line": (s) => batchScreen("line", s),

  "landing.check": (s) => landingScreen("check", s),
  "landing.sweep": (s) => landingScreen("sweep", s),
  "landing.none": (s) => landingScreen("none", s),

  "held.toast": (s) => heldScreen("toast", s),
  "held.tile": (s) => heldScreen("tile", s),
  "held.line": (s) => heldScreen("line", s),

  "failed.retry": (s) => failedScreen("retry", s),
  "failed.reason": (s) => failedScreen("reason", s),
  "failed.sheet": (s) => failedScreen("sheet", s),

  "warning.after": (s) => warningScreen("after", s),
  "warning.before": (s) => warningScreen("before", s),
  "warning.both": (s) => warningScreen("both", s),

  "words.xs": (s) => wordsScreen("xs", s),
  "words.read": (s) => wordsScreen("read", s),
  "words.tiles": (s) => wordsScreen("tiles", s),
};

export function GuestUploadBoard() {
  return <ExplorationBoard spec={GUEST_UPLOAD} previews={PREVIEWS} />;
}
