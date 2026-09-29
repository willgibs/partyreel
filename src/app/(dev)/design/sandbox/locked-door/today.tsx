"use client";

import { Clock, Lock, QrCode } from "lucide-react";

import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

import { type DoorProps, seesAlbum } from "./door-props";
import {
  AlbumBehind,
  AskedMark,
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
  WelcomeFoot,
} from "./furniture";
import {
  BEAT,
  LOST,
  prose,
  shutWords,
  UNLISTED,
  waitWords,
  WAY_OUT,
  WELCOME,
} from "./words";

/**
 * TODAY'S DOOR, AS IT SHIPS: the measure every step grades against.
 *
 * The welcome is `entry-modal.tsx`'s `WelcomeStep` quoted class for class (its
 * hero, its byline, its two promise rows on pools, Continue and the consent
 * line, standing 55svh in a hand). The wait is the pick `settings-wiring`
 * builds from event-settings' `waiting=held` (the lit door heading "Almost in",
 * one line, a still mark). The shut door is the not-found family wearing a lock
 * (`e/[token]/page.tsx`'s private branch, word for word), and the line someone
 * who was in reads is the one `settings-wiring` adds to it.
 *
 * ★ TODAY'S SHUT DOOR DRAWS NO BACK-IN LINE, because production's does not; the
 * unlisted ask is drawn, because `settings-wiring` builds it on this screen.
 *
 * Its three shapes are the family's own: `split` is today exactly (the sheet
 * that opens, the page that does not); `shared` holds the shut door in the lit
 * sheet too (round one's "the door, held shut", in today's words); `bespoke`
 * gives the wait a page of its own (event-settings' `waiting=page`).
 */
export function TodayDoor(p: DoorProps) {
  const { reader, wait, album } = p;

  if (p.state === "lost") return <TodayLost />;

  if (p.container === "page") {
    if (p.state === "beat") {
      return (
        <Page reader={reader}>
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
      const words = waitWords("today", wait);
      return (
        <Page reader={reader}>
          <NotFoundScreen
            icon={Clock}
            title={words.title}
            description={<span data-ld-words>{prose(words.lines)}</span>}
            actions={
              wait === "pick" ? (
                <div className="w-full max-w-sm text-left">
                  <PickBlock phase="ready" />
                </div>
              ) : null
            }
            footnote={<AskedMark live={wait === "live"} hue={HOUSE[0]} />}
          />
        </Page>
      );
    }
    // The shut door, and the line someone who was in reads on it.
    const words = shutWords("today", reader.wasIn);
    return (
      <Page reader={reader}>
        <NotFoundScreen
          icon={Lock}
          title={words.title}
          description={<span data-ld-words>{prose(words.lines)}</span>}
          actions={
            reader.unlisted ? (
              <div data-ld-ask className="flex flex-col gap-2">
                <Button size="cta" tabIndex={-1}>
                  {UNLISTED.ask}
                </Button>
                <Button
                  size="cta"
                  variant="ghost"
                  className="text-muted-foreground"
                  tabIndex={-1}
                >
                  {UNLISTED.other}
                </Button>
              </div>
            ) : (
              <Button
                data-ld-way-out
                size="cta"
                variant="outline"
                tabIndex={-1}
              >
                {WAY_OUT}
              </Button>
            )
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

  if (p.state === "wait" || p.state === "beat") {
    const words = waitWords("today", wait);
    const beat = p.state === "beat";
    return (
      <Held
        reader={reader}
        behind={<RiverBehind named />}
        hues={beat ? album : HOUSE}
        lamp={beat ? "bloom" : "base"}
      >
        {beat ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <QuotedCheck hues={album} />
            <BeatWords pick={wait === "pick"} />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <DoorHeading
              eyebrow={
                <AlmostIn>
                  <span data-ld-words>{words.eyebrow}</span>
                </AlmostIn>
              }
              title={
                <span data-ld-words data-ld-title>
                  {words.title}
                </span>
              }
              reason={<span data-ld-words>{prose(words.lines)}</span>}
            />
            <span className="flex">
              <AskedMark live={wait === "live"} hue={HOUSE[0]} />
            </span>
            {wait === "pick" && <PickBlock phase="ready" />}
          </div>
        )}
      </Held>
    );
  }

  // `shared`: the shut door held in the lit sheet, in today's words.
  const words = shutWords("today", reader.wasIn);
  return (
    <Held reader={reader} behind={<RiverBehind named={false} />} hues={HOUSE}>
      <div className="flex flex-col gap-6">
        <DoorHeading
          title={
            <span data-ld-words data-ld-title>
              {words.title}
            </span>
          }
          reason={<span data-ld-words>{prose(words.lines)}</span>}
        />
        <Foot reader={reader} backIn={false} />
      </div>
    </Held>
  );
}

/**
 * THE 404 AS IT SHIPS (`e/[token]/not-found.tsx`), word for word, under the
 * session-less bar: the `lost=own` answer in every direction, and today's
 * `follows` too, since today's shut door is already its sibling.
 */
export function TodayLost() {
  return (
    <Page bar>
      <NotFoundScreen
        icon={QrCode}
        eyebrow={LOST.eyebrow}
        title={LOST.title}
        description={<span data-ld-words>{LOST.line}</span>}
        actions={
          <Button data-ld-way-out size="cta" tabIndex={-1}>
            {WAY_OUT}
          </Button>
        }
        help={<HelpLine href="/help">{LOST.help.link}</HelpLine>}
        footnote={
          <span className="font-medium text-brand underline-offset-4">
            {LOST.demo}
          </span>
        }
      />
    </Page>
  );
}
