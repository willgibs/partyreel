"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mail, TriangleAlert } from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReviewActions } from "@/components/app/event-feed/review-actions";
import { ReviewGrid } from "@/components/app/event-feed/review-grid";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { DropdownMenuHeader } from "@/components/ui/dropdown-menu";
import { floatingPanel, floatingRow } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import {
  BELL,
  EVENTS,
  JUST_LANDED,
  MY_UPLOADS,
  PENDING_TOTAL,
  QUEUE,
} from "./fixtures";
import { type ScreenId } from "./scene";
import { type LabToast, useLabTriage } from "./triage";

/** A note about the picture, never product copy: the lab's own 10px label, the
 *  same one `app-vocabulary` puts over a surface to say what is being shown. */
function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-muted-foreground" data-hc-note>
      {children}
    </p>
  );
}

/* ── undo ────────────────────────────────────────────────────────────────── */

export type UndoOption = "plain" | "undo" | "hold";
export const undoOf = (v: string | undefined): UndoOption =>
  v === "undo" ? "undo" : v === "hold" ? "hold" : "plain";

/**
 * THE TOAST AFTER A BULK ACT, on the queue it emptied.
 *
 * ★ IT REALLY RUNS. On mount the fork approves the first five, at the shipped
 * exit timing, and reports what the shipped hook would have handed sonner; the
 * toast below is that report drawn where a host would see it. Undo really puts
 * the five back, in the order they were in, so what is judged is the act and
 * not a picture of it. Nothing reaches a Server Function: the fork's run
 * resolves after the round trip the real one costs.
 */
export function UndoShowcase({
  option,
  screen,
}: {
  option: UndoOption;
  screen: ScreenId;
}) {
  const [said, setSaid] = useState<LabToast | null>(null);
  const [committed, setCommitted] = useState(false);
  const triage = useLabTriage({ items: QUEUE, onToast: setSaid });
  const { pending, run, restore } = triage;

  // The act, fired once so every option opens on the same moment: five approved.
  // A ref, not state: setting state inside an effect to guard the effect is the
  // cascading-render shape the compiler's rule refuses, and this only ever runs
  // on the first commit.
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void run(
      "approve",
      QUEUE.slice(0, 5).map((m) => m.id),
    );
  }, [run]);

  // The held act commits when its five seconds run out, and not before.
  useEffect(() => {
    if (option !== "hold" || !said) return;
    const t = setTimeout(() => setCommitted(true), 5000);
    return () => clearTimeout(t);
  }, [option, said]);

  return (
    <div className="relative min-h-full">
      <section aria-label="Review" className="space-y-2.5">
        <FeedSectionHeader
          label="Review"
          count={pending.length}
          amber
          action={<ReviewActions triage={triage} />}
        />
        <ReviewGrid
          items={pending}
          selectMode={triage.selectMode}
          selected={triage.selected}
          exiting={triage.exiting}
          onToggle={triage.toggle}
        />
      </section>

      {said && (
        <div className="hc-toast" data-screen={screen} data-hc-toast>
          <Check className="hc-toast-icon size-4" aria-hidden />
          <div className="hc-toast-body">
            <span>
              {option === "hold" && !committed
                ? `Approving ${said.ids.length} photos`
                : said.text}
            </span>
            {option === "hold" && (
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {committed ? "Live in the album" : "Five seconds to change your mind"}
              </span>
            )}
          </div>
          {option !== "plain" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={option === "hold" && committed}
              onClick={() => {
                restore(said.ids);
                setSaid(null);
                setCommitted(false);
              }}
            >
              Undo
            </Button>
          )}
          {option === "hold" && !committed && <span className="hc-hold" />}
        </div>
      )}
    </div>
  );
}

/* ── new arrivals ────────────────────────────────────────────────────────── */

export type ArrivalOption = "silence" | "prompt" | "live";
export const arrivalOf = (v: string | undefined): ArrivalOption =>
  v === "prompt" ? "prompt" : v === "live" ? "live" : "silence";

/**
 * THREE MORE LAND WHILE THE HOST IS HALFWAY DOWN THE QUEUE. They arrive 1.2
 * seconds in, so the picture is the queue BEFORE and then whatever the option
 * does about them; today's page is not polling at all, which is why `silence`
 * has to say in a note what the other two say on the screen.
 */
export function ArrivalsShowcase({
  option,
  screen,
}: {
  option: ArrivalOption;
  screen: ScreenId;
}) {
  const [landed, setLanded] = useState(false);
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLanded(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const showNew =
    landed && (option === "live" || (option === "prompt" && folded));
  const items = showNew ? [...JUST_LANDED, ...QUEUE] : QUEUE;
  const selected = new Set([QUEUE[0].id]);

  return (
    <div className="space-y-2.5">
      <FeedSectionHeader label="Review" count={items.length} amber />

      {option === "silence" && (
        <Note>
          Three more landed a moment ago. The host&rsquo;s page never polls, so
          they are not here, and finishing this queue still says all caught up.
        </Note>
      )}

      {option === "prompt" && landed && !folded && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setFolded(true)}
          data-hc-prompt
        >
          {JUST_LANDED.length} new
        </Button>
      )}

      {option === "live" && landed && (
        <Note>
          They went straight in at the top. One tile is selected, so on the rule
          this option carries they would have waited behind a prompt instead.
        </Note>
      )}

      <div
        className={
          showNew
            ? "[&_[data-exiting]]:opacity-100 motion-safe:animate-in motion-safe:fade-in"
            : undefined
        }
      >
        <ReviewGrid
          items={items.slice(0, screen === "375" ? 8 : 10)}
          selectMode
          selected={selected}
          exiting={new Set()}
          onToggle={() => {}}
        />
      </div>
    </div>
  );
}

/* ── the count ───────────────────────────────────────────────────────────── */

export type CountOption = "three" | "deeplink" | "one";
export const countOf = (v: string | undefined): CountOption =>
  v === "deeplink" ? "deeplink" : v === "one" ? "one" : "three";

/**
 * THE THREE PLACES A NUMBER IS SAID, IN ONE PICTURE: the header bell (an
 * aggregate that links `/dashboard`), the dashboard card's amber chip, and the
 * event page's own Review header. The bell's rows come from the REAL builder
 * (`buildNotifications`), so the copy and the href are the shipped ones, not a
 * guess; the panel is the real `DropdownMenuHeader` on the real floating-layer
 * contract, because the shipped bell opens a dropdown whose `onOpenChange`
 * runs a Server Function and a board may not.
 */
export function CountShowcase({
  option,
  screen,
}: {
  option: CountOption;
  screen: ScreenId;
}) {
  const reviewRow = BELL.items.find((i) => i.kind === "review");
  const hosted = EVENTS.filter((e) => e.pending > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Note>The header bell, open</Note>
        <div className={cn("w-80 max-w-full p-1", floatingPanel)}>
          <DropdownMenuHeader
            meta={option === "one" ? undefined : `${PENDING_TOTAL} new`}
          >
            Notifications
          </DropdownMenuHeader>
          {option === "one" ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              You&rsquo;re all caught up.
            </p>
          ) : (
            <div className={cn("flex gap-2 px-2 py-2", floatingRow)}>
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                aria-hidden
              />
              <div className="space-y-0.5">
                <p className="text-sm leading-tight font-medium">
                  {option === "deeplink"
                    ? `${hosted[0].pending} uploads to review`
                    : reviewRow?.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {option === "deeplink"
                    ? `${hosted[0].name}, and ${hosted[1].pending} more at ${hosted[1].name}`
                    : reviewRow?.body}
                </p>
              </div>
            </div>
          )}
        </div>
        <Note>
          {option === "deeplink"
            ? "It names the event and lands on that queue."
            : option === "one"
              ? "The bell carries no review row at all."
              : `It lands on /dashboard, counts every event, and still says ${PENDING_TOTAL} after one is cleared.`}
        </Note>
      </div>

      <div className="space-y-2">
        <Note>The dashboard&rsquo;s events</Note>
        <div
          className={
            screen === "375"
              ? "pointer-events-none grid grid-cols-1 gap-3"
              : "pointer-events-none grid grid-cols-3 gap-4"
          }
        >
          {EVENTS.map((e) => (
            <EventCard
              key={e.id}
              href={`/dashboard/${e.id}`}
              name={e.name}
              coverUrl={e.cover}
              dateLabel={e.dateLabel}
              itemsLabel={e.items}
              statusLabel="Open"
              pendingCount={e.pending}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Note>The event page&rsquo;s own header, on the first event</Note>
        <FeedSectionHeader label="Review" count={EVENTS[0].pending} amber />
        <ReviewGrid
          items={QUEUE.slice(0, screen === "375" ? 2 : 6)}
          selectMode={false}
          selected={new Set()}
          exiting={new Set()}
          onToggle={() => {}}
        />
      </div>
    </div>
  );
}

/* ── the guest told ──────────────────────────────────────────────────────── */

export type ToldOption = "never" | "line" | "message";
export const toldOf = (v: string | undefined): ToldOption =>
  v === "line" ? "line" : v === "message" ? "message" : "never";

/**
 * THE GUEST'S OWN UPLOADS FEED, hours later, on the real `MasonryColumns`.
 * One of their photographs was refused by the host. Today it is simply not
 * here and nothing anywhere says a word, which the marketing FAQ states in
 * public as "Never".
 *
 * ★ THE GRID IS INERT: a tap opens the shipped lightbox, which is a portal-
 * bound Dialog and would land outside the frame.
 */
export function ToldShowcase({
  option,
  screen,
}: {
  option: ToldOption;
  screen: ScreenId;
}) {
  const refused = MY_UPLOADS.find((m) => m.status === "hidden");
  const items =
    option === "never"
      ? MY_UPLOADS.filter((m) => m.status !== "hidden")
      : MY_UPLOADS;
  const shown = items.slice(0, screen === "375" ? 6 : 9);

  return (
    <div className="space-y-4">
      {option === "message" && (
        <div className={cn("flex gap-3 p-3", floatingPanel)} data-hc-message>
          <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm leading-tight font-medium">
              One of your photos was not added
            </p>
            <p className="text-xs text-muted-foreground">
              Mia is curating Mia &amp; Theo&rsquo;s Wedding and did not add one
              of yours to the album. The rest are in.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Note>
          {option === "never"
            ? "Their feed, with the refused photograph simply absent."
            : option === "line"
              ? "Their feed, with the refused photograph still theirs."
              : "Their feed, unchanged. The notice above does the telling."}
        </Note>
        <div className="pointer-events-none">
          <MasonryColumns
            items={shown}
            clampAspect
            // Deliberately NO dimItem: `masonry.tsx` concatenates that class
            // without a separator, so the 30 percent dim it promises has never
            // rendered anywhere (the manifest's ROADMAP line). The label is the
            // whole treatment, and it is the treatment being judged.
            renderOverlay={
              option === "line"
                ? (m) =>
                    m.status === "hidden" ? (
                      <span
                        data-hc-told
                        className="absolute inset-x-1.5 bottom-1.5 z-10 rounded-full bg-black/60 px-2 py-1 text-center text-[11px] text-white backdrop-blur-sm"
                      >
                        Not in the album
                      </span>
                    ) : null
                : undefined
            }
          />
        </div>
      </div>

      {option === "never" && refused && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          They sent {MY_UPLOADS.length}. They can see {items.length}. Nothing on
          this page, in any email, or in the album accounts for the other one.
        </p>
      )}
    </div>
  );
}
