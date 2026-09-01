/**
 * SPILL: the turbulence field that waves every lamp on the page.
 *
 * ★ EXACTLY ONE PER DOCUMENT, and it is mounted in the ROOT LAYOUT. SVG ids are
 * document-global: duplicates resolve by document order, which is unstable
 * under React reconciliation and portals, and if the node that owns the filter
 * unmounts, every other consumer is left holding a dangling
 * `filter: url(#glw-warp)`.
 *
 * ★ WHY THIS IS ITS OWN FILE, WITHOUT "use client" (round 1, 2026-09-01). It
 * lived in glow.tsx until the footer stopped being the only consumer. That file
 * is a client module, so importing this from the root layout would have pulled
 * a client chunk onto every page in the app to render a static <svg> with no
 * props, no state and no hooks. Here it stays a server component and costs the
 * root layout nothing but its own markup.
 *
 * The cost of mounting it everywhere is a parse and a few DOM nodes: an
 * unreferenced filter is never rasterized, so pages with no lamp (dashboard,
 * admin, the guest gallery) pay for the tag and nothing else. That is cheaper
 * than the alternative, which is every future lamp having to remember a host.
 *
 * Values are the shipped footer's, verbatim: they are already ruled beautiful,
 * so they are the calibration for everything the doctrine proposes.
 */
export function GlowFilter() {
  return (
    <svg
      width="0"
      height="0"
      className="absolute"
      aria-hidden
      focusable="false"
    >
      <filter id="glw-warp" x="-40%" y="-40%" width="180%" height="180%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.009 0.015"
          numOctaves="2"
          seed="7"
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="30"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
