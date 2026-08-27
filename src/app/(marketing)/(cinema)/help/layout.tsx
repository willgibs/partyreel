import { getSearchIndex, HELP_QUICK_LINKS } from "@/lib/content/help";

import { HelpPaletteProvider } from "@/components/marketing/help/help-palette";

/**
 * Help layout (R6): mounts the ONE search-palette island over the index + every
 * article, and serializes the search index ONCE here (10-15KB at library scale;
 * the pages themselves must never pass it again). No <main>, no Container, no
 * wrappers — the (paper) group layout owns the chrome and this must not add a
 * second layout box around it.
 */
export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HelpPaletteProvider index={getSearchIndex()} quickLinks={HELP_QUICK_LINKS}>
      {children}
    </HelpPaletteProvider>
  );
}
