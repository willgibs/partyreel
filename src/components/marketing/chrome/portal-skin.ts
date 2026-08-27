/** Which marketing skin the chrome sits in (the group layouts thread it down). */
export type MarketingSkin = "cinema" | "paper";

// ★ THE PORTAL RULE (Track B theming): anything portaled to <body> escapes the
// marketing skin wrapper, so it must carry the skin's own theme class
// ("dark" | "surface-paper") AND data-mkt (the motion-clock scope) itself.
// surface-paper is a no-op in light sessions (it aliases the :root values).
// Extracted from marketing-nav.tsx in R6 so non-nav portals (the help search
// palette's radix Dialog) share the one rule instead of re-deriving it.
export const portalSkinProps = (skin: MarketingSkin) =>
  ({
    "data-mkt": "",
    className: skin === "cinema" ? "dark" : "surface-paper",
  }) as const;
