import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminHost } from "@/lib/auth/admin-host";
import { doorFailureKind } from "@/lib/auth/door-failure";
import { marketingImage, type MarketingImage } from "@/lib/constants/marketing-media";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Log in" };

/**
 * THE PRODUCT BESIDE THE DOOR (Will, 2026-09-20, `app-door` r1 `page=beside`).
 *
 * This is the one screen where a host decides whether Partyreel is worth an
 * account, and until now it argued with a sentence over empty paper: a 384px
 * card, and two thirds of a laptop saying nothing. The photographs are the
 * argument, and they cost one column.
 *
 * ★ THE FRAMES ARE THE MARKETING MANIFEST'S, NEVER FILES. `MARKETING_IMAGES` is
 * the one source for curated media (marketing-media.ts): nothing under
 * `public/marketing/` may be referenced except through an entry, because Will's
 * final set lands as a pure swap of files and entries. These nine ids are
 * bootstrap stand-ins and will be replaced by that swap with no change here.
 */
const WALL_IDS = [
  "wedding-golden",
  "party-balloons",
  "wedding-rings",
  "festival-lights",
  "reception-table",
  "wedding-toast",
  "party-dj",
  "wedding-arch",
  "festival-crowd",
] as const;

const WALL: readonly MarketingImage[] = WALL_IDS.map(marketingImage);

/**
 * The wall, in two postures. At a laptop it is a column of frames beside the
 * door; in a hand a phone has no second half, so it becomes a band ABOVE the
 * door: enough to say what is behind it, never enough to push the field down.
 *
 * `priority` on the first two only: the door's field is the LCP candidate on a
 * phone and the whole wall would fight it for bandwidth.
 */
function PhotoWall({
  posture,
  className,
}: {
  posture: "band" | "column";
  className?: string;
}) {
  if (posture === "band")
    return (
      <div
        aria-hidden
        className={cn("grid h-30 shrink-0 grid-cols-4 gap-1 p-1", className)}
      >
        {WALL.slice(0, 4).map((frame, i) => (
          <div
            key={frame.id}
            className="relative overflow-hidden rounded-tile bg-muted"
          >
            <Image
              src={frame.src}
              alt=""
              fill
              sizes="25vw"
              priority={i < 2}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );

  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden bg-muted/30", className)}
    >
      {/* Three INDEPENDENT columns on the gallery's own gap and tile corner, so
          the wall beside the door reads as an album rather than a mood board.
          Not `columns-3`: CSS multi-column BALANCES its columns, which left the
          last one ending in bare paper halfway down a 900px laptop. Round-robin
          down fixed columns, with the deck rolled twice, means every column
          runs past the bottom and the box's own overflow does the cropping. */}
      <div className="absolute inset-0 flex gap-2 p-2">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex flex-1 flex-col gap-2">
            {[...WALL, ...WALL]
              .filter((_, i) => i % 3 === col)
              .map((frame, i) => (
                <div
                  key={`${frame.id}-${i}`}
                  className="shrink-0 overflow-hidden rounded-tile bg-muted"
                  style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
                >
                  <Image
                    src={frame.src}
                    alt=""
                    width={frame.width}
                    height={frame.height}
                    sizes="(min-width: 1024px) 17vw, 0px"
                    className="size-full object-cover"
                  />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Server shell around the client <LoginForm/>. WHY this lives in (auth) and NOT
// (app): the (app) layout gates on getUser() and redirects anonymous visitors to
// /login — if /login sat under that gate it would redirect to itself forever.
// Keep all unauthenticated entry points (login, callback) out of (app).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; intent?: string }>;
}) {
  // Already signed in? Skip the form and go into the app — so a logged-in visitor
  // clicking "Log in" from marketing isn't forced through sign-in again (their
  // session is still valid; it just wasn't being checked here). getUser() (never
  // getSession) re-validates the JWT. Host-aware target mirrors the auth callback:
  // admin subdomain → /admin, everything else → /dashboard. This is the ONLY thing
  // that redirects authenticated users away from /login; an anonymous visitor falls
  // straight through to the form below, so there's no loop (and /login stays in
  // (auth), outside the (app) gate, on purpose).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const host = (await headers()).get("host");
    redirect(isAdminHost(host) ? "/admin" : "/dashboard");
  }

  // Next 16: searchParams is a Promise. The callback route bounces a failed
  // exchange back here with a FAILURE KIND (`?error=expired_link`); the legacy
  // `auth_callback` spelling still arrives from links already in mailboxes and
  // resolves to the same kind. `?intent=create` is the marketing "Start free"
  // door, and it is what lets the door say "you already had an account".
  const { error, intent } = await searchParams;

  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2">
      <PhotoWall posture="band" className="lg:hidden" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Link href="/" aria-label="Partyreel home">
              <Logo />
            </Link>
          </div>
          <Card>
            <CardContent>
              <LoginForm
                intent={intent === "create" ? "create" : "signin"}
                failure={doorFailureKind(error)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <PhotoWall posture="column" className="hidden lg:block" />
    </div>
  );
}
