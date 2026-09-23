"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmEmailDialog } from "@/components/auth/confirm-email-dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markPendingOffer } from "@/lib/guest/album-return";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * THE MARK ON A NAME NOBODY PROVED, AND ITS WAY OUT (the identity reshape,
 * 2026-09-21).
 *
 * Will's `badge=mark`, verbatim: "Rather than a warning icon, this could be more
 * subtle. When the icon/mark is hovered, a tooltip should clarify what it means.
 * We could also have an unverified badge on the pop-up when a guest is clicked on
 * screen, as well as on the profile pages. I'm expecting a guest to see themselves
 * as marked as unverified publicly and want to correct that immediately by
 * verifying." So this is the quietest thing on the surface AND, on your OWN
 * credit, the shortest route to fixing it.
 *
 * ★ IT WEARS `MineMark`'S MATERIAL, not a warning icon's: a dot inside a small
 * disc (`shared/masonry.tsx`), because the album already taught a guest that a
 * small disc on a photograph is a fact about the photograph and not an alarm. Two
 * tones, and they are about what is BEHIND the mark, never about severity:
 * `lit` over a photograph (the glass disc, with the glyph's own halo, since no
 * pane can keep a white dot legible over a bright sky) and `paper` on a chip.
 *
 * ★ TAP TO OPEN, NOT HOVER. His word says tooltip; a Tooltip is hover/focus-only
 * and guests are on phones, so this is the `AnonymousInfo` precedent it replaces:
 * a Popover, which answers a pointer and a thumb with the same surface.
 *
 * ★ IT CARRIES ITS OWN DOOR, which is what lets the mark appear anywhere without
 * the surface under it having to grow a prop. The album's deepest surface (the
 * lightbox's credit) reaches this component through three modules that belong to
 * other lanes; a way out that had to be threaded through all of them would simply
 * not exist there, and the one place Will expects a guest to want it is exactly
 * there. The door is the one confirm door (`ConfirmEmailDialog`, the `keep`
 * wear), so confirming from the mark and confirming from the offer card under
 * the album are the same act with the same words: the uploads claimed, and with
 * them the event (guest by upload, 2026-09-22: there is no save step any more).
 *
 * ★ IT SAYS WHAT IS TRUE, NEVER WHAT IS SUSPECTED. "Anyone can type a name" is
 * the whole fact; nothing here calls a guest a liar and nothing implies the
 * photographs are worth less. The host gets one extra sentence, because the
 * switch is theirs and they may not know it exists.
 *
 * ★ AND THE WORD IS "UNVERIFIED" (Will, 2026-09-22, relitigating the mark
 * himself, verbatim: "I don't like the verbiage 'name not verified' because it
 * implies that we have verified the names of confirmed accounts. We haven't -
 * names can be anything, only emails verified, very important distinction.
 * However, I get that 'email not confirmed' doesn't work for name-only guests
 * either."). So the PUBLIC mark is one word for both unconfirmed states, a
 * typed name alone and a typed name with an address nobody has proved, because
 * an address nobody has proved is worth nothing publicly and saying otherwise
 * would leak that one exists. "Email not confirmed" is said in exactly one
 * place, the guest's OWN menu (`guest-name-menu.tsx`), where it is about them.
 */

export const UNVERIFIED_LABEL = "Unverified";

/**
 * The way out, as its own subtree: the one confirm door, whose claim carries the
 * guest's uploads (and with them this event) into the account. It is the only
 * thing here that touches the router or the auth machinery, and it exists only
 * while it is open. The follow moment that may come after it is the album
 * page's to play (it hears the claim land); this door only refreshes the page
 * so every credit redraws confirmed.
 */
function ConfirmEmailDoor({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <ConfirmEmailDialog
      open
      onOpenChange={(open) => !open && onClose()}
      onConfirmed={() => {
        onClose();
        router.refresh();
      }}
    />
  );
}

export function UnverifiedMark({
  name,
  tone = "paper",
  own = false,
  viewerIsHost = false,
  onConfirm,
  className,
}: {
  /** Whose name is marked, so the sentence can name them. */
  name?: string | null;
  /** `lit` = over a photograph (glass + the glyph's halo); `paper` = on a chip. */
  tone?: "lit" | "paper";
  /** This is the VIEWER's own credit: the reason changes and the way out appears. */
  own?: boolean;
  /** The host reading their own album gets the sentence about their own switch. */
  viewerIsHost?: boolean;
  /** Route the way out elsewhere (the header's menu owns its own door). */
  onConfirm?: () => void;
  className?: string;
}) {
  const [doorOpen, setDoorOpen] = useState(false);
  const who = name?.trim() || "This guest";

  return (
    <>
      <Popover>
        <PopoverTrigger
          aria-label={UNVERIFIED_LABEL}
          title={UNVERIFIED_LABEL}
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle",
            "transition-transform duration-150 ease-emphasis outline-none active:scale-90 motion-reduce:active:scale-100",
            tone === "lit"
              ? cn(GLASS_MARK, "focus-visible:ring-2 focus-visible:ring-white/70")
              : "border border-border bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1 rounded-full",
              tone === "lit"
                ? cn("bg-white", GLASS_MARK_LIT)
                : "bg-muted-foreground",
            )}
          />
        </PopoverTrigger>
        <PopoverContent side="top" className="space-y-2">
          <p className="text-reading font-medium">{UNVERIFIED_LABEL}</p>
          <p className="text-reading text-pretty text-muted-foreground">
            {/* ★ BOTH SENTENCES NAME THE THING THAT IS ACTUALLY MISSING (2026-09-22):
                a CONFIRMED EMAIL, never a verified name. Neither of them says
                whether an address was typed, because that is the guest's own
                business and this popover is what everybody else sees. */}
            {own
              ? "You added these with a name and no confirmed email, so the album shows you as unverified."
              : `Anyone can type a name. ${who} has not confirmed an email, so this is not proof of who they are.`}
          </p>
          {viewerIsHost && !own && (
            <p className="text-reading text-pretty text-muted-foreground">
              Turn on Require verified emails in this event&rsquo;s settings to
              ask every guest to confirm before they add anything.
            </p>
          )}
          {own && (
            // His "want to correct that immediately", on the mark itself.
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() => {
                if (onConfirm) {
                  onConfirm();
                  return;
                }
                // Written BEFORE the door opens: Google and a magic link
                // leave the page, and the album's return marker is what lands
                // the follow moment when they come back. The mark names no
                // album of its own; the album on screen is the one it keeps.
                markPendingOffer();
                setDoorOpen(true);
              }}
            >
              Confirm your email
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* ★ MOUNTED ONLY WHILE IT IS OPEN, which is not a micro-optimisation:
          the door needs the app ROUTER, and this mark rides surfaces (a host's
          grid, a lab specimen, every tile in an album) where nothing else does.
          A door that exists but is shut would make all of them depend on it. */}
      {own && !onConfirm && doorOpen && (
        <ConfirmEmailDoor onClose={() => setDoorOpen(false)} />
      )}
    </>
  );
}
