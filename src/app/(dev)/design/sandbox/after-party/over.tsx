"use client";

import { ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ClosedLine,
  Cover,
  GuestAlbum,
  InviteRound,
  LiveActions,
  ReelRound,
} from "./album";
import { MORNING, WEEK } from "./fixtures";
import { HubHead, HubScreen } from "./hub";
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
 * WHAT TELLS THE ALBUM ITS PARTY IS OVER (the `over` question), drawn as the
 * days run: Maya's hub the morning after, her hub on Wednesday once the
 * photos have stopped, and her guests' cover once she has acted. Each answer
 * draws only what it changes: today nothing offers anything (the switch waits
 * in Settings), the offer stands on her cover once the photos stop, the wrap
 * stands on her cover the morning after.
 */

export type OverWay = "switch" | "offer" | "wrap";

/** The hub's head: the status her cover wears and anything it offers. */
const readHub: Reader = (root, win) => {
  const head = find(root, "[data-ap-hub-head]");
  if (!head) return null;
  const offer = find(root, "[data-ap-offer]");
  const status = find(root, "[data-ap-status]");
  return parts(
    status ? `the cover says "${textOf(status)}"` : "the cover says Live",
    offer && inView(offer, win)
      ? `offers: "${textOf(offer)}"`
      : "offers nothing",
  );
};

/** The guests' cover: what it leads with, and whether Add stands. */
const readCover: Reader = (root, win) => {
  const cover = find(root, "[data-event-head]");
  if (!cover) return null;
  const acts = actsIn(root, win, "[data-ap-acts]");
  const closed = find(root, "[data-ap-closed]");
  const eyebrow = find(root, "[data-ap-eyebrow]");
  return parts(
    eyebrow ? `"${textOf(eyebrow)}" over the name` : undefined,
    acts.length ? `its acts: ${acts.join(", ")}` : "no acts",
    closed && inView(closed, win) ? `under it: "${textOf(closed)}"` : undefined,
  );
};

/** A quiet act on her cover's foot: the photograph's own glass, in a line of its words. */
function CoverOffer({
  line,
  act,
  quiet,
}: {
  line: string;
  act: string;
  quiet?: string;
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/85">
      <span>{line}</span>
      <Button type="button" variant="on-photo" size="sm" tabIndex={-1}>
        {act}
      </Button>
      {quiet ? (
        <Button
          type="button"
          variant="glass"
          size="sm"
          tabIndex={-1}
          className="text-white/85"
        >
          {quiet}
        </Button>
      ) : null}
    </p>
  );
}

/** A status a point and its word (Aperture): the album's phase on her cover. */
function Status({ word, lit = false }: { word: string; lit?: boolean }) {
  return (
    <span
      data-ap-status=""
      className="inline-flex items-center gap-1.5 text-label font-medium text-white uppercase"
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          lit
            ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
            : "bg-white/50",
        )}
      />
      {word}
    </span>
  );
}

/** Her cover the morning after, as each answer draws it. */
function morningHead(way: OverWay) {
  if (way === "wrap")
    return (
      <HubHead
        moment={MORNING}
        offer={
          <CoverOffer
            line="The party's over. 186 photos from 39 guests."
            act="Wrap the party"
          />
        }
      />
    );
  return <HubHead moment={MORNING} />;
}

/** Her cover on Wednesday, the photos stopped, as each answer draws it. */
function wednesdayHead(way: OverWay) {
  if (way === "offer")
    return (
      <HubHead
        moment={WEEK}
        offer={
          <CoverOffer
            line="No new photos since Monday."
            act="Close adding"
            quiet="Keep it open"
          />
        }
      />
    );
  if (way === "wrap")
    return <HubHead moment={WEEK} status={<Status word="Keepsake" />} />;
  return <HubHead moment={WEEK} />;
}

/** Her guests' cover once she has acted (today: once she found the switch). */
function guestsCover(way: OverWay, screen: Screen) {
  if (way === "wrap")
    return (
      <GuestAlbum
        screen={screen}
        moment={WEEK}
        cover={
          <Cover
            screen={screen}
            moment={WEEK}
            eyebrow="The keepsake"
            actions={
              <>
                <Button
                  type="button"
                  variant="on-photo"
                  size="cta"
                  tabIndex={-1}
                  className="min-w-0 flex-1 md:flex-none"
                >
                  Watch the party
                </Button>
                <InviteRound />
              </>
            }
          />
        }
        under={
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            Found more from the day?
            <Button type="button" variant="ghost" size="sm" tabIndex={-1}>
              <ImageUp /> Add yours
            </Button>
          </p>
        }
      />
    );
  if (way === "offer")
    return (
      <GuestAlbum
        screen={screen}
        moment={WEEK}
        cover={
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
        }
        under={<ClosedLine />}
      />
    );
  return (
    <GuestAlbum
      screen={screen}
      moment={WEEK}
      cover={<Cover screen={screen} moment={WEEK} actions={<LiveActions />} />}
    />
  );
}

export function OverStory({ way, screen }: { way: OverWay; screen: Screen }) {
  const { w } = SCREENS[screen];
  const desk = screen === "1440";
  return (
    <Story>
      <Scene
        id={`ap-over-morning-${way}-${screen}`}
        w={w}
        h={desk ? 560 : 640}
        ground="paper"
        title="Sunday, the morning after: her hub"
        measure={readHub}
      >
        <HubScreen screen={screen} moment={MORNING} head={morningHead(way)} />
      </Scene>
      <Scene
        id={`ap-over-wednesday-${way}-${screen}`}
        w={w}
        h={desk ? 560 : 640}
        ground="paper"
        title="Wednesday, the photos have stopped: her hub"
        measure={readHub}
      >
        <HubScreen
          screen={screen}
          moment={WEEK}
          head={wednesdayHead(way)}
          accepting={way !== "offer"}
        />
      </Scene>
      <Scene
        id={`ap-over-guests-${way}`}
        w={375}
        h={720}
        ground="paper"
        title={
          way === "switch"
            ? "Her guests' cover, a week on: still asking for photos"
            : "Her guests' cover, once she has acted"
        }
        measure={readCover}
      >
        {guestsCover(way, "375")}
      </Scene>
    </Story>
  );
}
