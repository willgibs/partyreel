import { type LucideIcon } from "lucide-react";

import { Empty } from "@/components/ui/empty";

// The shared empty / teaser BODY: the one empty place (`ui/empty.tsx`, identity r2's `one-empty`),
// centred and card-LESS as Will ratified for the Reel ("I prefer the Reel one", 2026-06-22), its glyph in
// the lens. It always sits UNDER its section's head (a FeedSectionHeader, or the Review room's own title),
// never replacing it, so the head keeps a constant top offset whether the section is full or empty (part
// of the no-bounce contract), and its title is a line under that head rather than a second heading.
// `data-arrive` = the existing fade-rise entrance the B=Fade swap re-fires. An optional centered `action`
// drops under the copy (the Review "Turn on review").
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
    <Empty
      data-arrive
      icon={<Icon />}
      title={title}
      titleAs="p"
      line={desc}
      action={action}
    />
  );
}
