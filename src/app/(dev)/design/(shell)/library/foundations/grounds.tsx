import { cn } from "@/lib/utils";

import {
  DISPLAY_GROUND,
  DISPLAY_TOKENS,
  GROUNDS,
  type Ground,
} from "./ground-list";

/**
 * THE FIVE GROUNDS, EACH WEARING ITS OWN CLASS (identity r2, `layers=display`: the fifth, `.surface-display`).
 *
 * ★ A TILE IS THE GROUND, NOT A PICTURE OF IT. It wears the real class, so every chip inside reads that ground's
 * real tokens through the same utilities production uses (`bg-card`, `text-faint`): edit a token in `globals.css`
 * and the tile moves with it, in either theme of the page it stands on. The paper and the room are each their own
 * root and never nested (a `.dark` inside a `.surface-paper` is a half-dark subtree); the tiles are siblings.
 *
 * ★ THE LIST IS `ground-list.ts`'S, HELD AGAINST THE STYLESHEET BY ITS TEST. What is drawn here is how a ground
 * reads and is tuned freely; which grounds exist is the stylesheet's.
 */

/**
 * The fills a part stands on. Written whole, because Tailwind reads a class only where it is spelled out; each chip
 * wears its own foreground, so a label reads on its fill in the ground it sits in.
 */
const FILLS = [
  { label: "Card", chip: "bg-card text-card-foreground" },
  { label: "Popover", chip: "bg-popover text-popover-foreground" },
  { label: "Muted", chip: "bg-muted text-muted-foreground" },
  { label: "Secondary", chip: "bg-secondary text-secondary-foreground" },
  { label: "Accent", chip: "bg-accent text-accent-foreground" },
] as const;

export function Grounds() {
  return (
    <div className="space-y-2">
      {GROUNDS.map((ground) => (
        <GroundTile key={ground.id} ground={ground} />
      ))}
    </div>
  );
}

function GroundTile({ ground }: { ground: Ground }) {
  return (
    <div
      data-ground-tile={ground.id}
      className={cn(
        ground.wears,
        "rounded-lg border border-border bg-background p-4 text-foreground",
        "md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start md:gap-8",
      )}
    >
      <div>
        <p className="text-sm font-medium">{ground.name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {ground.selector}
        </p>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {ground.worn}
        </p>
      </div>
      <div className="mt-4 md:mt-0">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {FILLS.map(({ label, chip }) => (
            <span
              key={label}
              className={cn(
                "flex h-11 items-end rounded-md border border-border px-1.5 pb-1 text-[10px] leading-none",
                chip,
              )}
            >
              {label}
            </span>
          ))}
        </div>
        {/* The three text steps and the recording red, each read where this ground declares it. */}
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>Foreground</span>
          <span className="text-muted-foreground">Muted</span>
          <span className="text-faint">Faint</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: "var(--signal)" }}
            />
            Signal
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * THE DISPLAY'S OWN TOKENS, drawn on the display: the panel is `--display`, and each chip is the token it names
 * on it. Always near-black whatever theme the page is in, which is the point of the token (the same screen on paper
 * and in the room) and why an alpha one, the edge, can be read at all here: on a paper page a white at eleven percent
 * is nothing, and in the room it is the line round every chip.
 */
export function DisplayTokens() {
  return (
    <div className="surface-display rounded-lg border border-border bg-background p-4 text-foreground">
      <p className="text-[11px] text-muted-foreground">
        {DISPLAY_GROUND}, this panel
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DISPLAY_TOKENS.map(({ name, token }) => (
          <div key={token}>
            <span
              className="block h-12 rounded-md border border-border"
              style={{ backgroundColor: `var(${token})` }}
            />
            <p className="mt-1.5 text-xs font-medium">{name}</p>
            <p className="text-[10px] text-muted-foreground">{token}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
