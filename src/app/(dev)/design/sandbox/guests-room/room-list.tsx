"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BLOCKED_NOTE,
  isLetIn,
  letBackInAct,
  type BlockedPerson,
} from "@/lib/events/event-blocks";
import { formatCount } from "@/lib/format/count";
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
  Address,
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
 * ONE CALM ROW FOR EVERYONE (the `rows` ask's `list`): every person in the
 * room is the same row, wherever they stand: a face, the name, one quiet line
 * that says how they stand, and at most one act at its end, on the same line
 * at a phone. The room's one solid press is Let in at the door (attention
 * earned: the one thing that waits on her), and its count wears the tally the
 * hub's Guests card wears; everything else is quiet.
 *
 * ★ APPLE'S INSET-GROUPED LIST, IN THE HOUSE'S OWN CARD: a section is its
 * eyebrow, one card of rows and a footnote under the card saying what its acts
 * do, so the first thing under a head is people. The card is Settings' own
 * (`settings-furniture.tsx`: its tone, its ring, its corner), since the two rooms
 * stand in one panel; its hairlines start where the words start, never under a
 * face, and every row keeps one column of faces and one of words.
 *
 *  - At the door: how long they have waited beside the name, the address under
 *    it as the proof; a nameless person's address stands as the name, whole
 *    where the row has room and shortened from the middle where it has not,
 *    its domain whole either way. Decline is the quiet ✕ beside Let in, never
 *    wrapped under.
 *  - In: a row each, most photos first, their count a column at the row's end
 *    (a read the list does not carry today); the first eight, then a fold
 *    wearing the next faces.
 *  - Invited: who has not joined yet leads, each address beside an empty seat;
 *    the joined fold into one row wearing their faces, and open under it.
 *  - Blocked: the quiet foot, an unlit card: a dimmed face, when beside the
 *    name as at the door, and how they left under it ("still asking" is why
 *    Let in is one press there; what waits in Deleted is what Let back in's
 *    confirm offers), the act quiet.
 *
 * Invite stands in the In head, where more people come in, rather than alone
 * on a line of its own.
 */

/** The card every section's rows stand in: Settings' group, so the rooms in the one panel match. */
function Group({
  unlit = false,
  children,
}: {
  /** Blocked's: the ring alone, no tone, as a light that is off. */
  unlit?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg ring-1 ring-foreground/10",
        unlit ? "bg-transparent" : "bg-card text-card-foreground",
      )}
    >
      {children}
    </div>
  );
}

/**
 * A row's hairline, from where the words start (12 + the 40px face + 12) to the
 * card's end: the faces stand in one unbroken column, as an inset list's do.
 */
const LINE =
  "relative before:absolute before:top-0 before:right-0 before:left-16 before:h-px before:bg-border first:before:hidden";

/** A row's body: the face, the words and the act on one line. */
const BODY = "flex min-h-14 items-center gap-3 px-3 py-2";

/**
 * A whole row that opens a card: Settings' rows' own hover (`settings-rows.tsx`),
 * so a row answers a pointer alike in both rooms of the panel, and the house's
 * halo drawn inside it, since the card clips.
 */
const PRESS =
  "w-full text-left outline-none focus-halo halo-inset transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none";

/** Rows a fold lets out arrive as a fade, never a jump; still under reduced motion. */
const ARRIVES =
  "transition-opacity duration-200 ease-emphasis motion-reduce:transition-none motion-safe:starting:opacity-0";

/** A row's words: the name (and what stands beside it), and the one line under it. */
function Words({
  name,
  aside,
  line,
  mark,
  quiet = false,
  className,
}: {
  name: ReactNode;
  /** When, beside the name: how long they have waited at the door, when a block landed. */
  aside?: ReactNode;
  line?: ReactNode;
  mark?: ReactNode;
  quiet?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <p
        className={cn(
          "flex min-w-0 items-baseline gap-1.5 text-sm font-medium",
          quiet && "text-muted-foreground",
        )}
      >
        <span className="truncate">{name}</span>
        {mark ? <span className="self-center">{mark}</span> : null}
        {aside ? (
          <span className="shrink-0 text-caption font-normal text-muted-foreground tabular-nums">
            {aside}
          </span>
        ) : null}
      </p>
      {line ? (
        <p className="mt-0.5 truncate text-caption text-muted-foreground">
          {line}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A NAME AND ITS FACE, as the press that opens their card where the `card`
 * answer opens one from this standing, and as plain words where it opens none:
 * a press that does nothing is a lie to a finger and a screen reader alike.
 */
function NamePress({
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
  const shape = "flex min-w-0 flex-1 items-center gap-3";
  if (!opensCard(card, who.kind))
    return (
      <div data-gr-name={id} className={shape}>
        {children}
      </div>
    );
  return (
    <PersonCard way={card} who={who}>
      <button
        type="button"
        data-gr-name={id}
        className={cn(shape, "focus-halo rounded-lg text-left outline-none")}
      >
        {children}
      </button>
    </PersonCard>
  );
}

/**
 * ★ AN ANSWERED ROW LEAVES, AS PRODUCTION'S DOES (`at-the-door.tsx`): a press
 * here writes nothing, and the row goes at once with the tally a count down,
 * so a press in a frame answers as the room would.
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
  const decline = declineOnRow(card);
  if (waiting.length === 0) return null;
  return (
    <section
      id="at-the-door"
      aria-label="At the door"
      data-gr-door=""
      className="space-y-2"
    >
      <Head label="At the door" count={waiting.length} needs />
      <Group>
        <ul>
          {waiting.map((p) => {
            const name = doorName(p);
            const asked = ASKED_SHORT[p.guestId];
            const at = (p.email ?? "").lastIndexOf("@");
            return (
              <li
                key={p.guestId}
                data-gr-door-row={p.guestId}
                className={cn(
                  LINE,
                  "flex min-h-14 items-center gap-2 px-3 py-2",
                )}
              >
                <NamePress
                  card={card}
                  who={{ kind: "door", person: p }}
                  id={p.guestId}
                >
                  <Face name={name} seed={p.seed} className="size-10" />
                  {p.name ? (
                    <Words
                      name={name}
                      aside={asked}
                      line={
                        p.email ? (
                          <Address email={p.email} chars={25} />
                        ) : undefined
                      }
                    />
                  ) : (
                    // ★ NO NAME YET, SO THE ADDRESS IS THE NAME, split at its @ as a named row is split
                    // between its name and its address: the part before stands where a name would, with how
                    // long ago beside it, and the domain under it, whole.
                    <Words
                      name={
                        <>
                          <span className="sr-only">{p.email}</span>
                          <span aria-hidden title={p.email ?? undefined}>
                            {at > 0 ? p.email!.slice(0, at) : name}
                          </span>
                        </>
                      }
                      aside={asked}
                      line={
                        at > 0 ? (
                          <span aria-hidden>{p.email!.slice(at)}</span>
                        ) : undefined
                      }
                    />
                  )}
                </NamePress>
                {/* ★ DECLINE IS A GLYPH, LET IN THE WORD: the ✕ gives the words the width a second word would
                    take at 375, and the gap between the two keeps a thumb off the block. Under the standing
                    card the ✕ leaves the row for the card, where a decline is explained (`declineOnRow`). */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {decline ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      title="Decline"
                      aria-label={`Decline ${name}`}
                      onClick={() => answer(p.guestId)}
                    >
                      <X />
                      <span className="sr-only">Decline</span>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    aria-label={`Let in ${name}`}
                    onClick={() => answer(p.guestId)}
                  >
                    Let in
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Group>
      <Hint>
        {decline
          ? "Let in opens the album for them. Declining blocks them."
          : "Let in opens the album for them. A name opens Decline, which blocks them."}
      </Hint>
    </section>
  );
}

/**
 * THEIR PHOTOS HERE, AS A COLUMN: the figure on tabular figures, a weight above
 * its word, so the rows read down as one column (they stand most first). ★ A
 * SINGULAR KEEPS ITS PLURAL'S WIDTH: "1 photo" holds the "s" it drops, unseen,
 * so its figure stands under the figures above it rather than a letter right.
 */
function Photos({ n }: { n: number }) {
  return (
    <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
      <span className="font-medium">{formatCount(n)}</span>
      {n === 1 ? (
        <>
          {" photo"}
          <span className="invisible">s</span>
        </>
      ) : (
        " photos"
      )}
    </span>
  );
}

/**
 * A FOLD: one row standing for the rows it holds back, wearing the first few of
 * their faces, so a fold of people still reads as people. In's lets the rest of
 * the list out where it stands; Invited's opens the joined under it, and closes
 * again (`expanded`).
 */
function Fold({
  faces,
  expanded,
  controls,
  onPress,
  children,
  ...data
}: {
  faces: readonly { key: string; name: string; seed: string }[];
  /** A disclosure's state; left out, the fold lets its rows out once and goes. */
  expanded?: boolean;
  controls?: string;
  onPress: () => void;
  children: ReactNode;
} & Record<`data-${string}`, string>) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn(
        "flex min-h-12 items-center gap-3 border-t px-3 text-sm",
        PRESS,
      )}
      {...data}
    >
      {/* ★ THE FACES STAND IN THE FACE COLUMN, the words on the words' own line: three faces at 20px, a
          half over each other, are the column's 40px, so "23 more" starts where every name above it starts. */}
      <span className="flex w-10 shrink-0 justify-center -space-x-2.5">
        {faces.slice(0, 3).map((f) => (
          <Face
            key={f.key}
            name={f.name}
            seed={f.seed}
            className="size-5 text-micro ring-2 ring-card"
          />
        ))}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronDown
        aria-hidden
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-in-out-strong motion-reduce:transition-none",
          expanded && "rotate-180",
        )}
      />
    </button>
  );
}

const IN_FIRST = 8;

/** The faces a fold wears: the same in both, so the two folds' words start in one place. */
const FOLD_FACES = 4;

/** Who added most first (ROADMAP's sort by upload count): the night's photographers lead her list. */
const BY_PHOTOS = [...GUESTS].sort(
  (a, b) => b.photos - a.photos || a.name.localeCompare(b.name),
);

/**
 * ★ A FOLD LETS OUT A PAGE, NEVER THE WHOLE PARTY (Will, `list=faces`, 2026-09-19: "you click 'View All', and
 * all of a sudden you have a page 100 screens tall all at once"): the guests' names panel's own page of 24.
 */
const IN_PAGE = 24;

function In({ card }: { card: CardWay }) {
  const [count, setCount] = useState(IN_FIRST);
  const list = useRef<HTMLUListElement>(null);
  const shown = BY_PHOTOS.slice(0, count);
  const rest = BY_PHOTOS.slice(count);
  const next = Math.min(IN_PAGE, rest.length);
  // ★ FOCUS FOLLOWS THE FOLD: rows it held arrive under it, so the keyboard lands on the first of them
  // rather than falling to the page (a pointer's press keeps no halo there).
  const before = useRef(IN_FIRST);
  useEffect(() => {
    if (count === before.current) return;
    list.current?.children[before.current]?.querySelector("button")?.focus({
      preventScroll: true,
    });
    before.current = count;
  }, [count]);
  return (
    <section id="in" aria-label="Guests" data-gr-in="" className="space-y-2">
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
      <Group>
        <ul ref={list}>
          {shown.map((g, i) => (
            <li key={g.id} className={cn(LINE, i >= IN_FIRST && ARRIVES)}>
              <PersonCard way={card} who={{ kind: "in", guest: g }}>
                <button
                  type="button"
                  data-gr-name={g.id}
                  className={cn(BODY, PRESS)}
                >
                  <Face name={g.name} seed={g.seed} className="size-10" />
                  <Words
                    name={g.name}
                    mark={g.unverified ? <MarkGlyph /> : undefined}
                    line={
                      g.email ? (
                        <Address email={g.email} chars={28} />
                      ) : (
                        "Typed a name"
                      )
                    }
                  />
                  <Photos n={g.photos} />
                </button>
              </PersonCard>
            </li>
          ))}
        </ul>
        {next === 0 ? null : (
          <Fold
            faces={rest
              .slice(0, FOLD_FACES)
              .map((g) => ({ key: g.id, name: g.name, seed: g.seed }))}
            onPress={() => setCount((n) => n + IN_PAGE)}
            data-gr-show-all=""
          >
            {`${next} more`}
            <span className="sr-only">{`, of ${GUESTS.length} guests`}</span>
          </Fold>
        )}
      </Group>
    </section>
  );
}

/** A remove, quiet, at a row's end, its glyph standing where the rows' ends stand. */
function Remove({ email }: { email: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      title="Remove"
      aria-label={`Remove ${email}`}
    >
      <X />
    </Button>
  );
}

function Invited() {
  const [joinedOpen, setJoinedOpen] = useState(false);
  const joinedId = useId();
  const waiting = INVITED.filter((i) => !i.joined);
  const joined = INVITED.filter((i) => i.joined);
  const faceOf = (email: string) => {
    const g = guestByEmail(GUESTS, email);
    return { key: email, name: g?.name ?? email, seed: g?.seed ?? email };
  };
  return (
    <section
      id="invited"
      aria-label="Invited"
      data-gr-invited=""
      className="space-y-2"
    >
      <Head label="Invited" count={INVITED.length} />
      <InviteField />
      <Group>
        {/* The column's head, over the addresses it names, in the words' column rather than the seats'. */}
        <p className="pt-3 pr-3 pb-1 pl-16 text-caption text-muted-foreground">
          {"Not yet "}
          <span className="tabular-nums">{`· ${waiting.length}`}</span>
        </p>
        <ul aria-label="Not joined yet">
          {waiting.map((i) => (
            <li
              key={i.email}
              className={cn(
                LINE,
                "flex min-h-11 items-center gap-3 pr-1.5 pl-3",
              )}
            >
              {/* An empty seat in the faces' column: the initial they will arrive under. */}
              <span className="flex w-10 shrink-0 justify-center">
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full border border-dashed border-foreground/30 text-caption text-muted-foreground"
                >
                  {i.email.slice(0, 1).toUpperCase()}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                <Address email={i.email} chars={30} />
              </span>
              <Remove email={i.email} />
            </li>
          ))}
        </ul>
        <Fold
          faces={joined.slice(0, FOLD_FACES).map((i) => faceOf(i.email))}
          expanded={joinedOpen}
          controls={joinedId}
          onPress={() => setJoinedOpen((o) => !o)}
        >
          {`${joined.length} joined`}
        </Fold>
        {joinedOpen ? (
          <ul id={joinedId} aria-label="Joined" className="border-t">
            {joined.map((i) => {
              const g = guestByEmail(GUESTS, i.email);
              return (
                <li
                  key={i.email}
                  className={cn(
                    LINE,
                    ARRIVES,
                    "flex min-h-14 items-center gap-3 py-2 pr-1.5 pl-3",
                  )}
                >
                  <Face
                    name={g?.name ?? i.email}
                    seed={g?.seed ?? i.email}
                    className="size-10"
                  />
                  <Words
                    name={g?.name ?? i.email}
                    line={<Address email={i.email} chars={28} />}
                  />
                  <Remove email={i.email} />
                </li>
              );
            })}
          </ul>
        ) : null}
      </Group>
      <Hint>
        Your list is the door: these come straight in once they confirm.
      </Hint>
    </section>
  );
}

/** How they left, under a blocked name: the decline's ask that stands, or what of theirs waits in Deleted. */
function leftLine(p: BlockedPerson): string {
  if (isLetIn(p.lands)) return "Declined · still asking";
  return p.restorable > 0
    ? `Blocked · ${photosWord(p.restorable)} in Deleted`
    : "Blocked";
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
      <Group unlit>
        <ul>
          {blocked.map((p) => {
            const name = p.name?.trim() || "This guest";
            const act = letBackInAct(p.lands);
            return (
              <li
                key={p.id}
                data-gr-blocked-row={p.id}
                className={cn(
                  LINE,
                  "flex min-h-14 items-center gap-2 px-3 py-2",
                )}
              >
                <NamePress
                  card={card}
                  who={{ kind: "blocked", person: p }}
                  id={p.id}
                >
                  <Face name={name} seed={p.seed} className="size-10" dim />
                  <Words
                    name={name}
                    quiet
                    aside={BLOCKED_AT[p.id]}
                    line={leftLine(p)}
                  />
                </NamePress>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  aria-label={`${act.label} ${name}`}
                  onClick={() => answer(p.id)}
                >
                  {act.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </Group>
      <Hint>{BLOCKED_NOTE}</Hint>
    </section>
  );
}

export function ListRoom({ card }: { card: CardWay }) {
  return (
    <div data-guests-room="" data-gr-rows="list" className="space-y-8">
      <Door card={card} />
      <In card={card} />
      <Invited />
      <Blocked card={card} />
    </div>
  );
}

/** The list's sections, for the room that draws its guests as faces and everyone else as rows (`room-mixed.tsx`). */
export { Blocked as ListBlocked, Door as ListDoor, Invited as ListInvited };
