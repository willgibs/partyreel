import { HostMediaGrid } from "@/components/app/host-media-grid";
import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { RecentlyDeletedGrid } from "@/components/app/recently-deleted-grid";
import { SelectableMediaGrid } from "@/components/app/event-feed/selectable-media-grid";
import { cn } from "@/lib/utils";

import { BIN_ITEMS, GALLERY_ITEMS, HOST_EVENT, REVIEW_ITEMS, UPLOADS_ITEMS } from "./fixtures";

/**
 * ONE TILE, ONE GRAMMAR: the four real tile behaviours, unchanged (no
 * production byte moves this round — the four still look exactly like this
 * whichever option wins), with a drawn grouping that changes per option. What
 * an option claims is which of the four would share ONE component in the
 * wiring round; the pixels are the evidence for why that grouping is (or is
 * not) a natural one, not a preview of new pixels.
 */

export type GrammarOption = "mode" | "tree" | "twotwo";

function HostSample() {
  return (
    <HostMediaGrid eventId={HOST_EVENT.id} items={GALLERY_ITEMS.slice(0, 4)} />
  );
}

function BinSample() {
  return <RecentlyDeletedGrid eventId={HOST_EVENT.id} items={BIN_ITEMS.slice(0, 4)} />;
}

function ReviewSample() {
  const items = REVIEW_ITEMS.slice(0, 4);
  return (
    <SelectableMediaGrid
      items={items}
      selectMode
      selected={new Set([items[0].id])}
      exiting={new Set()}
      onToggle={() => {}}
      enablePreview
      layout="uniform"
    />
  );
}

function PersonalSample() {
  return <MyUploadsGallery items={UPLOADS_ITEMS.slice(0, 4)} truncated={false} />;
}

function Tile({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-foreground">{label}</p>
      <p className="mb-1.5 text-[10px] text-muted-foreground">{sub}</p>
      {children}
    </div>
  );
}

/** A bordered group around its children, labelled with what the option claims
 *  about them; `plain` draws no border at all (the "stays distinct" case). */
function Group({
  label,
  tone = "grouped",
  children,
}: {
  label: string;
  tone?: "grouped" | "plain";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3",
        tone === "grouped"
          ? "border-2 border-dashed border-primary/50 bg-primary/5"
          : "border border-transparent",
      )}
    >
      <p
        className={cn(
          "mb-2 text-[10px] font-medium tracking-wide uppercase",
          tone === "grouped" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export function GrammarShowcase({ option }: { option: GrammarOption }) {
  const host = (
    <Tile label="Host grid" sub="Hover-reveal chips">
      <HostSample />
    </Tile>
  );
  const bin = (
    <Tile label="Recently deleted" sub="An always-on bar">
      <BinSample />
    </Tile>
  );
  const review = (
    <Tile label="Review queue" sub="Tap to select, a checkmark">
      <ReviewSample />
    </Tile>
  );
  const personal = (
    <Tile label="Uploads / Likes" sub="Chrome-less">
      <PersonalSample />
    </Tile>
  );

  return (
    <div className="min-h-full space-y-4 bg-background p-5 text-foreground">
      {option === "mode" && (
        <Group label="One component, a mode prop: hover | always | select | none">
          {host}
          {bin}
          {review}
          {personal}
        </Group>
      )}

      {option === "tree" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {host}
            {bin}
            {review}
            {personal}
          </div>
          <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">
              The decision tree a new surface reads (no code changes):
            </p>
            <p>Multi-select several tiles at once? &rarr; the select grammar.</p>
            <p>Read-only, a personal feed? &rarr; no overlay at all.</p>
            <p>
              Otherwise: urgent / reversible-now (the bin)? &rarr; always-on.
              Occasional / precision moderation (the album)? &rarr; hover-reveal.
            </p>
          </div>
        </>
      )}

      {option === "twotwo" && (
        <>
          <Group label="TileActionRow, one component: reveal=&quot;hover&quot; | &quot;always&quot;">
            {host}
            {bin}
          </Group>
          <div className="grid grid-cols-2 gap-3">
            <Group label="Stays distinct: whole-tile select" tone="plain">
              {review}
            </Group>
            <Group label="Stays distinct: the null case" tone="plain">
              {personal}
            </Group>
          </div>
        </>
      )}
    </div>
  );
}
