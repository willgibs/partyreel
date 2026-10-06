"use client";

import { Check, Download, FolderUp, X } from "lucide-react";
import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  ClipsLine,
  OriginalsCard,
  PhoneSizeCard,
} from "@/components/app/export/take-home-panel";
import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { floatingWorkSurface } from "@/components/ui/floating-layer";
import { Switch } from "@/components/ui/switch";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { ExportSummary } from "@/lib/export/build-manifest";
import { setNoun, takeHomeSizes } from "@/lib/export/take-home";
import { cn } from "@/lib/utils";

/**
 * TAKE IT HOME, AS THE HOST MEETS IT (retired-mocks): the panel her album's Download opens, drawn from the panel's own
 * pieces (`take-home-panel.tsx`'s `OriginalsCard`, `PhoneSizeCard` and `ClipsLine`), so a set's name, its purpose,
 * the shape of its facts and its picture are the product's and move with it. Only the frame is drawn here (the plan
 * popup's work layer, its head and its Include hidden items row, whose words `mock-parity.test.ts` pins), and the
 * acts, which are the product's buttons with nothing behind them.
 *
 * One figure, two places: the sharing page's signature (`ZipModalDemo`, `live`: the switch re-sizes both sets through
 * the product's own `takeHomeSizes`, and a Download plays the icon swap instead of pretending to zip anything), and
 * the host's Take it home step on /how-it-works and in the help center (`KeepPicture`, still). The figure lays out as
 * the panel does by the room it is given rather than the window: side by side where a desk's panel would be, the
 * hand's stack, phone size first, in a narrow column.
 *
 * The album is the site's one fictional wedding, an art-directed fixture formatted by the product's own functions.
 */

const MB = 1024 * 1024;

/** Maya & Jay's album, as the server would sum it: 214 photographs and 12 clips shown, 11 and 1 hidden. */
const SUMMARY: ExportSummary = {
  shown: {
    photo: { count: 214, bytes: 214 * 3.4 * MB, phone: 214 * 0.62 * MB },
    video: { count: 12, bytes: 12 * 61 * MB, phone: 12 * 61 * MB },
  },
  hidden: {
    photo: { count: 11, bytes: 11 * 3.4 * MB, phone: 11 * 0.62 * MB },
    video: { count: 1, bytes: 48 * MB, phone: 48 * MB },
  },
};

/** The album's newest photographs, which picture both sets (each card its own run of them). */
const PICTURES = [
  "wedding-golden",
  "party-dj",
  "wedding-toast",
  "reception-hall",
  "wedding-petals",
  "festival-lights",
  "wedding-rings",
].map((id) => {
  const still = marketingImage(id);
  // The optimizer's small copy (a card's cell is a few dozen pixels), as the product's tile is a preview.
  return getImageProps({
    src: still.src,
    width: 240,
    height: Math.round((240 * still.height) / still.width),
    alt: "",
  }).props.src;
});

/** A product button that is a picture of one: out of the tab order, its press the caller's to give. */
function Act({
  lead,
  icon,
  label,
  onPress,
}: {
  lead: boolean;
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Button
      type="button"
      variant={lead ? "default" : "outline"}
      size="sm"
      tabIndex={onPress ? undefined : -1}
      onClick={onPress}
    >
      {icon} {label}
    </Button>
  );
}

/** Download, then a check for a beat: the one answer the figure gives to a press. */
function useSwap() {
  const [on, setOn] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const press = (key: string) => {
    if (timer.current) clearTimeout(timer.current);
    setOn(key);
    timer.current = setTimeout(() => setOn(null), 1400);
  };
  return { on, press };
}

function SwapIcon({ done }: { done: boolean }) {
  return (
    <span className="mkt-icon-swap" data-state={done ? "b" : "a"} aria-hidden>
      <span className="mkt-icon" data-icon="a">
        <Download />
      </span>
      <span className="mkt-icon" data-icon="b">
        <Check />
      </span>
    </span>
  );
}

/** The two sets in one layout of the panel's: a desk's pair, originals first, or a hand's stack, phone size first. */
function Sets({
  desk,
  includeHidden,
  live,
}: {
  desk: boolean;
  includeHidden: boolean;
  live: boolean;
}) {
  const sizes = takeHomeSizes(SUMMARY, includeHidden);
  const { on, press } = useSwap();
  const originals = (
    <OriginalsCard
      key="originals"
      sizes={sizes}
      pictures={PICTURES}
      desk={desk}
      act={
        <>
          <Act
            lead={desk}
            icon={<SwapIcon done={on === "originals"} />}
            label="Download"
            onPress={live ? () => press("originals") : undefined}
          />
          <Act lead={false} icon={<FolderUp />} label="Send to Drive" />
        </>
      }
    />
  );
  const phone = (
    <PhoneSizeCard
      key="phone"
      sizes={sizes}
      pictures={PICTURES}
      desk={desk}
      act={
        <Act
          lead={!desk}
          icon={<SwapIcon done={on === "phone"} />}
          label="Download"
          onPress={live ? () => press("phone") : undefined}
        />
      }
    />
  );
  return (
    <div className={cn("gap-3", desk ? "grid grid-cols-2" : "flex flex-col")}>
      {desk ? [originals, phone] : [phone, originals]}
    </div>
  );
}

/**
 * THE PANEL, DRAWN: the plan popup's work layer and corner, its head (the title and what the album holds, in
 * `setNoun`'s words), the two sets, the clips' line and the hidden switch.
 */
export function TakeHomeFigure({
  live = false,
  className,
}: {
  live?: boolean;
  className?: string;
}) {
  const [includeHidden, setIncludeHidden] = useState(false);
  const sizes = takeHomeSizes(SUMMARY, includeHidden);
  return (
    <div
      data-take-home-figure=""
      className={cn(
        "@container relative w-full max-w-xl overflow-hidden rounded-[calc(var(--radius-float)*1.25)] text-sm",
        floatingWorkSurface,
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute top-2 right-2 flex size-7 items-center justify-center text-muted-foreground"
      >
        <X className="size-4" />
      </span>
      <div className="flex flex-col gap-1 p-4 pr-12">
        <p className="font-heading text-card-title text-pretty">Take it home</p>
        <p className="text-sm text-pretty text-muted-foreground tabular-nums">
          {setNoun(sizes.photos, sizes.clips)}
        </p>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {/* The panel's layout by the figure's own width (a desk's pair from 30rem, as wide as a desk panel's cards stand): the hand's stack below it. */}
        <div className="hidden @min-[30rem]:block">
          <Sets desk includeHidden={includeHidden} live={live} />
        </div>
        <div className="@min-[30rem]:hidden">
          <Sets desk={false} includeHidden={includeHidden} live={live} />
        </div>
        <ClipsLine sizes={sizes} />
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Include hidden items</span>
          <Switch
            checked={includeHidden}
            onCheckedChange={live ? setIncludeHidden : undefined}
            tabIndex={live ? undefined : -1}
            aria-label="Include hidden items"
          />
        </label>
      </div>
    </div>
  );
}

/**
 * THE SIGNATURE (sharing page): the host's Take it home, working. Flip Include hidden items and both sets re-size as
 * the panel does; press a Download and it answers with a check.
 */
export function ZipModalDemo() {
  return (
    <div role="group" aria-label="Take it home demo">
      {/* The quiet stage: in the app the panel floats over the album, so the figure gets a muted backdrop and the
          work layer's own shadow instead of sitting flush on the page. */}
      <div className="rounded-2xl border bg-muted/40 p-4 sm:p-8">
        <TakeHomeFigure live className="mx-auto" />
      </div>
      <Caption className="mt-4 text-center">
        the host&rsquo;s Take it home · guests pick with Select, then Save
      </Caption>
    </div>
  );
}
