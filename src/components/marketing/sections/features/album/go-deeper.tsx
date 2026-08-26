import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";

/**
 * The quiet help-center pointer (template kit, item 6): a MonoCaption line +
 * LearnMoreLink(s) to the help article(s) that carry the exact details, so the
 * marketing page never has to become documentation. T1-SHARED across
 * album / qr (guests has no covering article yet; the report proposes one).
 */
export function GoDeeper({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <>
      <MonoCaption>The exact details live in the help center</MonoCaption>
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
