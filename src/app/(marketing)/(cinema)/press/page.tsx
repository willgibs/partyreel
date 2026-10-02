import { redirect } from "next/navigation";

import { ABOUT_PRESS_HREF } from "@/lib/constants/about";

/**
 * /press IS A DOOR NOW (about-press r1, `kit=band`): the page folded into
 * /about, whose press kit band is where a writer lands, so the route answers
 * with a redirect and draws nothing.
 *
 * ★ A PAGE'S `redirect()`, NOT A `next.config.ts` ENTRY, AND A 307, NEVER A
 * 308. The address is one the whole site and the outside world already hold
 * (the footer, the nav, an old story's link), and the kit's home is a block on
 * another page: if a press page ever returns, a permanent redirect would be an
 * entry in every CDN and phone that followed it. The destination is
 * `ABOUT_PRESS_HREF`, the one home every Press door reads, so the route cannot
 * point somewhere the band is not.
 *
 * The route stays out of the sitemap (an address that only redirects is not
 * listed) and out of every door's link: the nav, the contact page and the llms
 * files point straight at the band.
 */
export default function PressPage() {
  redirect(ABOUT_PRESS_HREF);
}
