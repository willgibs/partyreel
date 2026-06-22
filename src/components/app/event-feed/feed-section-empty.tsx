import { type LucideIcon } from "lucide-react";

// The shared empty / teaser BODY — Will ratified the Reel treatment (centered, card-LESS, the size-12 muted
// icon circle) over the old bordered Review cards ("I prefer the Reel one", 2026-06-22). It always sits UNDER
// a FeedSectionHeader, never replacing it, so the section's header keeps a constant top offset whether the
// section is full or empty (part of the no-bounce contract). `data-arrive` = the existing fade-rise entrance
// the B=Fade swap re-fires. An optional centered `action` drops under the copy (the Review "Turn on review").
export function FeedSectionEmpty({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-arrive
      className="flex flex-col items-center gap-3 py-10 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{desc}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
