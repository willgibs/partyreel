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
export type EventTypeHelp = { icon: LucideIcon; title: string; body: string };

export type EventType = {
  slug: string;
  navLabel: string;
  /** Singular form for sentence slots ("Every wedding ends with a reel."). */
  singularLabel: string;
  icon: LucideIcon;
  /** Short line for the home grid + hub cards. */
  teaser: string;
  headline: string;
  subhead: string;
  intro: string;
  nestedThemes: string[];
  howItHelps: EventTypeHelp[];
  faq: FaqItem[];
  ctaTitle: string;
  /** Stamped onto the per-page OG card. */
  ogTitle: string;
  /**
   * The per-type highlight-reel hook (T2.5 B2: every landing page routes its
   * reader to /reel through its OWN moment, e.g. weddings lead with the
   * first-dance cut). One sentence, reel register, no counts (style/length
   * numbers render from their single sources at the component).
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
    intro:
      "A wedding is the most photographed day of your life, and almost none of those photos ever reach you. Guests fill their camera rolls and the shots scatter across phones and group chats. Partyreel turns every guest into a second shooter. No app, no account, just a QR code on the table.",
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
        body: "Drop your code on table cards or the program. Guests scan and upload between courses, no chasing required.",
      },
      {
        icon: Lock,
        title: "Yours, kept private",
        body: "Your album opens only to the link you share and stays out of search engines. Share it with family, not the world.",
      },
      {
        icon: Film,
        title: "Full-quality memories",
        body: "Photos and long videos upload at full resolution: the originals, ready to download and keep forever.",
      },
    ],
    faq: [
      {
        q: "Do wedding guests need to download an app?",
        a: "No. Guests scan your QR code and upload straight from their phone's browser. There's nothing to install and no account to create.",
      },
      {
        q: "Can we keep the wedding album private?",
        a: "Yes. Your album opens only to the link you share, and Partyreel keeps share links out of search engines, so you decide exactly who sees it.",
      },
      {
        q: "Will we get the original-quality files?",
        a: "Yes. Photos and videos upload at full resolution, and anyone with the album can download the originals. No compression, no watermarks.",
      },
      {
        q: "How long do the photos stay up?",
        a: "Your event stays up until you take it down. There's no expiry clock counting down on your wedding memories.",
      },
    ],
    ctaTitle: "Collect every photo from your wedding",
    ogTitle: "Every wedding photo, from everyone there",
    reelAngle:
      "The first dance from every angle, the toasts, the send-off: cut into one highlight reel you can share before the thank-you notes go out.",
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
    intro:
      "The best party photos are the candid ones your guests take, and they're exactly the ones that never get shared. Partyreel puts a QR code in the room so everyone's shots land in one place, live, while the party's still going.",
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
        body: "Guests scan, type a name, and upload. No download, no sign-up, nothing to break the moment.",
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
        a: "No. Guests scan the QR code and upload from their phone browser. No install, no sign-up, just a display name.",
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
      "The best candids from every corner of the room, cut into a highlight reel while everyone is still talking about the party.",
  },
  {
    slug: "conferences",
    navLabel: "Conferences",
    singularLabel: "conference",
    icon: Briefcase,
    teaser:
      "Talks, booths, and hallway moments from hundreds of attendees in one feed.",
    headline: "Your whole event, captured by everyone there",
    subhead:
      "Conferences, summits, trade shows, company offsites: turn hundreds of attendees into your content team with a single QR code.",
    intro:
      "Your team can't be everywhere at a multi-track event, but your attendees are. Partyreel collects the keynote shots, the booth interactions, and the hallway conversations into one feed you can curate and reshare, with no app for attendees to install.",
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
        body: "Review what shows, hide anything off-brand, and rest easy: a real person reviews every report.",
      },
    ],
    faq: [
      {
        q: "How do attendees contribute photos?",
        a: "They scan a QR code (on a badge, a sign, or a slide) and upload from their phone browser. No app, no account, no attendee onboarding.",
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
      "The keynote, the booths, and the hallway conversations, cut into a highlight reel that opens your recap email.",
  },
  {
    slug: "trips",
    navLabel: "Trips",
    singularLabel: "trip",
    icon: Plane,
    teaser:
      "Pool everyone's photos from the whole trip instead of chasing them later.",
    headline: "One shared album for the whole trip",
    subhead:
      "Group vacations, reunions, retreats, bachelor and bachelorette trips: pool everyone's photos instead of chasing them across five group chats when you get home.",
    intro:
      "No one person captures a whole trip. The best shots are spread across everyone's phones, and they never all end up in one place. Partyreel gives the group one album to fill, from the first airport selfie to the last sunset, so everyone leaves with all of it.",
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
        body: "Scan once and upload from anywhere. No app, no account, works on everyone's phone.",
      },
      {
        icon: Images,
        title: "One link to relive it",
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
        a: "Share one QR code or link with the group. Everyone scans and uploads from their own phone, with no app and no account needed.",
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
      "The whole trip, from the airport selfie to the last sunset, cut into a highlight reel the group can watch on the way home.",
  },
];

export const EVENT_TYPE_SLUGS = EVENT_TYPES.map((eventType) => eventType.slug);

export function getEventType(slug: string): EventType | undefined {
  return EVENT_TYPES.find((eventType) => eventType.slug === slug);
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
  benefits: EventTypeHelp[];
  faq: FaqItem[];
};

export const EVENTS_HUB: EventsHub = {
  eyebrow: "Events",
  headline: "Every event, every photo, in one shared album",
  subhead:
    "Weddings, parties, conferences, trips: if your people show up with phones, Partyreel collects what they capture.",
  overview:
    "The best moments at any event are spread across everyone's cameras, and most of them never reach you. Partyreel turns every guest into a contributor: they scan one QR code and upload straight from their phone, so the whole event lands in a single album you control. Pick your kind of event below, or start free and have a QR ready in a minute.",
  benefits: [
    {
      icon: QrCode,
      title: "One QR for any guest list",
      body: "Print it, project it, or share a link. Ten guests or a thousand, everyone joins the same way with nothing to install.",
    },
    {
      icon: ListChecks,
      title: "Curate before you share",
      body: "Approve uploads before they appear, hide anything off-key, and publish one album you're proud of.",
    },
    {
      icon: Film,
      title: "Full quality, no watermark",
      body: "Photos and long videos arrive at full resolution, ready to download and keep. We never stamp your memories.",
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
      a: "No. Guests scan your QR code and upload straight from their phone browser. There's nothing to install and no account to create, just a display name.",
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
