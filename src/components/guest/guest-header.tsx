"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";

import {
  LIKE_WORDS,
  likeHref,
} from "@/components/app/create-event-wizard/like";
import { GuestAccountMenu } from "@/components/guest/guest-account-menu";
import { useCoverUnderHeader } from "@/components/guest/guest-header-cover";
import { GuestNameMenu } from "@/components/guest/guest-name-menu";
import { ChromeLink } from "@/components/marketing/chrome/chrome-link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  useStoredEmailAttached,
  useStoredName,
} from "@/lib/guest/use-stored-name";
import {
  leaveAllGuestSessions,
  useStoredSession,
} from "@/lib/guest/use-stored-session";
import { trackAttrs } from "@/lib/analytics/events";
import { fnv1a } from "@/lib/avatar/gradient";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MenuData = {
  /** Whose menu this is: the account the device held when it was drawn. */
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** Her claimed handle, from /api/me/menu: Your profile's page (`/me` while it is null or not yet asked). */
  slug: string | null;
  ownsThisEvent: boolean;
  /** seedFor(user.id), from /api/me/menu — null in phase 1 (see below). */
  seed: string | null;
};

/**
 * ★ HER COLOUR, REMEMBERED PER TICKET (red-team 53's NIT: "her header's disc flashes uncoloured on every load"). The
 * server's answer is a pure function of her own guest row, so for one ticket it never changes; asked afresh on every
 * load it arrived after the first paint (0.6 to 1.2 s on a phone) and the disc stood plain until it did. So the answer
 * is kept in this browser's own storage, one entry an album, and a later load paints it at once.
 *
 * It is BOUND TO THE TICKET IT WAS ASKED FOR by a hash of it, and never holds the ticket: the ticket is a capability
 * (`use-stored-session.ts`) and a sign-out puts it down, while a colour is public by construction (painted on every
 * album she ever added to, `avatar/gradient.ts`). A phone handed to the next guest, with a new ticket, finds no entry
 * of its own, so it never wears the last guest's colour; a ticket put down leaves a colour nobody can reach.
 * `pr_guest_seed_` is no ticket's prefix (`pr_session_`), so a scan for tickets can never pick it up.
 */
const SEED_PREFIX = "pr_guest_seed_";

/** What the entry is bound to: a hash of the ticket, which says nothing a reader of the storage could use. */
const ticketMark = (ticket: string) => fnv1a(ticket).toString(36);

function readSeed(qrToken: string | undefined, ticket: string | null) {
  if (!qrToken || !ticket) return null;
  try {
    const raw = localStorage.getItem(`${SEED_PREFIX}${qrToken}`);
    const at = raw ? raw.indexOf(".") : -1;
    if (!raw || at < 1 || raw.length === at + 1 || raw.length > 160)
      return null;
    return raw.slice(0, at) === ticketMark(ticket) ? raw.slice(at + 1) : null;
  } catch {
    return null;
  }
}

function keepSeed(qrToken: string, ticket: string, seed: string | null) {
  try {
    if (seed) {
      localStorage.setItem(
        `${SEED_PREFIX}${qrToken}`,
        `${ticketMark(ticket)}.${seed}`,
      );
    } else {
      // The server says this ticket names no row: whatever was kept for it was never hers.
      localStorage.removeItem(`${SEED_PREFIX}${qrToken}`);
    }
  } catch {
    // Storage unavailable: the colour is asked for again on the next load, as it was before it was kept.
  }
}

/** Nothing outside this component writes the entry, so there is nothing to subscribe to. */
const never = () => () => {};

/**
 * How long a first load's disc waits for its colour before it shows plain (a courtesy never gates anything: where the
 * ask is slow or never answers, she wears the plain disc she always wore).
 */
const SEED_WAIT_MS = 2000;

/**
 * ★ THE FIRST LOAD FADES IN, NEVER FLASHES. Until her colour is known the disc is not drawn (its place is held, so
 * nothing moves), and it comes in once, already coloured (or plain, where none will come), over a short fade. The
 * rules live on the slot because the disc is the name menu's own; `data-disc` is set only while that menu is the slot's.
 */
const DISC_FADE = cn(
  "data-[disc=waiting]:**:data-[slot=avatar]:opacity-0",
  "data-[disc]:**:data-[slot=avatar]:transition-opacity data-[disc]:**:data-[slot=avatar]:duration-300 data-[disc]:**:data-[slot=avatar]:ease-emphasis",
  "motion-reduce:data-[disc]:**:data-[slot=avatar]:transition-none",
);

// The guest event-page header. Auth-aware: a LOGGED-OUT visitor sees the quiet corner (the host paid for this — it's
// their event, not a loud Partyreel page); a LOGGED-IN visitor sees their account menu instead, so they feel signed in
// and can jump back into the app.
//
// ★ ON AN ALBUM, THE CORNER IS MAKE ONE LIKE THIS (after-party r1's `bridge=end`, Will 2026-10-07: "I love how easy
// this makes it for guests to go straight into becoming a host rather than dropping them off in marketing"): the same
// quiet ghost, the same size and place, its words speaking of the album she is in, never of our price, leading through
// the like door (`create-event-wizard/like.ts`: sign-up first where she has no account) into Create already in this
// album's style. Her name menu and her account menu carry the same row, so a guest who joined meets it too. Only
// where an event's token is in hand: an event-less page (/u/[slug]) keeps Start for free, to the home page.
//
// ★ IT RUNS WITHOUT AN EVENT TOO, and /u/[slug] is why. A public profile is a guest-side page with
// no event behind it, and a hand-rolled header of its own would drop a signed-in visitor's account
// menu the moment they tapped a name. With both props omitted this is the same header minus the
// things that need an event: the ownership check (/api/me/menu already treats the param as
// optional) and the name menu. The sign-out still puts down every guest ticket on the device, since
// it was never about the page it happens on.
//
// WHY a client island (not a server getUser() in the page RSC): the page is hit by anonymous
// event crowds, often behind ONE venue-NAT IP with auth rate limits, so the page deliberately
// avoids a server auth round-trip on the common path (see its upload-path getUser()).
// getSession() is LOCAL (no network) and the header is a pure UI affordance (no data is gated
// by it; real authz stays in RLS + the route's getUser()). The richer profile + ownership data
// is fetched from /api/me/menu ONLY when a session exists, so anonymous loads never touch it.
// Default render = the CTA (matches SSR → no flash for the anonymous majority); a logged-in
// visitor sees a one-frame CTA→avatar swap, the tradeoff every client-resolved session on the
// guest page accepts.
//
// ★ IT FOLLOWS WHO THE DEVICE HOLDS (crumbs-35, build 34's red-team). This island read the session
// once, on mount, and a page's `router.refresh()` never re-runs a client island, so an account whose
// session ended in another tab kept its avatar through the door that then asked her name, and an
// account that signed in under the header (the confirm door's code, in this very tab) never replaced
// the name beside it, both until a reload. So it looks again whenever something that can change who is
// here happens: the SDK announces a sign-in or sign-out, the session cookie changes (the Cookie Store
// API reaches a tab nobody is looking at, which is where a response that cleared the cookie in another
// tab is otherwise unheard), the tab is looked at again, and the door settles on a guest (a name or
// ticket written while an account still stands). A look is LOCAL (the client's own read of the cookie)
// and asks the server only when the account differs from the one drawn, or when the door settled on a
// guest, since a session revoked on another device leaves this cookie valid for up to an hour and
// only the server's 401 knows. A server that stumbles (anything but a 401) never un-signs her.
//
// ★ OVER THE ALBUM'S COVER IT STANDS ON THE PHOTOGRAPH (`event-header` r1's carried call `header`):
// white, with no rule, so the album's own picture reaches the top edge; elsewhere it is today's paper
// bar. `over` is the page's word (a cover is drawn under it), and the album moves it after
// (`guest-header-cover.ts`: the door's stage arriving, the demo's pinned bar once the page moves). It is
// a fixed `h-14`, the height the cover reaches up under (`event-experience.tsx`).
export function GuestHeader({
  qrToken,
  eventId,
  isDemo = false,
  over = false,
}: {
  /** The event's canonical token, omitted on an event-less page (/u/[slug]). */
  qrToken?: string;
  /** The event being viewed, omitted on an event-less page (/u/[slug]). */
  eventId?: string;
  /** The demo event: a Demo mark beside the wordmark, and the header pins to
   *  the top so the mark stays on screen through the whole visit. Never true
   *  on `/u/[slug]` (no event there to be a demo of). */
  isDemo?: boolean;
  /** The album's cover is drawn under the header (the page's word for the first paint). */
  over?: boolean;
}) {
  const onCover = useCoverUnderHeader(over);
  // null = signed out (or not yet resolved) → render the CTA. Non-null → render the account menu.
  const [menu, setMenu] = useState<MenuData | null>(null);
  // What is drawn, as the looks below read it the moment they land (state is a render behind them).
  const shown = useRef<MenuData | null>(null);
  const show = useCallback((next: MenuData | null) => {
    shown.current = next;
    setMenu(next);
  }, []);
  // The newest look wins: a look that lands after a newer one began is let go of, and so is every look
  // still in the air when the header leaves the page or signs out.
  const looks = useRef(0);
  const alive = useRef(false);
  const leaving = useRef(false);
  const router = useRouter();
  // ★ THE THIRD STATE: a name-only guest.
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

  /* ★ HER OWN COLOUR (small-fixes, "the name-only guest's hashvatar"): the disc beside a name-only guest's own name
     wears the colour every other surface gives her, the hash of her own guest ROW. The browser holds her ticket and
     never the row's id, and a hash cannot be made here (`node:crypto`, `seed.ts`), so the server answers it
     (`/api/guests/mine`'s `seed` ask), once a ticket, and the answer is kept for the next load (`readSeed`). A
     courtesy, never a gate: where it never lands she wears the plain disc she wore. Kept by ticket, so a phone handed
     to the next guest never wears the last one's colour.
     `seeds` is what this page asked: a colour, or null where the server had none for the ticket. */
  const [seeds, setSeeds] = useState<Record<string, string | null>>({});
  const remembered = useSyncExternalStore(
    never,
    () => readSeed(qrToken, guestSession),
    () => null,
  );
  const asked = useRef(new Set<string>());
  useEffect(() => {
    if (!qrToken || !guestName || !guestSession) return;
    // A colour already kept for this ticket needs no ask.
    if (remembered || asked.current.has(guestSession)) return;
    asked.current.add(guestSession);
    void (async () => {
      let seed: string | null = null;
      try {
        const res = await fetch("/api/guests/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qr_token: qrToken,
            session_token: guestSession,
            seed: true,
          }),
        });
        const body = (await res.json()) as { ok?: boolean; seed?: unknown };
        if (res.ok && body.ok && typeof body.seed === "string") {
          seed = body.seed;
        }
        // The server answered (a colour, or none: a ticket that names no row): what it said is kept.
        if (res.ok && body.ok) keepSeed(qrToken, guestSession, seed);
      } catch {
        // The plain disc stays; asked again the next time the page opens.
        asked.current.delete(guestSession);
      }
      setSeeds((known) => ({ ...known, [guestSession]: seed }));
    })();
  }, [qrToken, guestName, guestSession, remembered]);
  const known = guestSession ? seeds[guestSession] : undefined;
  // What this page was told wins over what was kept (a ticket the server now says names no row has no colour).
  const ownSeed = (known === undefined ? remembered : known) ?? null;
  // A first load's disc waits for the colour, up to a deadline: see `DISC_FADE`.
  const [waitedOut, setWaitedOut] = useState<string | null>(null);
  const waiting = Boolean(
    guestName &&
    guestSession &&
    known === undefined &&
    !remembered &&
    waitedOut !== guestSession,
  );
  useEffect(() => {
    if (!waiting || !guestSession) return;
    const timer = window.setTimeout(
      () => setWaitedOut(guestSession),
      SEED_WAIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [waiting, guestSession]);

  /**
   * LOOK AT WHO THE DEVICE HOLDS and make the slot say so. `verify` asks the server even about the
   * account already drawn (the door settled on a guest while one stands); without it a look at the
   * account already drawn is free.
   *
   * Phase 1 draws the menu at once from the local session (email from the JWT, initials), so it appears
   * as soon as the session is known, with no wait on the network. seed stays null (not avatarUrl
   * either): seedFor is a server-side SHA-256 (src/lib/avatar/seed.ts, node:crypto has no browser
   * build), so the colour can only arrive with phase 2, exactly the same beat the photo already waits
   * for. Phase 2 enriches with display name + presigned avatar + ownership (logged-in only).
   */
  const look = useEffectEvent(async (verify: boolean) => {
    if (leaving.current) return;
    const mine = ++looks.current;
    const {
      data: { session },
    } = await createClient().auth.getSession();
    if (!alive.current || mine !== looks.current) return;
    if (!session) {
      show(null);
      return;
    }
    const user = session.user;
    if (shown.current?.userId === user.id) {
      if (!verify) return;
    } else {
      show({
        userId: user.id,
        email: user.email ?? null,
        displayName: null,
        avatarUrl: null,
        slug: null,
        ownsThisEvent: false,
        seed: null,
      });
    }
    try {
      const res = await fetch(
        eventId
          ? `/api/me/menu?event=${encodeURIComponent(eventId)}`
          : "/api/me/menu",
      );
      if (!alive.current || mine !== looks.current) return;
      // 401 = the server does not know her (a raced/expired cookie despite a local session, or a session
      // ended elsewhere) → fall back to the CTA or her name. Anything else is the server stumbling, which
      // says nothing about who she is: keep what is drawn.
      if (res.status === 401) {
        show(null);
        return;
      }
      if (!res.ok) return;
      const body = (await res.json()) as {
        ok: boolean;
        email?: string | null;
        displayName?: string | null;
        avatarUrl?: string | null;
        slug?: string | null;
        seed?: string | null;
        ownsThisEvent?: boolean;
      };
      if (!alive.current || mine !== looks.current || !body.ok) return;
      show({
        userId: user.id,
        email: body.email ?? user.email ?? null,
        displayName: body.displayName ?? null,
        avatarUrl: body.avatarUrl ?? null,
        slug: body.slug ?? null,
        seed: body.seed ?? null,
        ownsThisEvent: Boolean(body.ownsThisEvent),
      });
    } catch {
      // Keep the phase-1 menu (email + initials) on a network blip — better than dropping to CTA.
    }
  });

  useEffect(() => {
    alive.current = true;
    // The first look, at mount: draw whoever is here (its setState lands after the read, in a callback).
    void (async () => {
      await look(true);
    })();
    // The SDK's own word: a sign-out in another tab through the client, a sign-in in this one. A
    // standing session is re-announced on every refocus, which the same-account look makes free. INITIAL_SESSION
    // and TOKEN_REFRESHED change nobody. Not awaited: a callback is run inside the client's own lock.
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        looks.current += 1;
        show(null);
      } else if (event === "SIGNED_IN") {
        void look(false);
      } else if (event === "USER_UPDATED") {
        void look(true);
      }
    });
    const lookedAt = () => {
      if (document.visibilityState === "visible") void look(false);
    };
    const cookieChanged = () => void look(false);
    document.addEventListener("visibilitychange", lookedAt);
    window.addEventListener("focus", lookedAt);
    window.addEventListener("pageshow", lookedAt);
    // Where the browser has the Cookie Store API (Chromium): any change to a cookie on this origin, from any
    // tab or any response, reaching a tab that is not being looked at too.
    const cookies = (window as Window & { cookieStore?: EventTarget })
      .cookieStore;
    cookies?.addEventListener("change", cookieChanged);
    return () => {
      alive.current = false;
      looks.current += 1;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", lookedAt);
      window.removeEventListener("focus", lookedAt);
      window.removeEventListener("pageshow", lookedAt);
      cookies?.removeEventListener("change", cookieChanged);
    };
  }, [eventId, show]);

  // ★ THE DOOR SETTLING ON A GUEST. The door writes the name (and the ticket) it settled on into the
  // stores this island reads, and a page's refresh never reaches the island itself, so a write while an
  // account stands is the one signal that the server may have said somebody else is here: ask it. The
  // dependencies are the trigger, not inputs the look reads.
  useEffect(() => {
    if (shown.current) void look(true);
  }, [guestName, guestSession]);

  // Client-side sign out, which is also how a shared device switches guests. Put every guest
  // ticket on the device down FIRST (sync, even on a flaky network — notifies EventExperience so the
  // next person on a shared device doesn't upload under this one's session_token, and expires the
  // server-readable cookie half beside it), collapse the menu back
  // to the CTA (router.refresh() re-runs only the SERVER tree, not this island's state), sign out
  // (shared-device bleed), then refresh so an account-required event re-gates to the door's `identify` step.
  const handleSignOut = useCallback(async () => {
    // ★ EVERY EVENT'S TICKET, NOT THIS ALBUM'S. A confirmed guest's ticket at another album would
    // outlive a sign-out that put down only this one, and credit the next person's photograph to
    // them there; the upload routes refuse that (the guarantee), and this is the courtesy: the
    // tokens, the names and address flags beside them, the name prefill, and every `pr_guest_*`
    // cookie. So it runs on an event-less page (/u/[slug]) too.
    leaving.current = true;
    looks.current += 1;
    leaveAllGuestSessions();
    show(null);
    // ★ THIS DEVICE ONLY: a phone handed to the next guest ends the session it holds, and the
    // account's own phone and laptop stay signed in (auth-accounts.md, "Signing out").
    try {
      await createClient().auth.signOut({ scope: "local" });
    } finally {
      leaving.current = false;
    }
    router.refresh();
  }, [router, show]);

  return (
    <header
      data-guest-header=""
      data-surface={onCover ? "photo" : undefined}
      className={cn(
        "relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-5",
        "transition-[background-color,border-color,color] duration-300 ease-emphasis motion-reduce:transition-none",
        // On the cover: the room's ink over the photograph, and no rule across it.
        // Off it, the page's own paper, opaque: the cover reaches up under the
        // header, so a door's stage standing over the album (its paper door
        // below a paper bar) must not show the cover's top strip through it.
        onCover
          ? "dark border-transparent text-foreground"
          : "border-border/60 bg-background",
        // The demo's header is pinned to the top so the Demo mark stays on every
        // screen of the visit, not just the first one; a real event's header
        // keeps its ordinary place in the flow.
        isDemo && "sticky top-0",
      )}
    >
      {/* ★ The way home is fetched by a real album's visitor never, and by the demo's on INTENT, never on sight
          (compute-levers, compute-reads): the demo's visitor is a prospective host, so a pointer or a finger on the
          wordmark gets the home's payload before the press, but the logo is in view from the first paint, and a
          prefetch on sight fetched the home and preloaded its three sheets into a page that draws none of them
          (`chrome-link.tsx` says why; on a real album it was three requests a join). */}
      <ChromeLink
        href="/"
        prefetch={isDemo ? undefined : false}
        prefetchOnIntent={isDemo}
        aria-label="Partyreel home"
        className="flex items-center gap-2.5"
      >
        <Logo />
        {isDemo && (
          <span
            data-de-mark
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-label font-medium text-muted-foreground uppercase"
          >
            Demo
          </span>
        )}
      </ChromeLink>
      {/* Fixed-height slot so the CTA↔avatar swap stays height-stable (Button sm = h-7, Avatar =
          size-8); both center within h-8, and justify-between pins the right edge so nothing reflows. */}
      <div
        className={cn("flex h-8 items-center", DISC_FADE)}
        data-disc={
          !menu && qrToken && guestName
            ? ownSeed
              ? "colour"
              : waiting
                ? "waiting"
                : "plain"
            : undefined
        }
      >
        {menu ? (
          <GuestAccountMenu
            email={menu.email}
            displayName={menu.displayName}
            avatarUrl={menu.avatarUrl}
            slug={menu.slug}
            seed={menu.seed}
            // Both false and "" on an event-less page, and the menu reads the
            // id only behind the ownership flag, so the "Manage event" row is
            // absent rather than pointed at nothing.
            ownsThisEvent={menu.ownsThisEvent}
            eventId={eventId ?? ""}
            onSignOut={handleSignOut}
            likeHref={qrToken ? likeHref(qrToken) : null}
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
            seed={ownSeed}
            emailAttached={emailAttached}
            onRenamed={() => router.refresh()}
            likeHref={likeHref(qrToken)}
          />
        ) : qrToken ? (
          // A plain link, never a prefetch: the door is a route of its own, asked only on the press.
          <Button asChild variant="ghost" size="sm">
            <a
              href={likeHref(qrToken)}
              data-guest-like=""
              {...trackAttrs("cta_click", {
                cta: "make-one-like-this",
                location: "guest-header",
              })}
            >
              {LIKE_WORDS}
            </a>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <ChromeLink
              href="/"
              prefetch={isDemo ? undefined : false}
              prefetchOnIntent={isDemo}
            >
              Start for free
            </ChromeLink>
          </Button>
        )}
      </div>
    </header>
  );
}
