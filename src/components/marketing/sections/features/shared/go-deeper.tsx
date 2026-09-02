import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";

/**
 * The quiet help-center pointer (template kit, item 6): one Inter caption +
 * LearnMoreLink(s) to the help article(s) that carry the exact details, so the
 * marketing page never has to become documentation. Inter since 2026-09-02:
 * the R6 mono ruling (mono for numerals only) reached these rows. Shared by every feature
 * page's FAQ band since the feature-pages round (2026-09-01); the row stays
 * STILL by convention (a pointer you find, not a beat that performs).
 */
export function GoDeeper({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        The exact details live in the help center
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {links.map((link) => (
          <LearnMoreLink key={link.href} href={link.href}>
            {link.label}
          </LearnMoreLink>
        ))}
      </div>
    </>
  );
}
