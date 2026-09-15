/**
 * THE CONTACT SHEETS (round four, 2026-09-15). GENERATED, then committed: each
 * entry is what a source's own public search page returned for that vertical on
 * the date below, recorded as the source's OWN thumbnail URL.
 *
 * ★ NOTHING HERE IS A FILE IN THIS REPO AND NOTHING HERE IS PROMOTED. A frame on
 * this board is the source's thumbnail, hotlinked from the source's own CDN, which
 * is the only honest way to show a catalogue we have not bought: a watermarked
 * comp stays a watermarked comp, a paid frame is never copied into our tree, and
 * the sheet cannot drift from the catalogue it claims to show without going blank.
 * public/design/media-kit/ still holds rounds one and two's 22 CC0 candidates and
 * gained nothing this round.
 *
 * ★ SO A FRAME CAN FAIL TO LOAD, AND THAT IS DESIGNED FOR. Every tile falls back
 * to a labelled slate naming its source, so a sheet degrades to a caption rather
 * than to a broken page. All 308 URLs below answered 200 with an image content-type
 * to a request carrying a partyreel.com referer on the date below, so none of them
 * is hotlink-protected today. Any that stop answering are the sheet telling the
 * truth about a catalogue that moved.
 *
 * HOW TO REBUILD IT: the harvest reads each source's public search page and takes
 * the thumbnail URLs out of the markup. SIX of the thirteen sources are not in
 * here, and ★ THEY ARE ABSENT FOR FOUR DIFFERENT REASONS, NOT ONE. Measured with
 * a plain client on HARVESTED: Adobe Stock, Stocksy and Creative Market answer
 * 403; Artgrid answers 200 with an empty application shell and fetches its clips
 * client side; Death to Stock answers 200 at the door and 404 on every browse path
 * under it; Coverr reads completely, and what the reading found is its verdict
 * rather than a sheet. Each card carries its own reason in `noSheet` (sources.ts)
 * and plan.test.ts refuses a source that has neither a sheet nor one.
 *
 * ★ UNSPLASH+ IS HERE BECAUSE THE EXCUSE WAS CHECKED, AND IT DID NOT HOLD. It was
 * the seventh blank, on the stated grounds that the paid tier sits behind an
 * account, which no one had measured. `unsplash.com/s/photos/<q>?license=plus`
 * returns the plus results to a plain client: 20 released frames on every one of
 * the five verticals, and the 60 below are the first 12 of each. Take them from
 * the embedded search payload, never from the preload tags in the `head`, which
 * repeat ONE photo at twelve widths and will happily pair two thumbnails to one
 * page. The `ixid` tracking token each URL carries is dropped on the way in; the
 * rest of the query string is the source's own. The procedure and the queries are
 * docs/specs/media-kit.md section 8.5.
 */

export type Vertical =
  | "weddings"
  | "birthdays"
  | "corporate"
  | "festivals"
  | "trips";

export type Frame = {
  /** The source's own thumbnail. Never copied, never promoted. */
  thumb: string;
  /** Where the frame lives, so a verdict can be checked at the source. */
  page: string;
};

export type Sheet = {
  /** The search that produced it, in the source's own words. */
  query: string;
  searchUrl: string;
  frames: Frame[];
};

export const HARVESTED = "2026-09-15";

/** Keyed `<source id>::<vertical>`. */
export const CATALOGUE: Record<string, Sheet> = {
  "unsplash-plus::weddings": {
    query: "wedding, filtered to the Unsplash+ licence",
    searchUrl: "https://unsplash.com/s/photos/wedding?license=plus",
    frames: [
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1675003662150-2569448d2b3b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/two-gold-wedding-rings-on-a-white-background-WHUG4KXCbuI",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1663076211121-36754a46de8d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/beautiful-young-bride-and-groom-outside-in-green-nature-at-romantic-sunset-holding-hands-rear-view-BYXAX2Lb_Ow",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1673897888993-a1db844c2ca1?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-table-is-set-with-candles-and-flowers-pt34cohzJiU",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1675851210020-045950ac0215?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-bride-and-groom-walking-down-a-flight-of-stairs-ijuTbtiGh5w",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1664530452596-e1c17e342876?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-bride-and-groom-standing-in-a-barn-aJnh0_TzdKg",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1711132425055-1c289c69b950?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-man-and-a-woman-standing-next-to-each-other-kzood2jZFME",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1675851210855-e7727076e829?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-bride-and-groom-standing-on-a-staircase-LLd5F6surIk",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1675719847698-6c8a924b2a7a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-couple-of-rings-sitting-on-top-of-a-wooden-box--Kc29c7lCBA",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1675720042825-84e20074f34a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-table-is-set-with-wine-glasses-and-flowers-rffPE2yNVG4",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1690148812608-9942834931a1?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-bride-and-groom-embracing-each-other-in-a-field-VPCIQIa_Hjk",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1675003663256-bfdc8b1acb2d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-bouquet-of-flowers-and-a-wedding-dress-on-a-couch-tCZg7Foz5hA",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1681841695231-d674aa32f65b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/bride-groom-and-their-guests-at-the-wedding-reception-outside-in-the-backyard-family-celebration-K-HExRIw96E",
      },
    ],
  },
  "unsplash-plus::birthdays": {
    query: "party, filtered to the Unsplash+ licence",
    searchUrl: "https://unsplash.com/s/photos/party?license=plus",
    frames: [
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1670333351937-68cb2735a0fd?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-hand-holding-a-glass-of-water-w3RxPn7C_vg",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1683121126477-17ef068309bc?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/crowd-of-cheerful-carefree-youth-waving-gadgets-with-flashlights-turned-on-while-supporting-favorite-singer-at-concert-9xBXiMNKnaM",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1683129651802-1c7ba429a137?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/happy-young-friends-dancing-in-confetti-during-celebration-of-holiday-lTjH9UGx2XI",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1666184130709-f3709060899a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-sitting-around-a-table-holding-sparklers-nGliBjjrUDY",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661759013744-4754d402459d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/multi-ethnic-group-of-young-people-having-fun-and-singing-karaoke-in-a-bar-at-night-focus-is-on-black-man-2MnoxgkfEeA",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1697477564435-a2481694a2fb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-white-table-topped-with-glasses-filled-with-liquid-MULu8JziS-o",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1682681903841-1f98ce6a1175?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-toasting-with-drinks-in-a-pool-I3IYOMYMvdE",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1697477564480-9496d0c4adc5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-disco-ball-being-blown-by-a-pair-of-legs-u1VVPvFXbeE",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1697477564605-e7e2a61aa9a6?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-woman-sitting-on-a-couch-holding-a-glass-of-wine-sC7aturO0lg",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1687826541778-3f2bf4c03bc3?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-women-standing-next-to-each-other-3TFDE0pm3_A",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1683121131492-9ae8cdfea4f7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-unrecognizable-people-standing-under-confetti-and-raising-hands-up-at-musical-performance-zmvpBGZbm4A",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1698529231408-80642212fd1b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-holding-up-wine-glasses-AuI39GyKr4E",
      },
    ],
  },
  "unsplash-plus::corporate": {
    query: "conference, filtered to the Unsplash+ licence",
    searchUrl: "https://unsplash.com/s/photos/conference?license=plus",
    frames: [
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1679547202671-f9dbbf466db4?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-sitting-in-chairs-in-front-of-a-projector-screen-bghmzALo194",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1679547202348-9aef21c9f30e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-standing-around-a-conference-room-Stdn0PNUyHM",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1664302656889-e0ff44331843?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-crowd-of-people-in-suits-and-ties-clapping-jtc3RWxfvOM",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1679547202717-c1fea70eb817?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-woman-standing-in-front-of-a-group-of-people-DLU7cBYNK80",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1663047091392-425566f3ea56?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/young-asian-female-economist-with-document-making-presentation-of-financial-data-or-new-project-by-interactive-screen-jXiLtQd9HGY",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1681487469745-91d1d8a5836b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/modern-cinema-interior-corner-with-dark-walls-a-concrete-floor-and-black-chairs-3d-rendering-mock-up-toned-image-double-exposure-FLlH4ILZKZk",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1733259762527-3d759dfdbd3d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-sitting-in-chairs-in-front-of-a-projector-screen-YF4rmfroznc",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1723291331030-d6874d63e5bf?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-diverse-business-people-meeting-concept-8Yh7UspTxMc",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1681493316075-b1c3e5302ec3?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/vertical-side-view-of-people-sitting-in-row-at-business-conference-focus-on-smiling-young-woman-applauding-in-foreground-2gztJrybPRU",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1733306641142-b51ea3730979?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/ask-a-question-at-the-conference-0qbUJwfj4Yw",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1679547202606-4d905471107f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-man-standing-in-front-of-a-group-of-people-OqSV8JWhm3c",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1725408033432-c6d0d712384a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-people-applauding-5RmFH0v6c30",
      },
    ],
  },
  "unsplash-plus::festivals": {
    query: "festival, filtered to the Unsplash+ licence",
    searchUrl: "https://unsplash.com/s/photos/festival?license=plus",
    frames: [
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1698500034742-098f7fc04163?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-table-topped-with-plates-and-bowls-filled-with-food-ZKGBoLFzBN4",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661284892176-fd7713b764a6?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-friends-having-fun-at-the-festival-y7CApuF9k4M",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661306437817-8ab34be91e0c?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/portrait-of-happy-crowd-enjoying-and-dancing-at-music-festival-XVrINU5jX58",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1682090867765-39d1790259c5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/indian-family-celebrating-diwali-festival-with-fire-crackers-j-s3Xs34xRs",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661377118520-287ec60a32f3?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/cheering-crowd-with-hands-in-air-enjoying-at-music-festival-dNvNcMjFN2s",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1683121131492-9ae8cdfea4f7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-unrecognizable-people-standing-under-confetti-and-raising-hands-up-at-musical-performance-zmvpBGZbm4A",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1663051210654-0c8a835dad1f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/front-view-of-group-of-young-friends-with-smartphone-at-summer-festival-taking-selfie-DUQhp7DoK4E",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1719066378950-f9df97d6e083?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-standing-around-each-other-3yqt17yQ2as",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1698500035049-d69331f7cd2a?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-close-up-of-a-plate-of-food-on-a-table-iMeicjsZvrY",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1664304095595-e428558e8161?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/happy-people-crowd-partying-under-colorful-powder-cloud-hi6Cri0Z38A",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1681830630610-9f26c9729b75?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/rear-view-of-group-of-unrecognizable-young-friends-dancing-at-summer-festival-XVkUW0-fsfw",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1664303674394-157511e7085d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/silhouettes-of-festival-concert-crowd-in-front-of-bright-stage-lights-unrecognizable-people-and-colorful-effects-ceK96L-QvtA",
      },
    ],
  },
  "unsplash-plus::trips": {
    query: "travel friends, filtered to the Unsplash+ licence",
    searchUrl: "https://unsplash.com/s/photos/travel-friends?license=plus",
    frames: [
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1663100398778-2c86ca1dc02e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-happy-young-people-with-smartphone-sitting-in-outdoors-cafe-on-town-trip-taking-selfie-z-swILPvL1s",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1687653086440-7dc61b5ff5db?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-people-walking-along-a-sandy-beach-gxYETAlsp-c",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661960937960-1883bf00f480?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/the-four-travelers-with-backpacks-standing-on-the-mountain-top-above-the-sea-wtPXO3708wk",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1683120698590-7e21c5ff1b5b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-hikers-on-mountain-slope-bEOwn1JCrWQ",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661636737716-aecafc3bdb4d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/happy-friends-enjoying-travel-and-vacation-in-the-city-BuxMyVp9Ydw",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661904024889-0f8bec080dd4?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/friendly-hugs-full-length-portrait-of-group-of-people-from-back-making-hug-and-looking-at-sea-De-m6c3okjc",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661265859579-de8150e43edb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/cheerful-young-people-spending-nice-time-together-while-sitting-on-the-beach-and-drinking-beer-CS2xuvlENeA",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1661933707147-3b1840e63102?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/having-fun-portrait-of-group-of-friends-dedicating-time-to-pleasure-during-their-trip-to-the-seashore-LIwiEzNwKKA",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1684379149616-e9058c859518?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/a-group-of-women-walking-across-a-sandy-beach-cBuf1xR6TGk",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1723600938180-0450c59d5deb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/backpackers-on-an-adventure-5HexLzLs7j0",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1679619556731-57bd1a224eb7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/two-women-taking-a-picture-with-a-cell-phone-fdILRW2jNyw",
      },
      {
        thumb:
          "https://plus.unsplash.com/premium_photo-1723867323960-b4491d2b324e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1",
        page: "https://unsplash.com/photos/group-of-young-adult-friends-outdoors-recreational-leisure-freedom-and-adventure-concept-alk3iuUe5zo",
      },
    ],
  },
  "websummit-flickr::corporate": {
    query: "the account, filtered to CC BY 2.0",
    searchUrl:
      "https://www.flickr.com/search/?user_id=websummit&license=4&text=&view_all=1",
    frames: [
      {
        thumb:
          "https://live.staticflickr.com/65535/54208554890_ed1e5abeb0_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208554890",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208389329_aa82a2e8b2_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208389329",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208554865_07e75aa02e_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208554865",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208389279_55df2d0459_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208389279",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208145076_542260f189_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208145076",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208389039_09d92e99cf_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208389039",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208554645_8a04e06da5_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208554645",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208144896_c2f933f6bc_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208144896",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208554620_98734128ff_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208554620",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54207250002_dcd0269887_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54207250002",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54207249947_507205d4a1_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54207249947",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/54208388779_ba66e3fffe_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=54208388779",
      },
    ],
  },
  "flickr-cc::weddings": {
    query: "wedding reception",
    searchUrl:
      "https://www.flickr.com/search/?license=4&text=wedding%20reception&view_all=1",
    frames: [
      {
        thumb:
          "https://live.staticflickr.com/1495/25869145772_3301f8b88a_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=25869145772",
      },
      {
        thumb: "https://live.staticflickr.com/7431/9403838167_ed8000f8f8_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=9403838167",
      },
      {
        thumb: "https://live.staticflickr.com/5503/9406597662_20b36be611_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=9406597662",
      },
      {
        thumb:
          "https://live.staticflickr.com/1618/25357232444_39e3379df4_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=25357232444",
      },
      {
        thumb:
          "https://live.staticflickr.com/1457/25869148332_aed75dffc4_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=25869148332",
      },
      {
        thumb: "https://live.staticflickr.com/7242/7161296661_37c4778c4f_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=7161296661",
      },
      {
        thumb: "https://live.staticflickr.com/5483/9403889743_25cd6604e9_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=9403889743",
      },
      {
        thumb: "https://live.staticflickr.com/201/490676748_5dc93d8c3c_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=490676748",
      },
      {
        thumb: "https://live.staticflickr.com/3295/2894165803_76e3006be4_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=2894165803",
      },
      {
        thumb: "https://live.staticflickr.com/204/493666206_6ce22999a7_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=493666206",
      },
      {
        thumb: "https://live.staticflickr.com/192/493665255_a45071a91a_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=493665255",
      },
      {
        thumb: "https://live.staticflickr.com/227/490659500_83d6c4947a_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=490659500",
      },
    ],
  },
  "flickr-cc::birthdays": {
    query: "birthday party",
    searchUrl:
      "https://www.flickr.com/search/?license=4&text=birthday%20party&view_all=1",
    frames: [
      {
        thumb: "https://live.staticflickr.com/135/335645724_c04a457a6f_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=335645724",
      },
      {
        thumb: "https://live.staticflickr.com/133/335644995_0d6e246a7a_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=335644995",
      },
      {
        thumb: "https://live.staticflickr.com/123/335646775_4da9f24e4b_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=335646775",
      },
      {
        thumb: "https://live.staticflickr.com/136/335646012_2b30cece41_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=335646012",
      },
      {
        thumb: "https://live.staticflickr.com/3305/3626009123_707493ef58_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3626009123",
      },
      {
        thumb: "https://live.staticflickr.com/106/312509578_fcc412c80c_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=312509578",
      },
      {
        thumb: "https://live.staticflickr.com/5/6815097_fbbf37ccd3_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=6815097",
      },
      {
        thumb: "https://live.staticflickr.com/3643/3633985996_78fe31a470_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3633985996",
      },
      {
        thumb: "https://live.staticflickr.com/2483/3633176117_eaaae35b43_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3633176117",
      },
      {
        thumb: "https://live.staticflickr.com/1019/957791340_c72c6f8c34_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=957791340",
      },
      {
        thumb: "https://live.staticflickr.com/2423/3633986584_cccef31ffc_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3633986584",
      },
      {
        thumb: "https://live.staticflickr.com/3661/3633173021_e6b32310fd_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3633173021",
      },
    ],
  },
  "flickr-cc::festivals": {
    query: "music festival crowd",
    searchUrl:
      "https://www.flickr.com/search/?license=4&text=music%20festival%20crowd&view_all=1",
    frames: [
      {
        thumb: "https://live.staticflickr.com/278/20444362496_25c6bea5cd_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=20444362496",
      },
      {
        thumb: "https://live.staticflickr.com/8286/7626662964_fb29748d20_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=7626662964",
      },
      {
        thumb: "https://live.staticflickr.com/2810/9353309975_ef4c857c41_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=9353309975",
      },
      {
        thumb: "https://live.staticflickr.com/5070/5699390899_3954efc5dc_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=5699390899",
      },
      {
        thumb: "https://live.staticflickr.com/8288/7626930248_44c8b311de_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=7626930248",
      },
      {
        thumb: "https://live.staticflickr.com/8147/7626658356_eba75a5ca2_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=7626658356",
      },
      {
        thumb: "https://live.staticflickr.com/3727/9978888284_afb182edac_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=9978888284",
      },
      {
        thumb:
          "https://live.staticflickr.com/2916/14564725320_ef7fe1e2fc_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=14564725320",
      },
      {
        thumb: "https://live.staticflickr.com/3073/2695143904_49d8b576cf_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=2695143904",
      },
      {
        thumb: "https://live.staticflickr.com/1293/4708150739_3d380d2c26_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=4708150739",
      },
      {
        thumb:
          "https://live.staticflickr.com/5618/21203045981_7e4691f291_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=21203045981",
      },
      {
        thumb: "https://live.staticflickr.com/7083/7394175796_6ba3363e76_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=7394175796",
      },
    ],
  },
  "flickr-cc::trips": {
    query: "friends travel group",
    searchUrl:
      "https://www.flickr.com/search/?license=4&text=friends%20travel%20group&view_all=1",
    frames: [
      {
        thumb: "https://live.staticflickr.com/3629/3562848460_ec62b07097_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3562848460",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/52655283551_a4f8caca9e_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=52655283551",
      },
      {
        thumb: "https://live.staticflickr.com/3410/3661466756_8169b448e0_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=3661466756",
      },
      {
        thumb:
          "https://live.staticflickr.com/65535/49962434666_049771aa07_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=49962434666",
      },
      {
        thumb:
          "https://live.staticflickr.com/3863/33214467092_1c71899f8b_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=33214467092",
      },
      {
        thumb:
          "https://live.staticflickr.com/3754/33748532706_3e89a0466d_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=33748532706",
      },
      {
        thumb: "https://live.staticflickr.com/4142/4779911251_ae51cdd634_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=4779911251",
      },
      {
        thumb: "https://live.staticflickr.com/4037/4351349271_14a0a0d155_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=4351349271",
      },
      {
        thumb:
          "https://live.staticflickr.com/7455/27701255940_6dbbd1597d_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=27701255940",
      },
      {
        thumb: "https://live.staticflickr.com/8012/6989706634_f3ac1fc2c2_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=6989706634",
      },
      {
        thumb:
          "https://live.staticflickr.com/4232/35780210721_8ff4c2f460_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=35780210721",
      },
      {
        thumb:
          "https://live.staticflickr.com/7757/27367988834_0bdef6f3b1_z.jpg",
        page: "https://www.flickr.com/photo.gne?id=27367988834",
      },
    ],
  },
  "istock::weddings": {
    query: "wedding reception toast",
    searchUrl:
      "https://www.istockphoto.com/search/2/image?phrase=wedding%20reception%20toast",
    frames: [
      {
        thumb:
          "https://media.istockphoto.com/id/1298329786/photo/wedding-celebratory-toast-with-string-lights-and-champagne-silhouettes.jpg?s=612x612&w=0&k=20&c=DN-V9iE_tnfuTyPZ3vRwpdszHW6efDs2zzDCI1OHUQA=",
        page: "https://www.istockphoto.com/photo/gm1298329786",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/516984553/photo/wedding-guests-clinking-glasses-with-newlyweds.jpg?s=612x612&w=0&k=20&c=1EIOb2aK1JpRnHvVZuxkDIF19bQa4LRzWkjerVLDRrw=",
        page: "https://www.istockphoto.com/photo/gm516984553",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1169591805/photo/bride-groom-and-wedding-guests-making-a-toast.jpg?s=612x612&w=0&k=20&c=4IxJoeOcFjxYtHNLtZn1_-Rs783Jaa3BkH0a8UNCiz4=",
        page: "https://www.istockphoto.com/photo/gm1169591805",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1161560805/photo/luxury-christmas-celebration-people-hands-toasting-with-champagne-glasses-at-delicious-feast.jpg?s=612x612&w=0&k=20&c=CmMki9R8aR5LtxlmDB7K6DwvgCBHCdV4LWEUHumra7w=",
        page: "https://www.istockphoto.com/photo/gm1161560805",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1779779864/photo/champagne-reception.jpg?s=612x612&w=0&k=20&c=PTxf8CcQGDNda3tKmFwFBFG6Iu9TytBG1_DV8BFeYa4=",
        page: "https://www.istockphoto.com/photo/gm1779779864",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1388562127/photo/beautiful-bride-and-groom-celebrate-wedding-at-an-evening-reception-party-newlyweds-propose-a.jpg?s=612x612&w=0&k=20&c=aoKNgxkKDSwnDx2GbVHS1WSUNNygWooJOSfMd5XqLrk=",
        page: "https://www.istockphoto.com/photo/gm1388562127",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2194972873/photo/group-of-guests-celebrate-and-raise-glasses-toasting-and-cheering-with-alcohol-glasses-with.jpg?s=612x612&w=0&k=20&c=jkhI5-tQkHnvaZqP7MNRmxtQSmVYRYjgGEjrnXAYG1k=",
        page: "https://www.istockphoto.com/photo/gm2194972873",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1179389943/photo/heres-to-an-unforgettable-couple-and-an-unforgettable-day.jpg?s=612x612&w=0&k=20&c=GJPzhVHx2o1_0JnWRg5JWsmbL4Q-ts6AE21WvJqzHDM=",
        page: "https://www.istockphoto.com/photo/gm1179389943",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/515689509/photo/newlywed-couple-toasting-champagne-flutes-with-guests-at-wedding.jpg?s=612x612&w=0&k=20&c=Z76ZLdikDTzLC7U70k2QN8QJQ6vBWeR9aEJY3yX99-Y=",
        page: "https://www.istockphoto.com/photo/gm515689509",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2170892940/photo/couple-sitting-at-the-bar-having-a-drink.jpg?s=612x612&w=0&k=20&c=DNY82x0Nh406EiIDBnTeSGGsxb2i1R9cSZtHuT3j_GY=",
        page: "https://www.istockphoto.com/photo/gm2170892940",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/544490649/photo/young-couple-and-guests-toasting-with-champagne-during-wedding-reception-in-domestic-garden.jpg?s=612x612&w=0&k=20&c=25GtxccmtfIn56DslZgY_-bWDQfNUC6yS9KhjvITI94=",
        page: "https://www.istockphoto.com/photo/gm544490649",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1169481946/photo/bride-groom-and-wedding-guests-making-a-toast.jpg?s=612x612&w=0&k=20&c=Q1AacsiAQJG_IDyv4K6E8oyJM6DvU7E-6u5KuE7wGCE=",
        page: "https://www.istockphoto.com/photo/gm1169481946",
      },
    ],
  },
  "istock::birthdays": {
    query: "birthday party friends",
    searchUrl:
      "https://www.istockphoto.com/search/2/image?phrase=birthday%20party%20friends",
    frames: [
      {
        thumb:
          "https://media.istockphoto.com/id/1282881649/photo/colleagues-celebrating-a-birthday-in-the-office.jpg?s=612x612&w=0&k=20&c=9Ik8RIy0YlK37gKWTn3C9GPfEro-dx-ugevsDGhjsv4=",
        page: "https://www.istockphoto.com/photo/gm1282881649",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1298329918/photo/birthday-celebratory-toast-with-string-lights-and-champagne-silhouettes.jpg?s=612x612&w=0&k=20&c=PaDeMR5-r0NdlxghuVF9tRqR5XkCdNdTzxrkofv0Syk=",
        page: "https://www.istockphoto.com/photo/gm1298329918",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1154066614/photo/happy-birthday-to-you-concept.jpg?s=612x612&w=0&k=20&c=laWMYxECOwx3R9pB07O2Ip11IRa_y-LdsUzO99BmqSk=",
        page: "https://www.istockphoto.com/photo/gm1154066614",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/518867858/photo/birthday-party-in-the-office.jpg?s=612x612&w=0&k=20&c=wFzZ_otUqJz_DAHGJtwbt-5NpGWz89Df6J0_IuZfTF8=",
        page: "https://www.istockphoto.com/photo/gm518867858",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1314076360/photo/birtday-girl-blowing-birtday-candles.jpg?s=612x612&w=0&k=20&c=WfmNSDfcyshLE9SLg4lefdxkkA3Ub2De9jmMk7WwSao=",
        page: "https://www.istockphoto.com/photo/gm1314076360",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2158580612/photo/mature-woman-celebrating-birthday-with-family-at-home.jpg?s=612x612&w=0&k=20&c=Adwbozn1_g-0PciiqGcQae4a-ABfq-SWxsIb5cDm010=",
        page: "https://www.istockphoto.com/photo/gm2158580612",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/866491714/photo/sparklers-background-young-people-at-celebration-party.jpg?s=612x612&w=0&k=20&c=4DEJBikCTVyCb3XNGZZJ6yHudt1lvY8Km2iHGu1a9fA=",
        page: "https://www.istockphoto.com/photo/gm866491714",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1128671609/photo/a-midsection-people-sitting-at-a-table-on-a-indoor-party-clinking-glasses-top-view.jpg?s=612x612&w=0&k=20&c=VxUsRDEQ3kkMYDCLKN6mThThqtONAUerHjKlZlE8pTQ=",
        page: "https://www.istockphoto.com/photo/gm1128671609",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1002144354/photo/friends-presenting-birthday-cake-to-girl.jpg?s=612x612&w=0&k=20&c=ctgYcQAoXGpJ0Gix6neiy6C09Anue_1-L1Gw_XQ9ANU=",
        page: "https://www.istockphoto.com/photo/gm1002144354",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/862578132/photo/group-of-young-people-celebrating-new-year-with-champagne-at-night-club.jpg?s=612x612&w=0&k=20&c=Dt3atehmEaLN0fl3sbE7ZWPRROqEW7yK2MHbcBAgCro=",
        page: "https://www.istockphoto.com/photo/gm862578132",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1145223597/photo/portrait-of-happy-birthday-boy.jpg?s=612x612&w=0&k=20&c=S4nbNGwf0YU1Jqs0OWSngRsvapM_NwaKWZ1xgHYc-6I=",
        page: "https://www.istockphoto.com/photo/gm1145223597",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1098331114/photo/woman-welcoming-guest-on-her-birthday-dinner-party-and-recieving-gifts.jpg?s=612x612&w=0&k=20&c=cCYcmCx1pPfGRwoGQow22le8NLNm7LTHvds1ZICWL9M=",
        page: "https://www.istockphoto.com/photo/gm1098331114",
      },
    ],
  },
  "istock::corporate": {
    query: "conference audience applause",
    searchUrl:
      "https://www.istockphoto.com/search/2/image?phrase=conference%20audience%20applause",
    frames: [
      {
        thumb:
          "https://media.istockphoto.com/id/1482843873/photo/close-up-on-hands-of-a-crowd-of-people-clapping-in-dark-conference-hall-during-a-motivational.jpg?s=612x612&w=0&k=20&c=l82b7EN4ml1NOIHsTMrQtEO6FpJbOE5ZbimEG1aeGM0=",
        page: "https://www.istockphoto.com/photo/gm1482843873",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1496377580/photo/group-of-people-applauding.jpg?s=612x612&w=0&k=20&c=3xt-MUAOankRsMDryMJTFEwC5QQ1CYHvloGIKbyzzDQ=",
        page: "https://www.istockphoto.com/photo/gm1496377580",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1482846285/photo/young-female-sitting-in-a-crowded-audience-at-a-science-conference-delegate-cheering-and.jpg?s=612x612&w=0&k=20&c=kCzxwQqokN1vaxlISKhzdRvY54Pfz7S95qdo-cef3D4=",
        page: "https://www.istockphoto.com/photo/gm1482846285",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/600073884/photo/audience-applauding-speaker-after-conference-presentation.jpg?s=612x612&w=0&k=20&c=NlPmJ5oMpvIsR8jDJq16NPBXEdeDMlSsNT6IQ0cdLcI=",
        page: "https://www.istockphoto.com/photo/gm600073884",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1308964737/photo/business-professionals-applauding-at-a-seminar.jpg?s=612x612&w=0&k=20&c=5K2lx04-jnYq9F__ZB6pci333qhRNzdaTNfsE0V91Xk=",
        page: "https://www.istockphoto.com/photo/gm1308964737",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1327425232/photo/happy-businesswoman-and-her-colleagues-applauding-on-an-education-event-in-board-room.jpg?s=612x612&w=0&k=20&c=jCKkah6ffYvvOQuDwi0Eu26byTF5Vso5lvJ5OEeIf5M=",
        page: "https://www.istockphoto.com/photo/gm1327425232",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2177550208/photo/audience-applauding-enthusiastically-at-captivating-business-presentation.jpg?s=612x612&w=0&k=20&c=80RBM1sTlLLRaYy1TEDHXfoJYV4sJyryVxza-MsqaNo=",
        page: "https://www.istockphoto.com/photo/gm2177550208",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1757733738/photo/close-up-on-hands-of-audience-of-people-applauding-in-concert-hall-during-business-forum.jpg?s=612x612&w=0&k=20&c=ZUh6C1naTsaOQd9d1eumMpOHqx-bmoUvtnPg_uwjy1Y=",
        page: "https://www.istockphoto.com/photo/gm1757733738",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1330989185/photo/group-of-business-people-applauding-a-presentation.jpg?s=612x612&w=0&k=20&c=YLvN4cKMEDZRqr8F794oKorWMmmKA3jsD-A5ERC9d84=",
        page: "https://www.istockphoto.com/photo/gm1330989185",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1328313970/photo/multi-ethnic-group-of-business-persons-during-a-conference.jpg?s=612x612&w=0&k=20&c=mWSk9ctsxJxa0CVdm66kkdsggz4dknCitGPpws0cCm8=",
        page: "https://www.istockphoto.com/photo/gm1328313970",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/511305456/photo/what-a-great-speech.jpg?s=612x612&w=0&k=20&c=o0MauhCViR0E9wG_rfL5PZ7s-aAMtBzGnufBLZ-MDKU=",
        page: "https://www.istockphoto.com/photo/gm511305456",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1482843353/photo/backview-of-a-stylish-young-businessman-in-a-dark-crowded-auditorium-at-a-startup-summit.jpg?s=612x612&w=0&k=20&c=ar-3wiGLR7PTPbskl400Ksbs0m-jj56U6tGzd6oTKTM=",
        page: "https://www.istockphoto.com/photo/gm1482843353",
      },
    ],
  },
  "istock::festivals": {
    query: "music festival crowd night",
    searchUrl:
      "https://www.istockphoto.com/search/2/image?phrase=music%20festival%20crowd%20night",
    frames: [
      {
        thumb:
          "https://media.istockphoto.com/id/1806011581/photo/overjoyed-happy-young-people-dancing-jumping-and-singing-during-concert-of-favorite-group.jpg?s=612x612&w=0&k=20&c=cMFdhX403-yKneupEN-VWSfFdy6UWf1H0zqo6QBChP4=",
        page: "https://www.istockphoto.com/photo/gm1806011581",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1324561072/photo/party-people-enjoy-concert-at-festival-summer-music-festival.jpg?s=612x612&w=0&k=20&c=rT--yThoBJSdYFUb9nm-7oDvBZuhNE9LmB5uYmlxvSs=",
        page: "https://www.istockphoto.com/photo/gm1324561072",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/841506898/photo/enjoying-great-concert.jpg?s=612x612&w=0&k=20&c=Xp3jzTqDk9XbD5WV26tKNaig_ql2v-tafXGiMnUsJ-o=",
        page: "https://www.istockphoto.com/photo/gm841506898",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1247853982/photo/cheering-crowd-with-hands-in-air-at-music-festival.jpg?s=612x612&w=0&k=20&c=rDVKf3hTryuVgUZUme9wuwfsegfJptAvVEKsDwppvJc=",
        page: "https://www.istockphoto.com/photo/gm1247853982",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/613897214/photo/festival-event-party-with-hipster-people-blurred-background.jpg?s=612x612&w=0&k=20&c=Bm8VhlY_evqBc5J2l_FgjQQXfK19QiH2bq1pla2r03U=",
        page: "https://www.istockphoto.com/photo/gm613897214",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1471448614/photo/crowd-of-people-dancing-at-a-music-show-in-barcelona-during-the-summer-of-2022.jpg?s=612x612&w=0&k=20&c=FpGZq6p-1Gqx1JHN-mgapyQhLlvtNGr2M-hxm7mSvt0=",
        page: "https://www.istockphoto.com/photo/gm1471448614",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1049022558/photo/cheering-crowd-at-a-concert.jpg?s=612x612&w=0&k=20&c=N7i13NuEACX5XQtl3yxk_chY7QUiMYip-l_JNOYYXH0=",
        page: "https://www.istockphoto.com/photo/gm1049022558",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1964203350/photo/crowd-is-rising-their-hands-and-dancing-on-an-open-air-concert.jpg?s=612x612&w=0&k=20&c=3Jbj-MKB62pr3HIvJURRuJDino-86O3nF6rNRZDmx28=",
        page: "https://www.istockphoto.com/photo/gm1964203350",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1913125761/photo/silhouettes-of-people-dancing-and-rising-hands-at-open-air-summer-festival.jpg?s=612x612&w=0&k=20&c=HqEoqMCPEyOR4uhOnc03sDONY267HJqwXcqTMZjqqPw=",
        page: "https://www.istockphoto.com/photo/gm1913125761",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/622215586/photo/psychedelic-concert-crowd.jpg?s=612x612&w=0&k=20&c=4iF7Qq_buiJtI9Iz3d-XRRM-FTyhKj2umcoQC_cjc_8=",
        page: "https://www.istockphoto.com/photo/gm622215586",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1329410603/photo/large-group-of-people-at-a-concert-party.jpg?s=612x612&w=0&k=20&c=l6wVs8ljbWD_6c6_Z9QG7vKwrEQvKnYxeyOjA-KmQkk=",
        page: "https://www.istockphoto.com/photo/gm1329410603",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/483495210/photo/concert-crowd.jpg?s=612x612&w=0&k=20&c=Zs594m8f5LJ7DqJTK2y6V-SojwvkEQtgiNOsm0A2sNc=",
        page: "https://www.istockphoto.com/photo/gm483495210",
      },
    ],
  },
  "istock::trips": {
    query: "friends group trip",
    searchUrl:
      "https://www.istockphoto.com/search/2/image?phrase=friends%20group%20trip",
    frames: [
      {
        thumb:
          "https://media.istockphoto.com/id/2150324729/photo/smiling-mature-friends-standing-arm-in-arm-by-a-scenic-coast-during-a-road-trip.jpg?s=612x612&w=0&k=20&c=hjDMfHjg-ZJDzPrXCk7aQ4FKbVISltPLLycsgjUOrBA=",
        page: "https://www.istockphoto.com/photo/gm2150324729",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2217502343/photo/mature-women-and-men-laughing-together.jpg?s=612x612&w=0&k=20&c=dUmP948rQfY4CVlF6d3pGbKmwN0jrJRqT12ijBcdP8I=",
        page: "https://www.istockphoto.com/photo/gm2217502343",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1369171053/photo/group-of-sporty-people-walks-in-mountains-at-sunset-with-backpacks.jpg?s=612x612&w=0&k=20&c=ajQuWt2YRWd0FPaCpdKz2Tt3WX2NI1ddeZjf8HIxlwU=",
        page: "https://www.istockphoto.com/photo/gm1369171053",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2150324711/photo/smiling-mature-women-standing-together-by-a-scenic-coast-during-a-road-trip.jpg?s=612x612&w=0&k=20&c=zCZPvKhbENJqpiVbz2od-uB_nwm-U4E8DYizIPEwK3c=",
        page: "https://www.istockphoto.com/photo/gm2150324711",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1086841152/photo/friends-riding-bicycles-in-a-city.jpg?s=612x612&w=0&k=20&c=m8bxNeY0bh8nayPC4fya5058sf_sdVsWjSJ4JDFzvmM=",
        page: "https://www.istockphoto.com/photo/gm1086841152",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/941491560/photo/big-group-of-people-success-mountain-top.jpg?s=612x612&w=0&k=20&c=pHdhprmhi1kgQE7SdEXcZRciiEd8iCSiZ9a0Ghbn7v4=",
        page: "https://www.istockphoto.com/photo/gm941491560",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/858917054/photo/happy-friends-travel-expedition-concept.jpg?s=612x612&w=0&k=20&c=ATiu_Nvrt5Rs5NYo6mib-e35MvsyR-caaXlQ1BIiq00=",
        page: "https://www.istockphoto.com/photo/gm858917054",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1166378619/photo/large-group-of-happy-friends-in-mountains-area.jpg?s=612x612&w=0&k=20&c=PRlOrqCmlc7QEpTtQw5Blk5NlTtQzT8osgFDK8059p0=",
        page: "https://www.istockphoto.com/photo/gm1166378619",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2042539861/photo/joyful-friends-taking-a-selfie-on-vacation.jpg?s=612x612&w=0&k=20&c=5KN-AW-fA7NgHW1mbumiM4SRd7PzYmUTtLBF8f_IfXk=",
        page: "https://www.istockphoto.com/photo/gm2042539861",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/932750734/photo/three-male-friends-on-a-road-trip-using-a-tablet-computer.jpg?s=612x612&w=0&k=20&c=ksFdUrJ62yf5wipekSX7BqathgUQi6zwYOzvmqO7EW0=",
        page: "https://www.istockphoto.com/photo/gm932750734",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/1181845094/photo/seniors-enjoying-and-having-fun-in-rowing-boat.jpg?s=612x612&w=0&k=20&c=4DZcjE_Qdw8KPUKAJ4XOdX3CPtoVPBb1w-u2FcR_rf8=",
        page: "https://www.istockphoto.com/photo/gm1181845094",
      },
      {
        thumb:
          "https://media.istockphoto.com/id/2149306940/photo/friends-dancing-and-having-fun-on-the-beach.jpg?s=612x612&w=0&k=20&c=QlAXdFgCeSjp9NsCsf0uYFwFfAC3tcVoH6vAOB2qIhA=",
        page: "https://www.istockphoto.com/photo/gm2149306940",
      },
    ],
  },
  "envato-elements::weddings": {
    query: "wedding reception",
    searchUrl: "https://elements.envato.com/photos?terms=wedding%20reception",
    frames: [
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/b6/97/8a/84/78/v1_E10/E109JG1P.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c147e38138c60a0a7c568f09db041d05727f24eb5b7e91ed3870b338620f1903",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/a9/c7/76/96/5c/v1_E10/E105PKAY.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c08d03eb316d5ddfdbb565b70dfe35805e96558f25284092c5da21b544e151fd",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e5/76/4d/db/98/v1_E10/E10I0EM9.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=497bbd405d086decc4fec5f9f010c40ff8eea24016970db4e9f375686ad67a13",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/af/f3/a0/34/98/v1_E10/E10HX5IU.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a8d5d4a53c9282743006e5b517574e148ebc3fd4aef348b8e92d3f4bed260753",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/eb/42/86/b2/7d/v1_E10/E10GZXCO.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f65716e5a7820fb784bbdf721639ce022e9a475fc62d8ed1f2ea7df063c27e37",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e4/b8/69/8a/c1/v1_E10/E1049R36.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f8f1e673ac762fcbbc5742b9403b5edd8c1b65e6300f0019064c01d2ba7045ca",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/c7/e9/63/a4/22/v1_E10/E10AS9CI.JPG?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a2e6adaa5501d2dca500d7683ad5fcbde91433e4c2d935d163b92b6db668f13e",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/c110e8cc-170b-4ae0-b678-1c08115b3d22.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a95a0c6e3a08d27cc11d651032a125b937ab371ca09c3991ec017b6a91a22f93",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/be/e2/97/94/6a/v1_E10/E101KX6J.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=d3a5c7b73cfbba568fe5a676dacc80425cb03209b826f9e35b5fd92cf1c1c600",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/5b/45/cd/35/b7/v1_E10/E10IDEBL.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=8ee3608b2a69c33e566f6021980c47de3936afef585747e6981b4b60a0e11d13",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/86/8c/5f/bf/14/v1_E10/E10IIXQQ.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=bf8f6bac25ec9f5e1952be55ba10394d80f737c7128241e83b719d47d99736b3",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/3ac2c20b-64cc-4bc1-8959-8e615f362624.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=2c931fee8efe730671317ef2e41203da13fc962fbe01579955b89aa0604660c6",
        page: "https://elements.envato.com/photos?terms=wedding%20reception",
      },
    ],
  },
  "envato-elements::birthdays": {
    query: "birthday party",
    searchUrl: "https://elements.envato.com/photos?terms=birthday%20party",
    frames: [
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/b6/97/8a/84/78/v1_E10/E109JG1P.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c147e38138c60a0a7c568f09db041d05727f24eb5b7e91ed3870b338620f1903",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/a9/c7/76/96/5c/v1_E10/E105PKAY.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c08d03eb316d5ddfdbb565b70dfe35805e96558f25284092c5da21b544e151fd",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e5/76/4d/db/98/v1_E10/E10I0EM9.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=497bbd405d086decc4fec5f9f010c40ff8eea24016970db4e9f375686ad67a13",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/af/f3/a0/34/98/v1_E10/E10HX5IU.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a8d5d4a53c9282743006e5b517574e148ebc3fd4aef348b8e92d3f4bed260753",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/eb/42/86/b2/7d/v1_E10/E10GZXCO.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f65716e5a7820fb784bbdf721639ce022e9a475fc62d8ed1f2ea7df063c27e37",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e4/b8/69/8a/c1/v1_E10/E1049R36.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f8f1e673ac762fcbbc5742b9403b5edd8c1b65e6300f0019064c01d2ba7045ca",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/c7/e9/63/a4/22/v1_E10/E10AS9CI.JPG?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a2e6adaa5501d2dca500d7683ad5fcbde91433e4c2d935d163b92b6db668f13e",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/c110e8cc-170b-4ae0-b678-1c08115b3d22.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a95a0c6e3a08d27cc11d651032a125b937ab371ca09c3991ec017b6a91a22f93",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/be/e2/97/94/6a/v1_E10/E101KX6J.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=d3a5c7b73cfbba568fe5a676dacc80425cb03209b826f9e35b5fd92cf1c1c600",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/5b/45/cd/35/b7/v1_E10/E10IDEBL.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=8ee3608b2a69c33e566f6021980c47de3936afef585747e6981b4b60a0e11d13",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/86/8c/5f/bf/14/v1_E10/E10IIXQQ.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=bf8f6bac25ec9f5e1952be55ba10394d80f737c7128241e83b719d47d99736b3",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/3ac2c20b-64cc-4bc1-8959-8e615f362624.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=2c931fee8efe730671317ef2e41203da13fc962fbe01579955b89aa0604660c6",
        page: "https://elements.envato.com/photos?terms=birthday%20party",
      },
    ],
  },
  "envato-elements::corporate": {
    query: "conference audience",
    searchUrl: "https://elements.envato.com/photos?terms=conference%20audience",
    frames: [
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/b6/97/8a/84/78/v1_E10/E109JG1P.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c147e38138c60a0a7c568f09db041d05727f24eb5b7e91ed3870b338620f1903",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/a9/c7/76/96/5c/v1_E10/E105PKAY.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c08d03eb316d5ddfdbb565b70dfe35805e96558f25284092c5da21b544e151fd",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e5/76/4d/db/98/v1_E10/E10I0EM9.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=497bbd405d086decc4fec5f9f010c40ff8eea24016970db4e9f375686ad67a13",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/af/f3/a0/34/98/v1_E10/E10HX5IU.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a8d5d4a53c9282743006e5b517574e148ebc3fd4aef348b8e92d3f4bed260753",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/eb/42/86/b2/7d/v1_E10/E10GZXCO.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f65716e5a7820fb784bbdf721639ce022e9a475fc62d8ed1f2ea7df063c27e37",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e4/b8/69/8a/c1/v1_E10/E1049R36.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f8f1e673ac762fcbbc5742b9403b5edd8c1b65e6300f0019064c01d2ba7045ca",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/c7/e9/63/a4/22/v1_E10/E10AS9CI.JPG?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a2e6adaa5501d2dca500d7683ad5fcbde91433e4c2d935d163b92b6db668f13e",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/c110e8cc-170b-4ae0-b678-1c08115b3d22.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a95a0c6e3a08d27cc11d651032a125b937ab371ca09c3991ec017b6a91a22f93",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/be/e2/97/94/6a/v1_E10/E101KX6J.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=d3a5c7b73cfbba568fe5a676dacc80425cb03209b826f9e35b5fd92cf1c1c600",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/5b/45/cd/35/b7/v1_E10/E10IDEBL.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=8ee3608b2a69c33e566f6021980c47de3936afef585747e6981b4b60a0e11d13",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/86/8c/5f/bf/14/v1_E10/E10IIXQQ.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=bf8f6bac25ec9f5e1952be55ba10394d80f737c7128241e83b719d47d99736b3",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/3ac2c20b-64cc-4bc1-8959-8e615f362624.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=2c931fee8efe730671317ef2e41203da13fc962fbe01579955b89aa0604660c6",
        page: "https://elements.envato.com/photos?terms=conference%20audience",
      },
    ],
  },
  "envato-elements::festivals": {
    query: "music festival",
    searchUrl: "https://elements.envato.com/photos?terms=music%20festival",
    frames: [
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/b6/97/8a/84/78/v1_E10/E109JG1P.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c147e38138c60a0a7c568f09db041d05727f24eb5b7e91ed3870b338620f1903",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/a9/c7/76/96/5c/v1_E10/E105PKAY.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c08d03eb316d5ddfdbb565b70dfe35805e96558f25284092c5da21b544e151fd",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e5/76/4d/db/98/v1_E10/E10I0EM9.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=497bbd405d086decc4fec5f9f010c40ff8eea24016970db4e9f375686ad67a13",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/af/f3/a0/34/98/v1_E10/E10HX5IU.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a8d5d4a53c9282743006e5b517574e148ebc3fd4aef348b8e92d3f4bed260753",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/eb/42/86/b2/7d/v1_E10/E10GZXCO.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f65716e5a7820fb784bbdf721639ce022e9a475fc62d8ed1f2ea7df063c27e37",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e4/b8/69/8a/c1/v1_E10/E1049R36.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f8f1e673ac762fcbbc5742b9403b5edd8c1b65e6300f0019064c01d2ba7045ca",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/c7/e9/63/a4/22/v1_E10/E10AS9CI.JPG?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a2e6adaa5501d2dca500d7683ad5fcbde91433e4c2d935d163b92b6db668f13e",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/c110e8cc-170b-4ae0-b678-1c08115b3d22.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a95a0c6e3a08d27cc11d651032a125b937ab371ca09c3991ec017b6a91a22f93",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/be/e2/97/94/6a/v1_E10/E101KX6J.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=d3a5c7b73cfbba568fe5a676dacc80425cb03209b826f9e35b5fd92cf1c1c600",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/5b/45/cd/35/b7/v1_E10/E10IDEBL.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=8ee3608b2a69c33e566f6021980c47de3936afef585747e6981b4b60a0e11d13",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/86/8c/5f/bf/14/v1_E10/E10IIXQQ.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=bf8f6bac25ec9f5e1952be55ba10394d80f737c7128241e83b719d47d99736b3",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/3ac2c20b-64cc-4bc1-8959-8e615f362624.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=2c931fee8efe730671317ef2e41203da13fc962fbe01579955b89aa0604660c6",
        page: "https://elements.envato.com/photos?terms=music%20festival",
      },
    ],
  },
  "envato-elements::trips": {
    query: "friends travel",
    searchUrl: "https://elements.envato.com/photos?terms=friends%20travel",
    frames: [
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/b6/97/8a/84/78/v1_E10/E109JG1P.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c147e38138c60a0a7c568f09db041d05727f24eb5b7e91ed3870b338620f1903",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/a9/c7/76/96/5c/v1_E10/E105PKAY.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=c08d03eb316d5ddfdbb565b70dfe35805e96558f25284092c5da21b544e151fd",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e5/76/4d/db/98/v1_E10/E10I0EM9.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=497bbd405d086decc4fec5f9f010c40ff8eea24016970db4e9f375686ad67a13",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/af/f3/a0/34/98/v1_E10/E10HX5IU.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a8d5d4a53c9282743006e5b517574e148ebc3fd4aef348b8e92d3f4bed260753",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/eb/42/86/b2/7d/v1_E10/E10GZXCO.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f65716e5a7820fb784bbdf721639ce022e9a475fc62d8ed1f2ea7df063c27e37",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/e4/b8/69/8a/c1/v1_E10/E1049R36.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=f8f1e673ac762fcbbc5742b9403b5edd8c1b65e6300f0019064c01d2ba7045ca",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/c7/e9/63/a4/22/v1_E10/E10AS9CI.JPG?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a2e6adaa5501d2dca500d7683ad5fcbde91433e4c2d935d163b92b6db668f13e",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/c110e8cc-170b-4ae0-b678-1c08115b3d22.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=a95a0c6e3a08d27cc11d651032a125b937ab371ca09c3991ec017b6a91a22f93",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/be/e2/97/94/6a/v1_E10/E101KX6J.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=d3a5c7b73cfbba568fe5a676dacc80425cb03209b826f9e35b5fd92cf1c1c600",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/5b/45/cd/35/b7/v1_E10/E10IDEBL.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=8ee3608b2a69c33e566f6021980c47de3936afef585747e6981b4b60a0e11d13",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/EVA/TRX/86/8c/5f/bf/14/v1_E10/E10IIXQQ.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=bf8f6bac25ec9f5e1952be55ba10394d80f737c7128241e83b719d47d99736b3",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
      {
        thumb:
          "https://elements-resized.envatousercontent.com/envato-dam-assets-production/11e7acb8-fec2-4469-8e6b-811657259569/3ac2c20b-64cc-4bc1-8959-8e615f362624.jpg?w=400&cf_fit=scale-down&mark-alpha=18&mark=https%3A%2F%2Felements-assets.envato.com%2Fstatic%2Fwatermark4.png&q=85&format=auto&s=2c931fee8efe730671317ef2e41203da13fc962fbe01579955b89aa0604660c6",
        page: "https://elements.envato.com/photos?terms=friends%20travel",
      },
    ],
  },
  "nappy::birthdays": {
    query: "party",
    searchUrl: "https://nappy.co/search?q=party",
    frames: [
      {
        thumb:
          "https://images.nappy.co/photo/vgWhdAWHariGtbjSJKkYD.jpg?width=600",
        page: "https://nappy.co/photo/vgWhdAWHariGtbjSJKkYD",
      },
      {
        thumb:
          "https://images.nappy.co/photo/vEs-tz0hcyXJpS4w7mGJ5.jpg?width=600",
        page: "https://nappy.co/photo/vEs-tz0hcyXJpS4w7mGJ5",
      },
      {
        thumb:
          "https://images.nappy.co/photo/GZuChC0NQXo3aLXid-Ts8.jpg?width=600",
        page: "https://nappy.co/photo/GZuChC0NQXo3aLXid-Ts8",
      },
      {
        thumb:
          "https://images.nappy.co/photo/wjTH8J4pGIHN3acdZSYLy.jpg?width=600",
        page: "https://nappy.co/photo/wjTH8J4pGIHN3acdZSYLy",
      },
      {
        thumb:
          "https://images.nappy.co/photo/KS8n6id3IpvyoXpGXB1j9.jpg?width=600",
        page: "https://nappy.co/photo/KS8n6id3IpvyoXpGXB1j9",
      },
      {
        thumb:
          "https://images.nappy.co/photo/UVn4WLWD8W1A0AHG1rcvy.jpg?width=600",
        page: "https://nappy.co/photo/UVn4WLWD8W1A0AHG1rcvy",
      },
      {
        thumb:
          "https://images.nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O.jpg?width=600",
        page: "https://nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O",
      },
      {
        thumb:
          "https://images.nappy.co/photo/xp7fRRkRiLjifrfVvF_59.jpg?width=600",
        page: "https://nappy.co/photo/xp7fRRkRiLjifrfVvF_59",
      },
      {
        thumb:
          "https://images.nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI.jpg?width=600",
        page: "https://nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI",
      },
      {
        thumb:
          "https://images.nappy.co/photo/87PnrWD1kLZNuaJxenTha.jpg?width=600",
        page: "https://nappy.co/photo/87PnrWD1kLZNuaJxenTha",
      },
      {
        thumb:
          "https://images.nappy.co/photo/8TMBZUrarOR6v-pTEPfrH.jpg?width=600",
        page: "https://nappy.co/photo/8TMBZUrarOR6v-pTEPfrH",
      },
      {
        thumb:
          "https://images.nappy.co/photo/8KinWhx6LQs0wNShKnFde.jpg?width=600",
        page: "https://nappy.co/photo/8KinWhx6LQs0wNShKnFde",
      },
    ],
  },
  "nappy::weddings": {
    query: "wedding",
    searchUrl: "https://nappy.co/search?q=wedding",
    frames: [
      {
        thumb:
          "https://images.nappy.co/photo/vgWhdAWHariGtbjSJKkYD.jpg?width=600",
        page: "https://nappy.co/photo/vgWhdAWHariGtbjSJKkYD",
      },
      {
        thumb:
          "https://images.nappy.co/photo/4s4owGEkN139tLdYv1VEk.jpg?width=600",
        page: "https://nappy.co/photo/4s4owGEkN139tLdYv1VEk",
      },
      {
        thumb:
          "https://images.nappy.co/photo/LCmYxEjVYWMB1FEkaeOEW.jpg?width=600",
        page: "https://nappy.co/photo/LCmYxEjVYWMB1FEkaeOEW",
      },
      {
        thumb:
          "https://images.nappy.co/photo/zf68eBqzzQUAZImBAOG6D.jpg?width=600",
        page: "https://nappy.co/photo/zf68eBqzzQUAZImBAOG6D",
      },
      {
        thumb:
          "https://images.nappy.co/photo/jfpn2upOOz_To1MY4ndCa.jpg?width=600",
        page: "https://nappy.co/photo/jfpn2upOOz_To1MY4ndCa",
      },
      {
        thumb:
          "https://images.nappy.co/photo/_2fjRyNwcVKVlMKYfxDYC.jpg?width=600",
        page: "https://nappy.co/photo/_2fjRyNwcVKVlMKYfxDYC",
      },
      {
        thumb:
          "https://images.nappy.co/photo/9RANqQSGQ7ZddfYw3Rkcn.jpg?width=600",
        page: "https://nappy.co/photo/9RANqQSGQ7ZddfYw3Rkcn",
      },
      {
        thumb:
          "https://images.nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O.jpg?width=600",
        page: "https://nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O",
      },
      {
        thumb:
          "https://images.nappy.co/photo/xp7fRRkRiLjifrfVvF_59.jpg?width=600",
        page: "https://nappy.co/photo/xp7fRRkRiLjifrfVvF_59",
      },
      {
        thumb:
          "https://images.nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI.jpg?width=600",
        page: "https://nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI",
      },
      {
        thumb:
          "https://images.nappy.co/photo/87PnrWD1kLZNuaJxenTha.jpg?width=600",
        page: "https://nappy.co/photo/87PnrWD1kLZNuaJxenTha",
      },
      {
        thumb:
          "https://images.nappy.co/photo/8TMBZUrarOR6v-pTEPfrH.jpg?width=600",
        page: "https://nappy.co/photo/8TMBZUrarOR6v-pTEPfrH",
      },
    ],
  },
  "nappy::corporate": {
    query: "meeting",
    searchUrl: "https://nappy.co/search?q=meeting",
    frames: [
      {
        thumb:
          "https://images.nappy.co/photo/vgWhdAWHariGtbjSJKkYD.jpg?width=600",
        page: "https://nappy.co/photo/vgWhdAWHariGtbjSJKkYD",
      },
      {
        thumb:
          "https://images.nappy.co/photo/gd-pgHLiwITBRtp_kwg7W.jpg?width=600",
        page: "https://nappy.co/photo/gd-pgHLiwITBRtp_kwg7W",
      },
      {
        thumb:
          "https://images.nappy.co/photo/1fbf71j2IZtrLjAOBC9Da.jpg?width=600",
        page: "https://nappy.co/photo/1fbf71j2IZtrLjAOBC9Da",
      },
      {
        thumb:
          "https://images.nappy.co/photo/T-Ub-Gburl-W31FmJLoi-.jpg?width=600",
        page: "https://nappy.co/photo/T-Ub-Gburl-W31FmJLoi-",
      },
      {
        thumb:
          "https://images.nappy.co/photo/PfUhYx7E1z0qYSek-POiG.jpg?width=600",
        page: "https://nappy.co/photo/PfUhYx7E1z0qYSek-POiG",
      },
      {
        thumb:
          "https://images.nappy.co/photo/9Vt8Lgl4SLoy5Omqywehu.jpg?width=600",
        page: "https://nappy.co/photo/9Vt8Lgl4SLoy5Omqywehu",
      },
      {
        thumb:
          "https://images.nappy.co/photo/cDRThYbzOCK2AwLV1jKGF.jpg?width=600",
        page: "https://nappy.co/photo/cDRThYbzOCK2AwLV1jKGF",
      },
      {
        thumb:
          "https://images.nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O.jpg?width=600",
        page: "https://nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O",
      },
      {
        thumb:
          "https://images.nappy.co/photo/xp7fRRkRiLjifrfVvF_59.jpg?width=600",
        page: "https://nappy.co/photo/xp7fRRkRiLjifrfVvF_59",
      },
      {
        thumb:
          "https://images.nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI.jpg?width=600",
        page: "https://nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI",
      },
      {
        thumb:
          "https://images.nappy.co/photo/87PnrWD1kLZNuaJxenTha.jpg?width=600",
        page: "https://nappy.co/photo/87PnrWD1kLZNuaJxenTha",
      },
      {
        thumb:
          "https://images.nappy.co/photo/8TMBZUrarOR6v-pTEPfrH.jpg?width=600",
        page: "https://nappy.co/photo/8TMBZUrarOR6v-pTEPfrH",
      },
    ],
  },
  "nappy::trips": {
    query: "friends travel",
    searchUrl: "https://nappy.co/search?q=friends%20travel",
    frames: [
      {
        thumb:
          "https://images.nappy.co/photo/vgWhdAWHariGtbjSJKkYD.jpg?width=600",
        page: "https://nappy.co/photo/vgWhdAWHariGtbjSJKkYD",
      },
      {
        thumb:
          "https://images.nappy.co/photo/YAy45meUAhz8fO4sAGCWp.jpg?width=600",
        page: "https://nappy.co/photo/YAy45meUAhz8fO4sAGCWp",
      },
      {
        thumb:
          "https://images.nappy.co/photo/WUiHbEeUEUVV8fpnjTqKc.jpg?width=600",
        page: "https://nappy.co/photo/WUiHbEeUEUVV8fpnjTqKc",
      },
      {
        thumb:
          "https://images.nappy.co/photo/VZ_AAymmEJrWQC6rpg4kV.jpg?width=600",
        page: "https://nappy.co/photo/VZ_AAymmEJrWQC6rpg4kV",
      },
      {
        thumb:
          "https://images.nappy.co/photo/aqugmHwvS7pAjkO1uflwX.jpg?width=600",
        page: "https://nappy.co/photo/aqugmHwvS7pAjkO1uflwX",
      },
      {
        thumb:
          "https://images.nappy.co/photo/rpMxgEmLa8j8z1l9KMIE7.jpg?width=600",
        page: "https://nappy.co/photo/rpMxgEmLa8j8z1l9KMIE7",
      },
      {
        thumb:
          "https://images.nappy.co/photo/rR4-0UdzyPsYo-p1o2JiY.jpg?width=600",
        page: "https://nappy.co/photo/rR4-0UdzyPsYo-p1o2JiY",
      },
      {
        thumb:
          "https://images.nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O.jpg?width=600",
        page: "https://nappy.co/photo/KbLYSYvLF_3Zi07lz-M6O",
      },
      {
        thumb:
          "https://images.nappy.co/photo/xp7fRRkRiLjifrfVvF_59.jpg?width=600",
        page: "https://nappy.co/photo/xp7fRRkRiLjifrfVvF_59",
      },
      {
        thumb:
          "https://images.nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI.jpg?width=600",
        page: "https://nappy.co/photo/Hzut4HgXSrIfkEXQHM8HI",
      },
      {
        thumb:
          "https://images.nappy.co/photo/87PnrWD1kLZNuaJxenTha.jpg?width=600",
        page: "https://nappy.co/photo/87PnrWD1kLZNuaJxenTha",
      },
      {
        thumb:
          "https://images.nappy.co/photo/8TMBZUrarOR6v-pTEPfrH.jpg?width=600",
        page: "https://nappy.co/photo/8TMBZUrarOR6v-pTEPfrH",
      },
    ],
  },
  "mixkit::festivals": {
    query: "party, poster frames",
    searchUrl: "https://mixkit.co/free-stock-video/party/",
    frames: [
      {
        thumb: "https://assets.mixkit.co/videos/14116/14116-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/4344/4344-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/46896/46896-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/42299/42299-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/48636/48636-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/4151/4151-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/4127/4127-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/4188/4188-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/46893/46893-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/831/831-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/party/",
      },
    ],
  },
  "mixkit::weddings": {
    query: "wedding, poster frames",
    searchUrl: "https://mixkit.co/free-stock-video/wedding/",
    frames: [
      {
        thumb: "https://assets.mixkit.co/videos/5218/5218-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/40601/40601-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/40584/40584-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/5223/5223-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/40627/40627-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/5224/5224-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/5206/5206-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/40591/40591-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/40593/40593-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
      {
        thumb: "https://assets.mixkit.co/videos/5213/5213-thumb-360-0.jpg",
        page: "https://mixkit.co/free-stock-video/wedding/",
      },
    ],
  },
};

export const SHEET_COUNT = Object.keys(CATALOGUE).length;
export const FRAME_COUNT = Object.values(CATALOGUE).reduce(
  (n, s) => n + s.frames.length,
  0,
);
