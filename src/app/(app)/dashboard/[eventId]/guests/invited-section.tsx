"use client";

import { useId, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  addInvitesAction,
  removeInviteAction,
} from "@/app/(app)/dashboard/[eventId]/guests/actions";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { Button } from "@/components/ui/button";
import { INVITE_LIST_CAP, readAddresses } from "@/lib/event/door/invite-list";
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

/** What the last save did, said under the field. */
type Tally = { added: number; already: number; overCap: number } | null;

/**
 * INVITED, IN THE GUESTS ROOM (event-settings r1, `editor=both` with Will's note: "Could this be more
 * easily managed under 'Guests' with a pointer from here, so this settings page can't potentially
 * become a 200 person invite list?"). The door's step points here ("Manage in Guests").
 *
 * ★ ONE FIELD TAKES EITHER: type one and press Enter, or paste two hundred and they land (the board's
 * `both`). A paste is read into addresses and the entries that held none (`readAddresses`), the
 * readable ones saved at once and counted by the database, the unreadable ones kept in the field as
 * flagged chips to fix or drop, so the host sees exactly what did not make it.
 *
 * ★ EACH ADDRESS SAYS WHETHER IT JOINED: an address matches only once its guest confirms it, so the
 * list reads Joined or Not yet, and removing one never puts out someone it already let in.
 */
export function InvitedSection({
  eventId,
  invited,
  listIsTheDoor,
  acts = SERVER_INVITE_ACTS,
}: {
  eventId: string;
  invited: InvitedPerson[];
  /** The invite list is the way in right now (Private, your invite list). */
  listIsTheDoor: boolean;
  acts?: InviteActs;
}) {
  const fieldId = useId();
  const statusId = useId();
  const [typed, setTyped] = useState("");
  const [flagged, setFlagged] = useState<string[]>([]);
  const [tally, setTally] = useState<Tally>(null);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [saving, startSaving] = useTransition();

  const list = invited.filter((p) => !removed.has(p.email));
  const joined = list.filter((p) => p.joined).length;
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

  function remove(email: string) {
    setRemoved((s) => new Set([...s, email]));
    startSaving(async () => {
      const result = await acts.remove({ eventId, email });
      if (!result.ok) {
        setRemoved((s) => {
          const next = new Set(s);
          next.delete(email);
          return next;
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
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <section
      id="invited"
      aria-label="Invited"
      data-invited-section=""
      className="space-y-2"
    >
      <FeedSectionHeader label="Invited" count={list.length} />
      <p className="text-xs text-pretty text-muted-foreground">
        {listIsTheDoor ? (
          "These addresses come straight in once they confirm their email. Anyone else can ask you."
        ) : (
          <>
            {
              "Your list lets these addresses in while the invite list is the way in. "
            }
            <Link
              href={settingsPageHref(eventId, "door")}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Change who can get in
            </Link>
          </>
        )}
      </p>

      <div
        className={cn(
          "flex flex-wrap gap-1.5 rounded-lg border border-input bg-background p-2 transition-colors focus-within:border-ring motion-reduce:transition-none",
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
              className="flex size-5 items-center justify-center rounded-full outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <label htmlFor={fieldId} className="sr-only">
          Add or paste addresses
        </label>
        <input
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
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!text) return;
            e.preventDefault();
            take(`${typed} ${text}`);
          }}
          onBlur={() => {
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
        {` ${formatCount(list.length)} on the list, ${formatCount(joined)} joined.`}
      </p>

      {list.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border bg-card">
          {list.map((person) => (
            <li
              key={person.email}
              data-invited={person.email}
              className="flex items-center gap-3 px-3 py-2 sm:px-4"
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {person.email}
              </span>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 text-xs",
                  person.joined ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {person.joined ? (
                  <Check className="size-3.5" aria-hidden />
                ) : null}
                {person.joined ? "Joined" : "Not yet"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${person.email}`}
                onClick={() => remove(person.email)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
