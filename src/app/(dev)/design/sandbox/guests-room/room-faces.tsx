"use client";

import { type ReactNode, useState } from "react";
import { UserPlus, X } from "lucide-react";

import type { DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BLOCKED_NOTE,
  type BlockedPerson,
  LET_IN,
  letBackInAct,
} from "@/lib/events/event-blocks";
import { cn } from "@/lib/utils";

import {
  type CardWay,
  declineOnRow,
  opensCard,
  PersonCard,
  type Who,
} from "./card";
import {
  ASKED_SHORT,
  AT_THE_DOOR,
  BLOCKED,
  BLOCKED_AT,
  GUESTS,
  INVITED,
} from "./fixtures";
import {
  doorName,
  Face,
  guestByEmail,
  Head,
  Hint,
  InviteField,
  MarkGlyph,
  photosWord,
} from "./people";

/**
 * FACES FIRST (the `rows` ask's `faces`): the room drawn as the party it is,
 * people as their faces, with an act only where a person waits on her.
 *
 *  - At the door: a card each, the row shared by up to three: the face large,
 *    the name, the address breaking at its @ so its domain stands whole, how
 *    long ago they asked, then Let in (the room's one solid key) over a quiet
 *    Decline; the count in the tally. A fourth scrolls the row sideways.
 *  - In: a contact sheet, everyone at once, as many frames across as the room
 *    holds, each name under its face and a typed name's mark after it; a face
 *    opens their card, which holds the address and the rest.
 *  - Invited: the joined as a row of their faces (they are in the room above),
 *    then who has not joined yet as empty seats on the same sheet; a seat
 *    opens its whole address and the remove.
 *  - Blocked: the door's card again, unfilled, its face dimmed, its act quiet.
 *
 * Invite stands in the In head, where more people come in.
 */

/**
 * ★ A CARD IS THE ROOM'S OWN FURNITURE (Settings' groups, `settings-furniture.tsx`):
 * the panel is the room's ground in a hand and the popover's, a step lighter,
 * at a desk, so a tone alone lifts on one and sinks into the other; the
 * hairline draws the card on both. The door's cards wear the card's tone,
 * Blocked's the hairline alone, the quieter of the two. ★ ITS SIDES ARE 6PX
 * so a third of her phone, a fourth's narrower card included, holds a domain
 * as long as "@example.com" whole (87px of the 90 left inside it).
 */
const CARD =
  "flex min-w-0 snap-start flex-col items-center rounded-2xl px-1.5 pt-4 pb-2 text-center ring-1 ring-foreground/10";

/** A card's person: the face and the words under it, the one press that opens their card. */
const WHO =
  "group flex w-full min-w-0 flex-col items-center gap-2.5 rounded-lg outline-none focus-halo";

/**
 * A card's person as the press that opens their card where the `card` answer
 * opens one from this standing, and as plain words where it opens none (a
 * press that does nothing is a lie to a finger and a screen reader alike).
 */
function Person({
  card,
  who,
  id,
  children,
}: {
  card: CardWay;
  who: Who;
  id: string;
  children: ReactNode;
}) {
  if (!opensCard(card, who.kind))
    return (
      <div data-gr-name={id} className={WHO}>
        {children}
      </div>
    );
  return (
    <PersonCard way={card} who={who}>
      <button type="button" data-gr-name={id} className={WHO}>
        {children}
      </button>
    </PersonCard>
  );
}

/**
 * ★ A FACE GIVES UNDER THE FINGER, ITS PRESS NEVER DOES: the name is the
 * trigger a card anchors to in the frame the press lands (the house's
 * `press-shrink` stands aside for a trigger for that reason), so the face
 * inside it takes the give, about two pixels, and the trigger's box stays put.
 */
const GIVE =
  "transition-[scale] duration-150 ease-emphasis group-active:scale-[0.96] motion-reduce:transition-none motion-reduce:group-active:scale-100";

/**
 * ★ ONE ROW, SHARED BY UP TO THREE (the door, and Blocked under it): who waits
 * is one glance and every Let in stands on one line, where two to a row left
 * the third alone under them and doubled the door's height. A fourth never
 * adds a row: the row scrolls sideways, its cards a step under a third so the
 * next shows at the screen's edge, and the door stays one card tall however
 * many ask. Fewer than three share it as halves, so no row stands a third empty.
 */
function Row({ count, children }: { count: number; children: ReactNode }) {
  const scrolls = count > 3;
  return (
    <ul
      className={cn(
        "grid grid-flow-col gap-2",
        count === 3
          ? "auto-cols-[calc((100%-1rem)/3)]"
          : scrolls
            ? "auto-cols-[calc((100%-2.25rem)/3)]"
            : "auto-cols-[calc((100%-0.5rem)/2)]",
        // Out to the screen's edge, so a card scrolls under it rather than being cut at the gutter.
        scrolls &&
          "-mx-4 -my-2 snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] overflow-x-auto overscroll-x-contain px-4 py-2",
      )}
    >
      {children}
    </ul>
  );
}

/** A run of an address with a break offered after each of its dots, dashes and underscores. */
function breakable(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let run = "";
  for (const ch of text) {
    run += ch;
    if ("._+-".includes(ch)) {
      out.push(run, <wbr key={out.length} />);
      run = "";
    }
  }
  if (run) out.push(run);
  return out;
}

/**
 * ★ AN ADDRESS BREAKS BEFORE ITS @, NEVER INSIDE ITS DOMAIN: a third of her
 * screen holds no whole address, and one shortened from the middle there is
 * "d…@example.com", proof of nothing. The domain is what tells her an address
 * is real (`guest-list.tsx`'s rule), so it is one unbreakable piece that moves
 * to a line of its own when the card is narrow (a card wide enough keeps the
 * whole address on one) and loses its end only where it outruns a whole line.
 */
function AddressText({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;
  return (
    <>
      {breakable(email.slice(0, at))}
      <span className="inline-block max-w-full truncate align-top">
        {email.slice(at)}
      </span>
    </>
  );
}

/** How long ago they asked, as a tight card says it. */
function askedAgo(p: DoorPerson): string {
  const short = ASKED_SHORT[p.guestId];
  if (!short) return p.asked;
  return short === "now" ? "Just now" : `${short} ago`;
}

function DoorCard({
  p,
  card,
  onAnswer,
}: {
  p: DoorPerson;
  card: CardWay;
  /** A press answered: the card leaves (it writes nothing). */
  onAnswer: () => void;
}) {
  const name = doorName(p);
  const named = Boolean(p.name?.trim());
  const email = p.email ?? name;
  const at = email.lastIndexOf("@");
  return (
    <li data-gr-door-row={p.guestId} className={cn(CARD, "bg-card")}>
      <Person card={card} who={{ kind: "door", person: p }} id={p.guestId}>
        <span aria-hidden>
          <Face
            name={name}
            seed={p.seed}
            className={cn("size-14 text-lg", GIVE)}
          />
        </span>
        {named ? (
          <span className="w-full min-w-0">
            <span className="block truncate text-sm font-medium">{name}</span>
            {p.email ? (
              <span className="block text-xs break-words text-muted-foreground">
                <AddressText email={p.email} />
              </span>
            ) : null}
          </span>
        ) : (
          // ★ NO NAME YET, SO THE ADDRESS IS THE NAME: what comes before its @
          // stands where a name would, and its domain under it, where every
          // other card's address ends, so it still reads as the address it is.
          <span className="w-full min-w-0">
            <span className="sr-only">{email}</span>
            <span aria-hidden title={email}>
              <span className="block truncate text-sm font-medium">
                {at > 0 ? email.slice(0, at) : email}
              </span>
              {at > 0 ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {email.slice(at)}
                </span>
              ) : null}
            </span>
          </span>
        )}
      </Person>
      {/* ★ THE FOOT STANDS ON THE CARD'S FLOOR: a card with no name is a line
          shorter, and its time and keys still meet the row's, one line each. */}
      <div className="mt-auto flex w-full flex-col gap-0.5 pt-3">
        <p className="pb-1.5 text-caption text-faint tabular-nums">
          {askedAgo(p)}
        </p>
        <Button
          size="sm"
          className="w-full"
          aria-label={`${LET_IN} ${name}`}
          onClick={onAnswer}
        >
          {LET_IN}
        </Button>
        {/* Under the standing card, Decline leaves the card for the person's own card (`declineOnRow`). */}
        {declineOnRow(card) ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            aria-label={`Decline ${name}`}
            onClick={onAnswer}
          >
            Decline
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * ★ AN ANSWERED CARD LEAVES, AS PRODUCTION'S ROW DOES (`at-the-door.tsx`): a
 * press here writes nothing, and the card goes at once with the tally a count
 * down, so a press in a frame answers as the room would.
 */
function useAnswered() {
  const [gone, setGone] = useState<ReadonlySet<string>>(() => new Set());
  return {
    gone,
    answer: (id: string) => setGone((g) => new Set([...g, id])),
  };
}

function Door({ card }: { card: CardWay }) {
  const { gone, answer } = useAnswered();
  const waiting = AT_THE_DOOR.filter((p) => !gone.has(p.guestId));
  if (waiting.length === 0) return null;
  return (
    <section
      id="at-the-door"
      aria-label="At the door"
      data-gr-door=""
      className="space-y-2"
    >
      <Head label="At the door" count={waiting.length} needs />
      <Hint>
        {declineOnRow(card)
          ? "Let in opens the album for them. Decline blocks them."
          : "Let in opens the album for them. A face opens Decline, which blocks them."}
      </Hint>
      <div className="pt-1">
        <Row count={waiting.length}>
          {waiting.map((p) => (
            <DoorCard
              key={p.guestId}
              p={p}
              card={card}
              onAnswer={() => answer(p.guestId)}
            />
          ))}
        </Row>
      </div>
    </section>
  );
}

/**
 * ★ A CONTACT SHEET, NEVER A LIST (the camera's own index of a roll): every
 * frame one size, as many across as the room holds, read off the room's own
 * width (`auto-fill` on a 4rem frame: five at her phone, six in the desk's
 * panel; a breakpoint would read the screen, which is wide at a desk while the
 * panel is not), so all 31 stand on one screen, each name under its face.
 */
const SHEET =
  "grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-x-1 gap-y-1.5";

/** One frame on the sheet: a face, the words under it, one press. */
const FRAME =
  "group flex w-full min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 pt-1 pb-1.5 text-center outline-none focus-halo hover:bg-(--key-hover)";

/** A frame's words, quiet until the frame is pointed at. */
const CAPTION =
  "w-full min-w-0 text-xs text-muted-foreground transition-colors duration-150 group-hover:text-foreground motion-reduce:transition-none";

/** One line of a caption, centred, the mark standing clear of its cut. */
const CAPTION_LINE = "flex min-w-0 items-center justify-center gap-1";

/**
 * ★ EVERY CAPTION IS TWO SHORT LINES, the first name over the rest: captions
 * that take one line or two by how wide a name runs leave the sheet ragged,
 * and the first name is the one she knows them by at her own party.
 *
 * ★ A TYPED NAME'S MARK SITS AFTER THE NAME, as every list of names draws it
 * (the guest list's chips), never on the face, where a dot in a disc reads as
 * the face's own presence light; it stands outside the line's cut, so a long
 * name never cuts it off. Inside the frame's one press it is the mark's look
 * alone (`MarkGlyph`), and the card the frame opens says what it means.
 */
function Caption({ name, unverified }: { name: string; unverified: boolean }) {
  const cut = name.indexOf(" ");
  const first = cut > 0 ? name.slice(0, cut) : name;
  const rest = cut > 0 ? name.slice(cut + 1) : "";
  const mark = unverified ? <MarkGlyph /> : null;
  return (
    <span className={CAPTION}>
      <span className={CAPTION_LINE}>
        {/* The space a screen reader hears between the two lines; a line's end draws none. */}
        <span className="truncate">{rest ? `${first} ` : first}</span>
        {rest ? null : mark}
      </span>
      {rest ? (
        <span className={CAPTION_LINE}>
          <span className="truncate">{rest}</span>
          {mark}
        </span>
      ) : null}
    </span>
  );
}

/** A typed name on a card: its mark rides the last word, so it never wraps onto a line alone. */
function MarkedName({ name }: { name: string }) {
  const cut = name.lastIndexOf(" ");
  return (
    <>
      {cut > 0 ? name.slice(0, cut + 1) : null}
      <span className="whitespace-nowrap">
        {cut > 0 ? name.slice(cut + 1) : name} <MarkGlyph />
      </span>
    </>
  );
}

/**
 * ★ A SHEET SHOWS A PAGE OF FACES, NEVER THE WHOLE PARTY (Will, `list=faces`, 2026-09-19: "a page 100 screens
 * tall all at once"): sixty at a time, a dozen rows at her phone, then the next sixty on a press. A wedding's
 * 31 are one page, so none of this board's frames shows the press.
 */
const SHEET_PAGE = 60;

function In({ card }: { card: CardWay }) {
  const [count, setCount] = useState(SHEET_PAGE);
  const rest = GUESTS.length - count;
  return (
    <section id="in" aria-label="Guests" data-gr-in="" className="space-y-3">
      <Head
        label="Guests"
        count={GUESTS.length}
        action={
          <Button variant="outline" size="sm">
            <UserPlus data-icon="inline-start" />
            Invite
          </Button>
        }
      />
      <ul className={SHEET}>
        {GUESTS.slice(0, count).map((g) => (
          <li key={g.id} className="min-w-0">
            <PersonCard way={card} who={{ kind: "in", guest: g }}>
              <button type="button" data-gr-name={g.id} className={FRAME}>
                <span aria-hidden>
                  <Face
                    name={g.name}
                    seed={g.seed}
                    className={cn("size-12 text-base", GIVE)}
                  />
                </span>
                <Caption name={g.name} unverified={g.unverified} />
              </button>
            </PersonCard>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setCount((n) => n + SHEET_PAGE)}
        >
          {`${Math.min(SHEET_PAGE, rest)} more`}
        </Button>
      ) : null}
    </section>
  );
}

/**
 * ★ A ROW OF FACES PARTED BY A CUT, NEVER A RING: each face but the last is
 * cut where the next one lands, two pixels wider than it, so the room's own
 * ground shows between them. A ring in a ground's colour is the right colour
 * on one ground only: the panel is the room's ground in a hand and the
 * popover's at a desk, where a ring of the room's drew every face a dark rim.
 */
const STACKED =
  "not-last:-me-1.5 not-last:[mask-image:radial-gradient(circle_at_calc(100%_+_0.5rem)_50%,transparent_1rem,black_calc(1rem_+_0.5px))]";

/**
 * ★ AN EMPTY SEAT, NEVER A CHIP: an address on her list nobody has confirmed
 * yet is a frame on the same sheet with no face in it yet, its ring perforated
 * evenly (sixteen dashes by `pathLength`, where a dashed border bunches at a
 * seam) and the name before the @ under it, which on an invite list is most
 * often the person ("abuela.carmen"). ★ ITS ACT WAITS BEHIND ITS PRESS (the
 * option's "acts only where someone waits"): nobody on the list waits on her,
 * so a seat opens its whole address and the remove, keeping twelve Xs off it.
 */
function Seat({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  const local = at > 0 ? email.slice(0, at) : email;
  return (
    <li className="min-w-0">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${email}, not joined yet`}
            title={email}
            className={cn(FRAME, "aria-expanded:bg-(--key-hover)")}
          >
            <span
              aria-hidden
              className="relative flex size-12 items-center justify-center text-sm text-faint"
            >
              {/* The seat lights while it is pointed at, and stays lit while its address is open. */}
              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="absolute inset-0 size-full text-foreground/30 transition-colors duration-150 group-hover:text-foreground/55 group-aria-expanded:text-foreground/55 motion-reduce:transition-none"
              >
                <circle
                  cx="24"
                  cy="24"
                  r="23.5"
                  stroke="currentColor"
                  pathLength={32}
                  strokeDasharray="1 1"
                  strokeLinecap="round"
                />
              </svg>
              {local.slice(0, 1).toUpperCase()}
            </span>
            <span
              aria-hidden
              className={cn(CAPTION, "line-clamp-2 break-words")}
            >
              {breakable(local)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-64 space-y-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium break-words">
              <AddressText email={email} />
            </p>
            <p className="text-xs text-muted-foreground">
              On your list, not joined yet
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            aria-label={`Remove ${email}`}
          >
            <X data-icon="inline-start" />
            Remove from your list
          </Button>
        </PopoverContent>
      </Popover>
    </li>
  );
}

function Invited() {
  const waiting = INVITED.filter((i) => !i.joined);
  const joined = INVITED.filter((i) => i.joined);
  return (
    <section
      id="invited"
      aria-label="Invited"
      data-gr-invited=""
      className="space-y-2"
    >
      <Head label="Invited" count={INVITED.length} />
      <Hint>
        Your list is the door: these come straight in once they confirm.
      </Hint>
      <InviteField />
      <div className="flex items-center gap-2.5 pt-2">
        <span aria-hidden className="flex">
          {joined.slice(0, 7).map((i) => {
            const g = guestByEmail(GUESTS, i.email);
            return (
              <Face
                key={i.email}
                name={g?.name ?? i.email}
                seed={g?.seed ?? i.email}
                className={cn("size-7 text-xs", STACKED)}
              />
            );
          })}
        </span>
        <p className="text-xs text-muted-foreground tabular-nums">
          {`${joined.length} joined · ${waiting.length} not yet`}
        </p>
      </div>
      <ul className={cn(SHEET, "pt-1")}>
        {waiting.map((i) => (
          <Seat key={i.email} email={i.email} />
        ))}
      </ul>
    </section>
  );
}

/** Words that never part at a line's end ("9:12 PM", "4 photos"): their spaces held. */
const held = (words: string) => words.replaceAll(" ", "\u00a0");

function BlockedCard({
  p,
  card,
  onAnswer,
}: {
  p: BlockedPerson;
  card: CardWay;
  /** The way back pressed: the card leaves (it writes nothing). */
  onAnswer: () => void;
}) {
  const name = p.name?.trim() || "This guest";
  const declined = p.lands === "let_in";
  const act = letBackInAct(p.lands);
  const at = held(BLOCKED_AT[p.id] ?? "");
  return (
    <li data-gr-blocked-row={p.id} className={CARD}>
      <Person card={card} who={{ kind: "blocked", person: p }} id={p.id}>
        <span aria-hidden>
          <Face
            name={name}
            seed={p.seed}
            className={cn("size-12 text-base", GIVE)}
            dim
          />
        </span>
        <span className="w-full min-w-0">
          <span className="block truncate text-sm font-medium text-muted-foreground">
            {p.verified ? name : <MarkedName name={name} />}
          </span>
          <span className="block text-xs break-words text-faint">
            {p.email ? <AddressText email={p.email} /> : "Typed a name"}
          </span>
        </span>
      </Person>
      <div className="mt-auto flex w-full flex-col pt-3">
        {/* ★ "STILL ASKING" IS WHY ITS LET IN IS ONE PRESS: said before the press, as production's row says it. */}
        <p className="pb-2 text-caption text-balance text-muted-foreground">
          {declined
            ? `Declined ${at}, still asking`
            : `Blocked ${at}, ${held(photosWord(p.restorable))} in Deleted`}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          aria-label={`${act.label} ${name}`}
          onClick={onAnswer}
        >
          {act.label}
        </Button>
      </div>
    </li>
  );
}

function Blocked({ card }: { card: CardWay }) {
  const { gone, answer } = useAnswered();
  const blocked = BLOCKED.filter((p) => !gone.has(p.id));
  if (blocked.length === 0) return null;
  return (
    <section
      id="blocked"
      aria-label="Blocked"
      data-gr-blocked=""
      className="space-y-2"
    >
      <Head label="Blocked" count={blocked.length} />
      <Hint>{BLOCKED_NOTE}</Hint>
      <div className="pt-1">
        <Row count={blocked.length}>
          {blocked.map((p) => (
            <BlockedCard
              key={p.id}
              p={p}
              card={card}
              onAnswer={() => answer(p.id)}
            />
          ))}
        </Row>
      </div>
    </section>
  );
}

export function FacesRoom({ card }: { card: CardWay }) {
  return (
    <div data-guests-room="" data-gr-rows="faces" className="space-y-8">
      <Door card={card} />
      <In card={card} />
      <Invited />
      <Blocked card={card} />
    </div>
  );
}

/** The contact sheet, for the room that draws its guests as faces and everyone else as rows (`room-mixed.tsx`). */
export { In as FacesGuests };
