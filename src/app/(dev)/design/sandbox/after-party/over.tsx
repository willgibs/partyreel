"use client";

import "./over.css";

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
  QuietAdd,
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
 * phase model, drawn as each answer's own week in the order it happens (three
 * frames of her hub, then her guests' cover a week on), so an answer reads as
 * the days it makes. Each answer draws only what it changes:
 *  - `switch` (today): Sunday and Wednesday offer nothing and her cover keeps
 *    production's Live mark; the third frame is where closing waits,
 *    production's own Settings page (`AddsPage` in the `settings` popup, over
 *    her hub at a desk), its switch still on; her guests still meet Add.
 *  - `offer`: Sunday offers nothing (the photos are still landing). On
 *    Wednesday, two days after the last photo (dated or not, so an undated
 *    party reads the same), a row on her cover's foot, over the strip of what
 *    the party made, offers Close adding or Keep it open; pressed, the row is
 *    its receipt, the cover's status says Keepsake where Live stood, and
 *    production's own consequences follow (the code dims and wears its pause,
 *    Settings' door says Paused); her guests' cover loses Add for today's
 *    closed line.
 *  - `wrap`: the morning after a dated party the same row offers Wrap the
 *    party; pressed, the row is its receipt and the cover's status says
 *    Keepsake; by Wednesday her hub is calm, the keepsake kept and adding
 *    still open (the code bright, nothing asking her), and her guests meet Add
 *    receded to a quiet line.
 *
 * ★ THE WRAP'S WEDNESDAY ASKS NOTHING. It used to keep a quiet row on her
 * cover for good ("Late photos still welcome", Close adding): a row standing
 * where nothing needs her, whose one key argued against the wrap's own point
 * (the late photos still come in), and which made the wrap's Wednesday read
 * like the offer's. Closing stays in Settings, as today; the receipt said
 * what she did, and the Keepsake mark keeps saying it.
 *
 * ★ THE TWO OFFERS ARE DRAWN EQUALLY FINISHED (the creative director's pass):
 * the same row, the same keys, a receipt carrying its way back, and the same
 * status once pressed. Live in production only says the realtime channel is
 * up (`EventLive`), but at a desk it reads as the album's state, so a closed
 * album still wearing it read half-done: either answer, pressed, puts a point
 * and its word in Live's place ("Keepsake", help's own word for a closed
 * album, `share-the-album-after-the-event.mdx`).
 *
 * ★ ONE ROW, ONE PLACE, EVERY STATE (`HubHead`'s `foot`): an offer and its
 * receipt stand in one row across the cover's foot, never in the recap's
 * places (the checklist's place under the light, the cover's line, the code's
 * corner, her home's stage). An offer is words and the photograph's own
 * buttons (`on-photo`, `glass`), never a new light: the cover has its
 * photographs and the hub its Seam. A press turns the row into its receipt in
 * the same place, and the receipt carries the way back (Open it again, Undo),
 * so the offer never has to say it: two lines and its keys on her phone.
 *
 * ★ SUNDAY IS ONE MOMENT WITH THE RECAP (`recap.tsx` draws its Sunday in this
 * question's answer): her Sunday hub (`SundayHub`) and the wrap folded into a
 * recap (`WrapFold`) are exported from here, both on the wrap's one set of
 * words (`WRAP`), so the recap says the wrap in these words and never draws
 * it twice.
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

/** A line as words, or as its phrases (`Phrases`). */
type Line = string | readonly string[];

/**
 * A LINE IN ITS PHRASES: where a line is narrower than its words (a phone), it
 * breaks between two phrases, never inside one ("Close adding?" whole, the
 * wrap at its semicolon); a phrase wider than the line still wraps inside
 * itself. Even lines (`text-wrap: balance`) broke mid-phrase instead.
 */
function Phrases({ line }: { line: Line }) {
  if (typeof line === "string") return <>{line}</>;
  return (
    <>
      {line.map((phrase, i) => (
        <span key={phrase}>
          {i > 0 ? " " : null}
          <span className="inline-block">{phrase}</span>
        </span>
      ))}
    </>
  );
}

/**
 * THE ROW ON HER COVER'S FOOT, over the strip of what the party made: a lead
 * in white, the line in the cover's own quieter white, then the photograph's
 * own buttons. `quiet` is a step softer than an offer (the wrap folded into a
 * recap, which leads with its own white key). `wrap` marks the wrap's row for
 * a reader beside it (the recap's frames say where the wrap stands).
 */
function Foot({
  lead,
  line,
  quiet = false,
  wrap,
  children,
}: {
  lead?: string;
  line: Line;
  quiet?: boolean;
  wrap?: "offer" | "fold";
  children: ReactNode;
}) {
  return (
    <div
      data-ap-wrap={wrap}
      className="flex flex-wrap items-center gap-x-4 gap-y-2.5"
    >
      <p
        data-ap-foot-say=""
        className={cn(
          "min-w-0 text-sm text-pretty",
          quiet ? "text-white/70" : "text-white/85",
        )}
      >
        {lead ? <span className="font-medium text-white">{lead} </span> : null}
        <Phrases line={line} />
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
 * ★ AN OFFER SAYS ITS PRESS IN TWO LINES: why now (the lead), then the act and
 * what her guests will meet; the keys say the act and the way out ("Not yet"
 * answers "The party's over" in its own voice). That it goes back is the
 * receipt's to say, with its key, once she has pressed (Open it again, Undo),
 * never the offer's third line. The offer and the wrap are worded alike so the
 * two read as answers to one question, never as two products.
 */

/** The wrap's words, said once: its offer here and every recap that folds it in (`recap.tsx`) read them. */
const WRAP = {
  /** Why now: the offer's lead (a recap that folds the wrap in leads with its own headline instead). */
  lead: "The party's over.",
  /**
   * Its line in two phrases, so a narrow line breaks at the semicolon
   * (`Phrases`); "a keepsake" never parts where the line runs on after the lead.
   */
  line: [
    "Wrap it, and guests meet a\u00a0keepsake;",
    "late photos still come in.",
  ],
  act: "Wrap the party",
  later: "Not yet",
} as const;

/** `offer`: once the album has been quiet two days, dated or not. */
function CloseOffer({ moment }: { moment: Moment }) {
  return (
    <Foot
      lead="No new photos since Monday."
      line={[
        "Close adding?",
        `Guests can still see and save all ${formatCount(moment.album)}.`,
      ]}
    >
      <Primary>Close adding</Primary>
      <Quiet>Keep it open</Quiet>
    </Foot>
  );
}

/** `offer`, pressed: the row says what it did, and carries the way back. */
function ClosedDone({ moment }: { moment: Moment }) {
  return (
    <Foot
      lead="Adding is closed."
      line={[`Guests can still see and save all ${formatCount(moment.album)}.`]}
    >
      <Quiet>Open it again</Quiet>
    </Foot>
  );
}

/**
 * `wrap`: the morning after a dated party (an undated one wraps from her hub
 * whenever she likes). Its line runs as words after the lead: in phrases, the
 * lead and the first would not share a phone's line, and the offer would take
 * three.
 */
function WrapOffer() {
  return (
    <Foot wrap="offer" lead={WRAP.lead} line={WRAP.line.join(" ")}>
      <Primary>{WRAP.act}</Primary>
      <Quiet>{WRAP.later}</Quiet>
    </Foot>
  );
}

/** `wrap`, pressed: the row says what it did, and carries the way back. */
function WrapDone() {
  return (
    <Foot
      lead="The party's wrapped."
      line={["Guests now meet a keepsake;", "late photos still come in."]}
    >
      <Quiet>Undo</Quiet>
    </Foot>
  );
}

/**
 * THE WRAP FOLDED INTO A RECAP (`recap.tsx`, in this question's `wrap`):
 * Sunday morning is one moment, so where a recap stands, the wrap is its quiet
 * last line rather than a second block beside it saying the party is over. It
 * is the offer's own line and key, without its lead (the recap's headline says
 * the moment) and without Not yet (a recap is put away whole, or stays). On
 * her cover it wears the photograph's glass, a step under the recap's white
 * key; in the room (the hub's plate, her home's stage) a hairline key, a step
 * under the recap's three acts (`over.css`, `.ap-wrap-room`).
 */
export function WrapFold({ on }: { on: "photo" | "room" }) {
  if (on === "photo")
    return (
      <Foot wrap="fold" quiet line={WRAP.line}>
        <Quiet>{WRAP.act}</Quiet>
      </Foot>
    );
  return (
    <div data-ap-wrap="fold" className="ap-wrap-room">
      <p className="min-w-0 text-sm text-pretty text-muted-foreground">
        <Phrases line={WRAP.line} />
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        tabIndex={-1}
        className="shrink-0"
      >
        {WRAP.act}
      </Button>
    </div>
  );
}

/** The album's phase as a status (Aperture: a point and its word), production's Badge where Live stood. */
function KeepsakeMark() {
  return <Badge>Keepsake</Badge>;
}

/* ── the hub's frames ──────────────────────────────────────────────────── */

/**
 * Her hub on Sunday at 9, the morning after, in an answer: only the wrap
 * offers anything (the photos are still landing). The recap's `stage` answer,
 * which leaves her hub to say it, draws this frame as its own.
 */
export function SundayHub({ way, screen }: { way: OverWay; screen: Screen }) {
  return (
    <HubScreen
      screen={screen}
      moment={MORNING}
      head={
        way === "wrap" ? (
          <HubHead moment={MORNING} foot={<WrapOffer />} />
        ) : undefined
      }
    />
  );
}

/** Sunday, once she wraps the party: the receipt, and the keepsake's mark where Live stood. */
function WrappedHub({ screen }: { screen: Screen }) {
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

/** Wednesday, the photos stopped since Monday: the offer asks; the wrap, pressed on Sunday, is kept and calm. */
function WednesdayHub({ way, screen }: { way: OverWay; screen: Screen }) {
  const head =
    way === "offer" ? (
      <HubHead moment={WEEK} foot={<CloseOffer moment={WEEK} />} />
    ) : way === "wrap" ? (
      <HubHead moment={WEEK} status={<KeepsakeMark />} />
    ) : undefined;
  return <HubScreen screen={screen} moment={WEEK} head={head} />;
}

/** Wednesday, once she closes adding: the receipt, the keepsake's mark, the code paused and Settings' door Paused. */
function ClosedHub({ screen }: { screen: Screen }) {
  return (
    <HubScreen
      screen={screen}
      moment={WEEK}
      accepting={false}
      head={
        <HubHead
          moment={WEEK}
          accepting={false}
          status={<KeepsakeMark />}
          foot={<ClosedDone moment={WEEK} />}
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

/** One frame of her hub: its key (the frame's id), its title, what it reads and what it draws. */
type HubFrame = {
  key: string;
  title: string;
  measure: Reader;
  node: ReactNode;
};

/**
 * EACH ANSWER'S DAYS, IN THE ORDER THEY HAPPEN (the creative director's pass:
 * the wrap's frames ran Sunday, Wednesday, Sunday): today's Sunday, Wednesday
 * and where closing waits; the offer's Sunday with nothing yet, its Wednesday
 * offer and the moment she closes; the wrap's Sunday offer, the moment she
 * wraps, and its Wednesday kept.
 */
function hubFrames(way: OverWay, screen: Screen): HubFrame[] {
  const sunday: HubFrame = {
    key: "sunday",
    title: "Sunday, the morning after: her hub",
    measure: readHub,
    node: <SundayHub way={way} screen={screen} />,
  };
  const wednesday: HubFrame = {
    key: "wednesday",
    title: "Wednesday, the photos have stopped: her hub",
    measure: readHub,
    node: <WednesdayHub way={way} screen={screen} />,
  };
  if (way === "switch")
    return [
      sunday,
      wednesday,
      {
        key: "settings",
        title: "Where closing waits: Settings, What guests can add",
        measure: readSettings,
        node: <SettingsAdds screen={screen} />,
      },
    ];
  if (way === "offer")
    return [
      sunday,
      wednesday,
      {
        key: "closed",
        title: "Wednesday, once she closes adding: her hub",
        measure: readHub,
        node: <ClosedHub screen={screen} />,
      },
    ];
  return [
    sunday,
    {
      key: "wrapped",
      title: "Sunday, once she wraps the party: her hub",
      measure: readHub,
      node: <WrappedHub screen={screen} />,
    },
    wednesday,
  ];
}

export function OverStory({ way, s }: { way: OverWay; s: BoardState }) {
  const screen = hostScreen(s);
  const { w } = SCREENS[screen];
  const h = screen === "1440" ? 600 : 700;
  return (
    <Story>
      {hubFrames(way, screen).map((f) => (
        <Scene
          key={f.key}
          id={`ap-over-${f.key}-${way}-${screen}`}
          w={w}
          h={h}
          ground="paper"
          title={f.title}
          measure={f.measure}
        >
          {f.node}
        </Scene>
      ))}
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
