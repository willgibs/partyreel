# ADR-0024: Studio-first reel composition and mode-based moment selection

**Status:** Accepted (2026-08-04, Will's rulings at the M2 gate review of the live R3 build) ·
**Amends:** ADR-0023 ruling 4's composite (the V1 Marquee + Reel Studio + Create-birth + quick-add
blend). Related: ADR-0022 (guest surfacing), ADR-0021 (reel caps). **Scope:** pure recomposition of
surfaces already shipped. No migration, no schema change, no advisor movement, no engine change.

## Context

R3 shipped the ruled reel experience and Will reviewed it live on the `launch-prep` alias. The
feature worked. The COMPOSITION did not.

The feed's Reel section had become a settings page wedged into a scroll of media: below the poster
sat a style rail, a layout row, a cover strip, a length row, a moments grid, and a download row.
Every one of those was individually justified by the round that added it, and collectively they
buried the one thing the section exists to do, which is show the host their reel. Meanwhile the
Studio, a dedicated full-bleed room built in the same round, already TWINNED every one of those
controls, and its one genuine gap was the ability to add or remove a moment. So the product was
carrying two copies of the control surface, and the better-placed copy was the incomplete one.

Separately, "add to the reel" was a per-card decision. Every gallery tile carried a clapperboard
chip in a hover-revealed row of five, alongside like, download, hide, and delete.

## Decision

**1. The feed's Reel section is VISUAL ONLY.** Post-Create it carries exactly four things: the
status chip, the "Open studio" door, the poster (a live paused player), and the Share card. Nothing
else may be added to it.

*Why (Will):* a feed section is a visual surface. The reel's job in the feed is to be seen and to
be shared, not to be configured. A poster the host can look at, plus one honest door, says more
about the feature than six control rows do.

*Consequence worth keeping:* the feed now mounts zero thumbnail canvases. The IO-gated poster is
the section's only player.

**2. Every control graduates to the Studio, EXCLUSIVELY.** Style, layout, cover, length (with its
free-tier pricing link, which had to travel with the control it belongs to), the moments grid and
download all live in the Studio and only there.

*Why:* one home per control. Two copies of a control surface is how they drift, and the round had
already proven which home was right. The Studio is a place you GO to, with the reel playing while
you work on it; the feed is a place you scroll past.

*Not amended:* the PRE-Create builder. Quick-add, Create, and the ratified reveal stay feed
moments, because the reel's birth genuinely is a feed event, and the reveal's FLIP sources are the
builder's own tiles.

**3. Selection becomes MODE-based. A new in-room Moments picker is the primary door.** The Studio
gains a Moments sheet, first in the tray, over the event's full pool. Membership is the state: a
tap writes immediately, the dock reshuffles, the player re-cuts.

*Why (Will):* context carries the meaning, not per-card iconography. Choosing a cut is a mode you
enter, not a decision you make one card at a time from inside a moderation surface. Repeating an
icon on every card to express a rare, deliberate act is the wrong trade in both directions: it adds
permanent visual noise to the common case and gives the rare case no room to breathe.

**3a. Likes are an INPUT SIGNAL to quick-add, never the membership source.** The picker shows like
counts and shows quick-add's "suggested" hint; neither ever writes membership.

*Why (Will named this directly):* the favorites-versus-reel conflict. "I love this photo" and "this
belongs in the cut" are different questions with different answers, and collapsing them would make
both signals useless. A host would stop liking honestly the moment a like started editing their
reel.

**4. The gallery tile row drops BOTH the reel chip and the DELETE chip.** The row is like, download,
hide/show, and it is closed at three. Both actions survive unchanged in the lightbox and in gallery
bulk-Select; add-to-reel additionally lives in the new picker.

*Why:* a hover-revealed fan of five chips on a dense masonry grid is a misclick trap, and the two
most consequential actions sat in it. Delete is the one irreversible-feeling action in the product;
it should not be reachable by a stray hover. And hide, which stays on the tile, already covers the
urgent case reversibly: a host who needs something off the album right now can do it in one tap and
undo it in one tap.

**5. Reorder is Studio-only.** The feed's Reorder/Done header mode and its sortable-grid swap are
retired.

*Why:* the dock reorders beside a reel that keeps playing, so the consequence of a drag is visible
in the same breath as the gesture. The feed's mode did the opposite: it hid the reel to show a grid
of it. One job per surface, and the dock stays order-only for the same reason.

## Consequences

- `reel-marquee.tsx` loses roughly 165 lines; `reel-reorder-provider.tsx`,
  `reel-reorder-button.tsx` and `reel-sortable-grid.tsx` are deleted; `ReelPanel` is a clean
  two-state lifecycle switch again; `ReelButton` loses its row variant and with it its `variant`
  prop, leaving the lightbox as its only shape.
- The Studio's sheet tray goes from four chips to five. The picker's add path must use the SILENT
  `addMany`, never `toggle`, because toggle toasts on every add and adding several moments in a row
  is the normal gesture here. That routing rule is pure and pinned
  (`src/lib/reel/moment-picker.ts`).
- The two membership predicates are unchanged and still diverge deliberately: a HIDDEN item that is
  already in the reel stays a member and stays removable, but cannot be newly added, because
  `add_to_reel` refuses non-approved media. The picker renders that state rather than hiding it.
- The builder's "tap the clapperboard on any photo in the gallery" copy became false and now points
  at gallery Select. It cannot point at the Studio, which does not exist before Create.
- The feed section header no longer takes an action. `FeedSectionHeader` is layout-safe either way
  by construction (`min-h-7` sits on the row), so nothing bounces.

## Alternatives considered

- **Keep a reduced control set in the feed** (say style + length only). Rejected: any surviving
  control re-opens the "which surface owns this?" question, and a partial settings page reads as an
  oversight rather than a decision.
- **A dedicated select MODE on the gallery for reel picking** (mirroring bulk-Select). Rejected: it
  would put reel curation back in the moderation surface, one room away from the reel it edits. The
  existing bulk-Select already covers the "I am in the gallery and want these six in" case, which
  is why it keeps its Add-to-reel action.
- **Keeping delete on the tile and removing only the reel chip.** Rejected: delete is the more
  dangerous of the two, so a misclick-guard argument that spares it is not an argument.
