# Instruments Serif (vendored variable font)

Built from https://github.com/eliheuer/instruments-serif (OFL-1.1, license
alongside): Eli Heuer's multi-weight fork of Instrument Serif, wght 400-900.

Build provenance (2026-06-10): UFO sources compiled with fontmake as a CFF2
variable font (`-o variable-cff2`; the TTF path crashes cu2qu on degenerate
cubics) after a mechanical master-compatibility repair: 51 on-curve points in
the Black master were labeled `line` where Regular has `curve` (flattened
segments, control points retained), which varLib rejects; relabeling them
`curve` restores valid, visually identical segments. Geometry untouched.
