"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
} from "@/components/app/create-event-wizard/room";
import { Fit, Frame } from "@/components/lab";
import { Button } from "@/components/ui/button";

import {
  Cover,
  GuestAlbum,
  InviteRound,
  ReelRound,
  StartForFree,
} from "./album";
import { WEDDING, WEEK } from "./fixtures";
import { type Screen, SCREENS } from "./knobs";
import {
  find,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";

/**
 * WHERE A GUEST WHO WANTS HER OWN PARTY IS TAKEN (the `bridge` question):
 * Maya & Jay's album at a phone, signed out, its header and its end, then
 * where the way leads: today the home page itself (the real route, in a
 * frame), else Create's first screen opening in this album's style
 * (production's room: its head, its question, its foot).
 */

export type BridgeWay = "home" | "header" | "end";

/** What the header's corner says, and what stands at the album's end. */
const readWay: Reader = (root, win) => {
  const corner = find(root, "[data-ap-corner]");
  if (!corner) return null;
  const end = find(root, "[data-ap-end]");
  return parts(
    `the corner says "${textOf(corner)}"`,
    end && inView(end, win) ? `the end says "${textOf(end)}"` : undefined,
  );
};

/** Create's first screen: the question and the style it opens in. */
const readCreate: Reader = (root) => {
  const room = find(root, "[data-app-room]");
  if (!room) return null;
  const carried = find(root, "[data-ap-carried]");
  return parts(
    `"${textOf(find(root, "[data-room-heading]"))}"`,
    carried ? `opens ${textOf(carried)}` : "opens unstyled",
  );
};

/** The way's own words in the header's corner. */
const cornerWords = (way: BridgeWay) =>
  way === "home" ? "Start for free" : "Make one like this";

/** The invitation at the album's end (the `end` answer): one quiet line in the album's light. */
function EndLine() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border px-5 py-6 text-center">
      <p className="font-heading text-subsection text-balance">
        Your party next?
      </p>
      <p className="text-sm text-muted-foreground">
        Make an album like this one, in its style. Free for your first party.
      </p>
      <Button type="button" size="sm" tabIndex={-1}>
        Make one like this <ArrowRight />
      </Button>
    </div>
  );
}

/** Create's first screen, in this album's style where the way carries it. */
function CreateFirst({ carried }: { carried: boolean }) {
  return (
    <RoomGround screen="name">
      <RoomHead step={{ at: 1, of: 3 }} close={{ href: "#", label: "Close" }} />
      <RoomPage
        question="Name your event"
        questionId="ap-create-q"
        sub={
          carried ? (
            <span data-ap-carried="">
              In the style of {WEDDING.short}&rsquo;s album: Live, its classic
              code
            </span>
          ) : undefined
        }
      >
        <div className="w-full max-w-[760px] border-b border-foreground/30 pb-2 text-center font-heading text-chapter text-muted-foreground/60">
          Priya&rsquo;s 30th
        </div>
      </RoomPage>
      <RoomFoot>
        <Button type="button" size="lg" tabIndex={-1} className={footButton}>
          Continue
        </Button>
      </RoomFoot>
    </RoomGround>
  );
}

function AlbumAt({
  way,
  screen,
  scroll,
}: {
  way: BridgeWay;
  screen: Screen;
  scroll: "top" | "end";
}): ReactNode {
  return (
    <GuestAlbum
      screen={screen}
      moment={WEEK}
      corner={<StartForFree words={cornerWords(way)} />}
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
      end={way === "end" ? <EndLine /> : undefined}
      scroll={scroll}
      dock={scroll === "end" ? "look" : null}
    />
  );
}

export function BridgeStory({
  way,
  screen,
}: {
  way: BridgeWay;
  screen: Screen;
}) {
  const { w, h } = SCREENS[screen];
  return (
    <Story>
      <Scene
        id={`ap-bridge-top-${way}-${screen}`}
        w={w}
        h={screen === "1440" ? 640 : h}
        ground="paper"
        title="Signed out, the album's top"
        measure={readWay}
      >
        <AlbumAt way={way} screen={screen} scroll="top" />
      </Scene>
      <Scene
        id={`ap-bridge-end-${way}-${screen}`}
        w={w}
        h={screen === "1440" ? 640 : h}
        ground="paper"
        title="The album's end"
        measure={readWay}
      >
        <AlbumAt way={way} screen={screen} scroll="end" />
      </Scene>
      {way === "home" ? (
        <div className="surface-paper">
          <Fit w={w}>
            <Frame
              id={`ap-bridge-lands-home-${screen}`}
              src="/"
              w={w}
              h={screen === "1440" ? 640 : h}
              title="Where Start for free lands: the home page, as it is"
            />
          </Fit>
        </div>
      ) : (
        <Scene
          id={`ap-bridge-lands-${way}-${screen}`}
          w={w}
          h={screen === "1440" ? 640 : h}
          ground="room"
          title="Where it lands: Create, in this album's style"
          measure={readCreate}
        >
          <CreateFirst carried />
        </Scene>
      )}
    </Story>
  );
}
