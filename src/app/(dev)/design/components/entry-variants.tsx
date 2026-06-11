import Image from "next/image";
import { Camera, Images, Smartphone } from "lucide-react";

import { COVER_PHOTO, EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the guest entry moment. Three stagings of the same welcome
 * content; the gates (password/account) would inherit whichever staging wins.
 */
export function EntryVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Centered card"
        rationale="The classic modal: focused, symmetrical, fastest to dismiss. The gallery stays visible around it."
      >
        <GalleryBackdrop dim="bg-black/50" />
        <div className="absolute inset-0 flex items-center p-5">
          <WelcomeCard compact />
        </div>
      </Variant>

      <Variant
        n={2}
        name="Bottom sheet"
        rationale="Mobile-native: rises from where thumbs live, reads as lightweight, swipe-to-dismiss affordance built in."
      >
        <GalleryBackdrop dim="bg-black/35" />
        <div className="absolute inset-x-0 bottom-0">
          <div
            data-dir-card
            data-dir-enter
            className="rounded-b-none border-b-0 p-5 pt-3"
            style={{
              borderTopLeftRadius: "calc(var(--radius) * 2.2)",
              borderTopRightRadius: "calc(var(--radius) * 2.2)",
            }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
            <WelcomeCard bare />
          </div>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Full-screen welcome"
        rationale="The editorial take: the cover photo IS the invitation. Maximum occasion, one extra tap to the gallery."
      >
        <div className="absolute inset-0">
          <div className="relative h-2/5">
            <Image
              src={COVER_PHOTO}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="flex flex-col px-6 pb-8">
            <p
              data-dir-display
              className="mt-2 text-center text-3xl leading-tight text-balance"
            >
              You&rsquo;re invited to {EVENT_NAME}
            </p>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              Add your photos and browse everyone&rsquo;s. No app, no account.
            </p>
            <FeatureRows className="mt-5" />
            {/* Semibold here only: at full-screen scale next to text-3xl
                display, a medium CTA reads secondary. */}
            <button
              data-dir-press
              className="mt-6 h-11 w-full rounded-[var(--radius)] bg-primary text-sm font-semibold text-primary-foreground"
            >
              Continue
            </button>
          </div>
        </div>
      </Variant>
    </div>
  );
}

function GalleryBackdrop({ dim }: { dim: string }) {
  return (
    <>
      <div className="absolute inset-0">
        <div className="px-4 pt-12 pb-2">
          <p data-dir-display className="text-lg">
            {EVENT_NAME}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            128 photos & videos
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1 px-4">
          {PHOTOS.slice(0, 9).map((src) => (
            <div
              key={src}
              className="relative aspect-square overflow-hidden"
              style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
            >
              <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className={`absolute inset-0 ${dim} backdrop-blur-[2px]`} />
    </>
  );
}

function WelcomeCard({
  compact = false,
  bare = false,
}: {
  compact?: boolean;
  bare?: boolean;
}) {
  const inner = (
    <>
      <div className="relative mx-auto size-12 overflow-hidden rounded-full ring-2 ring-background">
        <Image src={COVER_PHOTO} alt="" fill sizes="48px" className="object-cover" />
      </div>
      <p
        data-dir-display
        className="mt-3 text-center text-xl leading-snug text-balance"
      >
        You&rsquo;re invited to {EVENT_NAME}
      </p>
      <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
        Add your photos and browse everyone&rsquo;s. No app, no account.
      </p>
      <FeatureRows className="mt-4" />
      <button
        data-dir-press
        className="mt-5 h-11 w-full rounded-[var(--radius)] bg-primary text-sm font-medium text-primary-foreground"
      >
        Continue
      </button>
      <button className="mt-1.5 h-9 w-full text-[13px] text-muted-foreground">
        Just browsing
      </button>
    </>
  );
  if (bare) return <div>{inner}</div>;
  return (
    <div data-dir-card data-dir-enter className={`w-full ${compact ? "p-5" : "p-6"}`}>
      {inner}
    </div>
  );
}

function FeatureRows({ className }: { className?: string }) {
  return (
    <ul className={`space-y-2.5 text-[13px] ${className ?? ""}`}>
      <li className="flex items-center gap-3">
        <Camera className="size-4 shrink-0 text-muted-foreground" />
        Add your photos and videos
      </li>
      <li className="flex items-center gap-3">
        <Images className="size-4 shrink-0 text-muted-foreground" />
        See everyone&rsquo;s shots in one place
      </li>
      <li className="flex items-center gap-3">
        <Smartphone className="size-4 shrink-0 text-muted-foreground" />
        Straight from your phone
      </li>
    </ul>
  );
}
