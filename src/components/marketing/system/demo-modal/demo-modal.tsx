"use client";

import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackAttrs } from "@/lib/analytics/events";
import { SITE_URL } from "@/lib/constants/site";

/**
 * THE DEMO MODAL (Will, 2026-09-27: "opens a modal (on desktop) to allow for
 * either direct link access or a scannable QR to try on their phone... This
 * modal could be helpful everywhere we point to our demo event on desktop").
 * One card behind every demo door at a desk: the demo's code to scan with a
 * phone, its short link in words, and the demo itself one press away in a new
 * tab. A phone never sees it (`opens.ts`): it opens the demo directly.
 *
 * ★ ITS KIND IS `share`, THE CODE CARD (the `popups` board's `share=card`,
 * `app/share/event-code-modal.tsx`): a 384 card at a desk with the code on
 * white and the action under it. Built on the Dialog as it stands; the kinds'
 * table `popups-wiring` is adding beside `floating-layer.ts` takes this one
 * under `share`.
 *
 * ★ THE CARD IS PAPER WHEREVER IT OPENS. The Dialog portals to <body>, outside
 * the cinema room's `.dark` and outside `[data-mkt]`, and the session's own
 * theme is whatever the visitor's OS says; `surface-paper` pins the pearl
 * register on the panel itself (and `dark:` stands down inside it, theme.css's
 * variant), so the code always stands on white at a scanner's contrast and the
 * button is ink on paper over a cinema page, a paper page or a dark session.
 * The code card spells its neutrals by hand for the same reason; the register
 * says it once.
 *
 * ★ THE CODE ENCODES THE SHORT LINK (`/demo`, the QR door's `opens=short`): 25
 * modules where the event link is 33, so at 208px each module is about 6px, a
 * code a phone reads off a laptop screen from arm's length (the scan floor is
 * 3). The words under the title are the same link, for a reader who would
 * rather type it: the product is one link, and the code is one way into it
 * (Will's `reel-story` r3 note on the hero).
 */

/** What the code encodes: the 307 to the demo event (`app/demo/route.ts`). */
const CODE_VALUE = `${SITE_URL}/demo`;
/** The same link in words: the host, never the scheme. */
const CODE_WORDS = `${new URL(SITE_URL).host}/demo`;
/** The code's drawn edge, quiet zone included (FooterQr bakes it in). */
const CODE_PX = 208;

export function DemoModal({
  open,
  onOpenChange,
  href,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where "Open the demo" goes: the door's own link. */
  href: string;
  /** Where focus lands on the way out (the door returns it to its opener). */
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="demo-modal"
        onCloseAutoFocus={onCloseAutoFocus}
        className="surface-paper justify-items-center gap-0 p-6 pt-8 text-center"
      >
        {/* The plate is FooterQr's own white, invisible on the paper card, and
            the quiet zone is inside the drawn edge, so nothing framing it can
            eat the margin a scanner needs. */}
        <FooterQr value={CODE_VALUE} size={CODE_PX} />
        <DialogTitle className="mt-5">Try our demo event</DialogTitle>
        <DialogDescription className="mt-2 max-w-[18rem] text-pretty">
          Scan the code with your phone to join as a guest would, or open it
          here.
        </DialogDescription>
        <Caption className="mt-3 select-all">{CODE_WORDS}</Caption>
        <Button asChild size="lg" className="mt-6 w-full">
          <a
            href={href}
            target="_blank"
            rel="noopener"
            {...trackAttrs("demo_open", { source: "demo-modal" })}
            // The tab it opens is where the reader went; the page they come
            // back to should be the one they left, not a card still asking.
            onClick={() => onOpenChange(false)}
          >
            Open the demo
            <ArrowUpRight data-icon="inline-end" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
