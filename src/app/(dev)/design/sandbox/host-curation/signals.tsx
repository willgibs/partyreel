"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mail, TriangleAlert } from "lucide-react";

import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import { ReviewActions } from "@/components/app/event-feed/review-actions";
import { ReviewGrid } from "@/components/app/event-feed/review-grid";
import { MasonryColumns } from "@/components/shared/masonry";
import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { JUST_LANDED, MY_UPLOADS, QUEUE } from "./fixtures";
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
 *
 * ★ AND WHAT WAITS IS OFF THE REEL AND THE WALL. The live reel and the venue
 * wall play only what is approved, so an arrival the queue never shows is one
 * the room never sees either: the cost of silence is a thin reel, and the note
 * says so. Whether Review's own header explains that is `reel-host.review`'s
 * question, so no option here writes a line into the header.
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
          they are not here, finishing this queue still says all caught up, and
          none of the three reaches the reel or the wall.
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

/* ── the guest told ──────────────────────────────────────────────────────── */

export type ToldOption = "never" | "line" | "message";
export const toldOf = (v: string | undefined): ToldOption =>
  v === "line" ? "line" : v === "message" ? "message" : "never";

/**
 * THE GUEST'S OWN UPLOADS FEED, hours later, on the real `MasonryColumns`.
 * One of her photographs was refused by the host. Today it is simply not here
 * and nothing anywhere says a word, which the marketing FAQ states in public as
 * "Never", while her own waiting tile in the album kept saying the host had not
 * decided for the rest of her visit.
 *
 * ★ HER OWN, AND NOBODY ELSE'S. A typed name has no profile and a confirmed
 * account's shows only the events its owner chose, so the only place a refusal
 * could ever be said is her own copy: her tiles, and this feed. A message can
 * reach only a confirmed address; a typed one is never mailed on its own.
 *
 * ★ `line`'S SURFACE IS HER TRACKER, NAMED (the desk re-cut): guest-capture's
 * new ask draws the tracker itself (a sheet, or her tiles inline); this grid
 * stands in for whichever shape wins, so the words say "tracker" rather than
 * name a surface that ask may not build.
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
            ? "Her uploads, with the refused photograph simply absent."
            : option === "line"
              ? "Her tracker, with the refused photograph still hers, and seen by nobody else."
              : "Her uploads, unchanged. The notice above, to a confirmed address, does the telling."}
        </Note>
        <div className="pointer-events-none">
          <MasonryColumns
            items={shown}
            clampAspect
            // ★ NO dimItem, AND THE DIM DRAWN HERE INSTEAD. `masonry.tsx`
            // concatenates that class without a separator, so the 30 percent
            // dim it promises never renders; the option says "dimmed", so the
            // overlay draws the dim itself (the page's own ground at 70
            // percent over the tile, which is what 30 percent opacity shows)
            // under the label, and the picture says what the words say.
            renderOverlay={
              option === "line"
                ? (m) =>
                    m.status === "hidden" ? (
                      <>
                        <span
                          aria-hidden
                          className="absolute inset-0 z-[5] bg-background/70"
                        />
                        <span
                          data-hc-told
                          className="absolute inset-x-1.5 bottom-1.5 z-10 rounded-full bg-black/60 px-2 py-1 text-center text-[11px] text-white backdrop-blur-sm"
                        >
                          Not in the album
                        </span>
                      </>
                    ) : null
                : undefined
            }
          />
        </div>
      </div>

      {option === "never" && refused && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          She sent {MY_UPLOADS.length}. She can see {items.length}. Nothing on
          this page, in any email, or in the album accounts for the other one.
        </p>
      )}
    </div>
  );
}
