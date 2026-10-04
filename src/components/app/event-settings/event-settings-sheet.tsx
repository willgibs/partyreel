"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { AddsPage } from "@/components/app/event-settings/adds-page";
import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { ReelPage } from "@/components/app/event-settings/reel-page";
import {
  nextSettingsPage,
  type SettingsPage,
} from "@/components/app/event-settings/settings-pages";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  useSettings,
} from "@/components/app/event-settings/settings-state";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import type { Tier } from "@/lib/constants/tiers";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";
import type { ReadyFacts } from "@/lib/events/readiness";

/** Each page's head: the group's own title, the one its row stands under. */
const PAGE_TITLE: Record<SettingsPage, string> = {
  door: SETTINGS_GROUP_TITLES.door,
  adds: SETTINGS_GROUP_TITLES.adds,
  reel: SETTINGS_GROUP_TITLES.reel,
  event: SETTINGS_GROUP_TITLES.event,
};

/**
 * SETTINGS AS A PANEL BESIDE THE ALBUM (Will, `settings=sheet`: "This does feel cleaner and accessible
 * than a page of cards per event", and the album it GOVERNS stays beside it), rebuilt from the ground
 * up (event-settings r1, 2026-09-29): four rows, each a sentence of where its group stands with its key
 * words live, each opening its own page under a back arrow (`opens=page`). Since event-ready r1
 * (`guide=steps`, 2026-10-02) the rows are steps on a rail, ticked once ready, the code the fifth, and
 * every page ends in Next, so Settings walks a host to ready without a mode of its own.
 *
 * ★ ITS KIND IS `settings` (`popups` r1, `settings=panel`): his panel at a desk; in a hand the whole
 * screen under a back arrow that names the event. It rides `?room=settings`, and a page rides beside it
 * (`&setting=door`, `settings-pages.ts`), so a link opens straight onto a page and a reload lands where
 * the host was. One level in, the head is the page's own and its back arrow goes UP to the four rows
 * (the popup's `up`), at a desk a small back row over the title, in a hand the bar's own arrow.
 *
 * ★ IT OPENS UNFOCUSED, at every width (his note: "Let's not open focused, so more settings are visible
 * and one tap away"): the kind's `deskFocus` is the panel itself.
 *
 * ★ NOTHING WAITS ON A SAVE, SO NOTHING GUARDS THE CLOSE. Every control saves itself (a typed field when
 * it is left), so the retired form's Save, its dirty state and its "Discard changes?" are gone with it:
 * Back, the X, Escape and the scrim simply close, from any page, a deep link included
 * (`event-share-provider.tsx`).
 */
export function EventSettingsSheet({
  open,
  onOpenChange,
  page,
  onOpenPage,
  onClosePage,
  event,
  tier,
  counts,
  pendingCount,
  social,
  reelSample,
  ready,
  onOpenCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page open inside Settings, or null for the four rows. */
  page: SettingsPage | null;
  onOpenPage: (page: SettingsPage) => void;
  onClosePage: () => void;
  event: HostEvent;
  tier: Tier;
  /** The door's own numbers (who is in, who waits, the list), read for the host. */
  counts: DoorCounts;
  pendingCount: number;
  /** Null when the event is not the host's own to read (`getEventSocialSettings`): the card hides. */
  social: {
    displayInProfile: boolean;
    hostHasSlug: boolean;
  } | null;
  /** One of the event's own photographs to show the reel's looks on, or null before the first. */
  reelSample: string | null;
  /** The event's readiness facts, as the hub read them: the rail's ticks. */
  ready: ReadyFacts;
  /** The fifth step's door: closes Settings and opens the code card (the hub's sheets wire it). */
  onOpenCode?: () => void;
}) {
  // ★ THE STATE OUTLIVES THE PANEL: the provider stands outside the popup, whose content unmounts as it
  // closes, so a change saved a moment ago is still what the rows say when Settings opens again, before
  // the row it wrote has come back.
  return (
    <SettingsProvider
      event={event}
      tier={tier}
      counts={counts}
      pendingCount={pendingCount}
      social={social}
      reelSample={reelSample}
    >
      <SettingsPanel
        open={open}
        onOpenChange={onOpenChange}
        page={page}
        onOpenPage={onOpenPage}
        onClosePage={onClosePage}
        eventName={event.name}
        guestsHref={`/dashboard/${event.id}/guests`}
        ready={ready}
        onOpenCode={onOpenCode}
      />
    </SettingsProvider>
  );
}

/** A page move: a page, or the four rows (null). */
type Move = SettingsPage | null;

/**
 * THE PANEL ITSELF, inside the provider so its page moves can wait on its saves.
 *
 * ★ A PAGE MOVE WAITS FOR A SAVE ON ITS WAY, AND SHOWS AT ONCE (crumbs-42, from crumbs-24). Every save
 * re-renders the hub in its own answer, and a move is an address written (`&setting=` replaced): one
 * written inside a save's round trip made Next re-fetch the page once the save answered, and a second
 * move inside that re-fetch reloaded the page or dropped what the save brought. So a move made while a
 * save is on its way is drawn at once and its address written once the save has landed (the provider's
 * `afterSaves`), the newest move of several being the one written; with nothing on its way, the address
 * is written at once, as before. A close drops a move still waiting: the panel is gone and so is the
 * page it named.
 */
function SettingsPanel({
  open,
  onOpenChange,
  page,
  onOpenPage,
  onClosePage,
  eventName,
  guestsHref,
  ready,
  onOpenCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page the address names, or null for the four rows. */
  page: SettingsPage | null;
  onOpenPage: (page: SettingsPage) => void;
  onClosePage: () => void;
  eventName: string;
  guestsHref: string;
  ready: ReadyFacts;
  onOpenCode?: () => void;
}) {
  const { afterSaves } = useSettings();

  // The move drawn while its address waits, and the newest one asked for (undefined: none waits).
  const [held, setHeld] = useState<{ to: Move } | null>(null);
  const waiting = useRef<Move | undefined>(undefined);
  // The page the address names, read when a waiting move is written.
  const addressed = useRef(page);
  useEffect(() => {
    addressed.current = page;
  });

  // The address caught up with the move, or the panel closed: what was drawn is the address's again
  // (adjusted during render, the sanctioned "state from a changed prop" shape).
  if (held && (!open || held.to === page)) setHeld(null);
  const shown: Move = held ? held.to : page;

  const write = useCallback(() => {
    const to = waiting.current;
    waiting.current = undefined;
    if (to === undefined || to === addressed.current) return;
    if (to) onOpenPage(to);
    else onClosePage();
  }, [onOpenPage, onClosePage]);

  const move = useCallback(
    (to: Move) => {
      waiting.current = to;
      // Written now, the address is the answer again, whatever an earlier move drew; held, it is drawn.
      if (afterSaves(write)) setHeld(null);
      else setHeld({ to });
    },
    [afterSaves, write],
  );

  const changeOpen = useCallback(
    (next: boolean) => {
      if (!next) waiting.current = undefined;
      onOpenChange(next);
    },
    [onOpenChange],
  );

  // The code's door closes Settings as the X does: a move still waiting on a save goes with it.
  const openCode = onOpenCode
    ? () => {
        waiting.current = undefined;
        onOpenCode();
      }
    : undefined;

  // ★ FOCUS FOLLOWS THE LEVEL: into a page, onto its way back up; back up, onto the row that opened it.
  // The control that was pressed is gone with the level it stood on, and focus must never fall to the
  // page behind the panel. ★ AND A PAGE OPENS AT ITS TOP: Next is pressed at the foot of the page before,
  // and the panel's body is one scroller for every page.
  const cameFrom = useRef<SettingsPage | null>(null);
  const body = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    if (body.current) body.current.scrollTop = 0;
    if (shown) {
      cameFrom.current = shown;
      document
        .querySelector<HTMLElement>("[data-popup-up]")
        ?.focus({ preventScroll: true });
      return;
    }
    const from = cameFrom.current;
    cameFrom.current = null;
    if (from) {
      document
        .querySelector<HTMLElement>(`[data-settings-open="${from}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [open, shown]);

  return (
    <Popup open={open} onOpenChange={changeOpen}>
      {/* ★ A PAGE'S HEAD NAMES NO DESCRIPTION (crumbs-59, red-team 47's NIT): the rows' head says the event's name under
          "Settings", and Radix points the dialog at it whether or not one is drawn, so a panel that mounted at a page
          (`?room=settings&setting=event`, a link, a reload) warned "Missing `Description`", and one that moved onto a page
          left its `aria-describedby` on an element that had just gone. A page says so, as every popup without one does. */}
      <PopupContent
        kind="settings"
        routed
        {...(shown ? { "aria-describedby": undefined } : {})}
      >
        {shown ? (
          <PopupHeader
            title={PAGE_TITLE[shown]}
            up={{ label: "Settings", onUp: () => move(null) }}
          />
        ) : (
          <PopupHeader
            title="Settings"
            description={eventName}
            back={eventName}
          />
        )}
        {/* ★ BLOCK FLOW, NEVER A FLEX COLUMN THAT SHRINKS ITS CHILDREN: the body is the scroller, and a
            card clips, so a column once crushed every card past the first to its padding (build 17).
            The popup's body keeps its children whole whatever a caller lays out. */}
        <PopupBody
          ref={body}
          className="space-y-6 pb-6"
          data-settings-page={shown ?? "rows"}
        >
          {shown === "door" ? (
            <DoorPage guestsHref={guestsHref} />
          ) : shown === "adds" ? (
            <AddsPage />
          ) : shown === "reel" ? (
            <ReelPage />
          ) : shown === "event" ? (
            <EventPage />
          ) : (
            <SettingsRows
              onOpenPage={move}
              ready={ready}
              onOpenCode={openCode}
            />
          )}
          {shown ? (
            <SettingsNext page={shown} onNext={move} onOpenCode={openCode} />
          ) : null}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}

/**
 * EVERY PAGE ENDS IN NEXT (event-ready `guide=steps`): onto the next step's page, a move like any other
 * (it waits on a save on its way, above), and after the fourth onto the code, whose door is the code card.
 * Where there is no code card to open (the Library) the last page simply ends.
 */
export function SettingsNext({
  page,
  onNext,
  onOpenCode,
}: {
  page: SettingsPage;
  onNext: (page: SettingsPage) => void;
  onOpenCode?: () => void;
}) {
  const next = nextSettingsPage(page);
  if (!next && !onOpenCode) return null;
  return (
    <Button
      size="cta"
      className="w-full"
      data-settings-next={next ?? "code"}
      onClick={() => (next ? onNext(next) : onOpenCode?.())}
    >
      {next ? `Next: ${SETTINGS_GROUP_TITLES[next]}` : "Next: The code"}
      <ArrowRight />
    </Button>
  );
}
