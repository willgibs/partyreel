/**
 * THE SOURCE SURVEY, on the board so a ruling can be made in front of the clause
 * rather than in a browser tab. Every `clause` below is quoted VERBATIM from the
 * license page at `url` on the date in `retrieved`; nothing here is paraphrased,
 * because a paraphrase of a license is not a license. The full survey, with what
 * each source forbids and why the four refusals fail us, is
 * docs/specs/media-kit.md section 4.
 *
 * `verdict` is this track's reading, not a lawyer's, and it is one of the asks.
 * The test it applies is the one the round was given: does this source allow a
 * commercial marketing use, without attribution, under terms we can name?
 */
export type Source = {
  name: string;
  url: string;
  retrieved: string;
  verdict: "allowed" | "refused";
  /** The one clause that decides it, word for word. */
  clause: string;
  /** Why that clause lands where it does for us, and what it still forbids. */
  note: string;
};

export const SOURCES: Source[] = [
  {
    name: "CC0 1.0",
    url: "creativecommons.org/publicdomain/zero/1.0/",
    retrieved: "2026-09-14",
    verdict: "allowed",
    clause:
      "You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.",
    note: "The only clean one. A waiver, not a license, so there is no revocation clause to worry about. It still does not touch the people in the frame: the deed says the rights others may have in the work, such as publicity or privacy rights, are in no way affected. The staged batch is all CC0.",
  },
  {
    name: "Pexels",
    url: "pexels.com/license/",
    retrieved: "2026-09-14",
    verdict: "allowed",
    clause:
      "All photos and videos on Pexels are free to use. Attribution is not required.",
    note: "Forbids identifiable people appearing in a bad light, implied endorsement by people or brands, and redistribution on another stock platform. The terms add a Standalone bar: cropping or recolouring is not enough creative effort to count as a new work. Cannot be fetched programmatically; the site returns 403 to anything that is not a browser.",
  },
  {
    name: "Pixabay",
    url: "pixabay.com/service/license-summary/",
    retrieved: "2026-09-14",
    verdict: "allowed",
    clause:
      "Use Content without having to attribute the author (although giving credit is always appreciated by our community!)",
    note: "Same house as Pexels and near-identical terms. Two things to know: anything published from 9 January 2019 is under Pixabay's own license rather than CC0, and AI-generated uploads are permitted so long as the contributor ticks the AI-generated box, so the library is mixed by design.",
  },
  {
    name: "Mixkit",
    url: "mixkit.co/license/",
    retrieved: "2026-09-14",
    verdict: "allowed",
    clause:
      "Items under the Mixkit Stock Video Free License can be used in your commercial and non-commercial projects, for free. Attribution is not required.",
    note: "Per item, not per site: the same video library also carries a Restricted License that is personal use only, and the two look identical until you read the download. The grant is described as freely revocable and liability is capped at ten dollars. Useful for clips, never for a batch.",
  },
  {
    name: "Coverr",
    url: "coverr.co/license",
    retrieved: "2026-09-14",
    verdict: "allowed",
    clause:
      "Coverr.co grants you an irrevocable, non-exclusive, worldwide copyright license to download, copy, modify, perform, and use videos and music from Coverr.co for free, including for commercial purposes.",
    note: "The most candid source on releases: it says it obtains model releases for people in its content and does not provide them to users, and holds none for brands or landmarks. It also bars AI training outright, and its catalog is supplemented with Shutterstock results that are not under this license at all.",
  },
  {
    name: "Unsplash",
    url: "unsplash.com/terms",
    retrieved: "2026-09-14",
    verdict: "refused",
    clause:
      "Note that the Unsplash License does not include the right to use: Trademarks, logos, or brands that appear in Images / People's images if they are recognizable in the Images / Works of art or authorship that appear in Images",
    note: "This is the finding of the round. The twelve stand-ins all claim Unsplash, and every one of them is full of recognizable people. The license they claim never covered those people. Unsplash's free tier also carries no warranty at all and caps liability at one hundred dollars. Its pre-5-June-2017 archive was CC0 and is a different matter: that is where the staged batch comes from.",
  },
  {
    name: "CC BY 4.0",
    url: "creativecommons.org/licenses/by/4.0/",
    retrieved: "2026-09-14",
    verdict: "refused",
    clause:
      "Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made.",
    note: "Refused for the manifest, not on principle: it is a good license and it cannot be revoked while we comply. But a credit line under every photograph on a marketing page is a design decision Will has not made, and the rule has to be one a page can keep silently. Fine for a one-off editorial frame that prints its credit.",
  },
  {
    name: "Vecteezy (Free)",
    url: "vecteezy.com/licensing-agreement",
    retrieved: "2026-09-14",
    verdict: "refused",
    clause:
      "Under the Free License: Attribution is required. Content may be used in video, film, or production projects with budgets up to $1,000.",
    note: "Attribution mandatory, commercial use capped, and Vecteezy reserves the right to stop licensing any content at any time and require you to cease using it and destroy your copies. A license that can be withdrawn from under a published page is not one we can build a manifest on.",
  },
  {
    name: "Videvo",
    url: "videvo.net/license/ (dead, redirects to magnific.com/license, 404)",
    retrieved: "2026-09-14",
    verdict: "refused",
    clause:
      "the Company authorizes the User in a non-transferable, revocable, limited, non-exclusive manner ... authorization to use Magnific Content is free of charge and conditioned upon any use by the User being duly attributed",
    note: "The license page no longer exists. Videvo was absorbed into Freepik and its successor terms are revocable and require attribution unless you subscribe. Worth recording precisely because it is the failure mode the rule is for: a source can vanish, and a manifest entry that only says the source name has no way to prove what was agreed.",
  },
  {
    name: "Openverse",
    url: "docs.openverse.org/terms_of_service.html",
    retrieved: "2026-09-14",
    verdict: "refused",
    clause:
      "Openverse does not own or control the content or data made available through the API or shared on the website, and does not verify its licensing status or make any representations or warranties about the content or data whatsoever.",
    note: "An index, not a source. It is a good way to find a candidate and never a way to justify one: whatever it reports has to be confirmed at the upstream file before the frame is recorded. Wikimedia Commons is the same shape, except that its acceptance floor requires commercial use and a non-revocable license, which is why the batch was cut there.",
  },
];
