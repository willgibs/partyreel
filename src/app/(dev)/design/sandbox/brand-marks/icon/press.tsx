"use client";

import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { marketingImage } from "@/lib/constants/marketing-media";

import type { ScreenId } from "../knobs";
import { type IconId, MonoMark, OnPaper, RingIcon } from "./ring";

/**
 * BESIDE THE WORDMARK, AS A PRESS KIT SETS THEM: the kit's own page (kit/
 * README.md: the wordmark stands alone, the symbol is the app icon, never a
 * lockup), so the icon and production's wordmark are judged side by side as
 * one family, each on its own tile: in the room, on paper, and in one colour
 * over footage, where a reel wears its watermark.
 *
 * ★ THE WORDMARK IS PRODUCTION'S `Logo`: the round-one pick being wired this
 * wave reaches this frame the day it lands, with nothing here to edit.
 */

function Tile({
  label,
  ground,
  children,
}: {
  label: string;
  ground: "room" | "paper";
  children: ReactNode;
}) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2.5">
      <div
        className={
          ground === "room"
            ? "dark flex items-center justify-center rounded-[8px] bg-background text-foreground"
            : "surface-paper flex items-center justify-center rounded-[8px] border bg-background text-foreground"
        }
        style={{ height: 220 }}
      >
        {children}
      </div>
      <figcaption className="text-label font-semibold text-muted-foreground uppercase">
        {label}
      </figcaption>
    </figure>
  );
}

function Word({ height }: { height: number }) {
  return (
    <span
      data-bm-where="the wordmark in the press kit"
      style={{ display: "block", height }}
    >
      <Logo className="h-full" />
    </span>
  );
}

/**
 * A reel's frame with its watermark: the mark and the word in one colour in
 * its corner, upright as a phone films it.
 */
function Footage({ id, phone }: { id: IconId; phone: boolean }) {
  const still = marketingImage("festival-lights");
  return (
    <div
      className="relative overflow-hidden rounded-[8px]"
      style={{ height: phone ? 420 : 468 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed still in a lab frame */}
      <img
        src={still.src}
        alt=""
        className="absolute inset-0 size-full object-cover"
        style={{ filter: "brightness(0.85)" }}
      />
      <div
        className="absolute flex items-center"
        style={{
          right: phone ? 14 : 22,
          bottom: phone ? 14 : 20,
          gap: phone ? 8 : 10,
          color: "rgb(255 255 255 / 0.92)",
        }}
      >
        <MonoMark
          id={id}
          size={phone ? 26 : 34}
          color="rgb(255 255 255 / 0.92)"
          read="the mark in one colour on footage"
        />
        <Word height={phone ? 15 : 19} />
      </div>
    </div>
  );
}

export function PressKit({ id, screen }: { id: IconId; screen: ScreenId }) {
  const phone = screen === "375";
  return (
    <div
      className="surface-paper min-h-screen bg-background text-foreground"
      style={{ padding: phone ? "28px 16px" : "48px 56px" }}
    >
      <p className="text-label font-semibold text-muted-foreground uppercase">
        Partyreel press kit
      </p>
      <h2 className="mt-2 font-heading text-section text-balance">
        The wordmark and the icon
      </h2>
      <div
        className="mt-8 grid"
        style={{
          gridTemplateColumns: phone ? "1fr" : "1fr 1fr 0.8fr",
          gap: phone ? 18 : 24,
        }}
      >
        <Tile label="The wordmark, in the room" ground="room">
          <Word height={phone ? 40 : 56} />
        </Tile>
        <Tile label="The icon, in the room" ground="room">
          <RingIcon
            id={id}
            size={phone ? 150 : 184}
            read="the icon beside the wordmark"
          />
        </Tile>
        <Tile label="The wordmark, on paper" ground="paper">
          <Word height={phone ? 40 : 56} />
        </Tile>
        <Tile label="The icon, on paper" ground="paper">
          <OnPaper size={184}>
            <RingIcon id={id} size={phone ? 150 : 184} />
          </OnPaper>
        </Tile>
        <figure
          className="m-0 flex min-w-0 flex-col gap-2.5"
          style={
            phone ? undefined : { gridColumn: 3, gridRow: "1 / span 2" }
          }
        >
          <Footage id={id} phone={phone} />
          <figcaption className="text-label font-semibold text-muted-foreground uppercase">
            In one colour, on footage
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
