"use client";

import { Copy, QrCode, Share2 } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import {
  QR_PRESETS,
  QR_STYLE_KEYS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { EVENT, SAMPLE_LINK, SLIDESHOW } from "./fixtures";
import { CodePlate, Corner } from "./pictures";

/**
 * THE CODE'S LOOK, ON SAMPLES (`style=step`, settled: the step introduces a
 * feature a host would otherwise never find). The question is up top, so the
 * centre is the code's, and the decision (`look`) is what the centre shows:
 *
 *  - `plate`: the code itself, large, its four looks as corners under it;
 *  - `places`: the code where guests meet it (held up on her phone, the
 *    code card, and in the corner of the room's screen), re-dressed as she
 *    picks;
 *  - `four`: every look whole, side by side, the pick lit.
 *
 * ★ PAPER IS NOT A PLACE THE LOOK GOES: the printed stock is the classic
 * code whatever the style (`print-stock.tsx`: zero client JS, so the styled
 * presets cannot follow onto paper), so `places` draws only the screens the
 * look really reaches.
 *
 * Every code here encodes the stand-in link and says Sample (round one's
 * carried call `sample`): the event and its link exist only once Create is
 * pressed.
 */

export type LookWay = "plate" | "places" | "four";

/** One look to pick: its corner and its name, the pick ringed. */
function Swatch({
  styleKey,
  on,
  size,
  onPick,
}: {
  styleKey: QrStyleKey;
  on: boolean;
  size: number;
  onPick?: (k: QrStyleKey) => void;
}) {
  return (
    <button
      type="button"
      data-cw-style={styleKey}
      data-state={on ? "on" : "off"}
      tabIndex={onPick ? 0 : -1}
      onClick={onPick ? () => onPick(styleKey) : undefined}
      className={cn(
        "flex flex-col items-center gap-2",
        onPick ? "cursor-pointer" : "cursor-default",
      )}
    >
      <Corner
        styleKey={styleKey}
        link={SAMPLE_LINK}
        size={size}
        className={cn(on && "cw-picked")}
      />
      <span
        className={cn(
          "text-caption",
          on ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {QR_PRESETS[styleKey].label}
      </span>
    </button>
  );
}

function Swatches({
  picked,
  wide,
  onPick,
  className,
}: {
  picked: QrStyleKey;
  wide: boolean;
  onPick?: (k: QrStyleKey) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="The code's look"
      className={cn("flex justify-center", wide ? "gap-7" : "gap-5", className)}
    >
      {QR_STYLE_KEYS.map((k) => (
        <Swatch
          key={k}
          styleKey={k}
          on={k === picked}
          size={wide ? 64 : 54}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

/* ── the places the look really goes ───────────────────────────────────── */

/**
 * The code card held up on her phone (`share/code-card.tsx` at a phone: the
 * whole screen white, the code, the name and the link, its three doors), a
 * picture in `cqw` like every phone here.
 */
function CardOnPhone({ look, width }: { look: QrStyleKey; width: number }) {
  return (
    <span className="@container block" style={{ width }}>
      <span className="cw-phone block">
        <span
          data-cw-picture="code-card"
          className="cw-phone-glass flex flex-col items-center justify-center gap-[5cqw] bg-white px-[7cqw] text-neutral-900"
        >
          <span className="block w-[78cqw]">
            <StyledQr
              value={SAMPLE_LINK}
              size={240}
              style={QR_PRESETS[look].options}
              className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            />
          </span>
          <span className="block text-center">
            <span className="block font-heading text-[6.2cqw] leading-tight">
              {EVENT.name}
            </span>
            <span className="mt-[1cqw] block text-[3.6cqw] text-neutral-500">
              partyreel.com/e/maya-jay
            </span>
          </span>
          <span className="flex w-full gap-[2cqw]">
            {[
              { icon: Copy, label: "Copy link" },
              { icon: Share2, label: "Share" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex h-[9cqw] flex-1 items-center justify-center gap-[1.2cqw] rounded-[2.6cqw] border border-neutral-300 text-[3.3cqw] font-medium"
              >
                <Icon className="size-[3.6cqw]" />
                {label}
              </span>
            ))}
            <span className="flex h-[9cqw] flex-1 items-center justify-center gap-[1.2cqw] rounded-[2.6cqw] bg-neutral-900 text-[3.3cqw] font-medium text-white">
              <QrCode className="size-[3.6cqw]" />
              All
            </span>
          </span>
          <span aria-hidden className="cw-phone-island" />
        </span>
      </span>
    </span>
  );
}

/**
 * The room's screen while the party runs (`live-reel-view.tsx`'s wall): the
 * slideshow full bleed, and bottom right the white plate with "Scan to add
 * yours" and the address beside it.
 */
function ScreenOnWall({ look, width }: { look: QrStyleKey; width: number }) {
  return (
    <span
      data-cw-picture="room-screen"
      className="@container relative block overflow-hidden rounded-[1.6cqw] bg-black ring-[0.5cqw] ring-[oklch(0.2_0_0)]"
      style={{ width, aspectRatio: "16 / 9" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local still on a pictured screen */}
      <img
        src={SLIDESHOW.src}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-tl from-black/60 via-transparent to-transparent" />
      <span className="absolute right-[3cqw] bottom-[3.4cqw] flex items-end gap-[2cqw]">
        <span className="text-right text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
          <span className="block font-heading text-[2.9cqw] leading-tight">
            Scan to add yours
          </span>
          <span className="mt-[0.4cqw] block text-[1.8cqw] text-white/85">
            partyreel.com/e/maya-jay
          </span>
        </span>
        {/* Drawn at a scanner's size and scaled to the picture: a code under
            ~50 px has no room for its modules and draws nothing at all. */}
        <span className="block w-[17cqw] rounded-[0.8cqw] bg-white p-[0.6cqw]">
          <StyledQr
            value={SAMPLE_LINK}
            size={200}
            style={QR_PRESETS[look].options}
            className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          />
        </span>
      </span>
    </span>
  );
}

/* ── the three centres ────────────────────────────────────────────────── */

export function LookCentre({
  way,
  wide,
  picked,
  onPick,
}: {
  way: LookWay;
  wide: boolean;
  picked: QrStyleKey;
  onPick?: (k: QrStyleKey) => void;
}) {
  if (way === "plate")
    return (
      <div data-cw-look={way} className="flex flex-col items-center">
        <span data-cw-hero data-cw-carry="pick" className="block">
          <CodePlate
            link={SAMPLE_LINK}
            styleKey={picked}
            size={wide ? 236 : 196}
            sample
          />
        </span>
        <Swatches
          picked={picked}
          wide={wide}
          onPick={onPick}
          className={wide ? "mt-10" : "mt-8"}
        />
      </div>
    );

  if (way === "places") {
    // At a phone the screen stands behind and the phone in front of its
    // lower left; at a desk they stand side by side, the phone overlapping
    // the screen's edge, so the pair uses the room's width, not its height.
    const screen = wide ? 500 : 300;
    const phone = wide ? 168 : 146;
    const phoneH = (phone * 19.2) / 9;
    const screenH = (screen * 9) / 16;
    const box = wide
      ? { width: screen + phone * 0.62, height: phoneH }
      : { width: screen, height: screenH + phoneH - phone * 0.9 };
    return (
      <div data-cw-look={way} className="flex flex-col items-center">
        <div data-cw-hero data-cw-carry="pick" className="relative" style={box}>
          <span
            className="absolute right-0"
            style={{ top: wide ? (phoneH - screenH) / 2 : 0 }}
          >
            <ScreenOnWall look={picked} width={screen} />
          </span>
          <span
            className={cn(
              "absolute",
              wide ? "top-0 left-0" : "bottom-0 left-[6%]",
            )}
          >
            <CardOnPhone look={picked} width={phone} />
          </span>
        </div>
        <Swatches
          picked={picked}
          wide={wide}
          onPick={onPick}
          className={wide ? "mt-8" : "mt-6"}
        />
      </div>
    );
  }

  // four: every look whole, side by side, the pick lit.
  const size = wide ? 168 : 136;
  return (
    <div
      data-cw-look={way}
      role="radiogroup"
      aria-label="The code's look"
      className={cn(
        "grid grid-cols-2",
        wide ? "gap-x-10 gap-y-6" : "gap-x-5 gap-y-5",
      )}
    >
      {QR_STYLE_KEYS.map((k) => {
        const on = k === picked;
        return (
          <button
            key={k}
            type="button"
            data-cw-style={k}
            data-state={on ? "on" : "off"}
            tabIndex={onPick ? 0 : -1}
            onClick={onPick ? () => onPick(k) : undefined}
            className={cn(
              "flex flex-col items-center gap-2.5",
              onPick ? "cursor-pointer" : "cursor-default",
            )}
          >
            <span
              data-cw-carry={on ? "pick" : undefined}
              className={cn("block", on && "cw-chosen")}
            >
              <CodePlate
                link={SAMPLE_LINK}
                styleKey={k}
                size={size}
                name={null}
                sample={on}
                pad={0.02}
                className={cn(on && "cw-picked")}
              />
            </span>
            <span
              className={cn(
                "text-working",
                on ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {QR_PRESETS[k].label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
