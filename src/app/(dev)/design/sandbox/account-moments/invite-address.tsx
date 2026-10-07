"use client";

import "./invite-address.css";

import type { CSSProperties } from "react";
import Link from "next/link";

import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { PRIYA } from "./fixtures";

/**
 * ADDRESS, HER ADDRESS SET AS AN INVITATION: its subject is the address her
 * page would have, set the way an engraved invitation sets a name. One
 * sentence broken across centred lines, the connecting words small and grey,
 * her name the one large line, then the reply. Priya opens it days after Maya
 * & Jay's wedding, whose invitation was set exactly so.
 *
 * ★ THE TYPE ITSELF SAYS NOT YET (the consent model, profiles-social.md): her
 * name is pencilled in on a printed blank, the way a reply card leaves one for
 * a name, lighter than every printed word on the card, so the address reads
 * as offered and never as one that already answers. "Could" is the sentence's
 * verb, the press only opens the setup (which claims the handle last, at
 * Finish), and "Nothing is public until you finish" promises so. Reaching for
 * the key inks the name and its blank: a preview that lets go with her.
 *
 * ★ PAPER ON EITHER GROUND, APERTURE'S PRINT: the picked take prints a card on
 * paper (`onPaper.print`, its table card), and Afterglow keeps the room for
 * photographs and paper for deciding, so in the room the card still wears
 * `.surface-paper`: the same stock and the same ink, never a dark panel with a
 * border. Its edge is its one frame; no glow, tint or shadow touches it.
 *
 * ★ ONE COMPOSITION AT EVERY WIDTH, upright and centred: a desk only gives it
 * more air and its words the reading size (`invite-address.css`, since a lab
 * breakpoint utility loses to production's own on a shared element,
 * design.css).
 *
 * Its motion is the page's own: it arrives a beat after her head
 * (`data-arrive`, the head's index 0, this 1), a plain fade under reduced
 * motion, and it is complete at rest.
 */

/**
 * Drawn as she meets it in production: the wired card reads the host off the
 * site's URL as the setup does (`siteUrl`), which on a dev server says
 * localhost. The handle is the setup's own first suggestion (`PRIYA.handle`),
 * which the wired card prints only once its availability is read.
 */
const HOST = "partyreel.com";

export function AddressInvite() {
  return (
    <Card
      data-arrive
      style={{ "--arrive-i": 1 } as CSSProperties}
      role="region"
      aria-label="Set up your page"
      className="am-addr surface-paper"
    >
      <p className="am-addr-say">
        <span className="am-addr-line">Your page could live at</span>
        {/* ★ ONE WORD WHEREVER ITS LINES FALL: the host and her name are
            inline blocks with a break between them, never two blocks, so a
            reader, a copy and the board's caption all get the address whole. */}
        <span className="am-addr-address">
          <span className="am-addr-host">{HOST}/u/</span>
          <wbr />
          <span className="am-addr-handle font-heading">{PRIYA.handle}</span>
        </span>
        <span aria-hidden className="am-addr-blank" />
        <span className="am-addr-line">with the events you choose.</span>
      </p>
      {/* "It" is the address above, and the setup is how: the address, how she
          shows up, which events show. The line under it is the promise that
          makes the press safe. */}
      <Button asChild size="lg" className="am-addr-key">
        <Link href={PROFILE_SETUP_PATH}>Make it yours</Link>
      </Button>
      <p className="am-addr-promise">Nothing is public until you finish.</p>
    </Card>
  );
}
