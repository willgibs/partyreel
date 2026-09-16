/**
 * THE SOURCING SHEET (round four, 2026-09-15). Will's note opened this round:
 *
 *   "I haven't had any time to find or design any photos myself. The best use of
 *   this track next may be for discovery/sourcing of those new assets. Could
 *   focus on a few different potential sources as opposed to a few exact image
 *   picks."
 *
 * So the board stops arguing about twelve positions and becomes a list of PLACES,
 * each with a real catalogue behind it, a price with a number in it, the licence
 * clause word for word, and the one fact that decides everything on this product:
 * whether the source holds a model release for the recognisable faces that are the
 * only frames worth having here.
 *
 * ★ A LICENCE IS NOT A SOURCE, AND ROUND THREE'S SURVEY CONFLATED THEM. Its top
 * row was "CC0 1.0", which is a legal instrument and not a place with photographs
 * in it, and that is exactly why the note above had to ask for real places. The
 * two lists are separate here: SOURCES is where you go, LICENCES is what you are
 * agreeing to when you get there, and round three's clause-by-clause survey lives
 * on as the second one.
 *
 * ★ THE RANKING IS BY ONE TEST AND IT IS NOT PRICE. Round three's rule (spec 1.2
 * and 1.4) bars a recognisable face without a release. Our five verticals are
 * rooms full of recognisable faces. So a free source with no release is not
 * cheaper than a paid one with a release: it is a source that cannot supply the
 * frames we came for. Every free library here ranks below every released one for
 * that reason alone, and each says so in `releaseNote`.
 *
 * Each `clause` is quoted VERBATIM from the page at `licenceUrl` on RETRIEVED;
 * nothing is paraphrased, because a paraphrase of a licence is not a licence.
 * Prices are list prices in USD on that date, and a promotion is recorded as a
 * promotion rather than as the price.
 *
 * `catalogue` is measured where a source let itself be counted (Flickr, Coverr,
 * iStock, Envato, Nappy and Mixkit did) and is otherwise the source's own
 * published figure, labelled.
 *
 * ★ A SOURCE THAT DRAWS NO CONTACT SHEET SAYS WHY ON ITS OWN CARD, AND THE
 * REASONS ARE NOT THE SAME REASON. An earlier draft printed one categorical
 * sentence under all seven blanks ("this catalogue answers a non-browser client
 * with a 401 or a 403"), which was false for four of them and contradicted the
 * Coverr card standing beside it, whose whole verdict is a measurement taken off
 * the search page it supposedly refused. Every one of them was measured again on
 * RETRIEVED with a plain curl, and the count fell from seven to SIX, because the
 * check killed its own excuse: Unsplash+ was the source the sheet most needed to
 * show, it turned out to be readable, and it now draws 60 frames rather than
 * carrying a sentence about why it cannot (see the finding in the Handoff).
 * What is left is genuinely undrawable, for four different reasons: Adobe Stock,
 * Stocksy and Creative Market answer 403; Artgrid answers 200 with an empty
 * application shell; Death to Stock answers 200 at the door and 404 on every
 * browse path under it; Coverr reads completely, and what the reading found is
 * its verdict. `noSheet` carries each of those in its own words, and
 * plan.test.ts refuses a source that has neither a sheet nor a reason.
 *
 * THE GENERAL LESSON, which is the round's own turned on itself: one sentence
 * covering seven cases is a description, and a board whose whole claim is that
 * it DRAWS must check the excuse before it prints it. Writing the shared excuse
 * out per source is what exposed that one of the seven was not refusing at all.
 */

import { CATALOGUE, type Vertical } from "./catalogue";

export type { Vertical };

/** How the money works, which decides whether a one-off spend is even possible. */
export type PriceModel =
  | "free"
  | "subscription"
  | "per-image"
  | "bundle"
  | "rental";

/** The field the whole ranking turns on. */
export type ReleasePosition =
  /** The source warrants a model release across the library. */
  | "held"
  /** Held for some files and marked per item, so every frame is checked alone. */
  | "per-item"
  /** No release, and the source says so or its licence carves people out. */
  | "none";

export type SourceCard = {
  id: string;
  name: string;
  /** Where you actually go to get the frames. */
  url: string;
  model: PriceModel;
  /** The price in words, with the number in it. */
  price: string;
  /**
   * The smallest real first spend that puts usable frames in our hands, in USD.
   * Null when no spend buys a usable frame. plan.ts adds these up, so a number
   * here is a number on the board and plan.test.ts refuses a stale one.
   */
  firstSpend: number | null;
  licence: string;
  licenceUrl: string;
  /** The sentence that decides it, word for word. */
  clause: string;
  /** Whether the quoted sentence is the grant or the bar. */
  clauseIs: "grant" | "bar";
  release: ReleasePosition;
  releaseNote: string;
  /** The verticals this source can actually serve, not the ones it claims. */
  covers: Vertical[];
  /** What is behind it, with a number where the source let itself be counted. */
  catalogue: string;
  /**
   * Why this source draws no contact sheet, measured rather than assumed, in the
   * source's own particulars. Set on exactly the sources CATALOGUE has no sheet
   * for; plan.test.ts pins both directions, so a source cannot go blank silently
   * and a drawn one cannot carry a stale excuse.
   */
  noSheet?: string;
  /** One line. The whole card in a sentence. */
  verdict: string;
  /** True when the source cannot supply a frame this product may ship. */
  barred: boolean;
};

export const VERTICAL_LABEL: Record<Vertical, string> = {
  weddings: "Weddings",
  birthdays: "Birthdays and parties",
  corporate: "Corporate and conferences",
  festivals: "Festivals",
  trips: "Trips",
};

export const ALL_VERTICALS: Vertical[] = [
  "weddings",
  "birthdays",
  "corporate",
  "festivals",
  "trips",
];

export const RETRIEVED = "2026-09-15";

/**
 * The Web Summit archive's two counts, exported rather than typed into a
 * sentence, because ask 3 turns on the bigger one and a number in prose goes
 * stale silently (round three's lesson, learned three times). Counted on
 * RETRIEVED off the account page and off Flickr's own licence-filtered search.
 */
export const WEBSUMMIT_TOTAL = 120692;
export const WEBSUMMIT_CC = 87066;
const n = (x: number) => x.toLocaleString("en-US");

/**
 * Ranked. The cut is `barred`: above it a source can put a shippable frame on a
 * page, below it one cannot, and the ones below are here because knowing why a
 * source fails is worth more than a shorter list.
 */
export const SOURCES: SourceCard[] = [
  {
    id: "unsplash-plus",
    name: "Unsplash+",
    url: "https://unsplash.com/plus",
    model: "subscription",
    price:
      "$20 a month, or $240 a year. A launch promotion was running at $7 a month and $84 a year on the date below.",
    firstSpend: 20,
    licence: "Unsplash+ licence, with Unsplash+ Protection",
    licenceUrl: "https://unsplash.com/plus/license",
    clause:
      "an unlimited, perpetual, nonexclusive, worldwide license to download, copy, modify, distribute, perform, and use Unsplash+ images ... including for commercial purposes, without requiring attribution",
    clauseIs: "grant",
    release: "held",
    releaseNote:
      "All visuals are model and property released, backed by a warranty of up to US $10,000 per licensed photo. This is the exact thing the free Unsplash licence carves out, and it is why this source sits first: the paid tier's whole product is the removal of the clause that disqualified the twelve stand-ins.",
    covers: ["weddings", "birthdays", "corporate", "festivals", "trips"],
    catalogue:
      "A curated premium library, much smaller than the free one. Unsplash publishes no count, but the search filtered to the plus licence is readable without an account: 20 released frames came back on every one of the five kinds of event below, and the 60 on this card were drawn from them.",
    verdict:
      "One month buys every frame the kit needs, released, and a frame downloaded while the subscription is live stays licensed forever with no project to register. The cheapest legal answer on this sheet.",
    barred: false,
  },
  {
    id: "adobe-stock",
    name: "Adobe Stock, credit pack",
    url: "https://stock.adobe.com/",
    model: "per-image",
    price:
      "A 5-credit pack is $49.99, which is $9.99 a photo. 40 credits is $339.99. Credits expire after a year.",
    firstSpend: 50,
    licence: "Adobe Stock Standard Licence",
    licenceUrl: "https://stock.adobe.com/license-terms",
    clause:
      "a non-exclusive, perpetual, worldwide, non-transferable and non-sublicensable license to use, reproduce, archive, modify, and display the work for advertising, marketing, promotional and decoration purposes up to 500,000 times",
    clauseIs: "grant",
    release: "held",
    releaseNote:
      "Adobe requires the contributor to file a signed model release for any asset offered commercially that shows a recognisable person, and a property release for private property. The release lives with Adobe rather than with us, which is the point: buying the licence is buying the release.",
    covers: ["weddings", "birthdays", "corporate", "festivals", "trips"],
    catalogue:
      "Hundreds of millions of files, every kind of event deep. Not countable from here: the site refuses any client that is not a browser, so this sheet cannot draw its frames either.",
    noSheet:
      "Answers a plain client with a 403. Nothing to draw, and nothing to route around short of driving a browser.",
    verdict:
      "The right shape for a handful of hard frames rather than for a kit. At ten dollars a photo, 36 masters is $360, and one night of shooting produces nine rows of the asset log for less.",
    barred: false,
  },
  {
    id: "istock",
    name: "iStock Essentials",
    url: "https://www.istockphoto.com/",
    model: "per-image",
    price:
      "$12 a photo on the single-credit pack. An Essentials photo is one credit; twelve credits is about $144.",
    firstSpend: 12,
    licence: "iStock Standard Licence (Getty Images)",
    licenceUrl: "https://www.istockphoto.com/legal/license-agreement",
    clause:
      "a non-exclusive, non-transferable right to use, modify (unless restricted below) and reproduce the Content, worldwide, in perpetuity",
    clauseIs: "grant",
    release: "held",
    releaseNote:
      "Getty warrants the releases behind its commercially licensed content and indemnifies the buyer up to the licence fee on a Standard licence. Editorial-only files are excluded and are labelled, so the one thing to check per file is that it is not an editorial frame.",
    covers: ["weddings", "birthdays", "corporate", "festivals", "trips"],
    catalogue:
      "Millions, and the only paid per-image catalogue on this sheet that let itself be read: the contact sheets are its own watermarked comps, pulled per kind of event on the date above.",
    verdict:
      "The per-frame option that can be looked at before it is bought. Right for the two or three frames a subscription cannot fill, wrong as the way to buy 36.",
    barred: false,
  },
  {
    id: "stocksy",
    name: "Stocksy United",
    url: "https://www.stocksy.com/",
    model: "per-image",
    price: "$35 medium, $85 large, $135 extra large, per image.",
    firstSpend: 35,
    licence: "Stocksy Standard Licence",
    licenceUrl: "https://www.stocksy.com/service/license-agreement",
    clause:
      "All images, videos, and illustrations on Stocksy are model-released and appropriate for commercial use.",
    clauseIs: "grant",
    release: "held",
    releaseNote:
      "Released across the whole collection by policy rather than per file, and the collection is curated by a co-operative of the photographers themselves, so the ceiling on taste is the highest here.",
    covers: ["weddings", "birthdays", "festivals", "trips"],
    catalogue:
      "A deliberately small curated library, strong on real celebration and travel and thin on corporate rooms. Not readable from here.",
    noSheet:
      "A 403 as well, so the most carefully curated library here is the one it can show least of. Its verdict rests on its own description.",
    verdict:
      "The source for the one or two frames that carry a page. At $35 a frame the 36-frame kit is $1,260, several times what shooting it costs.",
    barred: false,
  },
  {
    id: "envato-elements",
    name: "Envato Elements",
    url: "https://elements.envato.com/photos",
    model: "subscription",
    price:
      "$16.50 a month billed annually ($198 a year), or $33 month to month.",
    firstSpend: 33,
    licence: "Envato Elements subscription licence",
    licenceUrl:
      "https://help.elements.envato.com/hc/en-us/articles/360000629006-Envato-Elements-User-Terms",
    clause:
      "you cannot use downloaded items in new projects after your subscription ends",
    clauseIs: "bar",
    release: "per-item",
    releaseNote:
      "Releases are the contributor's responsibility and are marked per item rather than warranted across the library, so every frame has to be checked one at a time.",
    covers: ["weddings", "birthdays", "corporate", "festivals", "trips"],
    catalogue:
      "Unlimited downloads across a very large library, and it let itself be read: the contact sheets are its own watermarked previews per kind of event.",
    verdict:
      "Cheaper per month than Unsplash+ and worse where it counts. The licence is perpetual only for the project a file was registered to, so a site that keeps changing needs the subscription alive forever. A lease, priced as a purchase.",
    barred: false,
  },
  {
    id: "artgrid",
    name: "Artgrid, for clips",
    url: "https://artgrid.io/",
    model: "subscription",
    price:
      "From $25 a month billed annually ($299 a year). There is no cheap single month: the low tiers are annual only.",
    firstSpend: 299,
    licence: "Artgrid Universal Licence",
    licenceUrl: "https://artgrid.io/license",
    clause:
      "All the content you download from Artgrid is licensed to use forever, even if your subscription expires.",
    clauseIs: "grant",
    release: "held",
    releaseNote:
      "Footage comes from commissioned shoots rather than uploads, with the releases behind the production. The licence is the Unsplash+ shape and not the Envato one: a downloaded clip stays licensed for any future project, with nothing to register.",
    covers: ["weddings", "birthdays", "corporate", "festivals", "trips"],
    catalogue:
      "Cinematic footage organised as whole shoots rather than as single clips, which suits a film cut from one night. Not readable from here.",
    noSheet:
      "200, then an empty application shell: the clips are fetched client side, so the markup holds no thumbnails. A 200 is not a readable catalogue.",
    verdict:
      "The only clip source on this sheet whose licence survives cancellation intact, and the most expensive line in the plan. It is the line the shoot deletes: a film cut from our own event is the one asset no licence can stand in for, because the product's claim is that the frames came from a real party.",
    barred: false,
  },
  {
    id: "websummit-flickr",
    name: "Web Summit's Flickr archive",
    url: "https://www.flickr.com/photos/websummit/",
    model: "free",
    price: "Free. The cost is a visible credit line under every frame.",
    firstSpend: 0,
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
    clause:
      "You must give appropriate credit, provide a link to the license, and indicate if changes were made.",
    clauseIs: "bar",
    release: "none",
    releaseNote:
      "Web Summit's own terms cover Web Summit's use of its attendees' likenesses, not ours. CC BY is a copyright licence and says nothing about the people in the frame, so under our own rule every recognisable face here is still barred. The contact sheet adds a second bar nobody had thought of: a conference floor is a wall of other companies' trademarks, and the frames below carry Meta and Huawei booths at full size.",
    covers: ["corporate"],
    catalogue: `${n(WEBSUMMIT_TOTAL)} photographs on the account, of which ${n(WEBSUMMIT_CC)} are licensed CC BY 2.0, counted on the date above. Professional conference photography: keynote rooms, crowded aisles, badge tables, side-stage crowds.`,
    verdict: `The best free catalogue that exists for the one kind of event our corpus could not fill at all, and nobody in it signed anything. Answer "Only the frame's subject" to question 3 and these ${n(WEBSUMMIT_CC)} frames are a source; answer "Every recognisable face" and they are a footnote.`,
    barred: true,
  },
  {
    id: "flickr-cc",
    name: "Flickr, filtered to CC BY 2.0",
    url: "https://www.flickr.com/search/?license=4",
    model: "free",
    price: "Free. The cost is the same credit line.",
    firstSpend: 0,
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
    clause:
      "You are free to: Share, copy and redistribute the material in any medium or format; Adapt, remix, transform, and build upon the material for any purpose, even commercially.",
    clauseIs: "grant",
    release: "none",
    releaseNote:
      "The same shape as the Web Summit archive and without the curation: a photographer licensed the copyright and nobody in the frame signed anything. Under our own rule a recognisable face here is barred.",
    covers: ["weddings", "birthdays", "festivals", "trips"],
    catalogue:
      "The whole of Flickr under one licence filter, which is the deepest free corpus of real events that exists, by a distance. The sheets are what it returned for the four kinds of event Web Summit does not cover.",
    verdict:
      "Not a gallery, a filter over everyone's galleries. It is where you go if question 3 answers \"Only the frame's subject\" and a credit line is acceptable, and it is the only free place that can fill the four remaining kinds of event with real ones rather than staged ones.",
    barred: true,
  },
  {
    id: "nappy",
    name: "Nappy",
    url: "https://nappy.co/",
    model: "free",
    price: "Free. Donations to the photographer are invited, not required.",
    firstSpend: 0,
    licence: "CC0 1.0",
    licenceUrl: "https://nappy.co/license",
    clause:
      "depending on the intended use of the CC0 Content (in particular commercial purposes), in the case of the depiction of identifiable people, you may still need the permission or consent from third parties",
    clauseIs: "bar",
    release: "none",
    releaseNote:
      "Nappy says the quiet part in its own licence, which is more than most free libraries do. Its Studio arm does handle releases, but that is a commissioned shoot and not this library.",
    covers: ["birthdays", "weddings", "corporate", "trips"],
    catalogue:
      "A real library of Black and Brown people at celebrations, which is the representation the rest of the free corpus does not have. Readable from here, per kind of event.",
    verdict:
      "The best free library on this sheet at the thing the free corpus is worst at, and it still cannot hand us a released face. Keep it for a frame with nobody recognisable in it.",
    barred: true,
  },
  {
    id: "mixkit",
    name: "Mixkit, for clips",
    url: "https://mixkit.co/free-stock-video/",
    model: "free",
    price: "Free per item.",
    firstSpend: 0,
    licence: "Mixkit Stock Video Free Licence",
    licenceUrl: "https://mixkit.co/license/",
    clause:
      "Items under the Mixkit Stock Video Free License can be used in your commercial and non-commercial projects, for free. Attribution is not required.",
    clauseIs: "grant",
    release: "none",
    releaseNote:
      "No releases, and the grant is described as freely revocable with liability capped at ten dollars. A licence that can be withdrawn from under a published page is the failure mode the rule exists for.",
    covers: ["festivals", "weddings"],
    catalogue:
      "A real free clip library, readable from here: the sheets are its own poster frames. The same library also carries a Restricted licence that is personal use only, and the two look identical until the download.",
    verdict:
      "Fine as a lab stand-in for the vertical films, never as a shipped hero. Revocable is the whole answer.",
    barred: true,
  },
  {
    id: "coverr",
    name: "Coverr, for clips",
    url: "https://coverr.co/",
    model: "free",
    price: "Free.",
    firstSpend: 0,
    licence: "Coverr licence",
    licenceUrl: "https://coverr.co/license",
    clause:
      "Coverr.co grants you an irrevocable, non-exclusive, worldwide copyright license to download, copy, modify, perform, and use videos and music from Coverr.co for free, including for commercial purposes.",
    clauseIs: "grant",
    release: "none",
    releaseNote:
      "Coverr is the most candid source here about what it lacks: it says it obtains model releases for its content and does not pass them to users, and holds none for brands or landmarks.",
    covers: ["festivals"],
    catalogue:
      "Measured this round rather than trusted, and the measurement moved it down the sheet. A search for party returns 70 Coverr-hosted clips, 23 of them user AI generations, alongside 34 iStock results served into the same grid under no Coverr licence at all. A search for wedding returns 58, 24 of them AI, with the same 34 iStock results.",
    noSheet:
      "Readable, and the reading is the verdict: a sheet drawn from it would put two catalogues under one name and license neither.",
    verdict:
      "An irrevocable licence over a catalogue you have to audit per item, shown on a page mixed with a catalogue it does not cover. A source that needs auditing is not a source.",
    barred: true,
  },
  {
    id: "death-to-stock",
    name: "Death to Stock",
    url: "https://www.deathtothestockphoto.com/",
    model: "rental",
    price:
      "$20 a month or $199 a year for Brand. An extended licence starts at $179 a visual.",
    firstSpend: null,
    licence: "Death to Stock membership licence",
    licenceUrl: "https://www.deathtothestockphoto.com/pricing",
    clause:
      "your membership is essentially renting the rights to use the visuals, and if you cancel, that rental period ends",
    clauseIs: "bar",
    release: "per-item",
    releaseNote:
      "Shot by commissioned creators rather than scraped, so releases exist behind the work, but the membership licence is not where they are warranted to us.",
    covers: ["birthdays", "corporate", "trips"],
    catalogue:
      "More than 15,000 visuals, about 500 added a month, real photographers rather than generations. The taste is the closest here to the product's own.",
    noSheet:
      "200 at the door and 404 on every browse path under it: the 15,000 visuals are behind the same wall the rental clause describes.",
    verdict:
      "The nicest pictures and the worst deal. A subscription that can never be cancelled is not a price, it is a standing charge on our own marketing site.",
    barred: true,
  },
  {
    id: "creative-market",
    name: "Creative Market wedding bundles",
    url: "https://creativemarket.com/photos",
    model: "bundle",
    price:
      "$7 to $15 a photo, or $40 to $100 for a collection of 45 to 70 frames, paid once.",
    firstSpend: 40,
    licence: "Creative Market Commercial Licence",
    licenceUrl: "https://creativemarket.com/licenses",
    clause:
      "Personal: End Products Not For Sale. Business social media accounts and physical or digital paid advertisements are not permitted.",
    clauseIs: "bar",
    release: "none",
    releaseNote:
      "Releases are the individual shop's affair and are rarely stated. The bundles that are cheap are the ones shot as styled flat lays, where there is no face to release, which is precisely the half of the frame set we do not need.",
    covers: ["weddings"],
    catalogue:
      "Real wedding bundles from individual photographers, which is what the note asked to see. The catalogue refuses a non-browser client, so this sheet cannot draw its frames.",
    noSheet:
      "A 403 as well, so the cheap wedding album is taken entirely on its own description: a real price and unseen frames.",
    verdict:
      "This is the cheap wedding album from the note and the price is real. The cheap tier forbids a business social account and a paid advert, so the usable licence is the Commercial one, and what the money buys is rings and cake rather than a room full of people.",
    barred: true,
  },
];

export const ALLOWED_SOURCES = SOURCES.filter((s) => !s.barred);
export const BARRED_SOURCES = SOURCES.filter((s) => s.barred);

/**
 * ROUND THREE'S LICENCE SURVEY, kept because the rule is judged against it and
 * because two of these are instruments rather than places. Unsplash sits here now
 * rather than in SOURCES: its FREE licence is the refusal that opened this whole
 * track, and its PAID tier is a different agreement and the first row above.
 */
export type LicenceNote = {
  name: string;
  url: string;
  verdict: "allowed" | "refused";
  clause: string;
  note: string;
};

export const LICENCES: LicenceNote[] = [
  {
    name: "CC0 1.0",
    url: "creativecommons.org/publicdomain/zero/1.0/",
    verdict: "allowed",
    clause:
      "You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.",
    note: "The only clean one, and a waiver rather than a licence, so there is no revocation clause. It still does not touch the people in the frame: the deed says the rights others may have, such as publicity or privacy rights, are in no way affected. The 22 staged candidates are all CC0.",
  },
  {
    name: "Unsplash, the free licence",
    url: "unsplash.com/terms",
    verdict: "refused",
    clause:
      "Note that the Unsplash License does not include the right to use: Trademarks, logos, or brands that appear in Images / People's images if they are recognizable in the Images / Works of art or authorship that appear in Images",
    note: "The finding that started the track. The twelve stand-ins all claim Unsplash and every one is full of recognisable people, so the licence they claim never covered them. The free tier carries no warranty and caps liability at one hundred dollars. Its pre-5-June-2017 archive was CC0 and is a different matter: that is where the staged batch came from, and Unsplash+ is a third agreement again.",
  },
  {
    name: "Pexels",
    url: "pexels.com/license/",
    verdict: "allowed",
    clause:
      "All photos and videos on Pexels are free to use. Attribution is not required.",
    note: "Forbids identifiable people appearing in a bad light, implied endorsement, and redistribution on another stock platform, and adds a Standalone bar: cropping or recolouring is not creative effort enough to count as a new work. No releases. Cannot be read programmatically; the site returns 403 to anything that is not a browser.",
  },
  {
    name: "Pixabay",
    url: "pixabay.com/service/license-summary/",
    verdict: "allowed",
    clause:
      "Use Content without having to attribute the author (although giving credit is always appreciated by our community!)",
    note: "The same house as Pexels and near-identical terms. Anything published from 9 January 2019 is under Pixabay's own licence rather than CC0, and AI uploads are permitted so long as the contributor ticks the box, so the library is mixed by design. No releases.",
  },
  {
    name: "CC BY 4.0",
    url: "creativecommons.org/licenses/by/4.0/",
    verdict: "refused",
    clause:
      "Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made.",
    note: "Refused for the manifest rather than on principle. Round four found the strongest free catalogue on the sheet sitting under it (87,066 conference photographs), so the refusal is now a real cost rather than a cheap one, and question 3, on whether a crowd needs everyone\u2019s permission, puts it back in front of Will.",
  },
  {
    name: "Vecteezy (Free)",
    url: "vecteezy.com/licensing-agreement",
    verdict: "refused",
    clause:
      "Under the Free License: Attribution is required. Content may be used in video, film, or production projects with budgets up to $1,000.",
    note: "Attribution mandatory, commercial use capped, and Vecteezy reserves the right to stop licensing any content at any time and require you to destroy your copies. A licence that can be withdrawn from under a published page is not one to build a manifest on.",
  },
  {
    name: "Videvo",
    url: "videvo.net/license/ (dead, redirects to magnific.com/license, 404)",
    verdict: "refused",
    clause:
      "the Company authorizes the User in a non-transferable, revocable, limited, non-exclusive manner ... authorization to use Magnific Content is free of charge and conditioned upon any use by the User being duly attributed",
    note: "The licence page no longer exists. Videvo was absorbed into Freepik and its successor terms are revocable and require attribution unless you subscribe. Recorded precisely because it is the failure mode the rule is for: a source can vanish, and a manifest entry that names only the source proves nothing about what was agreed.",
  },
  {
    name: "Openverse",
    url: "docs.openverse.org/terms_of_service.html",
    verdict: "refused",
    clause:
      "Openverse does not own or control the content or data made available through the API or shared on the website, and does not verify its licensing status or make any representations or warranties about the content or data whatsoever.",
    note: "An index, not a source. A good way to find a candidate and never a way to justify one: whatever it reports has to be confirmed at the upstream file. Wikimedia Commons is the same shape, except its acceptance floor requires commercial use and a non-revocable licence, which is why the staged batch was cut there.",
  },
];

/** Sources that can actually serve this vertical. */
export function sourcesFor(v: Vertical): SourceCard[] {
  return SOURCES.filter((s) => s.covers.includes(v));
}

/** The contact sheet a source has for a vertical, or null with a reason on the card. */
export function sheetFor(sourceId: string, v: Vertical) {
  return CATALOGUE[`${sourceId}::${v}`] ?? null;
}

/** Every vertical a source can actually be DRAWN for, so a filter never offers a blank. */
export function drawableVerticals(sourceId: string): Vertical[] {
  return ALL_VERTICALS.filter(
    (v) => (sheetFor(sourceId, v)?.frames.length ?? 0) > 0,
  );
}

/** Sources with a contact sheet on this board at all. */
export const DRAWABLE_SOURCES = SOURCES.filter(
  (s) => drawableVerticals(s.id).length > 0,
);
