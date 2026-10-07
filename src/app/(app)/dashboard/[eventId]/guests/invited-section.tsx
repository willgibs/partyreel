"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  addInvitesAction,
  removeInviteAction,
} from "@/app/(app)/dashboard/[eventId]/guests/actions";
import {
  Address,
  Face,
  Hint,
} from "@/app/(app)/dashboard/[eventId]/guests/people";
import {
  ARRIVES,
  FOLD_FACES,
  Fold,
  ROW_LINE,
  RoomGroup,
  Words,
} from "@/app/(app)/dashboard/[eventId]/guests/room-rows";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { useUnparkAfterSave } from "@/components/app/event-settings/settings-state-unpark";
import { Button } from "@/components/ui/button";
import { Dormant } from "@/components/ui/dormant";
import { useAdoptTypedValue } from "@/lib/adopt-typed-value";
import { INVITE_LIST_CAP, readAddresses } from "@/lib/event/door/invite-list";
import { cameInLine } from "@/lib/event/door/words";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/** The list's two acts. The Library hands in acts that answer and change nothing. */
export type InviteActs = {
  add: typeof addInvitesAction;
  remove: typeof removeInviteAction;
};

const SERVER_INVITE_ACTS: InviteActs = {
  add: addInvitesAction,
  remove: removeInviteAction,
};

/** One address on the list, as the page hands it to the room. */
export type InvitedPerson = { email: string; joined: boolean };

/** A joined address's person, where the room already holds them: their face and name beside the address. */
export type InvitedFace = {
  name: string;
  seed: string | null;
  photo: string | null;
};

/** What the last save did, said under the field. */
type Tally = {
  added: number;
  already: number;
  overCap: number;
  /** People waiting at the door whom the list now named, and so came in (build 23's BUG-2). */
  admitted: number;
} | null;

/** Nothing hidden: the set a new read of the list starts from. */
const NONE: ReadonlySet<string> = new Set();

/**
 * INVITED, IN THE GUESTS ROOM (event-settings r1, `editor=both` with Will's note: "Could this be more
 * easily managed under 'Guests' with a pointer from here, so this settings page can't potentially
 * become a 200 person invite list?"). The door's step points here ("Manage in Guests").
 *
 * ★ ONE FIELD TAKES EITHER: type one and press Enter, or paste two hundred and they land (the board's
 * `both`). A paste is read into addresses and the entries that held none (`readAddresses`), the
 * readable ones saved at once and counted by the database, the unreadable ones kept in the field as
 * flagged chips to fix or drop, so the host sees exactly what did not make it. ★ THE FIELD IS THE HOUSE'S
 * WELL, AND HOLDS THE HOUSE'S HALO WHILE IT HOLDS THE CARET (the ROADMAP's focus stragglers: its focus was a 1px
 * border): the chips and the input stand in one well, which wears the halo for the input inside it (`data-halo`, the
 * house's way for an element that stands for a focus it does not hold).
 *
 * ★ ONE CALM ROW AN ADDRESS (guests-room r1, `rows=list`): who has not joined yet leads, each address beside an empty
 * seat in the faces' column (the initial they will arrive under) with its remove at the row's end; the joined fold
 * into one row wearing their faces, and open under it with the face and name the room holds for each. An address
 * matches only once its guest confirms it, so removing one never puts out someone it already let in. ★ A REMOVE BY
 * KEYBOARD KEEPS THE KEYBOARD IN THE LIST (the ROADMAP's focus stragglers: it dropped to the sheet): focus moves to
 * the next address's remove, else the one before it, else the field.
 *
 * ★ LISTING SOMEONE WHO WAITS LETS HER IN (build 23's BUG-2, 20260929220000): while the list is the door,
 * an address that asked at it comes in the moment it is listed, so she leaves At the door above (the
 * page's own read, revalidated by the save) and the line under the field says who came in.
 *
 * ★ A LIST NOBODY IS ON, UNDER A DOOR THAT IS NOT THE LIST, SLEEPS (crumbs-87, the gap audit): on a Public album the
 * room drew an INVITED header over a paste box that let nobody in and sent nothing, beside an Invite that only opens
 * the code card, so a host could read it as the way to invite her guests. It is a setting with no effect right now, so
 * it is the house's dormant one (`ui/dormant.tsx`, Will: "I don't want the no current effect settings to fully
 * disappear because they do an amazing job at hinting at unused features"): one quiet line that says what the list
 * does and what wakes it, and no field to type into. The door is chosen on Settings' own page, a different panel from
 * this room, so nothing here unfolds in front of her: the room draws the line while asleep and the list once awake. A
 * list that already holds addresses stays awake under any door, since they are hers to see and to remove.
 */
export function InvitedSection({
  eventId,
  invited,
  listIsTheDoor,
  faces,
  acts = SERVER_INVITE_ACTS,
}: {
  eventId: string;
  invited: InvitedPerson[];
  /** The invite list is the way in right now (Private, your invite list). */
  listIsTheDoor: boolean;
  /** A joined address's person by address, where the room holds them (its guests); left out, the address alone. */
  faces?: ReadonlyMap<string, InvitedFace>;
  acts?: InviteActs;
}) {
  const fieldId = useId();
  const statusId = useId();
  const joinedId = useId();
  const [typed, setTyped] = useState("");
  // ★ AN ADDRESS TYPED BEFORE THE PAGE HYDRATED IS NOT LOST (`adopt-typed-value.ts`): this is a bare
  // <input> over its own state, so it adopts through the hook the shared `Input` uses.
  const adoptRef = useAdoptTypedValue<HTMLInputElement>(typed);
  const fieldRef = useRef<HTMLInputElement | null>(null);
  const setField = useCallback(
    (el: HTMLInputElement | null) => {
      adoptRef(el);
      fieldRef.current = el;
    },
    [adoptRef],
  );
  const [focused, setFocused] = useState(false);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [tally, setTally] = useState<Tally>(null);
  const [joinedOpen, setJoinedOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // ★ A REMOVAL HIDES ITS ADDRESS ONLY UNTIL THE PAGE READS THE LIST AGAIN (build 23's NIT-4 shape, swept
  // here): the save revalidates the room, and from that read on the read is the truth, so an address
  // removed and added again comes back with the read that has it, rather than staying hidden all visit.
  const [removed, setRemoved] = useState<{
    from: InvitedPerson[];
    emails: ReadonlySet<string>;
  }>(() => ({ from: invited, emails: NONE }));
  const hidden = removed.from === invited ? removed.emails : NONE;
  const [saving, startSaving] = useTransition();
  /**
   * ★ "SAVING…" NEVER OUTLIVES ITS ANSWER (crumbs-89, red-team 57b's LOW): each act's Server Action revalidates the hub,
   * and after a hard load React could park that commit for good, so `saving` held "Saving… 0 on the list" while the
   * database held the address, until the room was opened again. Once an act has answered and the room still waits on
   * its commit, it is nudged (`settings-state-unpark.ts` has the cause), and the room's read lands with it.
   */
  const unpark = useUnparkAfterSave(saving);

  const list = invited.filter((p) => !hidden.has(p.email));
  const waiting = list.filter((p) => !p.joined);
  const joined = list.filter((p) => p.joined);
  const full = list.length >= INVITE_LIST_CAP;

  function take(input: string) {
    const { addresses, unreadable } = readAddresses(input);
    if (unreadable.length > 0) {
      setFlagged((f) => [...new Set([...f, ...unreadable])]);
    }
    setTyped("");
    if (addresses.length === 0) return;
    startSaving(async () => {
      const result = await acts.add({ eventId, emails: addresses });
      unpark();
      if (!result.ok) {
        // Nothing landed: the addresses go back into the field, to try again.
        setTyped(addresses.join(", "));
        toast.error("Couldn't add those addresses.", {
          description: result.message,
        });
        return;
      }
      setTally({
        added: result.result.added,
        already: result.result.already,
        overCap: result.result.overCap,
        admitted: result.result.admitted,
      });
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (typed.trim()) take(typed);
    }
    if (event.key === "Backspace" && typed === "" && flagged.length > 0) {
      setFlagged((f) => f.slice(0, -1));
    }
  }

  /**
   * Where the keyboard goes once an address leaves: the remove that takes its place (the next address's), else the one
   * before it, else the field. Read off the list as drawn before the address leaves it.
   */
  function keepFocus(email: string) {
    const removes = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-invited-remove]",
      ) ?? []),
    ];
    const at = removes.findIndex((b) => b.dataset.invitedRemove === email);
    const next = removes[at + 1] ?? removes[at - 1] ?? null;
    window.requestAnimationFrame(() => {
      if (next?.isConnected) next.focus();
      else fieldRef.current?.focus();
    });
  }

  function remove(email: string, byKeyboard: boolean) {
    if (byKeyboard) keepFocus(email);
    setRemoved((r) => ({
      from: invited,
      emails: new Set([...(r.from === invited ? r.emails : NONE), email]),
    }));
    startSaving(async () => {
      const result = await acts.remove({ eventId, email });
      unpark();
      if (!result.ok) {
        setRemoved((r) => {
          const next = new Set(r.emails);
          next.delete(email);
          return { from: r.from, emails: next };
        });
        toast.error("Couldn't remove that address.", {
          description: result.message,
        });
      }
    });
  }

  const status = tally
    ? [
        tally.added > 0 ? `${formatCount(tally.added)} added.` : null,
        tally.already > 0
          ? `${formatCount(tally.already)} were already on it.`
          : null,
        tally.overCap > 0
          ? `${formatCount(tally.overCap)} left off: the list holds ${formatCount(INVITE_LIST_CAP)}.`
          : null,
        tally.admitted > 0 ? cameInLine(tally.admitted) : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const doorLink = (
    <Link
      href={settingsPageHref(eventId, "door")}
      className="focus-halo rounded-sm font-medium text-foreground underline underline-offset-4 outline-none"
    >
      Change who can get in
    </Link>
  );

  // Nobody on it and not the door: nothing for a field to do yet. Read off `invited`, never `list`, so an address she
  // removes from a list she was holding does not fold the section under her hand before the room reads the list again.
  if (!listIsTheDoor && invited.length === 0) {
    return (
      <section
        id="invited"
        aria-label="Invited"
        data-invited-section=""
        data-invited-asleep=""
        className="space-y-2"
      >
        <FeedSectionHeader label="Invited" />
        <Dormant
          awake={false}
          summary={
            <>
              {
                "Your invite list isn't the way in right now, so it does nothing yet. When it is, the addresses you add come straight in once they confirm their email. It sends nothing to them. "
              }
              {doorLink}
            </>
          }
        >
          {null}
        </Dormant>
      </section>
    );
  }

  const removeKey = (email: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      title="Remove"
      aria-label={`Remove ${email}`}
      data-invited-remove={email}
      // A press by keyboard (Enter or Space reach `click` with no pointer: `detail` 0) keeps the keyboard in the list.
      onClick={(e) => remove(email, e.detail === 0)}
    >
      <X />
    </Button>
  );

  return (
    <section
      id="invited"
      aria-label="Invited"
      data-invited-section=""
      className="space-y-2"
    >
      <FeedSectionHeader label="Invited" count={list.length} />

      <div
        data-halo={focused ? "" : undefined}
        className={cn(
          "flex focus-halo flex-wrap gap-1.5 rounded-lg field-well p-2",
          full && "opacity-60",
        )}
      >
        {flagged.map((entry) => (
          <span
            key={entry}
            data-invite-flagged=""
            className="flex h-7 max-w-full items-center gap-1 rounded-full border border-destructive/50 bg-destructive/5 py-0.5 pr-1 pl-2.5 text-xs text-destructive"
          >
            <span className="truncate">{entry}</span>
            <button
              type="button"
              aria-label={`Drop ${entry}`}
              onClick={() => setFlagged((f) => f.filter((x) => x !== entry))}
              className="flex size-5 focus-halo items-center justify-center rounded-full outline-none hover:bg-destructive/10"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <label htmlFor={fieldId} className="sr-only">
          Add or paste addresses
        </label>
        <input
          ref={setField}
          id={fieldId}
          type="email"
          inputMode="email"
          autoComplete="off"
          multiple
          disabled={full}
          value={typed}
          placeholder={full ? "The list is full" : "Add or paste addresses"}
          aria-describedby={statusId}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!text) return;
            e.preventDefault();
            take(`${typed} ${text}`);
          }}
          onBlur={() => {
            setFocused(false);
            if (typed.trim()) take(typed);
          }}
          className="h-7 min-w-40 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className="text-xs text-pretty text-muted-foreground"
      >
        {saving ? "Saving…" : status}
        {flagged.length > 0
          ? ` ${formatCount(flagged.length)} ${flagged.length === 1 ? "needs" : "need"} a look.`
          : ""}
        {` ${formatCount(list.length)} on the list, ${formatCount(joined.length)} joined.`}
      </p>

      {list.length > 0 ? (
        <div ref={listRef}>
          <RoomGroup>
            {waiting.length > 0 ? (
              <>
                {/* The column's head, over the addresses it names, in the words' column rather than the seats'. */}
                <p className="pt-3 pr-3 pb-1 pl-16 text-caption text-muted-foreground">
                  {"Not yet "}
                  <span className="tabular-nums">{`· ${formatCount(waiting.length)}`}</span>
                </p>
                <ul aria-label="Not joined yet">
                  {waiting.map((person) => (
                    <li
                      key={person.email}
                      data-invited={person.email}
                      className={cn(
                        ROW_LINE,
                        "flex min-h-11 items-center gap-3 pr-1.5 pl-3",
                      )}
                    >
                      {/* An empty seat in the faces' column: the initial they will arrive under. */}
                      <span className="flex w-10 shrink-0 justify-center">
                        <span
                          aria-hidden
                          className="flex size-8 items-center justify-center rounded-full border border-dashed border-foreground/30 text-caption text-muted-foreground"
                        >
                          {person.email.slice(0, 1).toUpperCase()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                        <Address email={person.email} chars={30} />
                      </span>
                      {removeKey(person.email)}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {joined.length > 0 ? (
              <>
                <Fold
                  faces={joined.slice(0, FOLD_FACES).map((p) => {
                    const face = faces?.get(p.email);
                    return {
                      key: p.email,
                      name: face?.name ?? p.email,
                      seed: face?.seed ?? p.email,
                    };
                  })}
                  expanded={joinedOpen}
                  controls={joinedId}
                  onPress={() => setJoinedOpen((o) => !o)}
                  data-invited-joined=""
                >
                  {`${formatCount(joined.length)} joined`}
                </Fold>
                {joinedOpen ? (
                  <ul id={joinedId} aria-label="Joined" className="border-t">
                    {joined.map((person) => {
                      const face = faces?.get(person.email);
                      return (
                        <li
                          key={person.email}
                          data-invited={person.email}
                          className={cn(
                            ROW_LINE,
                            ARRIVES,
                            "flex min-h-14 items-center gap-3 py-2 pr-1.5 pl-3",
                          )}
                        >
                          <Face
                            name={face?.name ?? person.email}
                            seed={face?.seed ?? person.email}
                            photo={face?.photo ?? null}
                            className="size-10"
                          />
                          <Words
                            name={face?.name ?? person.email}
                            line={
                              face ? (
                                <Address email={person.email} chars={28} />
                              ) : (
                                "Joined"
                              )
                            }
                          />
                          {removeKey(person.email)}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </>
            ) : null}
          </RoomGroup>
        </div>
      ) : null}
      <Hint>
        {listIsTheDoor ? (
          "Your list is the door: these come straight in once they confirm. Anyone else can ask you."
        ) : (
          <>
            {
              "Your list lets these addresses in while the invite list is the way in. "
            }
            {doorLink}
          </>
        )}
      </Hint>
    </section>
  );
}
