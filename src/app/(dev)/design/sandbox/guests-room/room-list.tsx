"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BLOCKED_NOTE, letBackInAct } from "@/lib/events/event-blocks";
import { cn } from "@/lib/utils";

import { type CardWay, PersonCard } from "./card";
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
 *  - At the door: how long ago beside the name, the address under it (kept
 *    whole at its domain), Decline quiet beside Let in, never wrapped under.
 *  - In: a row each, their photos here at its end (a read the list does not
 *    carry today), the first eight and Show all; a name opens their card.
 *  - Invited: who has not joined yet leads, a line each; the joined fold into
 *    one row (they are in the room above), wearing their faces.
 *  - Blocked: a dimmed face and the line that says where the act takes them
 *    ("still asking" is why Let in is one press), the act quiet.
 *
 * Invite stands in the In head, where more people come in, rather than alone
 * on a line of its own.
 */

/** The inset-grouped list every section's rows stand in. */
function Group({
  children,
  quiet = false,
}: {
  children: ReactNode;
  quiet?: boolean;
}) {
  return (
    <ul
      className={cn(
        "overflow-hidden rounded-xl border",
        quiet ? "bg-muted/25" : "bg-card",
      )}
    >
      {children}
    </ul>
  );
}

/** A row's hairline, starting past the face (the inset-grouped list's), on the list item. */
const LINE =
  "relative before:absolute before:top-0 before:right-0 before:left-[3.75rem] before:h-px before:bg-border first:before:hidden";

/** A row's body: the face, the words and the act on one line. */
const BODY = "flex min-h-14 items-center gap-3 px-3 py-2";

const ROW = `${LINE} ${BODY}`;

/** A row's words: the name (and what stands beside it), and the one line under it. */
function Words({
  name,
  aside,
  line,
  mark,
  muted = false,
  wraps = false,
}: {
  name: ReactNode;
  aside?: ReactNode;
  line?: ReactNode;
  mark?: ReactNode;
  muted?: boolean;
  /** A line that may take two (Blocked's, at the foot), where cutting it would hide what the act does. */
  wraps?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          "flex min-w-0 items-baseline gap-1.5 text-sm font-medium",
          muted && "text-muted-foreground",
        )}
      >
        <span className="truncate">{name}</span>
        {mark ? <span className="self-center">{mark}</span> : null}
        {aside ? (
          <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
            {aside}
          </span>
        ) : null}
      </p>
      {line ? (
        <p
          className={cn(
            "min-w-0 text-xs text-muted-foreground",
            wraps ? "text-pretty" : "truncate",
          )}
        >
          {line}
        </p>
      ) : null}
    </div>
  );
}

function Door({ card }: { card: CardWay }) {
  return (
    <section
      id="at-the-door"
      aria-label="At the door"
      data-gr-door=""
      className="space-y-2"
    >
      <Head label="At the door" count={AT_THE_DOOR.length} needs />
      <Hint>Let in opens the album for them. Declining blocks them.</Hint>
      <Group>
        {AT_THE_DOOR.map((p) => {
          const name = doorName(p);
          const asked = ASKED_SHORT[p.guestId];
          return (
            <li key={p.guestId} className={ROW} data-gr-door-row={p.guestId}>
              <PersonCard way={card} who={{ kind: "door", person: p }}>
                <button
                  type="button"
                  data-gr-name={p.guestId}
                  className="flex min-w-0 flex-1 focus-halo items-center gap-3 rounded-lg text-left outline-none"
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
                    <Words
                      name={<Address email={p.email ?? name} chars={18} />}
                      line={
                        asked === "now"
                          ? "Asked just now"
                          : `Asked ${asked} ago`
                      }
                    />
                  )}
                </button>
              </PersonCard>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  title="Decline"
                  aria-label={`Decline ${name}`}
                >
                  <X />
                </Button>
                <Button size="sm" aria-label={`Let in ${name}`}>
                  Let in
                </Button>
              </div>
            </li>
          );
        })}
      </Group>
    </section>
  );
}

const IN_FIRST = 8;

/** Who added most first (ROADMAP's sort by upload count): the night's photographers lead her list. */
const BY_PHOTOS = [...GUESTS].sort(
  (a, b) => b.photos - a.photos || a.name.localeCompare(b.name),
);

function In({ card }: { card: CardWay }) {
  const [all, setAll] = useState(false);
  const shown = all ? BY_PHOTOS : BY_PHOTOS.slice(0, IN_FIRST);
  return (
    <section id="in" aria-label="In" data-gr-in="" className="space-y-2">
      <Head
        label="In"
        count={GUESTS.length}
        action={
          <Button variant="outline" size="sm">
            <UserPlus data-icon="inline-start" />
            Invite
          </Button>
        }
      />
      <Group>
        {shown.map((g) => (
          <li key={g.id} className={LINE}>
            <PersonCard way={card} who={{ kind: "in", guest: g }}>
              <button
                type="button"
                data-gr-name={g.id}
                className={cn(
                  BODY,
                  "w-full text-left outline-none hover:bg-muted/40 focus-visible:bg-muted/40",
                )}
              >
                <Face name={g.name} seed={g.seed} className="size-10" />
                <Words
                  name={g.name}
                  mark={g.unverified ? <MarkGlyph /> : undefined}
                  line={g.email ?? "Typed a name"}
                />
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {photosWord(g.photos)}
                </span>
              </button>
            </PersonCard>
          </li>
        ))}
        {all ? null : (
          <li className="border-t">
            <button
              type="button"
              data-gr-show-all=""
              onClick={() => setAll(true)}
              className="flex h-11 w-full items-center justify-center gap-1 text-sm text-muted-foreground outline-none hover:bg-muted/40 hover:text-foreground focus-visible:bg-muted/40"
            >
              {`Show all ${GUESTS.length}`}
              <ChevronDown className="size-4" aria-hidden />
            </button>
          </li>
        )}
      </Group>
    </section>
  );
}

/** A remove, quiet, at a row's end. */
function Remove({ email }: { email: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground"
      aria-label={`Remove ${email}`}
    >
      <X />
    </Button>
  );
}

function Invited() {
  const [joinedOpen, setJoinedOpen] = useState(false);
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
      <Group>
        <li className="px-3 pt-2.5 pb-1 text-label font-semibold text-muted-foreground uppercase">
          {`Not yet · ${waiting.length}`}
        </li>
        {waiting.map((i) => (
          <li
            key={i.email}
            className="flex min-h-11 items-center gap-3 pr-1.5 pl-3"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-foreground/30 text-xs text-muted-foreground"
            >
              {i.email.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {i.email}
            </span>
            <Remove email={i.email} />
          </li>
        ))}
        <li className="border-t">
          <button
            type="button"
            onClick={() => setJoinedOpen((o) => !o)}
            aria-expanded={joinedOpen}
            className="flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm outline-none hover:bg-muted/40 focus-visible:bg-muted/40"
          >
            <span className="flex -space-x-1.5">
              {joined.slice(0, 5).map((i) => {
                const g = guestByEmail(GUESTS, i.email);
                return (
                  <Face
                    key={i.email}
                    name={g?.name ?? i.email}
                    seed={g?.seed ?? i.email}
                    className="size-6 text-[10px] ring-2 ring-card"
                  />
                );
              })}
            </span>
            <span className="flex-1">{`${joined.length} joined`}</span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                joinedOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </li>
        {joinedOpen
          ? joined.map((i) => {
              const g = guestByEmail(GUESTS, i.email);
              return (
                <li key={i.email} className={ROW}>
                  <Face
                    name={g?.name ?? i.email}
                    seed={g?.seed ?? i.email}
                    className="size-10"
                  />
                  <Words name={g?.name ?? i.email} line={i.email} />
                  <Remove email={i.email} />
                </li>
              );
            })
          : null}
      </Group>
    </section>
  );
}

function Blocked({ card }: { card: CardWay }) {
  return (
    <section
      id="blocked"
      aria-label="Blocked"
      data-gr-blocked=""
      className="space-y-2"
    >
      <Head label="Blocked" count={BLOCKED.length} />
      <Hint>{BLOCKED_NOTE}</Hint>
      <Group quiet>
        {BLOCKED.map((p) => {
          const name = p.name?.trim() || "This guest";
          const declined = p.lands === "let_in";
          return (
            <li key={p.id} className={ROW} data-gr-blocked-row={p.id}>
              <PersonCard way={card} who={{ kind: "blocked", person: p }}>
                <button
                  type="button"
                  data-gr-name={p.id}
                  className="flex min-w-0 flex-1 focus-halo items-center gap-3 rounded-lg text-left outline-none"
                >
                  <Face name={name} seed={p.seed} className="size-10" dim />
                  <Words
                    name={name}
                    muted
                    wraps
                    line={
                      declined
                        ? `Declined ${BLOCKED_AT[p.id]} · still asking`
                        : `Blocked ${BLOCKED_AT[p.id]} · ${photosWord(p.restorable)} in Deleted`
                    }
                  />
                </button>
              </PersonCard>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                aria-label={`${letBackInAct(p.lands).label} ${name}`}
              >
                {letBackInAct(p.lands).label}
              </Button>
            </li>
          );
        })}
      </Group>
    </section>
  );
}

export function ListRoom({ card }: { card: CardWay }) {
  return (
    <div data-guests-room="" data-gr-rows="list" className="space-y-7">
      <Door card={card} />
      <In card={card} />
      <Invited />
      <Blocked card={card} />
    </div>
  );
}
