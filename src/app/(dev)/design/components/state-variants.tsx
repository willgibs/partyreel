import Image from "next/image";
import { Bookmark, Camera, ImageUp, Share } from "lucide-react";

import { PhoneShell } from "../screens/phone-shell";
import { EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: empty & loading voice. Every brand-new event opens EMPTY, so
 * this is secretly a first-impression surface. Each phone shows the empty
 * gallery treatment with its matching skeleton strip below.
 */
export function StateVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Typographic"
        rationale="The serif does the talking: an empty page that reads like a frontispiece. Quietest, most on-identity."
      >
        <Page>
          <div className="mt-10 text-center">
            <p data-dir-display className="text-2xl leading-snug text-balance">
              Nothing here yet.
            </p>
            <p className="mx-auto mt-2 max-w-[200px] text-[13px] text-muted-foreground">
              The first photo someone adds starts the album.
            </p>
            <button
              data-dir-press
              className="mt-5 h-10 rounded-[var(--radius)] bg-primary px-5 text-[13px] font-medium text-primary-foreground"
            >
              Add the first photo
            </button>
          </div>
          <SkeletonStrip label="Loading: plain pulse" />
        </Page>
      </Variant>

      <Variant
        n={2}
        name="Iconographic"
        rationale="The conventional empty state: icon, title, action. Instantly legible, slightly generic."
      >
        <Page>
          <div className="mt-10 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Camera className="size-5 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-semibold">No photos yet</p>
            <p className="mx-auto mt-1 max-w-[200px] text-[12px] text-muted-foreground">
              Photos guests add will show up here live.
            </p>
            <button
              data-dir-press
              className="mt-4 flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-primary px-5 text-[13px] font-medium text-primary-foreground"
            >
              <ImageUp className="size-4" />
              Add photos
            </button>
          </div>
          <SkeletonStrip label="Loading: grid mirrors the page" />
        </Page>
      </Variant>

      <Variant
        n={3}
        name="Photographic promise (selected, revised)"
        rationale="THE SELECTED SPEC: the ghost mosaic fills the whole visible field and the call centers inside it. The header drops its primary Add (this CTA is the add) and keeps the 2-up secondaries."
        framed={false}
      >
        <PhoneShell className="max-w-[320px]">
          <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
            <p data-dir-display className="text-xl leading-snug">
              {EVENT_NAME}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              0 photos & videos
            </p>
            {/* Empty-state header: secondaries only, evenly split. */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                data-dir-press
                className="flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card text-xs font-medium"
              >
                <Bookmark className="size-3.5" />
                Save
              </button>
              <button
                data-dir-press
                className="flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card text-xs font-medium"
              >
                <Share className="size-3.5" />
                Invite
              </button>
            </div>
            {/* The mosaic owns ALL remaining height; the CTA centers in it. */}
            <div className="relative mt-3 flex-1 overflow-hidden pb-4">
              <div className="grid h-full grid-cols-3 content-start gap-1.5 opacity-25 grayscale">
                {[...PHOTOS, ...PHOTOS].slice(0, 15).map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative aspect-square overflow-hidden"
                    style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
                  >
                    <Image src={src} alt="" fill sizes="100px" className="object-cover" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <p data-dir-display className="text-2xl leading-snug text-balance">
                  This is where it all lands
                </p>
                <button
                  data-dir-press
                  className="mt-4 h-10 rounded-[var(--radius-action)] bg-primary px-5 text-[13px] font-semibold text-primary-foreground"
                >
                  Be the first to add a photo
                </button>
              </div>
            </div>
          </div>
        </PhoneShell>
      </Variant>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <PhoneShell>
      <div className="absolute inset-0 overflow-hidden px-4 pt-12">
        <p data-dir-display className="text-xl leading-snug">
          {EVENT_NAME}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          0 photos & videos
        </p>
        {children}
      </div>
    </PhoneShell>
  );
}

function SkeletonStrip({ label, ghost = false }: { label: string; ghost?: boolean }) {
  return (
    <div className="absolute inset-x-4 bottom-5">
      <p className="mb-1.5 text-[10px] text-muted-foreground">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`aspect-square animate-pulse ${ghost ? "bg-foreground/8" : "bg-muted"}`}
            style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
          />
        ))}
      </div>
    </div>
  );
}
