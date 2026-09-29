"use client";

import { Clock } from "lucide-react";

import GuestNotFound from "@/app/(guest)/e/[token]/not-found";
import { DoorHeading } from "@/components/guest/door/heading";
import { DoorGlyph } from "@/components/guest/door/lit";
import { ShutDoor, shutDoorCopy } from "@/components/guest/door/shut-door";
import { waitingCopy, WaitingDoor } from "@/components/guest/door/waiting-step";
import { NotFoundScreen } from "@/components/shared/not-found-screen";

import { type DoorProps, seesAlbum } from "./door-props";
import { EVENT, HOST } from "./fixtures";
import {
  AlbumBehind,
  BeatWords,
  Byline,
  Foot,
  Held,
  HOUSE,
  Page,
  PickBlock,
  QuotedCheck,
  RiverBehind,
  Rows,
  revealAt,
  WaitHold,
  WelcomeFoot,
} from "./furniture";
import { BEAT, HELD, TOLD, type WaitId, WELCOME } from "./words";

/**
 * TODAY'S DOOR, AS IT SHIPS: the measure every step grades against, drawn by
 * production's own pieces wherever one stands alone (`settings-wiring` built
 * them beside round two, so the round's own prediction of them is gone):
 *
 *  - the wait is `WaitingDoor` itself, the held door's face without its
 *    check-in loop (as the help center draws it), in the entry modal's step box;
 *  - the shut door is `ShutDoor` itself on the page it ships on: its words
 *    (`shutDoorCopy`), the line someone who was in reads (its `previous`), the
 *    unlisted reader's own foot (`UnlistedAsk`), and the way back in for a
 *    visitor signed out;
 *  - the 404 is `e/[token]/not-found.tsx`'s page itself.
 *
 * What production draws inline, with no export, is quoted class for class: the
 * welcome (`entry-modal.tsx`'s `WelcomeStep`: its hero, its byline, its two
 * promise rows on pools, Continue and the consent line, standing 55svh in a
 * hand) and "You're in" (`SuccessStep`). The page wears production's own
 * padding (`py-20`, the shut door's and the 404's `main`).
 *
 * ★ TODAY'S THREE SHAPES ARE THE FAMILY'S OWN: `split` is today exactly (the
 * sheet that opens, the page that does not); `shared` holds the shut door in
 * the lit sheet too, `DoorHeading` in `shutDoorCopy`'s words (round one's "the
 * door, held shut"); `bespoke` gives the wait a page of its own (event-settings'
 * `waiting=page`), the not-found family in `waitingCopy`'s words. The two waits
 * that do not ship (`live`, `pick`) are today's held door with the option's
 * addition, composed from its heading and its words.
 */
export function TodayDoor(p: DoorProps) {
  const { reader, wait, album } = p;

  if (p.state === "lost") return <TodayLost />;

  if (p.container === "page") {
    if (p.state === "beat") {
      return (
        <Page reader={reader} className="py-20">
          <NotFoundScreen
            visual={<QuotedCheck hues={album} />}
            title={BEAT.title}
            description={<span data-ld-words>{BEAT.line}</span>}
            actions={
              wait === "pick" ? (
                <div className="w-full max-w-sm">
                  <PickBlock phase="sending" align="center" />
                </div>
              ) : null
            }
          />
        </Page>
      );
    }
    if (p.state === "wait") {
      const copy = waitingCopy(HOST.name);
      return (
        <Page reader={reader} className="py-20">
          <NotFoundScreen
            icon={Clock}
            title={copy.title}
            description={
              wait === "live" ? `${TOLD.text} ${copy.reason}` : copy.reason
            }
            actions={<WaitHold wait={wait} align="center" />}
          />
        </Page>
      );
    }
    // The shut door as it ships, and the line someone who was in reads on it.
    return (
      <Page reader={reader} className="py-20">
        <ShutDoor
          previous={reader.wasIn}
          signedIn={reader.confirmed}
          returnTo={`/e/${EVENT.token}`}
          ask={
            reader.unlisted
              ? { qrToken: EVENT.token, hostName: HOST.name }
              : null
          }
        />
      </Page>
    );
  }

  /* ── in the held sheet ──────────────────────────────────────────────────── */

  if (p.state === "welcome") {
    // At a gate's first step the page is redacted (`shellEvent`): the name and
    // the count, no host, no date, nothing behind but the ghost river.
    const open = seesAlbum(p);
    const hues = open ? album : HOUSE;
    return (
      <Held
        reader={reader}
        behind={open ? <AlbumBehind /> : <RiverBehind named />}
        hues={hues}
      >
        <div data-welcome-step className="flex flex-col gap-5">
          <div className="flex flex-col">
            <p
              data-door-line
              style={revealAt(0)}
              className="text-label font-medium text-muted-foreground uppercase"
            >
              <span data-ld-words>{WELCOME.eyebrow}</span>
            </p>
            <p
              data-ld-words
              data-ld-title
              data-door-line
              style={revealAt(1)}
              className="mt-1.5 font-heading text-hero text-balance sm:text-section"
            >
              {WELCOME.title}
            </p>
            {open && (
              <div className="mt-3">
                <Byline line={2} />
              </div>
            )}
          </div>
          <Rows lines={WELCOME.lines} hues={hues} from={3} />
          <WelcomeFoot className="mt-auto" />
        </div>
      </Held>
    );
  }

  if (p.state === "beat") {
    return (
      <Held
        reader={reader}
        behind={<RiverBehind named />}
        hues={album}
        lamp="bloom"
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <QuotedCheck hues={album} />
          <BeatWords pick={wait === "pick"} />
        </div>
      </Held>
    );
  }

  // Every held step but the welcome and the beat stands in the entry modal's
  // step box, whose `pt-7` clears the back chevron's row.
  if (p.state === "wait") {
    return (
      <Held reader={reader} behind={<RiverBehind named />} hues={HOUSE}>
        <div className="pt-7">
          <TodayWait wait={wait} />
        </div>
      </Held>
    );
  }

  // `shared`: the shut door held in the lit sheet, in today's words, on its foot.
  const copy = shutDoorCopy(reader.wasIn);
  return (
    <Held reader={reader} behind={<RiverBehind named={false} />} hues={HOUSE}>
      <div className="flex flex-col gap-6 pt-7">
        <DoorHeading title={copy.title} reason={copy.description} />
        <Foot reader={reader} />
      </div>
    </Held>
  );
}

/**
 * THE WAIT IN TODAY'S SHEET: `WaitingDoor` itself for the wait as it ships
 * (`still`); for the two that do not ship, its heading (the clock in the
 * eyebrow, `waitingCopy`'s words, the told line first under `live`) over the
 * option's hold (`WaitHold`: the ticking clock, or her picks under today's mark).
 */
function TodayWait({ wait }: { wait: WaitId }) {
  if (wait === "still") return <WaitingDoor hostName={HOST.name} />;
  const copy = waitingCopy(HOST.name);
  return (
    <div className="flex flex-col gap-6">
      <DoorHeading
        eyebrow={
          <>
            <DoorGlyph icon={Clock} hue={1} className="size-3" />
            {HELD.eyebrow}
          </>
        }
        title={copy.title}
        reason={wait === "live" ? `${TOLD.text} ${copy.reason}` : copy.reason}
      />
      <WaitHold wait={wait} />
    </div>
  );
}

/**
 * THE 404 AS IT SHIPS: `e/[token]/not-found.tsx`'s page itself (its
 * session-less bar, its words, its help line and its demo link), the `lost=own`
 * answer in every direction, and today's `follows` too, since today's shut door
 * is already its sibling.
 */
export function TodayLost() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestNotFound />
    </div>
  );
}
