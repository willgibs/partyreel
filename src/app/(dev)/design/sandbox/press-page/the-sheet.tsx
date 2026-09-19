"use client";

import Image from "next/image";

import { BrowserFrame } from "@/components/marketing/frames";
import { PressSheet } from "@/components/marketing/press/press-sheet";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { marketingImage } from "@/lib/constants/marketing-media";
import { PRESS_KIT } from "@/lib/constants/press";

import { FixtureNote } from "./shared";

/**
 * DECISION 2: WHAT THE SHEET SHOWS. `eight-plates` renders the real,
 * unedited PressSheet (the option this decision recommends changes nothing
 * about). `marks-only` and `brand-in-use` are new small compositions on the
 * same real kit files and plate-ground rule (a plate is the artwork's own
 * ground, literal colour, never a theme utility), never edits to
 * press-sheet.tsx itself.
 */

function findAsset(id: string) {
  const asset = PRESS_KIT.find((a) => a.id === id);
  if (!asset) throw new Error(`PRESS_KIT is missing "${id}"`);
  return asset;
}

function MarksOnly() {
  const mark = findAsset("mark-dark");
  const icon = findAsset("app-icon");
  return (
    <div>
      <ul className="grid max-w-md grid-cols-2 gap-[var(--gap-gallery)] rounded-tile bg-border p-[var(--gap-gallery)]">
        <li className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-tile bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- static press asset, press-sheet.tsx's own pattern. */}
          <img src={mark.file} alt="" className="size-[54%]" />
        </li>
        <li className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-tile bg-white">
          <Image src={icon.file} alt="" width={512} height={512} className="size-[46%] rounded-[18%]" />
        </li>
      </ul>
      <FixtureNote>
        Two plates instead of eight: the mark and the app icon, the two files
        the v1 icon does not change. The QR, share card, ink swatch and type
        pointer move into Words as a plain list until the icon lands.
      </FixtureNote>
    </div>
  );
}

function BrandInUse() {
  const shots = ["wedding-golden", "party-dj", "reception-table", "festival-lights"];
  return (
    <div className="flex flex-col gap-5">
      <PressSheet />
      <div className="rounded-tile border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">
          In the app
        </p>
        <BrowserFrame label="partyreel.com/a/maya-and-jay" className="mx-auto w-full max-w-sm">
          <div className="relative">
            <div className="grid grid-cols-2 gap-1">
              {shots.map((id) => (
                <span key={id} className="relative block aspect-square overflow-hidden rounded-md bg-muted">
                  <Image
                    src={marketingImage(id).src}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
            <Logo markOnly className="pointer-events-none absolute top-2 left-2" />
          </div>
        </BrowserFrame>
      </div>
      <FixtureNote className="mx-auto max-w-md text-center">
        A ninth plate showing the mark over a real guest album, so a reporter
        sees the brand on the thing rather than only on a swatch.
      </FixtureNote>
    </div>
  );
}

export function SheetPreview({
  variant,
}: {
  variant: "eight-plates" | "marks-only" | "brand-in-use";
}) {
  return (
    <Container className="py-10">
      {variant === "marks-only" ? (
        <MarksOnly />
      ) : variant === "brand-in-use" ? (
        <BrandInUse />
      ) : (
        <PressSheet />
      )}
    </Container>
  );
}
