import {
  Briefcase,
  CalendarHeart,
  Download,
  Film,
  Heart,
  Images,
  ListChecks,
  Lock,
  type LucideIcon,
  PartyPopper,
  Plane,
  QrCode,
  Radio,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import type { FaqItem } from "@/components/marketing/faq-data";

// Single source for the event-type umbrellas (the home section, the /events hub, and
// each /events/[slug] landing page all read from here). Each entry carries a short
// `teaser` (cards) plus the full landing content. `nestedThemes` are the long-tail
// terms the umbrella absorbs (good for SEO body copy, e.g. "Parties" covers
// birthdays, graduations, showers…). Named EVENT_TYPE* (not Event/EVENTS) to avoid
// colliding with the DOM `Event` type and the real `events` domain.
export type EventTypeHelp = {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Optional ladder link: BuiltFor renders this cell's title as a learn-more
   *  into the matching feature page (the expansion round's use-case-to-feature
   *  web; at most 1-2 per type so the grid stays calm). */
  featureHref?: string;
};

/**
 * THE STILL LIFE A TYPE'S HERO LIGHTS (`event-identity` r1, `hero-theme=object`;
 * Will, 2026-09-19: "the 'one bespoke object, lit' per page conveys more about
 * how we actually help that event (such as incorporating the QR)"). One per
 * type, drawn in `sections/events/event-object.tsx`, and every one of them
 * carries the DEMO'S REAL CODE so the object is a door rather than a picture of
 * one. Adding a type without an object is a typecheck error, which is the point.
 */
export type EventObjectKind = "album" | "prints" | "badges" | "sleeve";

/**
 * EVERY PHOTOGRAPH A TYPE OWNS, BY SLOT.
 *
 * ★ THIS EXISTS SO NO COMPONENT NAMES A STILL PER TYPE. Five did before the
 * wiring round (the hub directory, the home teaser, the hero media and two
 * boards), each with its own opinion, so a manifest swap meant five edits and a
 * hunt. A generated set lands here and nowhere else (ASSETS rows 24 and 25).
 *
 * ★ AND THE GAP IS A FACT, NOT A CHOICE. The bootstrap manifest has six wedding
 * subjects and four party ones, and no conference or trip subject at all. The
 * shipped ruling is that a photograph never promises the wrong event, so
 * conferences and trips take the CLOSEST honest still as a named stand-in
 * (`reception-hall`, `festival-crowd`) until their own lands, and `statement`
 * is null on both: there the product is the visual instead, which is the option
 * Will's own pick left open ("one claim, one visual (doesn't *have* to be
 * picture)").
 */
export type EventTypeMedia = {
  /** The card's photograph, at 4:5. The one card anatomy at both sizes. */
  card: string;
  /** The full-width photograph the page turns to paper across. */
  turn: string;
  /** The stills the hero's object is built from, strongest first. Empty where
   *  the object is drawn rather than photographed (the badges). */
  object: readonly string[];
  /** The statement's pair of prints, or null where the product is the visual. */
  statement: readonly string[] | null;
};

export type EventType = {
  slug: string;
  navLabel: string;
  /** Singular form for sentence slots ("Here is how it works for your wedding."). */
  singularLabel: string;
  icon: LucideIcon;
  /**
   * Short line for the home grid + hub cards. Keep every teaser 57-64
   * characters: the home cards run a ~236px measure at lg, and the four must
   * wrap to the same line count so their titles share a baseline (Will,
   * 2026-09-01: the Conferences title sat a full line higher than the rest).
   */
  teaser: string;
  headline: string;
  subhead: string;
  /**
   * THE PHONE'S SUBHEAD (Will, 2026-09-19, `the-phone`): "The copy on this one
   * is too bulky now, pushing the visual down too far (sub hero particularly)."
   * The lockup swaps to this below `sm` so the object still crosses the fold on
   * the first screen. Real copy rather than a first-sentence slice: three of the
   * four subheads are a single long sentence, so a slice would return them whole.
   */
  subheadShort: string;
  intro: string;
  /**
   * THE SECOND SECTION'S CLAIM, said once and large, with the quiet line under
   * it (`second-section=statement`). It is the page's own argument cut out of
   * `intro`, which stays as the SEO paragraph the crawlers read; the claim rides
   * the `chapter` step and the line stays at 18 ("opening stays 18").
   */
  statement: { claim: string; line: string };
  /**
   * A PLAUSIBLE ALBUM NAME for this kind of event, worn by every product pane
   * on the page (the trip sleeve's label, the filling feed beside a statement).
   * One per type so no component invents a second name for the same page, and
   * so a type page never shows "Desert weekend" on a conference.
   */
  albumName: string;
  /** The still life this page's hero lights. */
  object: EventObjectKind;
  /** Every photograph this type owns, by slot. */
  media: EventTypeMedia;
  nestedThemes: string[];
  howItHelps: EventTypeHelp[];
  faq: FaqItem[];
  ctaTitle: string;
  /** Stamped onto the per-page OG card. */
  ogTitle: string;
  /**
   * The per-type highlight-reel hook (T2.5 B2: every landing page routes its
   * reader to /reel through its OWN moment, e.g. weddings lead with the first
   * dance). One sentence, no counts. ★ THE WALL REGISTER (`reel-story` r1
   * `events=wall`): the line says what the live reel does AT this kind of
   * event, playing on the room's screen as it happens, never a video cut and
   * sent afterward, which is the stored reel the live one replaced.
   */
  reelAngle: string;
};

export const EVENT_TYPES: EventType[] = [
  {
    slug: "weddings",
    navLabel: "Weddings",
    singularLabel: "wedding",
    icon: Heart,
    teaser: "Every guest's angle of the day, not just the photographer's.",
    headline: "Every photo from your wedding, from everyone there",
    subhead:
      "Your photographer captures the formals. Your guests capture everything else: the happy tears, the dance floor, the late-night candids. Partyreel collects it all in one place.",
    subheadShort:
      "Your photographer gets the formals. Your guests get everything else.",
    intro:
      "A wedding is the most photographed day of your life, and almost none of those photos ever reach you. Guests fill their camera rolls and the shots scatter across phones and group chats. Partyreel turns every guest into a second shooter. No app required, just a QR code on the table.",
    statement: {
      claim: "The most photographed day of your life.",
      line: "Almost none of those photographs ever reach you. A code on the table turns everyone in the room into a second shooter, and every angle lands in one album you keep.",
    },
    albumName: "Maya and Jay",
    object: "album",
    media: {
      card: "wedding-petals",
      turn: "wedding-golden",
      object: [
        "wedding-golden",
        "wedding-arch",
        "reception-hall",
        "wedding-toast",
        "reception-table",
        "wedding-rings",
      ],
      statement: ["wedding-petals", "wedding-rings"],
    },
    nestedThemes: [
      "receptions",
      "ceremonies",
      "rehearsal dinners",
      "engagement parties",
      "elopements",
    ],
    howItHelps: [
      {
        icon: Heart,
        title: "Every angle of the first dance",
        body: "Guests catch the moments your photographer can't be everywhere for, from every seat in the room.",
      },
      {
        icon: QrCode,
        title: "A QR on every table",
        featureHref: "/features/qr",
        body: "Drop your code on table cards or the program. Guests scan and upload between courses, no chasing required.",
      },
      {
        icon: Lock,
        title: "Yours, kept private",
        featureHref: "/features/privacy",
        body: "Your album opens only to the link you share and stays out of search engines. Share it with family, not the world.",
      },
      {
        icon: Film,
        title: "Full-quality memories",
        // R4 truth ruling A35: video is a paid feature, so a blanket
        // "photos and videos at full resolution" line was false on Free.
        // Both paid plans get named, never "Pro only".
        body: "Photos upload at full resolution on every plan, the originals, ready to download and keep forever. Video too, on Pro and Event Pass.",
      },
    ],
    faq: [
      {
        q: "Do wedding guests need to download an app?",
        a: "No. Guests scan your QR code and upload straight from their phone's browser. There's nothing to install and no password to invent.",
      },
      {
        q: "Can we keep the wedding album private?",
        a: "Yes. Your album opens only to the link you share, and Partyreel keeps share links out of search engines, so you decide exactly who sees it.",
      },
      {
        q: "Will we get the original-quality files?",
        // A1 + A35: photos and the album are never watermarked on any plan (the
        // small mark lives on a free event's clips only), and video is a paid feature.
        a: "Yes. Photos upload at full resolution on every plan, and video on Pro and Event Pass. Anyone with the album can download the originals, with no compression and no watermark.",
      },
      {
        q: "How long do the photos stay up?",
        a: "Your event stays up until you take it down. There's no expiry clock counting down on your wedding memories.",
      },
    ],
    ctaTitle: "Collect every photo from your wedding",
    ogTitle: "Every wedding photo, from everyone there",
    reelAngle:
      "The first dance from every angle, the toasts, the send-off: the reel plays them on the screen at the reception while the party is still going.",
  },
  {
    slug: "parties",
    navLabel: "Parties",
    singularLabel: "party",
    icon: PartyPopper,
    teaser: "The candids from every corner of the room, before anyone leaves.",
    headline: "The whole party's camera roll, in one place",
    subhead:
      "Birthdays, anniversaries, graduations, showers: wherever people show up with phones, Partyreel gathers what they capture into one shared album.",
    subheadShort:
      "Wherever people show up with phones, Partyreel gathers what they catch.",
    intro:
      "The best party photos are the candid ones your guests take, and they're exactly the ones that never get shared. Partyreel puts a QR code in the room so everyone's shots land in one place, live, while the party's still going.",
    statement: {
      claim: "The best shots are the ones you never see.",
      line: "Every candid sits on somebody else's phone until the group chat gives up. One code in the room puts all of them in one album, filling while the party is still going.",
    },
    albumName: "Sam turns thirty",
    object: "prints",
    media: {
      card: "party-balloons",
      turn: "reception-table",
      object: ["party-balloons", "reception-table", "wedding-toast"],
      statement: ["party-balloons", "reception-table"],
    },
    nestedThemes: [
      "birthdays",
      "anniversaries",
      "graduations",
      "baby showers",
      "bachelorette parties",
      "holiday parties",
      "housewarmings",
    ],
    howItHelps: [
      {
        icon: PartyPopper,
        title: "Every candid, gathered",
        body: "The off-the-cuff moments from every corner of the room, collected before anyone heads home.",
      },
      {
        icon: Smartphone,
        title: "No app to kill the vibe",
        featureHref: "/features/qr",
        // A3: the old line ("scan, type a name") described the
        // require-accounts-OFF path AND a display-name step that no longer
        // exists. Canon framing only; the verified-email nuance is
        // /features/privacy's to tell.
        body: "Guests scan, add their photos, and they're in. No app, nothing to install.",
      },
      {
        icon: Radio,
        title: "Watch it fill, live",
        body: "New photos and videos appear as they're taken. Put the album on a TV and watch it build while the party is still going.",
      },
      {
        icon: Download,
        title: "Keep the best ones",
        body: "Save any photo or video at full quality, or share the whole album with one link the next day.",
      },
    ],
    faq: [
      {
        q: "Is Partyreel good for a birthday party?",
        a: "Absolutely, birthdays are a perfect fit. Put a QR code on the table or up on a slideshow, and every guest's photos and videos land in one shared album.",
      },
      {
        q: "Do guests need an app or an account?",
        a: "No. Guests scan the QR code and upload from their phone browser. There's nothing to install and no app to download.",
      },
      {
        q: "Can I show the photos during the party?",
        a: "Yes. The gallery updates live as guests upload, so you can put it on a screen and watch the album fill in real time.",
      },
      {
        q: "What does it cost?",
        a: "You can start free, and paid plans are sized by storage, so pick what fits a small get-together or a big celebration.",
      },
    ],
    ctaTitle: "Start your party's album",
    ogTitle: "The whole party's camera roll, in one place",
    reelAngle:
      "The best candids from every corner of the room, playing on the TV moments after they are taken, while everyone is still there to see them.",
  },
  {
    slug: "conferences",
    navLabel: "Conferences",
    singularLabel: "conference",
    icon: Briefcase,
    teaser: "Talks, booths, and hallway moments, gathered in one feed.",
    headline: "Your whole event, captured by everyone there",
    subhead:
      "Conferences, summits, trade shows, company offsites: turn hundreds of attendees into your content team with a single QR code.",
    subheadShort:
      "Turn everyone in the room into your content team, with one QR code.",
    intro:
      "Your team can't be everywhere at a multi-track event, but your attendees are. Partyreel collects the keynote shots, the booth interactions, and the hallway conversations into one feed you can curate and reshare, with no app for attendees to install.",
    statement: {
      claim: "Your team cannot be in every room.",
      line: "Everyone at your event already is. Put the code on the badge and the keynote, the booth and the hallway all land in one feed, and you decide what goes public.",
    },
    albumName: "Summit 2026",
    object: "badges",
    // STAND-IN (ASSETS row 24 and 25): the manifest has no conference subject,
    // and the ruling is that a photograph never promises the wrong event. The
    // banquet hall is the least-wrong honest still (a large room set for an
    // event, no wedding party in frame) and it is named here so the swap is one
    // data change. `statement: null` keeps the product as the visual there,
    // which is the more honest picture of what a conference organiser buys.
    media: {
      card: "reception-hall",
      turn: "reception-hall",
      object: [],
      statement: null,
    },
    nestedThemes: [
      "corporate events",
      "summits",
      "trade shows",
      "company offsites",
      "team retreats",
      "award nights",
      "meetups",
    ],
    howItHelps: [
      {
        icon: Briefcase,
        title: "Crowd-sourced coverage",
        body: "Talks, booths, and networking moments from across every room and track, gathered into one feed.",
      },
      {
        icon: ListChecks,
        title: "Curate before you reshare",
        featureHref: "/features/curation",
        body: "Approve uploads before they appear, then pull the best shots for recaps, socials, and sponsor reports.",
      },
      {
        icon: QrCode,
        title: "One code on every badge",
        body: "Print the QR on badges, signage, or the slide deck. Attendees scan and contribute in seconds.",
      },
      {
        icon: ShieldCheck,
        title: "Control and safety",
        body: "Review what shows, hide anything off-brand, and rest easy: every report gets reviewed.",
      },
    ],
    faq: [
      {
        q: "How do attendees contribute photos?",
        a: "They scan a QR code (on a badge, a sign, or a slide) and upload from their phone browser. No app required, and no attendee onboarding.",
      },
      {
        q: "Can we review photos before they're public?",
        a: "Yes. Turn on review and every upload waits for approval before it appears, so you control what represents your event.",
      },
      {
        q: "Can we use the photos for marketing and recaps?",
        a: "Yes. Download any photo or video at full quality to use in recaps, social posts, and sponsor reports.",
      },
      {
        q: "Does it work for large events?",
        a: "Yes. There's no attendee limit, and you can pick a storage plan sized to the volume of media a big event generates.",
      },
    ],
    ctaTitle: "Capture your whole conference",
    ogTitle: "Your conference, captured by everyone there",
    reelAngle:
      "The keynote, the booths, and the hallway conversations, looping on the screens between sessions as attendees add them.",
  },
  {
    slug: "trips",
    navLabel: "Trips",
    singularLabel: "trip",
    icon: Plane,
    teaser: "Everyone's photos from the whole trip, without the chasing.",
    headline: "One shared album for the whole trip",
    subhead:
      "Group vacations, reunions, retreats, bachelor and bachelorette trips: pool everyone's photos instead of chasing them across five group chats when you get home.",
    subheadShort:
      "Pool everyone's photos instead of chasing them across five group chats.",
    intro:
      "No one person captures a whole trip. The best shots are spread across everyone's phones, and they never all end up in one place. Partyreel gives the group one album to fill, from the first airport selfie to the last sunset, so everyone leaves with all of it.",
    statement: {
      claim: "Nobody comes home with the whole trip.",
      line: "The best frames are spread across everyone's phone and they never land in the same place. One album, filled as you go, and every traveller leaves with all of it.",
    },
    albumName: "Desert weekend",
    object: "sleeve",
    // STAND-IN (ASSETS rows 24 and 25): the manifest's only "away" frames are
    // festival ones, and a rave promises the wrong event against "family
    // reunions, retreats". The crowd against a warm glow is the least-wrong of
    // them and it is named here so the swap is one data change. `statement:
    // null` leaves the product as the visual, which is the trip's real pitch.
    media: {
      card: "festival-crowd",
      turn: "festival-crowd",
      object: ["festival-crowd", "concert-confetti"],
      statement: null,
    },
    nestedThemes: [
      "group vacations",
      "family reunions",
      "retreats",
      "road trips",
      "bachelor & bachelorette trips",
      "festivals",
      "camping trips",
    ],
    howItHelps: [
      {
        icon: Plane,
        title: "The whole trip, from everyone",
        body: "Every traveler's photos and videos in one album, not scattered across phones and chats.",
      },
      {
        icon: Smartphone,
        title: "Add photos as you go",
        body: "Scan once and upload from anywhere. No app required, works on everyone's phone.",
      },
      {
        icon: Images,
        title: "One link to relive it",
        featureHref: "/features/sharing",
        body: "Share a single album link when you're home, and everyone can browse and download the whole trip.",
      },
      {
        icon: CalendarHeart,
        title: "Keeps the memories",
        body: "Your trip album stays up until you take it down. Come back to it years later.",
      },
    ],
    faq: [
      {
        q: "How does everyone add their photos?",
        a: "Share one QR code or link with the group. Everyone scans and uploads from their own phone, with no app required.",
      },
      {
        q: "Can everyone download the photos afterward?",
        a: "Yes. Share the album link and anyone can browse and download any photo or video at full quality.",
      },
      {
        q: "Does everyone need the same kind of phone?",
        a: "No. Partyreel runs in any phone's browser, so it works for the whole group no matter what device they carry.",
      },
      {
        q: "How long will the album last?",
        a: "As long as you want. Your trip album stays up until you delete it, so you can revisit it whenever.",
      },
    ],
    ctaTitle: "Make one album for the trip",
    ogTitle: "One shared album for the whole trip",
    reelAngle:
      "The whole trip, from the airport selfie to the last sunset, playing on the rental's TV as the group adds to it each evening.",
  },
];

export const EVENT_TYPE_SLUGS = EVENT_TYPES.map((eventType) => eventType.slug);

export function getEventType(slug: string): EventType | undefined {
  return EVENT_TYPES.find((eventType) => eventType.slug === slug);
}

/**
 * The address a product pane's frame reads, derived from the album's own name
 * rather than stored beside it: two fields that must agree is a field too many,
 * and this is exactly how a real event slug is made.
 */
export function eventAlbumSlug(albumName: string): string {
  return albumName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Hub-level copy for the /events landing page (the cross-event story that frames the 4
// type cards). Kept here so all event copy is single-sourced; `benefits`/`faq` reuse the
// per-type shapes. This copy is DISTINCT from any single type — it speaks to "any event".
export type EventsHub = {
  eyebrow: string;
  headline: string;
  subhead: string;
  /** SEO body paragraph that leads the type cards. */
  overview: string;
  /**
   * THE HUB'S OWN OBJECT, over a cross-event ground. A type page's still life
   * is one kind of event; the hub's has to say ANY, so its prints are one per
   * type in `EVENT_TYPES` order and the code standing in front of them is the
   * same real one. (The hub's own theme was the manifest's open call; this is
   * the answer, stated in the Handoff for Will to overrule.)
   */
  heroPrints: readonly string[];
  /** The hub's own reel line, in the cross-event register (a type page uses its
   *  own `reelAngle`). It lived as a local const on the page until the wiring
   *  round; all events copy is single-sourced here. */
  reelAngle: string;
  benefits: EventTypeHelp[];
  faq: FaqItem[];
};

export const EVENTS_HUB: EventsHub = {
  eyebrow: "Events",
  headline: "Every event, every photo, in one shared album",
  subhead:
    "Weddings, parties, conferences, trips: if your people show up with phones, Partyreel collects what they capture.",
  // A27: this renders as the type-directory's subhead, where a full SEO
  // paragraph became a seven-line wall on a phone. One line sets the cards up;
  // the cards and the FAQ below carry the long-tail terms.
  overview:
    "Every event runs the same way here. One QR code, one shared album, whatever you're hosting.",
  // One print per type, in EVENT_TYPES order, so the pile under the hub's code
  // reads as four different nights rather than four frames of one.
  heroPrints: [
    "wedding-golden",
    "party-balloons",
    "reception-hall",
    "festival-crowd",
  ],
  reelAngle:
    "Every angle your guests caught, playing on the screen in the room as they catch it.",
  benefits: [
    {
      icon: QrCode,
      title: "One code, any size of room",
      body: "Print it, project it, or drop it in the group chat. Ten guests or a thousand, and no per-guest fees either way.",
    },
    {
      icon: ListChecks,
      title: "The album shows what you choose",
      body: "Hold uploads for approval, hide anything off-key, and hand out a link you're happy to send anyone.",
    },
    {
      icon: Film,
      // A1 + A35: photo-scoped truth. Photos and the album are never
      // watermarked on any plan (the small mark is a free event's CLIPS' alone), and
      // video is a paid feature, so both paid plans get named here.
      title: "Full quality photos, never watermarked",
      body: "Photos land at full resolution on every plan, ready to download and keep. Video comes with Pro and Event Pass.",
    },
    {
      icon: Lock,
      title: "Private, and yours to keep",
      body: "Your album opens only to the link you share and stays out of search engines. It stays up until you delete it.",
    },
  ],
  faq: [
    {
      q: "What kinds of events does Partyreel work for?",
      a: "Any event where people bring phones: weddings, birthdays and parties, conferences and company offsites, group trips and reunions, and plenty more. The flow is the same every time, one QR code and a shared album.",
    },
    {
      q: "Do my guests need an app or an account?",
      a: "No. Guests scan your QR code and upload straight from their phone browser. There's nothing to install and no app to download.",
    },
    {
      q: "How many guests can contribute?",
      a: "There's no guest limit. The same QR code works for a small dinner or a thousand-person conference, and everyone uploads to one shared album.",
    },
    {
      q: "Can I control what shows up?",
      a: "Yes. Turn on review to approve uploads before they go public, or hide and remove anything after the fact, so the final album is exactly what you want.",
    },
    {
      q: "What does it cost?",
      a: "You can start free with one event. Paid plans are sized by storage, and there's a one-time Event Pass for a single big event, with no per-guest fees on any plan.",
    },
  ],
};
