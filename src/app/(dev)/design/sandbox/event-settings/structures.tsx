"use client";

import { type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clapperboard,
  DoorOpen,
  Heart,
  ImagePlus,
  type LucideIcon,
  MailCheck,
  PartyPopper,
  SlidersHorizontal,
} from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { cn } from "@/lib/utils";

import { AccessBody, AddsBody, EventBody, ReelBody } from "./bodies";
import { EVENT } from "./fixtures";
import { ChoiceQuote } from "./kinds";
import {
  doorOpen,
  emailHeld,
  type Group,
  GROUP_TITLE,
  groupSentence,
  lookLabel,
  type Model,
  photoFirstLive,
  type Rung,
  RUNGS,
  rungOf,
  seconds,
} from "./model";
import {
  DeleteRow,
  GroupCard,
  LockChipQuote,
  NavRow,
  SavesNote,
  SwitchRow,
} from "./parts";
import { ScrollHere } from "./scene";
import type { ScreenId } from "./screens";

/**
 * THE FOUR NEW STRUCTURES, EACH A WAY OF ARRANGING THE SAME FOUR GROUPS
 * (`bodies.tsx`): in view, one sentence each with the detail one tap in, as
 * sentences whose words are the controls, and presets over an Adjust fold.
 * Today's cards are quoted apart (`today.tsx`).
 *
 * ★ ONE SAVE MODEL FOR ALL FOUR (the board's `saves` call): a change saves as
 * it is made, so no structure carries a Save button, and the summary says so
 * once, under its rows.
 */

const GROUP_ICON: Record<Group, LucideIcon> = {
  access: DoorOpen,
  adds: ImagePlus,
  reel: Clapperboard,
  event: CalendarDays,
};

const GROUPS: readonly Group[] = ["access", "adds", "reel", "event"];

function Body({ g, m, as }: { g: Group; m: Model; as?: "card" | "rows" }) {
  switch (g) {
    case "access":
      return <AccessBody m={m} as={as} />;
    case "adds":
      return <AddsBody m={m} as={as} />;
    case "reel":
      return <ReelBody m={m} as={as} />;
    case "event":
      return <EventBody m={m} as={as} />;
  }
}

/* ── four groups, every setting in view ───────────────────────────────────── */

export function GroupsPanel({ m }: { m: Model }) {
  return (
    <div className="flex flex-col gap-6 pt-px">
      {GROUPS.map((g) => (
        <section key={g} className="space-y-2">
          {m.focus === g && <ScrollHere offset={4} />}
          <FeedSectionHeader label={GROUP_TITLE[g]} />
          <Body g={g} m={m} />
        </section>
      ))}
      <DeleteRow />
      <SavesNote />
    </div>
  );
}

/* ── a sentence per group, its detail one tap in ──────────────────────────── */

/**
 * THE SUMMARY. At rest, four rows, each its group's one sentence (`model.ts`'s
 * `groupSentence`) and a chevron; one tap opens the group, as its own page
 * under a back arrow (`opens=page`: the popup's head becomes the group's, its
 * back naming Settings) or in place under its sentence (`opens=inplace`).
 */
export function SummaryPanel({ m }: { m: Model }) {
  if (m.focus && m.opens === "page")
    return (
      <div className="pt-px">
        <Body g={m.focus} m={m} />
      </div>
    );
  return (
    <div className="flex flex-col gap-6 pt-px">
      <div className="space-y-1.5">
        <GroupCard className="divide-y divide-border">
          {GROUPS.map((g) => (
            <NavRow
              key={g}
              Icon={GROUP_ICON[g]}
              title={GROUP_TITLE[g]}
              sentence={groupSentence(g, m)}
              open={m.focus === g}
            >
              {/* Opened in place, its settings stand on a shade of their own,
                  so they read as inside the row that opened them. */}
              <div className="border-t border-border bg-muted/30">
                <Body g={g} m={m} as="rows" />
              </div>
            </NavRow>
          ))}
        </GroupCard>
        <SavesNote />
      </div>
      <DeleteRow />
    </div>
  );
}

/** The title and back a summary page wears in the popup's head. */
export function summaryHead(m: Model): { title: string; up?: string } {
  if (m.structure === "summary" && m.focus && m.opens === "page")
    return { title: GROUP_TITLE[m.focus], up: "Settings" };
  return { title: "Settings" };
}

/* ── the settings, read as sentences ──────────────────────────────────────── */

/**
 * A WORD THAT IS A CONTROL: it reads as part of the sentence and is underlined
 * like a link's quieter cousin; tapping it opens the `choice` kind (a menu at a
 * desk, rows at the thumb), or a field where the word is typed (the name).
 */
function Word({
  children,
  open = false,
  idle,
}: {
  children: ReactNode;
  open?: boolean;
  /** Drawn but doing nothing yet (the idle ask's `greyed`). */
  idle?: boolean;
}) {
  return (
    <span
      data-set-setting=""
      data-set-idle={idle ? "" : undefined}
      className={cn(
        "relative rounded-sm font-medium text-foreground underline decoration-foreground/35 decoration-dotted decoration-2 underline-offset-[5px]",
        open && "bg-accent",
        idle && "opacity-45",
      )}
    >
      {children}
    </span>
  );
}

function Sentence({
  g,
  children,
  after,
}: {
  g: Group;
  children: ReactNode;
  after?: ReactNode;
}) {
  return (
    <GroupCard group={g}>
      <div className="relative space-y-1.5 px-4 py-3.5">
        <p className="text-caption font-medium text-muted-foreground">
          {GROUP_TITLE[g]}
        </p>
        <p className="text-reading text-pretty text-muted-foreground">
          {children}
        </p>
        {after}
      </div>
    </GroupCard>
  );
}

/** A rung's name inside a sentence, with its first letter where the sentence needs it. */
const rungWords = (r: Rung) => rungOf(r).label;

function AccessSentence({ m }: { m: Model }) {
  const photoIdle = !photoFirstLive(m);
  if (!doorOpen(m))
    return (
      <Sentence g="access">
        <Word>Only you</Word> can open the album. Guests meet a closed album.
      </Sentence>
    );
  const who =
    m.join === "none" ? (
      <>
        <Word>{rungWords(m.rung)}</Word> can see the album
      </>
    ) : (
      <>
        <Word open={m.mark === "choice"}>{rungWords(m.rung)}</Word> can get in
      </>
    );
  const held = emailHeld(m);
  const email = held ? (
    <>confirm an email first</>
  ) : (
    <>
      <Word>{m.email ? "confirm an email" : "type a name"}</Word> first
    </>
  );
  const gate =
    photoIdle && m.idle === "hidden" ? null : (
      <>
        {" "}
        The album opens{" "}
        <Word idle={photoIdle && m.idle === "greyed"}>
          {m.photoFirst ? "once they add a photo" : "right away"}
        </Word>
        {photoIdle && m.idle === "live"
          ? ", once uploads reopen"
          : photoIdle && m.idle === "greyed"
            ? ", which waits while uploads are paused"
            : ""}
        .
      </>
    );
  return (
    <Sentence g="access">
      {who}, and guests {email}.{gate}
    </Sentence>
  );
}

function AddsSentence({ m, screen }: { m: Model; screen: ScreenId }) {
  const pro = m.plan === "pro";
  const chooser =
    m.chooser === "uploads" ? (
      <ChoiceQuote
        screen={screen}
        title="What can guests do?"
        anchor="top-[4.25rem] left-16"
        rows={[
          { label: "Add photos", on: true },
          { label: "Only look, for now", next: true },
        ]}
      />
    ) : null;
  const lock = pro ? null : m.lock === "chip" ? (
    <div className="pt-1">
      <LockChipQuote name="Video uploads" reach={m.mark === "lock"} />
    </div>
  ) : m.lock === "line" ? (
    <p
      data-set-reach={m.mark === "lock" ? "" : undefined}
      className="text-caption text-muted-foreground"
    >
      Videos come with Pro.{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        See what Pro adds
      </span>
    </p>
  ) : null;
  return (
    <div className="relative">
      <Sentence g="adds" after={lock}>
        Guests{" "}
        <span data-set-reach={m.mark === "uploads" ? "" : undefined}>
          <Word open={m.chooser === "uploads"}>
            {m.uploads ? "can add photos" : "can only look"}
          </Word>
        </span>
        {m.lock === "switch" && !pro ? (
          <>
            {" "}
            <span data-set-reach={m.mark === "lock" ? "" : undefined}>
              <Word>not videos</Word>
            </span>{" "}
            <span className="rounded-full border border-border px-1.5 py-px align-[2px] text-[10px] font-semibold text-muted-foreground">
              Pro
            </span>
          </>
        ) : pro ? (
          <> and videos</>
        ) : null}
        , and what they add goes{" "}
        <Word>{m.review ? "to you first" : "straight into the album"}</Word>.
      </Sentence>
      {chooser}
    </div>
  );
}

function ReelSentence({ m }: { m: Model }) {
  if (m.reel)
    return (
      <Sentence g="reel">
        The reel <Word>plays on the album</Word>, in <Word>{lookLabel(m)}</Word>
        , <Word>{seconds(m.hold)}</Word> a photo.
      </Sentence>
    );
  return (
    <Sentence g="reel">
      The reel <Word>is off</Word>.
      {m.idle === "hidden" ? null : (
        <>
          {" "}
          When it is on, it plays in{" "}
          <Word idle={m.idle === "greyed"}>{lookLabel(m)}</Word>,{" "}
          <Word idle={m.idle === "greyed"}>{seconds(m.hold)}</Word> a photo.
        </>
      )}
    </Sentence>
  );
}

function EventSentence({ m }: { m: Model }) {
  return (
    <Sentence g="event">
      <Word>{EVENT.name}</Word> on <Word>{EVENT.date}</Word>, with{" "}
      <Word>a note</Word> under its name. It is{" "}
      <Word>{m.profile ? "listed" : "not listed"}</Word> on your profile.
    </Sentence>
  );
}

/**
 * The join ask's choice, open over the sentence it belongs to: the six rungs,
 * or the four ways to join, as the `choice` kind's rows.
 */
function JoinChooser({ m, screen }: { m: Model; screen: ScreenId }) {
  if (m.mark !== "choice" || m.join === "none") return null;
  if (m.join === "ladder")
    return (
      <ChoiceQuote
        screen={screen}
        title="Who can get in?"
        anchor="top-[4.25rem] left-3"
        reach
        rows={RUNGS.map((r) => ({ label: r.label, on: r.id === m.rung }))}
      />
    );
  return (
    <ChoiceQuote
      screen={screen}
      title="Who can join?"
      anchor="top-[4.25rem] left-3"
      reach
      rows={[
        { label: "Anyone with the link", on: m.rung === "anyone" },
        { label: "Approve newcomers", on: m.rung === "approve" },
        { label: "Closed to newcomers", on: m.rung === "closed" },
        { label: "An invite list", on: m.rung === "list" },
      ]}
    />
  );
}

export function SentencesPanel({ m, screen }: { m: Model; screen: ScreenId }) {
  return (
    <div className="flex flex-col gap-3 pt-px">
      {m.focus === "access" && <ScrollHere />}
      <div className="relative">
        <AccessSentence m={m} />
        <JoinChooser m={m} screen={screen} />
      </div>
      {m.focus === "adds" && <ScrollHere />}
      <AddsSentence m={m} screen={screen} />
      {m.focus === "reel" && <ScrollHere />}
      <ReelSentence m={m} />
      <EventSentence m={m} />
      <div className="pt-3">
        <DeleteRow />
      </div>
      <SavesNote />
    </div>
  );
}

/* ── start from a kind of event ───────────────────────────────────────────── */

type Kind = "party" | "wedding" | "invite";

const KINDS: readonly {
  id: Kind;
  label: string;
  Icon: LucideIcon;
  line: string;
  is: (m: Model) => boolean;
}[] = [
  {
    id: "party",
    label: "A party",
    Icon: PartyPopper,
    line: "Anyone with the link joins with a name, and photos go straight in.",
    is: (m) => m.rung === "anyone" && !m.email && !m.review,
  },
  {
    id: "wedding",
    label: "A wedding",
    Icon: Heart,
    line: "Guests confirm an email first, and photos go straight in.",
    is: (m) => m.rung === "anyone" && m.email && !m.review,
  },
  {
    id: "invite",
    label: "Invite only",
    Icon: MailCheck,
    line: "Your list comes straight in and anyone else asks you first.",
    is: (m) => m.rung === "list" && !m.review,
  },
];

/**
 * PRESETS: a kind of event sets the door and Review at once; the pause stands
 * under it, because pausing is something a host does, not a kind of event;
 * every door and upload setting waits under Adjust, and a change there makes
 * the kind read Custom.
 */
export function PresetsPanel({ m }: { m: Model }) {
  const kind = KINDS.find((k) => k.is(m));
  const adjust = m.focus === "access" || m.focus === "adds";
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2.5">
        <p className="text-sm font-medium">What kind of event is this?</p>
        <div data-set-setting="" className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => {
            const on = kind?.id === k.id;
            return (
              <span
                key={k.id}
                className={cn(
                  "flex min-w-0 flex-col items-start gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10",
                  on && "ring-2 ring-foreground",
                )}
              >
                <k.Icon
                  className={cn(
                    "size-4",
                    on ? "text-foreground" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span className="text-sm leading-tight font-medium">
                  {k.label}
                </span>
              </span>
            );
          })}
        </div>
        <p className="text-caption text-pretty text-muted-foreground">
          {kind ? kind.line : "Custom: adjusted below."}
        </p>
      </section>

      <GroupCard>
        <SwitchRow
          label="Uploads open"
          line="Turn off to pause. Guests can still look."
          checked={m.uploads}
          reach={m.mark === "uploads"}
        />
      </GroupCard>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-card px-4 py-3 ring-1 ring-foreground/10">
          <span className="flex min-w-0 items-center gap-3">
            <SlidersHorizontal
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Adjust</span>
              <span className="block text-caption text-muted-foreground">
                Who can get in and what guests can add, one by one.
              </span>
            </span>
          </span>
          <ChevronRight
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground",
              adjust && "rotate-90",
            )}
          />
        </div>
        {adjust ? (
          <div className="space-y-4">
            {m.focus === "access" && <ScrollHere />}
            <AccessBody m={m} />
            {m.focus === "adds" && <ScrollHere />}
            <AddsBody m={m} pause={false} />
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        {m.focus === "reel" && <ScrollHere offset={4} />}
        <FeedSectionHeader label={GROUP_TITLE.reel} />
        <ReelBody m={m} />
      </section>
      <section className="space-y-2">
        <FeedSectionHeader label={GROUP_TITLE.event} />
        <EventBody m={m} />
      </section>
      <DeleteRow />
      <SavesNote />
    </div>
  );
}
