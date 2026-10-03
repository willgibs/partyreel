"use client";

import Image from "next/image";
import { Copy, QrCode, Share2 } from "lucide-react";

import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import { StyledQr } from "@/components/app/styled-qr";
import { marketingImage } from "@/lib/constants/marketing-media";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";

/**
 * THE CODE'S LOOK, WHERE GUESTS MEET IT (create-wizard r2 `look=places`, Will 2026-10-03; the step itself
 * is first-event's `style=step`: "Hosts may not know they can adjust it later. This introduces the
 * feature"). The centre is her code in the two places it really goes, her phone held up across a table
 * (the code card, `share/code-card.tsx`, at a phone: the whole screen white) and the corner of the
 * room's screen while the party runs (`live-reel-view.tsx`'s wall), and four swatches under them that
 * re-dress both as she picks.
 *
 * ★ PAPER IS NOT A PLACE THE LOOK GOES: the printed stock draws the classic code whatever the look
 * (`print-stock.tsx`: zero client JS, so the styled presets cannot follow onto paper), so the step shows
 * only the screens the look really reaches.
 *
 * ★ EVERY CODE HERE IS A SAMPLE, AND SAYS SO IN ONE WORD (round one's carried `sample`, kept): each
 * encodes the stand-in link (`previewJoinUrl`, as long as a real one so the density is hers, opening no
 * album), because the event and its link exist only once Create is pressed. The word sits on the code
 * she would hold up, the one a host might test-scan (crumbs-42: one did, and met a 404 nothing had
 * explained); her real code arrives on the very next screen.
 *
 * ★ THE PICTURES ARE PICTURES: one image to a reader (its name says what it shows), every mark inside
 * sized in the picture's own `cqw` (design-system.md's carve-out for type drawn inside a picture), so
 * one drawing reads the same at every size the room gives it. The photograph on the screen is a stand-in
 * from the marketing set (ASSETS: the room's screen at a party).
 */

/** The photograph the room's screen shows behind the code (a stand-in until the slot's own is made). */
const PARTY = marketingImage("party-dj");

/** The readable link a picture shows: the site's own host, the rest hers once the event exists. */
function pictureLink(siteUrl: string): string {
  try {
    return `${new URL(siteUrl).host}/e/…`;
  } catch {
    return "partyreel.com/e/…";
  }
}

/** Her phone held up: the code card at a phone, the whole screen white, its three doors under the name. */
function CodeCardPicture({
  look,
  name,
  link,
  joinUrl,
}: {
  look: QrStyleKey;
  name: string;
  link: string;
  joinUrl: string;
}) {
  return (
    <span data-look-picture="code-card" className="@container block">
      <span className="cr-phone block">
        <span className="cr-phone-glass flex flex-col items-center justify-center gap-[5cqw] bg-white px-[7cqw] text-neutral-900">
          <span
            data-look-sample=""
            className="rounded-full bg-black/[0.06] px-[3cqw] py-[0.6cqw] text-[3.4cqw] font-medium tracking-[0.1em] text-black/55 uppercase"
          >
            Sample
          </span>
          <span className="block w-[78cqw]">
            <StyledQr
              value={joinUrl}
              size={240}
              style={QR_PRESETS[look].options}
              className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            />
          </span>
          <span className="block max-w-full text-center">
            <span className="block truncate font-heading text-[6.2cqw] leading-tight">
              {name}
            </span>
            <span className="mt-[1cqw] block text-[3.6cqw] text-neutral-500">
              {link}
            </span>
          </span>
          <span className="flex w-full gap-[2cqw]">
            {[
              { icon: Copy, label: "Copy link" },
              { icon: Share2, label: "Share" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex h-[9cqw] flex-1 items-center justify-center gap-[1.2cqw] rounded-[2.6cqw] border border-neutral-300 text-[3.1cqw] font-medium whitespace-nowrap"
              >
                <Icon className="size-[3.4cqw]" />
                {label}
              </span>
            ))}
            <span className="flex h-[9cqw] flex-1 items-center justify-center gap-[1.2cqw] rounded-[2.6cqw] bg-neutral-900 text-[3.1cqw] font-medium whitespace-nowrap text-white">
              <QrCode className="size-[3.4cqw]" />
              Everything
            </span>
          </span>
          <span aria-hidden className="cr-phone-island" />
        </span>
      </span>
    </span>
  );
}

/**
 * The room's screen while the party runs: the slideshow full bleed, and bottom right the white plate with
 * "Scan to add yours" and the address beside it, as the live reel's wall draws them.
 */
function RoomScreenPicture({
  look,
  link,
  joinUrl,
}: {
  look: QrStyleKey;
  link: string;
  joinUrl: string;
}) {
  return (
    <span
      data-look-picture="room-screen"
      className="@container relative block aspect-video overflow-hidden rounded-[1.6cqw] bg-black ring-[0.5cqw] ring-[oklch(0.2_0_0)]"
    >
      <Image
        src={PARTY.src}
        alt=""
        fill
        sizes="(min-width: 768px) 500px, 300px"
        className="object-cover"
        draggable={false}
      />
      <span className="absolute inset-0 bg-gradient-to-tl from-black/60 via-transparent to-transparent" />
      <span className="absolute right-[3cqw] bottom-[3.4cqw] flex items-end gap-[2cqw]">
        <span className="text-right text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
          <span className="block font-heading text-[2.9cqw] leading-tight">
            Scan to add yours
          </span>
          <span className="mt-[0.4cqw] block text-[1.8cqw] text-white/85">
            {link}
          </span>
        </span>
        {/* Drawn at a scanner's size and scaled to the picture: a code under ~50 px has no room for its
            modules and draws nothing at all. */}
        <span className="block w-[17cqw] rounded-[0.8cqw] bg-white p-[0.6cqw]">
          <StyledQr
            value={joinUrl}
            size={200}
            style={QR_PRESETS[look].options}
            className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          />
        </span>
      </span>
    </span>
  );
}

export function LookStep({
  look,
  onLook,
  name,
  siteUrl,
  joinUrl,
}: {
  look: QrStyleKey;
  onLook: (look: QrStyleKey) => void;
  /** Her event's name, on the code she would hold up. */
  name: string;
  siteUrl: string;
  /** The stand-in every sample encodes (`previewJoinUrl`). */
  joinUrl: string;
}) {
  const link = pictureLink(siteUrl);
  return (
    <div className="flex w-full flex-col items-center">
      <div
        role="img"
        aria-label={`A sample of your code in ${QR_PRESETS[look].label}, on your phone and on the room's screen`}
        data-look-places=""
        className="cr-places"
      >
        <span className="cr-places-screen">
          <RoomScreenPicture look={look} link={link} joinUrl={joinUrl} />
        </span>
        <span className="cr-places-phone">
          <CodeCardPicture
            look={look}
            name={name}
            link={link}
            joinUrl={joinUrl}
          />
        </span>
      </div>
      <QrPresetPicker
        value={look}
        onChange={onLook}
        joinUrl={joinUrl}
        className="mt-6 md:mt-8"
      />
    </div>
  );
}
