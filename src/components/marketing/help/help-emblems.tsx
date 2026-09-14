import { cn } from "@/lib/utils";

// ── The category emblems (R6) ──────────────────────────────────────────────────
// Hand-built DOM art in the MissingFrameStrip tradition: pure divs + tokens, no
// images, achromatic (the media is the color; the emblems are the furniture).
// One scene per category slug, keyed so a future category ships its emblem here
// alongside its registry row (AUTHORING.md names this file). Decorative by
// contract: always aria-hidden via the wrapper. The wrapper carries the shared
// hover micro-beat hook (a parent `group` lifts it via group-hover).

function Scene({ slug }: { slug: string }) {
  switch (slug) {
    case "getting-started":
      // The new-event tile: a plus in a frame.
      return (
        <span className="relative block size-[26px] rounded-[7px] border-2 border-foreground">
          <span className="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
          <span className="absolute top-1/2 left-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
        </span>
      );
    case "qr-and-invites":
      // QR finder corners + one data module.
      return (
        <span className="relative block size-7">
          <span className="absolute top-0 left-0 size-2.5 rounded-tl-[3px] border-2 border-r-0 border-b-0 border-foreground" />
          <span className="absolute top-0 right-0 size-2.5 rounded-tr-[3px] border-2 border-b-0 border-l-0 border-foreground" />
          <span className="absolute bottom-0 left-0 size-2.5 rounded-bl-[3px] border-2 border-t-0 border-r-0 border-foreground" />
          <span className="absolute right-px bottom-px size-2 rounded-[2px] bg-foreground" />
        </span>
      );
    case "guest-experience":
      // The avatar trio, middle forward.
      return (
        <span className="flex">
          <span className="size-[17px] rounded-full border-2 border-foreground bg-card" />
          <span className="z-10 -ml-1.5 size-[17px] -translate-y-[3px] rounded-full border-2 border-foreground bg-card" />
          <span className="-ml-1.5 size-[17px] rounded-full border-2 border-foreground bg-card" />
        </span>
      );
    case "event-album":
      // The album grid, one tile landed.
      return (
        <span className="grid grid-cols-3 gap-[3px]">
          <span className="size-[9px] rounded-[2px] bg-foreground/15" />
          <span className="size-[9px] rounded-[2px] bg-foreground" />
          <span className="size-[9px] rounded-[2px] bg-foreground/15" />
          <span className="size-[9px] rounded-[2px] bg-foreground/15" />
          <span className="size-[9px] rounded-[2px] bg-foreground/15" />
          <span className="size-[9px] rounded-[2px] bg-foreground/15" />
        </span>
      );
    case "sharing-and-downloads":
      // A tile leaving into the tray.
      return (
        <span className="flex flex-col items-center gap-[3px]">
          <span className="size-[9px] rounded-[2px] border-2 border-foreground" />
          <span className="relative h-[7px] w-0.5 bg-foreground">
            <span className="absolute -bottom-[3px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-foreground" />
          </span>
          <span className="mt-0.5 h-1.5 w-[18px] rounded-b-[4px] border-2 border-t-0 border-foreground" />
        </span>
      );
    case "highlight-reel":
      // Three frames, the middle one playing.
      return (
        <span className="flex items-center">
          <span className="block h-4 w-3 translate-x-0.5 -rotate-[9deg] rounded-[3px] border-2 border-foreground bg-card" />
          <span className="z-10 flex h-4 w-3 items-center justify-center rounded-[3px] border-2 border-foreground bg-foreground">
            <span className="ml-px h-0 w-0 border-y-[3.5px] border-l-[5px] border-y-transparent border-l-card" />
          </span>
          <span className="block h-4 w-3 -translate-x-0.5 rotate-[9deg] rounded-[3px] border-2 border-foreground bg-card" />
        </span>
      );
    case "plans-and-billing":
      // The storage meter, three of five segments used.
      return (
        <span className="flex items-end gap-[2.5px]">
          <span className="h-4 w-[5px] rounded-[2px] bg-foreground" />
          <span className="h-4 w-[5px] rounded-[2px] bg-foreground" />
          <span className="h-4 w-[5px] rounded-[2px] bg-foreground" />
          <span className="h-4 w-[5px] rounded-[2px] border-[1.5px] border-foreground/40" />
          <span className="h-4 w-[5px] rounded-[2px] border-[1.5px] border-foreground/40" />
        </span>
      );
    case "account-and-profile":
      // The profile: one avatar over its name field (the display-name moment,
      // not a lock: Privacy already owns the hatched frame).
      return (
        <span className="flex flex-col items-center gap-[4px]">
          <span className="size-[15px] rounded-full border-2 border-foreground bg-card" />
          <span className="h-0.5 w-[18px] rounded-full bg-foreground/40" />
        </span>
      );
    case "privacy-and-safety":
      // The hatched (redacted) frame.
      return (
        <span
          className="block size-[26px] rounded-[7px] border-2 border-foreground"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent 0 3.5px, var(--border) 3.5px 5px)",
          }}
        />
      );
    case "troubleshooting":
      // The frame being fixed (the 404 strip's cousin). The glyph is drawing,
      // not UI text, so it takes the brand face: at regular body weight it would
      // read lighter than the 2px geometry of every sibling emblem.
      return (
        <span className="flex size-[26px] items-center justify-center rounded-[7px] border-2 border-dashed border-foreground/40 font-heading text-[13px] leading-none text-foreground">
          ?
        </span>
      );
    default:
      return null;
  }
}

export function CategoryEmblem({
  slug,
  size = "md",
  className,
}: {
  slug: string;
  /** md = row/strip scale; lg = the sheet-pane folio scale (scaled scene). */
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center transition-transform duration-200 ease-emphasis group-hover:-translate-y-0.5 motion-reduce:transition-none",
        size === "lg" ? "size-14" : "size-11",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center",
          size === "lg" && "scale-[1.35]",
        )}
      >
        <Scene slug={slug} />
      </span>
    </span>
  );
}
