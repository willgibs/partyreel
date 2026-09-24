"use client";

import { Play } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { GLASS, GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { HOST_FIRST, JOIN_LABEL, JOIN_URL, QR_STYLE, WAITING } from "./fixtures";
import { EngineStill } from "./stills";

/**
 * THE BIG SCREEN, AS THE VIEW IS ON IT (his ruling: "The view is the wall").
 *
 * The same view in its screen posture: full bleed, the code on as his white
 * plate bottom right (`qr=corner`), the slim bar at rest, and no event name
 * (`name=none`). Drawn here only where a host-side question has to show what
 * each option puts in front of the room, which is the merged `review` ask.
 *
 * ★ CONTAINER UNITS, SO A TELEVISION IS THE SAME TELEVISION AT ANY SIZE. The
 * review composite draws the screen at half a 1920 wall beside a phone, inside
 * one 1440 frame, and `vw` there would read the composite's width. Every length
 * below is a share of the screen's own width (`cqw`), so the furniture keeps a
 * 1920 wall's proportions wherever the box is: the reason `reel-screen` can
 * draw its walls at 1:1 while this board draws one at half.
 *
 * ★ THE ROOM SEES WHAT THE SCREEN SAYS, SO EACH OPTION DRAWS EXACTLY THAT. The
 * resting screen carries the code's words and nothing else; the two options
 * that speak on it add one line each, and every other option's screen is
 * honestly the same picture.
 */

const INK =
  "[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_28px_rgb(0_0_0/0.45)]";

export function Tv({ says = "nothing" }: { says?: "nothing" | "chip" | "room" }) {
  return (
    <div
      data-rh-tv={says}
      className="@container relative aspect-video w-full overflow-hidden rounded-[6px] bg-black ring-1 ring-white/10"
    >
      <EngineStill id="landscape" label="The reel, on the screen" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[34%] bg-linear-to-t from-black/75 via-black/30 to-transparent"
      />

      {/* The slim bar at rest: the view is the wall, so the wall wears it. */}
      <div
        aria-hidden
        className={cn(
          "absolute left-1/2 flex -translate-x-1/2 items-center rounded-full text-white/80",
          GLASS,
        )}
        style={{
          bottom: "3.4cqw",
          width: "12cqw",
          height: "2cqw",
          gap: "0.7cqw",
          paddingInline: "0.8cqw",
        }}
      >
        <Play className="fill-white/80" style={{ width: "0.9cqw", height: "0.9cqw" }} />
        <span className="flex-1 overflow-hidden rounded-full bg-white/25" style={{ height: "0.25cqw" }}>
          <span className="block h-full w-2/5 rounded-full bg-white/80" />
        </span>
      </div>

      {/* The code, his white plate: the only words a resting screen carries. */}
      <div
        data-rh-tv-code=""
        className="absolute flex items-center"
        style={{ right: "3.4cqw", bottom: "3.4cqw", gap: "1.2cqw" }}
      >
        <div className={cn("text-right", INK)}>
          <p
            className="font-heading leading-none font-medium text-white"
            style={{ fontSize: "2cqw" }}
          >
            Scan to add yours
          </p>
          <p
            className="text-white/75 tabular-nums"
            style={{ fontSize: "1.25cqw", marginTop: "0.4cqw" }}
          >
            {JOIN_LABEL}
          </p>
        </div>
        <div
          className="rounded-[var(--radius)] bg-white"
          style={{ width: "10.4cqw", padding: "0.6cqw", lineHeight: 0 }}
        >
          <StyledQr
            value={JOIN_URL}
            size={180}
            style={QR_STYLE}
            className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          />
        </div>
      </div>

      {says === "chip" ? (
        <div
          data-rh-tv-said=""
          className={cn(
            "absolute flex items-center rounded-full text-white/90 tabular-nums",
            GLASS_MARK,
          )}
          style={{
            left: "3.4cqw",
            bottom: "3.4cqw",
            gap: "0.7cqw",
            padding: "0.55cqw 1.1cqw",
            fontSize: "1.45cqw",
          }}
        >
          <span
            className="rounded-full bg-warning"
            style={{ width: "0.7cqw", height: "0.7cqw" }}
          />
          {WAITING} waiting, on your phone
        </div>
      ) : null}

      {says === "room" ? (
        <>
          {/* A scrim for what is actually there: the line owns the head of
              the screen, so the head gets its ground and nothing else does. */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[22%] bg-linear-to-b from-black/70 via-black/30 to-transparent"
          />
          <p
            data-rh-tv-said=""
            className={cn("absolute inset-x-0 text-center text-white/90", INK)}
            style={{ top: "3.4cqw", fontSize: "1.7cqw" }}
          >
            New photos appear once {HOST_FIRST} approves them.
          </p>
        </>
      ) : null}
    </div>
  );
}
