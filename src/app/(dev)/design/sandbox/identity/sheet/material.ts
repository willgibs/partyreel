/**
 * VIEWFINDER'S MATERIAL (r1's pick, carried): a matte body, a silver one on
 * paper and a near-black one in the room, with the recording red as its one
 * signal light. Every atom option stands on it, so the options differ by the
 * atoms alone.
 *
 * ★ EVERY GROUND-DEPENDENT VALUE IS A TOKEN DECLARED ON BOTH GROUNDS. A frame
 * draws paper and the room side by side (a `.surface-paper` subtree inside a
 * dark document, or a `.dark` one inside a light one), and a `var()` inside a
 * custom property resolves where it is declared, so a rule written
 * `.dark .x { ... }` would leak into a paper subtree under a dark page. An
 * atom reads only these tokens, and each ground declares all of them.
 *
 * The `--vf-*` tokens are the ones viewfinder adds: a key's bevel, a well's
 * shade, a ring's line, and the display (the camera's own screen, the same
 * near-black on both grounds).
 */
export const MATERIAL_CSS = `
:root, .surface-paper {
  --background: oklch(0.972 0.002 286);
  --foreground: oklch(0.14 0.004 286);
  --card: oklch(0.993 0.001 286);
  --card-foreground: oklch(0.14 0.004 286);
  --popover: oklch(0.996 0.001 286);
  --popover-foreground: oklch(0.14 0.004 286);
  --primary: oklch(0.14 0.004 286);
  --primary-foreground: oklch(0.985 0.001 286);
  --secondary: oklch(0.93 0.003 286);
  --secondary-foreground: oklch(0.14 0.004 286);
  --muted: oklch(0.948 0.003 286);
  --muted-foreground: oklch(0.43 0.006 286);
  --faint: oklch(0.6 0.006 286);
  --accent: oklch(0.912 0.003 286);
  --accent-foreground: oklch(0.14 0.004 286);
  --border: oklch(0.14 0.004 286 / 12%);
  --input: oklch(0.14 0.004 286 / 22%);
  --ring: oklch(0.14 0.004 286);
  --destructive: oklch(0.56 0.21 27);
  --signal: oklch(0.6 0.22 27);
  --vf-key-hi: oklch(1 0 0 / 85%);
  --vf-key-lo: oklch(0 0 0 / 9%);
  --vf-ink-hi: oklch(1 0 0 / 16%);
  --vf-ink-lo: oklch(0 0 0 / 38%);
  --vf-well-shade: oklch(0 0 0 / 7%);
  --vf-ring: oklch(0.14 0.004 286 / 24%);
  --vf-ring-strong: oklch(0.14 0.004 286 / 48%);
  --vf-wash: oklch(0.14 0.004 286 / 6%);
  --vf-wash-strong: oklch(0.14 0.004 286 / 10%);
  --vf-gap: var(--background);
  --vf-thumb: oklch(1 0 0);
  --shadow-lift: 0 1px 2px oklch(0 0 0 / 0.08), 0 4px 10px -2px oklch(0 0 0 / 0.1);
  --shadow-layer: 0 2px 6px oklch(0 0 0 / 0.1), 0 12px 28px -6px oklch(0 0 0 / 0.2);
  color-scheme: light;
}
.dark {
  --background: oklch(0.085 0.003 286);
  --foreground: oklch(0.97 0.002 286);
  --card: oklch(0.15 0.004 286);
  --card-foreground: oklch(0.97 0.002 286);
  --popover: oklch(0.175 0.004 286);
  --popover-foreground: oklch(0.97 0.002 286);
  --primary: oklch(0.97 0.002 286);
  --primary-foreground: oklch(0.1 0.003 286);
  --secondary: oklch(0.21 0.004 286);
  --secondary-foreground: oklch(0.97 0.002 286);
  --muted: oklch(0.125 0.004 286);
  --muted-foreground: oklch(0.71 0.006 286);
  --faint: oklch(0.53 0.006 286);
  --accent: oklch(0.245 0.004 286);
  --accent-foreground: oklch(0.97 0.002 286);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 18%);
  --ring: oklch(0.97 0.002 286);
  --destructive: oklch(0.68 0.2 24);
  --signal: oklch(0.66 0.22 27);
  --vf-key-hi: oklch(1 0 0 / 8%);
  --vf-key-lo: oklch(0 0 0 / 45%);
  --vf-ink-hi: oklch(1 0 0 / 75%);
  --vf-ink-lo: oklch(0 0 0 / 20%);
  --vf-well-shade: oklch(0 0 0 / 40%);
  --vf-ring: oklch(1 0 0 / 22%);
  --vf-ring-strong: oklch(1 0 0 / 46%);
  --vf-wash: oklch(1 0 0 / 6%);
  --vf-wash-strong: oklch(1 0 0 / 11%);
  --vf-gap: var(--background);
  --vf-thumb: oklch(0.64 0.005 286);
  --shadow-lift: 0 1px 2px oklch(0 0 0 / 0.5), 0 4px 12px -2px oklch(0 0 0 / 0.6);
  --shadow-layer: 0 2px 8px oklch(0 0 0 / 0.55), 0 16px 36px -6px oklch(0 0 0 / 0.75);
  color-scheme: dark;
}
:root {
  --radius: 0.375rem;
  --radius-float: 0.625rem;
  --radius-tile: 2px;
  /* The display: the camera's own screen, one near-black on paper and in the room. */
  --vf-display: oklch(0.165 0.004 286);
  --vf-display-step: oklch(0.235 0.004 286);
  --vf-display-fg: oklch(0.975 0.002 286);
  --vf-display-muted: oklch(0.72 0.005 286);
  --vf-display-edge: oklch(1 0 0 / 11%);
}
/* A ground is its own background, wherever a frame lays one down. */
.surface-paper, .dark { background-color: var(--background); color: var(--foreground); }
`;
