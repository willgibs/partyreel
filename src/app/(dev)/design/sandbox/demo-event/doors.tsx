import Image from "next/image";

import { FooterDemo } from "@/components/marketing/chrome/footer-demo";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Logo } from "@/components/shared/logo";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { DEMO_URL } from "./fixtures";

/**
 * THE DOOR, ROUND TWO: FOUR OBJECTS, FOUR PLACES.
 *
 * His note on `doors=pile`, verbatim: "I'd be curious to see better designs of
 * this. Looks like we're just reusing what's in the footer. However, labeling
 * the QR (option 2) doesn't look very polished in the otherwise text-free
 * visuals." Round one's `pile` is the rule; this round asks whether the object
 * ITSELF, wherever it stands, is the best a text-free page can show.
 *
 * ★ TODAY IS UNEVEN, WHICH IS WHY THIS ROUND EXISTS. Only the footer really
 * committed to an object (`FooterDemo`, the fan pile, shipped long before this
 * round). The hero's plate (`cinema-hero.tsx`'s `DemoQr`) is bare on its own
 * real photograph corridor; a feature page's line (`DemoCtaLink`) is six words
 * and a chevron, no image at all; the nav panel's card is gone (`doors=pile`
 * retired it and nothing replaced it). So `pile` below is itself a PROPOSAL at
 * the hero and the line, not a picture of today — the one place it draws
 * today unchanged is the footer.
 *
 * ★ WHAT IS SHIPPED AND WHAT IS QUOTED (the same rule round one drew). `FooterQr`
 * (the real matrix) and `FooterDemo` (the real pile) are imported and rendered
 * with the board's own URL, because both already take the destination as a
 * prop. Everything else — the frame, the settled scatter, the ticket stub, and
 * the four page shells around them — is this board's own drawing at each
 * place's real size, on the real tokens, so `marketing.css`'s absence from a
 * lab frame costs nothing: none of these three needs the recipe `FooterDemo`
 * does (see `demo-event.css`'s own note).
 *
 * ★ NONE OF THE FOUR ADDS WORDS. Round one already tried naming the party
 * (`named`) against showing it (`pile`), and showing it won; his complaint
 * about the retired ticket was a caption glued beside a code, not the idea of
 * a QR object. So every option here is read as strictly visual — the page's
 * own surrounding copy (the footer's "Explore a demo event.", the line's "Try
 * the live demo, no signup.") is untouched furniture around the object, not
 * part of what is judged. A call taken, his to overrule: "text-free but the
 * demo's name" could also mean the party's own name prints ON the object,
 * which the Handoff carries as a question.
 */

export type DoorShape = "pile" | "frame" | "stage" | "ticket";
export type PlaceId = "hero" | "footer" | "line" | "nav";

export const doorOf = (v: string | undefined): DoorShape =>
  v === "frame"
    ? "frame"
    : v === "stage"
      ? "stage"
      : v === "ticket"
        ? "ticket"
        : "pile";

export const placeOf = (v: string | undefined): PlaceId =>
  v === "footer" ? "footer" : v === "line" ? "line" : v === "nav" ? "nav" : "hero";

/* ── the screen, shared with the board ───────────────────────────────────── */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;

export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

/** The object's own footprint at each place: the footer has the most room, a
 *  feature page's line the least, and the nav pane sits between them. */
const OBJECT_SIZE: Record<PlaceId, number> = {
  hero: 128,
  footer: 148,
  line: 64,
  nav: 100,
};

/* ── the pile, compact (line and nav; hero and footer take the real thing) ─ */

const PILE_IDS = ["wedding-arch", "reception-table", "festival-lights"] as const;

/**
 * The fan at a size a paragraph, or a nav pane, can carry: photographs behind
 * a plate, the same idea as `FooterDemo`, sized down rather than recipe-driven
 * (the recipe's hover fan is a footer-scale gesture; at this size a plate
 * covering three quarters of the object read as a widget, not an album).
 */
function CompactPile({ size }: { size: number }) {
  const qr = Math.round(size * 0.62);
  return (
    <span
      className="relative inline-block"
      style={{ width: size * 1.5, height: size * 1.34 }}
    >
      {PILE_IDS.map((id, i) => {
        const img = marketingImage(id);
        return (
          <span
            key={id}
            className="absolute overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-border"
            style={{
              width: size * 0.6,
              height: size * 0.74,
              left: i * (size * 0.42),
              top: i % 2 === 0 ? size * 0.28 : 0,
              zIndex: i,
              transform: `rotate(${(i - 1) * 7}deg)`,
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          </span>
        );
      })}
      <span
        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-md bg-white p-1"
        style={{ boxShadow: "0 0 0 1px var(--border), var(--shadow-lift)" }}
      >
        <FooterQr value={DEMO_URL} size={qr} />
      </span>
    </span>
  );
}

/* ── the frame: one photograph, the code in its corner ───────────────────── */

function FrameObject({ size }: { size: number }) {
  const img = marketingImage("wedding-arch");
  const qr = Math.round(size * 0.38);
  return (
    <span
      className="relative inline-flex flex-col rounded-[var(--radius-tile)] border bg-card p-2"
      style={{ width: size, boxShadow: "var(--shadow-lift)" }}
    >
      <span
        className="relative block w-full overflow-hidden rounded-[calc(var(--radius-tile)-3px)]"
        style={{ height: Math.round(size * 1.15) }}
      >
        <Image
          src={img.src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
      <span
        className="absolute right-[-12px] bottom-[-12px] rounded-md bg-white p-1"
        style={{ boxShadow: "0 0 0 1px var(--border), var(--shadow-lift)" }}
      >
        <FooterQr value={DEMO_URL} size={qr} />
      </span>
    </span>
  );
}

/* ── the stage: the album's own fall, settled, the code over it ──────────── */

const STAGE_TILES = [
  { id: "wedding-golden", x: 0, y: 0.12, r: -7 },
  { id: "party-balloons", x: 0.5, y: 0, r: 6 },
  { id: "reception-hall", x: 0.22, y: 0.5, r: -3 },
] as const;

/**
 * ★ SKETCHED, NOT SHIPPED, LIKE ROUND ONE'S HERO BAND. The real engine
 * (`album-stream.tsx`, `stream-engine.ts`) is a continuous rAF loop anchored to
 * the home hero's own height (its cards hang off the layer's FOOT, hundreds of
 * px up); grafting it into a nav pane or a paragraph's edge is not a smaller
 * version of the same thing, it is a different composition. This draws the
 * engine's own REST FRAME — the same photographs, the same overlap and tilt a
 * settled stack leaves — so what is judged is the geometry and the code
 * sitting over it, never a loop a still page cannot show anyway. The cost line
 * says the rest: picking this for real spends a running rAF loop, which the
 * hero already budgets for its own corridor and the other three places do not.
 */
function StageObject({ size }: { size: number }) {
  const qr = Math.round(size * 0.44);
  return (
    <span
      className="relative inline-block"
      style={{ width: size * 1.55, height: size * 1.35 }}
    >
      {STAGE_TILES.map((t) => {
        const img = marketingImage(t.id);
        return (
          <span
            key={t.id}
            className="absolute overflow-hidden rounded-[var(--radius-tile)] ring-1 ring-foreground/10"
            style={{
              left: t.x * size,
              top: t.y * size,
              width: size * 0.56,
              height: size * 0.68,
              transform: `rotate(${t.r}deg)`,
              boxShadow: "var(--shadow-lift)",
            }}
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          </span>
        );
      })}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-1.5"
        style={{ boxShadow: "0 0 0 1px var(--border), var(--shadow-lift)" }}
      >
        <FooterQr value={DEMO_URL} size={qr} />
      </span>
    </span>
  );
}

/* ── the ticket: a redrawn stub, no label this time ──────────────────────── */

/**
 * The retired `DemoTicket`'s idea (a small self-contained plate), redrawn as a
 * die-cut stub rather than a bordered glass card: a photograph on one half, a
 * perforated pane holding the code on the other, two notches punched in the
 * divider. `bg-background` on the notches so they read as cut through to
 * whatever ground the stub sits on (dark at the hero and footer, paper at the
 * line and the nav pane) rather than one hardcoded colour.
 */
function TicketObject({ size }: { size: number }) {
  const img = marketingImage("festival-lights");
  const qr = Math.round(size * 0.48);
  const notch = Math.max(9, Math.round(size * 0.1));
  return (
    <span
      className="relative inline-flex overflow-hidden rounded-[var(--radius-tile)] border bg-card"
      style={{ height: size, boxShadow: "var(--shadow-lift)" }}
    >
      <span className="relative block h-full" style={{ width: size * 0.9 }}>
        <Image
          src={img.src}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
      <span
        className="relative flex h-full flex-col items-center justify-center border-l border-dashed border-border py-2"
        style={{ width: size * 0.62 }}
      >
        <span
          aria-hidden
          className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
          style={{ width: notch, height: notch }}
        />
        <span
          className="rounded-md bg-white p-1"
          style={{ boxShadow: "0 0 0 1px var(--border)" }}
        >
          <FooterQr value={DEMO_URL} size={qr} />
        </span>
        <span
          aria-hidden
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-background"
          style={{ width: notch, height: notch }}
        />
      </span>
    </span>
  );
}

/* ── the object, dispatched by shape and place ────────────────────────────── */

function DoorObject({
  shape,
  place,
  size,
}: {
  shape: DoorShape;
  place: PlaceId;
  size: number;
}) {
  if (shape === "pile") {
    // The real component wherever it already fits its own geometry; the
    // compact fan everywhere the real one would overflow the place.
    return place === "hero" || place === "footer" ? (
      <FooterDemo href={DEMO_URL} value={DEMO_URL} />
    ) : (
      <CompactPile size={size} />
    );
  }
  if (shape === "frame") return <FrameObject size={size} />;
  if (shape === "stage") return <StageObject size={size} />;
  return <TicketObject size={size} />;
}

/* ── 1. the home hero ─────────────────────────────────────────────────────── */

/** The corridor of streaming photographs behind the object, sketched (round
 *  one's own move, see its header note): the real `hero-stream.ts` /
 *  `album-stream.tsx` engine is anchored to the home hero's own measured axis
 *  and is held CONSTANT across every option here, so only the centred object
 *  changes and the comparison stays fair. */
const HERO_FRAMES = [
  "wedding-golden",
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
  "reception-hall",
] as const;

function HeroDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  const wide = screen === "1440";
  return (
    <div className="surface-ink relative flex h-full flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <Logo />
        <span className="text-[13px] text-muted-foreground">
          Start for free
        </span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 justify-center gap-3 opacity-70"
          >
            {HERO_FRAMES.slice(0, wide ? 5 : 3).map((id) => {
              const img = marketingImage(id);
              return (
                <span
                  key={id}
                  className="overflow-hidden rounded-[var(--radius-tile)]"
                  style={{ width: wide ? 210 : 105, height: wide ? 140 : 78 }}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="210px"
                    className="object-cover"
                  />
                </span>
              );
            })}
          </div>
          <div data-de-door className="relative z-10">
            <DoorObject shape={shape} place="hero" size={OBJECT_SIZE.hero} />
          </div>
        </div>
        <p
          className="mt-12 max-w-3xl font-heading text-balance text-foreground"
          style={{ fontSize: wide ? 44 : 30, lineHeight: 1.05 }}
        >
          The whole event, in one album.
        </p>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">
          Partyreel collects the photos and videos from your guests with one QR
          code.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <span className="rounded-full bg-foreground px-5 py-2.5 text-[15px] font-medium text-background">
            Start for free
          </span>
          <span className="rounded-full border border-border px-5 py-2.5 text-[15px] font-medium text-foreground">
            Watch a sample reel
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 2. the footer ────────────────────────────────────────────────────────── */

function FooterDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  const wide = screen === "1440";
  return (
    <div className="surface-ink flex h-full flex-col justify-end bg-background px-8 pb-8">
      <div
        className={cn(
          "flex gap-10",
          wide ? "flex-row items-center" : "flex-col items-start gap-8",
        )}
      >
        <div data-de-door className="shrink-0">
          <DoorObject shape={shape} place="footer" size={OBJECT_SIZE.footer} />
        </div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="font-heading text-chapter">Explore a demo event.</h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            Scan the code for a real event album on your phone, exactly the way
            a guest arrives. No app required.
          </p>
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between border-t border-border pt-5 text-[13px] text-faint">
        <Logo />
        <span>Privacy · Terms</span>
      </div>
    </div>
  );
}

/* ── 3. a feature page's line ─────────────────────────────────────────────── */

function LineDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  const wide = screen === "1440";
  return (
    <div className="flex h-full items-center bg-background px-8">
      <div
        className={cn(
          "flex w-full items-center gap-10",
          wide ? "flex-row" : "flex-col items-start",
        )}
      >
        <div className="flex max-w-md flex-1 flex-col justify-center">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            The QR code
          </p>
          <h2 className="mt-3 font-heading text-section text-balance">
            One code. Every phone at the party.
          </h2>
          <p className="mt-4 text-[17px] text-pretty text-muted-foreground">
            Print it, stand it on a table, put it on the screen. Guests scan
            and start adding, with nothing to install and no account to make.
          </p>
        </div>
        <div data-de-door className="shrink-0">
          <DoorObject shape={shape} place="line" size={OBJECT_SIZE.line} />
        </div>
      </div>
    </div>
  );
}

/* ── 4. the nav panel's empty featured pane ───────────────────────────────── */

/** Three of the real Features group's seven rows (`marketing-nav.ts`), quoted:
 *  enough to show the pane beside real neighbours, never the whole panel. */
const NAV_ROWS = [
  {
    label: "The live album",
    description: "Every photo and video, full quality, live.",
  },
  { label: "The QR code", description: "One scan and everyone's in." },
  { label: "Curation", description: "Approve, hide, and shape the album." },
] as const;

/**
 * `mega-panel.tsx`'s own anatomy, quoted: `1fr_272px` when a pane stands, a
 * bare list when it does not (the panel's real no-card fallback, exactly the
 * picture `stage` draws here rather than inventing a broken one).
 */
function NavDoor({ shape, screen }: { shape: DoorShape; screen: ScreenId }) {
  if (screen === "375") {
    // The mega-panel is a desktop hover; the phone menu is a different
    // surface entirely (full-screen, no panel, no featured pane). Faking one
    // here would judge a surface that does not exist rather than saying so.
    return (
      <div className="flex h-full items-center justify-center bg-background px-8 text-center">
        <p className="max-w-xs text-[15px] text-pretty text-muted-foreground">
          The nav panel is a desktop hover. At a phone, Features opens the
          full-screen menu instead, no featured pane in it.
        </p>
      </div>
    );
  }
  const stands = shape !== "stage";
  return (
    <div className="flex h-full items-start justify-center bg-background px-6 pt-16">
      <div
        className={cn(
          "grid w-full gap-2 rounded-xl border bg-popover p-2",
          stands
            ? "max-w-[560px] grid-cols-[1fr_272px]"
            : "max-w-[280px] grid-cols-1",
        )}
        style={{ boxShadow: "var(--shadow-layer)" }}
      >
        <div className="flex flex-col gap-1 p-1">
          {NAV_ROWS.map((row) => (
            <div key={row.label} className="rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-foreground">
                {row.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.description}
              </p>
            </div>
          ))}
        </div>
        {stands && (
          <div
            data-de-door
            className="relative flex items-center justify-center overflow-hidden rounded-lg border bg-card"
            style={{ aspectRatio: "16 / 9" }}
          >
            <DoorObject shape={shape} place="nav" size={OBJECT_SIZE.nav} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── the door, dispatched by place ─────────────────────────────────────────── */

export function Door({
  shape,
  place,
  screen,
}: {
  shape: DoorShape;
  place: PlaceId;
  screen: ScreenId;
}) {
  if (place === "footer") return <FooterDoor shape={shape} screen={screen} />;
  if (place === "line") return <LineDoor shape={shape} screen={screen} />;
  if (place === "nav") return <NavDoor shape={shape} screen={screen} />;
  return <HeroDoor shape={shape} screen={screen} />;
}
