import { Check, EyeOff, FolderArchive, ImageUp, QrCode } from "lucide-react";
import Image from "next/image";

import { BrowserFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * The /features spotlight visuals (B2 re-skin): product-real chrome holding REAL
 * manifest media, replacing the placeholder-tile frames (PhoneFrame / GalleryFrame /
 * AlbumFrame keep no media slot; frames are consumed as-is per the track contract,
 * so these compose BrowserFrame + manifest tiles directly, the home album.tsx
 * precedent). One visual per FEATURE_PRESENTATION frame kind, each telling ITS
 * group's story: the guest upload flow, the host review pass, the shared album.
 * All decorative (aria-hidden); the spotlight copy carries every fact.
 *
 * Fixtures stay on the art-directed "Maya & Jay" demo event (the home live-demo
 * fixture family), never real PII.
 */

const DEMO_ALBUM_LABEL = "partyreel.com/a/maya-and-jay";

function Tile({
  id,
  sizes,
  className,
  imgClassName,
  children,
}: {
  id: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}) {
  const m = marketingImage(id);
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-lg ${className ?? ""}`}
    >
      <Image
        src={m.src}
        alt=""
        fill
        sizes={sizes}
        className={`object-cover ${imgClassName ?? ""}`}
      />
      {children}
    </div>
  );
}

/* ── guests: the phone-in-hand upload flow, real tiles landing ── */

const GUEST_TILES = [
  "party-balloons",
  "wedding-petals",
  "party-dj",
  "wedding-toast",
  "festival-lights",
  "wedding-rings",
];

export function GuestPhoneVisual() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.5rem] border bg-card p-3 ring-1 ring-foreground/5">
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-muted-foreground/20" />
        <div className="overflow-hidden rounded-[1.75rem] bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              Add your photos
            </span>
            <span className="text-[10px] text-muted-foreground">
              Maya &amp; Jay&rsquo;s wedding
            </span>
          </div>

          <div className="mt-3 flex flex-col items-center gap-1 rounded-xl border border-dashed border-foreground/25 py-4 text-muted-foreground">
            <ImageUp className="size-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Tap to upload</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {GUEST_TILES.map((id, i) => (
              <Tile key={id} id={id} sizes="90px">
                {i === GUEST_TILES.length - 1 && (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="size-2.5" />
                  </span>
                )}
              </Tile>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="relative h-1 flex-1 rounded-full bg-muted">
              <span className="absolute inset-y-0 left-0 w-5/6 rounded-full bg-foreground/70" />
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              5 of 6
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── hosts: the review pass — a filling gallery mid-curation ── */

const HOST_TILES = [
  "wedding-arch",
  "festival-crowd",
  "reception-hall",
  "wedding-golden",
  "concert-confetti",
  "reception-table",
  "party-dj",
  "wedding-toast",
];
/** Dimmed to ~40% like the real host gallery's hidden state. */
const HIDDEN_TILE = "party-dj";
const SELECTED_TILES = new Set(["wedding-golden", "reception-table"]);

export function HostGalleryVisual() {
  return (
    <div aria-hidden>
      <BrowserFrame
        label={
          <>
            <QrCode className="size-3" />
            {DEMO_ALBUM_LABEL}
          </>
        }
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            3 waiting for review
          </span>
          {/* ACCENT (deliberate, the ruled achromatic-with-accents exception):
              the app's real approve action color, echoed as product truth. The
              spotlight's icon chips stay mono so this is the section's ONE
              chromatic moment. */}
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
            <Check className="size-3" />
            Approve all
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {HOST_TILES.map((id) => (
            <Tile
              key={id}
              id={id}
              sizes="(min-width: 1024px) 170px, 25vw"
              imgClassName={id === HIDDEN_TILE ? "opacity-40" : undefined}
            >
              {id === HIDDEN_TILE && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-background/80 text-muted-foreground">
                  <EyeOff className="size-2.5" />
                </span>
              )}
              {SELECTED_TILES.has(id) && (
                <>
                  <span className="absolute inset-0 rounded-lg ring-2 ring-foreground/70 ring-inset" />
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="size-2.5" />
                  </span>
                </>
              )}
            </Tile>
          ))}
        </div>
      </BrowserFrame>
    </div>
  );
}

/* ── share: the album as guests see it — lightbox + filmstrip + the zip ── */

const SHARE_HERO = "wedding-golden";
const SHARE_THUMBS = [
  "wedding-toast",
  "wedding-petals",
  "party-balloons",
  "reception-table",
  "festival-crowd",
  "wedding-arch",
];

export function ShareAlbumVisual() {
  const hero = marketingImage(SHARE_HERO);
  return (
    <div aria-hidden>
      <BrowserFrame
        label={
          <>
            <QrCode className="size-3" />
            {DEMO_ALBUM_LABEL}
          </>
        }
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gallery">
          <Image
            src={hero.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {SHARE_THUMBS.map((id, i) => (
            <Tile
              key={id}
              id={id}
              sizes="110px"
              className={`rounded-md ${i === 0 ? "ring-2 ring-foreground/60" : ""}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FolderArchive className="size-3.5" strokeWidth={1.5} />
            Download all · originals, zipped
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            214 items
          </span>
        </div>
      </BrowserFrame>
    </div>
  );
}
