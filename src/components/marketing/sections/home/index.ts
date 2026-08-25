import type { ComponentType } from "react";

import { Album } from "./album";
import { CinemaClose } from "./cinema-close";
import { CinemaHero } from "./cinema-hero";
import { Curation } from "./curation";
import { Decomposition } from "./decomposition";
import { EventsTeaser } from "./events-teaser";
import { Faq } from "./faq";
import { FilmStrip } from "./film-strip";
import { LiveDemo } from "./live-demo";
import { PricingTeaser } from "./pricing-teaser";
import { Privacy } from "./privacy";
import { ReelTeaser } from "./reel-teaser";
import { HOME_SECTION_IDS, type HomeSectionId } from "./section-ids";
import { TrustStrip } from "./trust-strip";

/**
 * The home's ordered section manifest (the page maps it). The ORDER lives in
 * section-ids.ts (Vitest-pinned); this Record only pairs ids with components,
 * and its HomeSectionId key type makes a missing or extra section a type
 * error, so the pin and the render can never drift apart.
 */
const SECTION_COMPONENTS: Record<HomeSectionId, ComponentType> = {
  "cinema-hero": CinemaHero,
  "trust-strip": TrustStrip,
  decomposition: Decomposition,
  "film-strip": FilmStrip,
  "live-demo": LiveDemo,
  album: Album,
  curation: Curation,
  "reel-teaser": ReelTeaser,
  privacy: Privacy,
  "events-teaser": EventsTeaser,
  "pricing-teaser": PricingTeaser,
  faq: Faq,
  "cinema-close": CinemaClose,
};

export const HOME_SECTIONS: ReadonlyArray<{
  id: HomeSectionId;
  Component: ComponentType;
}> = HOME_SECTION_IDS.map((id) => ({ id, Component: SECTION_COMPONENTS[id] }));
