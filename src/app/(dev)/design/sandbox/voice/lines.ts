/**
 * THE CANDIDATE LINES, AND NOTHING ELSE.
 *
 * ★ THE WORDS ARE THE CANDIDATES, so they live in one pure module rather than
 * inline in the surfaces that draw them. Three things need the same string and
 * must never drift: the preview that renders it at true size, the spec's label
 * (which carries the fragment a reviewer recognises it by), and the Handoff.
 *
 * ★ EVERY LINE CLEARS THE FENCES BEFORE IT IS A CANDIDATE. Bible 20's two
 * product-truth fences (`src/lib/content-policy.test.ts`: no human-response or
 * human-moderation promise, no automation absolutes), the claims fence, the
 * promise-neutralization doctrine (`docs/systems/marketing-content.md`:
 * published copy commits to OUTCOMES, never to who or what delivers them) and
 * the em-dash policy. A line that cannot clear them is not a candidate, so none
 * of the wording below is a trade against a rule. Note where "the host" appears:
 * a host is the event's owner and host control IS the outcome the doctrine
 * allows, which is why "the host adds it to the album" is legal where "a person
 * reviews it" is not.
 *
 * ★ AND "NIGHT" IS BANNED AS IDENTITY LANGUAGE (`marketing-voice.ts`), so no
 * candidate reaches for it even where it would scan better than "event".
 *
 * The first key of each record is the line that SHIPS TODAY, read out of the
 * file named above it, so every comparison has its real baseline in it.
 */

/** 1. The guest welcome sheet's first benefit row (`entry-modal.tsx`). */
export const ABSENCE = {
  named: "Add your photos and videos in seconds. No app, no account.",
  actions:
    "Add your photos and videos in seconds. Nothing to install, nothing to sign up for.",
  phone: "Add your photos and videos in seconds. Your phone is all you need.",
  roll: "Add your photos and videos in seconds, straight from your camera roll.",
} as const;

/** 2. The home hero's sentence under the thesis (`marketing-voice.ts`). */
export const HERO_SUB = {
  today:
    "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
  morning:
    "Partyreel collects the photos and videos from your guests with one QR code. The morning after, they are already in one album.",
  one: "One QR code collects every photo and video your guests shot, at the quality they shot it, in one album.",
  guests:
    "Your guests took the best photos at your event. One QR code brings every one of them into your album.",
} as const;

/** 3. The curation feature page's H1 (`feature-pages.ts`). */
export const FEATURE_H1 = {
  today: "Your guests only see the good part.",
  decide: "You decide what everyone sees.",
  pass: "Every photo lands. You choose which ones stay.",
  album: "The album everyone remembers is the one you shaped.",
} as const;

/** 4. The Pro card's line under its name (`plan-cards.tsx`). */
export const PRO_LINE = {
  again: "For hosts who host again.",
  covered: "Every event after that, covered.",
  video: "Video, longer reels, and every event you host.",
  next: "For your next event, and the one after that.",
} as const;

/** 5. The entry sheet's account step (`enter-event-prompt.tsx`). */
export const GATE = {
  today:
    "To keep this album just for guests, the host asks for a quick email check. One tap, no password needed, and you are in.",
  ask: "One tap on your email and you are in. The host asked for it so the album stays with the guests.",
  host: "The host keeps this album to guests only. One tap on your email and you are in.",
  just: "Just checking you are a guest. One tap on your email and the album opens.",
} as const;

/** 6. The guest album's empty-state title (`gallery-empty-state.tsx`). */
export const EMPTY = {
  lands: "This is where it all lands",
  starts: "The album starts with you",
  fills: "This album fills up fast",
  every: "Every photo from today lands here",
} as const;

/** 7. The host dashboard's first screen, with no events yet
 *  (`events-empty-teaser.tsx`). The blurb under it is held at today's wording
 *  in every option, so the title is the only thing that moves. */
export const HOST_EMPTY = {
  land: "Your events land here",
  code: "One event, one code, one album",
  start: "Start with one event",
  album: "Your first album starts here",
} as const;

/** 8. The toast a guest gets when an upload lands in an album the host reviews
 *  (`guest-upload.tsx`). */
export const MOMENT = {
  today: "Sent, waiting for host approval",
  sent: "Sent to the host",
  through: "Sent. It appears once the host waves it through.",
  got: "Got it. The host adds it to the album.",
} as const;
