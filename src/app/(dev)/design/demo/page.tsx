import Image from "next/image";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  ImageUp,
  Play,
  Share,
  X,
} from "lucide-react";

import { requireDesignKey } from "../gate";
import { ModeShell } from "../mode-shell";
import { PhoneShell } from "../screens/phone-shell";
import {
  EVENT_NAME,
  PHOTOS,
  PORTRAIT_PHOTO,
} from "../screens/sample-photos";

/**
 * THE COHESIVE DEMO: a standing showcase where the shipped pieces are composed
 * together on one screen set, so the system can be read as a whole rather than
 * piece by piece. Hand-composed (deliberately static) from the shipped specs.
 *
 * Composed in: masonry gallery · upload combo with the green check · floating
 * pill lightbox (rose liked heart, no counts) · the photographic empty state ·
 * sharp surfaces with round actions + the state colors · the left-editorial
 * header.
 */
export default async function CohesiveDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  return (
    <ModeShell fontClass="font-opt-urbanist">
        <header className="mx-auto w-full max-w-6xl px-4 pt-4 pb-4">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            The cohesive demo
          </p>
          <h1 data-dir-display className="mt-1 text-3xl tracking-tight text-balance">
            The shipped pieces, composed together
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The live event page, the lightbox, and a brand-new event, composed
            from the shipped selections, the way the pieces read together.
          </p>
        </header>

        <div
          aria-hidden
          className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 md:grid-cols-2 xl:grid-cols-3"
        >
          {/* ── The live event page ─────────────────────────────────── */}
          <div>
            <p className="mb-3 text-sm font-semibold">The event page</p>
            <PhoneShell className="max-w-[320px]">
              <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-14">
                <p data-dir-display className="text-[24px] leading-snug text-balance">
                  {EVENT_NAME}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="relative size-5 overflow-hidden rounded-full">
                    <Image
                      src={PHOTOS[0]}
                      alt=""
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Hosted by <span className="font-medium text-foreground">Maya</span>
                    <span className="text-muted-foreground/50"> · </span>June 14
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">128</span> photos
                  & videos from{" "}
                  <span className="font-medium text-foreground">43</span> guests
                </p>

                <button
                  data-dir-press
                  className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius-action)] bg-primary text-[13px] font-semibold text-primary-foreground"
                >
                  <ImageUp className="size-4" />
                  Add photos
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
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

                {/* Masonry with the add tile leading; one uploading, one just
                    landed (green check, state color). */}
                <div className="mt-3 flex-1 overflow-hidden">
                  <div className="columns-2 gap-[3px]">
                    {[PORTRAIT_PHOTO, ...PHOTOS].slice(0, 8).map((src, i) => (
                      <div
                        key={src}
                        className="relative mb-[3px] w-full overflow-hidden"
                        style={{
                          borderRadius: "var(--radius-tile)",
                          aspectRatio:
                            i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/3",
                        }}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                        {i === 1 && (
                          <div className="absolute inset-0 flex items-end bg-black/35 p-1.5">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                              <div className="h-full w-2/3 rounded-full bg-white" />
                            </div>
                          </div>
                        )}
                        {i === 2 && (
                          <span
                            className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full"
                            style={{
                              background: "var(--success)",
                              color: "var(--success-foreground)",
                            }}
                          >
                            <Check className="size-3" />
                          </span>
                        )}
                        {i === 4 && (
                          <span className="absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
                            <Play className="ml-px size-2.5 text-white" fill="currentColor" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* The floating dynamic-state add button (post-scroll state). */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <button
                    data-dir-press
                    className="flex h-11 items-center gap-3 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
                  >
                    <span className="flex items-center gap-2">
                      <ImageUp className="size-4" />
                      Add photos
                    </span>
                    <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px]">
                      2 uploading
                    </span>
                  </button>
                </div>
              </div>
            </PhoneShell>
          </div>

          {/* ── The lightbox ────────────────────────────────────────── */}
          <div>
            <p className="mb-3 text-sm font-semibold">The lightbox</p>
            <div
              className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-[var(--radius)] bg-gallery text-gallery-foreground"
              style={{ height: "560px" }}
            >
              <div className="absolute inset-0">
                <Image
                  src={PORTRAIT_PHOTO}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
                <X className="size-4 text-white" />
              </span>
              <div className="absolute inset-y-0 left-0 flex w-8 items-center justify-start bg-gradient-to-r from-black/25 to-transparent pl-1">
                <ChevronLeft className="size-4 text-white/70" />
              </div>
              <div className="absolute inset-y-0 right-0 flex w-8 items-center justify-end bg-gradient-to-l from-black/25 to-transparent pr-1">
                <ChevronRight className="size-4 text-white/70" />
              </div>
              <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-5 rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-sm">
                  <Heart
                    className="size-4"
                    style={{ color: "var(--dir-like)" }}
                    fill="currentColor"
                  />
                  <Download className="size-4 text-white/80" />
                  <Share className="size-4 text-white/80" />
                </div>
                <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                  Photo by Dana · 14 of 128
                </span>
              </div>
            </div>
          </div>

          {/* ── A brand-new event ───────────────────────────────────── */}
          <div>
            <p className="mb-3 text-sm font-semibold">A brand-new event</p>
            <PhoneShell className="max-w-[320px]">
              <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-14">
                <p data-dir-display className="text-[24px] leading-snug text-balance">
                  {EVENT_NAME}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  0 photos & videos
                </p>
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
                <div className="relative mt-3 flex-1 overflow-hidden pb-4">
                  <div className="grid h-full grid-cols-3 content-start gap-1.5 opacity-25 grayscale">
                    {[...PHOTOS, ...PHOTOS].slice(0, 15).map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        className="relative aspect-square overflow-hidden"
                        style={{ borderRadius: "var(--radius-tile)" }}
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
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
          </div>
        </div>
      </ModeShell>
  );
}
