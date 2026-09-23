"use client";

import "./event-safety.css";

import type { ReactNode } from "react";
import { Clock, MailX, UserCheck, UsersRound, X } from "lucide-react";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  BlockSheet,
  BlockToast,
  InlineConfirm,
  UnblockDialog,
} from "./block";
import {
  BLOCKED,
  DOM,
  DOM_UPLOADS,
  EVENT,
  GUESTS,
  GUESTS_AFTER,
  HIDDEN_IDS,
  HOST,
  INVITED,
  INVITED_TOTAL,
  LISTED,
  NEWCOMERS,
  OPEN_ITEM,
  OPEN_POSITION,
  PASTED,
  PASTED_BAD,
  PASTED_FOUND,
  type Person,
  RICK,
  RICK_UPLOADS,
  UNLISTED,
  WAITING,
} from "./fixtures";
import {
  CLOSED,
  DeadLink,
  DoorStep,
  type DoorWords,
  EndedNotice,
  GuestTop,
  HeldDoor,
  InStep,
  LockedScreen,
  QuietWay,
  RefusedSheet,
  WaitingMark,
} from "./guest";
import {
  BlockedRow,
  BlockedSection,
  Credit,
  DoorQueue,
  Face,
  GuestRow,
  GuestsRoom,
  GuestsRoomToday,
  HiddenNotice,
  Hub,
  hubCards,
  HostViewer,
  NewcomerRow,
  PersonMenu,
  ReviewRoom,
  RoomSection,
  SwitchRow,
} from "./host";
import {
  doorLines,
  reach,
  type Reader,
  Scene,
  screenOf,
  type ScreenId,
  Several,
} from "./scene";
import {
  AccessCard,
  JoinChoice,
  type JoinId,
  needsVerified,
  OpenRow,
  ScrollHere,
  SettingsSheet,
  UploadsCard,
} from "./settings";
import { EVENT_SAFETY } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the host's or the guest's
 * real surface at a real viewport with the one thing it proposes drawn in.
 * The screen knob every decision shares lives in `scene.tsx`; a staged
 * decision reads the answer it waits on off the board's own state (`entry`
 * before the block and the blocked list, `choose` before the three closed
 * doors' settings, `door` before the two other doors), wearing its parent's
 * recommendation until he answers, the kit's own rule.
 */

/* ── reading the board's state ────────────────────────────────────────────── */

const pick = <T extends string>(all: readonly T[], v: unknown, fallback: T): T =>
  all.includes(v as T) ? (v as T) : fallback;

const screen = (s: BoardState): ScreenId => screenOf(s.screen as string);

type Entry = "credit" | "guests" | "review" | "all";
const entryOf = (s: BoardState): Entry =>
  pick(["credit", "guests", "review", "all"] as const, s.entry, "all");

type DoorForm = "private" | "held" | "gone";
const doorOf = (s: BoardState): DoorForm =>
  pick(["private", "held", "gone"] as const, s.door, "private");

type ChooseForm = "choice" | "switches" | "door";
const chooseOf = (s: BoardState): ChooseForm =>
  pick(["choice", "switches", "door"] as const, s.choose, "choice");

type BlockedPlace = "foot" | "settings" | "tab";
const blockedOf = (s: BoardState): BlockedPlace =>
  pick(["foot", "settings", "tab"] as const, s.blocked, "foot");

/** The person a block is judged on, and the party that person belongs to. */
function who(s: BoardState) {
  const typed = s.person === "typed";
  const person: Person = typed ? RICK : DOM;
  const uploads = typed ? RICK_UPLOADS : DOM_UPLOADS;
  const item = typed ? { ...RICK_UPLOADS[1], likeCount: 0 } : OPEN_ITEM;
  const position = typed ? "12 of 44" : OPEN_POSITION;
  const people = GUESTS.map((p) => (p.id === DOM.id ? person : p));
  return { typed, person, uploads, item, position, people };
}

/**
 * The viewer's menu pinned over the pill stack, opening up from the credit and
 * over the action pill (a menu opened from a trigger covers what stands above
 * it). The credit is a line shorter without a confirmed address under the
 * name, so the menu sits a line lower for a typed name.
 */
const overCredit = (person: Person) =>
  ({
    position: "fixed",
    left: "50%",
    bottom: person.email ? "3.9rem" : "2.9rem",
    width: "17rem",
    translate: "-50% 0",
  }) as const;

/* ── decision 1: where Block lives ────────────────────────────────────────── */

function InViewer({ scr }: { scr: ScreenId }) {
  return (
    <HostViewer
      screen={scr}
      item={OPEN_ITEM}
      position={OPEN_POSITION}
      credit={<Credit item={OPEN_ITEM} position={OPEN_POSITION} pressed />}
      menu={<PersonMenu person={DOM} style={overCredit(DOM)} />}
    />
  );
}

function InRoom({ scr }: { scr: ScreenId }) {
  return (
    <GuestsRoom
      screen={scr}
      people={GUESTS}
      menuFor={DOM.id}
      menu={<PersonMenu person={DOM} />}
    />
  );
}

function InReview({ scr }: { scr: ScreenId }) {
  return (
    <ReviewRoom
      screen={scr}
      gone={HIDDEN_IDS}
      notice={<HiddenNotice screen={scr} person={DOM} sent={DOM_UPLOADS} />}
    />
  );
}

const ENTRY_TITLE = {
  credit: "Block on the credit, in the viewer",
  guests: "Block on a row, in the Guests room",
  review: "Block in Review, after a Hide",
} as const;

function entryScene(
  option: Exclude<Entry, "all">,
  scr: ScreenId,
  short = false,
) {
  const body =
    option === "credit" ? (
      <InViewer scr={scr} />
    ) : option === "guests" ? (
      <InRoom scr={scr} />
    ) : (
      <InReview scr={scr} />
    );
  return (
    <Scene
      key={option}
      id={`entry-${option}`}
      screen={scr}
      title={ENTRY_TITLE[option]}
      measure={reach("Block")}
      short={short}
    >
      {body}
    </Scene>
  );
}

const entry = (s: BoardState, option: Entry) => {
  const scr = screen(s);
  if (option !== "all") return entryScene(option, scr);
  return (
    <Several screen={scr}>
      {entryScene("credit", scr, true)}
      {entryScene("guests", scr, true)}
      {entryScene("review", scr, true)}
    </Several>
  );
};

/* ── decision 2: the block itself (reads `entry`, and the person knob) ───── */

type SheetShape = "confirm" | "undo" | "inline";

function blockGround(s: BoardState, shape: SheetShape): ReactNode {
  const scr = screen(s);
  const w = who(s);
  const at = entryOf(s);
  const ground: Exclude<Entry, "all"> = at === "all" ? "credit" : at;
  const sheet =
    shape === "confirm" ? (
      <BlockSheet
        screen={scr}
        person={w.person}
        uploads={w.uploads}
        typedParty={w.typed}
      />
    ) : shape === "undo" ? (
      <BlockToast
        screen={scr}
        person={w.person}
        uploads={w.uploads.length}
        typedParty={w.typed}
      />
    ) : null;
  const inline = (
    <InlineConfirm
      person={w.person}
      uploads={w.uploads.length}
      typedParty={w.typed}
    />
  );

  if (ground === "credit") {
    // At once: the viewer has closed, the album no longer holds them.
    if (shape === "undo")
      return (
        <Hub
          screen={scr}
          photos={EVENT.photos - w.uploads.length}
          guests={EVENT.guests - 1}
          overlay={sheet}
        />
      );
    return (
      <HostViewer
        screen={scr}
        item={w.item}
        position={w.position}
        credit={
          <Credit item={w.item} position={w.position} pressed={shape === "inline"} />
        }
        menu={
          shape === "inline" ? (
            <PersonMenu person={w.person} style={overCredit(w.person)} foot={inline} />
          ) : undefined
        }
        overlay={sheet}
      />
    );
  }
  if (ground === "guests") {
    const after = w.people.filter((p) => p.id !== w.person.id);
    return (
      <GuestsRoom
        screen={scr}
        people={shape === "undo" ? after : w.people}
        menuFor={shape === "inline" ? w.person.id : undefined}
        menu={
          shape === "inline" ? (
            <PersonMenu person={w.person} foot={inline} />
          ) : undefined
        }
        overlay={sheet}
      />
    );
  }
  return (
    <ReviewRoom
      screen={scr}
      gone={HIDDEN_IDS}
      notice={
        shape === "undo" ? undefined : (
          <HiddenNotice
            screen={scr}
            person={w.person}
            sent={w.uploads}
            actions={shape === "inline" ? inline : undefined}
          />
        )
      }
      overlay={sheet}
    />
  );
}

const SHEET_TITLE = {
  confirm: "The block's sheet",
  undo: "Blocked at once, with Undo",
  inline: "The menu asking a second time",
} as const;

const sheet = (s: BoardState, shape: SheetShape) => {
  const scr = screen(s);
  return (
    <Scene
      id={`sheet-${shape}-${s.person === "typed" ? "typed" : "confirmed"}-${entryOf(s)}`}
      screen={scr}
      title={SHEET_TITLE[shape]}
      measure={reach(shape === "undo" ? "Undo" : "Block")}
    >
      {blockGround(s, shape)}
    </Scene>
  );
};

/* ── decision 3: the blocked door (reads the moment knob) ─────────────────── */

/** The member Dom is to the header while his old session still holds the album. */
const DOM_WHO = { kind: "member", name: DOM.name, seed: DOM.seed ?? "" } as const;

/** One closed door, in one form, with the words and what stands under them. */
function ClosedDoor({
  form,
  scr,
  words,
  below,
  midvisit = false,
}: {
  form: DoorForm;
  scr: ScreenId;
  words: DoorWords;
  below?: ReactNode;
  midvisit?: boolean;
}) {
  if (form === "held") {
    return (
      <HeldDoor
        screen={scr}
        behind={midvisit ? "album" : "river"}
        who={midvisit ? DOM_WHO : undefined}
      >
        <DoorStep eyebrow={EVENT.name} words={words}>
          {midvisit && (
            <span className="mx-auto">
              <EndedNotice text="Your photo wasn't added." />
            </span>
          )}
          {below}
        </DoorStep>
      </HeldDoor>
    );
  }
  const refused = midvisit ? (
    <RefusedSheet
      screen={scr}
      reason={form === "gone" ? "This event link didn't work." : `${words.title}.`}
    />
  ) : null;
  return (
    <div className="relative min-h-full">
      {form === "gone" ? <DeadLink /> : <LockedScreen words={words} below={below} />}
      {refused}
    </div>
  );
}

const DOOR_TITLE = {
  private: "The private album's locked screen",
  held: "The held door, closed",
  gone: "The dead link",
} as const;

const door = (s: BoardState, form: DoorForm) => {
  const scr = screen(s);
  const midvisit = s.moment === "midvisit";
  return (
    <Scene
      id={`door-${form}-${midvisit ? "mid" : "arrive"}`}
      screen={scr}
      title={`${DOOR_TITLE[form]}${midvisit ? ", mid-visit" : ""}`}
      measure={doorLines}
    >
      <ClosedDoor form={form} scr={scr} words={CLOSED} midvisit={midvisit} />
    </Scene>
  );
};

/* ── decision 4: the blocked list (reads `entry` for its world only) ─────── */

/** The room's own switch between its two lists, on the selector's material. */
function RoomTabs({ active }: { active: "guests" | "blocked" }) {
  const tab = (id: "guests" | "blocked", label: string, count: number) => (
    <span
      data-state={active === id ? "on" : "off"}
      className="flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground"
    >
      {label}
      <span className="text-xs tabular-nums opacity-70">{count}</span>
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-heading text-page">Guests</p>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {tab("guests", "Guests", GUESTS_AFTER.length)}
        {tab("blocked", "Blocked", BLOCKED.length)}
      </div>
    </div>
  );
}

function BlockedPlaceView({
  place,
  scr,
  overlay,
}: {
  place: BlockedPlace;
  scr: ScreenId;
  overlay?: ReactNode;
}) {
  if (place === "settings") {
    return (
      <SettingsSheet
        screen={scr}
        overlay={overlay}
      >
        <ScrollHere />
        <AccessCard>
          <div className="space-y-2">
            <OpenRow label="Blocked" value={`${BLOCKED.length} people`} />
            <ul className="divide-y divide-border rounded-lg border border-border/60 bg-muted/30">
              {BLOCKED.map((b, i) => (
                <BlockedRow key={b.id} b={b} screen="375" reachable={i === 0} />
              ))}
            </ul>
          </div>
        </AccessCard>
        <UploadsCard />
      </SettingsSheet>
    );
  }
  if (place === "tab") {
    return (
      <GuestsRoom
        screen={scr}
        people={GUESTS_AFTER}
        heading={<RoomTabs active="blocked" />}
        list={
          <ul className="divide-y divide-border rounded-lg border">
            {BLOCKED.map((b, i) => (
              <BlockedRow key={b.id} b={b} screen={scr} reachable={i === 0} />
            ))}
          </ul>
        }
        overlay={overlay}
      />
    );
  }
  return (
    <GuestsRoom
      screen={scr}
      people={GUESTS_AFTER}
      foot={
        <>
          <ScrollHere offset={72} />
          <BlockedSection screen={scr} />
        </>
      }
      overlay={overlay}
    />
  );
}

const BLOCKED_TITLE = {
  foot: "Blocked, at the foot of the Guests room",
  settings: "Blocked, a row in the settings",
  tab: "Blocked, a tab in the Guests room",
} as const;

const blocked = (s: BoardState, place: BlockedPlace) => {
  const scr = screen(s);
  return (
    <Scene
      id={`blocked-${place}`}
      screen={scr}
      title={BLOCKED_TITLE[place]}
      measure={reach("Let back in")}
    >
      <BlockedPlaceView place={place} scr={scr} />
    </Scene>
  );
};

/* ── decision 5: letting back in (reads `blocked`) ────────────────────────── */

type Restore = "stay" | "back" | "ask";

function restoreBody(option: Restore): { body: ReactNode; primary: string } {
  const n = DOM_UPLOADS.length;
  if (option === "stay")
    return {
      body: (
        <p className="text-sm text-pretty text-muted-foreground">
          {`Their ${n} uploads stay in Deleted, where you can restore any of them until 14 July.`}
        </p>
      ),
      primary: "Let back in",
    };
  if (option === "back")
    return {
      body: (
        <div className="space-y-2">
          <p className="text-sm text-pretty text-muted-foreground">
            {`Their ${n} uploads come back to the album with them.`}
          </p>
          <span className="flex gap-1">
            {DOM_UPLOADS.map((m) => (
              <span
                key={m.id}
                className="size-8 overflow-hidden bg-black/10"
                style={{ borderRadius: "var(--radius-tile)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned photograph */}
                <img src={m.url} alt="" className="size-full object-cover" />
              </span>
            ))}
          </span>
        </div>
      ),
      primary: `Let back in, with ${n} uploads`,
    };
  return {
    body: (
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <SwitchRow
          label={`Bring back their ${n} uploads`}
          description="They wait in Deleted until 14 July."
          checked={false}
        />
      </div>
    ),
    primary: "Let back in",
  };
}

const RESTORE_TITLE = {
  stay: "Letting back in, uploads stay in Deleted",
  back: "Letting back in, uploads come back",
  ask: "Letting back in, the confirm asks",
} as const;

const restore = (s: BoardState, option: Restore) => {
  const scr = screen(s);
  const { body, primary } = restoreBody(option);
  return (
    <Scene
      id={`restore-${option}-${blockedOf(s)}`}
      screen={scr}
      title={RESTORE_TITLE[option]}
      measure={reach("Let back in")}
    >
      <BlockedPlaceView
        place={blockedOf(s)}
        scr={scr}
        overlay={
          <UnblockDialog screen={scr} person={DOM} body={body} primary={primary} />
        }
      />
    </Scene>
  );
};

/* ── decision 6: the room with the list off ───────────────────────────────── */

type RoomOff = "always" | "today" | "switch";

const ROOM_TITLE = {
  always: "The Guests room, listed with a line",
  today: "The Guests room as today",
  switch: "The Guests room, listed under its switch",
} as const;

const room = (s: BoardState, option: RoomOff) => {
  const scr = screen(s);
  const body =
    option === "today" ? (
      <GuestsRoomToday screen={scr} />
    ) : (
      <GuestsRoom
        screen={scr}
        people={GUESTS}
        line={
          option === "always" ? (
            <p data-es-reach className="text-sm text-muted-foreground">
              Only you see this list. It&rsquo;s off on the album.{" "}
              <span className="font-medium text-foreground underline underline-offset-4">
                Show it on the album
              </span>
            </p>
          ) : (
            <Card data-es-reach size="sm">
              <CardContent>
                <SwitchRow
                  label="Show this list on the album"
                  description="Guests see every name that added photos."
                  checked={false}
                />
              </CardContent>
            </Card>
          )
        }
      />
    );
  return (
    <Scene
      id={`room-${option}`}
      screen={scr}
      title={ROOM_TITLE[option]}
      measure={option === "today" ? undefined : reach("The line")}
      caption={option === "today" ? "Nothing listed while the album's list is off" : undefined}
    >
      {body}
    </Scene>
  );
};

/* ── decision 7: who can join, and the settings every closed door reads ──── */

/**
 * THE SETTINGS SHEET IN ONE OF THE THREE FORMS `choose` OFFERS, with a
 * closed door chosen and whatever the door's own decision stands under it.
 * `choose` draws it on Approve newcomers; `inside` and `editor` wear the form
 * `choose` answered (its recommendation until then) on their own door.
 */
function JoinSettings({
  scr,
  form,
  value,
  after,
}: {
  scr: ScreenId;
  form: ChooseForm;
  value: JoinId;
  after?: ReactNode;
}) {
  const lock = needsVerified(value)
    ? value === "approve"
      ? "On while you approve newcomers."
      : "On while an invite list is on."
    : undefined;

  if (form === "switches") {
    const on = (id: JoinId) => id === value;
    return (
      <SettingsSheet screen={scr}>
        <AccessCard />
        <UploadsCard
          verifiedLock={lock}
          extra={
            <>
              <ScrollHere offset={120} />
              <div data-es-reach className="space-y-4">
                <SwitchRow
                  label="Approve newcomers"
                  description="Newcomers confirm an email, then wait for you to let them in."
                  checked={on("approve")}
                />
                <SwitchRow
                  label="Close to newcomers"
                  description="Everyone already in keeps going. Nobody new can join."
                  checked={on("closed")}
                />
                <SwitchRow
                  label="Only an invite list"
                  description="Only the addresses on your list can confirm in."
                  checked={on("list")}
                />
              </div>
              {after}
            </>
          }
        />
      </SettingsSheet>
    );
  }

  const join = (
    <div data-es-reach>
      <JoinChoice value={value} after={after} />
    </div>
  );

  if (form === "door") {
    return (
      <SettingsSheet screen={scr}>
        <ScrollHere />
        <AccessCard
          title="The door"
          description="Everything a guest passes, in the order they meet it."
        >
          {join}
          <SwitchRow
            label="Confirm an email first"
            description="Guests confirm their email before the full album or an upload."
            checked
            locked={lock}
          />
          <SwitchRow
            label="Add a photo first"
            description="Guests add one photo or video before the album opens."
            checked={false}
          />
        </AccessCard>
        <UploadsCard door={false} />
      </SettingsSheet>
    );
  }

  return (
    <SettingsSheet screen={scr}>
      <ScrollHere />
      <AccessCard>{join}</AccessCard>
      <UploadsCard verifiedLock={lock} />
    </SettingsSheet>
  );
}

const CHOOSE_TITLE = {
  choice: "Who can join, one choice of four",
  switches: "Who can join, a switch for each",
  door: "Who can join, inside The door",
} as const;

const choose = (s: BoardState, form: ChooseForm) => {
  const scr = screen(s);
  return (
    <Scene
      id={`choose-${form}`}
      screen={scr}
      title={CHOOSE_TITLE[form]}
      measure={reach("The choice")}
    >
      <JoinSettings scr={scr} form={form} value="approve" />
    </Scene>
  );
};

/* ── decision 8: waiting at the door ──────────────────────────────────────── */

type Waiting = "held" | "email" | "both";
const NEWCOMER = NEWCOMERS[0];
const WAITING_WORDS: DoorWords = {
  title: `Waiting for ${HOST.first}`,
  line: `This opens by itself the moment ${HOST.first} lets you in.`,
};

const WAITING_TITLE = {
  held: "Waiting on the held door",
  email: "Waiting on a page, with an email",
  both: "Waiting on the door, with an email if they go",
} as const;

const waiting = (s: BoardState, option: Waiting) => {
  const scr = screen(s);
  const body =
    option === "email" ? (
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <GuestTop />
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
          <NotFoundScreen
            icon={Clock}
            title={`${HOST.first} has been asked`}
            description={
              <span data-es-line>
                {`We'll email ${NEWCOMER.email} the moment ${HOST.first} lets you in.`}
              </span>
            }
            actions={
              <Button size="cta" variant="outline" tabIndex={-1}>
                What is Partyreel?
              </Button>
            }
          />
        </main>
      </div>
    ) : (
      <HeldDoor screen={scr}>
        <DoorStep Icon={Clock} eyebrow={EVENT.name} words={WAITING_WORDS}>
          <WaitingMark label="Asked 2 min ago" />
          {option === "both" && (
            <p className="text-sm text-pretty text-muted-foreground">
              {`You can close this. We'll email ${NEWCOMER.email} when you're in.`}
            </p>
          )}
        </DoorStep>
      </HeldDoor>
    );
  return (
    <Scene
      id={`waiting-${option}`}
      screen={scr}
      title={WAITING_TITLE[option]}
      measure={doorLines}
    >
      {body}
    </Scene>
  );
};

/* ── decision 9: letting newcomers in (reads `waiting` for its world) ────── */

type Queue = "room" | "review" | "hub";

/** The strip on the hub: who is waiting, and Let in right there. */
function HubStrip({ scr }: { scr: ScreenId }) {
  const phone = scr === "375";
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3",
        phone ? "flex-col" : "items-center",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex -space-x-2">
          {NEWCOMERS.map((n) => (
            <span key={n.id} className="rounded-full ring-2 ring-background">
              <Face person={{ name: n.name, verified: true, seed: n.seed }} size="sm" />
            </span>
          ))}
        </span>
        <p className="min-w-0 text-sm">
          <span className="font-medium">
            {`${NEWCOMERS[0].name} and ${NEWCOMERS[1].name}`}
          </span>
          <span className="text-muted-foreground"> are waiting to join.</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" tabIndex={-1}>
          See all
        </Button>
        <Button size="sm" tabIndex={-1} data-es-reach>
          <UserCheck /> Let both in
        </Button>
      </div>
    </div>
  );
}

/**
 * HOW MUCH OF THE COUNTING CARD IS ON SCREEN. The hub's cards row runs past a
 * phone's edge (it scrolls sideways, `event-cards-row.tsx`), so a count on the
 * third card is half a card at rest; this says how much, read off the frame.
 */
const cardShown =
  (id: "guests" | "review"): Reader =>
  (root, win) => {
    const el = root.querySelector<HTMLElement>(`[data-es-card="${id}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1) return null;
    const shown = Math.max(0, Math.min(r.right, win.innerWidth) - Math.max(r.left, 0));
    const label = id === "guests" ? "The Guests card" : "The Review card";
    return shown >= r.width - 1
      ? `${label} is whole on screen`
      : `${label}: ${Math.round(shown)} of its ${Math.round(r.width)} px on screen`;
  };

const QUEUE_TITLE = {
  room: "The Guests room's At the door",
  review: "Review, people beside uploads",
  hub: "A strip on the hub",
} as const;

const queue = (s: BoardState, option: Queue) => {
  const scr = screen(s);
  if (option === "hub") {
    return (
      <Scene id="queue-hub" screen={scr} title={QUEUE_TITLE.hub} measure={reach("Let both in")}>
        <Hub screen={scr} strip={<HubStrip scr={scr} />} />
      </Scene>
    );
  }
  const hubCard =
    option === "room"
      ? hubCards({ guests: { value: "2 at the door", amber: true } })
      : hubCards({ review: { value: "3 uploads, 2 people", amber: true } });
  const place =
    option === "room" ? (
      <GuestsRoom screen={scr} people={GUESTS} top={<DoorQueue screen={scr} />} />
    ) : (
      <ReviewRoom
        screen={scr}
        items={WAITING.slice(0, 3)}
        above={
          <RoomSection label="Waiting to join" count={NEWCOMERS.length} tone="amber">
            {NEWCOMERS.map((n, i) => (
              <NewcomerRow key={n.id} n={n} screen={scr} reachable={i === 0} />
            ))}
          </RoomSection>
        }
      />
    );
  return (
    <Several screen={scr}>
      <Scene
        id={`queue-${option}`}
        screen={scr}
        title={QUEUE_TITLE[option]}
        measure={reach("Let in")}
        short
      >
        {place}
      </Scene>
      <Scene
        id={`queue-${option}-hub`}
        screen={scr}
        title="The hub, counting who waits"
        measure={cardShown(option === "room" ? "guests" : "review")}
        short
      >
        <Hub screen={scr} cards={hubCard} />
      </Scene>
    </Several>
  );
};

/* ── decision 10: closed to newcomers (reads `door`) ──────────────────────── */

type Newcomer = "same" | "honest";
const HONEST: DoorWords = {
  title: "Closed to new guests",
  line: "Only people already in can open it and add photos.",
};
const BACK_IN = <QuietWay lead="Already a guest?" link="Confirm your email" />;

const newcomer = (s: BoardState, option: Newcomer) => {
  const scr = screen(s);
  const form = doorOf(s);
  // The honest line cannot live on a dead link, which says the album may be
  // gone: it takes the locked screen's form there instead.
  const honestForm: DoorForm = form === "gone" ? "private" : form;
  return (
    <Scene
      id={`newcomer-${option}-${form}`}
      screen={scr}
      title={option === "same" ? "The blocked door, word for word" : "Its own line, closed to new guests"}
      measure={doorLines}
    >
      {option === "same" ? (
        <ClosedDoor form={form} scr={scr} words={CLOSED} below={form === "gone" ? undefined : BACK_IN} />
      ) : (
        <ClosedDoor form={honestForm} scr={scr} words={HONEST} below={BACK_IN} />
      )}
    </Scene>
  );
};

/* ── decision 11: who is already in (reads `choose`) ──────────────────────── */

type Inside = "sentence" | "count" | "list";

const INSIDE_TITLE = {
  sentence: "Closed, said in a sentence",
  count: "Closed, with a count of who is in",
  list: "Closed, the room lists who has no photos yet",
} as const;

/** People past the door who have not added a photograph. */
const NO_PHOTOS: readonly Person[] = [
  { id: "ines", name: "Ines Varga", email: "ines.varga@example.com", verified: true, seed: "es-ines", uploads: 0 },
  { id: "tom", name: "Tom Achebe", email: "tom.achebe@example.com", verified: true, seed: "es-tom", uploads: 0 },
  { id: "bea", name: "Aunt Bea", email: null, verified: false, uploads: 0 },
];

const inside = (s: BoardState, option: Inside) => {
  const scr = screen(s);
  if (option === "list") {
    return (
      <Scene id="inside-list" screen={scr} title={INSIDE_TITLE.list} measure={reach("The list")}>
        <GuestsRoom
          screen={scr}
          people={GUESTS}
          foot={
            <>
              <ScrollHere offset={72} />
              <div data-es-reach>
                <RoomSection
                  label="In, no photos yet"
                  count={17}
                  tone="quiet"
                  note="Past the door before you closed it. They can still add."
                >
                  {NO_PHOTOS.map((p) => (
                    <GuestRow
                      key={p.id}
                      person={p}
                      screen={scr}
                      muted
                      trailing={<span className="text-xs text-muted-foreground">No photos</span>}
                    />
                  ))}
                  <li className="px-4 py-2.5 text-xs text-muted-foreground">
                    {`${17 - NO_PHOTOS.length} more`}
                  </li>
                </RoomSection>
              </div>
            </>
          }
        />
      </Scene>
    );
  }
  return (
    <Scene
      id={`inside-${option}-${chooseOf(s)}`}
      screen={scr}
      title={INSIDE_TITLE[option]}
      measure={reach("The choice")}
    >
      <JoinSettings
        scr={scr}
        form={chooseOf(s)}
        value="closed"
        after={
          option === "count" ? (
            <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <UsersRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                <span className="font-medium tabular-nums">31 people are in.</span>{" "}
                <span className="text-muted-foreground">
                  {`${EVENT.guests} have added photos.`}
                </span>
              </span>
            </p>
          ) : undefined
        }
      />
    </Scene>
  );
};

/* ── decision 12: the invite list's editor (reads `choose`) ──────────────── */

type Editor = "one" | "paste" | "both";

/** An address on the list, as a removable chip. */
function AddressChip({ address, bad = false }: { address: string; bad?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-7 max-w-full items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-xs",
        bad
          ? "border-destructive/50 bg-destructive/5 text-destructive"
          : "border-border bg-background",
      )}
    >
      <span className="truncate">{address}</span>
      <X className="size-3.5 shrink-0 opacity-60" aria-hidden />
    </span>
  );
}

function EditorBody({ option }: { option: Editor }) {
  if (option === "one") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <span className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-input px-3 text-sm text-muted-foreground">
            name@example.com
          </span>
          <Button size="sm" className="h-9" tabIndex={-1}>
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {`${INVITED_TOTAL} addresses`}
        </p>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {INVITED.slice(0, 5).map((a) => (
            <li key={a} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="truncate">{a}</span>
              <X className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </li>
          ))}
          <li className="px-3 py-2 text-xs text-muted-foreground">
            {`${INVITED_TOTAL - 5} more`}
          </li>
        </ul>
      </div>
    );
  }
  if (option === "paste") {
    return (
      <div className="space-y-3">
        <Textarea
          readOnly
          tabIndex={-1}
          rows={5}
          value={PASTED.join("\n")}
          className="text-sm"
        />
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p>
            <span className="font-medium tabular-nums">{`Found ${PASTED_FOUND} addresses.`}</span>{" "}
            <span className="text-muted-foreground">{`${PASTED_BAD.length} couldn't be read:`}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PASTED_BAD.map((b) => (
              <AddressChip key={b} address={b} bad />
            ))}
          </div>
        </div>
        <Button size="sm" className="w-full" tabIndex={-1}>
          {`Add ${PASTED_FOUND} to the list`}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input p-2">
        {INVITED.slice(0, 4).map((a) => (
          <AddressChip key={a} address={a} />
        ))}
        {PASTED_BAD.map((b) => (
          <AddressChip key={b} address={b} bad />
        ))}
        <span className="flex h-7 min-w-32 flex-1 items-center px-1 text-xs text-muted-foreground">
          Add or paste addresses
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">
          {`${PASTED_FOUND} added from your paste.`}
        </span>{" "}
        {`${PASTED_BAD.length} need a look. ${INVITED_TOTAL} on the list.`}
      </p>
    </div>
  );
}

const EDITOR_TITLE = {
  one: "The invite list, one at a time",
  paste: "The invite list, a box to paste",
  both: "The invite list, one field for both",
} as const;

const editor = (s: BoardState, option: Editor) => {
  const scr = screen(s);
  return (
    <Scene
      id={`editor-${option}-${chooseOf(s)}`}
      screen={scr}
      title={EDITOR_TITLE[option]}
      measure={reach("The list")}
    >
      <JoinSettings
        scr={scr}
        form={chooseOf(s)}
        value="list"
        after={<EditorBody option={option} />}
      />
    </Scene>
  );
};

/* ── decision 13: not on the list (reads `door`) ──────────────────────────── */

type Unlisted = "same" | "another" | "ask";

function UnlistedDoor({ option, scr, form }: { option: Unlisted; scr: ScreenId; form: DoorForm }) {
  if (option === "same") return <ClosedDoor form={form} scr={scr} words={CLOSED} />;
  if (option === "another") {
    return (
      <HeldDoor screen={scr}>
        <DoorStep
          Icon={MailX}
          eyebrow={EVENT.name}
          words={{
            title: "Not on the list",
            line: `${UNLISTED.email} isn't on ${HOST.first}'s invite list.`,
          }}
        >
          <Button size="cta" className="w-full" tabIndex={-1} data-es-reach>
            Use a different email
          </Button>
          <p className="text-sm text-muted-foreground">
            {`Invited at another address? Confirm that one instead.`}
          </p>
        </DoorStep>
      </HeldDoor>
    );
  }
  return (
    <HeldDoor screen={scr}>
      <DoorStep
        Icon={MailX}
        eyebrow={EVENT.name}
        words={{
          title: "Not on the list yet",
          line: `${HOST.first} sees your name and ${UNLISTED.email}, and can let you in.`,
        }}
      >
        <Button size="cta" className="w-full" tabIndex={-1} data-es-reach>
          {`Ask ${HOST.first} to let you in`}
        </Button>
      </DoorStep>
    </HeldDoor>
  );
}

const UNLISTED_TITLE = {
  same: "Not on the list: the closed door",
  another: "Not on the list: try another address",
  ask: "Not on the list: ask the host",
} as const;

const unlisted = (s: BoardState, option: Unlisted) => {
  const scr = screen(s);
  const form = doorOf(s);
  return (
    <Several screen={scr}>
      <Scene
        id={`unlisted-${option}-${form}`}
        screen={scr}
        title={UNLISTED_TITLE[option]}
        measure={doorLines}
        short
      >
        <UnlistedDoor option={option} scr={scr} form={form} />
      </Scene>
      <Scene
        id={`unlisted-${option}-listed`}
        screen={scr}
        title={`On the list: ${LISTED.email}`}
        short
      >
        <HeldDoor screen={scr}>
          <InStep line={`You're on ${HOST.first}'s list.`} />
        </HeldDoor>
      </Scene>
    </Several>
  );
};

/* ── the map ──────────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof EVENT_SAFETY> = {
  "entry.credit": (s) => entry(s, "credit"),
  "entry.guests": (s) => entry(s, "guests"),
  "entry.review": (s) => entry(s, "review"),
  "entry.all": (s) => entry(s, "all"),
  "sheet.confirm": (s) => sheet(s, "confirm"),
  "sheet.undo": (s) => sheet(s, "undo"),
  "sheet.inline": (s) => sheet(s, "inline"),
  "door.private": (s) => door(s, "private"),
  "door.held": (s) => door(s, "held"),
  "door.gone": (s) => door(s, "gone"),
  "blocked.foot": (s) => blocked(s, "foot"),
  "blocked.settings": (s) => blocked(s, "settings"),
  "blocked.tab": (s) => blocked(s, "tab"),
  "restore.stay": (s) => restore(s, "stay"),
  "restore.back": (s) => restore(s, "back"),
  "restore.ask": (s) => restore(s, "ask"),
  "room.always": (s) => room(s, "always"),
  "room.today": (s) => room(s, "today"),
  "room.switch": (s) => room(s, "switch"),
  "choose.choice": (s) => choose(s, "choice"),
  "choose.switches": (s) => choose(s, "switches"),
  "choose.door": (s) => choose(s, "door"),
  "waiting.held": (s) => waiting(s, "held"),
  "waiting.email": (s) => waiting(s, "email"),
  "waiting.both": (s) => waiting(s, "both"),
  "queue.room": (s) => queue(s, "room"),
  "queue.review": (s) => queue(s, "review"),
  "queue.hub": (s) => queue(s, "hub"),
  "newcomer.same": (s) => newcomer(s, "same"),
  "newcomer.honest": (s) => newcomer(s, "honest"),
  "inside.sentence": (s) => inside(s, "sentence"),
  "inside.count": (s) => inside(s, "count"),
  "inside.list": (s) => inside(s, "list"),
  "editor.one": (s) => editor(s, "one"),
  "editor.paste": (s) => editor(s, "paste"),
  "editor.both": (s) => editor(s, "both"),
  "unlisted.same": (s) => unlisted(s, "same"),
  "unlisted.another": (s) => unlisted(s, "another"),
  "unlisted.ask": (s) => unlisted(s, "ask"),
};

export function EventSafetyBoard() {
  return <ExplorationBoard spec={EVENT_SAFETY} previews={PREVIEWS} />;
}
