"use client";

import "./page-invite-card.css";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useId,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { dismissPageInviteAction } from "@/app/(app)/account/profile/actions";
import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import { edgeBand } from "@/components/app/event-feed/event-hub-head-edge";
import { Button } from "@/components/ui/button";
import { captureWarning } from "@/lib/observability/sentry";

import { bodyBand, type Lit } from "./page-invite-light";
import { readInviteLight } from "./page-invite-read";

/**
 * THE INVITATION (`identity-profile` r1, `prompt=claim`: "once Priya finishes claiming events from the dashboard, a card
 * invites her to set up her page next", with the board's reason: a person who just finished claiming events is already
 * thinking about her identity across them), AS ONE LIT PLATE (`account-moments` r2, `invite=plate`, Will 2026-10-07: "my
 * eye goes straight to cta heading/button beside each other to easily digest info at a glance").
 *
 * The dashboard decides whether it renders (`shouldInviteToPage`, account/profile/invite.ts): no page yet, no claim waiting,
 * an event her page could show, not dismissed. It sits where the claim ticket stood, so it arrives the moment Finish settles
 * the ticket away. It is gone once the page is set up (the handle it waits on) or she says Not now, which is remembered on
 * this device.
 *
 * ★ HER PAGE IS PAPER; THE INVITATION IS THE ONE PIECE OF THE ROOM IT HOLDS (Aperture, brand r2: on paper, light lives only
 * inside a dark piece of the room, one a screen). The plate wears `surface-ink`, its top edge lit in her own photographs'
 * colours (`page-invite-light.ts`: her photographs, else her seed's hue, else the house ember), and holds the words and the
 * way on, close together: the heading and the key read as one group at a glance, which is the whole of his note. The most
 * beautiful thing on her page is the way to share it.
 *
 * ★ NEVER SAYS SHE IS PUBLIC. The words invite and promise ("Your page, when you're ready", "Nothing is public until you
 * finish"); the key leads to the setup (`PROFILE_SETUP_PATH`), which claims her handle last, at Finish: the consent act
 * (profiles-social.md). Nothing here publishes. The title is not "Share your page", which read as a share-link action right
 * under "Only you can see this page".
 *
 * ★ A COMPACT OBJECT, A LIGHT AT REST. It is only as tall as its words, and at a desk it keeps its phone's proportion; the
 * light arrives once, as her photographs are read, and rests lit, so the plate stands complete and usable before it (dark,
 * with its words and key) and a read that fails leaves it lit in the house's ember. The photographs are read on her device,
 * from the previews a Server Function hands over (`page-invite-read.ts` holds the cost: about six 16KB reads from R2).
 *
 * ★ `/me` WEARS IT STANDING (`dismissible={false}`, crumbs-46). An account with no handle keeps her uploads, likes and
 * connections at /me, and the user menu's Your profile opens it, so the invitation there is the one way from that page to the
 * setup: a Not now would take it away from the page she chose to open, and, being the dashboard's cookie, would hide the
 * dashboard's too. The setup's key stays where the dashboard's points (it does not go through /me: the plate IS the
 * invitation, and a stop on the way would be a tap more).
 */

/** Runs `fn` once the page is idle (or soon, where it cannot say), so a read never competes with the first paint's tiles. */
function whenIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 300);
  return () => clearTimeout(id);
}

/** A failed read says so once a page, never once a plate (a refused origin would otherwise dim every invitation silently). */
let warned = false;

/** Her light, read once the plate is up: null while it is read, then the ladder's answer (never a failure). */
function useHerLight(): Lit | null {
  const [lit, setLit] = useState<Lit | null>(null);
  useEffect(() => {
    let gone = false;
    const cancel = whenIdle(() => {
      void readInviteLight().then(({ lit: next, asked, read }) => {
        if (gone) return;
        setLit(next);
        if (asked > 0 && read === 0 && !warned) {
          warned = true;
          captureWarning("media", "invite_light_unread", {
            photographs: asked,
          });
        }
      });
    });
    return () => {
      gone = true;
      cancel();
    };
  }, []);
  return lit;
}

/** The light inside the plate: its body, its glow at the edge, and the edge itself lit (the Seam, in her light). */
function PlateLight({ lit }: { lit: Lit | null }) {
  return (
    <div
      aria-hidden
      className="pic-light"
      data-plate-light={lit?.from ?? "reading"}
      data-hues={lit ? lit.edge.hues.map(Math.round).join(" ") : undefined}
      style={{ "--pic-fill": lit?.fill ?? 1 } as CSSProperties}
    >
      {lit ? (
        <div className="pic-lit">
          <div
            className="pic-body"
            style={{ background: bodyBand(lit.fall, lit.edge.c) }}
          />
          <div
            className="pic-glow"
            style={{ background: edgeBand(lit.edge, "glow") }}
          />
          <div
            className="pic-line"
            style={{ background: edgeBand(lit.edge, "line") }}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * IN THE ROOM THE LIT EDGE ALSO TOUCHES THE PAGE, softly: a lit edge gives light both ways, and on the room's near-black
 * that spill reads as light. On paper it is never drawn (`page-invite-card.css`: Aperture's one rule).
 */
function PlateSpill({ lit }: { lit: Lit | null }) {
  if (!lit) return null;
  return (
    <div
      aria-hidden
      className="pic-spill"
      style={{ background: edgeBand(lit.edge, "glow") }}
    />
  );
}

export function PageInviteCard({
  dismissible = true,
}: {
  /** False: no Not now, so the plate stands wherever it is drawn. */
  dismissible?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  const lit = useHerLight();
  const title = useId();

  if (dismissed) return null;

  function notNow() {
    // Hidden at once: a dismissal answers instantly, and the cookie write only makes it last.
    setDismissed(true);
    startTransition(async () => {
      const result = await dismissPageInviteAction().catch(() => ({
        ok: false,
      }));
      if (!result.ok) {
        setDismissed(false);
        toast.error("Couldn't hide that just now. Please try again.");
      }
    });
  }

  return (
    <div data-page-invite className="pic-wrap">
      <PlateSpill lit={lit} />
      <section
        aria-labelledby={title}
        className="surface-ink pic-plate rounded-2xl text-foreground"
      >
        <PlateLight lit={lit} />
        <div className="min-w-0">
          <h2 id={title} className="font-heading text-subsection text-balance">
            Your page, when you&rsquo;re ready
          </h2>
          <p className="mt-1 text-working text-muted-foreground">
            Nothing is public until you finish.
          </p>
        </div>
        <div className="pic-keys">
          {/* ★ THE BUTTON CARRIES THE REASON (crumbs-44, from `profile-setup`): it repeated the title, so the card said
              "Set up your page" twice and why never. Choosing what shows is what the setup is for, and the line above is
              the promise that makes pressing it safe. */}
          <Button asChild size="lg">
            <Link href={PROFILE_SETUP_PATH}>
              Choose what shows
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
          {dismissible && (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="text-muted-foreground"
              disabled={pending}
              onClick={notNow}
            >
              Not now
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
