"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GuestAccountMenu } from "@/components/guest/guest-account-menu";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { setStoredSession } from "@/lib/guest/use-stored-session";
import { createClient } from "@/lib/supabase/client";

type MenuData = {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  ownsThisEvent: boolean;
};

// The guest event-page header. Auth-aware: a LOGGED-OUT visitor sees the quiet "Start for free"
// CTA (the host paid for this — it's their event, not a loud Partyreel page); a LOGGED-IN visitor
// sees their account menu instead, so they feel signed in and can jump back into the app.
//
// WHY a client island (not a server getUser() in the page RSC): the page is hit by anonymous
// event crowds, often behind ONE venue-NAT IP with auth rate limits, so the page deliberately
// avoids a server auth round-trip on the common path (see its require_email-only getUser()). We
// mirror SaveEventButton: getSession() is LOCAL (no network) and the header is a pure UI
// affordance (no data is gated by it; real authz stays in RLS + the route's getUser()). The
// richer profile + ownership data is fetched from /api/me/menu ONLY when a session exists, so
// anonymous loads never touch it. Default render = the CTA (matches SSR → no flash for the
// anonymous majority); a logged-in visitor sees a one-frame CTA→avatar swap, the same tradeoff
// SaveEventButton already accepts for its signed-in flip.
export function GuestHeader({
  qrToken,
  eventId,
}: {
  qrToken: string;
  eventId: string;
}) {
  // null = signed out (or not yet resolved) → render the CTA. Non-null → render the account menu.
  const [menu, setMenu] = useState<MenuData | null>(null);
  const router = useRouter();

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
      setMenu({
        email: session.user.email ?? null,
        displayName: null,
        avatarUrl: null,
        ownsThisEvent: false,
      });
      // Phase 2: enrich with display name + presigned avatar + ownership (logged-in only).
      try {
        const res = await fetch(
          `/api/me/menu?event=${encodeURIComponent(eventId)}`,
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
          ownsThisEvent?: boolean;
        };
        if (!active || !body.ok) return;
        setMenu({
          email: body.email ?? session.user.email ?? null,
          displayName: body.displayName ?? null,
          avatarUrl: body.avatarUrl ?? null,
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
  // guest on a shared device doesn't upload under this one's session_token), collapse the menu back
  // to the CTA (router.refresh() re-runs only the SERVER tree, not this island's state), sign out
  // (shared-device bleed), then refresh so a require_email event re-gates to <VerifyEmailPrompt>.
  const handleSignOut = useCallback(async () => {
    setStoredSession(qrToken, null);
    setMenu(null);
    await createClient().auth.signOut();
    router.refresh();
  }, [qrToken, router]);

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <Link href="/" aria-label="Partyreel home">
        <Logo />
      </Link>
      {/* Fixed-height slot so the CTA↔avatar swap stays height-stable (Button sm = h-7, Avatar =
          size-8); both center within h-8, and justify-between pins the right edge so nothing reflows. */}
      <div className="flex h-8 items-center">
        {menu ? (
          <GuestAccountMenu
            email={menu.email}
            displayName={menu.displayName}
            avatarUrl={menu.avatarUrl}
            ownsThisEvent={menu.ownsThisEvent}
            eventId={eventId}
            onSignOut={handleSignOut}
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
