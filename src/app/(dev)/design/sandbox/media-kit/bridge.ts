/**
 * THE BRIDGE, POST BY POST (the media-kit track, round two).
 *
 * Round one argued the bridge per FRAME: twelve manifest ids, eight candidates,
 * four holes. That was the wrong unit and the second round found out why.
 *
 * ★ EVERY ONE OF THE 23 POSTS CARRIES AN EXPLICIT `cover:` IN ITS FRONTMATTER.
 * Round one's board said the covers were hashed out of an eleven-frame pool and
 * that "nobody chose these". Twenty-two of the 23 differ from what the hash would
 * have given (`blog-covers.ts`'s fallback never fires in production today), so a
 * person sat down and picked every one of them. The miscasting is not an accident
 * of a hash. It is what choosing carefully out of eleven wedding-and-festival
 * frames looks like when seven of the posts are about offices, conferences and
 * trips. That makes the bridge a per-POST job: the wiring round changes 23
 * frontmatter lines, not twelve files.
 *
 * `crop` is the slug-derived object-position the blog card actually uses
 * (`blog-covers.ts` CROP_LADDER, a second differently-seeded hash). It is
 * transcribed rather than imported so the board stays a client component;
 * `bridge.test.ts` recomputes both from the real resolver and fails on drift.
 *
 * ★ THE OG CARD IGNORES THE LADDER. `blog/[slug]/opengraph-image.tsx` draws the
 * cover at 1200x630 with `objectFit: cover` and NO object-position, so the share
 * card is always a centre crop of a frame composed for a 4:5 card at 22 or 78
 * percent. The board shows both geometries for that reason: a frame can pass one
 * and fail the other, and the share card is the one a stranger sees first.
 */

export type Vertical =
  | "weddings"
  | "birthdays"
  | "corporate"
  | "conferences"
  | "festivals"
  | "trips";

export type BridgePost = {
  slug: string;
  title: string;
  /** The vertical the post is written for, from its own tags and subject. */
  vertical: Vertical | "general";
  /** The frontmatter `cover:` id today. */
  cover: string;
  /** The object-position blog-covers.ts derives from the slug. */
  crop: string;
  /** The staged candidate key, or null when nothing can fill it under the rule. */
  candidate: string | null;
  /** The master frame the SHOOT gives this post, by code (shoot.ts).
   *  ★ Assigned from the post's own vertical, never inherited from the cover it
   *  carries today: the whole fault being fixed is that a conference post carries
   *  a festival frame, so inheriting that id would reproduce the miscasting in the
   *  route that exists to end it. */
  shot: string;
  /** Why this frame, or what the search returned instead. One line, honest. */
  why: string;
};

export const BRIDGE: readonly BridgePost[] = [
  {
    slug: "best-way-to-share-event-photos",
    shot: "S2",
    title: "The best way to share photos from an event, ranked",
    vertical: "general",
    cover: "party-balloons",
    crop: "50% 42%",
    candidate: "bridge-festival-dusk",
    why: "A guide that ranks every event type wants the most general celebration we can name, not one vertical's decor.",
  },
  {
    slug: "birthday-party-photo-sharing",
    shot: "B1",
    title: "How to collect every birthday party photo before anyone leaves",
    vertical: "birthdays",
    cover: "reception-hall",
    crop: "50% 55%",
    candidate: "bridge-birthday-cake",
    why: "A birthday post illustrated with an empty banquet hall becomes a lit cake carried across a dark room. The first frame in the batch that is a birthday with people in it.",
  },
  {
    slug: "company-offsite-photos",
    shot: "C1",
    title: "Company offsite photos: every phone into one album",
    vertical: "corporate",
    cover: "reception-hall",
    crop: "62% 50%",
    candidate: "bridge-offsite-fire",
    why: "A group around a fire at the end of a day out is the closest the corpus has to an offsite. It carries readable faces, so it is a bridge only under a release we do not hold.",
  },
  {
    slug: "conference-photo-sharing-no-app",
    shot: "K1",
    title: "Conference photo sharing without an app: what works",
    vertical: "conferences",
    cover: "festival-crowd",
    crop: "38% 50%",
    candidate: null,
    why: "Empty. Every conference the CC0 corpus holds is a press photograph of a UN panel, a government summit or a Wikimedia meetup, and every Unsplash-era conference frame is an empty meeting room. There is no frame of a conference that reads as ours.",
  },
  {
    slug: "corporate-event-photo-sharing-pricing",
    shot: "C2",
    title: "Corporate event photo sharing: one price for any headcount",
    vertical: "corporate",
    cover: "festival-lights",
    crop: "50% 42%",
    candidate: "bridge-meeting-hands",
    why: "Laptops and hands at a table. It is corporate and it is legal and it reads as a stock office photograph, which is the exact thing rule 18 exists to keep off the site. Shown because the honest answer to this post is that the bridge has nothing good.",
  },
  {
    slug: "disposable-cameras-vs-qr-photo-album",
    shot: "W3",
    title: "Disposable cameras vs a QR photo album for your wedding",
    vertical: "weddings",
    cover: "reception-hall",
    crop: "38% 50%",
    candidate: "bridge-wedding-guests",
    why: "Guests holding flowers, cropped at the neck, which is what a disposable camera on a table gets pointed at.",
  },
  {
    slug: "does-whatsapp-compress-photos",
    shot: "B4",
    title: "Does WhatsApp compress photos? What a chat does to guest photos",
    vertical: "general",
    cover: "wedding-rings",
    crop: "78% 45%",
    candidate: "wedding-rings",
    why: "A detail shot on a technical post is furniture, and furniture is exactly where a licensed frame belongs.",
  },
  {
    slug: "event-album-no-expiry-date",
    shot: "S6",
    title: "Why your event album has no expiry date (and the one exception)",
    vertical: "general",
    cover: "concert-confetti",
    crop: "78% 45%",
    candidate: "concert-confetti",
    why: "A crowd in silhouette against a lit stage. Unchanged from round one, and the closest like-for-like in the batch.",
  },
  {
    slug: "family-reunion-photo-sharing",
    shot: "T6",
    title: "Family reunion photos: one album for every generation",
    vertical: "general",
    cover: "reception-table",
    crop: "78% 45%",
    candidate: "bridge-long-table",
    why: "A table from above with hands reaching in, rather than a styled wedding table with nobody at it. It is brunch and not a reunion, and it is daylight and cool, which is two thirds right.",
  },
  {
    slug: "group-chat-party-photos",
    shot: "S1",
    title: "The group chat is where party photos go to die",
    vertical: "festivals",
    cover: "party-dj",
    crop: "78% 45%",
    candidate: "bridge-dancefloor",
    why: "A real floor with a crowd on it. The second search found the dance floor round one could not: searching by the scene rather than by the words on the manifest entry.",
  },
  {
    slug: "group-trip-photo-sharing",
    shot: "T3",
    title: "Bachelorette and group trip photos: one album for the whole crew",
    vertical: "trips",
    cover: "festival-lights",
    crop: "22% 45%",
    candidate: "bridge-trip-silhouettes",
    why: "A group in silhouette on a mirrored flat at sunset. Trips is the one vertical the free corpus covers well, because travel is what photographers give away.",
  },
  {
    slug: "guest-album-for-photographers-and-planners",
    shot: "W1",
    title: "For photographers: the guest album beside your gallery",
    vertical: "weddings",
    cover: "wedding-golden",
    crop: "22% 45%",
    candidate: "wedding-golden",
    why: "The flagship wedding frame, backlit and from behind. A post addressed to photographers is the one post where the cover is being judged by a professional.",
  },
  {
    slug: "guest-upload-kit",
    shot: "W2",
    title: "Where the QR code goes and what the MC says: the guest upload kit",
    vertical: "weddings",
    cover: "wedding-toast",
    crop: "50% 42%",
    candidate: "bridge-toast-couple",
    why: "A toast that is actually a wedding. Round one's toast candidate was two beer glasses in a restaurant in Niigata; the second search found a couple on the steps with flutes, cropped at the neck.",
  },
  {
    slug: "highlight-reel-renders-on-your-phone",
    shot: "S3",
    title: "Every event ends with a reel, made on your own phone",
    vertical: "festivals",
    cover: "party-dj",
    crop: "38% 50%",
    candidate: "bridge-crowd-hands",
    why: "Hands up in silhouette against a stage. Dark, warm enough, nobody recognisable, and it is the reel's own subject rather than a picture of the machine.",
  },
  {
    slug: "how-much-storage-for-event-photos",
    shot: "B5",
    title: "How much storage do wedding and party photos need?",
    vertical: "birthdays",
    cover: "party-balloons",
    crop: "50% 42%",
    candidate: "bridge-balloons",
    why: "Real balloons rather than the hot air balloons the corpus kept returning. It is still decor with nobody under it, and it is high key and cool, so it fixes the subject and not the frame.",
  },
  {
    slug: "office-holiday-party-photos-checklist",
    shot: "C4",
    title: "Office holiday party photos: the volunteer's checklist",
    vertical: "corporate",
    cover: "concert-confetti",
    crop: "22% 45%",
    candidate: null,
    why: "Empty. An office party at night, indoors, with colleagues in it, under a license we can name, does not exist in the corpus. The nearest results are a garden party in daylight and a black and white bar shot.",
  },
  {
    slug: "photo-booth-alternative",
    shot: "B2",
    title: "The photo booth alternative: every guest's phone, one album",
    vertical: "birthdays",
    cover: "wedding-toast",
    crop: "50% 42%",
    candidate: "bridge-birthday-candles",
    why: "A lit cake in a dark room: the closest the batch has to a booth's own light, which is the whole visual idea of the post.",
  },
  {
    slug: "qr-code-for-wedding-photos",
    shot: "W4",
    title: "QR code for wedding photos: the complete guest photo sharing guide",
    vertical: "weddings",
    cover: "wedding-golden",
    crop: "50% 55%",
    candidate: "wedding-golden",
    why: "The same frame as the photographers' post, at a different rung of the ladder. Two posts on one photograph is what the crop ladder exists for.",
  },
  {
    slug: "scanned-a-qr-code-where-your-photos-go",
    shot: "T4",
    title: "You scanned a wedding QR code. Here's where your photos go",
    vertical: "weddings",
    cover: "wedding-golden",
    crop: "78% 45%",
    candidate: "bridge-ceremony",
    why: "A ceremony with guests in the pews, seen from the back of the aisle. A post written for the guest who just scanned should show the room the guest is standing in; the shoot answers it with T4, one of the three phone-up frames, which is the only place this sheet reaches outside a post's own vertical.",
  },
  {
    slug: "wedding-album-password",
    shot: "W5",
    title: "Should your wedding album have a password? Usually not",
    vertical: "weddings",
    cover: "reception-table",
    crop: "62% 50%",
    candidate: "bridge-wedding-detail",
    why: "A couple and a bouquet at close range, cropped at the chest. High key, so it is the frame on this board that most argues with the dark warm grade.",
  },
  {
    slug: "wedding-day-photo-collection-timeline",
    shot: "W6",
    title: "A wedding-day timeline for collecting every guest photo",
    vertical: "weddings",
    cover: "wedding-arch",
    crop: "50% 42%",
    candidate: "wedding-arch",
    why: "The empty aisle, kept. It is the one post where a room before the guests arrive is the subject, which is the only place an empty venue is right rather than a symptom.",
  },
  {
    slug: "wedding-photo-sharing-app-vs-shared-albums",
    shot: "W4",
    title: "Wedding photo sharing app vs shared album: which fills up?",
    vertical: "weddings",
    cover: "reception-hall",
    crop: "22% 45%",
    candidate: "bridge-portrait-dusk",
    why: "The batch's only portrait frame. At a 4:5 card it is the one candidate that loses nothing to the crop, because it was shot tall in the first place.",
  },
  {
    slug: "wedding-photos-photographer-cant-be-there-for",
    shot: "W2",
    title: "The wedding photos your photographer can't be there for",
    vertical: "weddings",
    cover: "wedding-toast",
    crop: "62% 50%",
    candidate: "wedding-toast",
    why: "Hands and glasses over a table late in the evening. It is a bar in Niigata standing in for a reception, which is honest drift, and it is the only frame in the batch shot at the hour this post is about.",
  },
];

/**
 * THE BRIDGE PER MANIFEST ID, which is what a CSS paste can actually apply to the
 * running site: the blog is 23 frontmatter lines, but the other 21 routes read the
 * twelve ids directly. All twelve fill now; round one's four holes closed on the
 * second search, and closing them is what moved the argument (see the board).
 */
export const BRIDGE_BY_ID: Readonly<Record<string, string>> = {
  "wedding-golden": "wedding-golden",
  "reception-table": "bridge-long-table",
  "party-balloons": "bridge-balloons",
  "concert-confetti": "concert-confetti",
  "wedding-rings": "wedding-rings",
  "reception-hall": "bridge-dancefloor",
  "party-dj": "party-dj",
  "wedding-toast": "bridge-toast-couple",
  "festival-lights": "festival-lights",
  "festival-crowd": "bridge-crowd-hands",
  "wedding-arch": "bridge-ceremony",
  "wedding-petals": "bridge-portrait-dusk",
};

/**
 * The frames the Mix route keeps licensed: the details nobody studies.
 *
 * ★ THESE ARE CANDIDATE KEYS, AND ONLY CANDIDATE KEYS. Round three's first cut
 * read this list in two namespaces at once: `routeOutcome` matched it against a
 * post's candidate while the applied CSS matched it against a manifest id, and
 * both only appeared to work because "wedding-rings" and "wedding-arch" happen
 * to name a staged frame AND a manifest entry. They do not mean the same thing.
 * The id `wedding-arch` is bridged by `bridge-ceremony` (the empty aisle is
 * right for the timeline post and wrong for the footer strip, which is that
 * candidate's own caution), so the sheet said wedding-arch.jpg while the paste
 * said bridge-ceremony.jpg on the same route and the same page. It was also one
 * edit from silence: swap either name for a key that is not also an id and every
 * post falls through to "ours", which makes Mix identical to Ours and is the
 * inert toggle this round exists to kill. One namespace now, one predicate, and
 * `routeOutcomeForId` asks the same question of an id, so the sheet, the stage
 * and the block a walk wears cannot disagree again.
 */
export const MIX_LICENSED = ["wedding-rings", "wedding-arch"] as const;

/** The one predicate: does Mix keep a licensed photograph for this frame? */
export function mixKeepsLicensed(key: string | null): boolean {
  return key !== null && (MIX_LICENSED as readonly string[]).includes(key);
}

export type RouteOutcome =
  | { kind: "licensed"; key: string | null }
  | { kind: "ours" };

/** The route rule itself, stated once, in candidate keys. */
function outcomeFor(
  key: string | null,
  route: "licensed" | "ours" | "mix",
): RouteOutcome {
  if (route === "ours") return { kind: "ours" };
  if (route === "licensed") return { kind: "licensed", key };
  // Mix: licensed only where the photograph is furniture; the rest go to the shoot.
  return mixKeepsLicensed(key) ? { kind: "licensed", key } : { kind: "ours" };
}

/**
 * What a route does with one post: hand it a licensed frame, or hand it to the
 * shoot. One function, so the sheet, the stage and the applied CSS can never
 * disagree about what a route means.
 *
 * ★ THE SHOOT'S FRAME COMES FROM THE POST'S VERTICAL (`shot`), NEVER FROM THE
 * COVER IT CARRIES TODAY. Inheriting today's id would hand the conference post a
 * festival frame again, in the route that exists to end exactly that.
 */
export function routeOutcome(
  post: BridgePost,
  route: "licensed" | "ours" | "mix",
): RouteOutcome {
  return outcomeFor(post.candidate, route);
}

/**
 * The same question asked of a MANIFEST ID, which is what "Apply to the site"
 * pastes. The blog is 23 frontmatter lines, but the other 21 routes read the
 * twelve ids directly, and a route has to mean one thing on both: apply.ts calls
 * this, so the block a walk wears is the board's own sheet turned into CSS.
 */
export function routeOutcomeForId(
  id: string,
  route: "licensed" | "ours" | "mix",
): RouteOutcome {
  return outcomeFor(BRIDGE_BY_ID[id] ?? null, route);
}

/**
 * The three posts the stage enlarges at the real card size.
 *
 * ★ ROUND THREE CHANGED ONE OF THEM SO THE ROUTE TOGGLE IS NOT INERT. Round two
 * staged three corporate and conference posts: the right argument (today they
 * wear an empty wedding hall and two music festivals, every one chosen by hand
 * out of eleven frames) and the wrong SET, because none of the three is one of
 * the two details Mix keeps licensed, so flipping Mix against Ours changed
 * nothing on the largest element of the board. These three differ under all
 * three routes, and bridge.test.ts refuses a set that does not.
 */
export const STAGE_SLUGS = [
  // Filled by a frame with a readable face, which ask 1 bars.
  "company-offsite-photos",
  // The hole: no conference frame exists in the corpus at all.
  "conference-photo-sharing-no-app",
  // A ring detail, which is exactly what the Mix route keeps licensed.
  "does-whatsapp-compress-photos",
] as const;

export const STAGE_POSTS: readonly BridgePost[] = STAGE_SLUGS.map((slug) => {
  const post = BRIDGE.find((p) => p.slug === slug);
  if (!post) throw new Error(`media-kit stage: no post ${slug}`);
  return post;
});
