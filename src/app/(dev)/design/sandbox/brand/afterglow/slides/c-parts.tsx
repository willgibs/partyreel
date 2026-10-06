"use client";

import type { ReactNode } from "react";

import { BrowserWindow, Note, PhoneView } from "../kit";
import { type Ground, Readout, ROOM, tone } from "../system";
import { inkOf, type Take, useTake } from "../take";

/**
 * THE TOUCHPOINTS' STAGE (slides 09 to 11): one real page, drawn at its real
 * size and shown the way a screenshot is, in a browser at a desk and in a
 * phone beside it, and one short note under them that says what the page
 * proves. The three slides share this stage so pressing between them, and
 * between takes, moves only the page.
 *
 * ★ THE DESK IS A STEP OFF THE PAGE'S OWN GROUND, never the ground itself: a
 * room page sits on the display's near-black and a paper page on its stock a
 * shade deeper, so the page reads as a page (its edge, its fold) and the
 * slide's own ground never competes with the light inside it.
 */

/** The browser on a desk slide (px on the 1440 by 900 slide). */
const BROWSER = { left: 64, top: 100, width: 960 } as const;
/** The phone beside it, flush with the deck's right margin. */
const PHONE = { right: 64, width: 300 } as const;

/** The browser's drawn height: its bar and the 1440 by 900 page, scaled. */
function browserHeight(width: number): number {
  return (
    Math.round(Math.max(18, width * 0.032)) + Math.round(900 * (width / 1440))
  );
}

/** A `PhoneView`'s drawn height at a width, for its 812 px viewport. */
function phoneHeight(width: number): number {
  const bezel = Math.round(width * 0.03);
  return Math.round(812 * ((width - 2 * bezel) / 375)) + 2 * bezel;
}

/** The desk a page stands on: the display in the room, the stock a shade deeper on paper. */
export function deskOf(take: Take, ground: Ground): string {
  if (ground === "room") return ROOM.display.hex;
  const p = take.paper.ground;
  return tone(p.l - 0.036, p.c * 1.25, p.h).hex;
}

/** A hairline in a ground's own ink. */
export function ruleOf(ground: Ground): string {
  return ground === "room" ? "rgb(255 255 255 / 0.08)" : "rgb(20 20 22 / 0.1)";
}

/**
 * THE DESK SLIDE: the page in a browser on the left, the same page at 375 in
 * a phone on the right (at the scroll its caption names), their captions on
 * one line under them, and the note.
 */
export function DeskStage({
  ground,
  url,
  page,
  phone,
  phonePage,
  phoneScroll = 0,
  phoneCaption,
  label,
  note,
  aside,
}: {
  ground: Ground;
  url: string;
  /** The page at 1440 by 900. */
  page: ReactNode;
  /** The page at 375 wide. */
  phone: ReactNode;
  /** The phone page's whole height, when it scrolls. */
  phonePage?: number;
  phoneScroll?: number;
  /** What the phone shows, said under it. */
  phoneCaption: string;
  label: string;
  note: ReactNode;
  /** A small drawing beside the note, under the browser's right side. */
  aside?: ReactNode;
}) {
  const take = useTake();
  const t = inkOf(take, ground);
  const bh = browserHeight(BROWSER.width);
  const ph = phoneHeight(PHONE.width);
  const phoneTop = BROWSER.top + Math.round((bh - ph) / 2);
  const under = BROWSER.top + bh + 30;
  return (
    <>
      <BrowserWindow
        width={BROWSER.width}
        ground={ground}
        url={url}
        style={{ position: "absolute", left: BROWSER.left, top: BROWSER.top }}
      >
        {page}
      </BrowserWindow>
      <PhoneView
        width={PHONE.width}
        ground={ground}
        on={ground}
        pageH={phonePage}
        scroll={phoneScroll}
        style={{ position: "absolute", right: PHONE.right, top: phoneTop }}
      >
        {phone}
      </PhoneView>
      <Readout
        className="absolute"
        style={{
          right: PHONE.right,
          top: under,
          width: PHONE.width,
          textAlign: "center",
          color: t.faint,
        }}
      >
        {phoneCaption}
      </Readout>
      <Note
        ground={ground}
        label={label}
        width={aside ? 560 : 640}
        style={{ position: "absolute", left: BROWSER.left, top: under }}
      >
        {note}
      </Note>
      {aside ? (
        <div
          className="absolute"
          style={{
            left: BROWSER.left + 600,
            top: under,
            width: BROWSER.width - 600,
          }}
        >
          {aside}
        </div>
      ) : null}
    </>
  );
}

/**
 * THE PHONE SLIDE: the page itself at 1:1 from the slide's top (the deck's
 * running head lies over its status bar), then the note under a hairline.
 */
export function PhoneStage({
  ground,
  pageH,
  page,
  label,
  note,
  after,
}: {
  ground: Ground;
  /** How much of the page the slide shows, from its top. */
  pageH: number;
  page: ReactNode;
  label: string;
  note: ReactNode;
  /** A small drawing under the note. */
  after?: ReactNode;
}) {
  return (
    <>
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: pageH }}
      >
        {page}
      </div>
      <div
        className="absolute inset-x-0"
        style={{
          top: pageH,
          paddingInline: 20,
          paddingTop: 26,
          borderTop: `1px solid ${ruleOf(ground)}`,
        }}
      >
        <Note ground={ground} label={label}>
          {note}
        </Note>
        {after ? <div style={{ marginTop: 26 }}>{after}</div> : null}
      </div>
    </>
  );
}
