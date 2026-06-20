/**
 * THE PROTOTYPE CATALOG of the design lab. Each touchpoint page shows 2-3
 * labeled variants of ONE UX moment on the locked system (monochrome). It seeds
 * the lab's two standing purposes (lab refresh, 2026-06-19): a browsable design
 * reference, and a space to spin up multiple polished explorations per component
 * before integrating into the data-heavy app.
 *
 * The interactive picking mechanism is RETIRED (decisions now happen in chat
 * with more context). What survives is the DESIGN RECORD: `decision` +
 * `decisionNote` are the SHIPPED variant and the why, rendered read-only on each
 * touchpoint page. `surface` groups the catalog in the sidebar (adding an
 * exploration to a surface = one new entry here, picked up automatically).
 */
export type TouchpointId =
  | "entry"
  | "upload"
  | "gallery"
  | "header"
  | "buttons"
  | "lightbox"
  | "event-card"
  | "forms"
  | "states"
  | "qr-card"
  | "arrival"
  | "host-event"
  | "host-dashboard";

/** Which product surface a touchpoint prototypes - the sidebar's grouping.
 *  "marketing" is a RESERVED slot: no touchpoint uses it yet (the marketing
 *  surface lands in Phase 6). Empty groups are dropped, so it stays inert. */
export type Surface = "guest" | "host" | "marketing" | "shared";

/** Surface display labels - the ONE home (the sidebar + the touchpoint header
 *  both import this, never redefine it). */
export const SURFACE_LABEL: Record<Surface, string> = {
  guest: "Guest",
  host: "Host",
  marketing: "Marketing",
  shared: "Shared",
};

export type Touchpoint = {
  id: TouchpointId;
  title: string;
  note: string;
  /** The product surface this explores (groups the catalog in the sidebar). */
  surface: Surface;
  /** Variant names by number (index 0 = V1) - context for the shipped record. */
  variants: string[];
  /** The SHIPPED variant number (the design record). Unset = nothing shipped. */
  decision?: number;
  /** Why that variant shipped (the rationale, kept as the record). */
  decisionNote?: string;
};

export const TOUCHPOINTS: Touchpoint[] = [
  {
    id: "entry",
    title: "Guest entry",
    surface: "guest",
    note: "How the welcome moment is staged on a guest's phone",
    variants: [
      "Centered card",
      "Bottom sheet",
      "Full-screen welcome",
      "Adaptive sheet + ghost grid",
      "Full-screen marquee",
      "Inline teaser + sticky bar",
    ],
    decision: 4,
    decisionNote:
      "the perfect combo: V2 staging for public events (real backdrop), ghost grid when locked/empty; lock mark above the heading; the account step framed as the host's safety choice, not a capture gate",
  },
  {
    id: "upload",
    title: "Upload moment",
    surface: "guest",
    note: "Where adding photos lives and how progress feels",
    variants: [
      "Dropzone card",
      "Floating action bar",
      "Add tile in the grid",
      "Floating + tile combo",
    ],
    decision: 4,
    decisionNote:
      "combo minus the add tile (too busy): header Add on load, floating Add appears on scroll (never both), in-gallery progress, green check, subtle play badge on video tiles",
  },
  {
    id: "gallery",
    title: "Gallery grid",
    surface: "guest",
    note: "How the media field itself is laid out",
    variants: ["Uniform grid", "Masonry columns", "Edge-to-edge"],
    decision: 2,
    decisionNote:
      "unique and personalized vs standard grids; this creative separation is global philosophy",
  },
  {
    id: "header",
    title: "Event header",
    surface: "guest",
    note: "The event's identity block above the gallery",
    variants: ["Left editorial", "Centered formal", "Cover hero"],
    decision: 1,
    decisionNote:
      "minimal and fully contextual, no cover-image pressure on the host, more room for the gallery; meta UI keeps refining",
  },
  {
    id: "buttons",
    title: "Buttons & shape",
    surface: "shared",
    note: "The pressable language: shape, weight, sizes",
    variants: [
      "Soft rectangle",
      "Pill",
      "Sharp",
      "Sharp surfaces, round actions",
    ],
    decision: 4,
    decisionNote:
      "sharp general UI + 16px-at-40px-height scaled radius on interactive elements; one token to go full pill later",
  },
  {
    id: "lightbox",
    title: "Lightbox chrome",
    surface: "guest",
    note: "Controls and attribution around a full-screen photo",
    variants: ["Pinned chrome", "Floating pill", "Immersive auto-hide"],
    decision: 2,
    decisionNote:
      "max media space + mobile-friendly floating pattern; no like counts (utility not social), attribution baked under the pill, subtle swipe hints, video state designed",
  },
  {
    id: "event-card",
    title: "Host event card",
    surface: "host",
    note: "The dashboard's atomic unit: one event at a glance",
    variants: ["Cover-led", "Compact row", "Stat-forward overlay"],
    decision: 3,
    decisionNote:
      "refined pills + QR chip top-left (opens QR/link modal); leans on the cover image, which keeps proving useful",
  },
  {
    id: "forms",
    title: "Forms & inputs",
    surface: "host",
    note: "The settings language: fields, toggles, sections",
    variants: ["Card sections", "Inline rows", "Focused column"],
    decision: 1,
    decisionNote:
      "V1 refined for settings/management; V3 focused column for onboarding + creation. SYSTEM RULE: Urbanist is for identity moments (page titles, event names); functional section headings use Inter",
  },
  {
    id: "states",
    title: "Empty & loading",
    surface: "shared",
    note: "What nothing looks like, and what almost-something looks like",
    variants: ["Typographic", "Iconographic", "Photographic promise"],
    decision: 3,
    decisionNote:
      "ghost mosaic fills the visible field, CTA centered in it; empty-state header drops the primary Add in favor of the CTA",
  },
  {
    id: "qr-card",
    title: "QR table card",
    surface: "shared",
    note: "The printed growth artifact guests actually scan",
    variants: ["Minimal ink", "Invitation frame", "Photo-backed"],
    decision: 1,
    decisionNote:
      "expand the QR tool: V1 AND V3 are the base presets; the share studio (configurator) is the real feature, on the ROADMAP",
  },
  {
    // Phase 4.5 (Will's iPhone pass of the live gated entry, 2026-06-11): the
    // arrival is judged as ONE choreographed flow, not static screens - this
    // touchpoint's variants are composed TIMING/PRESENCE presets played by an
    // interactive flow player (real Vaul sheet physics, fake password "demo").
    // The knob tuning Will lands on rides into decisionNote verbatim and
    // becomes the production constants.
    id: "arrival",
    title: "Guest arrival",
    surface: "guest",
    note: "The gated first-open as one choreographed flow: stage, invitation, threshold, reveal",
    variants: ["Calm arrival", "Swift arrival", "Stately arrival"],
    decision: 1,
    decisionNote:
      "Calm with a longer pause - THE PRODUCTION CONSTANTS: arrival beat 700ms (password return visits 350ms, reduced motion 0) / welcome tall (~55svh) / step transition slide (directional 16px crossfade + 300ms height glide) / success morph + hold 900ms in --success green / type bumped (welcome hero 28px, gate titles 22px, page h1 28px)",
  },
  {
    // Phase 5 (Will at plan review, 2026-06-12): Phase 1 ratified COMPONENTS
    // but never the host PAGE COMPOSITIONS - "the host event page feels
    // terribly designed". These two touchpoints stage page ARCHITECTURES by
    // composing the already-ratified pieces (stat-forward cards, masonry,
    // card-section forms). Direction-setting; finetuning stays post-roadmap.
    id: "host-event",
    title: "Host event page",
    surface: "host",
    note: "How one event's management surface is composed: gallery, share, review queue, settings",
    variants: ["Gallery-first", "Command center", "Tabbed surfaces"],
    decision: 1,
    decisionNote:
      "Gallery-first (Will, 2026-06-12): the host page mirrors the guest experience - the gallery IS the page under a minimal left-editorial header (the ratified header rule: max room for the gallery, cohesion with the guest surface). Management collapses into ONE compact command strip: Share/QR + the amber 'N to review' chip (opens the pending queue) + a settings entry point. Moderation is one tap away, not a wall in front of the gallery.",
  },
  {
    id: "host-dashboard",
    title: "Host dashboard",
    surface: "host",
    note: "How the home surface is composed: events, storage, the personal tabs",
    variants: ["Cards-first", "Ambient storage", "Single feed"],
    decision: 3,
    decisionNote:
      "Single feed + ambient storage, a HYBRID (Will, 2026-06-12): tabs become FILTER chips over ONE continuous feed - events (V3 stat-forward cards) THEN your uploads (masonry) THEN likes, in one scroll. WHY: a free user with ONE event still gets a full, exciting page (content beneath the lone event) instead of a sparse list + forced navigation to find the rest. Storage = the AMBIENT slim meter from V2 (NOT V1's in-your-face card): polished + visible to incentivize the upgrade when it matters, never a hero block. Trash stays a filter (the recovery bin). The personal feeds (uploads/likes) keep their own empty-state ownership (client-only unlike).",
  },
];

export function getTouchpoint(id: string): Touchpoint | undefined {
  return TOUCHPOINTS.find((t) => t.id === id);
}
