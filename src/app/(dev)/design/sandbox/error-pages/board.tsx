"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarX2,
  CircleAlert,
  FileQuestion,
  Lock,
  QrCode,
  RefreshCcw,
} from "lucide-react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";
import { MarketingNotFound, MissingFrameStrip } from "@/components/marketing/marketing-not-found";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { DEMO_EVENT_URL } from "@/lib/demo";

import {
  AdminChrome,
  AppChrome,
  Bare,
  GuestChrome,
  MarketingChrome,
  MarketingLogoBar,
  RootMarketingChrome,
  Stack,
} from "./chrome";
import { SCREENS, type ScreenId, fabricatedError, screenOf } from "./fixtures";
import { ERROR_PAGES } from "./spec";
import {
  CrashToday,
  DigestLine,
  GlobalCrashToday,
  HelpLine,
  PrivateLockToday,
  Tag,
  type CodeShape,
  type GlobalCrashShape,
} from "./templates";

/**
 * THE PREVIEWS: every option is a real failure screen, fabricated `error` and
 * `reset` props, inside a surface's own chrome (or deliberately without one,
 * captioned so the omission is never mistaken for an answer to `surround`).
 *
 * ★ NOTHING HERE REACHES SENTRY. No file in this board imports `captureError`
 * or `@sentry/nextjs` — `RouteError`, `MarketingRouteError` and `GlobalError`
 * are never mounted; `templates.tsx` reproduces their JSX with the reporting
 * effect removed. `grep -rn "captureError\|@sentry" sandbox/error-pages`
 * returns nothing, which is the Handoff's proof.
 *
 * ★ ONE ERROR OBJECT, EVERYWHERE ONE IS NEEDED. `fabricatedError()` is the same
 * digest every time, so a reader can tell which screens draw the SAME crash
 * rather than a different one per tile.
 */

const noop = () => {};
const err = fabricatedError();

/* ── shared action rows (the shape every real call site already uses) ────── */

/** `Try again` (inert) + a `Link` — RouteError's own action row, for a tile
 *  built from NotFoundScreen instead of a standalone crash component. */
function crashActions(secondary: { href: string; label: string } = { href: "/", label: "Back home" }) {
  return (
    <>
      <Button size="cta" onClick={noop}>
        Try again
      </Button>
      <Button asChild size="cta" variant="outline">
        <Link href={secondary.href}>{secondary.label}</Link>
      </Button>
    </>
  );
}

/** One or more `Link` buttons for a not-found screen's action row. */
function linkActions(items: { href: string; label: string }[]) {
  return (
    <>
      {items.map((b, i) => (
        <Button key={b.href} asChild size="cta" variant={i === 0 ? "default" : "outline"}>
          <Link href={b.href}>{b.label}</Link>
        </Button>
      ))}
    </>
  );
}

/* ── the stage ────────────────────────────────────────────────────────────── */

/** One picture: a real viewport at the screen the shared knob holds. */
function Screen({
  id,
  size,
  h1440,
  h375,
  caption,
  children,
}: {
  id: string;
  size: ScreenId;
  h1440: number;
  h375: number;
  caption: string;
  children: ReactNode;
}) {
  const { w } = SCREENS[size];
  const h = size === "375" ? h375 : h1440;
  return (
    <Frame id={`ep-${id}`} w={w} h={h} title={`${w} x ${h}`} caption={caption}>
      {children}
    </Frame>
  );
}

const sizeOf = (s: BoardState) => screenOf(s.screen);

/* ── 1. one grammar ───────────────────────────────────────────────────────── */

type GrammarShape = "today" | "shared" | "unified";

const GRAMMAR_CAPTION: Record<GrammarShape, string> = {
  today: "Today. Two components: RouteError stands alone, and MarketingRouteError already leans on NotFoundScreen.",
  shared: "The app's crash now draws from NotFoundScreen too, gaining the digest as a footnote. Marketing is unchanged.",
  unified: "The same icon and the same words on both, regardless of surface. Only the type step still tells them apart.",
};

function appCrashTile(v: GrammarShape) {
  if (v === "today")
    return (
      <AppChrome standalone={false}>
        <CrashToday error={err} tag="RouteError, its own component" />
      </AppChrome>
    );
  const title = v === "unified" ? "Something's not right" : "Something went wrong";
  const description =
    v === "unified"
      ? "Try again, or come back later."
      : "That's on us, not you. Try again, and if it keeps happening, let us know.";
  return (
    <AppChrome standalone={false}>
      <div className="relative">
        <Tag>Built from NotFoundScreen</Tag>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
          <NotFoundScreen
            surface="app"
            icon={CircleAlert}
            title={title}
            description={description}
            actions={crashActions()}
            footnote={<DigestLine digest={err.digest ?? ""} shape="today" />}
          />
        </main>
      </div>
    </AppChrome>
  );
}

function marketingCrashTile(v: GrammarShape) {
  const title = v === "unified" ? "Something's not right" : "That one didn't develop.";
  const description =
    v === "unified"
      ? "Try again, or come back later."
      : "Something went wrong loading this page, and it's on us, not you. Try again; if it keeps happening, we want to know.";
  return (
    <MarketingLogoBar standalone={false}>
      <div className="relative">
        <Tag>{v === "today" ? "Already built from NotFoundScreen" : "Built from NotFoundScreen"}</Tag>
        <NotFoundScreen
          surface="marketing"
          icon={RefreshCcw}
          eyebrow={v === "unified" ? undefined : "Error"}
          title={title}
          description={description}
          actions={crashActions()}
          footnote={<HelpLine href="/contact">Tell us what happened</HelpLine>}
        />
      </div>
    </MarketingLogoBar>
  );
}

function grammarScreen(v: GrammarShape, s: BoardState) {
  const size = sizeOf(s);
  return (
    <Screen id={`grammar-${v}`} size={size} h1440={1520} h375={1900} caption={GRAMMAR_CAPTION[v]}>
      <Stack
        items={[
          { label: "App · a crash", node: appCrashTile(v) },
          { label: "Marketing · a crash", node: marketingCrashTile(v) },
        ]}
      />
    </Screen>
  );
}

/* ── 2. the ways out (staged after grammar) ──────────────────────────────── */

type WaysOutShape = "today" | "two" | "guided";

const WAYS_OUT_CAPTION: Record<WaysOutShape, string> = {
  today: "Today. The guest and admin 404s stop at one action; neither points anywhere else.",
  two: "Both gain a second action: the guest's footnote becomes a button, the admin's points at Reports.",
  guided: "The same two actions, plus one quiet line: the help center for a guest, the runbook for an operator.",
};

function guestNotFoundTile(v: WaysOutShape) {
  const demo = DEMO_EVENT_URL ?? "#";
  const actions =
    v === "today" ? (
      <Button asChild size="cta">
        <Link href="/">What is Partyreel?</Link>
      </Button>
    ) : (
      linkActions([
        { href: "/", label: "What is Partyreel?" },
        { href: demo, label: "See a live demo" },
      ])
    );
  return (
    <GuestChrome standalone={false}>
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
        <NotFoundScreen
          icon={QrCode}
          eyebrow="Event link"
          title="This event link didn't work"
          description="The link may be mistyped, or the host may have deleted the event. Double-check the QR code or link, or ask the host to resend it."
          actions={actions}
          footnote={v === "guided" ? <HelpLine href="/help">Visit the help center</HelpLine> : undefined}
        />
      </main>
    </GuestChrome>
  );
}

function adminNotFoundTile(v: WaysOutShape) {
  const actions =
    v === "today" ? (
      <Button asChild size="cta">
        <Link href="/admin">Back to overview</Link>
      </Button>
    ) : (
      linkActions([
        { href: "/admin", label: "Back to overview" },
        { href: "/admin/reports", label: "Open reports" },
      ])
    );
  return (
    <AdminChrome standalone={false}>
      <div className="flex min-h-[420px] flex-col items-center justify-center">
        <NotFoundScreen
          icon={FileQuestion}
          title="We couldn't find that page"
          description="The record may have been deleted, or this link points to something that no longer exists."
          actions={actions}
          footnote={
            v === "guided" ? (
              <p className="text-sm text-muted-foreground">Still stuck? Check the runbook.</p>
            ) : undefined
          }
        />
      </div>
    </AdminChrome>
  );
}

function waysOutScreen(v: WaysOutShape, s: BoardState) {
  const size = sizeOf(s);
  return (
    <Screen id={`ways-out-${v}`} size={size} h1440={1520} h375={1620} caption={WAYS_OUT_CAPTION[v]}>
      <Stack
        items={[
          { label: "Guest · a bad link", node: guestNotFoundTile(v) },
          { label: "Admin · a missing record", node: adminNotFoundTile(v) },
        ]}
      />
    </Screen>
  );
}

/* ── 3. the picture ───────────────────────────────────────────────────────── */

type PictureShape = "today" | "everywhere" | "nowhere";

const PICTURE_CAPTION: Record<PictureShape, string> = {
  today: "Today. The strip rides the marketing 404; the app 404 draws a plain icon.",
  everywhere: "The same strip rides both: one shared motif for every dead end.",
  nowhere: "The strip retires from both; only the root 404's image trail (not pictured here) carries it.",
};

function marketingNotFoundTile(v: PictureShape) {
  return (
    <MarketingChrome standalone={false}>
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-24">
        <MarketingNotFound strip={v !== "nowhere"} />
      </div>
    </MarketingChrome>
  );
}

function appNotFoundTile(v: PictureShape) {
  return (
    <AppChrome>
      <div className="flex min-h-[420px] flex-col items-center justify-center">
        <NotFoundScreen
          icon={CalendarX2}
          title="We couldn't find that event"
          description="It may have been deleted, or the link points to an event that no longer exists. Your other events are safe on your dashboard."
          actions={linkActions([
            { href: "/dashboard", label: "Back to dashboard" },
            { href: "/dashboard/new", label: "Create an event" },
          ])}
          footnote={v === "everywhere" ? <MissingFrameStrip label="404" /> : undefined}
        />
      </div>
    </AppChrome>
  );
}

function pictureScreen(v: PictureShape, s: BoardState) {
  const size = sizeOf(s);
  return (
    <Screen id={`picture-${v}`} size={size} h1440={3540} h375={2660} caption={PICTURE_CAPTION[v]}>
      <Stack
        items={[
          { label: "Marketing · a 404", node: marketingNotFoundTile(v) },
          { label: "App · a 404", node: appNotFoundTile(v) },
        ]}
      />
    </Screen>
  );
}

/* ── 4. the code ──────────────────────────────────────────────────────────── */

const CODE_CAPTION: Record<CodeShape, string> = {
  today: "Today, on the auth crash (bare, its real chrome). A plain, uncopyable chip; marketing's own crash shows none at all.",
  always: "A Copy control and one line saying what it is for, on every render-crash boundary, marketing included.",
  silent: "Nothing prints. The digest still reaches Sentry; the screen and any report built from it carry no code.",
};

function codeScreen(v: CodeShape, s: BoardState) {
  const size = sizeOf(s);
  return (
    <Screen id={`code-${v}`} size={size} h1440={700} h375={820} caption={CODE_CAPTION[v]}>
      <Bare>
        <CrashToday
          error={err}
          footnote={<DigestLine digest={err.digest ?? ""} shape={v} />}
        />
      </Bare>
    </Screen>
  );
}

/* ── 5. the surround ──────────────────────────────────────────────────────── */

type SurroundShape = "today" | "shell" | "bare";

const SURROUND_CAPTION: Record<SurroundShape, string> = {
  today: "Today. The app and admin keep their shell; the guest crash renders with no wrapper at all.",
  shell: "Every surface gets its own shell: the guest crash gains the header the other two already keep.",
  bare: "Every wrapper drops. Three crashes, one calm centered page each, nothing else.",
};

function appCrashInShell(v: SurroundShape) {
  const body = <CrashToday error={err} />;
  if (v === "bare") return <Bare standalone={false}>{body}</Bare>;
  return <AppChrome standalone={false}>{body}</AppChrome>;
}

function guestCrashInShell(v: SurroundShape) {
  const body = <CrashToday error={err} />;
  if (v === "shell") return <GuestChrome standalone={false}>{body}</GuestChrome>;
  return <Bare standalone={false}>{body}</Bare>;
}

function adminNotFoundInShell(v: SurroundShape) {
  const body = (
    <div className="flex min-h-[420px] flex-col items-center justify-center">
      <NotFoundScreen
        icon={FileQuestion}
        title="We couldn't find that page"
        description="The record may have been deleted, or this link points to something that no longer exists."
        actions={
          <Button asChild size="cta">
            <Link href="/admin">Back to overview</Link>
          </Button>
        }
      />
    </div>
  );
  if (v === "bare") return <Bare standalone={false}>{body}</Bare>;
  return <AdminChrome standalone={false}>{body}</AdminChrome>;
}

function surroundScreen(v: SurroundShape, s: BoardState) {
  const size = sizeOf(s);
  return (
    <Screen id={`surround-${v}`} size={size} h1440={2560} h375={2500} caption={SURROUND_CAPTION[v]}>
      <Stack
        items={[
          { label: "App · a crash", node: appCrashInShell(v) },
          { label: "Guest · a crash", node: guestCrashInShell(v) },
          { label: "Admin · a 404", node: adminNotFoundInShell(v) },
        ]}
      />
    </Screen>
  );
}

/* ── 6. the private event (staged after grammar) ─────────────────────────── */

type PrivateShape = "today" | "family" | "same-page";

const PRIVATE_CAPTION: Record<PrivateShape, string> = {
  today: "Today. A hand-rolled stack: an icon, a heading, one sentence, no action, no shared code.",
  family: "The same words, drawn by NotFoundScreen: a lock icon, the same heading, no action.",
  "same-page": "The guest 404, verbatim. A private event and a missing one are now one screen.",
};

function privateEventScreen(v: PrivateShape, s: BoardState) {
  const size = sizeOf(s);
  const demo = DEMO_EVENT_URL;
  return (
    <Screen id={`private-event-${v}`} size={size} h1440={560} h375={680} caption={PRIVATE_CAPTION[v]}>
      <GuestChrome>
        {v === "today" && <PrivateLockToday />}
        {v === "family" && (
          <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
            <NotFoundScreen
              icon={Lock}
              title="This event is private"
              description="The host has this event set to private. Check back later, or ask them to make it public."
              actions={null}
            />
          </main>
        )}
        {v === "same-page" && (
          <main className="flex flex-1 flex-col items-center justify-center px-5 py-20">
            <NotFoundScreen
              icon={QrCode}
              eyebrow="Event link"
              title="This event link didn't work"
              description="The link may be mistyped, or the host may have deleted the event. Double-check the QR code or link, or ask the host to resend it."
              actions={
                <Button asChild size="cta">
                  <Link href="/">What is Partyreel?</Link>
                </Button>
              }
              footnote={
                demo ? (
                  <Link href={demo} className="font-medium text-brand underline-offset-4 hover:underline">
                    See how it works with a live demo
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Hosting your own? It is free to start. No app, no account.</span>
                )
              }
            />
          </main>
        )}
      </GuestChrome>
    </Screen>
  );
}

/* ── 7. the admin's 404 ───────────────────────────────────────────────────── */

type Admin404Shape = "today" | "portal" | "redirect";

const ADMIN_404_CAPTION: Record<Admin404Shape, string> = {
  today: "Today. The rewrite lands on the root marketing 404; every footnote link 404s again on this host.",
  portal: "The admin's own not-found content: the ops chrome, and nothing pointing off this host.",
  redirect: "No 404 ever renders. The refused path lands here (or on /login, signed out) before anything paints.",
};

function admin404Screen(v: Admin404Shape, s: BoardState) {
  const size = sizeOf(s);
  const h1440 = v === "today" ? 1340 : 560;
  const h375 = v === "today" ? 2600 : 640;
  return (
    <Screen id={`admin-404-${v}`} size={size} h1440={h1440} h375={h375} caption={ADMIN_404_CAPTION[v]}>
      {v === "today" && (
        <RootMarketingChrome>
          <MarketingNotFound strip={false} />
        </RootMarketingChrome>
      )}
      {v === "portal" && (
        <AdminChrome>
          <div className="flex min-h-[420px] flex-col items-center justify-center">
            <NotFoundScreen
              icon={FileQuestion}
              title="This page isn't part of the operations portal"
              description="This host only serves the operations portal. If you followed a link here, it was meant for the marketing site or the app instead."
              actions={
                <Button asChild size="cta">
                  <Link href="/admin">Back to overview</Link>
                </Button>
              }
            />
          </div>
        </AdminChrome>
      )}
      {v === "redirect" && (
        <AdminChrome>
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 text-center">
            <h1 className="font-heading text-subsection">Operations overview</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Support, applicants, reports and jobs, all at a glance.
            </p>
          </div>
        </AdminChrome>
      )}
    </Screen>
  );
}

/* ── 8. the global crash ──────────────────────────────────────────────────── */

const GLOBAL_CAPTION: Record<GlobalCrashShape, string> = {
  today: "Today. One button, inline-styled. No way home if retrying does not fix it.",
  home: "The same screen, with a plain inline anchor to '/' beside Try again.",
  plain: "The digest, and a plain mailto line beneath it, in case even '/' cannot load.",
};

function globalCrashScreen(v: GlobalCrashShape, s: BoardState) {
  const size = sizeOf(s);
  return (
    <Screen id={`global-crash-${v}`} size={size} h1440={480} h375={560} caption={GLOBAL_CAPTION[v]}>
      <GlobalCrashToday shape={v} digest={err.digest ?? ""} />
    </Screen>
  );
}

/* ── the map the step draws from ─────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof ERROR_PAGES> = {
  "grammar.today": (s) => grammarScreen("today", s),
  "grammar.shared": (s) => grammarScreen("shared", s),
  "grammar.unified": (s) => grammarScreen("unified", s),

  "ways-out.today": (s) => waysOutScreen("today", s),
  "ways-out.two": (s) => waysOutScreen("two", s),
  "ways-out.guided": (s) => waysOutScreen("guided", s),

  "picture.today": (s) => pictureScreen("today", s),
  "picture.everywhere": (s) => pictureScreen("everywhere", s),
  "picture.nowhere": (s) => pictureScreen("nowhere", s),

  "code.today": (s) => codeScreen("today", s),
  "code.always": (s) => codeScreen("always", s),
  "code.silent": (s) => codeScreen("silent", s),

  "surround.today": (s) => surroundScreen("today", s),
  "surround.shell": (s) => surroundScreen("shell", s),
  "surround.bare": (s) => surroundScreen("bare", s),

  "private-event.today": (s) => privateEventScreen("today", s),
  "private-event.family": (s) => privateEventScreen("family", s),
  "private-event.same-page": (s) => privateEventScreen("same-page", s),

  "admin-404.today": (s) => admin404Screen("today", s),
  "admin-404.portal": (s) => admin404Screen("portal", s),
  "admin-404.redirect": (s) => admin404Screen("redirect", s),

  "global-crash.today": (s) => globalCrashScreen("today", s),
  "global-crash.home": (s) => globalCrashScreen("home", s),
  "global-crash.plain": (s) => globalCrashScreen("plain", s),
};

export function ErrorPagesBoard() {
  return <ExplorationBoard spec={ERROR_PAGES} previews={PREVIEWS} />;
}
