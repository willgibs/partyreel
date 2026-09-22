"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GuestAccountMenu } from "@/components/guest/guest-account-menu";
import { GuestNameMenu } from "@/components/guest/guest-name-menu";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  useStoredEmailAttached,
  useStoredName,
} from "@/lib/guest/use-stored-name";
import {
  leaveGuestSession,
  useStoredSession,
} from "@/lib/guest/use-stored-session";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MenuData = {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  ownsThisEvent: boolean;
  /** seedFor(user.id), from /api/me/menu — null in phase 1 (see below). */
  seed: string | null;
};

// The guest event-page header. Auth-aware: a LOGGED-OUT visitor sees the quiet "Start for free"
// CTA (the host paid for this — it's their event, not a loud Partyreel page); a LOGGED-IN visitor
// sees their account menu instead, so they feel signed in and can jump back into the app.
//
// ★ IT RUNS WITHOUT AN EVENT TOO, and /u/[slug] is why (Will, `head=guest`,
// 2026-09-19: "Is this the best complete solution? Seems like it'd be very easy to get far away
// from the original event you scanned if you start clicking guests... I think this is the best
// option across these three, but maybe not the best overall solution for our nav in general
// here"). A public profile is a guest-side page with no event behind it, and it used to wear a
// hand-rolled header of its own that dropped a signed-in visitor's account menu the moment they
// tapped a name. With both props omitted this is the same header minus the two things that need
// an event: the ownership check (/api/me/menu already treats the param as optional) and the
// stored-session clear on sign-out (there is no guest capability on this page to clear). His
// worry about the way BACK to the scanned event is round two's, on the profile-reach board.
//
// WHY a client island (not a server getUser() in the page RSC): the page is hit by anonymous
// event crowds, often behind ONE venue-NAT IP with auth rate limits, so the page deliberately
// avoids a server auth round-trip on the common path (see its upload-path getUser()). We
// mirror SaveEventButton: getSession() is LOCAL (no network) and the header is a pure UI
// affordance (no data is gated by it; real authz stays in RLS + the route's getUser()). The
// richer profile + ownership data is fetched from /api/me/menu ONLY when a session exists, so
// anonymous loads never touch it. Default render = the CTA (matches SSR → no flash for the
// anonymous majority); a logged-in visitor sees a one-frame CTA→avatar swap, the same tradeoff
// SaveEventButton already accepts for its signed-in flip.
export function GuestHeader({
  qrToken,
  eventId,
  isDemo = false,
}: {
  /** The event's canonical token, omitted on an event-less page (/u/[slug]). */
  qrToken?: string;
  /** The event being viewed, omitted on an event-less page (/u/[slug]). */
  eventId?: string;
  /** The demo event (Will, `framing=tag`, the sixth batch, 2026-09-20): a
   *  Demo mark beside the wordmark, and the header pins to the top so the
   *  mark stays on screen through the whole visit. Never true on `/u/[slug]`
   *  (no event there to be a demo of). */
  isDemo?: boolean;
}) {
  // null = signed out (or not yet resolved) → render the CTA. Non-null → render the account menu.
  const [menu, setMenu] = useState<MenuData | null>(null);
  const router = useRouter();
  // ★ THE THIRD STATE (the identity reshape, 2026-09-21): a name-only guest.
  // Read through the store's own hook rather than a prop, because the NAME is
  // written by the entry modal inside the SIBLING island next door and this one
  // has to notice (the same module-singleton subscription the guest session uses
  // for the same reason). Empty on `/u/[slug]`, which has no event to be named at.
  const [guestName] = useStoredName(qrToken ?? "");
  /* The two facts the name menu needs beyond the name, read from the same
     module singleton for the same reason: the door that writes them lives in
     the SIBLING island next door. The flag says whether this device put an
     unconfirmed address on this event's row (never which one — nothing stores
     that); the token is the capability the add-email dialog attaches to. */
  const emailAttached = useStoredEmailAttached(qrToken ?? "");
  const [guestSession] = useStoredSession(qrToken ?? "");

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active || !session) return;
      // Phase 1: show the menu immediately with the email from the JWT (avatar = initials),
      // so the menu appears as soon as the local session is known — no wait on the network.
      // seed stays null here (not avatarUrl either): seedFor is a server-side SHA-256
      // (src/lib/avatar/seed.ts, node:crypto has no browser build), so the colour can only
      // arrive with phase 2 — exactly the same beat the photo already waits for.
      setMenu({
        email: session.user.email ?? null,
        displayName: null,
        avatarUrl: null,
        ownsThisEvent: false,
        seed: null,
      });
      // Phase 2: enrich with display name + presigned avatar + ownership (logged-in only).
      try {
        const res = await fetch(
          eventId
            ? `/api/me/menu?event=${encodeURIComponent(eventId)}`
            : "/api/me/menu",
        );
        if (!active) return;
        if (!res.ok) {
          // 401 = a raced/expired cookie despite a local session → fall back to the CTA.
          setMenu(null);
          return;
        }
        const body = (await res.json()) as {
          ok: boolean;
          email?: string | null;
          displayName?: string | null;
          avatarUrl?: string | null;
          seed?: string | null;
          ownsThisEvent?: boolean;
        };
        if (!active || !body.ok) return;
        setMenu({
          email: body.email ?? session.user.email ?? null,
          displayName: body.displayName ?? null,
          avatarUrl: body.avatarUrl ?? null,
          seed: body.seed ?? null,
          ownsThisEvent: Boolean(body.ownsThisEvent),
        });
      } catch {
        // Keep the phase-1 menu (email + initials) on a network blip — better than dropping to CTA.
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  // Client-side sign out = the replacement for the old "Switch guest" button. Clear the guest
  // capability session FIRST (sync, even on a flaky network — notifies EventExperience so the next
  // guest on a shared device doesn't upload under this one's session_token, and expires the
  // server-readable cookie half beside it), collapse the menu back
  // to the CTA (router.refresh() re-runs only the SERVER tree, not this island's state), sign out
  // (shared-device bleed), then refresh so an account-required event re-gates to <EnterEventPrompt>.
  const handleSignOut = useCallback(async () => {
    // No token on an event-less page: there is no guest upload capability to
    // clear, so the sign-out is the account's alone. BOTH copies go where there is one: the
    // cookie half is what a server render reads, so leaving it behind would hand the next person
    // on a shared phone this guest's full-album ticket (see leaveGuestSession).
    if (qrToken) leaveGuestSession(qrToken);
    setMenu(null);
    await createClient().auth.signOut();
    router.refresh();
  }, [qrToken, router]);

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3",
        // `framing=tag`: pinned to the top so the Demo mark stays on every
        // screen of the visit, not just the first one; a real event's header
        // keeps its ordinary place in the flow (round two on the chrome is
        // guest-shape's, not this lane's).
        isDemo && "sticky top-0 z-20 bg-background",
      )}
    >
      <Link href="/" aria-label="Partyreel home" className="flex items-center gap-2.5">
        <Logo />
        {isDemo && (
          <span
            data-de-mark
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-label font-medium text-muted-foreground uppercase"
          >
            Demo
          </span>
        )}
      </Link>
      {/* Fixed-height slot so the CTA↔avatar swap stays height-stable (Button sm = h-7, Avatar =
          size-8); both center within h-8, and justify-between pins the right edge so nothing reflows. */}
      <div className="flex h-8 items-center">
        {menu ? (
          <GuestAccountMenu
            email={menu.email}
            displayName={menu.displayName}
            avatarUrl={menu.avatarUrl}
            seed={menu.seed}
            // Both false and "" on an event-less page, and the menu reads the
            // id only behind the ownership flag, so the "Manage event" row is
            // absent rather than pointed at nothing.
            ownsThisEvent={menu.ownsThisEvent}
            eventId={eventId ?? ""}
            onSignOut={handleSignOut}
          />
        ) : qrToken && guestName ? (
          // Somebody, but not an account: the name they typed, marked, with the
          // three moves it opens. An ACCOUNT always wins this slot above,
          // because a signed-in visitor's menu is the truer answer to "who am
          // I here" and their credit is not marked at all.
          <GuestNameMenu
            name={guestName}
            qrToken={qrToken}
            sessionToken={guestSession}
            emailAttached={emailAttached}
            onRenamed={() => router.refresh()}
          />
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Start for free</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
