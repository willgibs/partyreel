"use client";

import type { ReactNode } from "react";

import { PARTY } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import { AppIcon, Lockup, Wordmark } from "../marks";
import { Copy, type Screen, SlideFoot, SlideRoot } from "../parts";
import { Edge, GROUND, PARTY_EDGE } from "../system";

/**
 * 03 WORDMARK AND ICON: the wordmark large on paper and on ink, the icon at
 * a 1024 style and at 180, 60 and 29 px, its light and per-event variants,
 * and the lockup, each with the line of its idea.
 */

const WORDMARK_IDEA =
  "Bricolage Grotesque ExtraBold, spaced by hand. The P's foot and the l's head are cut on one 14° line, the angle of Will's v1, so the word is a strip of film cut at both ends.";
const ICON_IDEA =
  "Partyreel's P, printed the way film prints its frame numbers: paper on the film's ink, its foot cut like the wordmark's. ▸1A is its first frame.";

function Sized({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
      {children}
      <span className="cs-edge cs-faint" style={{ fontSize: 11 }}>
        {label}
      </span>
    </div>
  );
}

export function MarksSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <MarksDesk /> : <MarksPhone />;
}

function MarksDesk() {
  return (
    <SlideRoot screen="1440">
      <div className="absolute" style={{ left: 64, top: HEAD["1440"] + 46, width: 760 }}>
        <Wordmark height={146} read="wordmark on paper" />
        <Copy size={15} lead={22} style={{ marginTop: 26, maxWidth: 640 }}>
          {WORDMARK_IDEA}
        </Copy>
        <div
          className="cs-on-room"
          style={{
            marginTop: 30,
            background: GROUND.ink.hex,
            padding: "40px 44px 34px",
            borderRadius: 2,
          }}
        >
          <Wordmark height={84} color={GROUND.paper.hex} read="wordmark on ink" />
          <Edge items={PARTY_EDGE} size={12} style={{ marginTop: 24, color: GROUND.roomMuted.hex }} />
        </div>
        <Copy size={14} lead={20} style={{ marginTop: 12 }}>
          On ink, with the event&rsquo;s edge under it: how a hero&rsquo;s foot and the footer sign off.
        </Copy>
        <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 34 }}>
          <Lockup height={46} read="lockup" />
          <Copy size={14} lead={20} style={{ maxWidth: 300 }}>
            The lockup: the icon a third taller, so both P&rsquo;s share a cap height.
          </Copy>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40, marginTop: 34 }}>
          <Sized label="22 px, the nav">
            <Wordmark height={22} read="wordmark at 22" />
          </Sized>
          <Sized label="15 px, a credit">
            <Wordmark height={15} />
          </Sized>
          <Sized label="22 px, on ink">
            <div style={{ background: GROUND.ink.hex, padding: "9px 12px" }}>
              <Wordmark height={22} color={GROUND.paper.hex} />
            </div>
          </Sized>
        </div>
      </div>
      <div className="absolute" style={{ left: 884, top: HEAD["1440"] + 46, width: 492 }}>
        <AppIcon size={296} read="app icon, 1024 style" />
        <Copy size={15} lead={22} style={{ marginTop: 22, maxWidth: 470 }}>
          {ICON_IDEA}
        </Copy>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginTop: 30 }}>
          <Sized label="180">
            <AppIcon size={180} read="icon 180" />
          </Sized>
          <Sized label="60">
            <AppIcon size={60} read="icon 60" />
          </Sized>
          <Sized label="29">
            <AppIcon size={29} read="icon 29" />
          </Sized>
          <Sized label="On paper">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <AppIcon size={60} ground="paper" />
              <AppIcon size={29} ground="paper" />
            </div>
          </Sized>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 26 }}>
          <AppIcon size={60} seed={PARTY.seed} read="an event's own icon" />
          <Copy size={14} lead={20} style={{ maxWidth: 360 }}>
            An event&rsquo;s own icon, kept on a guest&rsquo;s home screen: the same P on the event&rsquo;s latent image.
          </Copy>
        </div>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

function MarksPhone() {
  return (
    <SlideRoot screen="375">
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 28 }}>
        <Wordmark width={330} read="wordmark on paper" />
        <Copy size={14} lead={20} style={{ marginTop: 16 }}>
          {WORDMARK_IDEA}
        </Copy>
        <div
          className="cs-on-room"
          style={{ marginTop: 20, background: GROUND.ink.hex, padding: "26px 20px 22px", borderRadius: 2 }}
        >
          <Wordmark width={240} color={GROUND.paper.hex} read="wordmark on ink" />
          <Edge items={PARTY_EDGE} size={11} style={{ marginTop: 16, color: GROUND.roomMuted.hex }} />
        </div>
        <div style={{ marginTop: 36 }}>
          <AppIcon size={240} read="app icon, 1024 style" />
        </div>
        <Copy size={14} lead={20} style={{ marginTop: 16 }}>
          {ICON_IDEA}
        </Copy>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 24 }}>
          <Sized label="180">
            <AppIcon size={180} read="icon 180" />
          </Sized>
          <Sized label="60">
            <AppIcon size={60} read="icon 60" />
          </Sized>
          <Sized label="29">
            <AppIcon size={29} read="icon 29" />
          </Sized>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 22 }}>
          <Sized label="On paper">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <AppIcon size={60} ground="paper" />
              <AppIcon size={29} ground="paper" />
            </div>
          </Sized>
          <Sized label="An event's own">
            <AppIcon size={60} seed={PARTY.seed} read="an event's own icon" />
          </Sized>
        </div>
        <div style={{ marginTop: 32 }}>
          <Lockup height={40} read="lockup" />
          <Copy size={14} lead={20} style={{ marginTop: 12 }}>
            The lockup: the icon a third taller, so both P&rsquo;s share a cap height.
          </Copy>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginTop: 28 }}>
          <Sized label="22 px, the nav">
            <Wordmark height={22} read="wordmark at 22" />
          </Sized>
          <Sized label="15 px">
            <Wordmark height={15} />
          </Sized>
          <Sized label="On ink">
            <div style={{ background: GROUND.ink.hex, padding: "8px 10px" }}>
              <Wordmark height={20} color={GROUND.paper.hex} />
            </div>
          </Sized>
        </div>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
