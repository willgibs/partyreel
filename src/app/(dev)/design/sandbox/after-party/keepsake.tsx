"use client";

import { Download, ImageUp, Play } from "lucide-react";

import type { BoardState } from "@/components/lab";
import { Button } from "@/components/ui/button";
import { formatCount, formatMediaCount } from "@/lib/format/count";

import {
  ClosedLine,
  Cover,
  GuestAlbum,
  HerName,
  InviteRound,
  ReelRound,
  StartForFree,
} from "./album";
import { groundIn, guestScreen, type KeepsakeWay, overIn } from "./answers";
import { HERS, PRIYA, WEEK } from "./fixtures";
import { type Screen, SCREENS } from "./knobs";
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
 * WHAT LEADS WHEN A GUEST COMES BACK (the `keepsake` question), drawn in the
 * `over` answer: where the party is over by her closing adding, Add is gone;
 * where she wrapped it, Add recedes to a quiet line and stays. Three frames:
 * Priya's first screen a week on, scrolled into the album, and a newcomer by
 * a forwarded link who added nothing (no "Yours", Start for free in the
 * corner).
 */

/** What the cover leads with, where Add stands, and what she is offered of her own. */
const readKeepsake: Reader = (root, win) => {
  const cover = find(root, "[data-event-head]");
  if (!cover) return null;
  const acts = actsIn(root, win, "[data-ap-acts]");
  const closed = find(root, "[data-ap-closed]");
  const quiet = find(root, "[data-ap-quiet-add]");
  const hers = find(root, "[data-ap-hers]");
  const still = cover.getAttribute("data-ap-cover") === "still";
  return parts(
    still ? "the cover still" : "the cover dissolving",
    acts.length ? `leads with ${acts[0]}` : "no acts",
    hers && inView(hers, win) ? `hers: "${textOf(hers)}"` : undefined,
    closed && inView(closed, win) ? "the closed line under it" : undefined,
    quiet && inView(quiet, win) ? `Add as "${textOf(quiet)}"` : undefined,
  );
};

/** The quiet Add a wrapped album keeps: open for late photos, never the cover's hero. */
function QuietAdd() {
  return (
    <p
      data-ap-quiet-add=""
      className="mt-5 flex items-center justify-center gap-1 text-sm text-muted-foreground"
    >
      Found more from the day?
      <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
        <ImageUp /> Add yours
      </Button>
    </p>
  );
}

/** Her nine, as a strip under the byline: the Yours lens's own photographs. */
function HerStrip() {
  return (
    <div data-ap-hers="" className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {HERS.slice(0, 5).map((s) => (
          // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph
          <img
            key={s.id}
            src={s.src}
            alt=""
            className="size-9 rounded-md object-cover ring-2 ring-black/40"
            style={{ objectPosition: s.focus }}
          />
        ))}
      </div>
      <span className="text-sm text-white/85">
        Yours · {formatCount(PRIYA.added)}
      </span>
    </div>
  );
}

/** The cover each answer draws, for Priya (`hers`) or a newcomer. */
function coverFor(way: KeepsakeWay, screen: Screen, newcomer: boolean) {
  if (way === "reel")
    return (
      <Cover
        screen={screen}
        moment={WEEK}
        actions={
          <>
            <Button
              type="button"
              variant="on-photo"
              size="cta"
              tabIndex={-1}
              className="min-w-0 flex-1 md:flex-none"
            >
              <Play className="fill-current" /> Watch the party
            </Button>
            <Button type="button" variant="glass" size="cta" tabIndex={-1}>
              <Download /> Take them home
            </Button>
          </>
        }
      />
    );
  if (way === "hers")
    return (
      <Cover
        screen={screen}
        moment={WEEK}
        beneath={newcomer ? undefined : <HerStrip />}
        actions={
          <>
            {newcomer ? null : (
              <Button
                type="button"
                variant="on-photo"
                size="cta"
                tabIndex={-1}
                className="min-w-0 flex-1 md:flex-none"
              >
                <Download /> Take yours home
              </Button>
            )}
            <ReelRound />
            <InviteRound />
          </>
        }
      />
    );
  if (way === "still")
    return (
      <Cover
        screen={screen}
        moment={WEEK}
        still
        beneath={
          <p className="text-sm text-white/85">
            {`${formatMediaCount(WEEK.album).replace("&", "and")} from ${formatCount(WEEK.guests)} guests`}
          </p>
        }
        actions={
          <>
            <ReelRound />
            <InviteRound />
          </>
        }
      />
    );
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

export function KeepsakeStory({ way, s }: { way: KeepsakeWay; s: BoardState }) {
  const over = overIn(s);
  const screen = guestScreen(s);
  const ground = groundIn(s);
  const { w, h } = SCREENS[screen];
  // Today's closed album is today's, whatever the first answer; every other cover wears its Add as that answer leaves it.
  const wrapped = over === "wrap" && way !== "closed";
  const under =
    way === "closed" || !wrapped ? (
      way === "closed" ? (
        <ClosedLine />
      ) : null
    ) : (
      <QuietAdd />
    );
  const frames = [
    {
      key: "top",
      title: "Priya's first screen, a week on",
      newcomer: false,
      scroll: "top" as const,
    },
    {
      key: "album",
      title: "Scrolled into the album",
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
      {frames.map((f) => (
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
            scroll={f.scroll}
            dock={f.scroll === "top" ? null : wrapped ? "add" : "look"}
          />
        </Scene>
      ))}
    </Story>
  );
}
