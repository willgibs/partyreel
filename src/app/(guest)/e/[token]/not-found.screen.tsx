import type { ReactNode } from "react";
import Link from "next/link";

import {
  DOOR_FOOT,
  DOOR_MAIN,
  DoorColumn,
  DoorWords,
} from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { GuestBar } from "@/components/guest/guest-bar";
import { HelpLine } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { DEMO_EVENT_URL } from "@/lib/demo";

/**
 * THE GUEST LINK'S 404 SCREEN, reached through `app/not-found.lazy.tsx` (crumbs-25; `not-found.tsx` says why: the
 * group's 404 rides every album load unless its screen loads behind one client boundary), and drawn directly by the
 * album page for a link that names nothing, on that one line (stale-link: the page draws its own 404 rather than
 * throw for Next's white error shell). The album already reaches every client part of it through the shut door, so
 * that import costs a found album nothing.
 *
 * ★ IT WEARS THE SHUT DOOR'S DESIGN, EMPTY (`locked-door` r2, Will's `lost=follows`): the same doorway with nothing
 * in it, no leaf and no light (there is no party behind a link that opens nothing), in its own words, so a link's two
 * dead ends stay siblings and are told apart by what they say: an empty frame is a wrong link, a shut door with
 * light under it is a door she cannot open. It leaves the not-found family every other dead end on the site shares.
 *
 * Real guests hit this from a mistyped or stale QR, so the copy reassures (double-check the link, ask the host)
 * and softly introduces Partyreel (the growth loop).
 * ★ It must never say an event "ended": there is no end date in this product, by design (the anti-abuse core in
 * constants/tiers.ts), so deletion, a typo, or a changed custom slug are the only three ways a link stops
 * resolving. The help article content/help/the-qr-wont-scan-or-the-link-wont-open.mdx quotes this sentence.
 * Renders in (guest)/layout.tsx (narrow mobile column); GuestHeader needs a real qrToken/eventId, which a 404
 * has none of, so the session-less GuestBar stands in: its own module, so the guest CRASH wears the same row.
 *
 * No "use client" of its own: it is client code where the boundary's `import()` reaches it, and a Server Component
 * where the page draws it, as `GuestBar` and the screen's parts are on every page that mounts them directly.
 * Imported from any other Server Component (a not-found, a layout) it would render into every album's payload
 * again, which `not-found.test.ts` refuses.
 */
export function GuestNotFoundScreen() {
  return (
    <>
      <GuestBar />
      <main className={DOOR_MAIN}>
        <DoorColumn doorway={<Doorway state="none" />}>
          <DoorWords
            eyebrow="Event link"
            title="This event link didn't work"
            titleAs="h1"
            lines={[
              "The link may be mistyped, or the host may have deleted the event. Double-check the QR code or link, or ask the host to resend it.",
            ]}
          />
          <LostFoot
            // A guest holding a link that will not open is the reader most likely to want a person, and the
            // help center's QR article is written for exactly this screen.
            help={<HelpLine href="/help">Visit the help center</HelpLine>}
          />
        </DoorColumn>
      </main>
    </>
  );
}

/**
 * The broken link's way on: Partyreel as its one primary (nothing behind the link is hers to reach), the quiet line
 * to a person under it, and the live demo for a reader curious what the link was meant to open.
 */
function LostFoot({ help }: { help: ReactNode }) {
  return (
    <div data-door-foot="" className={DOOR_FOOT}>
      <Button asChild size="cta" className="w-full">
        <Link href="/">What is Partyreel?</Link>
      </Button>
      {help}
      {DEMO_EVENT_URL ? (
        <Link
          href={DEMO_EVENT_URL}
          className="text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          See how it works with a live demo
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">
          Hosting your own? It is free to start. No app required.
        </span>
      )}
    </div>
  );
}
