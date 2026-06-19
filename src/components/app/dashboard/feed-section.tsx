/**
 * A labeled section in the single feed (Phase 5 S2b): the uppercase heading that
 * distinguishes "Your uploads" / "Your likes" masonry beneath the lead events,
 * so the continuous "all" scroll stays legible. Matches EmptySectionTeaser's
 * heading exactly, so a section reads the same whether it's full or teasing.
 */
export function FeedSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={heading}>
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {heading}
      </p>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}
