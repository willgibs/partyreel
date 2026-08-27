import {
  BellRing,
  CalendarHeart,
  CopyCheck,
  Download,
  Film,
  FolderArchive,
  Images,
  ListChecks,
  Lock,
  type LucideIcon,
  MapPinOff,
  Palette,
  QrCode,
  Radio,
  ShieldCheck,
  Smartphone,
  Undo2,
  Wallet,
} from "lucide-react";

import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

// Single source for marketing feature copy. The home teaser (FeatureHighlights) and
// the /features page both read from here, so capability claims never drift. File-limit
// numbers are derived from the universal limits (lib/media/limits.ts) so they can't
// contradict what the uploader actually enforces. (Copy is em-dash-free by policy; a
// Vitest guard keeps it that way.)
const uploadSize = formatBytes(MAX_UPLOAD_BYTES);

export type Feature = {
  icon: LucideIcon;
  title: string;
  /** Short line: the home teaser grid + the /features spotlights. */
  body: string;
  /** Fuller paragraph: the /features privacy + storage sections. */
  longBody: string;
  /** Surfaced in the curated home FeatureHighlights grid. */
  featured?: boolean;
};

export type FeatureGroup = {
  id: string;
  eyebrow: string;
  heading: string;
  subhead: string;
  features: Feature[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "guests",
    eyebrow: "For guests",
    heading: "The easiest way anyone's ever shared photos",
    subhead:
      "Your guests are the camera crew, and they never have to think about it.",
    features: [
      {
        icon: Smartphone,
        title: "No app, no account",
        featured: true,
        body: "Guests scan the QR and upload straight from their phone browser. Nothing to install, nothing to sign up for.",
        longBody:
          "There's no app to download and no account to create, the single biggest reason photos never get shared. A guest scans your code, types a display name, and they're uploading. That's the whole flow.",
      },
      {
        icon: QrCode,
        title: "One scan to join",
        body: "Share one QR code (on a screen, a print-out, or a link) and everyone's in.",
        longBody:
          "Put your code on a table card, a slideshow, or text the link. However a guest finds it, the same tap drops them straight onto your event page, ready to add what they captured.",
      },
    ],
  },
  {
    id: "hosts",
    eyebrow: "For hosts",
    heading: "You run the event, Partyreel runs the camera roll",
    subhead:
      "Everything you need to collect, shape, and keep the whole event, without chasing anyone.",
    features: [
      {
        icon: ListChecks,
        title: "Curate as it fills",
        featured: true,
        body: "Approve, hide, or remove anything. Flip on review to approve uploads before they show, or let them appear live.",
        longBody:
          "Every event is different, so you decide how hands-on to be. Let photos appear the instant they're taken, or switch on review to approve each one first. Hide a blurry shot or remove anything that shouldn't be there. Your album, your call.",
      },
      {
        icon: Palette,
        title: "Design your QR in seconds",
        body: "Style a QR code that matches your event, right inside Partyreel, ready to print.",
        longBody:
          "Pick from clean, scannable presets and tint the finder corners to your event's color, then download a crisp QR to print or project. No third-party generator, no fiddling, and it always scans.",
      },
      {
        icon: Radio,
        title: "Watch it fill, live",
        body: "New photos and videos land in your gallery as guests take them, no refresh needed.",
        longBody:
          "Your gallery updates in real time as the event unfolds, so you can watch the album build and catch the best moments as they happen instead of waiting until everyone's gone home.",
      },
      {
        // The bulk tools shipped with the album re-architecture; named here per
        // the T2.5 IA's missing-features batch (bulk approve was invisible on
        // /features until the B2 re-skin).
        icon: CopyCheck,
        title: "Approve in bulk",
        body: "Sweep up dozens of uploads at once: approve a whole event in one scroll, or select and feature, hide, or download together.",
        longBody:
          "Big events fill fast, so the tools scale with them. Approve everything new in a single pass, long-press to select dozens at once, then feature, hide, or download them together. Curation takes minutes, not the whole morning after.",
      },
      {
        icon: BellRing,
        title: "Stay on top of it",
        body: "A quiet notification center flags what needs you: uploads to review, account nudges, and more.",
        longBody:
          "Partyreel keeps a running tally of anything that wants your attention, photos waiting for review, storage and renewal reminders, so nothing slips by and your phone never buzzes through the party.",
      },
    ],
  },
  {
    id: "share",
    eyebrow: "Share & relive",
    heading: "One link to the whole event",
    subhead:
      "When it's over, everyone gets the album (and the originals), not a fraction of it.",
    features: [
      {
        icon: Images,
        title: "One album, beautifully shown",
        body: "Share a single public album link. Photos and videos open full-screen, swipe to the next.",
        longBody:
          "Instead of a dozen group chats and a shared folder no one opens, you share one link. The album puts the media first on a clean, dark canvas. Tap any shot to fill the screen and swipe through the whole event.",
      },
      {
        icon: Download,
        title: "Download anything, full quality",
        body: "Save any photo or video at full resolution: the originals, not compressed copies.",
        longBody:
          "Anyone with the album can save the originals at full quality, a single favorite or the keepsakes that matter most. No re-compression, no watermarks, no quality lost on the way in or out.",
      },
      {
        // Shipped as the streaming zip export (ADR-0018); named here per the
        // T2.5 IA's missing-features batch.
        icon: FolderArchive,
        title: "Download it all as a zip",
        body: "One tap exports the whole album (or just your selection) as a zip of the original files.",
        longBody:
          "Nobody wants to save two hundred photos one at a time. Hosts and guests can export the whole album, or a filtered selection, as a single zip of the untouched originals, so everyone leaves with everything.",
      },
      {
        icon: Film,
        title: "Big uploads, full quality",
        featured: true,
        body: `Photos and videos up to ${uploadSize} per file, uploaded straight to storage at full resolution.`,
        longBody: `Phones shoot big, beautiful files, and Partyreel keeps them that way. Photos and videos up to ${uploadSize} per file, uploaded straight to storage at full resolution, never squeezed down to fit a chat thread.`,
      },
    ],
  },
  {
    id: "privacy",
    eyebrow: "Privacy & safety",
    heading: "Yours, and only as public as you make it",
    subhead: "Private by default, with a real person behind every report.",
    features: [
      {
        icon: Lock,
        title: "Private by default",
        featured: true,
        body: "Your album opens only to the link you share, and we keep share links out of search engines. You choose when to make it public.",
        longBody:
          "Nothing is public until you decide it is. Albums open only to the link you choose to share, and those links are kept out of search engines, so your event stays between you and the people you sent it to.",
      },
      {
        // Shipped in milestone-0 (client-side strip, backfilled); named here per
        // the T2.5 IA's missing-features batch (the "unused ammunition").
        icon: MapPinOff,
        title: "Location data never leaves the phone",
        body: "EXIF and GPS metadata are stripped in the browser before a photo ever uploads.",
        longBody:
          "Phones stamp every photo with where it was taken. Partyreel strips that EXIF and GPS metadata in the guest's browser, before the file ever uploads, so nobody's home address rides along with the album.",
      },
      {
        icon: ShieldCheck,
        title: "Safety and control",
        featured: true,
        body: "Anyone viewing an album can flag a problem, and a real person reviews every report, never an automatic takedown.",
        longBody:
          "If something doesn't belong, anyone viewing the album can flag it discreetly, and a real person reviews every report. Nothing is auto-removed by a machine. Moderation stays human, and stays in your hands.",
      },
    ],
  },
  {
    id: "storage",
    eyebrow: "Storage & keeping your memories",
    heading: "The memories don't come with an expiry date",
    subhead:
      "Pick the room you need; your event stays up until you say otherwise.",
    features: [
      {
        icon: CalendarHeart,
        title: "Your memories don't expire",
        featured: true,
        body: "Events stay up until you delete them. There's no expiry clock counting down on your photos.",
        longBody:
          "There's no countdown quietly deleting your event a month later. It stays exactly where you left it until you choose to take it down, so you can come back to it next week or next year.",
      },
      {
        // Shipped with the recovery/recently-deleted phases; named here per the
        // T2.5 IA's missing-features batch.
        icon: Undo2,
        title: "30 days to change your mind",
        body: "Deleted photos wait in a recovery bin for 30 days before they're gone for good.",
        longBody:
          "A slip of the thumb shouldn't erase a memory. Anything you delete moves to a recovery bin and waits 30 days before it's gone for good, so an accidental swipe is always reversible.",
      },
      {
        icon: Wallet,
        title: "Storage that fits the event",
        body: "Start free, or pick a plan sized to your event, from a small party to a full wedding weekend.",
        longBody:
          "Start free and upgrade only if you outgrow it. Plans are sized by storage, not nickel-and-dimed by photo count, so a casual get-together and a three-day wedding can each pick the room they actually need.",
      },
    ],
  },
];

// The highlight reel, the product's namesake payoff, on the SHIPPED truth (the
// 14-style canvas engine: named catalog, WYSIWYG preview, $0 on-device render).
// Consumed by the /features reel band; deliberately number-free — counts render
// from their own single sources (STYLE_CATALOG.length, MAX_REEL_SECONDS) at the
// component so a catalog or tier change can never strand stale copy here.
export const HIGHLIGHT_REEL = {
  eyebrow: "The highlight reel",
  title: "Every event ends with a reel",
  body: "Partyreel cuts your guests' photos into a cinematic highlight reel. Pick a style from the named catalog and the engine does the editing.",
  points: [
    "A named style catalog: pick a mood and a look, done",
    "What you preview is exactly what renders, pixel for pixel",
    "Rendered on your phone, free, in seconds",
  ],
} as const;
