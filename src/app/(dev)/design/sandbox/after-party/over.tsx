"use client";

import "./over.css";

import { ImageUp } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { AddsPage } from "@/components/app/event-settings/adds-page";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import {
  hostEvent,
  NO_COUNTS,
} from "@/components/app/event-settings/testing/host-event";
import type { BoardState } from "@/components/lab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import {
  ClosedLine,
  Cover,
  GuestAlbum,
  InviteRound,
  LiveActions,
  ReelRound,
} from "./album";
import { hostScreen, type OverWay } from "./answers";
import { COVER, type Moment, MORNING, WEDDING, WEEK } from "./fixtures";
import { HubHead, HubScreen } from "./hub";
import { type Screen, SCREENS } from "./knobs";
import {
  actsIn,
  find,
  findAll,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";

/**
 * WHAT TELLS THE ALBUM ITS PARTY IS OVER (the `over` question): the album's
 * phase model, drawn in the same four frames for every answer so they compare
 * like for like. Maya's hub on Sunday, the morning after; her hub on
 * Wednesday, once the photos have stopped; her press and what it changes; and
 * her guests' cover a week on. Each answer draws only what it changes:
 *  - `switch` (today): nothing offers anything on either day and her cover
 *    keeps production's Live mark; the third frame is where closing waits,
 *    production's own Settings page (`AddsPage` in the `settings` popup, over
 *    her hub at a desk), its switch still on; her guests still meet Add.
 *  - `offer`: on Wednesday, two days after the last photo (dated or not, so an
 *    undated party reads the same), a row on her cover's foot, over the strip
 *    of what the party made, offers Close adding or Keep it open; pressed,
 *    production's own consequences (the code dims and wears its pause,
 *    Settings' door says Paused) and her guests' cover loses Add for today's
 *    closed line.
 *  - `wrap`: the morning after a dated party the same row offers Wrap the
 *    party; pressed, the cover's status is a point and its word (production's
 *    Badge, "Keepsake") where Live stood, Add stays open but recedes, and a
 *    quiet Close adding stays hers for later.
 *
 * ★ ONE ROW, ONE PLACE, EVERY STATE (`HubHead`'s `foot`): the offer, its
 * receipt once pressed, and the wrap's quiet remainder all stand in one row
 * across the cover's foot, never in the recap's places (the checklist's place
 * under the light, the cover's line, the code's corner, her home's stage). An
 * offer is words and the photograph's own buttons (`on-photo`, `glass`), never
 * a new light: the cover has its photographs and the hub its Seam. A press
 * turns the row into its receipt in the same place, with the way back, so the
 * act is said out loud and undone where it was done.
 *
 * ★ THE GUESTS' COVER IS TODAY'S, ONLY ADD'S FATE CHANGED (still the hero,
 * gone, or a quiet line under it): what a keepsake leads with is the next
 * question's (`keepsake`), so nothing of it is drawn here.
 *
 * ★ STAND-INS, SAID ONCE: Settings writes nothing (every save answers after a
 * round trip's wait and changes nothing); every other press is inert.
 */

/* ── what the frames read ──────────────────────────────────────────────── */

/** Her hub: the cover's status, what its foot says and offers, the code's corner, and Settings' door. */
const readHub: Reader = (root, win) => {
  const head = find(root, "[data-ap-hub-head]");
  const door = find(root, "[data-hub-door='settings']");
  if (!head || !door) return null;
  const badge = find(root, "[data-ap-hub-facts] [data-slot='badge']");
  const foot = find(root, "[data-ap-foot]");
  const say = find(root, "[data-ap-foot-say]");
  const acts = actsIn(root, win, "[data-ap-foot]");
  const mark = find(root, "[data-code-mark]");
  return parts(
    `the cover says ${badge?.textContent?.trim() || "nothing"}`,
    foot && inView(foot, win)
      ? `its foot: "${textOf(say)}"${acts.length ? ` ${acts.map((a) => `[${a}]`).join(" ")}` : ""}`
      : "its foot offers nothing",
    mark
      ? `the code dimmed, its corner ${mark.getAttribute("data-code-mark")}`
      : "the code bright",
    `the door "${door.getAttribute("aria-label")}"`,
  );
};

/** Settings' page: its title, the uploads switch and where it stands, and whether her hub behind offers anything. */
const readSettings: Reader = (root, win) => {
  const page = find(root, "[data-settings-page]");
  const title = find(root, "[role='dialog'] h2");
  const label = findAll(root, "label").find((l) =>
    textOf(l).startsWith("Accepting uploads"),
  );
  const control = label
    ? root.ownerDocument.getElementById((label as HTMLLabelElement).htmlFor)
    : null;
  if (!page || !title || !control) return null;
  const styles = findAll(root, "[data-album-style]").length;
  const hub = find(root, "[data-ap-hub-head]");
  return parts(
    `Settings, "${textOf(title)}"`,
    `"Accepting uploads" ${control.getAttribute("aria-checked") === "true" ? "on" : "off"}, under ${styles} album styles${inView(control, win) ? "" : ", out of view"}`,
    hub
      ? find(root, "[data-ap-foot]")
        ? "her hub behind offers it"
        : "her hub behind offers nothing"
      : undefined,
  );
};

/** Her guests' cover: whether Add leads, its acts, and the line under it. */
const readCover: Reader = (root, win) => {
  const cover = find(root, "[data-event-head]");
  if (!cover) return null;
  const acts = actsIn(root, win, "[data-ap-acts]");
  if (acts.length === 0) return null;
  const closed = find(root, "[data-ap-closed]");
  const quiet = find(root, "[data-ap-quiet-add]");
  return parts(
    acts[0] === "Add photos" ? "Add photos leads" : "no Add on the cover",
    `its acts: ${acts.join(", ")}`,
    closed && inView(closed, win) ? `under it: "${textOf(closed)}"` : undefined,
    quiet && inView(quiet, win)
      ? `under it, quiet: "${textOf(quiet)}"`
      : undefined,
  );
};

/* ── her cover's foot ──────────────────────────────────────────────────── */

/**
 * THE ROW ON HER COVER'S FOOT, over the strip of what the party made: a lead
 * in white, the line in the cover's own quieter white, then the photograph's
 * own buttons. `quiet` is the wrap's remainder, a step softer than an offer.
 */
function Foot({
  lead,
  line,
  quiet = false,
  children,
}: {
  lead?: string;
  line: string;
  quiet?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <p
        data-ap-foot-say=""
        className={cn(
          "min-w-0 text-sm text-pretty",
          quiet ? "text-white/70" : "text-white/85",
        )}
      >
        {lead ? <span className="font-medium text-white">{lead} </span> : null}
        {line}
      </p>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

/** The white key a photograph wears (`on-photo`): the one act an offer asks for. */
function Primary({ children }: { children: ReactNode }) {
  return (
    <Button type="button" variant="on-photo" size="sm" tabIndex={-1}>
      {children}
    </Button>
  );
}

/** The photograph's glass key: the way out, or the way back. */
function Quiet({ children }: { children: ReactNode }) {
  return (
    <Button type="button" variant="glass" size="sm" tabIndex={-1}>
      {children}
    </Button>
  );
}

/*
 * ★ THE WORDS SAY THE PRESS WHOLE, IN ONE BREATH: why now (the lead), what her
 * guests will meet, that nothing is lost, and that it goes back; the keys say
 * the act and the way out ("Not yet" answers "The party's over" in its own
 * voice). The offer and the wrap are worded alike so the two read as answers to
 * one question, never as two products.
 */

/** `offer`: once the album has been quiet two days, dated or not. */
function CloseOffer({ moment }: { moment: Moment }) {
  return (
    <Foot
      lead="No new photos since Monday."
      line={`Close adding, and guests can still see and save all ${formatCount(moment.album)}. You can open it again any time.`}
    >
      <Primary>Close adding</Primary>
      <Quiet>Keep it open</Quiet>
    </Foot>
  );
}

/** `offer`, pressed: the row says what it did, with the way back. */
function ClosedDone({ moment }: { moment: Moment }) {
  return (
    <Foot
      lead="Adding is closed."
      line={`Guests can still see and save all ${formatCount(moment.album)}.`}
    >
      <Quiet>Open it again</Quiet>
    </Foot>
  );
}

/** `wrap`: the morning after a dated party (an undated one wraps from her hub whenever she likes). */
function WrapOffer() {
  return (
    <Foot
      lead="The party's over."
      line="Wrap it, and guests meet the album as a keepsake, with late photos still welcome. You can undo it any time."
    >
      <Primary>Wrap the party</Primary>
      <Quiet>Not yet</Quiet>
    </Foot>
  );
}

/** `wrap`, pressed: the row says what it did, with the way back. */
function WrapDone() {
  return (
    <Foot
      lead="The party's wrapped."
      line="Guests now meet the keepsake, with late photos still welcome."
    >
      <Quiet>Undo</Quiet>
    </Foot>
  );
}

/** `wrap`, settled: Add open and receded, and closing it hers whenever she likes. */
function WrapQuiet() {
  return (
    <Foot quiet line="Late photos still welcome.">
      <Quiet>Close adding</Quiet>
    </Foot>
  );
}

/** The album's phase as a status (Aperture: a point and its word), production's Badge where Live stood. */
function KeepsakeMark() {
  return <Badge>Keepsake</Badge>;
}

/* ── the hub's frames ──────────────────────────────────────────────────── */

/** Sunday at 9, the morning after: only the wrap offers anything (the photos are still landing). */
function sundayHub(way: OverWay, screen: Screen) {
  return (
    <HubScreen
      screen={screen}
      moment={MORNING}
      head={
        way === "wrap" ? (
          <HubHead moment={MORNING} foot={<WrapOffer />} />
        ) : (
          <HubHead moment={MORNING} />
        )
      }
    />
  );
}

/** Wednesday, the photos stopped since Monday: the offer asks; the wrap, pressed on Sunday, is quiet. */
function wednesdayHub(way: OverWay, screen: Screen) {
  const head =
    way === "offer" ? (
      <HubHead moment={WEEK} foot={<CloseOffer moment={WEEK} />} />
    ) : way === "wrap" ? (
      <HubHead moment={WEEK} status={<KeepsakeMark />} foot={<WrapQuiet />} />
    ) : (
      <HubHead moment={WEEK} />
    );
  return <HubScreen screen={screen} moment={WEEK} head={head} />;
}

/** Her hub the moment she presses: Close adding on Wednesday, Wrap the party on Sunday. */
function pressedHub(way: Exclude<OverWay, "switch">, screen: Screen) {
  if (way === "offer")
    return (
      <HubScreen
        screen={screen}
        moment={WEEK}
        accepting={false}
        head={
          <HubHead
            moment={WEEK}
            accepting={false}
            foot={<ClosedDone moment={WEEK} />}
          />
        }
      />
    );
  return (
    <HubScreen
      screen={screen}
      moment={MORNING}
      head={
        <HubHead
          moment={MORNING}
          status={<KeepsakeMark />}
          foot={<WrapDone />}
        />
      }
    />
  );
}

/* ── where today's switch waits ────────────────────────────────────────── */

const settle = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 320));

/** Settings' writes, inert: each answers after a round trip's wait and changes nothing. */
const INERT: SettingsWrites = {
  updateEvent: async () => settle({ ok: true as const }),
  setDoor: async () =>
    settle({ ok: true as const, emailHeld: false, admitted: 0 }),
  setReel: async (input) =>
    settle({
      ok: true as const,
      defaults: {
        showReel: input.showReel ?? true,
        styleId: input.styleId ?? null,
        holdSec: input.holdSec ?? null,
      },
    }),
  setProfile: async () => settle({ ok: true as const }),
};

/** The wedding as Settings reads it: Public, Live, uploads open, a week on. */
const WEDDING_EVENT = hostEvent({
  name: WEDDING.name,
  event_date: WEDDING.date,
  custom_slug: "maya-and-jay",
});

/**
 * TODAY'S ONE WAY TO CLOSE IT: Settings, What guests can add, as production
 * composes the page (`event-settings-sheet.tsx`): the page's head under its
 * way up, `AddsPage` (the album styles, then Accepting uploads and Videos in
 * their card), and Next. At a desk it is the panel over her hub; in a hand the
 * whole screen.
 */
function SettingsAdds({ screen }: { screen: Screen }) {
  return (
    <>
      {screen === "1440" ? <HubScreen screen={screen} moment={WEEK} /> : null}
      <SettingsProvider
        event={WEDDING_EVENT}
        tier="event_pass"
        counts={{ ...NO_COUNTS, in: WEEK.guests }}
        pendingCount={0}
        social={{ displayInProfile: false, hostHasSlug: true }}
        reelSample={COVER.src}
        writes={INERT}
      >
        <Popup open onOpenChange={() => {}}>
          <PopupContent kind="settings" routed>
            <PopupHeader
              title={SETTINGS_GROUP_TITLES.adds}
              up={{ label: "Settings", onUp: () => {} }}
            >
              <DialogPrimitive.Description className="sr-only">
                {WEDDING.name}
              </DialogPrimitive.Description>
            </PopupHeader>
            <PopupBody className="space-y-6 pb-6" data-settings-page="adds">
              <AddsPage />
              <SettingsNext page="adds" onNext={() => {}} />
            </PopupBody>
          </PopupContent>
        </Popup>
      </SettingsProvider>
    </>
  );
}

/* ── her guests' cover ─────────────────────────────────────────────────── */

/** Add receded (the wrap): one quiet line where today's closed line stands, open for late photos. */
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

/** Her guests' cover a week on: today's, with only Add's fate changed. */
function guestsCover(way: OverWay) {
  const screen: Screen = "375";
  if (way === "switch")
    return (
      <GuestAlbum
        screen={screen}
        moment={WEEK}
        cover={
          <Cover screen={screen} moment={WEEK} actions={<LiveActions />} />
        }
      />
    );
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
      under={way === "offer" ? <ClosedLine /> : <QuietAdd />}
    />
  );
}

/* ── the story ─────────────────────────────────────────────────────────── */

export function OverStory({ way, s }: { way: OverWay; s: BoardState }) {
  const screen = hostScreen(s);
  const { w } = SCREENS[screen];
  const h = screen === "1440" ? 600 : 700;
  return (
    <Story>
      <Scene
        id={`ap-over-sunday-${way}-${screen}`}
        w={w}
        h={h}
        ground="paper"
        title="Sunday, the morning after: her hub"
        measure={readHub}
      >
        {sundayHub(way, screen)}
      </Scene>
      <Scene
        id={`ap-over-wednesday-${way}-${screen}`}
        w={w}
        h={h}
        ground="paper"
        title="Wednesday, the photos have stopped: her hub"
        measure={readHub}
      >
        {wednesdayHub(way, screen)}
      </Scene>
      {way === "switch" ? (
        <Scene
          id={`ap-over-press-${way}-${screen}`}
          w={w}
          h={h}
          ground="paper"
          title="Where closing waits: Settings, What guests can add"
          measure={readSettings}
        >
          <SettingsAdds screen={screen} />
        </Scene>
      ) : (
        <Scene
          id={`ap-over-press-${way}-${screen}`}
          w={w}
          h={h}
          ground="paper"
          title={
            way === "offer"
              ? "Wednesday, once she closes adding: her hub"
              : "Sunday, once she wraps the party: her hub"
          }
          measure={readHub}
        >
          {pressedHub(way, screen)}
        </Scene>
      )}
      <Scene
        id={`ap-over-guests-${way}`}
        w={375}
        h={720}
        ground="paper"
        title="Her guests' cover, a week on"
        measure={readCover}
      >
        {guestsCover(way)}
      </Scene>
    </Story>
  );
}
