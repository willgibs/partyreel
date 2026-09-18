"use client";

// The home hero's own production sheet, so the band and the code below are the
// shipped composition and not a drawing of it; then this board's, which only
// ever ADDS the rest state back (see voice.css).
import "@/components/marketing/sections/home/cinema-hero.css";
import "./voice.css";

import {
  Camera,
  Check,
  CircleCheck,
  Download,
  ImageUp,
  Images,
  Lock,
  Minus,
  Play,
  CalendarPlus,
} from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { FeatureHeroEyebrow } from "@/components/marketing/sections/features/shared/feature-hero-eyebrow";
import {
  BUILT,
  FRAME_SIZES,
  frameAt,
  GEO,
  restPhase,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";
import { PageHero } from "@/components/marketing/system/page-hero";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Logo } from "@/components/shared/logo";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { featurePage } from "@/lib/constants/feature-pages";
import {
  friendlyCapacity,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { SITE_THESIS } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn, formatBytes, formatEventDate } from "@/lib/utils";

import { ALBUM, EVENT } from "./fixtures";

/**
 * THE REAL PLACES, EACH TAKING ITS CANDIDATE LINE THROUGH A PROP.
 *
 * ★ A LINE IS JUDGED WHERE IT IS READ, NEVER IN A LIST. Will killed the last
 * voice board for exactly the opposite ("starting with just a few spot example
 * statements may make a voice sound good in a silo, but not perform well in
 * actual usage. I'd rather shape it as we see the voice applied in real cases",
 * 2026-09-17), so every option on this board is the surface itself at its true
 * size with the candidate sentence set in it: the words wrap where they will
 * wrap, under the heading they will sit under, on the ground they will ship on.
 *
 * ★ WHAT IS PRODUCTION AND WHAT IS COPIED, said once here so the Handoff and
 * the reader agree. Two surfaces take their line through a PROP of a shipped
 * component and are otherwise untouched:
 *   - the feature hero is the real `PageHero` with the real `FeatureHeroEyebrow`
 *     and the registry's own subhead, wearing the candidate `heading`;
 *   - the guest album's gallery is the real `GuestMasonry`.
 * The other four have no prop for the line they carry, so the SECTION is copied
 * here and nothing under `src/components` is edited (the river board's
 * precedent): the entry sheet's two steps (`entry-modal.tsx`,
 * `enter-event-prompt.tsx`), the pricing pair (`plan-cards.tsx`), the host's
 * empty events screen (`events-empty-teaser.tsx`) and the guest album's empty
 * state (`gallery-empty-state.tsx`). Each copy is the shipped markup with the
 * one string lifted to a prop; where the shipped markup carries a breakpoint
 * prefix that a 375 stage would resolve against the BROWSER, the phone branch
 * is written out (the stage's documented lie, `stage.tsx`).
 *
 * ★ THE HOME HERO IS THE SHIPPED COMPOSITION STANDING STILL. `cinema-hero.tsx`
 * has no prop for its sentence and its band is one rAF loop, so the band is
 * built here from `hero-stream.ts`'s own tables at their REST phase, which is
 * precisely what a reduced-motion reader, a crawler and the server's first
 * paint already get. It wears the production sheet, so the corridor, the mask,
 * the perspective and the frame shadows are the page's and not a copy of them.
 */

/* ────────────────────────────  the guest's phone  ───────────────────────── */

/** The optimized guest-ghost pack, as `ghost-grid.tsx` and
 *  `gallery-empty-state.tsx` both mount it: small grayscale WebPs standing in
 *  for an album nobody has filled or unlocked yet. */
const GHOSTS = Array.from(
  { length: 9 },
  (_, i) => `/guest-ghost/g0${i + 1}.webp`,
);

/**
 * The entry sheet, on the page a guest lands on after scanning the code.
 *
 * The drawer, its overlay and the page behind it are `entry-shell.tsx`'s phone
 * branch; the two steps are `entry-modal.tsx`'s welcome and
 * `enter-event-prompt.tsx`'s account step. `line` is the one sentence each
 * step is being judged on.
 */
export function GuestSheet({
  step,
  line,
}: {
  step: "welcome" | "gate";
  line: string;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-background text-foreground">
      {/* The page behind the sheet: the guest header and the event's name,
          which is all a guest sees past the overlay on a phone. */}
      <div aria-hidden className="absolute inset-0">
        <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
          <Logo />
          <span className="text-xs text-muted-foreground">Start for free</span>
        </header>
        <div className="px-5 py-8">
          <p className="font-heading text-page text-balance">{EVENT.name}</p>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Hosted by {EVENT.host}
          </p>
          {/* ghost-grid.tsx: the shape of an album nobody is in yet, which is
              what stands behind the sheet until a guest has passed it. */}
          <div className="mt-7 grid grid-cols-2 gap-[var(--gap-gallery)] opacity-40">
            {GHOSTS.slice(0, 6).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset, as production mounts it
              <img
                key={src}
                src={src}
                alt=""
                className="aspect-[3/4] w-full rounded-tile object-cover grayscale"
              />
            ))}
          </div>
        </div>
      </div>
      {/* entry-shell.tsx's overlay, then its drawer. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-float bg-popover px-6 pt-3 pb-6 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10">
        <span
          aria-hidden
          className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30"
        />
        {step === "welcome" ? (
          <WelcomeStep line={line} />
        ) : (
          <GateStep line={line} />
        )}
      </div>
    </div>
  );
}

/** `entry-modal.tsx`'s WelcomeStep, with its first benefit row as a prop. */
function WelcomeStep({ line }: { line: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {EVENT.name}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>
            Hosted by{" "}
            <span className="font-medium text-foreground">{EVENT.host}</span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{formatEventDate(EVENT.date)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {/* ★ THE CANDIDATE. Everything around it is today's sheet. */}
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Camera className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          {line}
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Images className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          Everyone&rsquo;s shots land in one album. {EVENT.photos} are already
          inside.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <Button size="lg" className="w-full text-[15px]">
          Continue
        </Button>
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

/** `enter-event-prompt.tsx`'s account step, with its explanation as a prop. */
function GateStep({ line }: { line: string }) {
  return (
    <div className="text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        <Lock className="size-3" aria-hidden />
        Almost in
      </p>
      <p className="mt-1.5 font-heading text-page text-balance">
        {EVENT.photos} photos are waiting
      </p>
      {/* ★ THE CANDIDATE. */}
      <p className="mx-auto mt-2 mb-4 max-w-xs text-base leading-relaxed text-muted-foreground">
        {line}
      </p>
      <div className="mx-auto max-w-xs text-left">
        <EmailSignIn
          emailRedirectTo="/auth/callback"
          inputClassName="h-11 text-base"
          buttonClassName="h-11 text-[15px]"
          onVerified={() => {}}
        />
        <p className="mt-3 w-full text-center text-xs text-muted-foreground">
          Have a password? Log in
        </p>
      </div>
    </div>
  );
}

/**
 * The guest's album on a phone: `event-experience.tsx`'s column, with either
 * its empty state or the toast an upload leaves behind.
 *
 * The column is the page's own `max-w-2xl` with `px-5`, which at 375 is simply
 * the screen less its gutters.
 */
export function GuestAlbum({
  view,
  line,
}: {
  view: "empty" | "toast";
  line: string;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-background text-foreground">
      <div className="h-full overflow-hidden">
        <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
          <Logo />
          <span className="text-xs text-muted-foreground">Start for free</span>
        </header>
        <div className="px-5 py-8">
          <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
          <p className="mt-2.5 text-xs text-muted-foreground">
            <span className="text-faint">Hosted by</span>{" "}
            <span className="font-medium text-foreground">{EVENT.host}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {view === "empty"
              ? "No photos yet"
              : `${ALBUM.length} photos & videos from ${EVENT.guests} guests`}
          </p>

          <div className="mt-4">
            {view === "toast" && (
              <Button size="lg" className="w-full">
                <ImageUp /> Add photos
              </Button>
            )}
            <div
              className={cn(
                "grid grid-cols-2 gap-2",
                view === "toast" && "mt-2",
              )}
            >
              <Button variant="outline" size="sm" className="h-9 w-full">
                Save
              </Button>
              <Button variant="outline" size="sm" className="h-9 w-full">
                Invite
              </Button>
            </div>
          </div>

          <div className="mt-7">
            {view === "empty" ? (
              <GalleryEmpty line={line} />
            ) : (
              <>
                <div className="mb-3 flex justify-end">
                  <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground">
                    <Download className="size-4" /> Download all
                  </span>
                </div>
                <GuestMasonry items={ALBUM} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* The toast sonner draws at the foot of a phone, on the success ground
          globals.css gives `[data-sonner-toast][data-type="success"]`. Drawn
          rather than fired: a real toast dismisses itself after four seconds,
          and a preview a reviewer cannot look twice at is not a preview. */}
      {view === "toast" && (
        <div className="absolute inset-x-4 bottom-4">
          <div className="flex items-center gap-2 rounded-float border border-border bg-success px-4 py-3 text-sm text-success-foreground shadow-layer">
            <CircleCheck className="size-4 shrink-0" aria-hidden />
            <span>{line}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryEmpty({ line }: { line: string }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="grid grid-cols-3 gap-1.5 opacity-25 grayscale [content-visibility:auto]"
      >
        {GHOSTS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset, as production mounts it
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-tile object-cover"
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* ★ THE CANDIDATE. */}
        <p className="font-heading text-subsection text-balance">{line}</p>
        <Button size="lg">Be the first to add a photo</Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────  the site  ─────────────────────────────── */

/**
 * THE HOME HERO, STANDING STILL.
 *
 * Every number is `hero-stream.ts`'s, read at the `lg` geometry the 1440 stage
 * draws, and every class is `cinema-hero.css`'s, so this is the shipped
 * composition with its loop left out. `sub` is the sentence under the thesis;
 * the thesis itself is the site's one ruled line and is not what this asks.
 */
const FRAMES = BUILT.lg.cards.map((lg, i) => {
  const base = BUILT.base.cards[i];
  const lgBox = BUILT.lg.box[i];
  const baseBox = BUILT.base.box[i];
  const lgRest = frameAt(lg, restPhase(lg), "lg", lgBox.fit);
  const baseRest = frameAt(base, restPhase(base), "base", baseBox.fit);
  return {
    key: lg.key,
    image: marketingImage(STREAM_FRAMES[lg.photo % STREAM_FRAMES.length]),
    style: {
      "--hhs-w-base": `${baseBox.w}px`,
      "--hhs-h-base": `${baseBox.h}px`,
      "--hhs-w-lg": `${lgBox.w}px`,
      "--hhs-h-lg": `${lgBox.h}px`,
      "--hhs-rest-base": baseRest.transform,
      "--hhs-rest-o-base": baseRest.opacity,
      "--hhs-rest-lg": lgRest.transform,
      "--hhs-rest-o-lg": lgRest.opacity,
      "--hhs-z-base": baseRest.z,
      "--hhs-z-lg": lgRest.z,
    } as CSSProperties,
  };
});

const LAYOUT = {
  "--hhs-axis-pct-base": `${GEO.base.axisPct}%`,
  "--hhs-axis-pct-lg": `${GEO.lg.axisPct}%`,
  "--hhs-axis-min-base": `${BUILT.base.axisMin}px`,
  "--hhs-axis-min-lg": `${BUILT.lg.axisMin}px`,
  "--hhs-below-base": `${BUILT.base.below}px`,
  "--hhs-below-lg": `${BUILT.lg.below}px`,
  "--hhs-min-h-base": `${BUILT.base.minH}px`,
  "--hhs-min-h-lg": `${BUILT.lg.minH}px`,
  "--hhs-low-base": `${BUILT.base.low}px`,
  "--hhs-low-lg": `${BUILT.lg.low}px`,
  "--hhs-fade-base": GEO.base.fade,
  "--hhs-fade-lg": GEO.lg.fade,
  "--hhs-persp-base": `${GEO.base.perspective}px`,
  "--hhs-persp-lg": `${GEO.lg.perspective}px`,
  "--hhs-qr-base": `${GEO.base.qr}px`,
  "--hhs-qr-lg": `${GEO.lg.qr}px`,
  "--hhs-h1-max-base": `${GEO.base.h1Max}px`,
  "--hhs-h1-max-lg": `${GEO.lg.h1Max}px`,
  "--hhs-low-max-base": `${GEO.base.lowMax}px`,
  "--hhs-low-max-lg": `${GEO.lg.lowMax}px`,
} as CSSProperties;

export function HomeHero({ sub }: { sub: string }) {
  return (
    // The hero fills the stage and the header is painted OVER its first 64px,
    // which is what production's sticky header plus `-mt-[--mkt-header-h]`
    // amounts to: the hero's box is the whole viewport, so every percentage in
    // `--hhs-axis` resolves against the screen rather than against what is left
    // under a bar.
    <div className="relative h-full bg-background">
      <section
        style={LAYOUT}
        className="vce-hero hhs-hero absolute inset-0 overflow-clip bg-background"
      >
        <div
          aria-hidden
          className="hhs-band absolute inset-x-0 h-full"
          style={{ top: "calc(var(--hhs-axis) - 50%)" }}
        >
          <div className="hhs-corridor">
            {FRAMES.map((f) => (
              <div key={f.key} className="hhs-card" style={f.style}>
                <div className="relative size-full overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset">
                  <Image
                    src={f.image.src}
                    alt=""
                    fill
                    sizes={FRAME_SIZES}
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="hhs-qr absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ top: "var(--hhs-axis)" }}
        >
          <FooterQr
            value={DEMO_EVENT_URL ?? "https://partyreel.com"}
            size={GEO.lg.qr}
          />
        </div>

        <div
          className="absolute inset-x-0 z-20 px-8 text-center"
          style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
        >
          <h1
            className="mx-auto font-heading text-hero text-balance text-white"
            style={{ maxWidth: "var(--hhs-h1-max)" }}
          >
            {SITE_THESIS}
          </h1>
          {/* ★ THE CANDIDATE, at the hero's own measure. */}
          <p
            className="mx-auto mt-5 text-[15px] leading-relaxed text-pretty text-white/80"
            style={{ maxWidth: "var(--hhs-low-max)" }}
          >
            {sub}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="cta">{MARKETING_CTA.label}</Button>
            <Button
              size="cta"
              variant="outline"
              className="gap-2 border-white/35 bg-white/5 px-5 text-white"
            >
              <Play className="size-4 fill-current" />
              Watch a sample reel
            </Button>
          </div>
        </div>
      </section>

      {/* marketing-header.tsx, as a signed-out visitor meets it. The real one
          carries the mega panels; nothing here opens, so it is the bar only. */}
      <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-6 px-8">
        <Logo />
        <nav className="flex items-center gap-6 text-sm text-white/70">
          <span>Features</span>
          <span>Events</span>
          <span>Resources</span>
          <span>Pricing</span>
        </nav>
        <Button size="sm">{MARKETING_CTA.label}</Button>
      </header>
    </div>
  );
}

/**
 * /features/curation's hero: the REAL `PageHero`, the REAL eyebrow and the
 * registry's own subhead, wearing the candidate headline.
 */
export function FeatureHero({ h1 }: { h1: string }) {
  const page = featurePage("curation");
  return (
    // ★ SETTLED, NOT ARRIVING (see voice.css). The lockup's subhead and actions
    // ride the page's film cut, which paints them only once `Reveal` has seen
    // the section; the entrance is not what this question asks about, and a
    // slot that is invisible until something scrolls is a slot a reviewer
    // answers without. The wrapper hands the whole lockup its arrived state.
    <div className="vce-settled" data-vce-settled>
      <PageHero
        entrance="cut"
        eyebrow={<FeatureHeroEyebrow label={page.navLabel} />}
        heading={h1}
        subhead={page.heroSub}
        actions={
          <>
            <Button size="cta">{MARKETING_CTA.label}</Button>
            <Button size="cta" variant="outline">
              See the live album
            </Button>
          </>
        }
        className="overflow-hidden pt-20 pb-14"
      />
    </div>
  );
}

/**
 * /pricing's pair, copied from `plan-cards.tsx`: the paper sheet and the same
 * sheet in ink, at the default monthly size, with the Pro line as a prop.
 *
 * Both lines are drawn because the two are READ TOGETHER, so a candidate is
 * judged against the Free card's own sentence beside it. The card's entrance
 * (`Reveal`) is left off: a preview that has to be scrolled into view to become
 * visible is a preview that can be missed.
 */
export function PricingPair({ proLine }: { proLine: string }) {
  const free = planById("free");
  const pro = plansForTier("pro")[0];
  const freeCap = friendlyCapacity(free.storageBytes);
  const proCap = friendlyCapacity(pro.storageBytes);
  return (
    <div className="px-8 py-12">
      <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
        {/* Free: the paper sheet. */}
        <div className="group flex flex-col rounded-2xl border bg-card p-7 ring-1 ring-foreground/5">
          <PhotoStack />
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-subsection">{free.name}</h2>
            <p className="text-sm text-pretty text-muted-foreground">
              Your first event, covered.
            </p>
            <div className="mt-3 font-heading text-section tabular-nums">
              {free.priceLabel}
            </div>
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            <PlanItem>
              {MAX_EVENTS.free} event, every guest, the album and the reel
            </PlanItem>
            <PlanItem>No watermark on photos or the album</PlanItem>
            <PlanItem>Verified-email uploads, on by default</PlanItem>
            <PlanItem limit>Photos only</PlanItem>
            <PlanItem limit>
              {MAX_REEL_SECONDS.free}-second reel with a small mark
            </PlanItem>
          </ul>
          <div className="mt-6">
            <StatRow
              stats={[
                { value: formatBytes(free.storageBytes), label: "Storage" },
                {
                  value: `≈ ${freeCap.photos.toLocaleString()}`,
                  label: "Photos",
                },
              ]}
            />
            <Button variant="outline" className="mt-5 w-full">
              Start free
            </Button>
            <p className="mt-3 text-center text-xs text-faint">
              No card. Upgrade only when you host again.
            </p>
          </div>
        </div>

        {/* Pro: the same sheet, in ink. */}
        <div className="group relative flex flex-col rounded-2xl bg-foreground p-7 text-background">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-foreground uppercase">
            Most popular
          </span>
          <PhotoStack ink />
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-subsection">Pro</h2>
            {/* ★ THE CANDIDATE. */}
            <p className="text-sm text-pretty text-background/75">{proLine}</p>
            <div className="mt-3 font-heading text-section tabular-nums">
              {pro.priceLabel}
            </div>
          </div>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            <PlanItem ink>Unlimited events, one album each</PlanItem>
            <PlanItem ink>Photos and video</PlanItem>
            <PlanItem ink>
              {MAX_REEL_SECONDS.pro}-second reels, no watermark
            </PlanItem>
            <PlanItem ink>Password-locked albums and custom links</PlanItem>
            <PlanItem ink>Your public host page at /u/you</PlanItem>
          </ul>
          <div className="mt-6">
            <StatRow
              ink
              stats={[
                { value: formatBytes(pro.storageBytes), label: "Storage" },
                {
                  value: `≈ ${proCap.photos.toLocaleString()}`,
                  label: "Photos",
                },
                {
                  value: `${Math.round(proCap.videoMinutes / 60).toLocaleString()} h`,
                  label: "Video",
                },
              ]}
            />
            <Button className="mt-5 w-full bg-background text-foreground hover:bg-background/90">
              Get Pro at {pro.priceLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STACK_IDS = {
  free: ["wedding-golden", "reception-table"],
  pro: [
    "wedding-golden",
    "party-balloons",
    "concert-confetti",
    "wedding-toast",
  ],
} as const;

function PhotoStack({ ink }: { ink?: boolean }) {
  const ids = ink ? STACK_IDS.pro : STACK_IDS.free;
  const n = ids.length;
  return (
    <div aria-hidden className="relative h-24">
      <div className="absolute inset-x-0 top-1 flex justify-center">
        {ids.map((id, i) => {
          const m = marketingImage(id);
          const off = i - (n - 1) / 2;
          return (
            <div
              key={id}
              className="absolute"
              style={{
                transform: `rotate(${off * (ink ? 9 : 7)}deg) translateX(${off * 16}px)`,
              }}
            >
              <Image
                src={m.src}
                alt=""
                width={88}
                height={88}
                className={cn(
                  "size-20 rounded-md border-4 object-cover shadow-lift",
                  ink
                    ? "border-background/90"
                    : "border-background opacity-85 grayscale",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanItem({
  children,
  ink,
  limit = false,
}: {
  children: React.ReactNode;
  ink?: boolean;
  limit?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      {limit ? (
        <Minus
          className={cn(
            "mt-0.5 size-4 shrink-0",
            ink ? "text-background/50" : "text-faint",
          )}
          strokeWidth={2}
        />
      ) : (
        <Check
          className="mt-0.5 size-4 shrink-0 text-success"
          strokeWidth={2}
        />
      )}
      <span className={ink ? "text-background/75" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

function StatRow({
  stats,
  ink,
}: {
  stats: { value: string; label: string }[];
  ink?: boolean;
}) {
  return (
    <dl
      className={cn(
        "flex divide-x border-y",
        ink
          ? "divide-background/15 border-background/15"
          : "divide-border border-border",
      )}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex-1 py-3 pr-3 not-first:pl-3 first:pl-0"
        >
          <dt
            className={cn(
              "text-[10px] tracking-[0.14em] uppercase",
              ink ? "text-background/50" : "text-faint",
            )}
          >
            {s.label}
          </dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ────────────────────────────────  the app  ────────────────────────────── */

/**
 * The host's dashboard on the day they sign up: `events-empty-teaser.tsx`
 * inside the app shell, with its title as a prop. The blurb under it is held at
 * today's wording under every option, so the title is the only thing that moves.
 */
export function HostDashboard({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="border-b bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-8">
          <Logo />
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            M
          </span>
        </div>
      </header>
      <main className="flex-1 py-8">
        <div className="mx-auto w-full max-w-7xl px-8">
          <PageHeading>Dashboard</PageHeading>
          <div className="mt-8">
            <div className="relative">
              <div
                aria-hidden
                className="grid grid-cols-3 gap-3 opacity-25 grayscale [content-visibility:auto]"
              >
                {GHOSTS.slice(0, 6).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset, as production mounts it
                  <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full rounded-xl object-cover"
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="space-y-1.5">
                  {/* ★ THE CANDIDATE. */}
                  <h2 className="font-heading text-subsection text-balance">
                    {title}
                  </h2>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Create an event and your guests add photos and videos in
                    seconds. No app, no account, just a QR code.
                  </p>
                </div>
                <Button size="lg">
                  <CalendarPlus /> Create your first event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
