"use client";

import type { ReactNode } from "react";

import { keepSentLine } from "@/components/guest/save-account-prompt";
import {
  UploadFailureSheet,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";
import { UPLOAD_WORDS } from "@/lib/upload/uploader";
import "./carry.css";

import { GuestAlbum, SendStack, ToastStill } from "./album";
import { LANDED, type Still, UNSENT, WEDDING } from "./fixtures";
import type { Ground } from "./knobs";
import {
  find,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
  useStillFile,
} from "./scene";
import { WaitPoint } from "./stack";
import type { Carry } from "./words";

/**
 * HOW FAR HER UNSENT PHOTOS ARE CARRIED (the `carry` ask), as a ladder of
 * three: each rung keeps every promise the one below it does, and costs more
 * to build. (Android's background send, a fourth that lands on her phone's
 * answer for every iPhone, is the board's carried call `background`.)
 *
 * ★ EVERY RUNG IS THE SAME TWO MOMENTS, IN THE SAME TWO PLACES, so a flip
 * between two rungs changes one frame: 12:40 am, she comes back to the page
 * still open with the line back (where today's Retry and a page that sends by
 * itself part), and 9:10 am, she opens the album after the page was closed in
 * the night (where a page's keep and her phone's part).
 *
 * ★ NOTHING SENDS IN HER POCKET. An iPhone suspends a page in the background
 * within seconds, so a page that sends by itself sends when she looks at it
 * again (the browser's `online`, or the page coming back to the screen), and
 * the night's first lane says "if she comes back to the open page", never
 * "if it stays open in her pocket" (the creative director's pass).
 *
 * ★ THE ABSENCE IS DRAWN AS PRODUCTION DRAWS IT: an album with nothing of her
 * two in it and nothing saying so (a page that reopens holds no record of what
 * it lost), named in the frame's title and drawn as an empty outline on the
 * night beside it; never a mark production lacks.
 *
 * ★ WHAT TELLS HER IS PRODUCTION'S OWN: today's sheet, which asks for her
 * Retry, or the send's toast (`keepSentLine`'s words) as the send lands, on
 * the page she is looking at.
 *
 * ★ BESIDE THEM, THE NIGHT (`NightStrip`, `carry.css`): a lab drawing, never
 * the product's, of where her two are from the drop to the morning in both of
 * the night's cases, each a line as long as the rung carries them.
 */

/** Her two, landed: newest first at the album's head, over the toast she sent first. */
const ALL_IN = [UNSENT[1]!.still, UNSENT[0]!.still, LANDED.still];

/** The send toast's own words for her two landing (production's `keepSentLine`). */
const LANDED_WORDS = keepSentLine({
  count: UNSENT.length,
  held: false,
  hostName: WEDDING.host.name,
  sent: { kinds: ["photo", "photo"], camera: false },
  nowMs: null,
});

/* ── what the frames read ──────────────────────────────────────────────── */

const readCarry: Reader = (root, win) => {
  const sheet = find(root, "[role='dialog']");
  if (sheet && inView(sheet, win))
    return `today's sheet still over the album: "${textOf(sheet.querySelector("h2")).slice(0, 60)}"`;
  const hers = root.ownerDocument.querySelectorAll("[data-ns-hers]").length;
  const stack = find(root, "[data-ns-stack]");
  const toast = find(root, "[data-ns-toast]");
  return parts(
    `${hers} of hers in the album`,
    stack ? `the stack ${stack.dataset.nsStack}` : "nothing of hers waits",
    toast ? `the toast: "${textOf(toast)}"` : undefined,
  );
};

/** Today's sheet, still standing at 12:40 am over a line that came back: nothing went. */
function StillStanding() {
  const a = useStillFile(UNSENT[0]!.still, UNSENT[0]!.name);
  const b = useStillFile(UNSENT[1]!.still, UNSENT[1]!.name);
  const failures: UploadFailure[] =
    a && b
      ? [a, b].map((file, i) => ({
          id: `q-${i}`,
          file,
          error: UPLOAD_WORDS.dropped,
          cause: "dropped",
        }))
      : [];
  return (
    <UploadFailureSheet
      open={failures.length > 0}
      onOpenChange={() => {}}
      failures={failures}
      sent={3}
      landed={1}
      hostName={WEDDING.host.name}
      onRetry={() => {}}
    />
  );
}

/* ── the night ─────────────────────────────────────────────────────────── */

/** How her two are lit at a stop: in the album, waiting, or held by nothing. */
type Light = "in" | "waiting" | "lost";

/** A place on a lane: the beat it stands at, how her two are lit there, and what is said of it. */
type Stop = {
  /** The beat (`BEATS`): 0 the drop, 1 the page's closing, 2 the line's return, 3 her open in the morning. */
  at: 0 | 1 | 2 | 3;
  light: Light;
  /** Where they are, in a few words; a second track leaves the stops it shares with the first unsaid. */
  word?: string;
  /** At a lane's end: what tells her. */
  told?: string;
};

/** One of the night's two cases, and its line. */
type Lane = { label: string; tracks: readonly (readonly Stop[])[] };

/** The night's beats, as the fixtures time them. */
const BEATS: readonly { at: string; what: string }[] = [
  { at: "11:42 pm", what: "The line drops" },
  { at: "11:58 pm", what: "The page closes" },
  { at: "12:40 am", what: "The line is back" },
  { at: "9:10 am", what: "She opens the album" },
];

// She comes back to it: a page in the background is suspended, so it sends as she looks at it again.
const OPEN = "If she comes back to the open page";
// Swiped away, or cleared by her phone (iOS clears background pages under memory pressure, Android too).
const CLOSED = "If the page closes in the night";

const IN_PAGE: Stop = { at: 0, light: "waiting", word: "In the open page" };
const ON_PHONE: Stop = { at: 0, light: "waiting", word: "Kept on her phone" };
const STILL_KEPT: Stop = { at: 1, light: "waiting", word: "Still kept" };
const LOST: Stop = {
  at: 1,
  light: "lost",
  word: "Lost with the page",
  told: "Nothing says so",
};
const IN_BY_THEMSELVES: Stop = {
  at: 2,
  light: "in",
  word: "In, by themselves",
  told: "The send's toast says so",
};
const IN_AS_SHE_OPENS: Stop = {
  at: 3,
  light: "in",
  word: "In, as she opens it",
  told: "The send's toast says so",
};

/**
 * WHERE HER TWO ARE, RUNG BY RUNG, in both of the night's cases. Each rung's
 * lanes reach at least as far as the rung below's, so the ladder reads as the
 * lines growing: today's page waits for her press and loses them with the page;
 * a page that sends by itself lands them as she comes back at 12:40; her
 * phone's keep carries the closed page to her next open.
 */
const NIGHT: Record<Carry, readonly Lane[]> = {
  retry: [
    {
      label: OPEN,
      tracks: [
        [
          IN_PAGE,
          {
            at: 2,
            light: "waiting",
            word: "Waiting for her Retry",
            told: "Today's sheet asks her",
          },
        ],
      ],
    },
    { label: CLOSED, tracks: [[IN_PAGE, LOST]] },
  ],
  return: [
    { label: OPEN, tracks: [[IN_PAGE, IN_BY_THEMSELVES]] },
    { label: CLOSED, tracks: [[IN_PAGE, LOST]] },
  ],
  phone: [
    { label: OPEN, tracks: [[ON_PHONE, IN_BY_THEMSELVES]] },
    { label: CLOSED, tracks: [[ON_PHONE, STILL_KEPT, IN_AS_SHE_OPENS]] },
  ],
};

/** Her photograph at a lane's end: lit, its hue gone, or only the outline where it was. */
function NightPhoto({ still, light }: { still: Still; light: Light }) {
  return (
    <span className="ns-night-photo" data-light={light}>
      {light === "lost" ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- her photo, as the night holds it
        <img src={still.src} alt="" style={{ objectPosition: still.focus }} />
      )}
    </span>
  );
}

/** One track: a dotted line from stop to stop, the point at each, her two photographs at its end. */
function NightTrack({ stops }: { stops: readonly Stop[] }) {
  const end = stops.length - 1;
  return (
    <div className="ns-night-row ns-night-track">
      {stops.slice(1).map((stop, i) => (
        <span
          key={`path-${stop.at}`}
          aria-hidden
          className="ns-night-path"
          style={{ gridColumn: `${stops[i]!.at + 1} / ${stop.at + 1}` }}
        />
      ))}
      {stops.map((stop, i) => (
        <div
          key={stop.at}
          data-ns-stop={stop.light}
          data-end={i === end ? "" : undefined}
          className="ns-night-stop"
          // The end's words run on to the drawing's edge: nothing stands after it.
          style={{
            gridColumn: i === end ? `${stop.at + 1} / -1` : stop.at + 1,
          }}
        >
          <span className="ns-night-mark">
            <WaitPoint
              lit={stop.light === "in"}
              unlit={stop.light === "lost"}
            />
            {i === end
              ? UNSENT.map((u) => (
                  <NightPhoto key={u.name} still={u.still} light={stop.light} />
                ))
              : null}
          </span>
          {stop.word ? (
            <span className="ns-night-word">{stop.word}</span>
          ) : null}
          {stop.told ? (
            <span className="ns-night-told">{stop.told}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * THE NIGHT, BESIDE THE FRAMES: the beats across, and under them her two
 * photos' way through the night if the page stays open and if it is closed,
 * each line running as far as the rung carries them.
 */
function NightStrip({ carry }: { carry: Carry }) {
  return (
    <figure data-ns-night={carry} className="ns-night">
      <figcaption className="ns-night-title">
        Her two photos, through the night
      </figcaption>
      <div className="ns-night-row">
        {BEATS.map((beat) => (
          <p key={beat.at} className="ns-night-beat">
            <span className="ns-night-time">{beat.at}</span>
            <span className="ns-night-event">{beat.what}</span>
          </p>
        ))}
      </div>
      {NIGHT[carry].map((lane) => (
        <section key={lane.label} className="ns-night-lane">
          <p className="ns-night-label">{lane.label}</p>
          {lane.tracks.map((stops, t) => (
            <NightTrack key={t} stops={stops} />
          ))}
        </section>
      ))}
    </figure>
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

export function CarryStory({
  carry,
  ground,
}: {
  carry: Carry;
  ground: Ground;
}) {
  const id = (k: string) => `ns-carry-${k}-${carry}`;
  /** One moment of the night on her phone, in the frame's slot `k`. */
  const moment = (k: string, title: string, album: ReactNode) => (
    <Scene id={id(k)} ground={ground} title={title} measure={readCarry}>
      {album}
    </Scene>
  );
  /** Her two in, at the album's head, under a toast with these words. */
  const landed = (words: string) => (
    <GuestAlbum
      scroll="head"
      landed={ALL_IN}
      over={<ToastStill title={words} action="Show yours" />}
    />
  );
  /** Her phone sending what it kept as the album opens: production's stack, the first in the air. */
  const sending = (
    <GuestAlbum
      scroll="head"
      head={<SendStack progress={64} remaining={2} />}
      shutter={{ state: "sending", progress: 0.32, count: 2 }}
    />
  );

  // Titles lead with the moment and stay within 40 characters: the stage cuts a frame's title near there at a desk.
  const back =
    carry === "retry"
      ? moment(
          "back",
          "12:40 am · she\u2019s back: waits for Retry",
          <GuestAlbum scroll="head" over={<StillStanding />} />,
        )
      : moment(
          "back",
          "12:40 am · she\u2019s back: in by themselves",
          landed(LANDED_WORDS),
        );
  const morning =
    carry === "phone"
      ? moment("morning", "9:10 am · page closed overnight: sending", sending)
      : moment(
          "morning",
          "9:10 am · page closed overnight: lost",
          <GuestAlbum scroll="head" />,
        );
  return (
    <Story under={<NightStrip carry={carry} />}>
      {back}
      {morning}
    </Story>
  );
}
